# Responsive Verification

ตรวจวันที่ 19 ตุลาคม 2026 ด้วย Chrome ผ่าน Playwright ผล `npm run verify:responsive`: **332 checks / 122 views ผ่านทั้งหมด**

| ขนาด viewport | บริบท | ผล |
| --- | --- | --- |
| 320×740 | โทรศัพท์จอเล็ก แนวตั้ง | ผ่าน |
| 375×812 | โทรศัพท์ แนวตั้ง | ผ่าน |
| 390×844 | โทรศัพท์ แนวตั้ง | ผ่าน |
| 768×1024 | iPad แนวตั้ง | ผ่าน |
| 820×1180 | iPad แนวตั้ง | ผ่าน |
| 1024×1366 | iPad Pro แนวตั้ง | ผ่าน |
| 1440×1000 | Desktop | ผ่าน |

ตรวจครบ Home, About, Academics, Personnel, News, Admissions, Services, ITA, Contact, Admin และ Admin 7 tabs ทุกขนาดจอ รวมถึงสไลด์ทั้ง 5 ภาพและเมนูมือถือเมื่อเปิด

## การปรับที่ยืนยันแล้ว

- พื้นที่ภาพสไลด์ไม่มีหัวข้อ ป้าย คำอธิบาย CTA หรือสีขาวฟุ้ง ปุ่มควบคุมและคำกำกับ AI อยู่ใต้ภาพทั้งหมด
- ภาพสูงไม่เกิน 420px บน Desktop/Tablet และแสดงสัดส่วน 3:2 บนโทรศัพท์ ภาพอัปโหลดมีลำดับความสำคัญก่อนภาพ AI และ autoplay 3 วินาทียังทำงาน
- Header แยกแถวชื่อโรงเรียนกับปุ่มนำทาง ปุ่มแต่ละปุ่มไม่ตัดข้อความหรือขึ้นสองบรรทัด เมื่อไม่พอจะขึ้นแถวใหม่ทั้งปุ่ม
- มือถือใช้เมนูพับ เปิด/ปิดได้พร้อม aria-expanded และปิดหลังเลือกหน้า; iPad แสดงปุ่มครบแบบขึ้นแถวใหม่
- เมนูลัดเป็น 2 คอลัมน์บนมือถือ, 3 บนแท็บเล็ต และ 6 บน Desktop ไม่ซ้อนทับภาพ
- Input/Select/Textarea มี min-width: 0 และขนาดตัวอักษร 16px บนมือถือ ตารางกว้างเลื่อนเฉพาะภายใน container ได้
- ไม่พบ page-level horizontal overflow, ปุ่มล้น viewport หรือ uncaught JavaScript error

ทดสอบ regression ของภาพ/CMS/auto slideshow เพิ่มด้วย `npm run verify:images`: **92 checks / 72 views ผ่าน** รวม Upload, Preview, Replace, Reset, API upload ปฏิเสธ/สำเร็จแบบจำลอง และการรักษาข้อมูลเก่า

## ภาพตัวอย่างและหลักฐาน

[Desktop](theme-preview-desktop.webp) · [มือถือ](theme-preview-mobile.webp) · [iPad แนวตั้ง](theme-preview-ipad.webp) · [เมนูมือถือเมื่อเปิด](mobile-menu-preview.webp)

[ผล responsive แบบ JSON](responsive-results.json) และ [ผลภาพ/CMS แบบ JSON](verification-results.json) ส่วน screenshots ฉบับเต็มอยู่ใน `.verification/`

การตรวจใช้ viewport/touch emulation ใน Chrome ไม่ใช่การรันบนอุปกรณ์ iPad/Safari จริง ไม่มีการส่งฟอร์มสาธารณะหรือเปลี่ยนข้อมูลบนบริการ Google จริง

```sh
npm ci
npm run verify:images
npm run verify:responsive
```
