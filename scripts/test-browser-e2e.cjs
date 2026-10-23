const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(root, '.verification');
fs.mkdirSync(out, { recursive: true });

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
  console.log('Test server running at:', origin);

  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(chrome) ? { executablePath: chrome } : {})
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1
    });
    await context.addInitScript(() => {
      localStorage.setItem('MAELA_SCHOOL_PDPA_ACCEPTED', '1');
      localStorage.setItem('MAELA_SCHOOL_GAS_URL_V1', '');
    });

    const page = await context.newPage();
    await page.goto(origin + '/#/home');
    await page.waitForTimeout(500);

    // 1. ตรวจสอบปุ่ม Admin ขวาล่าง
    const floatBtn = page.locator('#btnFloatingAdmin');
    assert(await floatBtn.isVisible(), 'Floating admin button must be visible on home page');
    const box = await floatBtn.boundingBox();
    console.log('Floating button bounding box:', box);
    assert(box.x > 1000, 'Floating button must be at the right side of the screen');
    assert(box.y > 600, 'Floating button must be at the bottom of the screen');

    // ตรวจสอบว่าไม่มีปุ่ม header-apply ข้างตราโรงเรียน
    const headerApplyBtn = page.locator('.header-apply');
    assert(await headerApplyBtn.count() === 0, 'Old header-apply beside brand must be removed');

    // 2. ตรวจสอบปุ่ม "สมัครเรียน" บนแถบเมนู (เริ่มต้นต้องปิด/ซ่อนไว้)
    const navAdmissionsBtn = page.locator('.site-navigation [data-nav="admissions"]');
    assert(await navAdmissionsBtn.count() === 1, 'Admissions button must exist in site navigation');
    assert(await navAdmissionsBtn.isHidden(), 'Admissions button must be HIDDEN by default (เริ่มต้นเลยคือปิดไว้ก่อน)');
    console.log('✓ Admissions button is hidden by default on top nav');

    // ตรวจสอบการเข้าตรงที่ #/admissions ขณะปิดระบบ
    await page.goto(origin + '/#/admissions');
    await page.waitForTimeout(400);
    const closedNotice = page.locator('text=ขณะนี้ระบบรับสมัครนักเรียนใหม่ออนไลน์ยังไม่เปิดรับสมัคร');
    assert(await closedNotice.isVisible(), 'Closed admissions notice must appear when admissions_open is false');
    console.log('✓ Direct navigation to #/admissions shows closed notice');

    // บันทึกภาพหน้า Admissions เมื่อปิดระบบ
    await page.screenshot({ path: path.join(out, 'screenshot-admissions-closed.png') });
    console.log('✓ Captured screenshot-admissions-closed.png');

    // 3. เข้าหน้า Admin Login
    await page.goto(origin + '/#/admin');
    await page.waitForTimeout(400);

    // ตรวจสอบว่าช่องรหัสผ่านไม่มี autofill และไม่มีข้อความบอก password
    const passInput = page.locator('#adminPassInput');
    assert(await passInput.isVisible(), 'Admin password input must be visible');
    const val = await passInput.inputValue();
    assert(val === '', 'Password input must NOT be autofilled (must be empty)');
    console.log('✓ Password input has no autofill (empty value)');

    const visibleText = await page.evaluate(() => document.body.innerText);
    assert(!visibleText.includes('New1234'), 'Visible text must NOT reveal New1234');
    assert(!visibleText.includes('maela2569'), 'Visible text must NOT reveal maela2569');
    assert(!visibleText.includes('ข้อมูลสำหรับทดสอบระบบทันที'), 'Test account hint box must NOT exist');
    console.log('✓ No password hint or test account box found in visible UI');

    // บันทึกภาพหน้า Admin Login แบบคลีน
    await page.screenshot({ path: path.join(out, 'screenshot-admin-login-clean.png') });
    console.log('✓ Captured screenshot-admin-login-clean.png');

    // 4. กรอกรหัสผ่าน New1234 แล้วล็อกอิน
    await passInput.fill('New1234');
    await page.locator('#formAdminLogin button[type="submit"]').click();
    await page.waitForTimeout(500);

    // ตรวจสอบว่าเข้าสู่ระบบสำเร็จ (พบฟอร์มตั้งค่าเว็บไซต์)
    const siteConfigForm = page.locator('#formAdminSiteConfig');
    assert(await siteConfigForm.isVisible(), 'Admin site config form must be visible after login');
    console.log('✓ Admin login successful with single password New1234');

    // 5. ทดสอบเปิดระบบรับสมัครนักเรียน (Toggle Admissions to Open)
    const admissionsSelect = page.locator('#cfgAdmissionsOpen');
    assert(await admissionsSelect.isVisible(), 'Admissions toggle select must be visible');
    await admissionsSelect.selectOption('true');

    // ปรับแต่งข้อความวิ่ง
    const tickerBadgeInput = page.locator('#cfgTickerBadge');
    await tickerBadgeInput.fill('ข่าวด่วนพิเศษ');

    await siteConfigForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    // ตรวจสอบว่าปุ่ม "สมัครเรียน" บนแถบเมนูด้านบนแสดงแล้วทันที!
    assert(await navAdmissionsBtn.isVisible(), 'Admissions button on top nav must be VISIBLE after toggling ON');
    console.log('✓ Admissions button is now visible on top navigation bar after opening');

    // บันทึกภาพหน้า Admin ที่เปิดรับสมัครแล้ว
    await page.screenshot({ path: path.join(out, 'screenshot-admin-admissions-open.png') });
    console.log('✓ Captured screenshot-admin-admissions-open.png');

    // คลิกปุ่มสมัครเรียนบนเมนูหลัก
    await navAdmissionsBtn.click();
    await page.waitForFunction(() => window.location.hash === '#/admissions');
    await page.waitForTimeout(400);

    // ตรวจสอบว่าฟอร์มรับสมัครแสดงแล้ว (ไม่ใช่หน้าปิด)
    const applyHeading = page.locator('text=การรับสมัครนักเรียนใหม่ (ระดับชั้นอนุบาล 2 ถึง มัธยมศึกษาปีที่ 3)');
    assert(await applyHeading.isVisible(), 'Active registration page must be visible when admissions is OPEN');
    console.log('✓ Online admissions form is active and accessible');

    await page.screenshot({ path: path.join(out, 'screenshot-admissions-active.png') });
    console.log('✓ Captured screenshot-admissions-active.png');

    // 6. ทดสอบบนหน้าจอมือถือ (Mobile Viewport)
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      hasTouch: true
    });
    await mobileContext.addInitScript(() => {
      localStorage.setItem('MAELA_SCHOOL_PDPA_ACCEPTED', '1');
      localStorage.setItem('MAELA_SCHOOL_GAS_URL_V1', '');
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(origin + '/#/home');
    await mobilePage.waitForTimeout(400);

    const mobileFloatBtn = mobilePage.locator('#btnFloatingAdmin');
    assert(await mobileFloatBtn.isVisible(), 'Floating button must be visible on mobile');

    // เปิดเมนูมือถือ drawer
    await mobilePage.locator('#btnMobileMenu').click();
    await mobilePage.waitForTimeout(300);
    const mobileAdmissionsBtn = mobilePage.locator('#mobileMenuDrawer [data-nav="admissions"]');
    assert(await mobileAdmissionsBtn.isHidden(), 'Mobile admissions button must also be hidden initially');

    await mobilePage.screenshot({ path: path.join(out, 'screenshot-mobile-menu.png') });
    console.log('✓ Captured screenshot-mobile-menu.png');

    // 7. ทดสอบหน้าทำเนียบบุคลากร (Personnel Cards & Modal Details)
    await page.goto(origin + '/#/personnel');
    await page.waitForTimeout(500);

    // ตรวจสอบว่าการ์ดบุคลากรแสดงผลเป็น Card พร้อมรูปภาพขนาดใหญ่
    const personnelCards = page.locator('#appMainContainer [data-person-card]');
    const cardCount = await personnelCards.count();
    assert(cardCount >= 10, 'Must have at least 10 personnel cards rendered');
    console.log(`✓ Found ${cardCount} personnel cards`);

    // ตรวจสอบขนาดภาพถ่ายในการ์ดแรก (ต้องใหญ่กว่า 150px ทั้งความกว้างและความสูง)
    const firstCard = personnelCards.first();
    const firstImg = firstCard.locator('img[data-school-image]');
    assert(await firstImg.isVisible(), 'Personnel card image must be visible');
    const imgBox = await firstImg.boundingBox();
    console.log('First personnel image bounding box:', imgBox);
    assert(imgBox.width > 150, 'Personnel image width must be significantly larger than 64px');
    assert(imgBox.height > 180, 'Personnel image height must be significantly larger than 64px');

    await page.screenshot({ path: path.join(out, 'screenshot-personnel-grid.png') });
    console.log('✓ Captured screenshot-personnel-grid.png');

    // คลิกที่การ์ดเพื่อเปิดดูข้อมูลและภาพเต็มใน Modal
    await firstCard.click();
    await page.waitForTimeout(400);

    const modalBackdrop = page.locator('#globalModalBackdrop');
    assert(await modalBackdrop.isVisible(), 'Personnel detail modal must open on card click');

    const modalTitle = await page.locator('#globalModalTitle').innerText();
    assert(modalTitle.includes('เกียรติศักดิ์'), 'Modal title must display personnel name');

    const modalImg = modalBackdrop.locator('img[data-school-image]');
    assert(await modalImg.isVisible(), 'Modal must display large personnel photo');
    const modalImgBox = await modalImg.boundingBox();
    console.log('Modal personnel image bounding box:', modalImgBox);
    assert(modalImgBox.width > 200, 'Modal personnel image must be large');

    // ตรวจสอบข้อมูลใน Modal
    const modalBodyText = await modalBackdrop.innerText();
    assert(modalBodyText.includes('ผู้อำนวยการโรงเรียนชุมชนแม่ลาศึกษา'), 'Modal must display position');
    assert(modalBodyText.includes('คณะผู้บริหาร'), 'Modal must display department');
    assert(modalBodyText.includes('กศ.ม. (การบริหารการศึกษา)'), 'Modal must display education');
    assert(modalBodyText.includes('director@maela.ac.th'), 'Modal must display email');
    assert(modalBodyText.includes('101'), 'Modal must display phone extension');

    await page.screenshot({ path: path.join(out, 'screenshot-personnel-modal.png') });
    console.log('✓ Captured screenshot-personnel-modal.png');

    // ปิดโมดอล
    await page.locator('#btnClosePersonnelModal').click();
    await page.waitForTimeout(300);
    assert(await modalBackdrop.isHidden(), 'Modal must close when close button is clicked');
    console.log('✓ Personnel modal closes cleanly');

    console.log('\n🎉 ALL E2E BROWSER TESTS PASSED 100%!');
  } finally {
    await browser.close();
    server.close();
  }
})();
