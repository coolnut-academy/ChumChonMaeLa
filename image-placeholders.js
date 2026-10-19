// Display-only AI illustrations. Never write placeholder URLs into CMS records.
const PLACEHOLDER_ASSETS = {
  campus: { file: 'community-school-campus', alt: 'ภาพวาดอาคารเรียนและสวนของโรงเรียนชุมชนสมมติ' },
  kinder: { file: 'kindergarten-play-learning', alt: 'ภาพวาดเด็กปฐมวัยสมมติเรียนรู้ผ่านบล็อกและศิลปะ' },
  primary: { file: 'primary-reading-discovery', alt: 'ภาพวาดเด็กประถมสมมติอ่านหนังสือและฝึกคำนวณร่วมกัน' },
  secondary: { file: 'secondary-science-careers', alt: 'ภาพวาดนักเรียนมัธยมสมมติทำโครงงานวิทยาศาสตร์และเกษตร' },
  admissions: { file: 'school-admissions-welcome', alt: 'ภาพวาดครูต้อนรับผู้ปกครองและเด็กสมมติ' },
  award: { file: 'academic-achievement', alt: 'ภาพวาดถ้วยรางวัล หนังสือ และต้นอ่อน สื่อถึงความสำเร็จทางการศึกษา' },
  academic: { file: 'academic-term-planning', alt: 'ภาพวาดสมุดวางแผนและอุปกรณ์การเรียน' },
  procurement: { file: 'school-lunch-supplies', alt: 'ภาพวาดวัตถุดิบอาหารกลางวันและแฟ้มจัดซื้อเชิงสัญลักษณ์' },
  job: { file: 'teacher-preparation', alt: 'ภาพวาดโต๊ะเตรียมการสอนและหนังสือสำหรับครู' },
  staff: { file: 'staff-neutral-avatar', alt: 'ภาพแทนบุคลากรแบบไม่มีใบหน้า ไม่ใช่ภาพบุคคลจริง' }
};
const AI_IMAGE_NOTICE = 'ภาพตัวอย่าง AI • ไม่ใช่ภาพสถานที่ บุคคล หรือเหตุการณ์จริง';

function nonEmptyImage(value) {
  if (value == null) return undefined;
  return String(value).trim() || undefined;
}

function getRecordImage(record, idField, urlField) {
  return nonEmptyImage(record && record[idField]) ?? nonEmptyImage(record && record[urlField]);
}

function resolveUploadedImageUrl(value) {
  const val = nonEmptyImage(value);
  if (val == null) return undefined;
  if (/^(data:image\/|blob:|https?:\/\/|\.\.?\/|\/)/i.test(val)) {
    if (/^https?:\/\//i.test(val)) {
      let parsed;
      try { parsed = new URL(val); } catch (_) { return val; }
      if (parsed.hostname === 'drive.google.com' || parsed.hostname === 'www.drive.google.com') {
        const match = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]{15,})/) || val.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
        if (match) return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1200';
      }
    }
    return val;
  }
  if (/\.(webp|png|jpe?g|gif|avif)(?:[?#]|$)/i.test(val)) return val;
  return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(val) + '&sz=w1200';
}

function placeholderImageUrl(type, thumbnail) {
  const asset = PLACEHOLDER_ASSETS[type] || PLACEHOLDER_ASSETS.campus;
  return './public/images/placeholders/' + asset.file + (thumbnail && type !== 'staff' ? '-thumb' : '') + '.webp';
}

function resolveDriveImageUrl(value, fallbackType) {
  const uploadedImageUrl = resolveUploadedImageUrl(value);
  return uploadedImageUrl ?? placeholderImageUrl(fallbackType);
}

function newsImageType(item) {
  if (['award', 'academic', 'procurement', 'job'].includes(item.category)) return item.category;
  const subject = String(item.title || '') + ' ' + String(item.summary || '');
  if (/อนุบาล|ปฐมวัย/.test(subject)) return 'kinder';
  if (/รับสมัครนักเรียน/.test(subject)) return 'admissions';
  if (/มัธยม|วิทยาศาสตร์|เกษตร/.test(subject)) return 'secondary';
  if (/ประถม|อ่านหนังสือ/.test(subject)) return 'primary';
  return 'campus';
}

function bannerImageType(item) {
  if (/รับสมัคร/.test(String(item.title || ''))) return 'admissions';
  if (/หลักสูตร|ระดับชั้น/.test(String(item.title || ''))) return 'kinder';
  return 'campus';
}

// Preserve the original cover on text-only edits; a newly selected file wins over an old Drive ID.
function newsCoverFields(pendingFile, driveInput, existing) {
  if (nonEmptyImage(pendingFile)) return { cover_drive_id: '', cover_url: pendingFile };
  const previousInput = getRecordImage(existing, 'cover_drive_id', 'cover_url') || '';
  if (existing && driveInput === previousInput) {
    return { cover_drive_id: existing.cover_drive_id || '', cover_url: existing.cover_url || '' };
  }
  return { cover_drive_id: driveInput, cover_url: driveInput };
}

function renderSchoolImage(value, type, title, options) {
  const opts = options || {};
  const asset = PLACEHOLDER_ASSETS[type] || PLACEHOLDER_ASSETS.campus;
  const uploadedImageUrl = resolveUploadedImageUrl(value);
  const fallbackUrl = placeholderImageUrl(type);
  const src = uploadedImageUrl ?? fallbackUrl;
  const isPlaceholder = uploadedImageUrl == null;
  const avatar = type === 'staff';
  const fallbackAlt = asset.alt + ' (สร้างด้วย AI)';
  const alt = isPlaceholder ? fallbackAlt : (title || 'ภาพประกอบ');
  const srcset = isPlaceholder && !avatar
    ? ' srcset="' + escapeHtml(placeholderImageUrl(type, true)) + ' 480w, ' + escapeHtml(fallbackUrl) + ' 1200w" sizes="' + escapeHtml(opts.sizes || '(max-width: 767px) 100vw, 50vw') + '"'
    : '';
  return '<figure class="school-image ' + escapeHtml(opts.wrapperClass || '') + '">'
    + '<img data-school-image data-fallback-src="' + escapeHtml(fallbackUrl) + '" data-fallback-alt="' + escapeHtml(fallbackAlt) + '" src="' + escapeHtml(src) + '"' + srcset
    + ' alt="' + escapeHtml(alt) + '" width="' + (avatar ? 256 : 1200) + '" height="' + (avatar ? 256 : 800) + '"'
    + ' loading="' + (opts.eager ? 'eager' : 'lazy') + '"' + (opts.priority ? ' fetchpriority="high"' : '') + ' decoding="async" class="' + escapeHtml(opts.imageClass || 'w-full aspect-[3/2] object-cover rounded-xl') + '" />'
    + '<figcaption class="school-image-label"' + (isPlaceholder ? '' : ' hidden') + ' title="' + AI_IMAGE_NOTICE + '">'
    + (avatar ? '<span aria-hidden="true">AI</span><span class="sr-only">' + AI_IMAGE_NOTICE + '</span>' : AI_IMAGE_NOTICE) + '</figcaption></figure>';
}

// A failed uploaded image falls back visually, without changing its stored URL.
// Each image can attempt fallback once, so a missing local asset cannot loop.
document.addEventListener('error', function(event) {
  const img = event.target;
  if (!img.matches || !img.matches('img[data-school-image]') || img.dataset.fallbackAttempted) return;
  img.dataset.fallbackAttempted = 'true';
  img.removeAttribute('srcset');
  img.removeAttribute('sizes');
  img.alt = img.dataset.fallbackAlt;
  img.src = img.dataset.fallbackSrc;
  const label = img.parentElement.querySelector('figcaption');
  if (label) label.hidden = false;
}, true);
