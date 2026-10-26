import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const missing = [];

const check = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  const pattern = /(?:from\s+|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(text))) {
    const target = path.resolve(path.dirname(file), match[1]);
    if (!fs.existsSync(target)) missing.push(`${path.relative(root, file)}  ->  ${match[1]}`);
  }
};

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(jsx?|mjs)$/.test(entry.name)) check(full);
  }
};

walk(root);
console.log(missing.length ? `Missing files (${missing.length}):\n${missing.join('\n')}` : 'All relative imports resolve.');