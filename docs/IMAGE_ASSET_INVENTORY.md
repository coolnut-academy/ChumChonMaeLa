# Image Asset Inventory

วันที่สำรวจ: 19 ตุลาคม 2026

## โครงสร้างและขอบเขต

- เว็บไซต์เป็น static hash-routed SPA ใน `index.html`; API และ Google Drive upload อยู่ใน `Code.gs` ไม่มี Next.js, `next/image`, package manifest หรือ build pipeline เดิม
- สำรวจ routes ทั้ง 10: `#/home`, `#/about`, `#/academics`, `#/personnel`, `#/news`, `#/admissions`, `#/services`, `#/ita`, `#/contact`, `#/admin` รวม news detail / announcement modals และแท็บ CMS
- ของเดิม: Hero 2 สไลด์, Popup, news covers ใช้ SVG data URL ที่สร้างด้วยโค้ด; personnel ใช้อักษรย่อเมื่อไม่มีภาพ ไม่มีไฟล์ภาพจริงใน repository ตอนเริ่มงาน
- CSS gradient, ลายจุดใน Hero, สีประจำโรงเรียน และ SVG icons เป็นองค์ประกอบ design system ไม่ใช่ช่องภาพถ่าย จึงคงไว้ ไม่ใช้แทนภาพ AI
- ตรวจพบ ImageGen Skill และ built-in `image_gen.imagegen` และทดลองเรียกสร้างภาพ campus สำเร็จ ใช้ built-in mode เท่านั้น

## ทิศทางภาพ

ภาพวาดดิจิทัลบรรยากาศโรงเรียนชุมชนไทย อบอุ่น เป็นมิตร เนื้อกระดาษบาง ๆ สี crimson / ivory / sage / slate เข้ากับแดง `#B91C1C` และขาวของเว็บไซต์ ภาพบุคคลและสถานที่เป็นจินตนาการทั้งหมด ไม่จำลองใบหน้าบุคลากรจริง ไม่อ้างว่าเป็นภาพข่าวหรือสถานที่จริง ไม่มีตัวอักษร โลโก้ ตราราชการ หรือ watermark ภายในภาพ UI แสดงคำอธิบายภาพ AI แยกจากภาพและ alt ที่เหมาะสม

## รายการไฟล์และการใช้งาน

ไฟล์ทั้งหมดอยู่ที่ `public/images/placeholders/` ขนาดแสดงผลใช้ WebP; landscape 1200×800 (3:2) และ thumbnail 480×320; avatar 256×256 (1:1)

| Key / ชื่อไฟล์หลัก | ประเภท | เนื้อหา | ตำแหน่ง |
| --- | --- | --- | --- |
| campus / `community-school-campus.webp` | Hero / illustration | อาคารเรียนสมมติ หลังคาแดง สวนและลานโรงเรียน | Home สไลด์ต้อนรับ, About, ข่าว PR ทั่วไปที่ไม่มีภาพ |
| kinder / `kindergarten-play-learning.webp` | Hero / Card / Banner | เด็กปฐมวัยสมมติกับกิจกรรมบล็อกและศิลปะ | Home สไลด์หลักสูตร, การ์ดอนุบาล, Academics ปฐมวัย, ข่าวกิจกรรมอนุบาล |
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
