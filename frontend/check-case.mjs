import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const problems = [];

/** True only if every folder and file name matches the real name EXACTLY (Linux hosts are case-sensitive). */
function exactCase(target) {
  const rel = path.relative(root, target);
  if (rel.startsWith('..')) return true;
  let current = root;
  for (const part of rel.split(path.sep)) {
    if (!fs.readdirSync(current).includes(part)) return false;
    current = path.join(current, part);
  }
  return true;
}

const check = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  const pattern = /(?:from\s+|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(text))) {
    const target = path.resolve(path.dirname(file), match[1]);
    if (!exactCase(target)) problems.push(`${path.relative(root, file)}  ->  ${match[1]}`);
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
console.log(problems.length ? `Wrong capital letters (${problems.length}):\n${problems.join('\n')}` : 'All import names match exactly. Safe for Linux hosting.');