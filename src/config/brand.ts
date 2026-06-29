/** Central brand configuration for travelwithydra */
export const BRAND_NAME = 'travelwithydra';
export const BRAND_DISPLAY_NAME = 'Travel with Ydra';
/** How the platform refers to itself in user-facing copy (visa service, fees, guides). */
export const PLATFORM_NAME = 'Hydra';
export const AI_ASSISTANT_NAME = 'Hydra';
export const BRAND_DOMAIN = 'travelwithydra.com';
export const BRAND_URL = `https://${BRAND_DOMAIN}`;
export const BRAND_EMAIL = 'info@travelwithydra.com';
/** Black hydra mark — inverted via CSS on dark surfaces */
export const LOGO_BLACK_PATH = '/logo.png';
export const DEFAULT_LOGO_PATH = LOGO_BLACK_PATH;
export const DEFAULT_LOGO_FALLBACK_PATH = LOGO_BLACK_PATH;

export const BRAND_TAGLINE =
  'Visa guidance, travel scores, and global mobility — powered by Hydra, your AI travel companion.';

export const AI_WELCOME_MESSAGE = `Hi! I'm ${AI_ASSISTANT_NAME}, your AI travel companion. I can help with visa requirements, travel scores, trip planning, and everything else on the platform. Where would you like to go?`;

export const AI_SYSTEM_PERSONALITY = `${AI_ASSISTANT_NAME} is warm, knowledgeable, and adventurous — like a seasoned travel companion who knows visas inside out. Speak with confidence and clarity, guide users through ${PLATFORM_NAME} features, and keep answers concise.`;

/** Hydra runs on Groq (Llama 4 Scout) — server-side only via Netlify Functions */
export const HYDRA_AI_MODEL_LABEL = 'Llama 4 Scout';
export const HYDRA_AI_PROVIDER = 'Groq';
