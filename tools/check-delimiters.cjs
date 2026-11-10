const fs = require('fs');

function checkDelimiters(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let b = 0, p = 0, k = 0;
  let inString = null;
  let inComment = false;
  let inLineComment = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1];

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inComment) {
      if (c === '*' && next === '/') {
        inComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (c === '\\') {
        i++; // skip escaped char
      } else if (c === inString) {
        inString = null;
      }
      continue;
    }

    if (c === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      inComment = true;
      i++;
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      inString = c;
      continue;
    }

    if (c === '{') b++;
    else if (c === '}') b--;
    else if (c === '(') p++;
    else if (c === ')') p--;
    else if (c === '[') k++;
    else if (c === ']') k--;
  }

  const result = { b, p, k };
  const ok = b === 0 && p === 0 && k === 0;
  console.log(`${filePath}: { b: ${b}, p: ${p}, k: ${k} } -> ${ok ? 'BALANCED' : 'IMBALANCED'}`);
  return ok;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  files.push('src/game.js', 'src/game-systems.js', 'src/models.js');
}

let allOk = true;
for (const f of files) {
  if (fs.existsSync(f)) {
    if (!checkDelimiters(f)) allOk = false;
  }
}

if (!allOk) process.exit(1);
