const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).on('error', () => res.writeHead(404).end()).pipe(res);
  });
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
    const base = process.env.SITE_URL || `http://127.0.0.1:${server.address().port}/`;
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', ignoreHTTPSErrors: true });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#catalog .card');
      const products = await page.evaluate(() => window.COWAY.products);
      assert.equal(await page.locator('#catalog .card').count(), products.length, 'Every product remains');
      assert.doesNotMatch(await page.locator('#catalog').innerText(), /RM20|3\/5\/7 bulan pertama|ikut model dan tempoh kontrak/, 'No RM20 promotion in catalogue cards or category banners');
      assert.equal(await page.locator('#catalog .promo-strip').count(), 0);
      for (const p of products) {
        await page.locator(`#catalog [data-id="${p.id}"] [data-open]`).first().evaluate(el => el.click());
        assert.equal(await page.locator('#modal .calc').count(), 0, `No catalogue promotion for ${p.id}`);
        assert.equal(await page.locator('#mTitle').innerText(), p.name);
        assert.equal(await page.locator('#modal .plans tbody tr').count(), (p.plans || []).reduce((n, plan) => n + plan[1].length, 0), `Rental plans preserved for ${p.id}`);
        await page.locator('#modal').evaluate(el => el.close());
      }
      assert.equal(await page.locator('#promoTrack .deal').count(), 7, 'All selected offers preserved');
      for (const button of await page.locator('#promoTrack [data-open]').all()) {
        await button.evaluate(el => el.click());
        assert.equal(await page.locator('#modal .calc').count(), 1, 'Selected offer retains promotion in details');
        assert.match(await page.locator('#modal .calc').innerText(), /RM20/);
        await page.locator('#modal').evaluate(el => el.close());
      }
      await page.locator('[data-cat="water"]').evaluate(el => el.click());
      assert.doesNotMatch(await page.locator('#catalog').innerText(), /RM20/, 'Filtering does not restore promotions');
      await page.goto(new URL(`#p-${products[0].id}`, base).href, { waitUntil: 'domcontentloaded' });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#modal[open]');
      assert.equal(await page.locator('#modal .calc').count(), 0, 'Direct product links do not show promotions');
      await page.locator('#modal').evaluate(el => el.close());
      assert.deepEqual(errors, [], 'No browser errors');
      console.log(`PASS ${width}px: ${products.length} product cards and details; 7 selected offers; rental plans; filter; no JS errors`);
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
