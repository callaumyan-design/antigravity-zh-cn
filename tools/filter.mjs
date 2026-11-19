import fs from 'node:fs';
const arr = JSON.parse(fs.readFileSync('work/strings.json', 'utf8'));
const junk = [
  /\b(background|foreground|border|outline|shadow|highlight)\s+colou?r\b/i, /\bcolou?r (of|for|used)\b/i, /\bcolor\b.*\b(transparen|opaque)/i,
  /^(Default value of|The |Whether |Defines |Determines |Specifies |Strategy |Option )/,
  /\b(Supplement|Extended-[A-Z]|Presentation Forms|Ideographs|Syllables|Symbols and|Compatibility|Script$|Italic$)\b/,
  /\b(simplex|crossing minimi|Layout$|layering|node placement|hierarchical node|edge routing|port constraints)\b/i,
  /\b(Iterator|prototype|undefined|null|NaN|Invalid (array|typed|regular)|Cannot (convert|read|set)|is not a function|Unexpected (token|end))\b/,
  /Proto$|Descriptor/, /^[a-z]+ [a-z]+$/  // lowercase two-word identifiers e.g. "underline strikethrough"
];
const keep = arr.filter(({ s, k }) => {
  if (k !== 'sentence') return !junk.slice(0, 3).some(r => r.test(s)) && !/Proto$|Descriptor/.test(s);
  return !junk.some(r => r.test(s));
});
fs.writeFileSync('work/todo.json', JSON.stringify(keep.map(x => x.s)));
console.log(arr.length, '->', keep.length);
const N = 8, per = Math.ceil(keep.length / N);
for (let i = 0; i < N; i++) fs.writeFileSync(`work/chunk${i}.json`, JSON.stringify(keep.slice(i * per, (i + 1) * per).map(x => x.s), null, 0));
