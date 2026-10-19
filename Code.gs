/**
 * ============================================================================
 * ระบบบริหารจัดการเว็บไซต์ โรงเรียนชุมชนแม่ลาศึกษา (Chumchon Maela Suksa School)
 * Backend API: Google Apps Script + Google Sheets (Database) + Google Drive (Storage)
 * ระดับชั้นที่เปิดสอน: อนุบาล 2 ถึง มัธยมศึกษาปีที่ 3 (โรงเรียนขยายโอกาสทางการศึกษา)
 * ============================================================================
 *
 * วิธีติดตั้งครั้งแรก:
 * 1. สร้างไฟล์ Google Sheets ใหม่ ตั้งชื่อว่า "Database_เว็บโรงเรียนชุมชนแม่ลาศึกษา"
 * 2. ไปที่เมนู ส่วนขยาย (Extensions) > Apps Script
 * 3. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดในไฟล์ Code.gs นี้ลงไป กดบันทึก (Save)
 * 4. เลือกฟังก์ชัน "setupDatabaseAndDrive" จากแถบด้านบน แล้วกดปุ่ม "เรียกใช้ (Run)"
 *    ระบบจะสร้างตารางทั้ง 8 แท็บ พร้อมข้อมูลเริ่มต้น และสร้างโฟลเดอร์ใน Google Drive ให้อัตโนมัติ
 * 5. กดปุ่ม "ทำให้ใช้งานได้ (Deploy)" > "การทำให้ใช้งานได้รายการใหม่ (New deployment)"
 *    - ประเภท: เว็บแอป (Web app)
 *    - ดำเนินการในฐานะ (Execute as): ฉัน (Me)
 *    - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): ทุกคน (Anyone)
 * 6. คัดลอก Web App URL ไปใส่ในหน้า Admin (#/admin) ของไฟล์ index.html
 */

const CACHE_TTL_SECONDS = 900; // แคชข้อมูล JSON นาน 15 นาที (900 วินาที)
const CACHE_KEY_MAIN = 'MAELA_CMS_PUBLIC_DATA_V1';
const STORAGE_ROOT_FOLDER_NAME = 'Maela_School_Website_Storage';

const SHEET_NAMES = {
  CONFIG: 'Site_Config',
  BANNERS: 'Banners_Popups',
  NEWS: 'News_Posts',
  PERSONNEL: 'Personnel',
  CALENDAR: 'Calendar_Events',
  ITA: 'ITA_Documents',
  INBOX: 'Complaints_Inbox',
  ADMINS: 'Admin_Users'
};

/**
 * 1. ฟังก์ชันติดตั้งฐานข้อมูล Google Sheets และโฟลเดอร์ Google Drive อัตโนมัติ
 * กด Run ครั้งแรกเพียงครั้งเดียว
 */
function setupDatabaseAndDrive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // สร้างโฟลเดอร์หลักและโฟลเดอร์ย่อยใน Google Drive
  const folderMap = ensureDriveFolders_();

  // 1.1 แท็บ Site_Config
  const configSheet = ensureSheet_(ss, SHEET_NAMES.CONFIG, [
    'key', 'value_th', 'value_en', 'description', 'updated_at'
  ]);
  if (configSheet.getLastRow() === 1) {
    const now = new Date().toISOString();
    configSheet.getRange(2, 1, 18, 5).setValues([
      ['school_name_th', 'โรงเรียนชุมชนแม่ลาศึกษา', 'Chumchon Maela Suksa School', 'ชื่อโรงเรียน', now],
      ['school_type', 'โรงเรียนขยายโอกาสทางการศึกษา (อนุบาล 2 - มัธยมศึกษาปีที่ 3)', 'Opportunity Expansion School (K2 - Grade 9)', 'ประเภทสถานศึกษา', now],
      ['affiliation', 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.) กระทรวงศึกษาธิการ', 'OBEC, Ministry of Education', 'สังกัด', now],
      ['motto', 'ความรู้คู่คุณธรรม นำชุมชนพัฒนา ก้าวหน้าด้วยเทคโนโลยี', 'Knowledge with Virtue, Developing Community, Advancing with Technology', 'คำขวัญโรงเรียน', now],
      ['colors', 'สีแดง - สีขาว (แดง: ความมุ่งมั่นและพลังสร้างสรรค์ / ขาว: ความบริสุทธิ์และคุณธรรม)', 'Red & White', 'สีประจำโรงเรียน', now],
      ['academic_year', '2569', '2026', 'ปีการศึกษาปัจจุบัน', now],
      ['ticker_text', 'ประกาศ: เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2569 ระดับชั้นอนุบาล 2, ประถมศึกษาปีที่ 1 และมัธยมศึกษาปีที่ 1 (เรียนฟรี 15 ปีอย่างมีคุณภาพ)', 'Admissions Open for Academic Year 2026 (K2 - M3)', 'ข้อความแถบประกาศวิ่งด้านบน', now],
      ['stat_students', '485', '485', 'จำนวนนักเรียนทั้งหมด (อ.2 - ม.3)', now],
      ['stat_teachers', '34', '34', 'จำนวนข้าราชการครูและบุคลากรทางการศึกษา', now],
      ['stat_classrooms', '17', '17', 'จำนวนห้องเรียนทั้งหมด (อ.2 ถึง ม.3)', now],
      ['stat_awards', '42', '42', 'รางวัลความสำเร็จระดับเขตพื้นที่และระดับชาติ', now],
      ['phone', '053-000-XXX, 089-XXX-XXXX', '+66 53 000 XXX', 'เบอร์โทรศัพท์ติดต่อ', now],
      ['email', 'saraban@maela.ac.th', 'saraban@maela.ac.th', 'อีเมลโรงเรียน', now],
      ['address', 'โรงเรียนชุมชนแม่ลาศึกษา หมู่ที่ 1 ตำบลแม่ลา (พื้นที่บริการชุมชนแม่ลา)', 'Chumchon Maela Suksa School', 'ที่อยู่โรงเรียน', now],
      ['facebook_url', 'https://www.facebook.com/', 'https://www.facebook.com/', 'ลิงก์เพจ Facebook ประชาสัมพันธ์', now],
      ['drive_root_folder_id', folderMap.rootId, folderMap.rootId, 'รหัสโฟลเดอร์หลัก Google Drive', now],
      ['drive_news_folder_id', folderMap.newsId, folderMap.newsId, 'รหัสโฟลเดอร์เก็บรูปข่าว', now],
      ['drive_ita_folder_id', folderMap.itaId, folderMap.itaId, 'รหัสโฟลเดอร์เก็บไฟล์ PDF/ITA', now]
    ]);
  }

  // 1.2 แท็บ Banners_Popups
  const bannerSheet = ensureSheet_(ss, SHEET_NAMES.BANNERS, [
    'id', 'type', 'title', 'subtitle', 'badge', 'cta_text', 'cta_link', 'drive_image_id', 'image_url', 'sort_order', 'start_date', 'end_date', 'is_active'
  ]);
  if (bannerSheet.getLastRow() === 1) {
    bannerSheet.getRange(2, 1, 3, 13).setValues([
      ['BN-01', 'hero', 'ยินดีต้อนรับสู่ โรงเรียนชุมชนแม่ลาศึกษา', 'สถานศึกษาขยายโอกาสทางการศึกษาต้นแบบ จัดการเรียนรู้ตั้งแต่ระดับชั้นอนุบาล 2 ถึงมัธยมศึกษาปีที่ 3 มุ่งพัฒนาผู้เรียนให้มีความรู้คู่คุณธรรมและทักษะอาชีพ', 'ปีการศึกษา 2569', 'ดูข้อมูลการรับสมัครนักเรียน', '#/admissions', '', '', 1, '2026-01-01', '2027-12-31', true],
      ['BN-02', 'hero', 'พัฒนาครบทุกช่วงวัย อนุบาล 2 - มัธยมศึกษาปีที่ 3', 'ปฐมวัยเน้นพัฒนาการ 4 ด้าน | ประถมศึกษาเน้นอ่านออกเขียนได้ คิดวิเคราะห์เป็น | มัธยมต้นเน้นวิชาการเข้มข้นควบคู่ทักษะอาชีพและดิจิทัล', 'หลักสูตรสถานศึกษา', 'สำรวจหลักสูตร 3 ระดับชั้น', '#/academics', '', '', 2, '2026-01-01', '2027-12-31', true],
      ['BN-03', 'popup', 'เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2569 (อ.2 - ม.3)', 'รับสมัครนักเรียนระดับชั้นอนุบาล 2, ป.1 และ ม.1 พร้อมสวัสดิการเรียนฟรี 15 ปี อาหารกลางวัน นมโรงเรียน และอุปกรณ์การเรียนครบครัน', 'ประกาศสำคัญ', 'กรอกแบบฟอร์มแจ้งความจำนง', '#/admissions', '', '', 1, '2026-01-01', '2027-05-31', true]
    ]);
  }

  // 1.3 แท็บ News_Posts
  const newsSheet = ensureSheet_(ss, SHEET_NAMES.NEWS, [
    'id', 'academic_year', 'category', 'title', 'summary', 'content_html', 'cover_drive_id', 'cover_url', 'pdf_drive_id', 'pdf_url', 'is_pinned', 'status', 'published_at', 'author_name'
  ]);
  if (newsSheet.getLastRow() === 1) {
    newsSheet.getRange(2, 1, 5, 14).setValues([
      ['NW-2569-01', '2569', 'award', 'นักเรียนชั้น ม.1-ม.3 คว้ารางวัลเหรียญทอง การแข่งขันทักษะวิชาการและงานอาชีพ งานศิลปหัตถกรรมนักเรียน', 'ตัวแทนนักเรียนระดับมัธยมศึกษาตอนต้น โรงเรียนชุมชนแม่ลาศึกษา คว้า 5 เหรียญทองจากการแข่งขันโครงงานวิทยาศาสตร์ คอมพิวเตอร์ และทักษะงานอาชีพ', 'โรงเรียนชุมชนแม่ลาศึกษา ขอแสดงความยินดีกับนักเรียนระดับชั้นมัธยมศึกษาปีที่ 1-3 และคณะครูผู้ฝึกสอน ที่ได้รับรางวัลชนะเลิศเหรียญทอง การแข่งขันทักษะวิชาการงานศิลปหัตถกรรมนักเรียน ประจำปีการศึกษา 2569 ทั้งในกลุ่มสาระวิทยาศาสตร์และเทคโนโลยี และการงานอาชีพ', '', '', '', '', true, 'published', '2026-10-15', 'งานประชาสัมพันธ์'],
      ['NW-2569-02', '2569', 'pr', 'กิจกรรมพัฒนาทักษะ EF และ Play-Based Learning ของนักเรียนระดับชั้นอนุบาล 2 - อนุบาล 3', 'การจัดประสบการณ์การเรียนรู้ปฐมวัยผ่านการเล่นและลงมือปฏิบัติจริง เสริมสร้างพัฒนาการทั้งด้านร่างกาย อารมณ์ จิตใจ สังคม และสติปัญญา', 'สายชั้นปฐมวัย โรงเรียนชุมชนแม่ลาศึกษา จัดกิจกรรมส่งเสริมพัฒนาการทั้ง 4 ด้านสำหรับนักเรียนชั้นอนุบาล 2 และอนุบาล 3 พร้อมโครงการอาหารกลางวันและนมโรงเรียนตามหลักโภชนาการ', '', '', '', '', true, 'published', '2026-10-10', 'สายชั้นปฐมวัย'],
      ['NW-2569-03', '2569', 'academic', 'ประกาศตารางเรียนและปฏิทินวิชาการ ภาคเรียนที่ 2 ปีการศึกษา 2569 (ระดับชั้น ป.1 - ม.3)', 'แจ้งกำหนดการเปิดภาคเรียนที่ 2/2569 ตารางเรียนรายห้อง และกำหนดการประเมินความสามารถด้านการอ่าน (RT) และการทดสอบ NT / O-NET', 'ฝ่ายวิชาการ โรงเรียนชุมชนแม่ลาศึกษา ขอแจ้งกำหนดการเปิดภาคเรียนที่ 2 ปีการศึกษา 2569 และตารางการจัดการเรียนการสอนสำหรับนักเรียนระดับประถมศึกษา (ป.1-ป.6) และมัธยมศึกษาตอนต้น (ม.1-ม.3)', '', '', '', '', true, 'published', '2026-10-05', 'กลุ่มบริหารงานวิชาการ'],
      ['NW-2569-04', '2569', 'procurement', 'ประกาศผลผู้ชนะการจัดซื้อจัดจ้างโครงการอาหารกลางวันนักเรียนและวัสดุการศึกษา ประจำภาคเรียนที่ 2/2569', 'โรงเรียนชุมชนแม่ลาศึกษา ประกาศผลผู้ชนะการเสนอราคาจัดซื้อวัตถุดิบอาหารกลางวันและสื่อการเรียนการสอน ตามระเบียบกระทรวงการคลัง', 'กลุ่มบริหารงานงบประมาณและงานพัสดุ โรงเรียนชุมชนแม่ลาศึกษา ขอเผยแพร่ประกาศผลผู้ชนะการจัดซื้อจัดจ้างประจำภาคเรียนที่ 2 ปีการศึกษา 2569 เพื่อความโปร่งใสตามเกณฑ์ ITA', '', '', '', '', false, 'published', '2026-10-01', 'กลุ่มบริหารงานงบประมาณ'],
      ['NW-2569-05', '2569', 'job', 'ประกาศรับสมัครคัดเลือกครูอัตราจ้าง วิชาเอกภาษาอังกฤษ หรือประถมศึกษา จำนวน 1 อัตรา', 'เปิดรับสมัครผู้มีวุฒิปริญญาตรีทางการศึกษาและมีใบอนุญาตประกอบวิชาชีพครู เพื่อปฏิบัติหน้าที่สอนในระดับประถมศึกษาและมัธยมศึกษาตอนต้น', 'กลุ่มบริหารงานบุคคล โรงเรียนชุมชนแม่ลาศึกษา เปิดรับสมัครบุคคลเพื่อคัดเลือกเป็นลูกจ้างชั่วคราว ตำแหน่งครูผู้สอน 1 อัตรา ผู้สนใจสามารถดาวน์โหลดระเบียบการและยื่นใบสมัครได้ที่ห้องธุรการโรงเรียน', '', '', '', '', false, 'published', '2026-09-25', 'กลุ่มบริหารงานบุคคล']
    ]);
  }

  // 1.4 แท็บ Personnel
  const personnelSheet = ensureSheet_(ss, SHEET_NAMES.PERSONNEL, [
    'id', 'full_name', 'position', 'department', 'level_group', 'education', 'email', 'phone_ext', 'photo_drive_id', 'photo_url', 'sort_order', 'status'
  ]);
  if (personnelSheet.getLastRow() === 1) {
    personnelSheet.getRange(2, 1, 6, 12).setValues([
      ['PS-01', 'นายเกียรติศักดิ์ แม่ลาพัฒนา', 'ผู้อำนวยการโรงเรียนชุมชนแม่ลาศึกษา', 'คณะผู้บริหาร', 'ผู้บริหารสถานศึกษา', 'กศ.ม. (การบริหารการศึกษา)', 'director@maela.ac.th', '101', '', '', 1, 'active'],
      ['PS-02', 'นางสาวกานดา รักการเรียน', 'รองผู้อำนวยการโรงเรียน (ฝ่ายวิชาการและแผนงาน)', 'คณะผู้บริหาร', 'ผู้บริหารสถานศึกษา', 'ค.ม. (หลักสูตรและการสอน)', 'academic@maela.ac.th', '102', '', '', 2, 'active'],
      ['PS-03', 'นางพรทิพย์ อ่อนโยน', 'หัวหน้าสายชั้นปฐมวัย (ครูชำนาญการพิเศษ)', 'สายชั้นปฐมวัย (อ.2 - อ.3)', 'ปฐมวัย', 'ศษ.บ. (การศึกษาปฐมวัย)', 'kinder@maela.ac.th', '201', '', '', 3, 'active'],
      ['PS-04', 'นายสมชาย เพียรศึกษา', 'หัวหน้าสายชั้นประถมศึกษา / ครูภาษาไทยและคณิตศาสตร์', 'สายชั้นประถมศึกษา (ป.1 - ป.6)', 'ประถมศึกษา', 'ค.บ. (ประถมศึกษา)', 'primary@maela.ac.th', '301', '', '', 4, 'active'],
      ['PS-05', 'ว่าที่ร้อยตรี พัชรพล วิทยาการ', 'หัวหน้าสายชั้นมัธยมศึกษาตอนต้น / ครูวิทยาศาสตร์และเทคโนโลยี', 'สายชั้นมัธยมศึกษา (ม.1 - ม.3)', 'มัธยมศึกษาตอนต้น', 'วท.บ. (วิทยาการคอมพิวเตอร์), ป.บัณฑิตวิชาชีพครู', 'secondary@maela.ac.th', '401', '', '', 5, 'active'],
      ['PS-06', 'นางสาวมณีรัตน์ งานดี', 'เจ้าพนักงานธุรการโรงเรียน', 'ฝ่ายสนับสนุนและธุรการ', 'สายสนับสนุน', 'บธ.บ. (การจัดการสำนักงาน)', 'office@maela.ac.th', '100', '', '', 6, 'active']
    ]);
  }

  // 1.5 แท็บ Calendar_Events
  const calSheet = ensureSheet_(ss, SHEET_NAMES.CALENDAR, [
    'id', 'academic_year', 'semester', 'title', 'start_date', 'end_date', 'category', 'target_level', 'description'
  ]);
  if (calSheet.getLastRow() === 1) {
    calSheet.getRange(2, 1, 4, 9).setValues([
      ['EV-01', '2569', '2', 'วันเปิดภาคเรียนที่ 2 ปีการศึกษา 2569 และประชุมผู้ปกครองนักเรียน (อ.2 - ม.3)', '2026-11-02', '2026-11-02', 'academic', 'ทุกระดับชั้น (อ.2 - ม.3)', 'ประชุมผู้ปกครองภาคเรียนที่ 2/2569 และรับเงินอุดหนุนปัจจัยพื้นฐานนักเรียนยากจน/ค่าอุปกรณ์การเรียน'],
      ['EV-02', '2569', '2', 'กิจกรรมกีฬาสีภายใน "แม่ลาเกมส์" ประจำปีการศึกษา 2569', '2026-12-18', '2026-12-19', 'activity', 'ทุกระดับชั้น (อ.2 - ม.3)', 'การแข่งขันทักษะกีฬา กรีฑา และขบวนพาเหรดสร้างความสามัคคีระหว่างโรงเรียนและชุมชนแม่ลา'],
      ['EV-03', '2569', '2', 'การประเมินความสามารถด้านการอ่าน (RT ชั้น ป.1) และทดสอบความสามารถพื้นฐาน (NT ชั้น ป.3)', '2027-02-10', '2027-02-24', 'exam', 'ประถมศึกษา (ป.1 และ ป.3)', 'การประเมินคุณภาพผู้เรียนระดับชาติสำหรับนักเรียนชั้นประถมศึกษาปีที่ 1 และชั้นประถมศึกษาปีที่ 3'],
      ['EV-04', '2569', '2', 'การทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET) ชั้น ป.6 และ ชั้น ม.3', '2027-02-13', '2027-02-21', 'exam', 'ชั้น ป.6 และ ชั้น ม.3', 'การสอบ O-NET และกิจกรรมแนะแนวศึกษาต่อสำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3']
    ]);
  }

  // 1.6 แท็บ ITA_Documents
  const itaSheet = ensureSheet_(ss, SHEET_NAMES.ITA, [
    'id', 'fiscal_year', 'oit_code', 'category', 'title', 'drive_file_id', 'file_url', 'updated_at', 'status'
  ]);
  if (itaSheet.getLastRow() === 1) {
    itaSheet.getRange(2, 1, 6, 9).setValues([
      ['ITA-01', '2569', 'O1 - O6', 'ข้อมูลพื้นฐานสถานศึกษา', 'โครงสร้างการบริหาร อำนาจหน้าที่ ข้อมูลผู้บริหาร และช่องทางการติดต่อโรงเรียนชุมชนแม่ลาศึกษา', '', '#/about', '2026-10-01', 'published'],
      ['ITA-02', '2569', 'O10 - O14', 'การบริหารงานและแผนปฏิบัติการ', 'แผนพัฒนาคุณภาพการศึกษา และแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. 2569 (อ.2 - ม.3)', '', '', '2026-10-01', 'published'],
      ['ITA-03', '2569', 'O15 - O18', 'การใช้จ่ายงบประมาณและจัดซื้อจัดจ้าง', 'รายงานผลการจัดซื้อจัดจ้างโครงการอาหารกลางวัน สื่อการสอน และงบอุดหนุนรายหัว ประจำปี 2569', '', '', '2026-10-05', 'published'],
      ['ITA-04', '2569', 'O19 - O23', 'การบริหารและพัฒนาทรัพยากรบุคคล', 'แผนการบริหารและพัฒนาครูและบุคลากรทางการศึกษา และประมวลจริยธรรมวิชาชีพครู', '', '', '2026-10-05', 'published'],
      ['ITA-05', '2569', 'O28 - O33', 'การส่งเสริมความโปร่งใสและรับเรื่องร้องเรียน', 'แนวปฏิบัติการจัดการเรื่องร้องเรียนการทุจริต และระบบแจ้งเบาะแสออนไลน์ผ่านเว็บไซต์โรงเรียน', '', '#/ita', '2026-10-08', 'published'],
      ['ITA-06', '2569', 'O34 - O43', 'นโยบาย No Gift Policy และการป้องกันการทุจริต', 'ประกาศเจตนารมณ์งดรับงดให้ของขวัญจากการปฏิบัติหน้าที่ (No Gift Policy) โรงเรียนชุมชนแม่ลาศึกษา', '', '', '2026-10-10', 'published']
    ]);
  }

  // 1.7 แท็บ Complaints_Inbox (ไม่เปิดเผยผ่าน Public API)
  ensureSheet_(ss, SHEET_NAMES.INBOX, [
    'id', 'timestamp', 'type', 'sender_name', 'phone_or_email', 'student_level', 'subject', 'message', 'status'
  ]);

  // 1.8 แท็บ Admin_Users (ไม่เปิดเผยรหัสผ่านผ่าน Public API)
  const adminSheet = ensureSheet_(ss, SHEET_NAMES.ADMINS, [
    'email', 'name', 'role', 'password_key', 'is_active', 'last_login'
  ]);
  if (adminSheet.getLastRow() === 1) {
    adminSheet.getRange(2, 1, 2, 6).setValues([
      ['admin@maela.ac.th', 'ผู้ดูแลระบบหลัก (โรงเรียนชุมชนแม่ลาศึกษา)', 'super_admin', 'maela2569', true, new Date().toISOString()],
      ['pr@maela.ac.th', 'ครูงานประชาสัมพันธ์และวิชาการ', 'editor', 'pr2569', true, new Date().toISOString()]
    ]);
  }

  clearServerCache_();
  return {
    status: 'success',
    message: 'สร้างตารางฐานข้อมูล 8 แท็บ และโฟลเดอร์ Google Drive เรียบร้อยแล้ว',
    folders: folderMap
  };
}

/**
 * 2. ฟังก์ชันรับคำขออ่านข้อมูลหน้าเว็บ (GET API) พร้อมระบบ CacheService
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getPublicData';
    const forceRefresh = (e && e.parameter && e.parameter.refresh === '1');

    if (action === 'ping') {
      return jsonResponse_({ ok: true, school: 'โรงเรียนชุมชนแม่ลาศึกษา', timestamp: new Date().toISOString() });
    }

    const cache = CacheService.getScriptCache();
    if (!forceRefresh) {
      const cached = cache.get(CACHE_KEY_MAIN);
      if (cached) {
        return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
      }
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const payload = {
      ok: true,
      updatedAt: new Date().toISOString(),
      config: readConfigMap_(ss),
      banners: readSheetRecords_(ss, SHEET_NAMES.BANNERS),
      news: readSheetRecords_(ss, SHEET_NAMES.NEWS),
      personnel: readSheetRecords_(ss, SHEET_NAMES.PERSONNEL),
      calendar: readSheetRecords_(ss, SHEET_NAMES.CALENDAR),
      ita: readSheetRecords_(ss, SHEET_NAMES.ITA)
    };

    const jsonString = JSON.stringify(payload);
    // CacheService รองรับสูงสุด 100 KB ต่อคีย์
    if (jsonString.length < 95000) {
      cache.put(CACHE_KEY_MAIN, jsonString, CACHE_TTL_SECONDS);
    }

    return ContentService.createTextOutput(jsonString).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

/**
 * 3. ฟังก์ชันรับคำขอเพิ่ม/ลบ/แก้ไขข้อมูล และอัปโหลดไฟล์เข้า Google Drive (POST API)
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action || '';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 3.1 ส่งฟอร์มติดต่อสอบถาม / แจ้งความจำนงสมัครเรียน / ร้องเรียน ITA (ไม่ต้องใช้รหัสผ่าน Admin)
    if (action === 'submitPublicForm') {
      const inboxSheet = ss.getSheetByName(SHEET_NAMES.INBOX);
      const id = 'MSG-' + new Date().getTime();
      inboxSheet.appendRow([
        id,
        new Date().toISOString(),
        body.type || 'general',
        body.sender_name || '',
        body.phone_or_email || '',
        body.student_level || '',
        body.subject || '',
        body.message || '',
        'รอดำเนินการ'
      ]);
      return jsonResponse_({ ok: true, id: id, message: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
    }

    // 3.2 ตรวจสอบสิทธิ์ผู้ดูแลระบบ (Admin Authentication)
    const authUser = verifyAdmin_(ss, body.email, body.password);
    if (!authUser) {
      return jsonResponse_({ ok: false, error: 'อีเมลหรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' });
    }

    if (action === 'loginAdmin') {
      return jsonResponse_({
        ok: true,
        user: { email: authUser.email, name: authUser.name, role: authUser.role },
        inbox: readSheetRecords_(ss, SHEET_NAMES.INBOX)
      });
    }

    // 3.3 อัปโหลดรูปภาพหรือไฟล์ PDF ลง Google Drive อัตโนมัติ
    if (action === 'uploadDriveFile') {
      const folderMap = ensureDriveFolders_();
      const targetFolderId = (body.folderType === 'ita') ? folderMap.itaId :
                             (body.folderType === 'personnel') ? folderMap.personnelId :
                             (body.folderType === 'banner') ? folderMap.bannerId : folderMap.newsId;
      const folder = DriveApp.getFolderById(targetFolderId);
      const bytes = Utilities.base64Decode(body.base64Data);
      const blob = Utilities.newBlob(bytes, body.mimeType || 'image/webp', body.fileName || ('maela_' + new Date().getTime() + '.webp'));
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const fileId = file.getId();
      const isPdf = (body.mimeType || '').indexOf('pdf') !== -1;

      return jsonResponse_({
        ok: true,
        fileId: fileId,
        viewUrl: isPdf
          ? ('https://drive.google.com/file/d/' + fileId + '/preview')
          : ('https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200')
      });
    }

    // 3.4 บันทึกข้อมูลแบบซิงก์ทั้งตารางหรือรายแถวจากหน้า Admin
    if (action === 'syncDatabase') {
      if (body.config) writeConfigMap_(ss, body.config);
      if (body.banners) overwriteSheetRecords_(ss, SHEET_NAMES.BANNERS, body.banners);
      if (body.news) overwriteSheetRecords_(ss, SHEET_NAMES.NEWS, body.news);
      if (body.personnel) overwriteSheetRecords_(ss, SHEET_NAMES.PERSONNEL, body.personnel);
      if (body.calendar) overwriteSheetRecords_(ss, SHEET_NAMES.CALENDAR, body.calendar);
      if (body.ita) overwriteSheetRecords_(ss, SHEET_NAMES.ITA, body.ita);
      if (body.inbox) overwriteSheetRecords_(ss, SHEET_NAMES.INBOX, body.inbox);

      clearServerCache_();
      return jsonResponse_({ ok: true, message: 'ซิงก์ฐานข้อมูล Google Sheets และล้างแคชเรียบร้อยแล้ว' });
    }

    if (action === 'clearCache') {
      clearServerCache_();
      return jsonResponse_({ ok: true, message: 'ล้างแคชฝั่งเซิร์ฟเวอร์เรียบร้อยแล้ว' });
    }

    return jsonResponse_({ ok: false, error: 'ไม่พบคำสั่ง action ที่ระบุ: ' + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

/**
 * Helper: ตรวจสอบสิทธิ์แอดมินจากแท็บ Admin_Users
 */
function verifyAdmin_(ss, email, password) {
  const admins = readSheetRecords_(ss, SHEET_NAMES.ADMINS);
  for (let i = 0; i < admins.length; i++) {
    const row = admins[i];
    if (String(row.email).toLowerCase() === String(email || '').toLowerCase() &&
        String(row.password_key) === String(password || '') &&
        String(row.is_active) !== 'false') {
      return row;
    }
  }
  return null;
}

/**
 * Helper: สร้างโฟลเดอร์หลักและโฟลเดอร์ย่อยใน Google Drive
 */
function ensureDriveFolders_() {
  let rootFolder;
  const roots = DriveApp.getFoldersByName(STORAGE_ROOT_FOLDER_NAME);
  if (roots.hasNext()) {
    rootFolder = roots.next();
  } else {
    rootFolder = DriveApp.createFolder(STORAGE_ROOT_FOLDER_NAME);
    rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  const getSub = function(name) {
    const subs = rootFolder.getFoldersByName(name);
    if (subs.hasNext()) return subs.next().getId();
    const f = rootFolder.createFolder(name);
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return f.getId();
  };

  return {
    rootId: rootFolder.getId(),
    bannerId: getSub('01_Banners'),
    newsId: getSub('02_News_Images'),
    personnelId: getSub('03_Personnel_Photos'),
    pdfId: getSub('04_PDF_Attachments'),
    itaId: getSub('05_ITA_Documents')
  };
}

/**
 * Helper: สร้าง Sheet และหัวตารางหากยังไม่มี
 */
function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#991B1B')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Helper: อ่านข้อมูลทั้งตารางแบบ Batch (getValues ครั้งเดียวเพื่อความเร็วและประหยัดโควตา)
 */
function readSheetRecords_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = [];
  for (let r = 1; r < values.length; r++) {
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = values[r][c];
    }
    rows.push(obj);
  }
  return rows;
}

/**
 * Helper: เขียนทับข้อมูลตารางแบบ Batch
 */
function overwriteSheetRecords_(ss, sheetName, records) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  if (!records || records.length === 0) return;
  const matrix = records.map(function(item) {
    return headers.map(function(h) {
      return (item[h] !== undefined && item[h] !== null) ? item[h] : '';
    });
  });
  sheet.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
}

/**
 * Helper: อ่านค่า Config เป็น Object
 */
function readConfigMap_(ss) {
  const rows = readSheetRecords_(ss, SHEET_NAMES.CONFIG);
  const map = {};
  rows.forEach(function(r) {
    map[r.key] = r.value_th;
  });
  return map;
}

/**
 * Helper: อัปเดตค่า Config ลง Sheet
 */
function writeConfigMap_(ss, configObj) {
  const sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!sheet) return;
  const values = sheet.getDataRange().getValues();
  const now = new Date().toISOString();
  for (let i = 1; i < values.length; i++) {
    const k = values[i][0];
    if (configObj[k] !== undefined) {
      values[i][1] = configObj[k];
      values[i][4] = now;
    }
  }
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
}

function clearServerCache_() {
  try {
    CacheService.getScriptCache().remove(CACHE_KEY_MAIN);
  } catch (e) {}
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
