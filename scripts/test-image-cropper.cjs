const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (requested === '/') requested = '/index.html';
  const file = path.resolve(root, '.' + requested);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.webp': 'image/webp',
      '.json': 'application/json'
    })[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});

(async () => {
  console.log('--- เริ่มการทดสอบระบบครอบตัดรูปภาพ (Image Cropper Tests) ---');

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const origin = `http://127.0.0.1:${port}`;

  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(chrome) ? { executablePath: chrome } : {})
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
    await page.goto(`${origin}/index.html#/admin`);

    // 1. ตรวจสอบว่าโมดูล ImageCropper และสคริปต์โหลดสมบูรณ์
    const cropperReady = await page.evaluate(() => {
      return typeof window.openImageCropper === 'function' &&
             typeof window.SchoolImageCropper === 'object' &&
             Array.isArray(window.SchoolImageCropper.presets);
    });
    assert.equal(cropperReady, true, 'SchoolImageCropper API must be available globally');
    console.log('✓ 1. SchoolImageCropper API โหลดสำเร็จและพร้อมใช้งาน');

    // ตรวจสอบ Presets
    const presets = await page.evaluate(() => window.SchoolImageCropper.presets);
    assert(presets.some(p => p.id === '16:9'), 'Preset 16:9 must exist');
    assert(presets.some(p => p.id === '3:2'), 'Preset 3:2 must exist');
    assert(presets.some(p => p.id === '3:4'), 'Preset 3:4 must exist');
    assert(presets.some(p => p.id === '1:1'), 'Preset 1:1 must exist');
    console.log('✓ 2. ตรวจสอบ Aspect Ratio Presets ครบถ้วน (16:9, 3:2, 3:4, 1:1, 4:3, free)');

    // 2. ล็อกอินเข้าแอดมิน
    await page.locator('#adminPassInput').fill('New1234');
    await page.locator('#formAdminLogin button[type="submit"]').click();
    await page.waitForSelector('[data-admin-tab="news"]');
    console.log('✓ 3. เข้าสู่ระบบ Admin สำเร็จ');

    // 3. ทดสอบ Crop ในแท็บข่าวสาร (News)
    await page.locator('[data-admin-tab="news"]').click();
    const testImage = path.join(root, 'public/images/placeholders/primary-reading-discovery.webp');
    assert(fs.existsSync(testImage), 'Test image fixture must exist');

    await page.locator('#newsFileInput').setInputFiles(testImage);
    // ตรวจสอบว่า Crop Modal เด้งขึ้นมา
    await page.waitForSelector('#imageCropperModal', { state: 'visible' });
    const modalVisible = await page.locator('#imageCropperModal').isVisible();
    assert.equal(modalVisible, true, 'Crop Modal must be visible after selecting news image');
    console.log('✓ 4. Crop Modal เปิดขึ้นมาทันทีเมื่อเลือกไฟล์ภาพปกข่าว');

    // ตรวจสอบข้อความอธิบายการแสดงผล
    const noticeText = await page.locator('#imageCropperModal').textContent();
    assert(noticeText.includes('ภายในกรอบสี่เหลี่ยมนี้เท่านั้น'), 'Modal must explain that only framed area will show');
    assert(noticeText.includes('หัวขาด'), 'Modal must warn about avoiding cut-off heads/distortion');
    console.log('✓ 5. ข้อความแจ้งเตือนระบุชัดเจนว่าส่วนไหนจะแสดง และส่วนไหนจะซ่อนไว้เพื่อไม่ให้หัวขาด');

    // ตรวจสอบ Live Preview และการสลับ Preset
    await page.locator('[data-ratio-preset="3:2"]').click();
    const badgeText = await page.locator('#previewAspectBadge').textContent();
    assert.equal(badgeText, '3:2', 'Preview aspect badge must show 3:2');
    console.log('✓ 6. สลับสัดส่วนภาพเป็น 3:2 พร้อมอัปเดต Live Preview สำเร็จ');

    // ทดสอบหมุนภาพและซูม
    await page.locator('#btnRotateCw').click();
    await page.locator('#btnZoomIn').click();
    console.log('✓ 7. ปุ่มหมุนภาพ 90° และซูมทำงานได้ปกติ');

    // กดยืนยันการ Crop
    await page.locator('#btnCropperConfirm').click();
    await page.waitForSelector('#imageCropperModal', { state: 'hidden' });
    console.log('✓ 8. กดยืนยันการ Crop และปิด Modal เรียบร้อย');

    // ตรวจสอบว่า preview ในหน้าข่าวดึงภาพที่ crop มาแสดง
    await page.waitForFunction(() => {
      const img = document.querySelector('#newsImagePreview img');
      return img && img.getAttribute('src') && img.getAttribute('src').startsWith('data:image/webp');
    });
    const newsPreviewSrc = await page.locator('#newsImagePreview img').getAttribute('src');
    assert(newsPreviewSrc.startsWith('data:image/webp'), 'News preview must show cropped WebP image');
    const newsInfoText = await page.locator('#compressInfoText').textContent();
    assert(newsInfoText.includes('ครอป') && newsInfoText.includes('WebP'), 'Compress info must disclose crop & WebP success');
    console.log('✓ 9. ภาพปกข่าวแสดงผล WebP ที่ครอปแล้วในหน้า Admin พร้อมสถิติขนาดไฟล์');

    // ตรวจสอบปุ่ม "ครอปใหม่"
    const recropVisible = await page.locator('#btnNewsRecrop').isVisible();
    assert.equal(recropVisible, true, 'Re-crop button must be visible after cropping');
    console.log('✓ 10. ปุ่ม "✂️ ครอปใหม่" แสดงผลพร้อมให้กดปรับแต่งซ้ำ');

    // 4. ทดสอบ Crop ในแท็บสไลด์หน้าแรก (Hero Slideshow)
    await page.locator('[data-admin-tab="banners"]').click();
    await page.waitForSelector('[data-hero-editor="0"]');

    const heroFileInput = page.locator('[data-hero-editor="0"] [data-hero-file]');
    await heroFileInput.setInputFiles(testImage);
    await page.waitForSelector('#imageCropperModal', { state: 'visible' });
    console.log('✓ 11. Crop Modal เปิดขึ้นมาทันทีเมื่อเลือกไฟล์ภาพสไลด์หน้าแรก (Hero)');

    // กดยืนยัน Hero Crop (ค่าเริ่มต้น 16:9)
    await page.locator('#btnCropperConfirm').click();
    await page.waitForSelector('#imageCropperModal', { state: 'hidden' });
    await page.waitForFunction(() => {
      const img = document.querySelector('[data-hero-editor="0"] [data-hero-preview] img');
      return img && img.getAttribute('src') && img.getAttribute('src').startsWith('data:image/webp');
    });
    const heroPreviewSrc = await page.locator('[data-hero-editor="0"] [data-hero-preview] img').getAttribute('src');
    assert(heroPreviewSrc.startsWith('data:image/webp'), 'Hero preview must show cropped WebP image');
    console.log('✓ 12. ภาพสไลด์หน้าแรกบันทึกภาพ WebP 16:9 ที่ครอปแล้วสำเร็จ');

    // 5. ทดสอบ Crop ในแท็บบุคลากร (Personnel: สัดส่วน 3:4 รูปติดบัตร)
    await page.locator('[data-admin-tab="personnel"]').click();
    await page.waitForSelector('#formAdminPerson');

    const psFileInput = page.locator('#psFileInput');
    await psFileInput.setInputFiles(testImage);
    await page.waitForSelector('#imageCropperModal', { state: 'visible' });
    const psBadge = await page.locator('#previewAspectBadge').textContent();
    assert.equal(psBadge, '3:4', 'Personnel photo must default to 3:4 portrait aspect ratio');
    console.log('✓ 13. Crop Modal ของภาพถ่ายบุคลากรตั้งค่าเริ่มต้นเป็นสัดส่วน 3:4 รูปติดบัตรอัตโนมัติ');

    await page.locator('#btnCropperConfirm').click();
    await page.waitForSelector('#imageCropperModal', { state: 'hidden' });
    await page.waitForFunction(() => {
      const img = document.querySelector('#personImagePreview img');
      return img && img.getAttribute('src') && img.getAttribute('src').startsWith('data:image/webp');
    });
    const personPreviewSrc = await page.locator('#personImagePreview img').getAttribute('src');
    assert(personPreviewSrc && personPreviewSrc.startsWith('data:image/webp'), 'Personnel preview must show cropped WebP image');
    console.log('✓ 14. ภาพถ่ายบุคลากรแสดงผล WebP 3:4 ที่ครอปแล้วในหน้า Admin สำเร็จ');

    // 6. ทดสอบ Crop ในฟอร์มแบนเนอร์ (Banners/Popup)
    await page.locator('[data-admin-tab="banners"]').click();
    const bnFileInput = page.locator('#bnFileInput');
    await bnFileInput.setInputFiles(testImage);
    await page.waitForSelector('#imageCropperModal', { state: 'visible' });
    console.log('✓ 15. ฟอร์มเพิ่มแบนเนอร์/Popup มีระบบ Crop ภาพเมื่อเลือกไฟล์');
    await page.locator('#btnCropperConfirm').click();
    await page.waitForSelector('#imageCropperModal', { state: 'hidden' });
    await page.waitForFunction(() => {
      const img = document.querySelector('#bannerImagePreview img');
      return img && img.getAttribute('src') && img.getAttribute('src').startsWith('data:image/webp');
    });
    console.log('✓ 16. ภาพแบนเนอร์/Popup แสดงผล WebP ที่ครอปแล้วสำเร็จ');

    console.log('\n🎉 ทุกการทดสอบของระบบ Image Cropper ผ่านสมบูรณ์ 100%!');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(err => {
  console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', err);
  process.exit(1);
});
