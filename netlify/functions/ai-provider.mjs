/**
 * Groq OpenAI-compatible chat completions for Hydra (Llama 4 Scout).
 */

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const HYDRA_DEFAULT_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export function getGroqConfig() {
  return {
    apiKey: process.env.GROQ_API_KEY || '',
    model:
      process.env.GROQ_MODEL ||
      process.env.HYDRA_AI_MODEL ||
      HYDRA_DEFAULT_MODEL,
  };
}

export function buildChatMessages(conversationHistory, userMessage) {
  const messages = [];
  const history = Array.isArray(conversationHistory) ? conversationHistory : [];

  for (const msg of history) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: String(msg.content || '') });
    }
  }

  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user' || last.content !== userMessage) {
    messages.push({ role: 'user', content: userMessage });
  }

  return messages;
}

/**
 * @param {object} params
 * @param {string} params.systemPrompt
 * @param {Array<{role: string, content: string}>} params.messages
 * @param {number} [params.temperature]
 * @param {number} [params.maxTokens]
 */
export async function completeWithGroq({
  systemPrompt,
  messages,
  temperature = 0.4,
  maxTokens = 1024,
}) {
  const { apiKey, model } = getGroqConfig();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured on the server');
  }

  const response = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.error?.message || `Groq API error (${response.status})`;
    const err = new Error(errMsg);
    err.status = response.status;
    throw err;
  }

  const text = data?.choices?.[0]?.message?.content?.trim() || '';
  if (!text) {
    throw new Error('Empty response from Groq');
  }

  return { text, model };
}
