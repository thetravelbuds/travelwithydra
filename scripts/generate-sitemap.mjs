/**
 * Generates public/sitemap.xml with priority eVisa pages first.
 * Run before vite build: npm run generate-sitemap
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const SITE_URL = 'https://travelwithydra.com';

const PRIORITY_EVISA = [
  'ma', 'tr', 'my', 'id', 'eg', 'ae', 'vn', 'ke', 'lk', 'sa', 'in', 'au',
];

const OTHER_EVISA = [
  'dz', 'az', 'bh', 'bj', 'bt', 'br', 'kh', 'cm', 'cl', 'cn', 'cu', 'et',
  'ga', 'ge', 'gh', 'gn', 'hk', 'jo', 'la', 'mg', 'mn', 'nz', 'ng', 'pg',
  'ph', 'ru', 'kr', 'tj', 'tz', 'tg', 'ug', 'gb', 'us', 'uy', 'uz', 'zm',
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

const entries = [
  ...STATIC_PAGES.map((p) => urlEntry(p.path, p.priority, p.changefreq)),
  ...PRIORITY_EVISA.map((code) => urlEntry(`/visa/${code}`, '0.95', 'weekly')),
  ...OTHER_EVISA.filter((c) => !PRIORITY_EVISA.includes(c)).map((code) =>
    urlEntry(`/visa/${code}`, '0.7', 'monthly')
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

const outDir = join(root, 'public');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'sitemap.xml'), xml, 'utf8');
console.log(`Sitemap written with ${entries.length} URLs → public/sitemap.xml`);
