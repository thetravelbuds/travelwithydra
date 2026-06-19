export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface HydraRequestContext {
  accessToken?: string | null;
  clientContext?: string;
  hydraContext?: {
    currentPath?: string;
    visaLookup?: {
      nationality: string;
      destination: string;
      requirement: string;
      stayDuration?: number;
      notes?: string;
    };
    profileNationality?: string;
  };
}

const API_BASE = '/.netlify/functions';

export async function handleAIAssistantRequest(
  message: string,
  conversationHistory: AiMessage[] = [],
  subscriptionTier = 'free',
  context: HydraRequestContext = {}
): Promise<{ response: string }> {
  const response = await fetch(`${API_BASE}/ai-assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversationHistory: conversationHistory.filter(
        (m) => m.role === 'user' || m.role === 'assistant'
      ),
      subscriptionTier,
      accessToken: context.accessToken ?? null,
      clientContext: context.clientContext ?? null,
      hydraContext: context.hydraContext ?? null,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.code === 'SUBSCRIPTION_REQUIRED') {
      throw new Error(
        'AI Assistant is temporarily unavailable. Please try again or contact support.'
      );
    }
    throw new Error(data.error || `AI request failed (${response.status})`);
  }

  if (!data.response) {
    throw new Error('Invalid response from AI service');
  }

  return { response: data.response };
}
