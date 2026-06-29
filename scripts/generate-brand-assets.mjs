import sharp from 'sharp';
import { join } from 'path';

const publicDir = join(process.cwd(), 'public');
const logoPath = join(publicDir, 'logo.png');

const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon.png', size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(logoPath)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(join(publicDir, name));
  console.log(`Wrote ${name}`);
}

console.log('Favicons generated from logo.png');
