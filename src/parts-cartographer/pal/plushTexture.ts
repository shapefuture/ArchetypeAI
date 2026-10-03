const cache = new Map<string, string>();

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromHex(hex: string) {
  let s = 0;
  for (let i = 0; i < hex.length; i++) s = (s * 31 + hex.charCodeAt(i)) >>> 0;
  return s || 1;
}

export function getPlushTexture(hex: string, size = 256): string {
  const key = `${hex}:${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (typeof document === "undefined") return "";

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return hex;

  const { r, g, b } = hexToRgb(hex);
  const rnd = mulberry32(seedFromHex(hex));

  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);

  // soft tonal clouds — velvety dye variation
  for (let i = 0; i < 48; i++) {
    const v = (rnd() - 0.5) * 34;
    ctx.fillStyle = `rgba(${clamp(r + v)},${clamp(g + v)},${clamp(b + v)},${0.1 + rnd() * 0.16})`;
    ctx.beginPath();
    ctx.ellipse(
      rnd() * size,
      rnd() * size,
      18 + rnd() * 46,
      14 + rnd() * 34,
      rnd() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // dense short fibers
  ctx.lineCap = "round";
  for (let i = 0; i < 16000; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const ang = rnd() * Math.PI * 2;
    const len = 1.1 + rnd() * 3.6;
    const v = (rnd() - 0.5) * 42;
    const a = 0.1 + rnd() * 0.42;
    ctx.strokeStyle = `rgba(${clamp(r + v)},${clamp(g + v)},${clamp(b + v)},${a})`;
    ctx.lineWidth = 0.4 + rnd() * 0.95;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }

  // pale lint specks
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.03 + rnd() * 0.1})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd(), 1);
  }

  // a few darker specks for depth
  for (let i = 0; i < 280; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.07})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1, 1);
  }

  const url = canvas.toDataURL("image/png");
  cache.set(key, url);
  return url;
}

export function warmHex(hex: string, amount = 18) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${clamp(r + amount)},${clamp(g + amount * 0.6)},${clamp(b - amount * 0.2)})`;
}

export function darkHex(hex: string, amount = 42) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${clamp(r - amount)},${clamp(g - amount)},${clamp(b - amount)})`;
}
