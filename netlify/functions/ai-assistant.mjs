import { jsonResponse, handleOptions, parseBody } from './stripe-shared.mjs';
import { getServiceClient } from './admin-shared.mjs';
import {
  FULL_HYDRA_KNOWLEDGE,
  extractVisaPair,
  lookupVisaRequirement,
  fetchUserContext,
  buildContextPrompt,
} from './ai-context.mjs';
import {
  buildChatMessages,
  completeWithGroq,
  getGroqConfig,
  HYDRA_DEFAULT_MODEL,
} from './ai-provider.mjs';

const SYSTEM_PROMPT = `You are Hydra, the AI travel companion for Travel with Ydra (travelwithydra.com).

MODEL: You run on Meta Llama 4 Scout via Groq — fast, knowledgeable travel assistance.

PERSONALITY:
- Warm, confident, and knowledgeable — like a seasoned travel agent and visa specialist
- Concise: 2–4 sentences unless the user asks for detail
- Ask only ONE clarifying question when nationality or destination is missing
- Always prioritize LIVE CONTEXT and platform data over general knowledge
- Guide users to the right Hydra page with markdown links like [Visa Checker](/visa-checker)
- For complex legal immigration cases, recommend official embassy sources or info@travelwithydra.com

${FULL_HYDRA_KNOWLEDGE}`;

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

const AI_DAILY_LIMITS = {
  free: 25,
  premium: 25,
  enterprise: Infinity,
};

async function checkAndIncrementAiUsage(supabase, userId, tier) {
  const normalized = normalizeTier(tier);
  const limit = AI_DAILY_LIMITS[normalized] ?? 25;
  if (!Number.isFinite(limit)) return null;

  const usageDate = new Date().toISOString().slice(0, 10);
  const { data: row, error: readError } = await supabase
    .from('ai_daily_usage')
    .select('message_count')
    .eq('user_id', userId)
    .eq('usage_date', usageDate)
    .maybeSingle();

  if (readError && readError.code !== 'PGRST205' && readError.code !== '42P01') {
    console.warn('AI usage read failed:', readError.message);
    return null;
  }

  const count = row?.message_count ?? 0;
  if (count >= limit) {
    return `Daily AI limit reached (${limit} messages). Enterprise members get unlimited access.`;
  }

  if (row) {
    await supabase
      .from('ai_daily_usage')
      .update({ message_count: count + 1 })
      .eq('user_id', userId)
      .eq('usage_date', usageDate);
  } else {
    await supabase.from('ai_daily_usage').insert({
      user_id: userId,
      usage_date: usageDate,
      message_count: 1,
    });
  }

  return null;
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
    const { apiKey, model } = getGroqConfig();
    if (!apiKey) {
      return jsonResponse(500, {
        error: 'GROQ_API_KEY is not configured on the server. Add it in Netlify environment variables.',
      });
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

    if (userContext?.user?.id) {
      const tier = userContext?.profile?.subscription_tier || subscriptionTier;
      try {
        const supabase = getServiceClient();
        const limitError = await checkAndIncrementAiUsage(supabase, userContext.user.id, tier);
        if (limitError) {
          return jsonResponse(429, { error: limitError, code: 'AI_DAILY_LIMIT' });
        }
      } catch (usageError) {
        console.warn('AI usage tracking skipped:', usageError.message);
      }
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
    const chatMessages = buildChatMessages(filtered, message);

    const { text, model: usedModel } = await completeWithGroq({
      systemPrompt: systemInstruction,
      messages: chatMessages,
      temperature: 0.4,
      maxTokens: 1024,
    });

    return jsonResponse(200, {
      response: text,
      model: usedModel || model || HYDRA_DEFAULT_MODEL,
    });
  } catch (error) {
    console.error('ai-assistant error:', error);
    const status = error.status >= 400 && error.status < 600 ? error.status : 500;
    return jsonResponse(status >= 500 ? 502 : status, {
      error: error.message || 'Failed to process AI request',
    });
  }
};
