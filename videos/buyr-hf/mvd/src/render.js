// Render CLI (motion-video-director §2 contract):
// node src/render.js --from <s> --to <s> --fps <n> --scale <0-1> --out <dir> [--jpg] [--start-index <n>]
// Frames are written as 00000.jpg/png… Every frame depends only on t (window.seek), so previews match finals.
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const from = +opt('from', 0), to = +opt('to', 24.63), fps = +opt('fps', 30), scale = +opt('scale', 1), out = opt('out', 'renders/frames');
const jpg = a.includes('--jpg'), startIndex = +opt('start-index', 0), times = opt('times');
const http = require('http');
const ROOT = path.resolve(__dirname, '..');
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.otf': 'font/otf', '.json': 'application/json'};
function serve() { return new Promise(r => { const srv = http.createServer((q, res) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'}); res.end(d); }); });
  srv.listen(0, '127.0.0.1', () => r(srv)); }); }
(async () => {
  fs.mkdirSync(out, {recursive: true});
  const srv = await serve();
  const b = await chromium.launch({args: ['--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const ctx = await b.newContext({viewport: {width: 1080, height: 1920}, deviceScaleFactor: scale});
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('CON', m.text()); });
  await p.goto(`http://127.0.0.1:${srv.address().port}/src/index.html`);
  await p.evaluate(() => window.ready());
  const list = times ? times.split(',').map(Number) : [...Array(Math.max(0, Math.round((to - from) * fps))).keys()].map(i => from + i / fps);
  for (let i = 0; i < list.length; i++) {
    await p.evaluate(t => window.seek(t), list[i]);
    const f = path.join(out, String(startIndex + i).padStart(5, '0') + (jpg ? '.jpg' : '.png'));
    await p.screenshot(jpg ? {path: f, type: 'jpeg', quality: 90} : {path: f});
  }
  await b.close(); srv.close(); console.log('done', list.length);
})();
