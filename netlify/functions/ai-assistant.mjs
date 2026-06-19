import { jsonResponse, handleOptions, parseBody } from './stripe-shared.mjs';
import { getServiceClient } from './admin-shared.mjs';
import {
  SITE_KNOWLEDGE,
  extractVisaPair,
  lookupVisaRequirement,
  fetchUserContext,
  buildContextPrompt,
} from './ai-context.mjs';

const SYSTEM_PROMPT = `You are Hydra, the AI travel companion for travelwithydra (travelwithydra.com).

PERSONALITY:
- Warm, confident, and knowledgeable — like a seasoned travel companion
- Concise: 2–4 sentences unless the user asks for detail
- Ask only ONE clarifying question when nationality or destination is missing
- Always prioritize LIVE CONTEXT and platform data over general knowledge
- Guide users to the right travelwithydra page with markdown links like [Visa Checker](/visa-checker)

${SITE_KNOWLEDGE}`;

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  );
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
}

function normalizeTier(tier) {
  const value = (tier || 'free').toLowerCase();
  if (value === 'enterprise' || value === 'business') return 'enterprise';
  if (value === 'premium' || value === 'monthly' || value === 'lifetime') return 'premium';
  return 'free';
}

function tierHasAccess(tier) {
  const normalized = normalizeTier(tier);
  return normalized === 'free' || normalized === 'premium' || normalized === 'enterprise';
}

function buildGeminiContents(history) {
  const contents = [];
  for (const msg of history) {
    if (msg.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.content }] });
    } else if (msg.role === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: msg.content }] });
    }
  }
  return contents;
}

function formatClientVisaLookup(lookup) {
  if (!lookup) return null;
  return {
    nationality: lookup.nationality,
    destination: lookup.destination,
    destinationCode: lookup.destination?.length === 2 ? lookup.destination : null,
    requirement: lookup.requirement,
    stayDuration: lookup.stayDuration,
    notes: lookup.notes,
    source: 'client-prefetch',
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return jsonResponse(500, { error: 'Gemini API key is not configured on the server' });
    }

    const {
      message,
      conversationHistory = [],
      subscriptionTier = 'free',
      accessToken = null,
      clientContext = null,
      hydraContext = null,
    } = parseBody(event);

    if (!tierHasAccess(subscriptionTier)) {
      return jsonResponse(403, {
        error: 'AI Assistant requires a Premium or Enterprise subscription. Upgrade at /pricing',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    if (!message || typeof message !== 'string') {
      return jsonResponse(400, { error: 'Message is required' });
    }

    let userContext = null;
    let visaLookup = formatClientVisaLookup(hydraContext?.visaLookup);

    try {
      userContext = await fetchUserContext(accessToken);
    } catch (e) {
      console.warn('User context unavailable:', e.message);
    }

    const defaultNat =
      userContext?.profile?.nationality || hydraContext?.profileNationality || null;

    if (!visaLookup) {
      const { nationality, destination } = extractVisaPair(message, defaultNat);
      if (nationality && destination) {
        try {
          const supabase = getServiceClient();
          visaLookup = await lookupVisaRequirement(supabase, nationality, destination);
          if (visaLookup) {
            visaLookup.destinationCode = destination;
          }
        } catch (e) {
          console.warn('Visa DB lookup skipped:', e.message);
        }
      }
    }

    const contextBlock = buildContextPrompt({
      userContext,
      clientContext:
        typeof clientContext === 'string'
          ? clientContext
          : clientContext
            ? JSON.stringify(clientContext)
            : null,
      visaLookup,
    });

    const systemInstruction = SYSTEM_PROMPT + contextBlock;

    const history = Array.isArray(conversationHistory) ? conversationHistory : [];
    const filtered = history.filter((m) => m.role === 'user' || m.role === 'assistant');

    const contents = buildGeminiContents(filtered);
    if (
      contents.length === 0 ||
      contents[contents.length - 1].role !== 'user' ||
      contents[contents.length - 1].parts[0].text !== message
    ) {
      contents.push({ role: 'user', parts: [{ text: message }] });
    }

    const model = getGeminiModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 768,
        },
      }),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', data);
      const errMsg = data?.error?.message || 'Failed to get response from Gemini';
      return jsonResponse(geminiResponse.status >= 500 ? 502 : 400, { error: errMsg });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .filter(Boolean)
        .join('') || '';

    if (!text) {
      return jsonResponse(502, { error: 'Empty response from Gemini' });
    }

    return jsonResponse(200, { response: text.trim() });
  } catch (error) {
    console.error('ai-assistant error:', error);
    return jsonResponse(500, {
      error: error.message || 'Failed to process AI request',
    });
  }
};
