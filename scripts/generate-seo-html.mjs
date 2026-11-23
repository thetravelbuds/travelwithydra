/**
 * Post-Vite build: emit per-route HTML shells + Netlify _redirects so every
 * destination has a keyword-rich crawlable URL (not homepage meta).
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
  LEGACY_REDIRECTS,
} from './seo-meta.mjs';
import {
  loadCountries,
  getVisaProductPath,
  getVisaSlug,
  RESERVED_VISA_SEGMENTS,
} from './visa-url-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distIndex = join(root, 'dist', 'index.html');
const OG_IMAGE = `${SITE_URL}/logo.png`;

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
      isPartOf: { '@type': 'WebSite', name: BRAND_DISPLAY, url: SITE_URL },
      primaryImageOfPage: { '@type': 'ImageObject', url: OG_IMAGE },
    },
  ];

  if (page.code && page.name) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `${page.name} eVisa Application`,
      description: page.description,
      url: `${SITE_URL}${page.path}`,
      provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: OG_IMAGE },
      areaServed: { '@type': 'Country', name: page.name },
      serviceType: 'Electronic visa application',
    });
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'eVisa Destinations', item: `${SITE_URL}/visa/browse` },
        { '@type': 'ListItem', position: 3, name: `${page.name} eVisa`, item: `${SITE_URL}${page.path}` },
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
        { '@type': 'HowToStep', name: 'Check eligibility', text: `Confirm whether your nationality needs a ${page.name} eVisa.` },
        { '@type': 'HowToStep', name: 'Complete the online application', text: 'Enter passport details, upload documents, and pay securely.' },
        { '@type': 'HowToStep', name: 'Receive your eVisa by email', text: 'Download and print your approved eVisa before travel.' },
      ],
    });
  }

  return blocks;
}

function buildNoscript(page) {
  const faqHtml = (page.faqs || [])
    .map((faq) => `<h3>${escapeHtml(faq.q)}</h3><p>${escapeHtml(faq.a)}</p>`)
    .join('\n');

  return `<noscript>
  <main>
    <nav aria-label="Breadcrumb">
      <a href="${SITE_URL}/">Home</a> /
      <a href="${SITE_URL}/visa/browse">eVisa Destinations</a> /
      <span>${escapeHtml(page.h1 || page.title)}</span>
    </nav>
    <h1>${escapeHtml(page.h1 || page.title)}</h1>
    <p>${escapeHtml(page.intro || page.description)}</p>
    <p><a href="${SITE_URL}${page.path}">Continue to ${escapeHtml(page.h1 || page.title)}</a></p>
    ${faqHtml ? `<section><h2>Frequently asked questions</h2>${faqHtml}</section>` : ''}
    <p>Popular destinations:
      <a href="${SITE_URL}/visa/morocco-evisa">Morocco eVisa</a> ·
      <a href="${SITE_URL}/visa/turkey-evisa">Turkey eVisa</a> ·
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
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);

  if (/name="description"/i.test(out)) {
    out = out.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(page.description)}" />`
    );
  } else {
    out = out.replace(/<\/title>/i, `</title>\n    <meta name="description" content="${escapeHtml(page.description)}" />`);
  }

  if (page.keywords) {
    if (/name="keywords"/i.test(out)) {
      out = out.replace(
        /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i,
        `<meta name="keywords" content="${escapeHtml(page.keywords)}" />`
      );
    } else {
      out = out.replace(/<meta name="description"[^>]*>/i, (m) => `${m}\n    <meta name="keywords" content="${escapeHtml(page.keywords)}" />`);
    }
  }

  if (/rel="canonical"/i.test(out)) {
    out = out.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonical}" />`);
  } else {
    out = out.replace(/<\/title>/i, `</title>\n    <link rel="canonical" href="${canonical}" />`);
  }

  if (/name="robots"/i.test(out)) {
    out = out.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, `<meta name="robots" content="${robots}" />`);
  } else {
    out = out.replace(/<link rel="canonical"[^>]*>/i, (m) => `${m}\n    <meta name="robots" content="${robots}" />`);
  }

  const socialTags = `
    <meta property="og:site_name" content="${escapeHtml(BRAND_DISPLAY)}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <script type="application/ld+json">${jsonLd}</script>`;

  out = out.replace(/\s*<meta property="og:[^"]+" content="[^"]*"\s*\/?>/gi, '');
  out = out.replace(/\s*<meta name="twitter:[^"]+" content="[^"]*"\s*\/?>/gi, '');
  out = out.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<\/head>/i, `${socialTags}\n  </head>`);

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

function buildCountryPage(country, richByCode) {
  const rich = richByCode.get(country.code);
  if (rich) return rich;

  const path = getVisaProductPath(country.code, country.name);
  const name = country.name;
  return {
    code: country.code,
    name,
    path,
    title: `${name} eVisa Application Online | Apply for ${name} Visa — Hydra`,
    description: `Apply for your ${name} eVisa or visa online with Hydra. Check ${name} visa requirements, fees, processing time, and required documents — then apply with guided support.`,
    keywords: `${name.toLowerCase()} evisa, ${name.toLowerCase()} visa online, apply ${name.toLowerCase()} evisa, ${name.toLowerCase()} tourist visa`,
    h1: `${name} eVisa Application Online`,
    intro: `Apply for a ${name} eVisa or travel visa online with Hydra. Review requirements, fees, and documents, then complete a guided application.`,
    faqs: [],
  };
}

function writeRedirects(countries) {
  const lines = [
    '# Generated by scripts/generate-seo-html.mjs — do not edit by hand',
    '# ISO short codes and legacy paths → keyword-rich canonicals',
  ];

  for (const rule of LEGACY_REDIRECTS) {
    lines.push(`${rule.from}  ${rule.to}  301`);
  }

  for (const country of countries) {
    if (RESERVED_VISA_SEGMENTS.has(country.code)) continue;
    const slugPath = getVisaProductPath(country.code, country.name);
    const codePath = `/visa/${country.code}`;
    if (codePath === slugPath) continue;
    // Avoid duplicating LEGACY_REDIRECTS
    if (!LEGACY_REDIRECTS.some((r) => r.from === codePath || r.from === `${codePath}/`)) {
      lines.push(`${codePath}  ${slugPath}  301`);
      lines.push(`${codePath}/  ${slugPath}  301`);
    }
  }

  // SPA fallback last
  lines.push('/*  /index.html  200');

  const out = join(root, 'dist', '_redirects');
  writeFileSync(out, `${lines.join('\n')}\n`, 'utf8');
  return { file: out, count: lines.length };
}

if (!existsSync(distIndex)) {
  console.error('dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const baseHtml = readFileSync(distIndex, 'utf8');
const countries = loadCountries();
const richByCode = new Map(VISA_SEO_PAGES.map((p) => [p.code, p]));

const pages = [
  { ...DEFAULT_SEO, h1: 'Apply for eVisas Online with Hydra', intro: DEFAULT_SEO.description, faqs: [] },
  ...STATIC_SEO_PAGES.map((p) => ({
    ...p,
    h1: p.title.split('|')[0].trim(),
    intro: p.description,
    faqs: [],
  })),
  ...countries.map((c) => buildCountryPage(c, richByCode)),
];

// Dedupe by path (rich pages win)
const byPath = new Map();
for (const page of pages) {
  if (!byPath.has(page.path)) byPath.set(page.path, page);
}

const written = [];
for (const page of byPath.values()) {
  written.push(writePage(page.path, injectSeo(baseHtml, page)));
}

const redirects = writeRedirects(countries);

console.log(`SEO HTML shells written: ${written.length}`);
console.log(`  Morocco: dist/visa/${getVisaSlug('ma', 'Morocco')}/index.html`);
console.log(`  Turkey:  dist/visa/${getVisaSlug('tr', 'Turkey')}/index.html`);
console.log(`Redirects: ${redirects.file.replace(root + '/', '')} (${redirects.count} lines)`);
