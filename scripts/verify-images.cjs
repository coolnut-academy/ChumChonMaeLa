/* Local-only browser verification. Never connects to the school's CMS API. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const { chromium } = require('playwright');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const out = path.join(root, '.verification');
fs.mkdirSync(out, { recursive: true });
const report = { checks: [], pages: [], pageErrors: [], missingLocalResources: [] };
const check = (name, actual) => { assert(actual, name); report.checks.push(name); };
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
new vm.Script(fs.readFileSync(path.join(root, 'image-placeholders.js'), 'utf8'));
check('All inline and external JavaScript parses', true);

const server = http.createServer((req, res) => {
  // Also serve below /school/ to exercise GitHub Pages project-site paths.
  let requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/school\//, '/');
  if (requested === '/') requested = '/index.html';
  const file = path.resolve(root, '.' + requested);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  try {
    const assets = fs.readdirSync(path.join(root, 'public/images/placeholders')).filter(f => f.endsWith('.webp'));
    check('19 actual WebP image files exist', assets.length === 19);
    report.assets = [];
    for (const file of assets) {
      const full = path.join(root, 'public/images/placeholders', file);
      const metadata = await sharp(full).metadata();
      const expected = file.includes('avatar') ? [256, 256] : file.includes('-thumb') ? [480, 320] : [1200, 800];
      assert.deepEqual([metadata.width, metadata.height], expected, file);
      report.assets.push({ file, width: metadata.width, height: metadata.height, bytes: fs.statSync(full).size });
    }
    check('All raster assets decode and have intended dimensions', true);

    for (const viewport of [{ width: 1440, height: 1000 }, { width: 375, height: 812 }]) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      await context.addInitScript(() => { localStorage.setItem('MAELA_SCHOOL_PDPA_ACCEPTED', '1'); });
      const page = await context.newPage();
      page.on('pageerror', error => report.pageErrors.push(error.message));
      page.on('response', response => {
        if (response.url().startsWith(origin) && response.status() >= 400 && !response.url().includes('deliberately-missing')) report.missingLocalResources.push(response.url());
      });
      async function go(route) {
        if (!page.url().startsWith(origin)) await page.goto(origin + '/school/#/' + route);
        else await page.evaluate(route => { location.hash = '#/' + route; }, route);
        await page.waitForFunction(route => state.currentRoute === route, route);
        await page.waitForFunction(() => document.getElementById('appMainContainer').children.length > 0);
        await page.evaluate(() => { clearInterval(heroSliderTimer); });
        await page.evaluate(() => document.fonts.ready);
      }
      async function inspect(label, screenshot = true) {
        const images = page.locator('img[data-school-image]:visible');
        for (const image of await images.all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(img => img.complete && img.naturalWidth ? undefined : new Promise((resolve, reject) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', () => reject(new Error('Failed: ' + img.currentSrc)), { once: true });
          }));
        }
        const facts = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          images: [...document.querySelectorAll('img[data-school-image]')].filter(img => img.getClientRects().length > 0).map(img => ({
            src: img.currentSrc, alt: img.alt, loaded: img.complete && img.naturalWidth > 0,
            fit: getComputedStyle(img).objectFit, loading: img.loading,
            hasDimensions: img.hasAttribute('width') && img.hasAttribute('height'),
            hasLocalSrc: img.getAttribute('src').startsWith('./public/images/placeholders/'),
            hasCaption: !img.parentElement.querySelector('figcaption').hidden,
            renderedWidth: img.getBoundingClientRect().width,
            renderedHeight: img.getBoundingClientRect().height
          }))
        }));
        assert(facts.images.every(img => img.loaded && img.alt && img.hasDimensions && img.fit === 'cover' && img.renderedWidth > 0 && img.renderedHeight > 0), label + ' image accessibility/layout');
        assert(facts.images.every(img => !img.hasLocalSrc || img.hasCaption), label + ' AI disclosure');
        report.pages.push({ label, ...facts });
        if (facts.scrollWidth > facts.width + 1) console.log('OVERFLOW', label, facts.scrollWidth, facts.width);
        await page.evaluate(() => scrollTo(0, 0));
        if (screenshot) await page.screenshot({ path: path.join(out, `${viewport.width}-${label}.png`), fullPage: true });
      }
      for (const route of ['home', 'about', 'academics', 'personnel', 'news', 'admissions', 'services', 'ita', 'contact', 'admin']) {
        await go(route);
        await inspect(route);
        if (route === 'home') {
          check(`${viewport.width}: Hero is eager and high priority`, await page.locator('img[fetchpriority="high"]').getAttribute('loading') === 'eager');
          await page.locator('#btnNextHero').click();
          await inspect('home-slide-2', false);
          await page.locator('#btnOpenPopup').click();
          await inspect('announcement-popup');
          await page.locator('#btnPopupClose').click();
        }
        if (route === 'academics') {
          for (const level of ['primary', 'secondary']) {
            await page.locator(`[data-acad-tab="${level}"]`).click();
            await inspect(`academics-${level}`);
          }
        }
        if (route === 'news') {
          const ids = await page.locator('[data-read-news]').evaluateAll(buttons => buttons.map(b => b.dataset.readNews));
          for (const id of ids) {
            await page.locator(`[data-read-news="${id}"]`).click();
            await inspect(`news-detail-${id}`, false);
            await page.evaluate(() => closeGlobalModal());
          }
          for (const cat of ['pr', 'award', 'academic', 'procurement', 'job']) {
            await page.locator(`[data-news-cat="${cat}"]`).click();
            await inspect(`news-filter-${cat}`, false);
          }
          await page.locator('[data-news-cat="all"]').click();
          const years = page.locator('#selectNewsYear');
          if (await years.count()) {
            await years.selectOption('2568');
            await inspect('news-archive-2568', false);
            await years.selectOption('all');
          }
        }
        if (route === 'services') {
          for (const button of await page.locator('[data-grade-btn]').all()) {
            await button.click();
            check(`${viewport.width}: grade schedule updates`, await page.locator('#appMainContainer table').count() > 0);
          }
        }
        if (route === 'admin') {
          await page.locator('#formAdminLogin button[type="submit"]').click();
          for (const tab of ['overview', 'news', 'banners', 'personnel', 'ita', 'calendar', 'inbox']) {
            await page.locator(`[data-admin-tab="${tab}"]`).click();
            await inspect(`admin-${tab}`);
          }
        }
      }

      // Simulated uploaded images stay inside this disposable browser context.
      const fixture = fs.readFileSync(path.join(root, 'public/images/placeholders/primary-reading-discovery.webp'));
      const uploaded = 'data:image/webp;base64,' + fixture.toString('base64');
      await page.route('https://drive.google.com/thumbnail**', route => route.fulfill({ contentType: 'image/webp', body: fixture }));
      await go('admin');
      await page.evaluate(({ uploaded }) => {
        state.adminLoggedIn = true;
        state.adminTab = 'news';
        state.db.news.unshift({ ...state.db.news[0], id: 'IMAGE-TEST', title: 'Image verification fixture', cover_drive_id: '', cover_url: uploaded });
        renderAdminView(document.getElementById('appMainContainer'));
      }, { uploaded });
      await page.locator('[data-edit-news="IMAGE-TEST"]').click();
      check(`${viewport.width}: existing URL-only cover previews as uploaded`, await page.locator('#newsImagePreview img').getAttribute('src') === uploaded);
      await page.locator('#newsTitle').fill('Text-only edit');
      await page.locator('#formAdminNews button[type="submit"]').click();
      check(`${viewport.width}: text-only edit preserves original cover`, await page.evaluate(uploaded => state.db.news.find(n => n.id === 'IMAGE-TEST').cover_url === uploaded, uploaded));

      await page.evaluate(() => {
        const item = state.db.news.find(n => n.id === 'IMAGE-TEST');
        item.cover_drive_id = 'aRealisticDriveIdForTest12345';
        item.cover_url = '';
      });
      await page.locator('[data-edit-news="IMAGE-TEST"]').click();
      check(`${viewport.width}: Drive ID preview preserves existing endpoint`, (await page.locator('#newsImagePreview img').getAttribute('src')).includes('thumbnail?id=aRealisticDriveIdForTest12345'));
      await page.locator('#newsFileInput').setInputFiles(path.join(root, 'public/images/placeholders/secondary-science-careers.webp'));
      await page.waitForFunction(() => state.pendingCompressedDataUrl.startsWith('data:image/webp'));
      check(`${viewport.width}: newly selected file previews before saving`, (await page.locator('#newsImagePreview img').getAttribute('src')).startsWith('data:image/webp'));
      check(`${viewport.width}: upload preview has no AI placeholder label`, await page.locator('#newsImagePreview figcaption').isHidden());
      await page.locator('#formAdminNews button[type="submit"]').click();
      check(`${viewport.width}: new upload wins over previous Drive ID`, await page.evaluate(() => { const item = state.db.news.find(n => n.id === 'IMAGE-TEST'); return item.cover_drive_id === '' && item.cover_url.startsWith('data:image/webp'); }));

      await go('news');
      await page.locator('[data-read-news="IMAGE-TEST"]').click();
      check(`${viewport.width}: saved upload renders in news detail`, (await page.locator('#globalModalBackdrop img').getAttribute('src')).startsWith('data:image/webp'));
      await page.evaluate(() => closeGlobalModal());
      await go('admin');
      await page.locator('[data-admin-tab="news"]').click();
      await page.locator('[data-edit-news="IMAGE-TEST"]').click();
      await page.locator('#newsDriveId').fill('');
      await page.locator('#formAdminNews button[type="submit"]').click();
      await go('news');
      await page.locator('[data-read-news="IMAGE-TEST"]').click();
      check(`${viewport.width}: cleared image returns to category placeholder`, (await page.locator('#globalModalBackdrop img').getAttribute('src')).startsWith('./public/images/placeholders/'));
      await page.evaluate(() => closeGlobalModal());

      // Verify broken uploaded URLs fall back once and disclose the replacement.
      await page.evaluate(() => { const n = state.db.news.find(n => n.id === 'IMAGE-TEST'); n.cover_url = './deliberately-missing.webp'; openNewsDetailModal(n.id); });
      await page.waitForFunction(() => { const img = document.querySelector('#globalModalBackdrop img'); return img.dataset.fallbackAttempted && img.complete && img.naturalWidth > 0; });
      check(`${viewport.width}: failed upload falls back and displays disclosure`, await page.locator('#globalModalBackdrop figcaption').isVisible());
      await page.evaluate(() => closeGlobalModal());
      await go('admin');
      await page.locator('[data-admin-tab="news"]').click();
      await page.locator('[data-del-news="IMAGE-TEST"]').click();
      check(`${viewport.width}: deleting news still removes record`, await page.evaluate(() => !state.db.news.some(n => n.id === 'IMAGE-TEST')));
      await page.evaluate(uploaded => {
        const director = state.db.personnel[0];
        director.full_name = 'Director image verification';
        director.photo_drive_id = '   ';
        director.photo_url = uploaded;
        state.db.banners.find(b => b.type === 'hero').image_url = uploaded;
        state.db.banners.find(b => b.type === 'popup').image_url = uploaded;
        state.heroIndex = 0;
      }, uploaded);
      await go('home');
      check(`${viewport.width}: Hero uses uploaded URL before placeholder`, await page.locator('img[fetchpriority="high"]').getAttribute('src') === uploaded);
      const directorCard = page.locator('#appMainContainer div.bg-white').filter({ has: page.locator('h4', { hasText: 'Director image verification' }) }).last();
      check(`${viewport.width}: director name and uploaded photo come from the same record`, await directorCard.locator('img').getAttribute('src') === uploaded);
      await page.locator('#btnOpenPopup').click();
      check(`${viewport.width}: Popup uses uploaded URL before placeholder`, await page.locator('#globalModalBackdrop img').getAttribute('src') === uploaded);
      await page.evaluate(() => closeGlobalModal());
      await go('personnel');
      const personCard = page.locator('#appMainContainer div.bg-white').filter({ has: page.locator('h3', { hasText: 'Director image verification' }) }).last();
      check(`${viewport.width}: personnel URL beats placeholder even with whitespace Drive ID`, await personCard.locator('img').getAttribute('src') === uploaded);
      check(`${viewport.width}: placeholder URLs were never persisted`, await page.evaluate(() => !JSON.stringify(state.db).includes('./public/images/placeholders/')));
      await context.close();
    }
    check('No uncaught browser JavaScript errors', report.pageErrors.length === 0);
    check('No missing local deployed resources', report.missingLocalResources.length === 0);
    check('Every tested page fits the viewport', report.pages.every(p => p.scrollWidth <= p.width + 1));
  } finally {
    fs.writeFileSync(path.join(out, 'verification-results.json'), JSON.stringify(report, null, 2));
    await browser.close();
  }
  console.log(`PASS: ${report.checks.length} checks; ${report.pages.length} route/view inspections. Evidence: .verification/`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
