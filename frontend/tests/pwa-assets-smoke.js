import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const distDir = path.join(root, 'dist');

const requiredPublicAssets = [
  'favicon.ico',
  'apple-touch-icon.png',
  'mask-icon.svg',
  'icon-192.png',
  'icon-512.png',
];

const requiredDistAssets = [
  'manifest.webmanifest',
  'sw.js',
];

function assertFile(filePath) {
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });
  if (!stat || stat.size <= 0) {
    throw new Error(`Missing or empty asset: ${filePath}`);
  }
}

for (const asset of requiredPublicAssets) {
  assertFile(path.join(publicDir, asset));
}

for (const asset of requiredDistAssets) {
  assertFile(path.join(distDir, asset));
}

const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.webmanifest'), 'utf8'));
const icons = manifest.icons || [];
for (const src of ['icon-192.png', 'icon-512.png']) {
  if (!icons.some(icon => icon.src === src || icon.src === `/${src}`)) {
    throw new Error(`Manifest missing icon reference: /${src}`);
  }
}

console.log('PASS PWA manifest, service worker, and icon assets are present.');
