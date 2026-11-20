const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const regex = /<button[^>]*id="([^"]+)"/g;
let m;
let missing = 0;
while ((m = regex.exec(content)) !== null) {
  const id = m[1];
  const slice = content.slice(m.index, m.index + 500);
  const end = slice.indexOf('</button>');
  const sub = slice.slice(0, end);
  const hasIcon = sub.includes('<svg');
  console.log(id.padEnd(25), hasIcon ? 'PASS (Icon found)' : 'FAIL (Missing icon)');
  if (!hasIcon) missing++;
}
console.log('Total checked. Missing:', missing);
process.exit(missing > 0 ? 1 : 0);
