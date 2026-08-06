// Generates DealRoot PWA app icons from the official logo (pure Node, no deps).
// Usage: node scripts/generate-pwa-icons.cjs
// Reads  public/logo.png  (must be an 8-bit RGBA PNG) and writes
// the sized icons into public/icons/.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.join(__dirname, "..", "public", "icons");
const LOGO_PATH = path.join(__dirname, "..", "public", "logo.png");

// ---- minimal PNG writer ----
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- minimal PNG reader (8-bit RGBA assumed) ----
function readPngRgba(filePath) {
  const buf = fs.readFileSync(filePath);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  let palette = null;
  let trns = null;

  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "PLTE") {
      palette = data;
    } else if (type === "tRNS") {
      trns = data;
    }

    offset += 12 + len;
  }

  if (bitDepth !== 8) {
    throw new Error(`Unsupported bit depth: ${bitDepth}`);
  }

  const bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (bpp === undefined) throw new Error(`Unsupported color type: ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const rgba = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);

  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  };

  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    const cur = Buffer.alloc(stride);

    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = raw[rowStart + 1 + i];

      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) v = (v + paeth(a, b, c)) & 0xff;

      cur[i] = v;
    }

    for (let x = 0; x < width; x++) {
      const si = x * bpp;
      const di = (y * width + x) * 4;
      let r, g, b, a = 255;

      if (colorType === 6) {
        r = cur[si]; g = cur[si + 1]; b = cur[si + 2]; a = cur[si + 3];
      } else if (colorType === 2) {
        r = cur[si]; g = cur[si + 1]; b = cur[si + 2];
      } else if (colorType === 0) {
        r = g = b = cur[si];
      } else if (colorType === 4) {
        r = g = b = cur[si]; a = cur[si + 1];
      } else {
        const idx = cur[si] * 3;
        r = palette[idx]; g = palette[idx + 1]; b = palette[idx + 2];
        if (trns && trns[cur[si]] !== undefined) a = trns[cur[si]];
      }

      rgba[di] = r; rgba[di + 1] = g; rgba[di + 2] = b; rgba[di + 3] = a;
    }

    prev = cur;
  }

  return { width, height, rgba };
}

// ---- area-average scaling (premultiplied-alpha safe) ----
function scaleRgba(src, sw, sh, dw, dh) {
  const out = Buffer.alloc(dw * dh * 4);
  const xRatio = sw / dw;
  const yRatio = sh / dh;

  for (let y = 0; y < dh; y++) {
    const sy0 = Math.floor(y * yRatio);
    const sy1 = Math.max(sy0 + 1, Math.min(sh, Math.ceil((y + 1) * yRatio)));
    for (let x = 0; x < dw; x++) {
      const sx0 = Math.floor(x * xRatio);
      const sx1 = Math.max(sx0 + 1, Math.min(sw, Math.ceil((x + 1) * xRatio)));
      let r = 0, g = 0, b = 0, a = 0;
      const n = (sx1 - sx0) * (sy1 - sy0);

      for (let yy = sy0; yy < sy1; yy++) {
        for (let xx = sx0; xx < sx1; xx++) {
          const o = (yy * sw + xx) * 4;
          // premultiply by alpha so transparent pixels don't darken edges
          const al = src[o + 3] / 255;
          r += src[o] * al;
          g += src[o + 1] * al;
          b += src[o + 2] * al;
          a += src[o + 3];
        }
      }

      const o = (y * dw + x) * 4;
      if (a === 0) {
        out[o] = 0;
        out[o + 1] = 0;
        out[o + 2] = 0;
        out[o + 3] = 0;
      } else {
        // unpremultiply: divide the premultiplied sums by the total alpha
        out[o] = Math.round((r * 255) / a);
        out[o + 1] = Math.round((g * 255) / a);
        out[o + 2] = Math.round((b * 255) / a);
        out[o + 3] = Math.round(a / n);
      }
    }
  }
  return out;
}

// ---- draw a scaled copy of the logo centered on its own background ----
// Used for the maskable icon: content sits inside the 80% safe zone so
// launcher crops never cut off the logo.
function maskableFromLogo(src, sw, sh, size) {
  // sample the background from the top-left corner
  const bgO = 0;
  const bgR = src[bgO], bgG = src[bgO + 1], bgB = src[bgO + 2];

  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    out[i * 4] = bgR;
    out[i * 4 + 1] = bgG;
    out[i * 4 + 2] = bgB;
    out[i * 4 + 3] = 255;
  }

  const scale = 0.72;
  const dw = Math.round(size * scale);
  const dh = Math.round(size * scale);
  const scaled = scaleRgba(src, sw, sh, dw, dh);
  const offX = Math.round((size - dw) / 2);
  const offY = Math.round((size - dh) / 2);

  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const si = (y * dw + x) * 4;
      const di = ((offY + y) * size + (offX + x)) * 4;
      const a = scaled[si + 3];
      // composite over the background
      const inv = (255 - a) / 255;
      out[di] = Math.round((scaled[si] * a + bgR * 255 * inv) / 255);
      out[di + 1] = Math.round((scaled[si + 1] * a + bgG * 255 * inv) / 255);
      out[di + 2] = Math.round((scaled[si + 2] * a + bgB * 255 * inv) / 255);
      out[di + 3] = 255;
    }
  }

  return out;
}

// ---- generate ----
if (!fs.existsSync(LOGO_PATH)) {
  console.error("Missing public/logo.png — copy the DealRoot logo there first.");
  process.exit(1);
}

const { width: logoW, height: logoH, rgba: logoRgba } = readPngRgba(LOGO_PATH);
const corner = logoRgba;
const bgHex = `#${[0, 1, 2].map((i) => corner[i].toString(16).padStart(2, "0")).join("")}`;
console.log(`Logo: ${logoW}x${logoH} RGBA, background ~${bgHex}`);

fs.mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, kind: "any" },
  { file: "icon-512.png", size: 512, kind: "any" },
  { file: "icon-maskable-512.png", size: 512, kind: "maskable" },
  { file: "apple-touch-icon.png", size: 180, kind: "any" },
];

for (const target of targets) {
  const rgba =
    target.kind === "maskable"
      ? maskableFromLogo(logoRgba, logoW, logoH, target.size)
      : scaleRgba(logoRgba, logoW, logoH, target.size, target.size);
  const png = encodePng(target.size, target.size, rgba);
  fs.writeFileSync(path.join(OUT_DIR, target.file), png);
  console.log(`✓ ${target.file} (${target.size}x${target.size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

console.log("Done.");
