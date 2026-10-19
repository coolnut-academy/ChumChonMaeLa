// Five editable homepage slots. Only existing Banners_Popups fields are persisted.
const HOME_HERO_SLOTS = [
  { id: 'HERO-ENTRANCE', imageType: 'hero-entrance', label: 'ป้ายโรงเรียน', title: 'ยินดีต้อนรับสู่ โรงเรียนชุมชนแม่ลาศึกษา', subtitle: 'โรงเรียนของชุมชน พื้นที่แห่งการเรียนรู้และการเติบโต ตั้งแต่อนุบาล 2 ถึงมัธยมศึกษาปีที่ 3', link: '#/about' },
  { id: 'HERO-PRIMARY', imageType: 'hero-primary', label: 'อาคารประถม', title: 'ก้าวแรกที่สดใส ในวัยประถมศึกษา', subtitle: 'เรียนรู้พื้นฐานภาษา การคิดคำนวณ และการค้นพบสิ่งใหม่ร่วมกับเพื่อน ๆ ในทุกวัน', link: '#/academics' },
  { id: 'HERO-SECONDARY', imageType: 'hero-secondary', label: 'อาคารมัธยม', title: 'ต่อยอดความฝัน สู่มัธยมศึกษาตอนต้น', subtitle: 'พัฒนาทักษะวิชาการ เทคโนโลยี และทักษะอาชีพ เพื่อเตรียมพร้อมสำหรับเส้นทางในอนาคต', link: '#/academics' },
  { id: 'HERO-ASSEMBLY', imageType: 'hero-assembly', label: 'กิจกรรมหน้าเสาธง', title: 'เริ่มต้นวันใหม่ ด้วยความพร้อมเพรียง', subtitle: 'เรียนรู้วินัย ความรับผิดชอบ และการอยู่ร่วมกันอย่างมีความสุข ผ่านกิจวัตรและกิจกรรมของโรงเรียน', link: '#/news' },
  { id: 'HERO-CLASSROOM', imageType: 'hero-classroom', label: 'กิจกรรมการเรียนการสอน', title: 'สนุกกับการเรียนรู้ ผ่านการลงมือทำ', subtitle: 'ชวนเด็ก ๆ คิด ตั้งคำถาม ทดลอง และเรียนรู้ร่วมกัน โดยมีครูคอยดูแลและให้กำลังใจ', link: '#/academics' }
];
const HERO_INTERVAL_MS = 3000;

function getDefaultHeroBanners() {
  return HOME_HERO_SLOTS.map(function(slot, index) {
    return { id: slot.id, type: 'hero', title: slot.title, subtitle: slot.subtitle, badge: slot.label, cta_text: 'ดูรายละเอียด', cta_link: slot.link, drive_image_id: '', image_url: '', sort_order: index + 1, is_active: true };
  });
}

function getHeroSlides(includeInactive) {
  const records = (state.db.banners || []).filter(b => b.type === 'hero').slice().sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
  const ids = new Set(HOME_HERO_SLOTS.map(s => s.id));
  const legacy = records.filter(b => !ids.has(b.id));
  const defaults = getDefaultHeroBanners();
  const slides = defaults.map(function(fallback, index) {
    // Existing custom/legacy banners keep their IDs, images and wording.
    const record = records.find(b => b.id === fallback.id) || legacy.shift() || fallback;
    return { ...record, slotId: fallback.id, slotLabel: HOME_HERO_SLOTS[index].label, imageType: HOME_HERO_SLOTS[index].imageType };
  });
  // Preserve any extra existing banners after the five managed slots.
  slides.push(...legacy.map(b => ({ ...b, slotId: b.id, slotLabel: b.title, imageType: 'campus' })));
  return includeInactive ? slides : slides.filter(b => String(b.is_active) !== 'false');
}

function renderHomeHero() {
  const slides = getHeroSlides();
  if (!slides.length) return '';
  state.heroIndex = ((state.heroIndex % slides.length) + slides.length) % slides.length;
  const active = slides[state.heroIndex];
  const isPlaceholder = !getRecordImage(active, 'drive_image_id', 'image_url');
  const button = 'hero-control-button';
  return `<section id="homeHero" class="school-hero bg-white" role="region" aria-roledescription="carousel" aria-label="ภาพบรรยากาศโรงเรียน">
    <h2 class="sr-only">ภาพบรรยากาศโรงเรียน</h2>
    <div class="hero-viewport">
      ${slides.map(function(slide, index) {
        const active = index === state.heroIndex;
        return `<div class="hero-slide ${active ? 'is-active' : ''}" data-hero-slide="${index}" role="group" aria-roledescription="slide" aria-label="${index + 1} จาก ${slides.length}: ${escapeHtml(slide.slotLabel)}" aria-hidden="${!active}" ${active ? '' : 'inert'}>
          ${renderSchoolImage(getRecordImage(slide, 'drive_image_id', 'image_url'), slide.imageType, slide.slotLabel, { eager: active, priority: active, wrapperClass: 'hero-art', imageClass: 'hero-art-image', sizes: '100vw', externalCaptionId: 'heroImageNotice' })}
        </div>`;
      }).join('')}
    </div>
    <div class="hero-controls max-w-7xl mx-auto px-4">
      <div class="hero-navigation">
        <button id="btnPrevHero" type="button" class="${button}" aria-label="สไลด์ก่อนหน้า">◀</button>
        <div class="flex items-center">${slides.map((_, i) => `<button type="button" data-hero-dot="${i}" class="hero-dot ${i === state.heroIndex ? 'is-active' : ''}" aria-label="ดูสไลด์ที่ ${i + 1}" aria-current="${i === state.heroIndex ? 'true' : 'false'}"></button>`).join('')}</div>
        <button id="btnNextHero" type="button" class="${button}" aria-label="สไลด์ถัดไป">▶</button>
      </div>
      <div class="hero-play-controls">
        <button id="btnPauseHero" type="button" class="${button} text-xs font-semibold" aria-pressed="${Boolean(state.heroPaused)}">${state.heroPaused ? 'เล่นสไลด์' : 'หยุดสไลด์'}</button>
        <span id="heroSlideCounter" class="text-xs font-semibold text-red-800">${state.heroIndex + 1} / ${slides.length}</span>
      </div>
    </div>
    <p id="heroImageNotice" class="max-w-7xl mx-auto px-4 pb-3 text-[11px] text-slate-500" ${isPlaceholder ? '' : 'hidden'}>${isPlaceholder ? AI_IMAGE_NOTICE : ''}</p>
  </section>`;
}

function mountHomeHero() {
  clearInterval(heroSliderTimer);
  const root = document.getElementById('homeHero');
  if (!root) return;
  const slides = [...root.querySelectorAll('[data-hero-slide]')];
  const dots = [...root.querySelectorAll('[data-hero-dot]')];
  const pause = root.querySelector('#btnPauseHero');
  function stop() { clearInterval(heroSliderTimer); heroSliderTimer = null; }
  function updatePause() { pause.textContent = state.heroPaused ? 'เล่นสไลด์' : 'หยุดสไลด์'; pause.setAttribute('aria-pressed', String(Boolean(state.heroPaused))); }
  function select(index) {
    state.heroIndex = (index + slides.length) % slides.length;
    slides.forEach(function(slide, i) {
      const active = i === state.heroIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
      const img = slide.querySelector('img');
      if (active) { img.loading = 'eager'; img.setAttribute('fetchpriority', 'high'); }
      else img.removeAttribute('fetchpriority');
    });
    dots.forEach((dot, i) => { dot.classList.toggle('is-active', i === state.heroIndex); dot.setAttribute('aria-current', String(i === state.heroIndex)); });
    root.querySelector('#heroSlideCounter').textContent = (state.heroIndex + 1) + ' / ' + slides.length;
    const currentImage = slides[state.heroIndex].querySelector('img');
    const notice = root.querySelector('#heroImageNotice');
    const placeholder = currentImage.getAttribute('src').startsWith('./public/images/placeholders/') || currentImage.dataset.fallbackAttempted;
    notice.hidden = !placeholder;
    notice.textContent = placeholder ? AI_IMAGE_NOTICE : '';
  }
  function play() {
    stop();
    if (state.heroPaused || slides.length < 2) return;
    heroSliderTimer = setInterval(function() {
      if (!root.isConnected || state.currentRoute !== 'home') { stop(); return; }
      if (document.hidden || !document.getElementById('globalModalBackdrop').classList.contains('hidden')) return;
      select(state.heroIndex + 1);
    }, HERO_INTERVAL_MS);
  }
  root.querySelector('#btnPrevHero').addEventListener('click', () => select(state.heroIndex - 1));
  root.querySelector('#btnNextHero').addEventListener('click', () => select(state.heroIndex + 1));
  dots.forEach(dot => dot.addEventListener('click', () => select(Number(dot.dataset.heroDot))));
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', play);
  root.addEventListener('focusin', function(event) { if (event.target === pause) return; state.heroPaused = true; stop(); updatePause(); });
  pause.addEventListener('click', function() { state.heroPaused = !state.heroPaused; updatePause(); play(); });
  play();
}

function readHeroImageFile(file) {
  return new Promise(function(resolve, reject) {
    if (!file.type.startsWith('image/')) { reject(new Error('กรุณาเลือกไฟล์ภาพ')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์ภาพไม่ได้'));
    reader.onload = function() {
      const img = new Image();
      img.onerror = () => reject(new Error('เปิดไฟล์ภาพไม่ได้'));
      img.onload = function() {
        const scale = Math.min(1, 1600 / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', .82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function mountHeroAdminSlots(container) {
  const slides = getHeroSlides(true).slice(0, 5);
  const driveUrl = (state.db && state.db.config && state.db.config.drive_root_folder_url) || 'https://drive.google.com/drive/folders/1SKRLFjJ1HmoVufV8zxNJdtWPBNI6BSfc?usp=sharing';
  container.innerHTML = `<div class="mb-4"><h3 class="font-bold text-slate-900 text-lg">ภาพสไลด์หน้าแรก 5 ภาพ</h3><p class="text-xs text-slate-600 mt-1">เลื่อนอัตโนมัติทุก 3 วินาที • เปลี่ยนภาพและข้อความแยกแต่ละสไลด์ได้ • แนะนำภาพแนวนอน</p><p class="text-xs text-slate-500 mt-1 flex items-center justify-between flex-wrap gap-1"><span>${state.gasUrl ? 'เมื่อเลือกไฟล์ ระบบจะอัปโหลดไปคลังภาพ Google Drive หลังบันทึกให้กดซิงก์ขึ้น Google Sheets เพื่อเผยแพร่ทุกอุปกรณ์' : 'ขณะนี้บันทึกในเครื่องนี้ หากต้องการเผยแพร่ทุกอุปกรณ์ ให้เชื่อมต่อ API และใช้ภาพจากคลัง Google Drive ก่อนกดซิงก์'}</span><a href="${driveUrl}" target="_blank" rel="noopener noreferrer" class="text-red-700 font-semibold hover:underline">📁 เปิด Google Drive คลังโรงเรียน ↗</a></p></div>
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">${slides.map(function(slide, index) {
      return `<form data-hero-editor="${index}" class="bg-white border border-red-100 rounded-2xl p-4 shadow-sm space-y-3 min-w-0">
        <h4 class="font-bold text-red-800 text-sm">${index + 1}. ${escapeHtml(slide.slotLabel)}</h4>
        <div data-hero-preview></div>
        <label class="block text-xs font-medium text-slate-700">เลือกภาพใหม่<input data-hero-file type="file" accept="image/jpeg,image/png,image/webp" class="block mt-1 w-full text-xs" /></label>
        <label class="block text-xs font-medium text-slate-700">หรือ Google Drive File ID / URL<input data-hero-url type="text" class="block mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" /></label>
        <label class="block text-xs font-medium text-slate-700">หัวข้อ<input data-hero-title type="text" required value="${escapeHtml(slide.title)}" class="block mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" /></label>
        <label class="block text-xs font-medium text-slate-700">คำอธิบาย<textarea data-hero-subtitle rows="2" class="block mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">${escapeHtml(slide.subtitle)}</textarea></label>
        <div class="flex flex-wrap gap-2"><button type="submit" class="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs font-semibold">บันทึกสไลด์นี้</button><button data-hero-reset type="button" class="bg-red-50 text-red-800 border border-red-200 px-3 py-2 rounded-lg text-xs">ใช้ภาพ AI</button></div>
        <p data-hero-message class="text-xs text-slate-600" role="status"></p>
      </form>`;
    }).join('')}</div>`;
  container.querySelectorAll('[data-hero-editor]').forEach(function(form, index) {
    const slide = slides[index];
    const file = form.querySelector('[data-hero-file]');
    const url = form.querySelector('[data-hero-url]');
    const message = form.querySelector('[data-hero-message]');
    let pending;
    let version = 0;
    let processing = false;
    url.value = getRecordImage(slide, 'drive_image_id', 'image_url') || '';
    function preview() {
      form.querySelector('[data-hero-preview]').innerHTML = renderSchoolImage(pending ?? nonEmptyImage(url.value), slide.imageType, slide.slotLabel, { eager: true, imageClass: 'w-full aspect-[3/2] object-cover rounded-xl', sizes: '(max-width: 767px) 100vw, 400px' });
    }
    file.addEventListener('change', async function() {
      const chosen = file.files[0];
      if (!chosen) return;
      const request = ++version;
      processing = true;
      try {
        const image = await readHeroImageFile(chosen);
        if (!form.isConnected || request !== version) return;
        pending = image;
        message.textContent = 'ภาพใหม่พร้อมแล้ว กดบันทึกสไลด์นี้เพื่อเปลี่ยนภาพ';
        preview();
      } catch (error) { if (request === version) message.textContent = error.message; }
      finally { if (request === version) processing = false; }
    });
    url.addEventListener('input', function() { version++; processing = false; pending = undefined; file.value = ''; message.textContent = ''; preview(); });
    form.querySelector('[data-hero-reset]').addEventListener('click', function() { version++; processing = false; pending = undefined; file.value = ''; url.value = ''; message.textContent = 'กดบันทึกสไลด์นี้เพื่อกลับไปใช้ภาพ AI'; preview(); });
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      if (processing) { message.textContent = 'กำลังเตรียมภาพ กรุณารอสักครู่'; return; }
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      try {
        const original = state.db.banners.find(b => b.id === slide.id);
        const base = original || getDefaultHeroBanners().find(b => b.id === slide.slotId);
        let fields = newsCoverFields(pending, url.value.trim(), { cover_drive_id: slide.drive_image_id, cover_url: slide.image_url });
        let imageFields = { drive_image_id: fields.cover_drive_id, image_url: fields.cover_url };
        if (pending && state.gasUrl) {
          if (!state.adminCloudAuth) throw new Error('กรุณาเข้าสู่ระบบอีกครั้งก่อนอัปโหลดภาพไป Google Drive');
          const response = await fetch(state.gasUrl, { method: 'POST', body: JSON.stringify({ action: 'uploadDriveFile', ...state.adminCloudAuth, folderType: 'banner', mimeType: 'image/webp', fileName: slide.slotId.toLowerCase() + '-' + Date.now() + '.webp', base64Data: pending.split(',')[1] }) });
          const result = await response.json();
          if (!result.ok || !result.fileId) throw new Error(result.error || 'อัปโหลดภาพไม่สำเร็จ');
          imageFields = { drive_image_id: result.fileId, image_url: result.viewUrl || '' };
        }
        const record = { ...base, id: slide.id, type: 'hero', title: form.querySelector('[data-hero-title]').value.trim(), subtitle: form.querySelector('[data-hero-subtitle]').value.trim(), ...imageFields };
        const position = state.db.banners.findIndex(b => b.id === slide.id);
        if (position === -1) state.db.banners.push(record); else state.db.banners[position] = record;
        saveDatabaseToStorage();
        Object.assign(slide, record);
        pending = undefined;
        file.value = '';
        url.value = getRecordImage(record, 'drive_image_id', 'image_url') || '';
        preview();
        message.textContent = state.gasUrl ? 'บันทึกแล้ว กดซิงก์ขึ้น Google Sheets เพื่อเผยแพร่ทุกอุปกรณ์' : 'บันทึกสไลด์แล้ว เปิดหน้าแรกเพื่อดูภาพใหม่';
        showToast('บันทึกสไลด์ที่ ' + (index + 1) + ' แล้ว', 'success');
      } catch (error) { message.textContent = error.message; showToast(error.message, 'error'); }
      finally { submit.disabled = false; }
    });
    preview();
  });
}
