# Image Generation Guide

## เครื่องมือและผลงาน

ใช้ ImageGen Skill ที่ `C:/Users/Admin/.codex/skills/.system/imagegen/SKILL.md` และ built-in `image_gen.imagegen` จริงทั้งหมด 10 ครั้ง (หนึ่ง prompt ต่อภาพ) วันที่ 19 ตุลาคม 2026 ไม่ใช้ CLI/API fallback, ภาพ stock, SVG หรือ gradient เป็นภาพ AI แทน

- ภาพที่เลือกทั้งหมด 10 แบบ; WebP หลัก 10 ไฟล์ และ thumbnail 9 ไฟล์ อยู่ใน `public/images/placeholders/`
- [Contact sheet](placeholder-contact-sheet.webp) เรียงซ้ายไปขวา: campus, kindergarten, primary, secondary, admissions, achievement, academic planning, lunch procurement, teacher preparation, staff avatar
- [Prompt set ฉบับเต็ม](image-generation-prompts.json) เก็บข้อความจริงที่ส่งให้ image_gen แต่ละภาพ รวม style direction และข้อห้าม
- ภาพต้นฉบับ PNG ถูกเก็บใน Codex generated_images ตามค่าเริ่มต้นของ built-in tool; ไฟล์ WebP ที่เว็บไซต์ใช้ถูกบันทึกภายใน repository แล้ว ไม่ต้องพึ่งเครื่องมือหรือโฟลเดอร์ Codex เมื่อ deploy

## Art direction

ใช้ภาพวาดดิจิทัลแนว editorial ที่มองออกว่าเป็นภาพประกอบ แสงกลางวันอบอุ่น บรรยากาศโรงเรียนชุมชนไทย สีแดง crimson `#B91C1C`, ivory, sage และ slate ประกอบกับพื้นขาวและกรอบโค้งเดิม ภาพฉากสมมติใช้สเกลอาคารเรียนเรียบง่าย ไม่แต่งสถานที่เฉพาะที่ไม่มีข้อมูลยืนยัน

ภาพเด็ก ครูและผู้ปกครองเป็นตัวละครสมมติ สวมเสื้อผ้าสุภาพ ไม่มีชื่อ ตราหรืออัตลักษณ์จริง ภาพข่าวรางวัลใช้ still life เชิงสัญลักษณ์ ไม่สร้างภาพพิธีมอบรางวัลปลอม ภาพบุคลากรใช้หุ่นไร้ใบหน้าเดียวกันโดยตั้งใจ เพื่อไม่สร้างใบหน้ามาสวมชื่อบุคลากร และมีคำอธิบาย AI ใน UI / alt

ข้อห้ามใน prompt: no text, letters, numerals, logos, seals, watermark, identifiable real people, real campus or documentary event ภาพสัญลักษณ์อุปกรณ์เรียนและเอกสารต้องไม่มีข้อมูล ลายเซ็น หรือตราจริง หากสร้างใหม่แล้วพบตัวอักษรหรือรูปร่างผิด ให้สร้างใหม่ด้วย image_gen ไม่วาด SVG มาทดแทน

## การคัดเลือกและเตรียมไฟล์

ตรวจ contact sheet และภาพในหน้าจริงเรื่องความสอดคล้องของเนื้อหา สี การครอป และความเสี่ยงทำให้เข้าใจผิด ภาพ landscape ที่เลือกมีขนาดต้นฉบับ 1536×1024; avatar เป็นสี่เหลี่ยมจัตุรัส ย่อและเข้ารหัสด้วย Sharp โดยไม่วาดเติมเนื้อหาภาพ:

```js
await sharp(sourcePng)
  .resize(1200, 800, { fit: 'cover' })
  .webp({ quality: 82, effort: 6 })
  .toFile('public/images/placeholders/descriptive-name.webp');
await sharp(sourcePng)
  .resize(480, 320, { fit: 'cover' })
  .webp({ quality: 78, effort: 6 })
  .toFile('public/images/placeholders/descriptive-name-thumb.webp');
```

Avatar ใช้ 256×256, quality 82 ภาพใหม่ควรเก็บตัวแบบไว้ในส่วนกลางเพื่อรองรับ object-fit: cover และมีระยะปลอดภัยรอบศีรษะ วัตถุและใบหน้า ใช้ชื่อไฟล์สื่อเนื้อหา ไม่เขียนทับภาพจริงหรือไฟล์ที่ผู้ดูแลอัปโหลด

## การเชื่อมต่อกับ CMS

`image-placeholders.js` รวม registry, เลือกภาพตามหัวข้อ, URL normalization และ renderer ส่วน `index.html` ใช้ renderer ในจุดเดิม พร้อม preview ของ News/Banners/Personnel

```js
const uploadedImageUrl = resolveUploadedImageUrl(value);
const src = uploadedImageUrl ?? placeholderImageUrl(type);
```

String ว่าง/ช่องว่าง/null/undefined ถือว่ายังไม่มีภาพ รับ Drive file ID, Drive URL, uploaded data URL และ local URL ตามการใช้งานเดิม ภาพ upload ที่เข้าถึงไม่ได้ fallback เฉพาะใน DOM พร้อมเปิดป้าย AI ไม่มีการแก้ค่าภาพใน record และมี guard ไม่ให้โหลดซ้ำไม่จบ

รูปที่อัปโหลดสำเร็จไม่มีป้าย AI และไม่มี placeholder srcset มาทับ ส่วนภาพสำรองมี responsive srcset 480w/1200w, sizes, width/height, alt อธิบายว่าเป็นภาพวาด/สมมติ, decoding async และ lazy loading ยกเว้น Hero และภาพที่เพิ่งเปิดใน Popup/Detail/Preview เป็น eager; Hero มี fetchpriority high

Hero ใช้ภาพ campus เต็มพื้นหลัง พร้อมชั้นสีแดงโปร่งเพื่อให้อ่านข้อความชัด แทนลายตารางและกรอบภาพด้านข้างเดิม ภาพที่อัปโหลดในแต่ละสไลด์ยังมีลำดับความสำคัญก่อนภาพ campus และบนมือถือเลือกไฟล์ใหญ่พอสำหรับการครอปภาพแนวตั้ง

News ยังคง FileReader, Canvas compression เป็น WebP กว้างไม่เกิน 960px, เพิ่ม/แก้/ลบ record และ storage/sync เดิมไว้ การแก้ข้อความโดยไม่เปลี่ยนภาพคง cover เดิม และเลือกไฟล์ใหม่แล้วจะล้าง Drive ID เก่าเพื่อให้ภาพใหม่แสดงก่อน Preview ไม่เขียน placeholder ลง record สามารถล้างช่องรูปในฟอร์มแก้ข่าวเพื่อกลับไปใช้ภาพสำรอง

Banner และ Personnel ยังคงรับ Drive ID/URL และเพิ่ม/ลบรายการตามระบบเดิม ไม่มีการเปลี่ยน schema หรือเพิ่ม workflow upload ไป Drive ใหม่ Backend `Code.gs` รวม `uploadDriveFile`, permissions และ Database Schema ไม่ได้แก้ไข

About, curriculum cards/detail และ Admissions ไม่มีฟิลด์ upload เดิม จึงเป็นภาพประกอบ static ที่ชั้นแสดงผลเท่านั้น Services, ITA และ Contact คงตาราง เอกสาร แบบฟอร์มและข้อมูลติดต่อ ไม่มีการสร้างภาพปลอมแทนหลักฐานหรือแผนที่

## Deploy และตรวจสอบซ้ำ

Repository นี้เป็น static SPA ไม่มี Next.js และไม่มี build step ให้ส่ง `index.html`, `image-placeholders.js` และ `public/images/placeholders/` ขึ้น GitHub Pages พร้อมกัน ใช้ relative URL จึงรองรับ repository subdirectory และการเปิด HTML โดยตรง ไม่ควรอัปโหลดเพียง index.html ตามคู่มือรุ่นเก่า

เครื่องมือตรวจสอบเป็น dev dependencies เท่านั้น เว็บไซต์ที่ deploy ไม่โหลด Node.js, Playwright หรือ Sharp:

```sh
npm ci
npx playwright install chromium
npm run verify:images
```

บน Windows script ใช้ Chrome ที่ติดตั้งไว้ได้อัตโนมัติ หรือระบุ executable ด้วย `CHROME_PATH` การทดสอบเปิดเว็บบน localhost ใน browser context แยก และจำลอง Drive image responses เฉพาะเพื่อทดสอบ frontend ไม่ซิงก์หรือแก้ฐานข้อมูลจริง รายงาน JSON และภาพหน้าจออยู่ใน `.verification/` (gitignored)

ดูผลการตรวจจริงและข้อจำกัดใน [FINAL_VERIFICATION.md](FINAL_VERIFICATION.md)
