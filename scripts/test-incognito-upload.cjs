const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const sharp = require('sharp');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const testImagePath = path.join(root, 'test-personnel-generated.png');

// สร้าง HTTP Server จำลองโฮสต์เว็บเหมือนเปิดเซิร์ฟเวอร์จริง
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

async function generateTestPortrait() {
  const svg = `
    <svg width="600" height="800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#991B1B" />
          <stop offset="100%" stop-color="#B91C1C" />
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill="url(#grad)" />
      <circle cx="300" cy="280" r="140" fill="#FEF3C7" />
      <circle cx="250" cy="260" r="16" fill="#1E293B" />
      <circle cx="350" cy="260" r="16" fill="#1E293B" />
      <path d="M260,330 Q300,370 340,330" stroke="#B45309" stroke-width="8" fill="none" stroke-linecap="round" />
      <rect x="180" y="460" width="240" height="260" rx="30" fill="#FFFFFF" />
      <text x="300" y="580" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#991B1B" text-anchor="middle">TEACHER TEST</text>
      <text x="300" y="630" font-family="Arial, sans-serif" font-size="20" fill="#64748B" text-anchor="middle">CHUMCHON MAELA</text>
      <rect x="50" y="720" width="500" height="50" rx="10" fill="#FEE2E2" />
      <text x="300" y="752" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#991B1B" text-anchor="middle">LIVE E2E INCOGNITO TEST</text>
    </svg>
  `;
  await sharp(Buffer.from(svg)).png().toFile(testImagePath);
  console.log('✓ สร้างภาพถ่ายบุคลากรจำลองขนาด 600x800 (3:4) สำเร็จ:', testImagePath);
}

(async () => {
  console.log('================================================================');
  console.log('🚀 เริ่มการทดสอบ Gen ภาพ/ข้อความ + Normal Mode + Incognito Mode');
  console.log('================================================================\n');

  // 1. สร้างภาพจำลอง (Gen ภาพ)
  await generateTestPortrait();

  // 2. ข้อมูลจำลองบุคลากร (Gen text)
  const testTimestamp = Date.now();
  const testName = 'ดร.กิตติพงษ์ พัฒนวิทย์ ทดสอบระบบ Live E2E ' + testTimestamp;
  const testPos = 'ครูชำนาญการพิเศษ กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี';
  const testGroup = 'มัธยมศึกษาตอนต้น';
  const testEdu = 'ศษ.ด. การบริหารการศึกษา, วท.ม. วิทยาการคอมพิวเตอร์';
  const testEmail = 'kittipong.test@maela.ac.th';

  console.log('✓ สร้างข้อความจำลองบุคลากร:');
  console.log('   - ชื่อ:', testName);
  console.log('   - ตำแหน่ง:', testPos);
  console.log('   - สายงาน:', testGroup);
  console.log('   - วุฒิ:', testEdu);
  console.log('   - อีเมล:', testEmail);

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(chrome) ? { executablePath: chrome } : {})
  });

  let createdPersonnelRecord = null;
  let uploadedDriveFileId = '';

  try {
    // =========================================================================
    // ขั้นตอนที่ 1: Browser Mode ปกติ (บันทึกข้อมูลบุคลากรในหน้า Admin)
    // =========================================================================
    console.log('\n--- ขั้นตอนที่ 1: บันทึกข้อมูลผ่าน Browser Mode ปกติ (Admin CMS) ---');
    const normalContext = await browser.newContext({ viewport: { width: 1280, height: 850 } });
    const normalPage = await normalContext.newPage();

    await normalPage.goto(`${origin}/#/admin`);

    // เข้าสู่ระบบ Admin
    await normalPage.locator('#adminPassInput').fill('New1234');
    await normalPage.locator('#formAdminLogin button[type="submit"]').click();
    await normalPage.waitForSelector('[data-admin-tab="personnel"]');
    console.log('✓ เข้าสู่ระบบ Admin สำเร็จด้วยรหัส New1234');

    // ไปที่แท็บบุคลากร
    await normalPage.locator('[data-admin-tab="personnel"]').click();
    await normalPage.waitForSelector('#formAdminPerson');

    // กรอกฟอร์มบุคลากร
    await normalPage.locator('#psName').fill(testName);
    await normalPage.locator('#psPos').fill(testPos);
    await normalPage.locator('#psGroup').selectOption(testGroup);
    await normalPage.locator('#psEdu').fill(testEdu);
    await normalPage.locator('#psEmail').fill(testEmail);

    // ใส่ไฟล์ภาพที่ gen ขึ้นมา
    await normalPage.locator('#psFileInput').setInputFiles(testImagePath);

    // Crop Modal เด้งขึ้นมา
    await normalPage.waitForSelector('#imageCropperModal', { state: 'visible' });
    console.log('✓ Image Cropper Modal เปิดขึ้นมาเพื่อตัดภาพ 3:4');
    await normalPage.locator('#btnCropperConfirm').click();
    await normalPage.waitForSelector('#imageCropperModal', { state: 'hidden' });
    await normalPage.waitForTimeout(500);
    console.log('✓ กดยืนยันการครอปรูปภาพสำเร็จ');

    // ดักฟังการส่งข้อมูลไปยัง Google Apps Script
    let driveUploadDone = false;
    let sheetsSyncDone = false;

    normalPage.on('request', req => {
      if (req.url().includes('script.google.com')) {
        try {
          const body = JSON.parse(req.postData() || '{}');
          console.log(`  -> [Network Request] Action: ${body.action || 'GET'} (size: ${(req.postData() || '').length} bytes)`);
        } catch (e) {
          console.log('  -> [Network Request] GET / Non-JSON');
        }
      }
    });

    normalPage.on('response', async res => {
      const url = res.url();
      if ((url.includes('script.google') || url.includes('googleusercontent')) && res.status() === 200) {
        try {
          const json = await res.json();
          if (json.fileId) {
            driveUploadDone = true;
            uploadedDriveFileId = json.fileId;
            console.log(`  -> [Google Drive Response] ✓ อัปโหลดภาพสำเร็จ! File ID: ${uploadedDriveFileId}`);
          }
          if (json.message && json.message.includes('ฐานข้อมูล')) {
            sheetsSyncDone = true;
            console.log(`  -> [Google Sheets Response] ✓ ซิงก์ข้อมูลลงตารางสำเร็จ! (${json.message})`);
          }
        } catch (e) {}
      }
    });

    // กดปุ่มบันทึกข้อมูลบุคลากร
    console.log('✓ กำลังกดปุ่ม "บันทึกข้อมูลบุคลากร"...');
    await normalPage.locator('#formAdminPerson button[type="submit"]').click();

    // รอให้รายการปรากฏในการ์ดหน้ารายชื่อ (ให้เวลา Drive upload + Sheets sync)
    console.log('✓ รอระบบอัปโหลดภาพเข้า Google Drive และบันทึกเข้า Google Sheets...');
    await normalPage.getByText(testName).first().waitFor({ state: 'attached', timeout: 60000 });
    await normalPage.getByText(testName).first().scrollIntoViewIfNeeded();
    console.log('✓ รายชื่อบุคลากรใหม่ปรากฏในรายการของ Admin เรียบร้อย');

    // รอผลการซิงก์คลาวด์และ Drive upload
    const startSyncWait = Date.now();
    while ((!driveUploadDone || !sheetsSyncDone) && Date.now() - startSyncWait < 60000) {
      await normalPage.waitForTimeout(500);
      if (!driveUploadDone) {
        const liveId = await normalPage.evaluate((name) => {
          const rec = (window.state && window.state.db && window.state.db.personnel || []).find(p => p.full_name && p.full_name.includes(name));
          return rec ? rec.photo_drive_id : null;
        }, testName);
        if (liveId) {
          driveUploadDone = true;
          uploadedDriveFileId = liveId;
          console.log(`  -> [Live State Evaluation] ✓ พบ photo_drive_id ที่สร้างขึ้น: ${uploadedDriveFileId}`);
        }
      }
    }
    assert(driveUploadDone, 'Image must be uploaded to Google Drive with valid fileId returned');
    assert(sheetsSyncDone, 'Data must be synced to Google Sheets successfully');
    console.log('✓ ยืนยันสมบูรณ์: ภาพถูกส่งขึ้น Google Drive และข้อมูลถูกบันทึกขึ้น Google Sheets จริง 100%!');

    // ดึง Record ที่สร้างขึ้นมา
    createdPersonnelRecord = await normalPage.evaluate((name) => {
      // ค้นหา ID จากปุ่มลบ
      const delBtn = Array.from(document.querySelectorAll('[data-del-person]')).find(btn => {
        const parent = btn.closest('.p-3');
        return parent && parent.textContent.includes(name);
      });
      return delBtn ? { id: delBtn.getAttribute('data-del-person') } : null;
    }, testName);

    assert(createdPersonnelRecord && createdPersonnelRecord.id, 'Record ID must be found');
    console.log(`  -> ได้รับ ID ของข้อมูลบุคลากร: ${createdPersonnelRecord.id}`);

    await normalContext.close();

    // =========================================================================
    // ขั้นตอนที่ 2: Incognito Mode (โหมดไม่ระบุตัวตน / หน้าต่างใหม่ ไร้แคช ไร้ LocalStorage)
    // =========================================================================
    console.log('\n--- ขั้นตอนที่ 2: ตรวจสอบผ่าน Incognito Mode (Private / Anonymous Context) ---');
    const incognitoContext = await browser.newContext({
      viewport: { width: 1280, height: 850 },
      storageState: undefined // รับประกันว่าเป็น Session ใหม่เอี่ยม 100% ไม่มี LocalStorage ของเครื่อง
    });
    const incognitoPage = await incognitoContext.newPage();

    // เปิดหน้าทำเนียบบุคลากรในโหมด Incognito โดยตรง
    console.log(`✓ เปิดหน้า ${origin}/#/personnel ใน Incognito Mode...`);
    await incognitoPage.goto(`${origin}/#/personnel`);

    // รอให้ระบบ fetchFromGoogleSheetsApi ดึงข้อมูลสดจาก Google Sheets และเรนเดอร์การ์ด
    console.log('✓ รอข้อมูลสดที่ดึงมาจาก Google Sheets แสดงผลในหน้าเว็บ...');
    await incognitoPage.getByText(testName).first().waitFor({ timeout: 25000 });
    console.log('🎉 [INCOGNITO VERIFIED] พบข้อมูลบุคลากรในโหมด Incognito เรียบร้อยแล้ว!');

    // ตรวจสอบว่ารูปภาพของการ์ดบุคลากรคนนี้ โหลดมาจาก Google Drive จริง
    const photoUrlInIncognito = await incognitoPage.evaluate((name) => {
      const cards = Array.from(document.querySelectorAll('[data-person-card]'));
      const card = cards.find(c => c.textContent.includes(name));
      if (!card) return null;
      const img = card.querySelector('img');
      return img ? img.src : null;
    }, testName);

    console.log('✓ ลิงก์รูปภาพที่แสดงในการ์ดโหมด Incognito:', photoUrlInIncognito);
    assert(photoUrlInIncognito && (photoUrlInIncognito.includes('drive.google.com') || photoUrlInIncognito.includes(uploadedDriveFileId)),
      'Photo URL in incognito must come from Google Drive');
    console.log('✓ ยืนยัน 100%: รูปภาพดึงมาจาก Google Drive ถูกต้อง ไม่ได้มาจากเครื่องส่วนตัว!');

    await incognitoContext.close();

    // =========================================================================
    // ขั้นตอนที่ 3: ลบข้อมูลทดสอบทิ้ง (Cleanup Database)
    // =========================================================================
    console.log('\n--- ขั้นตอนที่ 3: ลบข้อมูลทดสอบออกจาก Google Sheets (Cleanup) ---');
    const cleanupContext = await browser.newContext({ viewport: { width: 1280, height: 850 } });
    const cleanupPage = await cleanupContext.newPage();

    await cleanupPage.goto(`${origin}/#/admin`);
    await cleanupPage.locator('#apiStatusLabel:has-text("เชื่อมต่อ Google Sheets แล้ว")').waitFor({ timeout: 30000 });
    await cleanupPage.locator('#adminPassInput').fill('New1234');
    await cleanupPage.locator('#formAdminLogin button[type="submit"]').click();
    await cleanupPage.waitForSelector('[data-admin-tab="personnel"]');
    await cleanupPage.locator('[data-admin-tab="personnel"]').click();
    await cleanupPage.waitForSelector('#formAdminPerson');

    // เตรียมตอบตกลง Confirm dialog
    cleanupPage.on('dialog', d => d.accept());

    let deleteSynced = false;
    cleanupPage.on('response', async res => {
      const url = res.url();
      if ((url.includes('script.google') || url.includes('googleusercontent')) && res.status() === 200) {
        try {
          const json = await res.json();
          if (json.message && json.message.includes('ฐานข้อมูล')) {
            deleteSynced = true;
            console.log('  -> [Google Sheets] ส่งคำสั่งลบข้อมูลออกจาก Sheet เรียบร้อยแล้ว');
          }
        } catch (e) {}
      }
    });

    const targetDeleteBtn = cleanupPage.locator(`[data-del-person="${createdPersonnelRecord.id}"]`);
    await targetDeleteBtn.waitFor({ state: 'attached', timeout: 30000 });
    await targetDeleteBtn.scrollIntoViewIfNeeded();
    assert(await targetDeleteBtn.isVisible(), 'Delete button for created record must be present');
    await targetDeleteBtn.click();

    const startDelWait = Date.now();
    while (!deleteSynced && Date.now() - startDelWait < 45000) {
      await cleanupPage.waitForTimeout(500);
    }
    assert(deleteSynced, 'Delete operation must be synced to Google Sheets');
    console.log('✓ ลบข้อมูลทดสอบออกจากฐานข้อมูล Google Sheets สำเร็จ 100%');

    await cleanupContext.close();

    // ตรวจสอบใน Incognito อีกครั้งเพื่อยืนยันว่าข้อมูลหายไปจริง
    const verifyContext = await browser.newContext();
    const verifyPage = await verifyContext.newPage();
    await verifyPage.goto(`${origin}/#/personnel`);
    await verifyPage.locator('#apiStatusLabel:has-text("เชื่อมต่อ Google Sheets แล้ว")').waitFor({ timeout: 30000 });
    await verifyPage.waitForTimeout(1000);
    const textAfterDelete = await verifyPage.textContent('body');
    assert(!textAfterDelete.includes(testName), 'Deleted test personnel must no longer exist in incognito');
    console.log('✓ ยืนยันใน Incognito: ข้อมูลถูกลบเกลี้ยงแล้ว ไม่หลงเหลือในระบบ');
    await verifyContext.close();

  } finally {
    await browser.close();
    server.close();

    // ลบไฟล์ภาพจำลองที่สร้างขึ้น
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('✓ ลบไฟล์ภาพชั่วคราว test-personnel-generated.png เรียบร้อย');
    }
    const debugFile = path.join(root, 'scripts', 'debug-submit.cjs');
    if (fs.existsSync(debugFile)) {
      fs.unlinkSync(debugFile);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 การทดสอบทุกขั้นตอนเสร็จสิ้นสมบูรณ์ 100%!');
  console.log('================================================================');
})().catch(err => {
  console.error('❌ เกิดข้อผิดพลาด:', err);
  process.exit(1);
});
