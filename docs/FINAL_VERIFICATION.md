# Final Verification

ตรวจวันที่ 19 ตุลาคม 2026 — โรงเรียนชุมชนแม่ลาศึกษา

ผล `npm run verify:images`: **PASS — 92 checks / 72 route-and-view inspections** บน Desktop และ Mobile ไม่มี uncaught browser error, missing local resources หรือ horizontal overflow ในหน้าที่ตรวจ

ตัวอย่างธีมขาวไข่มุก–แดงสตรอว์เบอร์รีล่าสุด: [Desktop](theme-preview-desktop.webp) / [Mobile](theme-preview-mobile.webp)

## ผลงานที่ส่งมอบ

สร้างภาพด้วย built-in `image_gen.imagegen` จริง 15 แบบ คัดตรวจด้วย contact sheet และหน้าจอจริง แล้วบันทึกเป็น WebP หลัก 15 ไฟล์และ thumbnail 14 ไฟล์ รวม 29 ไฟล์ / 2,422,690 bytes (ประมาณ 2.31 MiB) ใน `public/images/placeholders/` ภาพ landscape 1200×800, thumbnail 480×320, avatar 256×256

| ภาพหลัก | ภาพขนาดเล็ก |
| --- | --- |
| `hero-school-entrance.webp` | `hero-school-entrance-thumb.webp` |
| `hero-primary-building.webp` | `hero-primary-building-thumb.webp` |
| `hero-secondary-building.webp` | `hero-secondary-building-thumb.webp` |
| `hero-flagpole-assembly.webp` | `hero-flagpole-assembly-thumb.webp` |
| `hero-classroom-learning.webp` | `hero-classroom-learning-thumb.webp` |
| `community-school-campus.webp` | `community-school-campus-thumb.webp` |
| `kindergarten-play-learning.webp` | `kindergarten-play-learning-thumb.webp` |
| `primary-reading-discovery.webp` | `primary-reading-discovery-thumb.webp` |
| `secondary-science-careers.webp` | `secondary-science-careers-thumb.webp` |
| `school-admissions-welcome.webp` | `school-admissions-welcome-thumb.webp` |
| `academic-achievement.webp` | `academic-achievement-thumb.webp` |
| `academic-term-planning.webp` | `academic-term-planning-thumb.webp` |
| `school-lunch-supplies.webp` | `school-lunch-supplies-thumb.webp` |
| `teacher-preparation.webp` | `teacher-preparation-thumb.webp` |
| `staff-neutral-avatar.webp` | ไม่จำเป็นสำหรับ avatar 64px |

ดู [ภาพสไลด์ใหม่ 5 แบบ](hero-slides-contact-sheet.webp), [คู่มือ Admin](HERO_SLIDESHOW_GUIDE.md), [ภาพชุดเดิม](placeholder-contact-sheet.webp), [Inventory](IMAGE_ASSET_INVENTORY.md), [คู่มือ](IMAGE_GENERATION_GUIDE.md), [Prompt set ทั้ง 15 ภาพ](image-generation-prompts.json) และ [Manifest พร้อมขนาด/bytes/SHA-256](IMAGE_ASSET_MANIFEST.json)

## หน้าที่ตรวจแล้ว

ตรวจด้วย Chrome headless ผ่าน Playwright บน Desktop 1440×1000 และ Mobile 375×812, device scale factor 1 ใช้เส้นทาง `/school/` จำลอง GitHub Pages project site

| Route / View | Desktop | Mobile | ขอบเขต |
| --- | --- | --- | --- |
| `#/home` | ผ่าน | ผ่าน | Hero ครบ 5 สไลด์ ทุก 3 วินาที พร้อมหยุด/เล่นและวนกลับ, การ์ดหลักสูตรทั้งสาม, ข่าวทุกหมวด, รูปผู้บริหาร, Popup |
| `#/about` | ผ่าน | ผ่าน | ภาพประกอบ campus และโครงสร้างหน้าเดิม |
| `#/academics` | ผ่าน | ผ่าน | สลับครบ kinder / primary / secondary พร้อมภาพตรงระดับชั้น |
| `#/personnel` | ผ่าน | ผ่าน | 10 avatars, ภาพจริงที่จำลองอัปโหลดมี priority ก่อนภาพ AI |
| `#/news` | ผ่าน | ผ่าน | ข่าวทั้ง 6 รายการ, 5 category filters, คลังปี 2568, detail modal ทั้ง 6 |
| `#/admissions` | ผ่าน | ผ่าน | ภาพต้อนรับและ layout ของฟอร์มเดิม |
| `#/services` | ผ่าน | ผ่าน | สลับตารางเรียนครบ 11 ระดับชั้น ไม่มีการเพิ่มภาพทับข้อมูล |
| `#/ita` | ผ่าน | ผ่าน | ตาราง เอกสาร และแบบร้องเรียนคงเดิม |
| `#/contact` | ผ่าน | ผ่าน | ข้อมูลติดต่อและฟอร์มคงเดิม ไม่มีแผนที่หรือสถานที่ปลอม |
| `#/admin` | ผ่าน | ผ่าน | Login และครบ 7 tabs: overview, news, banners, personnel, ita, calendar, inbox |
| CMS image workflows | ผ่าน | ผ่าน | Upload/Preview/Replace, edit without replacing, clear image, delete news record |

การตรวจฟอร์ม Admissions/Contact/ITA เป็นการตรวจการแสดงผล ไม่ส่งข้อมูลส่วนบุคคลหรือคำร้องไปปลายทางจริง

## การตรวจภาพและโค้ด

- ภาพทุกไฟล์ decode ได้และมีขนาดตามที่กำหนด Browser โหลดได้ทั้ง main และ thumbnail ผ่าน responsive srcset
- ภาพมี width/height, alt ตามเนื้อหา, object-fit: cover และขนาดแสดงผลไม่เป็นศูนย์ ทุกภาพ AI มีป้ายแยกใน UI; avatar ไม่มีใบหน้าและมีคำอธิบายว่าไม่ใช่บุคคลจริง
- Hero ใช้ eager / fetchpriority high, ภาพที่เปิดใน Popup/Detail/Preview เป็น eager และรูปเนื้อหาทั่วไป lazy
- Hero ปรับเป็นภาพวาดโรงเรียนเต็มพื้นที่พร้อมชั้นขาวไข่มุกและข้อความแดงเข้ม ลบลายตารางและกรอบภาพด้านข้างเดิม ตรวจการครอป ป้าย AI และลำดับชั้นข้อความทั้ง Desktop/Mobile แล้ว
- ปรับล่าสุดให้ชั้นขาวฟุ้งสิ้นสุดที่ 30% ของภาพ และตรวจซ้ำเฉพาะ Hero ทั้ง 5 สไลด์บน Desktop 1440px / Mobile 375px รวม 10 สถานะ ไม่พบ overflow หรือ JavaScript error
- ภาพอัปโหลดมาก่อนภาพสำรองทั้ง Hero, Popup, Personnel และ News และชื่อผู้บริหารหน้า Home อ้างอิง record เดียวกับภาพ
- ทดสอบข่าวที่มีเฉพาะ cover_url: แก้หัวข้อแล้วภาพเดิมยังอยู่; ทดสอบ Drive ID เดิมแล้วเลือกไฟล์ใหม่: Preview แสดงไฟล์ใหม่และการบันทึกล้าง Drive ID เก่า
- ล้างค่าภาพแล้วกลับไปแสดงภาพตามหมวด, ลบข่าวยังลบได้, ภาพ upload ที่โหลดผิดพลาดกลับไปภาพ AI พร้อมป้ายกำกับและไม่วนโหลดซ้ำ
- ไม่เขียน URL ของภาพสำรองลง CMS record และไม่เขียนทับภาพจริง
- ไม่พบ JavaScript error, missing local resources หรือ page-level horizontal overflow ในหน้าที่ตรวจ
- แก้การล้นจอเดิมของ utility bar และ header บนมือถือด้วย flex wrap / min-width / shrink เท่านั้น ไม่เปลี่ยน design tokens หรือโครงสร้างการนำทาง
- ตามคำขอปรับธีมสำหรับเด็กเล็ก เปลี่ยน palette กลางเป็นแดงสตรอว์เบอร์รี–คอรัล พร้อมพื้นชมพูอ่อน/ขาวไข่มุกทั้งเว็บ รวม public headers, statistics, footer, modal และ CMS โดยคง layout และ logic เดิม ตรวจ contrast ของคู่สีหลัก: ขาวบนปุ่มแดง 4.98:1, แดงบนชมพูอ่อน 4.57:1, หัวข้อบนชมพู 6.87:1 และข้อความ badge 5.31:1
- `git diff --check` ผ่าน; JavaScript inline สองส่วนและไฟล์ภายนอก parse ผ่าน; `Code.gs` เปลี่ยนเฉพาะ seed แบนเนอร์ของ Sheet ว่างเป็น 5 Hero + 1 Popup; API, authentication, `appsscript.json` และ Database Schema ไม่เปลี่ยน

## การตรวจสไลด์และ Admin เพิ่มเติม

- ทดสอบเวลาจริงว่าภาพเปลี่ยนเมื่อครบ 3 วินาที, pause หยุดการเลื่อน และภาพที่ 5 วนกลับภาพที่ 1
- ยืนยันว่า autoplay ไม่ render DOM ข่าวใหม่ และออกจาก Home แล้วล้าง timer
- ทดสอบ Admin เปลี่ยนภาพรายช่อง, แก้ข้อความโดยคงภาพเดิม, reload แล้วยังเห็นภาพที่บันทึก, ใช้ภาพ AI คืนเฉพาะสไลด์, และเปลี่ยนด้วย Drive URL
- จำลอง API upload ปฏิเสธ: record เดิมไม่เปลี่ยน; ลองใหม่สำเร็จ: บันทึก File ID ที่ API ส่งกลับ
- ทดสอบข้อมูลเก่า 2 แบนเนอร์: เติมให้ครบ 5 ตำแหน่งโดยคง ID, ข้อความ และภาพจริงเดิม ไม่เขียน metadata/UI placeholder ลง Sheet

## วิธีตรวจซ้ำและหลักฐาน

```sh
npm ci
npm run verify:images
```

ใช้ Chrome ที่ติดตั้งไว้ หรือ `npx playwright install chromium` หากไม่มี browser; สามารถกำหนด `CHROME_PATH` ได้ Script อยู่ที่ `scripts/verify-images.cjs` หลักฐาน screenshots และผล JSON จากการรันอยู่ใน `.verification/` และสรุปผลที่เก็บกับ repository อยู่ใน [verification-results.json](verification-results.json)

## Build และข้อจำกัด

โปรเจกต์นี้เป็น static HTML SPA ไม่มี Next.js, `next/image` หรือ production build command จึงตรวจ JavaScript syntax, raster decoding, asset loading และเส้นทางแบบ subdirectory ผ่าน browser จริงแทน ไม่อ้างว่ามี Next.js build ผ่าน

การทดสอบใช้ localStorage ใน browser context แยกและจำลองทั้ง Drive image response และ upload API แบบสำเร็จ/ปฏิเสธ เพื่อทดสอบ frontend ยังไม่ได้ทดสอบสิทธิ์ไฟล์ Google Drive หรือซิงก์ Google Sheets จริง เพราะโปรเจกต์ไม่ได้ตั้งค่า Web App URL และไม่มีการ deploy งานนี้

นำ `index.html`, `image-placeholders.js`, `hero-slideshow.js` และ `public/images/placeholders/` ขึ้น hosting พร้อมกันตามคู่มือที่ปรับแล้ว ไม่ต้องนำ node_modules หรือ `.verification/` ขึ้นเว็บไซต์
