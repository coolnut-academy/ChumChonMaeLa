const https = require('https');

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwHiT3_AYUEqyUevcCcRfG87AT9y_VWdwbrZJFVS2eyX6frtoi_3ucaFqeZc5eJ6UEZ/exec';

function getGAS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return getGAS(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    }).on('error', reject);
  });
}

function postGAS(url, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (echoRes) => {
          let echoData = '';
          echoRes.on('data', chunk => echoData += chunk);
          echoRes.on('end', () => {
            try {
              resolve(JSON.parse(echoData));
            } catch (e) {
              resolve({ raw: echoData, status: echoRes.statusCode });
            }
          });
        }).on('error', reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runFullCrudVerification() {
  console.log('====================================================');
  console.log('🚀 เริ่มต้นการทดสอบ CRUD แบบครบวงจร (Live Database Test)');
  console.log('เป้าหมาย: โรงเรียนชุมชนแม่ลาศึกษา');
  console.log('====================================================\n');

  // ขั้นตอนที่ 1: ดึงข้อมูลปัจจุบัน
  console.log('📌 ขั้นตอนที่ 1: ตรวจสอบการอ่านข้อมูล (Read)');
  const initial = await getGAS(GAS_URL + '?action=getPublicData&refresh=1');
  if (!initial || !initial.ok) {
    console.error('❌ ไม่สามารถอ่านข้อมูลได้:', initial);
    return;
  }
  const currentNews = Array.isArray(initial.news) ? initial.news : [];
  console.log(`✓ อ่านข้อมูลสำเร็จ: มีข่าวสารเดิมทั้งหมด ${currentNews.length} รายการ\n`);

  // ขั้นตอนที่ 2: ทดสอบเพิ่มข้อมูลใหม่ (Add)
  const testId = 'NW-TEST-' + Date.now();
  const testTitleOriginal = 'ทดสอบเพิ่มข่าวประชาสัมพันธ์โดยระบบอัตโนมัติ';
  console.log(`📌 ขั้นตอนที่ 2: ทดสอบเพิ่มข้อมูลใหม่ (Add) -> ID: ${testId}`);
  const newItem = {
    id: testId,
    academic_year: '2569',
    category: 'pr',
    title: testTitleOriginal,
    summary: 'ทดสอบบันทึกข้อมูลเข้า Google Sheets แบบเรียลไทม์',
    content_html: 'เนื้อหาข่าวทดสอบระบบ CRUD ของโรงเรียนชุมชนแม่ลาศึกษา',
    cover_drive_id: '',
    cover_url: '',
    pdf_drive_id: '',
    pdf_url: '',
    is_pinned: true,
    status: 'published',
    published_at: new Date().toISOString().slice(0, 10),
    author_name: 'ระบบทดสอบอัตโนมัติ'
  };

  const updatedNewsListWithNewItem = [newItem, ...currentNews];
  const addRes = await postGAS(GAS_URL, {
    action: 'syncDatabase',
    email: 'admin@maela.ac.th',
    password: 'maela2569',
    news: updatedNewsListWithNewItem
  });

  if (!addRes || !addRes.ok) {
    console.error('❌ เพิ่มข้อมูลไม่สำเร็จ:', addRes);
    return;
  }
  console.log('✓ ส่งคำสั่งเพิ่มข้อมูลขึ้น Google Sheets สำเร็จ');

  // ตรวจสอบว่าข่าวใหม่ปรากฏใน Read หรือไม่
  const verifyAdd = await getGAS(GAS_URL + '?action=getPublicData&refresh=1');
  const foundAdded = (verifyAdd.news || []).find(x => x.id === testId);
  if (foundAdded) {
    console.log(`✓ ยืนยันการเพิ่ม (ADD SUCCESS): พบรายการข่าว "${foundAdded.title}" ในฐานข้อมูลเรียบร้อย\n`);
  } else {
    console.error('❌ ไม่พบรายการข่าวที่เพิ่มในฐานข้อมูล');
    return;
  }

  // ขั้นตอนที่ 3: ทดสอบแก้ไขข้อมูล (Edit)
  const testTitleEdited = 'ทดสอบแก้ไขหัวข้อข่าวสาร (EDIT SUCCESS ' + new Date().toLocaleTimeString('th-TH') + ')';
  console.log(`📌 ขั้นตอนที่ 3: ทดสอบแก้ไขข้อมูลเดิม (Edit) -> เปลี่ยนหัวข้อเป็น "${testTitleEdited}"`);
  foundAdded.title = testTitleEdited;
  foundAdded.summary = 'เนื้อหาถูกอัปเดตและแก้ไขสำเร็จแล้ว';

  const editRes = await postGAS(GAS_URL, {
    action: 'syncDatabase',
    email: 'admin@maela.ac.th',
    password: 'maela2569',
    news: verifyAdd.news
  });

  if (!editRes || !editRes.ok) {
    console.error('❌ แก้ไขข้อมูลไม่สำเร็จ:', editRes);
    return;
  }
  console.log('✓ ส่งคำสั่งแก้ไขข้อมูลขึ้น Google Sheets สำเร็จ');

  const verifyEdit = await getGAS(GAS_URL + '?action=getPublicData&refresh=1');
  const foundEdited = (verifyEdit.news || []).find(x => x.id === testId);
  if (foundEdited && foundEdited.title === testTitleEdited) {
    console.log(`✓ ยืนยันการแก้ไข (EDIT SUCCESS): หัวข้อข่าวได้รับการแก้ไขตรงกัน 100%\n`);
  } else {
    console.error('❌ การแก้ไขไม่ตรงกับที่ส่งไป');
    return;
  }

  // ขั้นตอนที่ 4: ทดสอบลบข้อมูล (Delete)
  console.log(`📌 ขั้นตอนที่ 4: ทดสอบลบข้อมูล (Delete) -> ลบ ID: ${testId}`);
  const finalNewsList = (verifyEdit.news || []).filter(x => x.id !== testId);
  const deleteRes = await postGAS(GAS_URL, {
    action: 'syncDatabase',
    email: 'admin@maela.ac.th',
    password: 'maela2569',
    news: finalNewsList
  });

  if (!deleteRes || !deleteRes.ok) {
    console.error('❌ ลบข้อมูลไม่สำเร็จ:', deleteRes);
    return;
  }
  console.log('✓ ส่งคำสั่งลบข้อมูลขึ้น Google Sheets สำเร็จ');

  const verifyDelete = await getGAS(GAS_URL + '?action=getPublicData&refresh=1');
  const foundDeleted = (verifyDelete.news || []).find(x => x.id === testId);
  if (!foundDeleted) {
    console.log(`✓ ยืนยันการลบ (DELETE SUCCESS): รายการข่าวทดสอบถูกลบออกจาก Google Sheets เรียบร้อย 100%\n`);
  } else {
    console.error('❌ ข่าวยังคงค้างอยู่ในฐานข้อมูล');
    return;
  }

  console.log('====================================================');
  console.log('🎉 สรุปผลการทดสอบ: ระบบเชื่อมต่อข้อมูล Google Sheets');
  console.log('  1. อ่านข้อมูล (Read):   ผ่าน 100%');
  console.log('  2. เพิ่มข้อมูล (Add):     ผ่าน 100%');
  console.log('  3. แก้ไขข้อมูล (Edit):   ผ่าน 100%');
  console.log('  4. ลบข้อมูล (Delete):   ผ่าน 100%');
  console.log('====================================================');
}

runFullCrudVerification().catch(console.error);
