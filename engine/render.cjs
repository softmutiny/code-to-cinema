// usage: node render.cjs <projectDir> check 0,12,30   -> <projectDir>/check/check-<pose>.jpg (640px wide, for reviewing)
//        node render.cjs <projectDir> full 40,72       -> <projectDir>/check/full-<pose>.jpg (1600×900, for crops and fine detail)
//        node render.cjs <projectDir> all [from] [to] -> <projectDir>/frames/p0000.jpg ... (1600×900)
//        node render.cjs <projectDir> timeline        -> <projectDir>/timeline.json (feeds audio.cjs)
// Needs Playwright: `npm i playwright && npx playwright install chromium`.
// Overrides: PLAYWRIGHT_MODULE=<path to playwright or playwright-core>, CHROME_PATH=<chromium/chrome executable>.
const path = require('path'), fs = require('fs');
function loadPW() {
  const tries = [process.env.PLAYWRIGHT_MODULE, 'playwright', 'playwright-core'].filter(Boolean);
  for (const m of tries) { try { return require(m); } catch {} }
  console.error('Playwright not found. Run: npm i playwright && npx playwright install chromium  (or set PLAYWRIGHT_MODULE)'); process.exit(1);
}
(async () => {
  const dir = path.resolve(process.argv[2] || '.'), mode = process.argv[3] || 'check';
  const { chromium } = loadPW();
  const full = mode === 'full', check = mode === 'check' || full;
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: check && !full ? 0.4 : 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto('file:///' + path.join(dir, 'film.html').replace(/\\/g, '/'));
  const fonts = await Promise.race([page.evaluate(() => window.preloadFonts()), page.waitForTimeout(25000).then(() => ['(font load timed out: check network)'])]);
  console.log('fonts:', fonts.join(', ') || 'none (captions will use fallback fonts)');
  if (mode === 'timeline') {
    const tl = await page.evaluate(() => window.timeline());
    fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify(tl));
    console.log('timeline.json', tl.duration + 's', tl.events.length, 'events');
  } else if (check) {
    fs.mkdirSync(path.join(dir, 'check'), { recursive: true });
    const n = await page.evaluate(() => window.NPOSES);
    const list = (process.argv[4] || '').split(',').filter(Boolean).map(Number);
    const poses = list.length ? list : Array.from({ length: 8 }, (_, i) => Math.round(i * (n - 1) / 7));
    for (const p of poses) {
      await page.evaluate(p => window.renderPose(p), p);
      await page.locator('#art').screenshot({ path: path.join(dir, 'check', `${full ? 'full' : 'check'}-${p}.jpg`), type: 'jpeg', quality: 80 });
    }
    console.log('checked poses', poses.join(','), 'of', n, '(pose = seconds × 8; the last pose of a shot is often a black cut pose)');
  } else {
    fs.mkdirSync(path.join(dir, 'frames'), { recursive: true });
    const n = await page.evaluate(() => window.NPOSES);
    const from = +(process.argv[4] || 0), to = +(process.argv[5] || n), t0 = Date.now();
    for (let p = from; p < to; p++) {
      await page.evaluate(p => window.renderPose(p), p);
      await page.locator('#art').screenshot({ path: path.join(dir, 'frames', `p${String(p).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 94 });
      if (p % 20 === 0) console.log('pose', p, '/', n, ((Date.now() - t0) / 1000).toFixed(0) + 's');
    }
    console.log('frames done', to - from);
  }
  await browser.close();
})();
