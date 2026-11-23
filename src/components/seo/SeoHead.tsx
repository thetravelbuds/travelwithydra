import React, { useEffect } from 'react';
import { DEFAULT_SEO, SITE_NAME, SITE_URL, absoluteUrl, type PageSeo } from '../../config/seo';

const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export interface SeoHeadProps extends Partial<PageSeo> {
  /** JSON-LD object(s) injected as application/ld+json */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  ogImage?: string;
}

const SeoHead: React.FC<SeoHeadProps> = ({
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  keywords,
  canonicalPath,
  noindex = false,
  jsonLd,
  ogImage = DEFAULT_OG_IMAGE,
}) => {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    document.title = title;

    upsertMeta('name', 'description', description);
    if (keywords) upsertMeta('name', 'keywords', keywords);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    const canonical = canonicalPath ? absoluteUrl(canonicalPath) : absoluteUrl(window.location.pathname);
    upsertLink('canonical', canonical);

    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:image', ogImage);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);

    const scriptId = 'seo-json-ld';
    document.getElementById(scriptId)?.remove();
    if (jsonLdKey) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = jsonLdKey;
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [title, description, keywords, canonicalPath, noindex, jsonLdKey, ogImage]);

  return null;
};

export default SeoHead;
