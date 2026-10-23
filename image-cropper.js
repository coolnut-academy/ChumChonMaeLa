/**
 * image-cropper.js
 * ระบบปรับแต่งและครอบตัดรูปภาพส่วนกลาง (Centralized Image Cropper & Optimizer)
 * สำหรับเว็บไซต์โรงเรียนชุมชนแม่ลาศึกษา
 *
 * ฟังก์ชันหลัก:
 * - เปิดหน้าต่าง Modal ให้แอดมินจัดวางภาพ (Drag / Pan) และซูม (Zoom)
 * - เลือกว่าส่วนไหนจะแสดงบนหน้าเว็บ และส่วนไหนจะถูกซ่อนไว้ (ป้องกันหัวขาด/ภาพเพี้ยน)
 * - มี Live Preview แสดงผลลัพธ์แบบเรียลไทม์
 * - รองรับหมุนภาพ (Rotate 90°) และพลิกภาพ (Flip)
 * - สลับสัดส่วนภาพได้ (16:9 สไลด์, 3:2 ข่าวสาร, 3:4 รูปครู/บุคลากร, 1:1, 4:3, อิสระ)
 * - ประมวลผลและบีบอัดเป็น WebP คุณภาพสูงอัตโนมัติ
 * - รองรับทั้งเมาส์บนเดสก์ท็อป และระบบสัมผัส (Touch / Pinch) บนมือถือ/แท็บเล็ต
 */

(function (global) {
  'use strict';

  // สัดส่วนยอดนิยมบนหน้าเว็บโรงเรียน
  const ASPECT_PRESETS = [
    { id: '16:9', label: '16:9 (สไลด์หน้าแรก)', ratio: 16 / 9 },
    { id: '3:2', label: '3:2 (ปกข่าว/กิจกรรม)', ratio: 3 / 2 },
    { id: '3:4', label: '3:4 (รูปถ่ายครู/บุคคล)', ratio: 3 / 4 },
    { id: '1:1', label: '1:1 (จัตุรัส/โปรไฟล์)', ratio: 1 / 1 },
    { id: '4:3', label: '4:3 (ป๊อปอัป/เอกสาร)', ratio: 4 / 3 },
    { id: 'free', label: 'อิสระ (ปรับกรอบเอง)', ratio: 0 }
  ];

  let modalEl = null;
  let activeSession = null;

  /**
   * สร้าง Modal DOM สำหรับ Crop ภาพ (สร้างครั้งเดียวแล้ว reuse)
   */
  function ensureCropperModal() {
    if (modalEl && document.body.contains(modalEl)) return modalEl;

    const div = document.createElement('div');
    div.id = 'imageCropperModal';
    div.className = 'fixed inset-0 z-[9999] hidden flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-200 select-none';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-labelledby', 'cropperModalTitle');

    div.innerHTML = `
      <div id="cropperCard" class="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-red-200 w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden text-slate-800">
        <!-- Header -->
        <div class="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-red-800 via-red-700 to-rose-700 text-white flex items-center justify-between gap-3 shrink-0 shadow-sm">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-lg shrink-0">✂️</span>
            <div class="min-w-0">
              <h3 id="cropperModalTitle" class="font-bold text-sm sm:text-base truncate">ปรับแต่งและครอบตัดภาพ (Crop Image)</h3>
              <p id="cropperContextLabel" class="text-[11px] sm:text-xs text-red-100/90 truncate">เลือกว่าส่วนไหนจะแสดงบนหน้าเว็บ และส่วนไหนจะซ่อนไว้</p>
            </div>
          </div>
          <button id="btnCropperCloseX" type="button" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition" title="ยกเลิกและปิด">✕</button>
        </div>

        <!-- Notification Banner: บอกผู้ใช้ชัดเจนตามโจทย์ -->
        <div class="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-start gap-2 shrink-0">
          <span class="text-amber-600 text-sm shrink-0 mt-0.5">💡</span>
          <div class="leading-relaxed">
            <strong class="font-semibold text-amber-950">ส่วนที่จะแสดงผลบนเว็บไซต์:</strong>
            เฉพาะส่วนของภาพที่อยู่ <strong class="text-red-700 underline underline-offset-2">ภายในกรอบสี่เหลี่ยมนี้เท่านั้น</strong> ที่จะแสดงบนหน้าเว็บ (ส่วนที่อยู่นอกกรอบจะถูกซ่อนไว้ เพื่อไม่ให้ภาพแสดงผลเพี้ยน หรือหัวขาด / ศีรษะและเนื้อหาสำคัญถูกตัดขาด)
          </div>
        </div>

        <!-- Body Area: 2 Columns on desktop, 1 column on mobile -->
        <div class="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-h-0">
          
          <!-- ฝั่งซ้าย: Workspace Canvas ครอปภาพ -->
          <div class="lg:col-span-8 flex flex-col space-y-3 min-w-0">
            <!-- Viewport Container -->
            <div id="cropperViewportWrap" class="relative w-full h-[280px] sm:h-[380px] md:h-[430px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-inner flex items-center justify-center">
              <canvas id="cropperCanvas" class="w-full h-full block cursor-grab active:cursor-grabbing touch-none"></canvas>
              
              <!-- Floating Guide Hint -->
              <div class="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] sm:text-[11px] text-white/80 bg-slate-950/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10">
                <span class="flex items-center gap-1.5">
                  <span>🖱️</span>
                  <span>คลิกลากเพื่อย้ายตำแหน่งภาพ • หมุนล้อเมาส์ / กางนิ้วเพื่อซูม</span>
                </span>
                <span id="cropperImgDim" class="font-mono text-amber-300 hidden sm:inline"></span>
              </div>
            </div>

            <!-- Toolbar ใต้ Canvas -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <!-- Zoom Controller -->
              <div class="flex items-center gap-2 flex-1 min-w-[200px]">
                <span class="font-medium text-slate-700 shrink-0 flex items-center gap-1">🔍 ซูม:</span>
                <button id="btnZoomOut" type="button" class="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold shadow-sm" title="ซูมออก">-</button>
                <input id="sliderZoom" type="range" min="0.5" max="3.0" step="0.05" value="1.0" class="flex-1 accent-red-700 cursor-pointer" />
                <button id="btnZoomIn" type="button" class="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold shadow-sm" title="ซูมเข้า">+</button>
                <span id="zoomValueText" class="font-mono text-[11px] text-slate-600 w-10 text-right shrink-0">100%</span>
              </div>

              <!-- Tools: Rotate, Flip, Center -->
              <div class="flex items-center gap-1.5 shrink-0">
                <button id="btnRotateCw" type="button" class="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-red-50 hover:text-red-700 text-slate-700 font-medium flex items-center gap-1 shadow-sm transition" title="หมุนภาพตามเข็ม 90 องศา">
                  <span>🔄</span> หมุน 90°
                </button>
                <button id="btnFlipH" type="button" class="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-red-50 hover:text-red-700 text-slate-700 font-medium flex items-center gap-1 shadow-sm transition" title="พลิกภาพซ้าย-ขวา">
                  <span>↔️</span> พลิก
                </button>
                <button id="btnCenterCrop" type="button" class="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-red-50 hover:text-red-700 text-slate-700 font-medium flex items-center gap-1 shadow-sm transition" title="จัดตำแหน่งกึ่งกลาง">
                  <span>🎯</span> กลาง
                </button>
              </div>
            </div>
          </div>

          <!-- ฝั่งขวา: Live Preview & การตั้งค่าสัดส่วน -->
          <div class="lg:col-span-4 flex flex-col space-y-4 min-w-0">
            <!-- กล่อง Live Preview: ตัวอย่างแสดงผลจริงบนหน้าเว็บ -->
            <div class="bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2.5">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                  <span>👁️</span> ตัวอย่างบนหน้าเว็บ (Live Preview)
                </h4>
                <span id="previewAspectBadge" class="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">16:9</span>
              </div>
              <p class="text-[11px] text-slate-500 leading-tight">นี่คือภาพที่ผู้เยี่ยมชมเว็บไซต์จะได้เห็นจริง:</p>
              
              <div class="w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-md flex items-center justify-center p-1">
                <canvas id="cropperPreviewCanvas" class="max-w-full max-h-[170px] w-auto h-auto rounded-lg object-contain block"></canvas>
              </div>

              <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>ขนาดผลลัพธ์:</span>
                <span id="previewOutputDim" class="font-mono font-semibold text-slate-800">-</span>
              </div>
            </div>

            <!-- เลือกสัดส่วนภาพ (Aspect Ratio Presets) -->
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
              <label class="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>📐 สัดส่วนภาพ (Aspect Ratio)</span>
                <span class="text-[10px] text-slate-500 font-normal">คลิกเพื่อเปลี่ยนสัดส่วน</span>
              </label>
              <div id="cropperPresetList" class="grid grid-cols-2 gap-1.5 text-xs">
                ${ASPECT_PRESETS.map(p => `
                  <button type="button" data-ratio-preset="${p.id}" class="cropper-preset-btn text-left px-2.5 py-2 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 font-medium text-[11px] sm:text-xs transition flex items-center justify-between">
                    <span>${p.label}</span>
                  </button>
                `).join('')}
              </div>
              <p class="text-[10px] text-slate-500 mt-1 leading-normal">
                * แนะนำเลือกสัดส่วนที่ตรงกับการใช้งาน เพื่อให้ภาพคมชัดและจัดองค์ประกอบได้ตรงตามกรอบของเว็บไซต์
              </p>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div class="text-[11px] text-slate-600 flex items-center gap-1.5 self-start sm:self-center">
            <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>ระบบจะแปลงเป็น <strong>.WebP</strong> คมชัดสูงและประหยัดพื้นที่ให้อัตโนมัติ</span>
          </div>
          <div class="flex items-center gap-2.5 w-full sm:w-auto">
            <button id="btnCropperCancel" type="button" class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-sm">
              ยกเลิก
            </button>
            <button id="btnCropperConfirm" type="button" class="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5">
              <span>✓ ยืนยันการ Crop และใช้ภาพนี้</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div);
    modalEl = div;
    setupModalEvents(div);
    return div;
  }

  /**
   * ผูกเหตุการณ์ภายใน Modal
   */
  function setupModalEvents(modal) {
    const btnClose = modal.querySelector('#btnCropperCloseX');
    const btnCancel = modal.querySelector('#btnCropperCancel');
    const btnConfirm = modal.querySelector('#btnCropperConfirm');
    const btnZoomIn = modal.querySelector('#btnZoomIn');
    const btnZoomOut = modal.querySelector('#btnZoomOut');
    const sliderZoom = modal.querySelector('#sliderZoom');
    const btnRotate = modal.querySelector('#btnRotateCw');
    const btnFlip = modal.querySelector('#btnFlipH');
    const btnCenter = modal.querySelector('#btnCenterCrop');
    const canvas = modal.querySelector('#cropperCanvas');

    const handleCancel = () => {
      if (!activeSession) return;
      const s = activeSession;
      closeCropperModal();
      if (s.onCancel) s.onCancel();
    };

    btnClose.addEventListener('click', handleCancel);
    btnCancel.addEventListener('click', handleCancel);

    // ปิดเมื่อคลิกพื้นหลังมืดรอบนอก
    modal.addEventListener('click', (e) => {
      if (e.target === modal) handleCancel();
    });

    // ปิดด้วยปุ่ม Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeSession && !modal.classList.contains('hidden')) {
        handleCancel();
      }
    });

    // ปุ่มยืนยัน
    btnConfirm.addEventListener('click', () => {
      if (!activeSession) return;
      applyCroppedImage();
    });

    // ปุ่มซูม
    btnZoomIn.addEventListener('click', () => {
      if (!activeSession) return;
      setZoom(activeSession.zoom * 1.15);
    });

    btnZoomOut.addEventListener('click', () => {
      if (!activeSession) return;
      setZoom(activeSession.zoom / 1.15);
    });

    sliderZoom.addEventListener('input', (e) => {
      if (!activeSession) return;
      setZoom(parseFloat(e.target.value));
    });

    // ปุ่มหมุน
    btnRotate.addEventListener('click', () => {
      if (!activeSession) return;
      activeSession.rotation = (activeSession.rotation + 90) % 360;
      resetFitZoom();
      renderCropper();
    });

    // ปุ่มพลิก
    btnFlip.addEventListener('click', () => {
      if (!activeSession) return;
      activeSession.flipH = !activeSession.flipH;
      renderCropper();
    });

    // ปุ่มจัดกลาง
    btnCenter.addEventListener('click', () => {
      if (!activeSession) return;
      centerImage();
      renderCropper();
    });

    // สลับ Preset อัตราส่วน
    modal.querySelectorAll('[data-ratio-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!activeSession) return;
        const id = btn.getAttribute('data-ratio-preset');
        const preset = ASPECT_PRESETS.find((p) => p.id === id);
        if (preset) {
          activeSession.aspectId = preset.id;
          activeSession.aspectRatio = preset.ratio;
          updatePresetButtonsUI();
          updateCropBoxDimensions();
          resetFitZoom();
          renderCropper();
        }
      });
    });

    // ลากย้ายตำแหน่งภาพ (Pointer & Touch Gestures)
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialPanX = 0;
    let initialPanY = 0;
    let touchDistStart = 0;
    let touchZoomStart = 1;

    canvas.addEventListener('pointerdown', (e) => {
      if (!activeSession) return;
      isDragging = true;
      canvas.setPointerCapture(e.pointerId);
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialPanX = activeSession.panX;
      initialPanY = activeSession.panY;
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!isDragging || !activeSession) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      activeSession.panX = initialPanX + dx;
      activeSession.panY = initialPanY + dy;
      renderCropper();
    });

    const endDrag = (e) => {
      if (isDragging) {
        isDragging = false;
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    // ล้อเมาส์ซูม (Mouse Wheel Zoom)
    canvas.addEventListener('wheel', (e) => {
      if (!activeSession) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom(activeSession.zoom * factor);
    }, { passive: false });

    // Multi-touch Pinch to Zoom
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2 && activeSession) {
        touchDistStart = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchZoomStart = activeSession.zoom;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && activeSession && touchDistStart > 0) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = dist / touchDistStart;
        setZoom(touchZoomStart * scale);
      }
    }, { passive: false });

    // Handle Window Resize เพื่อปรับขนาด Canvas ใน Viewport
    window.addEventListener('resize', () => {
      if (activeSession && !modal.classList.contains('hidden')) {
        updateCropBoxDimensions();
        renderCropper();
      }
    });
  }

  /**
   * คำนวณและปรับขนาดกรอบ Crop ให้พอดีกับ Viewport
   */
  function updateCropBoxDimensions() {
    if (!activeSession) return;
    const modal = ensureCropperModal();
    const canvas = modal.querySelector('#cropperCanvas');
    const wrap = modal.querySelector('#cropperViewportWrap');
    const rect = wrap.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(300, Math.floor(rect.width));
    const h = Math.max(200, Math.floor(rect.height));

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    activeSession.viewW = w;
    activeSession.viewH = h;
    activeSession.dpr = dpr;

    // คำนวณขนาดกรอบ Crop Box
    const padding = 28;
    const availW = w - padding * 2;
    const availH = h - padding * 2;
    let ratio = activeSession.aspectRatio;

    if (!ratio || ratio <= 0) {
      // โหมด Freeform: ใช้สัดส่วนตามภาพต้นฉบับ
      const naturalAspect = (activeSession.img.naturalWidth || 800) / (activeSession.img.naturalHeight || 600);
      ratio = naturalAspect;
    }

    let cropW = availW;
    let cropH = cropW / ratio;

    if (cropH > availH) {
      cropH = availH;
      cropW = cropH * ratio;
    }

    activeSession.cropBox = {
      x: Math.round((w - cropW) / 2),
      y: Math.round((h - cropH) / 2),
      width: Math.round(cropW),
      height: Math.round(cropH)
    };
  }

  /**
   * ปรับ Zoom ให้อัตโนมัติ เพื่อให้ภาพเต็มกรอบ Crop ตั้งแต่แรก
   */
  function resetFitZoom() {
    if (!activeSession || !activeSession.cropBox) return;
    const img = activeSession.img;
    const isRotated = activeSession.rotation === 90 || activeSession.rotation === 270;
    const naturalW = isRotated ? img.naturalHeight : img.naturalWidth;
    const naturalH = isRotated ? img.naturalWidth : img.naturalHeight;

    const cb = activeSession.cropBox;
    const scaleX = cb.width / naturalW;
    const scaleY = cb.height / naturalH;
    const fitScale = Math.max(scaleX, scaleY);

    activeSession.zoom = fitScale;
    activeSession.minZoom = fitScale * 0.4;
    activeSession.maxZoom = Math.max(fitScale * 4, 3.0);

    const slider = modalEl.querySelector('#sliderZoom');
    if (slider) {
      slider.min = (activeSession.minZoom).toFixed(2);
      slider.max = (activeSession.maxZoom).toFixed(2);
      slider.value = fitScale.toFixed(2);
    }
    updateZoomText();
    centerImage();
  }

  function setZoom(val) {
    if (!activeSession) return;
    const clamped = Math.max(activeSession.minZoom || 0.1, Math.min(activeSession.maxZoom || 5.0, val));
    activeSession.zoom = clamped;
    const slider = modalEl.querySelector('#sliderZoom');
    if (slider) slider.value = clamped.toFixed(2);
    updateZoomText();
    renderCropper();
  }

  function updateZoomText() {
    if (!activeSession) return;
    const txt = modalEl.querySelector('#zoomValueText');
    if (txt) {
      const pct = Math.round((activeSession.zoom / (activeSession.minZoom ? activeSession.minZoom * 2.5 : 1)) * 100);
      txt.textContent = `${Math.round(activeSession.zoom * 100)}%`;
    }
  }

  function centerImage() {
    if (!activeSession || !activeSession.cropBox) return;
    activeSession.panX = activeSession.cropBox.x + activeSession.cropBox.width / 2;
    activeSession.panY = activeSession.cropBox.y + activeSession.cropBox.height / 2;
  }

  function updatePresetButtonsUI() {
    if (!activeSession || !modalEl) return;
    modalEl.querySelectorAll('[data-ratio-preset]').forEach((btn) => {
      const id = btn.getAttribute('data-ratio-preset');
      const isSel = id === activeSession.aspectId;
      btn.className = isSel
        ? 'cropper-preset-btn text-left px-2.5 py-2 rounded-xl border-2 border-red-700 bg-red-50 text-red-900 font-bold text-[11px] sm:text-xs shadow-sm flex items-center justify-between'
        : 'cropper-preset-btn text-left px-2.5 py-2 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 font-medium text-[11px] sm:text-xs text-slate-700 transition flex items-center justify-between';
    });

    const badge = modalEl.querySelector('#previewAspectBadge');
    if (badge) badge.textContent = activeSession.aspectId.toUpperCase();
  }

  /**
   * วาด Workspace Canvas และ Live Preview Canvas
   */
  function renderCropper() {
    if (!activeSession || !modalEl) return;
    const canvas = modalEl.querySelector('#cropperCanvas');
    const ctx = canvas.getContext('2d');
    const dpr = activeSession.dpr || 1;
    const w = activeSession.viewW;
    const h = activeSession.viewH;
    const cb = activeSession.cropBox;
    if (!cb) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // 1. วาดตารางหมากรุกพื้นหลัง (Transparency Checkerboard)
    drawCheckerboard(ctx, w, h);

    // 2. วาดภาพต้นฉบับด้วย Transform (Pan, Zoom, Rotate, Flip)
    ctx.save();
    ctx.translate(activeSession.panX, activeSession.panY);
    ctx.rotate((activeSession.rotation * Math.PI) / 180);
    if (activeSession.flipH) ctx.scale(-1, 1);
    ctx.scale(activeSession.zoom, activeSession.zoom);

    const img = activeSession.img;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    ctx.drawImage(img, -nw / 2, -nh / 2, nw, nh);
    ctx.restore();

    // 3. วาด Mask มืดทับรอบนอกกรอบ Crop เพื่อบอกว่า "ส่วนนี้จะถูกซ่อนไว้"
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    // ด้านบน
    ctx.fillRect(0, 0, w, cb.y);
    // ด้านล่าง
    ctx.fillRect(0, cb.y + cb.height, w, h - (cb.y + cb.height));
    // ด้านซ้าย
    ctx.fillRect(0, cb.y, cb.x, cb.height);
    // ด้านขวา
    ctx.fillRect(cb.x + cb.width, cb.y, w - (cb.x + cb.width), cb.height);

    // 4. วาดเส้นขอบกรอบ Crop Box
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(cb.x, cb.y, cb.width, cb.height);

    // 5. วาดเส้น Rule of Thirds (ตาราง 3x3 ในกรอบ crop)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    // เส้นแนวตั้ง 2 เส้น
    ctx.moveTo(cb.x + cb.width / 3, cb.y);
    ctx.lineTo(cb.x + cb.width / 3, cb.y + cb.height);
    ctx.moveTo(cb.x + (cb.width * 2) / 3, cb.y);
    ctx.lineTo(cb.x + (cb.width * 2) / 3, cb.y + cb.height);
    // เส้นแนวนอน 2 เส้น
    ctx.moveTo(cb.x, cb.y + cb.height / 3);
    ctx.lineTo(cb.x + cb.width, cb.y + cb.height / 3);
    ctx.moveTo(cb.x, cb.y + (cb.height * 2) / 3);
    ctx.lineTo(cb.x + cb.width, cb.y + (cb.height * 2) / 3);
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. มุมกรอบ Crop สีแดงสว่าง (Corner Handles)
    const cornerSize = 14;
    const cornerThick = 3.5;
    ctx.strokeStyle = '#C83B56';
    ctx.lineWidth = cornerThick;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(cb.x, cb.y + cornerSize);
    ctx.lineTo(cb.x, cb.y);
    ctx.lineTo(cb.x + cornerSize, cb.y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(cb.x + cb.width - cornerSize, cb.y);
    ctx.lineTo(cb.x + cb.width, cb.y);
    ctx.lineTo(cb.x + cb.width, cb.y + cornerSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(cb.x, cb.y + cb.height - cornerSize);
    ctx.lineTo(cb.x, cb.y + cb.height);
    ctx.lineTo(cb.x + cornerSize, cb.y + cb.height);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(cb.x + cb.width - cornerSize, cb.y + cb.height);
    ctx.lineTo(cb.x + cb.width, cb.y + cb.height);
    ctx.lineTo(cb.x + cb.width, cb.y + cb.height - cornerSize);
    ctx.stroke();

    ctx.restore();

    // 7. วาด Live Preview
    renderLivePreview();
  }

  function drawCheckerboard(ctx, w, h) {
    const size = 16;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1e293b';
    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        if (((x / size) + (y / size)) % 2 === 0) {
          ctx.fillRect(x, y, size, size);
        }
      }
    }
  }

  /**
   * วาด Live Preview ทันทีตามกรอบ Crop ปัจจุบัน
   */
  function renderLivePreview() {
    if (!activeSession || !modalEl) return;
    const pCanvas = modalEl.querySelector('#cropperPreviewCanvas');
    const pCtx = pCanvas.getContext('2d');
    const cb = activeSession.cropBox;
    if (!cb) return;

    const naturalAspect = cb.width / cb.height;
    const targetW = Math.min(360, cb.width);
    const targetH = Math.round(targetW / naturalAspect);

    pCanvas.width = targetW;
    pCanvas.height = targetH;

    // คำนวณ transform เพื่อดึงเฉพาะภาพใน Crop Box
    pCtx.save();
    pCtx.clearRect(0, 0, targetW, targetH);

    // Scale จาก CropBox ไปยัง PreviewCanvas
    const scale = targetW / cb.width;
    pCtx.scale(scale, scale);
    pCtx.translate(-cb.x, -cb.y);

    // วาดภาพแบบเดียวกับใน canvas หลัก
    pCtx.save();
    pCtx.translate(activeSession.panX, activeSession.panY);
    pCtx.rotate((activeSession.rotation * Math.PI) / 180);
    if (activeSession.flipH) pCtx.scale(-1, 1);
    pCtx.scale(activeSession.zoom, activeSession.zoom);

    const img = activeSession.img;
    pCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);
    pCtx.restore();

    pCtx.restore();

    // อัปเดตขนาดพิกเซลผลลัพธ์
    const outputDim = calculateFinalDimensions();
    const dimText = modalEl.querySelector('#previewOutputDim');
    if (dimText) {
      dimText.textContent = `${outputDim.width} × ${outputDim.height} px`;
    }
  }

  /**
   * คำนวณขนาดภาพผลลัพธ์ที่แท้จริงตาม Target Resolution
   */
  function calculateFinalDimensions() {
    if (!activeSession || !activeSession.cropBox) return { width: 1200, height: 800 };
    const cb = activeSession.cropBox;
    const ratio = cb.width / cb.height;
    const maxW = activeSession.targetWidth || 1600;

    let outW = Math.round(Math.min(maxW, Math.max(640, cb.width / (activeSession.zoom || 1))));
    let outH = Math.round(outW / ratio);

    if (outH > 1600) {
      outH = 1600;
      outW = Math.round(outH * ratio);
    }

    return { width: outW, height: outH };
  }

  /**
   * ประมวลผลและสร้างไฟล์ WebP จาก Crop Box
   */
  function applyCroppedImage() {
    if (!activeSession) return;
    const s = activeSession;
    const cb = s.cropBox;
    const dims = calculateFinalDimensions();

    const offCanvas = document.createElement('canvas');
    offCanvas.width = dims.width;
    offCanvas.height = dims.height;
    const offCtx = offCanvas.getContext('2d');

    offCtx.imageSmoothingEnabled = true;
    offCtx.imageSmoothingQuality = 'high';

    // แปลงพิกัดจาก Crop Box สัมพัทธ์ไปยัง Offscreen Canvas
    const scale = dims.width / cb.width;
    offCtx.scale(scale, scale);
    offCtx.translate(-cb.x, -cb.y);

    offCtx.save();
    offCtx.translate(s.panX, s.panY);
    offCtx.rotate((s.rotation * Math.PI) / 180);
    if (s.flipH) offCtx.scale(-1, 1);
    offCtx.scale(s.zoom, s.zoom);

    const img = s.img;
    offCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);
    offCtx.restore();

    // Export เป็น WebP คุณภาพสูง
    const quality = s.quality || 0.82;
    let dataUrl;
    try {
      dataUrl = offCanvas.toDataURL('image/webp', quality);
    } catch (_) {
      dataUrl = offCanvas.toDataURL('image/jpeg', 0.85);
    }

    // คำนวณขนาด KB
    const kb = Math.round((dataUrl.length * 3) / 4 / 1024);

    if (s.onConfirm) {
      try {
        s.onConfirm(dataUrl, {
          width: dims.width,
          height: dims.height,
          kb: kb,
          aspectId: s.aspectId
        });
      } catch (err) {
        console.error('onConfirm error:', err);
      }
    }

    if (s.resolve) {
      try { s.resolve(dataUrl); } catch (_) {}
    }

    closeCropperModal();
  }

  function closeCropperModal() {
    if (modalEl) {
      modalEl.classList.add('hidden');
      document.body.style.overflow = '';
    }
    activeSession = null;
  }

  /**
   * ฟังก์ชันคำนวณ Auto-Crop เริ่มต้นแบบ Center Crop ทันที
   * (ใช้สำหรับสร้างค่าเริ่มต้น และให้ Automated tests ทำงานได้ลื่นไหล)
   */
  function generateQuickCenterCrop(img, targetAspect, maxWidth, quality) {
    const ratio = targetAspect > 0 ? targetAspect : (img.naturalWidth / img.naturalHeight);
    let srcW = img.naturalWidth;
    let srcH = Math.round(srcW / ratio);

    if (srcH > img.naturalHeight) {
      srcH = img.naturalHeight;
      srcW = Math.round(srcH * ratio);
    }

    const srcX = Math.round((img.naturalWidth - srcW) / 2);
    const srcY = Math.round((img.naturalHeight - srcH) / 2);

    const outW = Math.min(maxWidth || 1600, srcW);
    const outH = Math.round(outW / ratio);

    const c = document.createElement('canvas');
    c.width = outW;
    c.height = outH;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

    try {
      return c.toDataURL('image/webp', quality || 0.82);
    } catch (_) {
      return c.toDataURL('image/jpeg', 0.85);
    }
  }

  /**
   * เปิดระบบ Cropper ด้วย File object หรือ Image Source
   * @param {Object} options
   * @returns {Promise<string>} WebP Data URL
   */
  function openImageCropper(options) {
    return new Promise(function (resolve, reject) {
      const opts = options || {};
      const file = opts.file;
      const initialAspectId = opts.aspectPreset || (opts.aspectRatio ? null : '16:9');
      let targetRatio = opts.aspectRatio;

      if (!targetRatio && initialAspectId) {
        const found = ASPECT_PRESETS.find((p) => p.id === initialAspectId);
        targetRatio = found ? found.ratio : 16 / 9;
      }
      if (typeof targetRatio !== 'number') targetRatio = 16 / 9;

      // แปลง File เป็น DataURL
      const readSource = new Promise((res, rej) => {
        if (!file) {
          if (opts.imageSrc) { res(opts.imageSrc); return; }
          rej(new Error('กรุณาระบุไฟล์ภาพ'));
          return;
        }
        if (typeof file === 'string') { res(file); return; }
        if (file instanceof Blob || file instanceof File) {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target.result);
          reader.onerror = () => rej(new Error('ไม่สามารถอ่านไฟล์ภาพได้'));
          reader.readAsDataURL(file);
        } else {
          rej(new Error('ชนิดไฟล์ไม่ถูกต้อง'));
        }
      });

      readSource.then((src) => {
        const img = new Image();
        img.onload = () => {
          const modal = ensureCropperModal();

          // คำนวณ Quick Auto-Crop ให้ทันที (ถ้ามี callback onRequestStart ให้ส่งไปก่อน)
          const quickUrl = generateQuickCenterCrop(img, targetRatio, opts.targetWidth || 1600, opts.quality || 0.82);
          if (typeof opts.onInitialCrop === 'function') {
            try { opts.onInitialCrop(quickUrl); } catch (_) {}
          }

          // ตั้งค่า Context Label
          const ctxLabel = modal.querySelector('#cropperContextLabel');
          if (ctxLabel) {
            ctxLabel.textContent = opts.title
              ? `สำหรับ: ${opts.title} • จัดวางและเลือกว่าส่วนไหนจะแสดงบนหน้าเว็บ`
              : 'เลือกว่าส่วนไหนจะแสดงบนหน้าเว็บ และส่วนไหนจะซ่อนไว้';
          }

          const imgDimEl = modal.querySelector('#cropperImgDim');
          if (imgDimEl) {
            imgDimEl.textContent = `ภาพต้นฉบับ: ${img.naturalWidth} × ${img.naturalHeight} px`;
          }

          // สรุป Aspect ID ที่เลือก
          let matchedPreset = ASPECT_PRESETS.find((p) => Math.abs(p.ratio - targetRatio) < 0.05);
          if (!matchedPreset) matchedPreset = ASPECT_PRESETS[0];

          activeSession = {
            img: img,
            aspectId: initialAspectId || matchedPreset.id,
            aspectRatio: targetRatio,
            targetWidth: opts.targetWidth || 1600,
            quality: opts.quality || 0.82,
            panX: 0,
            panY: 0,
            zoom: 1.0,
            rotation: 0,
            flipH: false,
            onConfirm: opts.onConfirm,
            onCancel: opts.onCancel,
            resolve: resolve,
            reject: reject
          };

          // เปิด Modal สู่หน้าจอ
          modal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';

          updatePresetButtonsUI();
          updateCropBoxDimensions();
          resetFitZoom();
          renderCropper();
        };

        img.onerror = () => reject(new Error('ไม่สามารถเปิดไฟล์รูปภาพได้'));
        img.src = src;
      }).catch((err) => {
        reject(err);
      });
    });
  }

  // Export API ไปยัง Global Window
  global.SchoolImageCropper = {
    open: openImageCropper,
    generateQuickCenterCrop: generateQuickCenterCrop,
    presets: ASPECT_PRESETS
  };
  global.openImageCropper = openImageCropper;

})(typeof window !== 'undefined' ? window : this);
