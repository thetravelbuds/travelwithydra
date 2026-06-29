import { PLATFORM_NAME } from '../config/brand';

export type NationalityApplicationMode = 'all' | 'allowlist' | 'blocklist';

export interface SiteSettings {
  logoUrl: string | null;
  nationalityApplicationMode: NationalityApplicationMode;
  nationalityCodes: string[];
  customBlogs: AdminBlogRecord[];
  hiddenBlogIds: string[];
}

export interface AdminBlogRecord {
  id: string;
  title: string;
  subtitle: string;
  content: string[];
  author: string;
  country_code: string;
  date?: string;
  read_time?: string;
  image_url: string;
  is_published: boolean;
  source?: 'custom';
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  logoUrl: null,
  nationalityApplicationMode: 'all',
  nationalityCodes: [],
  customBlogs: [],
  hiddenBlogIds: [],
};

export const NATIONALITY_UNAVAILABLE_MESSAGE =
  `We are working hard to include all countries under the ${PLATFORM_NAME} umbrella. Visa application services are currently unavailable for your nationality on this destination. You can still use other ${PLATFORM_NAME} features based on your subscription tier.`;
