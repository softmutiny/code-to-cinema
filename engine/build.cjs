// usage: node build.cjs <projectDir>
// Concatenates the style's head + library + <projectDir>/*.js (alphabetical; shots.js first if present) + main
// into <projectDir>/film.html. FILM.title becomes the <title>; FILM.style picks the drawer:
//   (none) / 'engraving' : engine/head.html + core.js + main.js
//   'liyue'              : engine/liyue/head.html + lib.js + main.js
//   'awakening'          : engine/awakening/head.html + lib.js + main.js (DOM drawer, stop-motion)
const fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2] || '.');
const E = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort((a, b) => (a === 'shots.js' ? -1 : b === 'shots.js' ? 1 : a.localeCompare(b)));
if (!files.length) { console.error('no .js shot files in', dir); process.exit(1); }
const proj = files.map(f => `// ----- ${f} -----\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
// read title/style from the FILM object only, so a stray `style:` elsewhere can't switch drawers
const fm = proj.search(/\bFILM\s*=\s*\{/), head = fm >= 0 ? proj.slice(fm, fm + 800) : proj;
const title = (head.match(/title\s*:\s*['"`]([^'"`]+)/) || [, 'Film'])[1];
const style = (head.match(/style\s*:\s*['"`](\w+)/) || [, 'engraving'])[1];
if (style !== 'engraving' && !fs.existsSync(path.join(__dirname, style, 'main.js'))) { console.error('unknown style:', style); process.exit(1); }
const S = style === 'engraving' ? { head: 'head.html', lib: 'core.js', main: 'main.js' } : { head: `${style}/head.html`, lib: `${style}/lib.js`, main: `${style}/main.js` };
const html = E(S.head).replace('{{TITLE}}', title) + '\n(() => {\n' + E(S.lib) + '\n' + proj + '\n' + E(S.main) + '\n})();\n</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(dir, 'film.html'), html);
console.log('film.html', (html.length / 1024).toFixed(0) + 'KB', style, 'from', files.join(', '));
