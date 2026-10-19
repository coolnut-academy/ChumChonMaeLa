// Export the supplied school emblem faithfully; no AI redraw or added decoration.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public/LogoSchool.png');
const target = path.join(root, 'public/images/branding');

(async () => {
  const sourceBytes = fs.readFileSync(source);
  const { data, info } = await sharp(sourceBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 0) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left) throw new Error('Source logo is completely transparent');
  const crop = { left, top, width: right - left + 1, height: bottom - top + 1 };
  fs.mkdirSync(target, { recursive: true });
  const exports = [
    ['school-logo-40.png', 40],
    ['school-logo-48.png', 48],
    ['school-logo-64.png', 64],
    ['school-logo-80.png', 80],
    ['school-logo-96.png', 96],
    ['school-logo-128.png', 128],
    ['favicon-16x16.png', 16],
    ['favicon-32x32.png', 32],
    ['apple-touch-icon.png', 180],
    ['android-chrome-192x192.png', 192],
    ['android-chrome-512x512.png', 512]
  ];
  async function raster(size) {
    return sharp(sourceBytes).extract(crop).resize(size, size, {
      fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }
    }).png({ compressionLevel: 9 }).toBuffer();
  }
  for (const [name, size] of exports) fs.writeFileSync(path.join(target, name), await raster(size));

  // PNG-compressed ICO entries retain the original alpha at each favicon size.
  const sizes = [16, 32, 48];
  const entries = [];
  for (const size of sizes) entries.push(await raster(size));
  const header = Buffer.alloc(6 + entries.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = header.length;
  entries.forEach((bytes, i) => {
    const at = 6 + i * 16;
    header[at] = sizes[i]; header[at + 1] = sizes[i];
    header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(bytes.length, at + 8); header.writeUInt32LE(offset, at + 12);
    offset += bytes.length;
  });
  fs.writeFileSync(path.join(target, 'favicon.ico'), Buffer.concat([header, ...entries]));
  const provenance = {
    source: 'public/LogoSchool.png',
    sourceSha256: crypto.createHash('sha256').update(sourceBytes).digest('hex'),
    sourceSize: { width: info.width, height: info.height }, crop,
    processing: 'Crop fully transparent outer pixels, preserve aspect ratio, resize directly from original, transparent PNG. No added effects or frame; original emblem artwork retained.',
    files: [...exports.map(([file, size]) => ({ file, width: size, height: size })), { file: 'favicon.ico', sizes }]
  };
  fs.writeFileSync(path.join(target, 'asset-manifest.json'), JSON.stringify(provenance, null, 2) + '\n');
  console.log(`Exported ${exports.length + 1} transparent logo/icon assets from public/LogoSchool.png; source unchanged.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
