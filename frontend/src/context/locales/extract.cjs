/**
 * One-time script: extracts translations object from LanguageContext.jsx
 * and writes each locale as a JSON file in /locales/.
 * Run: node extract.cjs
 */
const fs   = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../LanguageContext.jsx'), 'utf8');

// Pull just the translations object literal
const startMark = 'export const translations = ';
const startIdx  = src.indexOf(startMark) + startMark.length;

// Walk chars to find the matching closing brace
let depth = 0, i = startIdx, inStr = false, strChar = '';
for (; i < src.length; i++) {
  const ch = src[i];
  if (!inStr && (ch === '"' || ch === "'")) { inStr = true; strChar = ch; continue; }
  if (inStr && ch === strChar && src[i - 1] !== '\\') { inStr = false; continue; }
  if (inStr) continue;
  if (ch === '{') depth++;
  if (ch === '}') { depth--; if (depth === 0) { i++; break; } }
}

const objSrc = src.slice(startIdx, i);
const translations = eval('(' + objSrc + ')'); // safe — local file

Object.entries(translations).forEach(([lang, obj]) => {
  const outPath = path.join(__dirname, `${lang}.json`);
  fs.writeFileSync(outPath, JSON.stringify(obj, null, 2), 'utf8');
  console.log(`✅ Written: ${lang}.json (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
});
console.log('\nDone! You can now delete this script.');
