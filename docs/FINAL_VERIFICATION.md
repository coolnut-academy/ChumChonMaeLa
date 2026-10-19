# Final Verification

ตรวจวันที่ 19 ตุลาคม 2026 — โรงเรียนชุมชนแม่ลาศึกษา

ผล `npm run verify:images`: **PASS — 60 checks / 66 route-and-view inspections** บน Desktop และ Mobile ไม่มี uncaught browser error, missing local resources หรือ horizontal overflow ในหน้าที่ตรวจ

## ผลงานที่ส่งมอบ

สร้างภาพด้วย built-in `image_gen.imagegen` จริง 10 แบบ คัดตรวจด้วย contact sheet และหน้าจอจริง แล้วบันทึกเป็น WebP หลัก 10 ไฟล์และ thumbnail 9 ไฟล์ รวม 19 ไฟล์ / 1,443,950 bytes (ประมาณ 1.38 MiB) ใน `public/images/placeholders/` ภาพ landscape 1200×800, thumbnail 480×320, avatar 256×256

| ภาพหลัก | ภาพขนาดเล็ก |
| --- | --- |
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

ดู [ภาพรวมทั้งหมด](placeholder-contact-sheet.webp), [Inventory](IMAGE_ASSET_INVENTORY.md), [คู่มือ](IMAGE_GENERATION_GUIDE.md), [Prompt set ทั้ง 10 ภาพ](image-generation-prompts.json) และ [Manifest พร้อมขนาด/bytes/SHA-256](IMAGE_ASSET_MANIFEST.json)

## หน้าที่ตรวจแล้ว

ตรวจด้วย Chrome headless ผ่าน Playwright บน Desktop 1440×1000 และ Mobile 375×812, device scale factor 1 ใช้เส้นทาง `/school/` จำลอง GitHub Pages project site

| Route / View | Desktop | Mobile | ขอบเขต |
| --- | --- | --- | --- |
| `#/home` | ผ่าน | ผ่าน | Hero ทั้งสองสไลด์, การ์ดหลักสูตรทั้งสาม, ข่าวทุกหมวด, รูปผู้บริหาร, Popup |
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
- ภาพอัปโหลดมาก่อนภาพสำรองทั้ง Hero, Popup, Personnel และ News และชื่อผู้บริหารหน้า Home อ้างอิง record เดียวกับภาพ
- ทดสอบข่าวที่มีเฉพาะ cover_url: แก้หัวข้อแล้วภาพเดิมยังอยู่; ทดสอบ Drive ID เดิมแล้วเลือกไฟล์ใหม่: Preview แสดงไฟล์ใหม่และการบันทึกล้าง Drive ID เก่า
- ล้างค่าภาพแล้วกลับไปแสดงภาพตามหมวด, ลบข่าวยังลบได้, ภาพ upload ที่โหลดผิดพลาดกลับไปภาพ AI พร้อมป้ายกำกับและไม่วนโหลดซ้ำ
- ไม่เขียน URL ของภาพสำรองลง CMS record และไม่เขียนทับภาพจริง
- ไม่พบ JavaScript error, missing local resources หรือ page-level horizontal overflow ในหน้าที่ตรวจ
- แก้การล้นจอเดิมของ utility bar และ header บนมือถือด้วย flex wrap / min-width / shrink เท่านั้น ไม่เปลี่ยน design tokens หรือโครงสร้างการนำทาง
- `git diff --check` ผ่าน; JavaScript inline สองส่วนและไฟล์ภายนอก parse ผ่าน; `Code.gs`, `appsscript.json` และ Database Schema ไม่ได้แก้ไข

## วิธีตรวจซ้ำและหลักฐาน

```sh
npm ci
npm run verify:images
```

ใช้ Chrome ที่ติดตั้งไว้ หรือ `npx playwright install chromium` หากไม่มี browser; สามารถกำหนด `CHROME_PATH` ได้ Script อยู่ที่ `scripts/verify-images.cjs` หลักฐาน screenshots และผล JSON จากการรันอยู่ใน `.verification/` และสรุปผลที่เก็บกับ repository อยู่ใน [verification-results.json](verification-results.json)

## Build และข้อจำกัด

โปรเจกต์นี้เป็น static HTML SPA ไม่มี Next.js, `next/image` หรือ production build command จึงตรวจ JavaScript syntax, raster decoding, asset loading และเส้นทางแบบ subdirectory ผ่าน browser จริงแทน ไม่อ้างว่ามี Next.js build ผ่าน

การทดสอบใช้ localStorage ใน browser context แยกและจำลอง Drive image response เพื่อพิสูจน์ frontend priority เท่านั้น ยังไม่ได้ทดสอบสิทธิ์ไฟล์ Google Drive หรือซิงก์ Google Sheets จริง เพราะโปรเจกต์ไม่ได้ตั้งค่า Web App URL และไม่มีการ deploy งานนี้

นำ `index.html`, `image-placeholders.js` และ `public/images/placeholders/` ขึ้น hosting พร้อมกันตามคู่มือที่ปรับแล้ว ไม่ต้องนำ node_modules หรือ `.verification/` ขึ้นเว็บไซต์
