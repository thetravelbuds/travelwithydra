/**
 * Generates public/sitemap.xml with keyword-rich eVisa URLs for every country.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { VISA_SEO_PAGES } from './seo-meta.mjs';
import { loadCountries, getVisaProductPath } from './visa-url-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const SITE_URL = 'https://travelwithydra.com';

const TOP_CODES = new Set(['ma', 'tr']);
const PRIORITY_CODES = new Set(VISA_SEO_PAGES.map((p) => p.code));

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/visa/browse', priority: '0.9', changefreq: 'weekly' },
  { path: '/visa-checker', priority: '0.85', changefreq: 'weekly' },
  { path: '/features', priority: '0.6', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.4', changefreq: 'yearly' },
  { path: '/blogs', priority: '0.6', changefreq: 'weekly' },
];

const today = new Date().toISOString().split('T')[0];

function urlEntry(path, priority, changefreq) {
  return `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const seen = new Set();
const entries = [];

function push(path, priority, changefreq) {
  if (seen.has(path)) return;
  seen.add(path);
  entries.push(urlEntry(path, priority, changefreq));
}

for (const p of STATIC_PAGES) push(p.path, p.priority, p.changefreq);

const countries = loadCountries();
const sorted = [...countries].sort((a, b) => {
  const score = (c) => (TOP_CODES.has(c.code) ? 0 : PRIORITY_CODES.has(c.code) ? 1 : 2);
  return score(a) - score(b) || a.name.localeCompare(b.name);
});

for (const country of sorted) {
  const path = getVisaProductPath(country.code, country.name);
  if (TOP_CODES.has(country.code)) push(path, '1.0', 'daily');
  else if (PRIORITY_CODES.has(country.code)) push(path, '0.95', 'weekly');
  else push(path, '0.7', 'monthly');
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

const outDir = join(root, 'public');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'sitemap.xml'), xml, 'utf8');
console.log(`Sitemap written with ${entries.length} URLs → public/sitemap.xml`);
