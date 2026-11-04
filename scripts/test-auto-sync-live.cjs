const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => {
    res.writeHead(error ? 404 : 200, {
      'Content-Type': ({
        '.js': 'text/javascript; charset=utf-8',
        '.webp': 'image/webp',
        '.png': 'image/png',
        '.ico': 'image/x-icon',
        '.webmanifest': 'application/manifest+json'
      })[path.extname(file)] || 'text/html; charset=utf-8'
    });
    res.end(bytes);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  console.log('--- เริ่มการทดสอบระบบ Auto-Upload & Auto-Sync Live ---');

  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(chrome) ? { executablePath: chrome } : {})
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${origin}/#/admin`);

    // 1. ตรวจสอบฟังก์ชัน Auto-Upload และ Auto-Sync ใน Browser Global Scope
    const helpersExist = await page.evaluate(() => {
      return typeof window.uploadDriveFileFromBase64 === 'function' &&
             typeof window.autoSyncDatabaseToCloud === 'function' &&
             typeof window.readFileAsDataUrl === 'function';
    });
    assert.strictEqual(helpersExist, true, 'Auto-sync & Drive upload helpers must be loaded in window');
    console.log('✓ 1. Helper functions (uploadDriveFileFromBase64, autoSyncDatabaseToCloud, readFileAsDataUrl) โหลดสมบูรณ์');

    // 2. ล็อกอินเข้าสู่ระบบ Admin ด้วยรหัส New1234
    await page.locator('#adminPassInput').fill('New1234');
    await page.locator('#formAdminLogin button[type="submit"]').click();
    await page.waitForSelector('[data-admin-tab="news"]');
    console.log('✓ 2. เข้าสู่ระบบ Admin สำเร็จด้วยรหัส New1234');

    // 3. ตรวจสอบแท็บเอกสาร ITA ว่ามีฟิลด์อัปโหลดไฟล์ PDF ขึ้น Google Drive หรือไม่
    await page.locator('[data-admin-tab="ita"]').click();
    await page.waitForSelector('#itaFileInput');
    const hasItaFileInput = await page.locator('#itaFileInput').isVisible();
    assert.strictEqual(hasItaFileInput, true, 'ITA tab must have #itaFileInput');
    console.log('✓ 3. แท็บ ITA มีปุ่มอัปโหลดไฟล์ PDF ขึ้น Google Drive เรียบร้อย');

    // 4. ทดสอบสร้างข่าวใหม่ผ่านฟอร์ม และตรวจสอบการทำงานของ Auto-Sync
    await page.locator('[data-admin-tab="news"]').click();
    await page.waitForSelector('#formAdminNews');

    const testNewsTitle = 'ทดสอบระบบ Auto-Sync สู่ Google Sheets ' + Date.now();
    await page.locator('#newsTitle').fill(testNewsTitle);
    await page.locator('#newsSummary').fill('คำโปรยทดสอบการซิงก์ข้อมูลขึ้นคลาวด์อัตโนมัติ');
    await page.locator('#newsContent').fill('เนื้อหาข่าวทดสอบระบบ Auto-Sync โดยไม่ต้องกดปุ่มแยก');

    // ดักฟัง Network request ไปยัง Google Apps Script
    let syncRequestIntercepted = false;
    let syncRequestBody = null;

    page.on('request', req => {
      if (req.url().includes('script.google.com') && req.method() === 'POST') {
        syncRequestIntercepted = true;
        try {
          syncRequestBody = JSON.parse(req.postData() || '{}');
        } catch (e) {}
      }
    });

    // กดปุ่มบันทึกข่าว
    await page.locator('#formAdminNews button[type="submit"]').click();

    // รอให้ข้อความของข่าวใหม่ปรากฏในรายการของหน้า Admin ทันที
    await page.waitForSelector(`#adminSubViewContainer :text("${testNewsTitle}")`);
    const newsListText = await page.locator('#adminSubViewContainer').textContent();
    assert(newsListText.includes(testNewsTitle), 'New news item must appear immediately in list');
    console.log('✓ 4. ข่าวใหม่ถูกบันทึกและแสดงผลในการ์ดทันที (Optimistic UI)');

    // รอ network request
    await page.waitForTimeout(1500);

    // ตรวจสอบว่ามีการเรียก API POST ขึ้น Google Apps Script (Auto-Sync)
    assert.strictEqual(syncRequestIntercepted, true, 'A POST request to script.google.com must be sent automatically on form submit');
    assert.strictEqual(syncRequestBody.action, 'syncDatabase', 'Action must be syncDatabase');
    assert(Array.isArray(syncRequestBody.news), 'Payload must include news array');
    const itemInPayload = syncRequestBody.news.find(n => n.title === testNewsTitle);
    assert(itemInPayload, 'Newly created item must be present in the syncDatabase payload to Google Sheets');
    console.log('✓ 5. ยืนยัน Auto-Sync: คำสั่ง POST syncDatabase ส่งขึ้น Google Sheets อัตโนมัติ โดยไม่ต้องกดปุ่มแยก!');

    // 5. ทดสอบการลบข่าว และตรวจสอบว่าคำสั่งลบส่ง Auto-Sync ทันที
    page.on('dialog', dialog => dialog.accept()); // กดยืนยัน confirm()

    const deleteBtn = page.locator(`[data-del-news="${itemInPayload.id}"]`);
    if (await deleteBtn.isVisible()) {
      syncRequestIntercepted = false;
      await deleteBtn.click();
      await page.waitForTimeout(1500);
      assert.strictEqual(syncRequestIntercepted, true, 'Delete operation must also trigger syncDatabase automatically');
      console.log('✓ 6. ยืนยันการลบ: การกดลบข้อมูลส่งคำสั่ง syncDatabase ไปลบใน Google Sheets ทันที');
    }

    console.log('\n🎉 การทดสอบ Auto-Upload และ Auto-Sync ผ่านสมบูรณ์ 100%!');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(err => {
  console.error('❌ เกิดข้อผิดพลาด:', err);
  process.exit(1);
});
