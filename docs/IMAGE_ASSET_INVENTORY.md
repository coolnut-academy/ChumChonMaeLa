# Image Asset Inventory

## โลโก้ที่ผู้ใช้จัดเตรียม

ใช้ `public/LogoSchool.png` เป็นแหล่งเดียวสำหรับส่วนหัวทุกหน้า ท้ายเว็บ หน้าเข้าสู่ระบบ Admin และ favicon ส่งออกโลโก้โปร่งใส 40/48/64px พร้อมไฟล์ 2x ที่ 80/96/128px สำหรับ `srcset` ใน `public/images/branding/` ส่วนหัวแสดง 48px (มือถือ 40px), ท้ายเว็บ 40px, Admin 64px พร้อม ICO (16/32/48), PNG favicon (16/32), Apple (180) และ Android (192/512) รวม 12 ไฟล์ เป็นการย่อจากตราต้นฉบับ ไม่ใช่ภาพ AI; ไม่มีกรอบ เงา หรือพื้นหลังเพิ่ม ดู [SCHOOL_LOGO_GUIDE.md](SCHOOL_LOGO_GUIDE.md)

วันที่สำรวจ: 19 ตุลาคม 2026

## โครงสร้างและขอบเขต

- เว็บไซต์เป็น static hash-routed SPA ใน `index.html`; API และ Google Drive upload อยู่ใน `Code.gs` ไม่มี Next.js, `next/image`, package manifest หรือ build pipeline เดิม
- สำรวจ routes ทั้ง 10: `#/home`, `#/about`, `#/academics`, `#/personnel`, `#/news`, `#/admissions`, `#/services`, `#/ita`, `#/contact`, `#/admin` รวม news detail / announcement modals และแท็บ CMS
- ของเดิม: Hero 2 สไลด์, Popup, news covers ใช้ SVG data URL ที่สร้างด้วยโค้ด; personnel ใช้อักษรย่อเมื่อไม่มีภาพ ไม่มีไฟล์ภาพจริงใน repository ตอนเริ่มงาน
- SVG icons คงเดิม ส่วน UI ปรับตามคำขอผู้ใช้เป็นแดงสตรอว์เบอร์รี–คอรัลกับชมพูอ่อนและขาวไข่มุก Hero แสดงภาพล้วน 5 ภาพ ไม่มีข้อความหรือชั้นสีฟุ้งทับภาพ ปุ่มควบคุมและคำกำกับ AI อยู่ใต้ภาพ
- ตรวจพบ ImageGen Skill และ built-in `image_gen.imagegen` และทดลองเรียกสร้างภาพ campus สำเร็จ ใช้ built-in mode เท่านั้น

## ทิศทางภาพ

ภาพวาดดิจิทัลบรรยากาศโรงเรียนชุมชนไทย อบอุ่น เป็นมิตร เนื้อกระดาษบาง ๆ สี crimson / ivory / sage / slate เดิม ภาพบุคคลและสถานที่เป็นจินตนาการทั้งหมด ไม่จำลองใบหน้าบุคลากรจริง ไม่อ้างว่าเป็นภาพข่าวหรือสถานที่จริง ไม่มีตัวอักษร โลโก้ ตราราชการ หรือ watermark ภายในภาพ UI แสดงคำอธิบายภาพ AI แยกจากภาพและ alt ที่เหมาะสม

ธีม UI ล่าสุดใช้แดงสตรอว์เบอร์รี `#C83B56`, ชมพูอ่อน `#FFF2F4` / `#FFE4E9` และขาวไข่มุก `#F8FAFD` / `#F1F5FB` ให้เหมาะกับเด็กเล็ก ใช้พื้นอ่อนกับแถบหัวข้อ สถิติ Footer และ CMS แทนแผงแดงเข้ม ส่วนแดงเข้มสงวนสำหรับข้อความที่ต้องอ่านชัด ภาพ AI เดิมไม่ถูกแก้สีหรือสร้างใหม่

## รายการไฟล์และการใช้งาน

ไฟล์ทั้งหมดอยู่ที่ `public/images/placeholders/` ขนาดแสดงผลใช้ WebP; landscape 1200×800 (3:2) และ thumbnail 480×320; avatar 256×256 (1:1)

| Key / ชื่อไฟล์หลัก | ประเภท | เนื้อหา | ตำแหน่ง |
| --- | --- | --- | --- |
| hero-entrance / `hero-school-entrance.webp` | Hero background | ป้ายทางเข้าโรงเรียนสมมติ เว้นช่องข้อความในป้ายว่าง | สไลด์ 1 |
| hero-primary / `hero-primary-building.webp` | Hero background | อาคารประถมสีขาวไข่มุก 2 ชั้น | สไลด์ 2 |
| hero-secondary / `hero-secondary-building.webp` | Hero background | อาคารมัธยมสีขาวไข่มุก 3 ชั้น | สไลด์ 3 |
| hero-assembly / `hero-flagpole-assembly.webp` | Hero background | กิจกรรมหน้าเสาธงสมมติ ไม่ใช่เหตุการณ์จริง | สไลด์ 4 |
| hero-classroom / `hero-classroom-learning.webp` | Hero background | ครูและนักเรียนสมมติอ่านหนังสือและทดลองสื่อการเรียน | สไลด์ 5 |
| campus / `community-school-campus.webp` | Hero background / illustration | อาคารเรียนสมมติ หลังคาแดง สวนและลานโรงเรียน | Hero custom เพิ่มเติมที่ไม่มีประเภทเฉพาะ, About, ข่าว PR ทั่วไปที่ไม่มีภาพ |
| kinder / `kindergarten-play-learning.webp` | Card / Banner | เด็กปฐมวัยสมมติกับกิจกรรมบล็อกและศิลปะ | Home การ์ดอนุบาล, Academics ปฐมวัย, ข่าวกิจกรรมอนุบาล |
| primary / `primary-reading-discovery.webp` | Card / Banner | เด็กประถมอ่านหนังสือและเรียนรู้การคำนวณร่วมกัน | Home การ์ดประถม, Academics ประถม |
| secondary / `secondary-science-careers.webp` | Card / Banner | เด็กมัธยมทำโครงงานวิทยาศาสตร์ เทคโนโลยีและเกษตร | Home การ์ดมัธยม, Academics มัธยม |
| admissions / `school-admissions-welcome.webp` | Popup / Banner | ครูต้อนรับผู้ปกครองและเด็กสมมติ | Popup รับสมัคร, Admissions |
| award / `academic-achievement.webp` | Card / Thumbnail / Detail | ถ้วยรางวัล เหรียญ หนังสือและต้นอ่อนเชิงสัญลักษณ์ ไม่มีพิธีมอบรางวัล | ข่าว award, archived award และโมดอลรายละเอียด |
| academic / `academic-term-planning.webp` | Card / Thumbnail / Detail | สมุด แฟ้ม ปฏิทินว่างและอุปกรณ์การเรียน ไม่มีข้อความ | ข่าว academic และโมดอลรายละเอียด |
| procurement / `school-lunch-supplies.webp` | Card / Thumbnail / Detail | วัตถุดิบอาหารกลางวัน สมุดและแฟ้มจัดซื้อ ไม่มีเอกสารจริง | ข่าว procurement และโมดอลรายละเอียด |
| job / `teacher-preparation.webp` | Card / Thumbnail / Detail | โต๊ะเตรียมการสอน หนังสือและอุปกรณ์ครู ไม่อ้างบุคคลจริง | ข่าว job และโมดอลรายละเอียด |
| staff / `staff-neutral-avatar.webp` | Avatar | หุ่นครึ่งตัวสไตล์ดินปั้น ไม่มีใบหน้าหรือเพศระบุชัด | Personnel ทุกรายที่ยังไม่มีภาพจริง |

ชื่อ thumbnail เติม `-thumb` ก่อน `.webp` ใช้กับ cards; avatar ไม่มี thumbnail เพิ่ม ไม่ใช้ภาพเดียวแทนทุกหมวดข่าว

## หน้าที่ไม่มีช่องภาพจำเป็น

| หน้า/องค์ประกอบ | ผลการสำรวจ |
| --- | --- |
| Services | ตารางเรียน 11 ระดับชั้น และลิงก์บริการเป็นข้อมูลเชิงหน้าที่ ไม่มีช่องภาพขาดหาย ไม่เพิ่มภาพบังตาราง |
| ITA | ตารางเอกสาร แบบร้องเรียน และสรุปเอกสาร ไม่สร้างภาพแทนหลักฐานหรือ PDF |
| Contact | ที่อยู่และข้อมูลติดต่อพร้อมฟอร์ม ไม่มีแผนที่หรือช่องภาพสถานที่จริง ไม่สร้างแผนที่สมมติ |
| Admin | คงรายการและแบบฟอร์มเดิม เพิ่ม preview ภาพตามค่าฟอร์มใน News, Banners, Personnel |
| Header/Footer | คงเครื่องหมายและไอคอนเดิม ไม่สร้างตราโรงเรียนปลอม |

## Priority และระบบจัดการ

ใช้ URL ของภาพอัปโหลดที่ normalize แล้ว `uploadedImageUrl ?? placeholderImageUrl` โดย string ว่างถือว่าไม่มีภาพ, Drive ID เดิมยังใช้ thumbnail endpoint เดิม, data URLs และ URL ที่มีอยู่ยังรองรับ ไม่มี placeholder เขียนลงฐานข้อมูล และไม่มีการเปลี่ยน schema

คง News file input, Canvas WebP compression, การแก้ไขและลบ record, Banner/Personnel Drive ID และ backend `uploadDriveFile` เดิมทั้งหมด ภาพสำรองใช้เฉพาะชั้นแสดงผล เมื่อเก็บข่าวที่แก้ไขโดยไม่เปลี่ยนภาพต้องคง cover เดิม เมื่อเลือกไฟล์ใหม่ preview และภาพจริงที่บันทึกต้องใช้ไฟล์ใหม่ก่อน Drive ID เก่า

เส้นทางไฟล์เป็น `./public/images/placeholders/...` เพื่อรองรับ GitHub Pages ใน subdirectory และการเปิด index.html โดยตรง; `public/` ไม่ใช่ Next.js public root ในโปรเจกต์นี้ ต้อง deploy โฟลเดอร์นี้พร้อม index.html

Hero ล่าสุดใช้ `hero-slideshow.js` สลับภาพทุก 3 วินาที และมี editor แยก 5 ช่องใน Admin > แบนเนอร์ & Popup ดู [คู่มือ](HERO_SLIDESHOW_GUIDE.md) ภาพหลักทั้งหมด 15 แบบ / WebP 29 ไฟล์ รวม thumbnail
