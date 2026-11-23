/**
 * Generates public/sitemap.xml with keyword-rich eVisa URLs first.
 * Run before vite build: npm run generate-sitemap
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { VISA_SEO_PAGES } from './seo-meta.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const SITE_URL = 'https://travelwithydra.com';

/** Morocco & Turkey first — highest commercial intent (keyword slugs). */
const TOP_EVISA_PATHS = ['/visa/morocco-evisa', '/visa/turkey-evisa'];

const PRIORITY_FROM_SEO = VISA_SEO_PAGES.map((p) => p.path);

const OTHER_EVISA_SLUGS = [
  '/visa/kenya-evisa',
  '/visa/sri-lanka-eta',
  '/visa/saudi-arabia-evisa',
  '/visa/uk-visitor-visa',
  '/visa/us-visitor-visa',
  '/visa/canada-visitor-visa',
  '/visa/australia-visa',
  '/visa/new-zealand-visa',
  '/visa/france-schengen-visa',
  '/visa/greece-schengen-visa',
  '/visa/italy-schengen-visa',
  '/visa/spain-schengen-visa',
  '/visa/germany-schengen-visa',
];

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/visa/browse', priority: '0.9', changefreq: 'weekly' },
  { path: '/visa-checker', priority: '0.8', changefreq: 'monthly' },
  { path: '/features', priority: '0.7', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'yearly' },
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
for (const path of TOP_EVISA_PATHS) push(path, '1.0', 'daily');
for (const path of PRIORITY_FROM_SEO) {
  if (!TOP_EVISA_PATHS.includes(path)) push(path, '0.95', 'weekly');
}
for (const path of OTHER_EVISA_SLUGS) push(path, '0.85', 'weekly');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

const outDir = join(root, 'public');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'sitemap.xml'), xml, 'utf8');
console.log(`Sitemap written with ${entries.length} URLs → public/sitemap.xml`);
