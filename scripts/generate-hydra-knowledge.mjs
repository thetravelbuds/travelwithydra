/**
 * Compiles Hydra AI knowledge from website content configs into a Netlify function module.
 * Run: npm run generate-hydra-knowledge (also runs during npm run build)
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const configDir = join(root, 'src', 'config');
const knowledgeDir = join(root, 'src', 'knowledge');
const outPath = join(root, 'netlify', 'functions', 'lib', 'hydra-knowledge.mjs');

const VISA_CONTENT_FILES = [
  { file: 'turkeyEvisaContent.ts', label: 'Turkey eVisa', route: '/visa/tr', code: 'TR' },
  { file: 'egyptEvisaContent.ts', label: 'Egypt eVisa', route: '/visa/eg', code: 'EG' },
  { file: 'moroccoEvisaContent.ts', label: 'Morocco eVisa', route: '/visa/ma', code: 'MA' },
  { file: 'ukVisaContent.ts', label: 'UK Visitor Visa', route: '/visa/gb', code: 'GB' },
  { file: 'schengenVisaContent.ts', label: 'Schengen Visa', route: '/visa/eu', code: 'EU' },
  { file: 'usaVisaContent.ts', label: 'US Visa (B1/B2)', route: '/visa/us', code: 'US' },
  { file: 'canadaVisaContent.ts', label: 'Canada Visitor Visa / eTA', route: '/visa/ca', code: 'CA' },
  { file: 'australiaVisaContent.ts', label: 'Australia Visitor Visa', route: '/visa/au', code: 'AU' },
  { file: 'newZealandVisaContent.ts', label: 'New Zealand Visitor Visa', route: '/visa/nz', code: 'NZ' },
];

function readJson(name) {
  const path = join(knowledgeDir, name);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function extractQuickFacts(source) {
  const match = source.match(
    /export const \w+_(?:EVISA_)?QUICK_FACTS\s*=\s*\{([\s\S]*?)\}\s*as const/
  );
  if (!match) return null;
  const block = match[1];
  const facts = [];
  const lineRe = /^\s*(\w+):\s*['"`]([^'"`]+)['"`]/gm;
  let m;
  while ((m = lineRe.exec(block)) !== null) {
    const key = m[1].replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    facts.push(`${key}: ${m[2]}`);
  }
  return facts.length ? facts.join('; ') : null;
}

function extractFaqs(source, limit = 12) {
  const faqs = [];
  const re = /question:\s*['"`]([^'"`]+)['"`]\s*,\s*answer:\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(source)) !== null && faqs.length < limit) {
    faqs.push({ question: m[1], answer: m[2] });
  }
  return faqs;
}

function extractApplicationSteps(source, limit = 6) {
  const steps = [];
  const re = /title:\s*['"`]([^'"`]+)['"`]\s*,\s*description:\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(source)) !== null && steps.length < limit) {
    if (steps.some((s) => s.title === m[1])) continue;
    steps.push({ title: m[1], description: m[2] });
  }
  return steps;
}

function extractBlogs(source, limit = 40) {
  const blogs = [];
  const blocks = source.split(/\n\s*\{/).slice(1);
  for (const block of blocks) {
    if (blogs.length >= limit) break;
    const id = block.match(/id:\s*['"`]([^'"`]+)['"`]/)?.[1];
    const title = block.match(/title:\s*['"`]([^'"`]+)['"`]/)?.[1];
    const excerpt = block.match(/excerpt:\s*['"`]([^'"`]+)['"`]/)?.[1];
    const category = block.match(/category:\s*['"`]([^'"`]+)['"`]/)?.[1];
    const country = block.match(/name:\s*['"`]([^'"`]+)['"`]/)?.[1];
    if (title && excerpt) {
      blogs.push({ id, title, excerpt, category, country });
    }
  }
  return blogs;
}

function formatTravelAgentKnowledge(data) {
  const lines = [`## ${data.title}`];
  for (const topic of data.topics) {
    lines.push(`\n### ${topic.title}`);
    for (const point of topic.content) {
      lines.push(`- ${point}`);
    }
  }
  return lines.join('\n');
}

function formatPlatformFaq(data) {
  const lines = [`## ${data.title}`];
  for (const item of data.items) {
    lines.push(`Q: ${item.question}\nA: ${item.answer}`);
  }
  return lines.join('\n\n');
}

function formatVisaGuides(guides) {
  const lines = ['## Destination visa guides (from travelwithydra.com)'];
  for (const g of guides) {
    lines.push(`\n### ${g.label} (${g.code}) — ${g.route}`);
    if (g.quickFacts) lines.push(`Quick facts: ${g.quickFacts}`);
    if (g.steps.length) {
      lines.push('Application steps:');
      g.steps.forEach((s, i) => lines.push(`  ${i + 1}. ${s.title}: ${s.description}`));
    }
    if (g.faqs.length) {
      lines.push('Common FAQs:');
      for (const f of g.faqs.slice(0, 8)) {
        lines.push(`  Q: ${f.question} A: ${f.answer}`);
      }
    }
  }
  return lines.join('\n');
}

function formatBlogs(blogs) {
  const lines = ['## Travel blogs on travelwithydra.com (/blogs)'];
  for (const b of blogs) {
    const loc = b.country ? ` (${b.country})` : '';
    lines.push(`- [${b.title}]${loc} — ${b.excerpt} Category: ${b.category || 'General'}.`);
  }
  return lines.join('\n');
}

function buildKnowledge() {
  const travelAgent = readJson('travel-agent-basics.json');
  const platformFaq = readJson('platform-faq.json');

  const visaGuides = VISA_CONTENT_FILES.map(({ file, label, route, code }) => {
    const source = readFileSync(join(configDir, file), 'utf8');
    return {
      label,
      route,
      code,
      quickFacts: extractQuickFacts(source),
      steps: extractApplicationSteps(source),
      faqs: extractFaqs(source),
    };
  });

  const blogsSource = readFileSync(join(root, 'src', 'data', 'blogs-data.ts'), 'utf8');
  const blogs = extractBlogs(blogsSource);

  const sections = [
    formatTravelAgentKnowledge(travelAgent),
    formatPlatformFaq(platformFaq),
    formatVisaGuides(visaGuides),
    formatBlogs(blogs),
  ];

  return sections.join('\n\n');
}

const knowledge = buildKnowledge();
const generatedAt = new Date().toISOString();

const output = `/** AUTO-GENERATED by scripts/generate-hydra-knowledge.mjs — do not edit manually */
/** Generated at: ${generatedAt} */

export const HYDRA_KNOWLEDGE_GENERATED_AT = ${JSON.stringify(generatedAt)};

export const HYDRA_KNOWLEDGE = ${JSON.stringify(knowledge)};
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, output, 'utf8');
console.log(`Hydra knowledge written → ${outPath} (${knowledge.length} chars)`);
