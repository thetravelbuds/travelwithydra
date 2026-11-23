/**
 * Post-Vite build: emit per-route HTML shells with unique title/description/canonical
 * and crawlable noscript content so Google does not see every URL as the homepage.
 *
 * Usage: node scripts/generate-seo-html.mjs
 * (runs automatically after `vite build` via npm run build)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  SITE_URL,
  SITE_NAME,
  BRAND_DISPLAY,
  DEFAULT_SEO,
  VISA_SEO_PAGES,
  STATIC_SEO_PAGES,
} from './seo-meta.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distIndex = join(root, 'dist', 'index.html');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildJsonLd(page) {
  const blocks = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.h1 || page.title,
      description: page.description,
      url: `${SITE_URL}${page.path}`,
      isPartOf: {
        '@type': 'WebSite',
        name: BRAND_DISPLAY,
        url: SITE_URL,
      },
    },
  ];

  if (page.code && page.name) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `${page.name} eVisa Application`,
      description: page.description,
      url: `${SITE_URL}${page.path}`,
      provider: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
      areaServed: { '@type': 'Country', name: page.name },
      serviceType: 'Electronic visa application',
    });

    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'eVisa Destinations',
          item: `${SITE_URL}/visa/browse`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `${page.name} eVisa`,
          item: `${SITE_URL}${page.path}`,
        },
      ],
    });
  }

  if (page.faqs?.length) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    });

    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to apply for a ${page.name} eVisa online`,
      description: page.intro || page.description,
      step: [
        {
          '@type': 'HowToStep',
          name: 'Check eligibility',
          text: `Confirm whether your nationality needs a ${page.name} eVisa.`,
        },
        {
          '@type': 'HowToStep',
          name: 'Complete the online application',
          text: 'Enter passport details, upload documents, and pay securely.',
        },
        {
          '@type': 'HowToStep',
          name: 'Receive your eVisa by email',
          text: 'Download and print your approved eVisa before travel.',
        },
      ],
    });
  }

  return blocks;
}

function buildNoscript(page) {
  const faqHtml = (page.faqs || [])
    .map(
      (faq) =>
        `<h3>${escapeHtml(faq.q)}</h3><p>${escapeHtml(faq.a)}</p>`
    )
    .join('\n');

  return `<noscript>
  <main>
    <h1>${escapeHtml(page.h1 || page.title)}</h1>
    <p>${escapeHtml(page.intro || page.description)}</p>
    <p><a href="${SITE_URL}${page.path}">Continue to ${escapeHtml(page.h1 || page.title)}</a></p>
    ${faqHtml ? `<section><h2>Frequently asked questions</h2>${faqHtml}</section>` : ''}
    <p>Popular destinations:
      <a href="${SITE_URL}/visa/ma">Morocco eVisa</a> ·
      <a href="${SITE_URL}/visa/tr">Turkey eVisa</a> ·
      <a href="${SITE_URL}/visa/browse">All eVisas</a>
    </p>
  </main>
</noscript>`;
}

function injectSeo(html, page) {
  const canonical = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
  const robots = page.noindex ? 'noindex, follow' : 'index, follow';
  const jsonLd = JSON.stringify(buildJsonLd(page));
  const noscript = buildNoscript(page);

  let out = html;

  // Title
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);

  // Description
  if (/name="description"/i.test(out)) {
    out = out.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(page.description)}" />`
    );
  } else {
    out = out.replace(
      /<\/title>/i,
      `</title>\n    <meta name="description" content="${escapeHtml(page.description)}" />`
    );
  }

  // Keywords
  if (page.keywords) {
    if (/name="keywords"/i.test(out)) {
      out = out.replace(
        /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i,
        `<meta name="keywords" content="${escapeHtml(page.keywords)}" />`
      );
    } else {
      out = out.replace(
        /<meta name="description"[^>]*>/i,
        (m) =>
          `${m}\n    <meta name="keywords" content="${escapeHtml(page.keywords)}" />`
      );
    }
  }

  // Canonical
  if (/rel="canonical"/i.test(out)) {
    out = out.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${canonical}" />`
    );
  } else {
    out = out.replace(
      /<\/title>/i,
      `</title>\n    <link rel="canonical" href="${canonical}" />`
    );
  }

  // Robots
  if (/name="robots"/i.test(out)) {
    out = out.replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="${robots}" />`
    );
  } else {
    out = out.replace(
      /<link rel="canonical"[^>]*>/i,
      (m) => `${m}\n    <meta name="robots" content="${robots}" />`
    );
  }

  // Open Graph / Twitter — upsert by replacing existing or inserting before </head>
  const socialTags = `
    <meta property="og:site_name" content="${escapeHtml(BRAND_DISPLAY)}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <script type="application/ld+json">${jsonLd}</script>`;

  // Strip previous og/twitter/json-ld we may re-inject to avoid duplicates on rebuild of index
  out = out.replace(/\s*<meta property="og:[^"]+" content="[^"]*"\s*\/?>/gi, '');
  out = out.replace(/\s*<meta name="twitter:[^"]+" content="[^"]*"\s*\/?>/gi, '');
  out = out.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');

  out = out.replace(/<\/head>/i, `${socialTags}\n  </head>`);

  // Crawlable fallback content for bots that do not execute JS
  if (!/<noscript>/i.test(out)) {
    out = out.replace(/<div id="root"><\/div>/i, `<div id="root"></div>\n    ${noscript}`);
  } else {
    out = out.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscript);
  }

  return out;
}

function writePage(relativePath, html) {
  const clean = relativePath.replace(/\/$/, '') || '';
  const outPath =
    clean === '' || clean === '/'
      ? join(root, 'dist', 'index.html')
      : join(root, 'dist', clean.replace(/^\//, ''), 'index.html');

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  return outPath;
}

if (!existsSync(distIndex)) {
  console.error('dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const baseHtml = readFileSync(distIndex, 'utf8');

const pages = [
  { ...DEFAULT_SEO, h1: 'Apply for eVisas Online with Hydra', intro: DEFAULT_SEO.description, faqs: [] },
  ...VISA_SEO_PAGES,
  ...STATIC_SEO_PAGES.map((p) => ({
    ...p,
    h1: p.title.split('|')[0].trim(),
    intro: p.description,
    faqs: [],
  })),
];

const written = [];
for (const page of pages) {
  const html = injectSeo(baseHtml, page);
  written.push(writePage(page.path, html));
}

console.log(`SEO HTML shells written (${written.length}):`);
for (const file of written) {
  console.log(`  · ${file.replace(root + '/', '')}`);
}
