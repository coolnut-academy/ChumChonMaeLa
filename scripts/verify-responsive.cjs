const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(root, '.verification');
fs.mkdirSync(out, { recursive: true });
const report = { checks: [], views: [], errors: [] };
function check(label, value) { assert(value, label); report.checks.push(label); }
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.webp') ? 'image/webp' : 'text/html; charset=utf-8' });
    res.end(bytes);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  try {
    const viewports = [{ width: 320, height: 740 }, { width: 375, height: 812 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 820, height: 1180 }, { width: 1024, height: 1366 }, { width: 1440, height: 1000 }];
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: viewport.width < 1100 });
      await context.addInitScript(() => localStorage.setItem('MAELA_SCHOOL_PDPA_ACCEPTED', '1'));
      const page = await context.newPage();
      page.on('pageerror', e => report.errors.push(e.message));
      await page.goto(origin + '/#/home');
      await page.evaluate(() => { state.heroPaused = true; clearInterval(heroSliderTimer); });
      await page.evaluate(() => document.fonts.ready);
      async function go(route) {
        await page.evaluate(route => { location.hash = '#/' + route; }, route);
        await page.waitForFunction(route => state.currentRoute === route, route);
        await page.waitForTimeout(80);
      }
      async function inspect(label, screenshot = false) {
        const facts = await page.evaluate(() => ({
          viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          buttons: [...document.querySelectorAll('.header-nav-button, .header-apply, .utility-button, .quick-link')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden').map(el => ({ text: el.textContent.trim(), whiteSpace: getComputedStyle(el).whiteSpace, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, fits: el.scrollWidth <= el.clientWidth + 1 }))
        }));
        report.views.push({ width: viewport.width, label, ...facts });
        check(`${viewport.width} ${label}: no page overflow`, facts.scrollWidth <= facts.viewport + 1);
        check(`${viewport.width} ${label}: navigation buttons stay on one line and within the viewport`, facts.buttons.every(b => b.whiteSpace === 'nowrap' && b.left >= -1 && b.right <= facts.viewport + 1 && b.fits));
        if (screenshot) { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: path.join(out, `responsive-${viewport.width}-${label}.png`), fullPage: true }); }
      }
      for (const route of ['home', 'about', 'academics', 'personnel', 'news', 'admissions', 'services', 'ita', 'contact', 'admin']) {
        await go(route);
        await inspect(route, ['home', 'news', 'admissions'].includes(route));
      }
      await page.locator('#formAdminLogin button[type="submit"]').click();
      for (const tab of ['overview', 'news', 'banners', 'personnel', 'ita', 'calendar', 'inbox']) {
        await page.locator(`[data-admin-tab="${tab}"]`).click();
        await inspect('admin-' + tab);
      }
      await go('home');
      check(`${viewport.width}: no text, CTA or white wash lies over slideshow photos`, await page.locator('.hero-viewport h2, .hero-viewport p, .hero-viewport a, .hero-shade').count() === 0);
      for (let i = 0; i < 5; i++) {
        await page.locator(`[data-hero-dot="${i}"]`).click();
        await page.waitForTimeout(650);
        await page.locator('.hero-slide.is-active img').evaluate(img => img.decode());
        const bounds = await page.evaluate(() => {
          const image = document.querySelector('.hero-viewport').getBoundingClientRect();
          const controls = document.querySelector('.hero-controls').getBoundingClientRect();
          const notice = document.getElementById('heroImageNotice').getBoundingClientRect();
          const portal = document.querySelector('.quick-links').getBoundingClientRect();
          const hero = document.getElementById('homeHero').getBoundingClientRect();
          return { height: image.height, controlsBelow: controls.top >= image.bottom - 1, noticeBelow: notice.top >= image.bottom - 1, portalBelow: portal.top >= hero.bottom - 1 };
        });
        check(`${viewport.width} slide ${i + 1}: controls, AI disclosure and quick links do not cover the photo`, bounds.controlsBelow && bounds.noticeBelow && bounds.portalBelow);
        check(`${viewport.width} slide ${i + 1}: photo is shorter than the previous hero`, bounds.height <= 420);
      }
      if (viewport.width < 640) {
        await page.locator('#btnMobileMenu').click();
        check(`${viewport.width}: mobile menu reports its expanded state`, await page.locator('#btnMobileMenu').getAttribute('aria-expanded') === 'true');
        await inspect('mobile-menu-open', true);
        await page.locator('.mobile-nav-link[data-nav="about"]').click();
        await page.waitForFunction(() => state.currentRoute === 'about');
        check(`${viewport.width}: navigation closes the mobile menu`, await page.locator('#btnMobileMenu').getAttribute('aria-expanded') === 'false');
      } else {
        check(`${viewport.width}: full navigation is visible on tablet and desktop`, await page.locator('.site-navigation').isVisible());
      }
      await context.close();
    }
    check('No uncaught JavaScript errors during responsive checks', report.errors.length === 0);
    console.log(`PASS: ${report.checks.length} responsive checks, ${report.views.length} views, 7 viewport sizes including portrait iPads.`);
  } finally {
    fs.writeFileSync(path.join(out, 'responsive-results.json'), JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
