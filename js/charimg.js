'use strict';
/* ============ Personajes a partir de una imagen de tu computadora ============
   Todo el procesamiento ocurre en tu navegador: quitar el fondo liso, recortar, reducir y sacar los colores. */
(() => {
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const userErr = msg => Object.assign(new Error(msg), {userMsg: msg});

async function decode(file) {
  if (window.createImageBitmap) { try { return await createImageBitmap(file); } catch {} }
  return new Promise((res, rej) => { const url = URL.createObjectURL(file); const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(userErr('No se pudo abrir esa imagen. Prueba con un PNG o JPG.')); im.src = url; });
}
function toCanvas(src, maxSide) {
  const w0 = src.width || src.naturalWidth, h0 = src.height || src.naturalHeight;
  const k = Math.min(1, maxSide / Math.max(w0, h0));
  const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w0 * k)); cv.height = Math.max(1, Math.round(h0 * k));
  const c = cv.getContext('2d', {willReadFrequently: true}); c.imageSmoothingQuality = 'high'; c.drawImage(src, 0, 0, cv.width, cv.height);
  return cv;
}
/* Quita un fondo liso (blanco, verde, un color plano…) rellenando desde los bordes. Si el fondo no es liso, no toca nada. */
function removeBackground(cv, TOL = 44) {
  const ctx = cv.getContext('2d', {willReadFrequently: true}); const W = cv.width, H = cv.height;
  const im = ctx.getImageData(0, 0, W, H), d = im.data;
  const border = [];
  for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
  for (let y = 1; y < H - 1; y++) border.push(y * W, y * W + W - 1);
  const transp = border.filter(i => d[i * 4 + 3] < 24).length / border.length;
  if (transp > .6) return {removed: false, already: true};
  const bins = new Map();
  border.forEach(i => { if (d[i * 4 + 3] < 24) return; const k = (d[i * 4] >> 4) << 8 | (d[i * 4 + 1] >> 4) << 4 | (d[i * 4 + 2] >> 4); bins.set(k, (bins.get(k) || 0) + 1); });
  let best = -1, bc = 0; bins.forEach((c, k) => { if (c > bc) { bc = c; best = k; } });
  let r = 0, g = 0, b = 0, n = 0;
  border.forEach(i => { const k = (d[i * 4] >> 4) << 8 | (d[i * 4 + 1] >> 4) << 4 | (d[i * 4 + 2] >> 4); if (k === best) { r += d[i * 4]; g += d[i * 4 + 1]; b += d[i * 4 + 2]; n++; } });
  if (!n) return {removed: false};
  r /= n; g /= n; b /= n;
  const dist = i => Math.hypot(d[i * 4] - r, d[i * 4 + 1] - g, d[i * 4 + 2] - b);
  const share = border.filter(i => d[i * 4 + 3] < 24 || dist(i) < TOL).length / border.length;
  if (share < .55) return {removed: false, reason: 'busy'};
  const mark = new Uint8Array(W * H); const stack = [];
  border.forEach(i => { if (!mark[i] && (d[i * 4 + 3] < 24 || dist(i) < TOL)) { mark[i] = 1; stack.push(i); } });
  while (stack.length) {
    const i = stack.pop(), x = i % W, y = (i / W) | 0;
    const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
    for (const j of nb) if (j >= 0 && !mark[j] && (d[j * 4 + 3] < 24 || dist(j) < TOL)) { mark[j] = 1; stack.push(j); }
  }
  let cnt = 0;
  for (let i = 0; i < W * H; i++) if (mark[i]) { d[i * 4 + 3] = 0; cnt++; }
  // borde suave: los píxeles junto al fondo que se le parecen quedan semitransparentes
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (mark[i]) continue;
    if (mark[i - 1] || mark[i + 1] || mark[i - W] || mark[i + W]) { const dd = dist(i); if (dd < TOL * 1.9) d[i * 4 + 3] = Math.round(d[i * 4 + 3] * clamp((dd - TOL) / (TOL * .9), .15, 1)); }
  }
  if (cnt / (W * H) > .97) return {removed: false, reason: 'all'};
  ctx.putImageData(im, 0, 0);
  return {removed: true, ratio: cnt / (W * H), color: hex(r, g, b)};
}
function trim(cv) {
  const W = cv.width, H = cv.height, d = cv.getContext('2d', {willReadFrequently: true}).getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) throw userErr('La imagen quedó vacía al quitar el fondo. Vuelve a subirla con "Quitar fondo" desactivado.');
  const pad = 4; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
  const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}
/* colores aproximados por franjas (pelo, piel, prenda, pantalón, zapatos) para el doble de ejercicios */
function palette(cv) {
  const W = cv.width, H = cv.height, d = cv.getContext('2d', {willReadFrequently: true}).getImageData(0, 0, W, H).data;
  const band = (a, b, xa = .3, xb = .7, def) => {
    const bins = new Map();
    for (let y = Math.floor(H * a); y < Math.ceil(H * b); y++) for (let x = Math.floor(W * xa); x < Math.ceil(W * xb); x++) {
      const i = (y * W + x) * 4; if (d[i + 3] < 200) continue;
      const k = (d[i] >> 5) << 6 | (d[i + 1] >> 5) << 3 | (d[i + 2] >> 5); const e = bins.get(k) || [0, 0, 0, 0]; e[0] += d[i]; e[1] += d[i + 1]; e[2] += d[i + 2]; e[3]++; bins.set(k, e);
    }
    let best = null; bins.forEach(e => { if (!best || e[3] > best[3]) best = e; });
    return best ? hex(best[0] / best[3], best[1] / best[3], best[2] / best[3]) : def;
  };
  return {hairColor: band(0, .06, .3, .7, '#222222'), skin: band(.08, .17, .38, .62, '#c48a64'), topColor: band(.3, .5, .3, .7, '#3a7bd5'), pants: band(.74, .9, .3, .7, '#22262e'), shoes: band(.95, 1, .2, .8, '#eeeeee')};
}
const canvasBlob = (cv, type = 'image/png', q) => new Promise(r => cv.toBlob(r, type, q));

App.CharImage = {
  accept: 'image/png,image/jpeg,image/webp,image/gif',
  async fromFile(file, {removeBg = true} = {}) {
    if (!file || !/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw userErr('Usa una imagen PNG, JPG o WebP de tu computadora.');
    if (file.size > 30 * 1024 * 1024) throw userErr('La imagen pesa más de 30 MB. Usa una más liviana.');
    const src = await decode(file);
    let cv = toCanvas(src, 1400);
    const bg = removeBg ? removeBackground(cv) : {removed: false, off: true};
    cv = trim(cv);
    const out = toCanvas(cv, 900);
    const blob = await canvasBlob(out, 'image/png');
    return {canvas: out, blob, bg, palette: palette(out), w: out.width, h: out.height, name: file.name};
  },
  /* se guarda en tu nube gratuita; si no está disponible, una copia reducida queda dentro del personaje */
  async save(res) {
    const up = await App.Files.upload(res.blob, 'la imagen del personaje');
    if (up) return {src: App.Files.url(up.id), assetId: up.id, w: res.w, h: res.h};
    const small = toCanvas(res.canvas, 380); let src = small.toDataURL('image/webp', .86); if (!src.startsWith('data:image/webp')) src = small.toDataURL('image/png');
    return {src, w: res.w, h: res.h, local: true};
  },
  /* copia reducida dentro del archivo (para exportar personajes con imagen a la versión de escritorio) */
  async embed(src) {
    if (!src || src.startsWith('data:')) return src;
    try { const blob = await (await fetch(src)).blob(); const bmp = await decode(blob); const small = toCanvas(bmp, 380); let out = small.toDataURL('image/webp', .86); if (!out.startsWith('data:image/webp')) out = small.toDataURL('image/png'); return out; } catch { return src; }
  },
  bgNote(bg) {
    if (bg.already) return 'La imagen ya tenía el fondo transparente.';
    if (bg.removed) return 'Fondo liso quitado automáticamente.';
    if (bg.off) return 'Se usó la imagen con su fondo.';
    if (bg.reason === 'busy') return 'El fondo no es de un solo color, así que se dejó como está. Para mejor resultado usa un PNG sin fondo.';
    return 'No se pudo quitar el fondo; se dejó la imagen como está.';
  },
  async analyze(blob, mod) {
    return App.AI.json(`Esta imagen es un personaje que el usuario subió desde su computadora para usarlo en videos animados faceless de ${mod === 'gym' ? 'entrenamiento físico' : 'finanzas y emprendimiento'} en español.
Describe lo necesario para su ficha y para crear un "doble" humano animado con sus mismos colores (se usa en las demostraciones de ejercicios).
Colores en hexadecimal tal como se ven en la imagen. Si no es humano (animal, objeto, mascota), elige colores parecidos para el doble.
"conocido": true solo si parece un personaje o mascota de una marca, serie, juego o canal existente; explica en "aviso" en una frase. No identifiques a personas reales.
Formato: {"nombre":"nombre corto en MAYÚSCULAS","rol":"rol en el canal (1 frase)","personalidad":"1-2 frases","cuerpo":"m|f","piel":"#","pelo":"short|fade|curly|long|bun|ponytail|bald","color_pelo":"#","color_prenda":"#","color_pantalon":"#","color_zapatos":"#","mira_hacia":"frente|derecha|izquierda","conocido":false,"aviso":""}`, {images: [blob], tier: 'default', label: 'Analizar imagen de personaje'});
  }
};
})();
