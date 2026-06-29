import authService from './auth';

const API_BASE = '/.netlify/functions';

export async function adminPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { session } = await authService.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('You must be signed in as admin.');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      'Could not reach the admin API. Start the app with `npm run dev` (includes Netlify functions) or use production.'
    );
  }

  const text = await response.text();
  if (!text.trim()) {
    throw new Error(
      'Admin API returned an empty response. On localhost, run `npm run dev` so Netlify functions start on port 9999 (proxied through Vite).'
    );
  }

  let data: { error?: string };
  try {
    data = JSON.parse(text) as { error?: string };
  } catch {
    throw new Error(
      'Admin API returned an invalid response. If you use `npx vite` alone, admin features will not work — use `npm run dev` instead.'
    );
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data as T;
}
