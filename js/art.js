'use strict';
/* ============ Arte 2D: personajes con esqueleto (IK), expresiones, poses, movimientos de gym, fondos y objetos ============ */
const Art = App.Art = {};
(() => {
const D2R = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
function shade(hex, amt) {
  let c = String(hex || '#888').replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => clampN(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
  return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}
Art.shade = shade;
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
Art.rr = rr;

/* ---------- personajes por defecto ---------- */
Art.defaultCharacters = [
  {id: 'nico', name: 'NICO', module: 'fin', role: 'Joven que empieza desde cero',
    personality: 'Curioso, optimista, honesto sobre lo que no sabe; aprende rápido y lo cuenta con humor.',
    look: {skin: '#b97a56', hair: 'fade', hairColor: '#1b1410', top: 'hoodie', topColor: '#1fa37a', pants: '#2b3445', shoes: '#f2f2f2', acc: 'none', build: 1},
    voice: {engine: 'claude', voice: 'airy', rate: 1.06, pitch: 1.05, gender: 'm', style: 'energético'}},
  {id: 'marcus', name: 'MARCUS', module: 'fin', role: 'Empresario experimentado',
    personality: 'Calmado, directo y paciente; explica con ejemplos reales y odia las promesas fáciles.',
    look: {skin: '#6b4430', hair: 'short', hairColor: '#9a9a9a', top: 'blazer', topColor: '#1f3355', shirt: '#e9eef5', pants: '#1b2232', shoes: '#3a2418', acc: 'glasses+beard', beardColor: '#a5a5a5', build: 1.06},
    voice: {engine: 'claude', voice: 'rounded', rate: .96, pitch: .9, gender: 'm', style: 'educativo'}},
  {id: 'alex', name: 'ALEX', module: 'fin', role: 'Comete errores económicos y aprende',
    personality: 'Impulsivo y simpático; cae en tentaciones de gasto y trampas comunes, pero reconoce sus errores.',
    look: {skin: '#e3b28f', hair: 'curly', hairColor: '#5a3622', top: 'tee', topColor: '#ef5a3c', pants: '#3d4f6b', shoes: '#262626', acc: 'cap', capColor: '#20262e', build: .98},
    voice: {engine: 'claude', voice: 'glassy', rate: 1.1, pitch: 1.1, gender: 'm', style: 'narrativo'}},
  {id: 'lia', name: 'LÍA', module: 'fin', role: 'Emprendedora digital',
    personality: 'Estratégica, práctica y cercana; prueba ideas pequeñas, mide resultados y comparte números reales.',
    look: {skin: '#c98f68', hair: 'long', hairColor: '#2a1712', top: 'blazer', topColor: '#d9a43b', shirt: '#1d2430', pants: '#232a36', shoes: '#c9483b', acc: 'earrings', build: .95},
    voice: {engine: 'claude', voice: 'buttery', rate: 1.02, pitch: 1.15, gender: 'f', style: 'educativo'}},
  {id: 'nexo', name: 'NEXO', module: 'gym', role: 'Atleta demostrador del Training Lab',
    personality: 'Preciso, técnico y motivador sin exagerar; muestra cada método con buena técnica.',
    look: {skin: '#a8714f', hair: 'fade', hairColor: '#141010', top: 'tank', topColor: '#ff7a45', pants: '#1c2026', shoes: '#f4f4f4', acc: 'headband', bandColor: '#f4f4f4', build: 1.08},
    voice: {engine: 'claude', voice: 'glassy', rate: 1.04, pitch: 1, gender: 'm', style: 'energético'}},
  {id: 'tomi', name: 'TOMI', module: 'fin', role: 'Stickman ahorrador y paciente',
    personality: 'Tranquilo, observador y práctico; explica el dinero con dibujos simples y ejemplos del día a día.',
    look: {style: 'stick', skin: '#ffffff', ink: '#151515', topColor: '#2ee59d', acc: 'tie', hair: 'short', hairColor: '#151515', top: 'tee', pants: '#151515', shoes: '#151515', build: 1},
    voice: {engine: 'claude', voice: 'rounded', rate: .88, pitch: .72, gender: 'm', style: 'narrativo', _v: 2}},
  {id: 'boli', name: 'BOLI', module: 'fin', role: 'Stickman impulsivo que persigue el dinero rápido',
    personality: 'Entusiasta y exagerado; se emociona con el dinero fácil, comete errores y aprende de ellos.',
    look: {style: 'stick3d', skin: '#e6e2db', ink: '#141414', acc: 'none', hair: 'short', hairColor: '#141414', top: 'tee', topColor: '#e6e2db', pants: '#141414', shoes: '#141414', build: 1},
    voice: {engine: 'claude', voice: 'buttery', rate: .92, pitch: .8, gender: 'm', style: 'educativo', _v: 2}},
  {id: 'volt', name: 'VOLT', module: 'gym', role: 'Atleta anatómico: muestra qué músculo trabaja',
    personality: 'Directo, técnico y motivador; enseña la técnica correcta y señala el músculo que trabaja.',
    look: {style: 'anatomy', body: 'm', skin: '#78d6b0', pants: '#1c2026', acc: 'visor', visorColor: '#ffe14d', hair: 'fade', hairColor: '#1e3b32', top: 'tank', topColor: '', shoes: '#78d6b0', build: 1.1},
    voice: {engine: 'claude', voice: 'glassy', rate: 1.06, pitch: 1, gender: 'm', style: 'energético'}},
  {id: 'kora', name: 'KORA', module: 'gym', role: 'Atleta anatómica de fuerza y movilidad',
    personality: 'Precisa y cercana; corrige errores de técnica sin juzgar y explica el porqué.',
    look: {style: 'anatomy', body: 'f', skin: '#c4a7e7', pants: '#1f2a33', topColor: '#1f2a33', hair: 'ponytail', hairColor: '#7d5fa6', acc: 'none', top: 'tank', shoes: '#c4a7e7', build: 1},
    voice: {engine: 'claude', voice: 'buttery', rate: 1.02, pitch: 1.1, gender: 'f', style: 'educativo'}}
];

/* ---------- expresiones ---------- */
Art.EXPR = {
  neutral: {bl: [0, 0], br: [0, 0], eye: 1, mouth: 'smile'}, happy: {bl: [-3, -4], br: [-3, 4], eye: .9, mouth: 'grin'},
  excited: {bl: [-6, -6], br: [-6, 6], eye: 1.15, mouth: 'open'}, surprised: {bl: [-9, 0], br: [-9, 0], eye: 1.3, mouth: 'o'},
  worried: {bl: [-3, 14], br: [-3, -14], eye: 1.05, mouth: 'wavy'}, thinking: {bl: [1, 0], br: [-7, 6], eye: .95, mouth: 'side', look: [-3, -3]},
  confident: {bl: [2, -8], br: [0, 6], eye: .85, mouth: 'smirk'}, sad: {bl: [-2, 16], br: [-2, -16], eye: .9, mouth: 'frown'},
  angry: {bl: [3, -16], br: [3, 16], eye: .95, mouth: 'tight'}
};
Art.EXPR_LABEL = {neutral: 'Neutral', happy: 'Feliz', excited: 'Emocionado', surprised: 'Sorprendido', worried: 'Preocupado', thinking: 'Pensativo', confident: 'Seguro', sad: 'Triste', angry: 'Molesto'};

/* ---------- utilidades de esqueleto ---------- */
const L = {thigh: 72, shin: 70, up: 58, fore: 56, torso: 108};
function ik(ax, ay, bx, by, l1, l2, side) {
  let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || .01; const max = l1 + l2 - .5;
  if (d > max) { bx = ax + dx / d * max; by = ay + dy / d * max; dx = bx - ax; dy = by - ay; d = max; }
  d = Math.max(d, Math.abs(l1 - l2) + .5);
  const a = Math.acos(clampN((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const base = Math.atan2(dy, dx), ang = base + side * a;
  return [ax + Math.cos(ang) * l1, ay + Math.sin(ang) * l1, bx, by];
}
const STAND = {P: [0, -150], T: 0, H: 0, hf: .3, fF: [-8, -10], fN: [8, -10], hF: [-12, -150], hN: [12, -148], ks: -1, esF: 1, esN: 1};
function mix(a, b, t) {
  const o = {};
  for (const k in a) {
    const va = a[k], vb = b[k] !== undefined ? b[k] : va;
    if (typeof va === 'number' && typeof vb === 'number') o[k] = lerp(va, vb, t);
    else if (Array.isArray(va) && Array.isArray(vb) && va.length === vb.length && typeof va[va.length - 1] === 'number' && va[0] === vb[0]) o[k] = va.map((x, i) => typeof x === 'number' ? lerp(x, vb[i], t) : x);
    else o[k] = t < .5 ? va : vb;
  }
  for (const k in b) if (o[k] === undefined) o[k] = b[k];
  return o;
}
Art.mixPose = mix;
/* keyframes: [[t, parcial], ...] con t en 0..1 */
function K(keys) {
  const full = keys.map(([t, p]) => [t, {...STAND, ...p}]);
  return ph => {
    ph = ((ph % 1) + 1) % 1;
    for (let i = 0; i < full.length - 1; i++) {
      const [t0, a] = full[i], [t1, b] = full[i + 1];
      if (ph >= t0 && ph <= t1) return mix(a, b, ease((ph - t0) / Math.max(1e-6, t1 - t0)));
    }
    return full[full.length - 1][1];
  };
}
/* posición de hombro dado P y T */
const shoulderOf = (P, T) => [P[0] + Math.sin(T * D2R) * L.torso, P[1] - Math.cos(T * D2R) * L.torso];
/* cuerpo rígido entre pies y hombro (plancha, flexión) */
function rod(feet, S) { const r = 142 / 250; const P = [lerp(feet[0], S[0], r), lerp(feet[1], S[1], r)]; const T = Math.atan2(S[0] - P[0], -(S[1] - P[1])) / D2R; return {P, T}; }

/* ---------- poses y movimientos (función de fase 0..1 y tiempo) ---------- */
const M = Art.MOVES = {};
const def = (id, label, dur, fn, extra = {}) => M[id] = {id, label, dur, fn, ...extra};
// --- poses de actuación ---
def('idle', 'De pie', 3, (p, t) => ({...STAND, P: [0, -150 + Math.sin(t * 2.2) * 1.2], hF: [-12, -150 + Math.sin(t * 2.2)], hN: [12, -148 + Math.sin(t * 2.2 + .5)]}));
def('talk', 'Explicando', 2.4, (p, t) => ({...STAND, H: Math.sin(t * 2.7) * 3, hN: [34 + Math.sin(t * 3.1) * 12, -192 + Math.sin(t * 4.3) * 16], esN: 1, hF: [-10 + Math.sin(t * 2.3) * 6, -160 + Math.sin(t * 3.7) * 10]}));
def('point', 'Señalando', 2, (p, t) => ({...STAND, T: 3, H: -4, hN: [104 + Math.sin(t * 3) * 3, -262 + Math.sin(t * 2) * 4], hF: [-12, -152]}));
def('think', 'Pensando', 3, (p, t) => ({...STAND, H: 8 + Math.sin(t * 1.5) * 2, hN: [22, -262], esN: 1, hF: [18, -200], esF: 1}));
def('celebrate', 'Celebrando', 1, (p, t) => { const b = Math.abs(Math.sin(p * Math.PI)); return {...STAND, P: [0, -150 - b * 14], fF: [-10, -10 - b * 14], fN: [10, -10 - b * 14], hF: [-46, -370 - b * 14], hN: [52, -372 - b * 14], esF: -1, esN: 1, H: -4}; });
def('worried', 'Preocupado', 2, (p, t) => ({...STAND, P: [0, -148], T: -2, H: Math.sin(t * 6) * 2 - 4, hF: [14, -206 + Math.sin(t * 9) * 3], hN: [24, -210 + Math.sin(t * 9 + 1) * 3], esF: 1, esN: 1}));
def('shrug', 'Encogiéndose', 2.2, (p, t) => { const s = Math.max(0, Math.sin(p * Math.PI * 2)); return {...STAND, P: [0, -150 + s * 2], hF: [-58, -196 - s * 14], hN: [64, -196 - s * 14], esF: 1, esN: -1, H: s * 6}; });
def('walk', 'Caminando', 1.1, (p) => walkPose(p, 26, 1));
def('present', 'Presentando', 2.4, (p, t) => ({...STAND, T: -2, hN: [78 + Math.sin(t * 2) * 6, -214], esN: 1, hF: [-30, -176], esF: 1}));
def('facepalm', 'Lamentando', 2.5, (p, t) => ({...STAND, T: 6, H: 14, hN: [22, -306], esN: 1, hF: [-12, -152]}));
def('count', 'Contando dinero', .9, (p, t) => ({...STAND, H: 10, hN: [40 + Math.sin(p * Math.PI * 2) * 6, -196], hF: [30, -194], esN: 1, esF: 1}), {prop: 'bills'});
function walkPose(p, stride, arms) {
  const a = p * Math.PI * 2, bob = Math.abs(Math.sin(a)) * 4;
  const foot = ph => [Math.cos(ph) * stride, -10 - Math.max(0, Math.sin(ph)) * 16];
  return {...STAND, P: [0, -148 - bob], T: 4, fN: foot(a), fF: foot(a + Math.PI),
    hN: arms ? ['S', -Math.cos(a) * 22, 108] : STAND.hN, hF: arms ? ['S', Math.cos(a) * 22, 108] : STAND.hF};
}
// --- movimientos de entrenamiento ---
def('squat', 'Sentadilla', 2.6, K([[0, {hN: ['S', 98, 10], hF: ['S', 92, 12], esN: 1, esF: 1}], [.45, {P: [-34, -82], T: 40, hN: ['S', 104, 18], hF: ['S', 98, 20], esN: 1, esF: 1}], [.6, {P: [-34, -82], T: 40, hN: ['S', 104, 18], hF: ['S', 98, 20]}], [1, {hN: ['S', 98, 10], hF: ['S', 92, 12]}]]), {muscles: ['legs', 'glutes', 'core']});
def('goblet', 'Sentadilla goblet', 2.8, K([[0, {hN: ['S', 34, 44], hF: ['S', 28, 46], esN: 1, esF: 1}], [.45, {P: [-30, -84], T: 34, hN: ['S', 34, 44], hF: ['S', 28, 46]}], [.6, {P: [-30, -84], T: 34, hN: ['S', 34, 44], hF: ['S', 28, 46]}], [1, {hN: ['S', 34, 44], hF: ['S', 28, 46]}]]), {prop: 'kbchest', muscles: ['legs', 'glutes', 'core']});
def('backsquat', 'Sentadilla con barra', 3, K([[0, {hN: ['S', 6, 6], hF: ['S', -6, 6], esN: 1, esF: 1}], [.45, {P: [-38, -86], T: 44, hN: ['S', 6, 6], hF: ['S', -6, 6]}], [.58, {P: [-38, -86], T: 44, hN: ['S', 6, 6], hF: ['S', -6, 6]}], [1, {hN: ['S', 6, 6], hF: ['S', -6, 6]}]]), {prop: 'barback', muscles: ['legs', 'glutes', 'back', 'core']});
def('deadlift', 'Peso muerto', 3, K([[0, {P: [-58, -100], T: 56, hN: [24, -46], hF: [18, -46], esN: 1, esF: 1}], [.42, {P: [-3, -150], T: 3, hN: [10, -146], hF: [4, -146]}], [.58, {P: [-3, -150], T: 3, hN: [10, -146], hF: [4, -146]}], [1, {P: [-58, -100], T: 56, hN: [24, -46], hF: [18, -46]}]]), {prop: 'barhands', muscles: ['hamstrings', 'glutes', 'back', 'grip']});
def('press', 'Press militar', 2.6, K([[0, {hN: ['S', 18, 8], hF: ['S', 10, 8], esN: -1, esF: -1}], [.42, {hN: ['S', 6, -112], hF: ['S', 0, -112], esN: -1, esF: -1}], [.55, {hN: ['S', 6, -112], hF: ['S', 0, -112]}], [1, {hN: ['S', 18, 8], hF: ['S', 10, 8]}]]), {prop: 'barhands', muscles: ['shoulders', 'arms', 'core']});
def('bench', 'Press de banca', 2.6, K([[0, {P: [-20, -74], T: -90, hf: 1, H: 0, fF: [52, -10], fN: [64, -10], hN: ['S', 34, -112], hF: ['S', 28, -112], esN: 1, esF: 1}], [.45, {P: [-20, -74], T: -90, hf: 1, hN: ['S', 40, -32], hF: ['S', 34, -32]}], [.55, {P: [-20, -74], T: -90, hf: 1, hN: ['S', 40, -32], hF: ['S', 34, -32]}], [1, {P: [-20, -74], T: -90, hf: 1, hN: ['S', 34, -112], hF: ['S', 28, -112]}]]), {prop: 'bench', muscles: ['chest', 'arms', 'shoulders']});
def('row', 'Remo con mancuerna', 2.2, K([[0, {P: [-44, -126], T: 52, hN: ['S', 4, 110], hF: ['S', 2, 110], esN: 1, esF: 1}], [.45, {P: [-44, -126], T: 52, hN: ['S', -34, 40], hF: ['S', 2, 110]}], [.55, {P: [-44, -126], T: 52, hN: ['S', -34, 40], hF: ['S', 2, 110]}], [1, {P: [-44, -126], T: 52, hN: ['S', 4, 110], hF: ['S', 2, 110]}]]), {prop: 'dumbbells', muscles: ['back', 'arms', 'grip']});
def('curl', 'Curl de bíceps', 2, K([[0, {hN: [8, -146], hF: [-6, -148], esN: -1, esF: -1}], [.45, {hN: [36, -248], hF: [22, -250], esN: -1, esF: -1}], [.55, {hN: [36, -248], hF: [22, -250]}], [1, {hN: [8, -146], hF: [-6, -148]}]]), {prop: 'dumbbells', muscles: ['arms', 'grip']});
const BAR_Y = -410;
def('pullup', 'Dominadas', 2.6, K([[0, {P: [0, -186], T: -4, fF: [-14, -52], fN: [-2, -50], hN: [10, BAR_Y], hF: [-6, BAR_Y], esN: -1, esF: -1}], [.45, {P: [4, -282], T: -6, fF: [-14, -150], fN: [-4, -146], hN: [10, BAR_Y], hF: [-6, BAR_Y]}], [.58, {P: [4, -282], T: -6, fF: [-14, -150], fN: [-4, -146], hN: [10, BAR_Y], hF: [-6, BAR_Y]}], [1, {P: [0, -186], T: -4, fF: [-14, -52], fN: [-2, -50], hN: [10, BAR_Y], hF: [-6, BAR_Y]}]]), {prop: 'pullbar', muscles: ['back', 'arms', 'grip']});
def('hang', 'Colgado (agarre)', 3, (p, t) => { const s = Math.sin(t * 1.6) * 4; return {...STAND, P: [s, -186], T: -2 + s * .3, fF: [-12 + s, -50], fN: [0 + s, -48], hN: [10, BAR_Y], hF: [-6, BAR_Y], esN: -1, esF: -1}; }, {prop: 'pullbar', muscles: ['grip', 'arms', 'back']});
const RING_Y = -236;
def('dip', 'Fondos en anillas', 2.4, K([[0, {P: [0, -246], T: 2, fF: [-38, -130], fN: [-26, -126], hN: [10, RING_Y], hF: [-6, RING_Y], esN: 1, esF: 1, ks: 1}], [.45, {P: [-16, -186], T: 16, fF: [-58, -70], fN: [-46, -66], hN: [10, RING_Y], hF: [-6, RING_Y], ks: 1}], [.55, {P: [-16, -186], T: 16, fF: [-58, -70], fN: [-46, -66], hN: [10, RING_Y], hF: [-6, RING_Y], ks: 1}], [1, {P: [0, -246], T: 2, fF: [-38, -130], fN: [-26, -126], hN: [10, RING_Y], hF: [-6, RING_Y], ks: 1}]]), {prop: 'rings', muscles: ['chest', 'arms', 'shoulders']});
const pushTop = rod([-150, -12], [92, -126]), pushBot = rod([-150, -12], [100, -58]);
def('pushup', 'Flexiones', 2, K([[0, {...pushTop, hf: .8, fF: [-152, -12], fN: [-146, -12], hN: [96, -12], hF: [86, -12], esN: -1, esF: -1}], [.45, {...pushBot, hf: .8, fF: [-152, -12], fN: [-146, -12], hN: [96, -12], hF: [86, -12], esN: -1, esF: -1}], [.55, {...pushBot, hf: .8, fF: [-152, -12], fN: [-146, -12], hN: [96, -12], hF: [86, -12]}], [1, {...pushTop, hf: .8, fF: [-152, -12], fN: [-146, -12], hN: [96, -12], hF: [86, -12]}]]), {prop: 'mat', muscles: ['chest', 'arms', 'core']});
const plankP = rod([-150, -12], [78, -66]);
def('plank', 'Plancha (isométrico)', 3, (p, t) => ({...STAND, ...plankP, P: [plankP.P[0], plankP.P[1] + Math.sin(t * 9) * .8], hf: .8, fF: [-152, -12], fN: [-146, -12], hN: [124, -14], hF: [116, -14], esN: 1, esF: 1}), {prop: 'mat', muscles: ['core', 'shoulders']});
def('lunge', 'Zancada / split squat', 2.6, K([[0, {P: [0, -146], T: 3, fN: [64, -10], fF: [-74, -16], hN: [14, -150], hF: [-8, -150]}], [.45, {P: [-4, -92], T: 4, fN: [64, -10], fF: [-74, -16], hN: [10, -100], hF: [-12, -100]}], [.55, {P: [-4, -92], T: 4, fN: [64, -10], fF: [-74, -16], hN: [10, -100], hF: [-12, -100]}], [1, {P: [0, -146], T: 3, fN: [64, -10], fF: [-74, -16], hN: [14, -150], hF: [-8, -150]}]]), {prop: 'dumbbells', muscles: ['legs', 'glutes']});
def('jump', 'Salto con contramovimiento', 1.8, K([[0, {}], [.22, {P: [-18, -112], T: 30, hN: ['S', -40, 90], hF: ['S', -46, 90], esN: 1, esF: 1}], [.36, {P: [2, -160], T: 2, fF: [-6, -18], fN: [10, -18], hN: ['S', 20, -100], hF: ['S', 14, -100], esN: -1, esF: -1}], [.52, {P: [2, -232], T: -2, fF: [-12, -86], fN: [12, -90], hN: ['S', 16, -104], hF: ['S', 10, -104]}], [.68, {P: [0, -160], fF: [-8, -14], fN: [8, -14], hN: ['S', 34, 50], hF: ['S', 28, 50], esN: 1, esF: 1}], [.8, {P: [-20, -112], T: 26, hN: ['S', 50, 40], hF: ['S', 44, 40]}], [1, {}]]), {muscles: ['legs', 'glutes', 'calves']});
def('boxjump', 'Salto al cajón', 2.2, K([[0, {P: [-60, -150], fF: [-68, -10], fN: [-52, -10], hF: [-72, -150], hN: [-48, -148]}], [.2, {P: [-78, -112], T: 30, fF: [-68, -10], fN: [-52, -10], hN: ['S', -40, 90], hF: ['S', -46, 90]}], [.42, {P: [-10, -250], T: 8, fF: [-30, -120], fN: [-10, -128], hN: ['S', 30, -40], hF: ['S', 24, -40], esN: -1, esF: -1}], [.6, {P: [44, -200], T: 26, fF: [50, -110], fN: [66, -110], hN: ['S', 46, 30], hF: ['S', 40, 30], esN: 1, esF: 1}], [.8, {P: [56, -250], T: 4, fF: [50, -110], fN: [66, -110], hN: [70, -250], hF: [48, -250]}], [1, {P: [56, -250], T: 4, fF: [50, -110], fN: [66, -110], hN: [70, -250], hF: [48, -250]}]]), {prop: 'box', muscles: ['legs', 'glutes', 'calves']});
function runPose(p, stride, lean, lift) {
  const a = p * Math.PI * 2, bob = Math.abs(Math.cos(a)) * 6;
  const foot = ph => [Math.cos(ph) * stride + 6, -10 - Math.max(0, Math.sin(ph)) * lift];
  return {...STAND, P: [0, -142 - bob], T: lean, fN: foot(a), fF: foot(a + Math.PI), hN: ['S', -Math.cos(a) * 44, 70 + Math.sin(a) * 10], hF: ['S', Math.cos(a) * 44, 70 - Math.sin(a) * 10], esN: -1, esF: -1};
}
def('sprint', 'Sprint', .62, p => runPose(p, 58, 16, 52), {loco: 9, muscles: ['legs', 'glutes', 'hamstrings']});
def('jog', 'Trote / cardio continuo', .8, p => runPose(p, 36, 6, 26), {loco: 4, muscles: ['legs', 'calves']});
def('crawl', 'Gateo (bear crawl)', 1.4, p => {
  const a = p * Math.PI * 2, s1 = Math.max(0, Math.sin(a)) * 18, s2 = Math.max(0, Math.sin(a + Math.PI)) * 18;
  const c1 = Math.cos(a) * 22, c2 = Math.cos(a + Math.PI) * 22;
  return {...STAND, P: [-40, -98 + Math.sin(a * 2) * 2], T: 74, hf: .7, hN: [96 + c1, -12 - s1], hF: [80 + c2, -12 - s2], fN: [-58 + c2, -10 - s2 * .6], fF: [-70 + c1, -10 - s1 * .6], esN: -1, esF: -1};
}, {loco: 2.2, prop: 'mat', muscles: ['core', 'shoulders', 'legs']});
def('kbswing', 'Swing con kettlebell', 1.5, K([[0, {P: [-48, -118], T: 56, hN: [-10, -96], hF: [-16, -96], esN: 1, esF: 1}], [.4, {P: [-2, -150], T: -4, hN: [104, -246], hF: [96, -246]}], [.55, {P: [-2, -150], T: -2, hN: [96, -230], hF: [88, -230]}], [1, {P: [-48, -118], T: 56, hN: [-10, -96], hF: [-16, -96]}]]), {prop: 'kbhands', muscles: ['glutes', 'hamstrings', 'core', 'grip']});
def('clean', 'Cargada (halterofilia)', 2.4, K([[0, {P: [-58, -100], T: 52, hN: [24, -46], hF: [18, -46], esN: 1, esF: 1}], [.3, {P: [-6, -150], T: 4, hN: [12, -150], hF: [6, -150]}], [.42, {P: [4, -166], T: -8, fF: [-6, -22], fN: [10, -22], hN: ['S', 20, 40], hF: ['S', 14, 40], esN: 1, esF: 1}], [.55, {P: [-24, -116], T: 14, hN: ['S', 24, 6], hF: ['S', 18, 6], esN: -1, esF: -1}], [.72, {P: [-2, -150], T: 2, hN: ['S', 24, 6], hF: ['S', 18, 6], esN: -1, esF: -1}], [.84, {P: [-2, -150], T: 2, hN: [12, -150], hF: [6, -150], esN: 1, esF: 1}], [1, {P: [-58, -100], T: 52, hN: [24, -46], hF: [18, -46]}]]), {prop: 'barhands', muscles: ['legs', 'glutes', 'back', 'shoulders']});
def('slam', 'Lanzamiento de balón medicinal', 1.6, K([[0, {hN: ['S', 16, -112], hF: ['S', 10, -112], esN: -1, esF: -1, P: [0, -156], fF: [-8, -16], fN: [8, -16]}], [.35, {P: [-30, -104], T: 46, hN: [80, -30], hF: [74, -30], esN: 1, esF: 1}], [.55, {P: [-30, -110], T: 40, hN: [70, -60], hF: [64, -60]}], [.8, {P: [-14, -132], T: 20, hN: [60, -110], hF: [54, -110]}], [1, {hN: ['S', 16, -112], hF: ['S', 10, -112], P: [0, -156], fF: [-8, -16], fN: [8, -16]}]]), {prop: 'medball', muscles: ['core', 'shoulders', 'back']});
def('sled', 'Empuje de trineo', .9, p => { const r = runPose(p, 44, 48, 22); return {...r, P: [r.P[0] - 30, r.P[1] + 22], hN: [104, -176], hF: [98, -180], esN: 1, esF: 1}; }, {loco: 2.6, prop: 'sled', muscles: ['legs', 'glutes', 'calves']});
def('carry', 'Paseo del granjero', 1.2, p => ({...walkPose(p, 22, 0), T: 0, hN: ['S', 6, 112], hF: ['S', -4, 112]}), {loco: 2.4, prop: 'handles', muscles: ['grip', 'core', 'back']});
def('ropes', 'Cuerdas de batalla', .5, p => { const a = p * Math.PI * 2; return {...STAND, P: [-18, -118], T: 16, hN: [70, -170 + Math.sin(a) * 34], hF: [62, -170 - Math.sin(a) * 34], esN: 1, esF: 1}; }, {prop: 'ropes', muscles: ['shoulders', 'arms', 'core']});
def('climb', 'Escalada / bouldering', 3, K([[0, {P: [8, -196], T: -8, H: -12, fF: [44, -100], fN: [48, -60], hN: [56, -330], hF: [52, -400], esN: 1, esF: 1}], [.5, {P: [10, -250], T: -10, H: -14, fF: [46, -160], fN: [48, -100], hN: [58, -430], hF: [52, -400]}], [1, {P: [8, -196], T: -8, H: -12, fF: [44, -100], fN: [48, -60], hN: [56, -330], hF: [52, -400]}]]), {prop: 'wall', muscles: ['grip', 'back', 'arms']});
def('clubs', 'Clubs / macebell 360', 2, p => { const a = p * Math.PI * 2; return {...STAND, P: [0, -148], fF: [-22, -10], fN: [22, -10], hN: ['S', 10 + Math.cos(a) * 46, -60 + Math.sin(a) * 36], hF: ['S', 4 + Math.cos(a) * 46, -58 + Math.sin(a) * 36], esN: -1, esF: -1, clubA: a}; }, {prop: 'club', muscles: ['shoulders', 'grip', 'core']});
def('sandbag', 'Sandbag al hombro', 2.8, K([[0, {P: [-40, -98], T: 50, hN: [46, -56], hF: [36, -56], esN: 1, esF: 1, bag: 0}], [.35, {P: [-12, -140], T: 8, hN: [40, -196], hF: [30, -196], bag: .5}], [.5, {P: [-2, -150], T: 0, hN: ['S', 10, -10], hF: ['S', -16, 10], bag: 1}], [.75, {P: [-2, -150], T: 0, hN: ['S', 10, -10], hF: ['S', -16, 10], bag: 1}], [1, {P: [-40, -98], T: 50, hN: [46, -56], hF: [36, -56], bag: 0}]]), {prop: 'sandbag', muscles: ['legs', 'back', 'grip', 'core']});
def('stone', 'Piedra Atlas', 3, K([[0, {P: [-36, -92], T: 46, hN: [62, -60], hF: [52, -56], esN: 1, esF: 1, st: 0}], [.3, {P: [-26, -112], T: 30, hN: [54, -110], hF: [44, -106], st: .3}], [.55, {P: [0, -150], T: -6, fF: [-6, -16], fN: [10, -16], hN: [58, -214], hF: [48, -210], st: .8}], [.7, {P: [6, -150], T: 4, hN: [80, -228], hF: [70, -224], st: 1}], [.85, {P: [6, -150], T: 4, hN: [30, -150], hF: [20, -150], st: 1}], [1, {P: [-36, -92], T: 46, hN: [62, -60], hF: [52, -56], st: 0}]]), {prop: 'stone', muscles: ['back', 'legs', 'arms', 'core']});
def('stretch', 'Estiramiento / movilidad de cadera', 4, K([[0, {}], [.45, {P: [-40, -146], T: 72, hN: [56, -54], hF: [48, -50], esN: 1, esF: 1}], [.65, {P: [-40, -146], T: 72, hN: [56, -54], hF: [48, -50]}], [1, {}]]), {prop: 'mat', muscles: ['hamstrings', 'back']});
def('mobility', 'Movilidad articular', 2.4, p => { const a = p * Math.PI * 2; return {...STAND, P: [Math.sin(a) * 8, -150], T: Math.sin(a) * 4, hN: ['S', Math.cos(a) * 60, -Math.sin(a) * 60 + 10], hF: ['S', -Math.cos(a + 1) * 60, -Math.sin(a + 1) * 60 + 10], esN: -1, esF: 1}; }, {muscles: ['shoulders']});
def('breathe', 'Respiración', 6, (p, t) => { const s = Math.sin(p * Math.PI * 2); return {...STAND, P: [0, -150 - s * 1.5], H: -s * 3, hN: [24, -214 + s * 6], hF: [16, -178 - s * 4], esN: 1, esF: 1, chest: s}; }, {prop: 'breath', muscles: ['core']});
def('handstand', 'Parada de manos', 3, (p, t) => { const s = Math.sin(t * 1.4) * 3; return {...STAND, P: [10 + s, -238], T: 180 + s * .4, hf: 1, fF: [8 + s * 1.8, -376], fN: [16 + s * 1.8, -378], hN: [20, -12], hF: [2, -12], esN: 1, esF: -1, ks: 1}; }, {prop: 'mat', muscles: ['shoulders', 'arms', 'core']});
def('nordic', 'Curl nórdico', 3.4, p => {
  const a = p < .6 ? ease(p / .6) * 62 : p < .7 ? 62 : (1 - ease((p - .7) / .3)) * 62;
  const K0 = [6, -16], P = [K0[0] + Math.sin(a * D2R) * 72, K0[1] - Math.cos(a * D2R) * 72];
  const catchF = p > .5 && p < .78 ? 1 : 0;
  return {...STAND, P, T: a, hf: .5, fN: [-62, -16], fF: [-66, -16], ks: -1, hN: catchF ? [128, -14] : ['S', 24, 48], hF: catchF ? [118, -14] : ['S', 18, 48], esN: 1, esF: 1};
}, {prop: 'nordicpad', muscles: ['hamstrings']});
def('flywheel', 'Sentadilla excéntrica (polea/flywheel)', 3, M.backsquat.fn, {prop: 'barback', muscles: ['legs', 'glutes']});
Art._ik = ik; Art._L = L; Art._shoulderOf = shoulderOf; Art._BAR_Y = BAR_Y; Art._RING_Y = RING_Y;
Art.moveList = Object.values(M).filter(m => !['idle', 'talk', 'point', 'think', 'celebrate', 'worried', 'shrug', 'walk', 'present', 'facepalm', 'count'].includes(m.id));
Art.actList = ['idle', 'talk', 'point', 'think', 'celebrate', 'worried', 'shrug', 'walk', 'present', 'facepalm', 'count'];
Art.ACT_LABEL = Object.fromEntries(Art.actList.map(k => [k, M[k].label]));

/* resuelve un pose en el instante t (segundos) */
Art.poseAt = (moveId, t, speed = 1) => {
  const m = M[moveId] || M.idle; const p = (t * speed / m.dur) % 1;
  const pose = {...STAND, ...m.fn(p, t)};
  return {pose, move: m, phase: p};
};

/* ---------- dibujo del personaje ---------- */
const HL = '#ff4d6d';
function limb(ctx, a, b, c, w1, w2, col1, col2, split) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = col1; ctx.lineWidth = w1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  if (split != null && col2) {
    const m = [lerp(a[0], b[0], split), lerp(a[1], b[1], split)];
    ctx.strokeStyle = col2; ctx.lineWidth = w1 * .92; ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  ctx.strokeStyle = col2 || col1; ctx.lineWidth = w2; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
}
function glow(ctx, a, b, w, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = HL; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
}

/* ---------- personajes hechos con una imagen subida por el usuario ---------- */
const IMG = new Map();
Art.imageSrc = lk => (lk && lk.style === 'image' && lk.img && lk.img.src) || null;
Art.poseSrc = (lk, act) => (lk && lk.poses && act && lk.poses[act] && lk.poses[act].src) || null;
Art.isImage = ch => !!(ch && ch.look && ch.look.style === 'image');
Art.loadImage = src => {
  if (!src) return Promise.resolve(null);
  let e = IMG.get(src);
  if (!e) { e = {img: new Image(), ok: false}; e.p = new Promise(res => { e.img.onload = () => { e.ok = true; res(e.img); }; e.img.onerror = () => { e.bad = true; res(null); }; }); e.img.src = src; IMG.set(src, e); }
  return e.p;
};
Art.preload = chars => Promise.all((chars || []).flatMap(c => [Art.loadImage(Art.imageSrc(c && c.look)), ...Object.values((c && c.look && c.look.poses) || {}).map(p => Art.loadImage(p.src))]));
/* "doble" anatómico con los colores de la imagen: hace las demostraciones de ejercicio que una imagen plana no puede hacer */
Art.bodyDouble = ch => { const lk = ch.look || {}; return {...ch, look: {body: lk.body === 'f' ? 'f' : 'm', skin: lk.skin || '#c48a64', hair: lk.hair || 'short', hairColor: lk.hairColor || '#222222', top: 'tank', topColor: lk.topColor || '#3a7bd5', pants: lk.pants || '#22262e', shoes: lk.shoes || '#eeeeee', acc: 'none', build: lk.build || 1}}; };
const EXPR_MARK = {surprised: '❗', worried: '💧', thinking: '💭', excited: '✨', angry: '💢', sad: '💧', confident: '👍'};
function drawImageChar(ctx, ch, st) {
  const lk = ch.look, pose = Art.poseSrc(lk, st.act), src = pose || Art.imageSrc(lk), e = src && IMG.get(src);
  if (!e) Art.loadImage(src);
  const t = st.t || 0, seed = st.seed || 0, talk = st.talk || 0, act = st.exercise && !pose ? 'exercise' : (st.act || 'idle'), mv = st.act || '';
  const EX = /squat|goblet|lunge|backsquat|boxjump/.test(mv) ? 'squat' : /press|clean|slam|handstand/.test(mv) ? 'press' : /curl|row|carry|kbswing|clubs|ropes|sandbag|stone|flywheel/.test(mv) ? 'curl' : /deadlift/.test(mv) ? 'hinge' : /pushup|plank|bench|crawl|nordic|dip/.test(mv) ? 'floor' : /sprint|jog|sled|walk/.test(mv) ? 'run' : /pullup|hang|climb/.test(mv) ? 'hang' : /jump/.test(mv) ? 'jump' : 'bounce';
  let rep = 0;
  let dx = 0, dy = 0, rot = 0, sx = 1 - .006 * Math.sin(t * 2.2 + seed), sy = 1 + .012 * Math.sin(t * 2.2 + seed);
  sy += .05 * talk; sx -= .028 * talk; rot += .025 * talk * Math.sin(t * 3 + seed);
  if (act === 'walk') { dy = -Math.abs(Math.sin(t * 8)) * 14; rot += .05 * Math.sin(t * 8); }
  else if (act === 'celebrate') { const j = Math.abs(Math.sin(t * 5)); dy = -j * 42; sy += (j < .15 ? -.08 : .04); sx -= (j < .15 ? -.06 : .02); }
  else if (act === 'worried') { dx = Math.sin(t * 40) * 2.5; sy -= .02; }
  else if (act === 'shrug') dy = -Math.max(0, Math.sin(t * 3)) * 10;
  else if (act === 'think') rot += -.06 + .02 * Math.sin(t * 1.5);
  else if (act === 'point' || act === 'present' || act === 'count') rot += .05 + .03 * Math.sin(t * 1.8);
  else if (act === 'facepalm') { rot -= .08; sy -= .03; }
  else if (act === 'exercise') {
    rep = (1 - Math.cos(t * 2.6)) / 2; // 0 → 1 → 0 en cada repetición
    if (EX === 'squat') { sy -= rep * .22; sx += rep * .06; }
    else if (EX === 'hinge') { rot += rep * .5; sy -= rep * .05; }
    else if (EX === 'floor') { rot = -1.35; dy = -18 - rep * 22; dx = 60; }
    else if (EX === 'run') { dy = -Math.abs(Math.sin(t * 9)) * 16; rot += .12; }
    else if (EX === 'hang') { dy = -40 - rep * 45; }
    else if (EX === 'jump') { dy = -Math.max(0, Math.sin(t * 3.2)) * 70; sy += Math.sin(t * 3.2) < 0 ? -.06 : .03; }
    else if (EX === 'press' || EX === 'curl') sy -= rep * .03;
    else dy = -Math.abs(Math.sin(t * 3)) * 18;
  }
  ctx.save();
  ctx.translate(st.x + dx * st.scale, st.y + dy * st.scale);
  const facing = st.facing || 1, faces = (lk.img && lk.img.faces) || 'front';
  const flip = faces === 'front' ? 1 : faces === 'left' ? -facing : facing;
  ctx.scale(st.scale * flip, st.scale);
  if (st.alpha != null) ctx.globalAlpha = st.alpha;
  if (!st.noShadow) { ctx.save(); ctx.globalAlpha *= .22 * (1 + dy / 120); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(-dx, -dy, 70, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  ctx.rotate(rot); ctx.scale(sx, sy);
  const Hh = 330 * (lk.imgScale || 1);
  if (e && e.ok) {
    const im = e.img; let h = Hh, w = im.naturalWidth / im.naturalHeight * h; if (w > 340) { h *= 340 / w; w = 340; }
    ctx.drawImage(im, -w / 2, -h, w, h);
    if (act === 'exercise') { // implementos dibujados sobre la imagen: barra, mancuernas, barra fija y líneas de velocidad
      const dark = '#d5dbe2', plate = '#e0533d';
      const bar = (y, half) => { ctx.fillStyle = '#20252b'; ctx.fillRect(-half - 2, y - 6, half * 2 + 4, 12); ctx.fillStyle = dark; ctx.fillRect(-half, y - 4, half * 2, 8); [-1, 1].forEach(s => { ctx.fillStyle = plate; rr(ctx, s * half - (s > 0 ? 0 : 18), y - 34, 18, 68, 5); ctx.fill(); }); };
      const db = (x, y) => { ctx.fillStyle = dark; ctx.fillRect(x - 16, y - 3, 32, 6); ctx.fillStyle = plate; rr(ctx, x - 22, y - 12, 9, 24, 3); ctx.fill(); rr(ctx, x + 13, y - 12, 9, 24, 3); ctx.fill(); };
      if (EX === 'squat') bar(-h * .78, w * .75);
      else if (EX === 'press') bar(-h * (.78 + rep * .32), w * .7);
      else if (EX === 'hinge') bar(-h * .42, w * .7);
      else if (EX === 'curl') { db(-w * .46, -h * (.42 + rep * .2)); db(w * .46, -h * (.42 + rep * .2)); }
      else if (EX === 'hang') { ctx.fillStyle = dark; ctx.fillRect(-w * .8, -h * 1.02, w * 1.6, 9); }
      else if (EX === 'run') { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { const yy = -h * (.25 + i * .17), o = ((t * 3 + i * .3) % 1) * 40; ctx.beginPath(); ctx.moveTo(-w * .6 - o, yy); ctx.lineTo(-w * .6 - o - 70, yy); ctx.stroke(); } }
    }
    const mark = EXPR_MARK[st.expr]; if (mark) { ctx.save(); ctx.scale(flip, 1); ctx.font = '44px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha *= .5 + .5 * Math.abs(Math.sin(t * 2)); ctx.fillText(mark, w * .42, -h * .96); ctx.restore(); }
  } else {
    ctx.fillStyle = 'rgba(128,128,128,.35)'; rr(ctx, -55, -Hh, 110, Hh, 40); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '600 22px "Inter Tight",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(e && e.bad ? 'Sin imagen' : 'Cargando…', 0, -Hh / 2);
  }
  ctx.restore();
  return {S: [0, -260], P: [0, -150]};
}

Art.drawCharacter = (ctx, ch, st) => {
  if (Art.isImage(ch)) return st.exercise && st.double ? Art.drawCharacter(ctx, Art.bodyDouble(ch), st) : drawImageChar(ctx, ch, st);
  const lk = {build: 1, ...ch.look};
  const {pose} = st; const ex = Art.EXPR[st.expr] || Art.EXPR.neutral;
  ctx.save();
  ctx.translate(st.x, st.y); ctx.scale(st.scale * (st.facing || 1), st.scale);
  if (st.alpha != null) ctx.globalAlpha = st.alpha;
  const t = st.t || 0;
  const res = v => (v && v[0] === 'S') ? null : v;
  const P = pose.P, T = pose.T;
  const S = shoulderOf(P, T);
  const rel = v => v[0] === 'S' ? [S[0] + v[1], S[1] + v[2]] : v;
  const hN = rel(pose.hN), hF = rel(pose.hF);
  const px = Math.cos(T * D2R), py = Math.sin(T * D2R), ax0 = Math.sin(T * D2R), ay0 = -Math.cos(T * D2R);
  const hipN = [P[0] + px * 7, P[1] + py * 7], hipF = [P[0] - px * 7, P[1] - py * 7];
  const shN = [S[0] + px * 13 - ax0 * 8, S[1] + py * 13 - ay0 * 8], shF = [S[0] - px * 13 - ax0 * 8, S[1] - py * 13 - ay0 * 8];
  const kn = ik(hipN[0], hipN[1], pose.fN[0], pose.fN[1], L.thigh, L.shin, pose.ks);
  const kf = ik(hipF[0], hipF[1], pose.fF[0], pose.fF[1], L.thigh, L.shin, pose.ks);
  const en = ik(shN[0], shN[1], hN[0], hN[1], L.up, L.fore, pose.esN);
  const ef = ik(shF[0], shF[1], hF[0], hF[1], L.up, L.fore, pose.esF);
  const skin = lk.skin, skinD = shade(skin, -.18), top = lk.topColor, topD = shade(top, -.22), pants = lk.pants, pantsD = shade(pants, -.25);
  const sleeveFull = ['hoodie', 'blazer', 'shirt'].includes(lk.top), sleeveTee = lk.top === 'tee';
  const hl = new Set(st.highlight || []); const ha = .35 + .3 * Math.sin(t * 5);
  const geo = {S, P, hN, hF, kn, kf, en, ef, hipN, hipF, shN, shF};
  // sombra
  if (!st.noShadow) { ctx.save(); ctx.globalAlpha *= .22; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse((pose.fN[0] + pose.fF[0]) / 2, 2, 62, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  if (lk.style === 'stick' || lk.style === 'stick3d') { drawStick(ctx, lk, ex, geo, pose, st, t, hl, ha); ctx.restore(); return geo; }
  if (lk.style === 'anatomy') { drawAnatomy(ctx, lk, ex, geo, pose, st, t, hl, ha); ctx.restore(); return geo; }
  // accesorio trasero (prop detrás)
  if (st.prop && st.prop.back) st.prop.back(ctx, geo, pose, t);
  // brazo lejano
  const armCols = (d) => sleeveFull ? [d ? topD : top, d ? topD : top] : sleeveTee ? [d ? topD : top, d ? skinD : skin] : [d ? skinD : skin, d ? skinD : skin];
  let ac = armCols(true);
  limb(ctx, shF, [ef[0], ef[1]], hF, 18, 16, ac[0], sleeveTee ? null : ac[1], sleeveTee ? .55 : null);
  if (sleeveTee) { ctx.strokeStyle = skinD; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(lerp(shF[0], ef[0], .6), lerp(shF[1], ef[1], .6)); ctx.lineTo(ef[0], ef[1]); ctx.lineTo(hF[0], hF[1]); ctx.stroke(); }
  hand(ctx, hF, skinD);
  if (hl.has('arms') || hl.has('grip')) glow(ctx, hl.has('arms') ? shF : [ef[0], ef[1]], hF, 20, ha);
  // pierna lejana
  limb(ctx, hipF, [kf[0], kf[1]], pose.fF, 25, 21, pantsD, pantsD);
  shoe(ctx, [kf[0], kf[1]], pose.fF, shade(lk.shoes, -.15));
  if (hl.has('legs') || hl.has('hamstrings')) glow(ctx, hipF, [kf[0], kf[1]], 24, ha);
  if (hl.has('calves') || hl.has('legs')) glow(ctx, [kf[0], kf[1]], pose.fF, 20, ha);
  // torso
  ctx.save(); ctx.translate(P[0], P[1]); ctx.rotate(T * D2R);
  const bw = 27 * lk.build, chest = 1 + (pose.chest || 0) * .04;
  if (lk.top === 'hoodie') { ctx.fillStyle = topD; ctx.beginPath(); ctx.ellipse(-4, -L.torso - 2, 24, 13, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = pants; ctx.beginPath(); ctx.moveTo(-bw + 2, 8); ctx.lineTo(bw - 2, 8); ctx.lineTo(bw - 1, -22); ctx.lineTo(-bw + 1, -22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = top; ctx.beginPath();
  ctx.moveTo(-bw + 1, -14); ctx.lineTo(bw - 1, -14);
  ctx.quadraticCurveTo(bw * chest + 3, -60, bw * chest + 2, -L.torso + 10);
  ctx.quadraticCurveTo(bw * chest, -L.torso - 4, bw - 10, -L.torso - 4);
  ctx.lineTo(-bw + 10, -L.torso - 4);
  ctx.quadraticCurveTo(-bw * chest, -L.torso - 4, -bw * chest - 2, -L.torso + 10);
  ctx.quadraticCurveTo(-bw * chest - 3, -60, -bw + 1, -14); ctx.closePath(); ctx.fill();
  // sombreado lateral
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(-bw - 6, -L.torso - 6, bw * .55, L.torso + 30); ctx.restore();
  clothDetails(ctx, lk, bw);
  if (hl.size) {
    ctx.save(); ctx.globalAlpha = ha; ctx.fillStyle = HL;
    if (hl.has('chest')) { ctx.beginPath(); ctx.ellipse(6, -L.torso + 30, bw * .8, 18, 0, 0, Math.PI * 2); ctx.fill(); }
    if (hl.has('core')) { rr(ctx, -bw * .55, -66, bw * 1.1, 46, 12); ctx.fill(); }
    if (hl.has('back')) { rr(ctx, -bw - 2, -L.torso + 6, bw * .8, 80, 14); ctx.fill(); }
    if (hl.has('glutes')) { ctx.beginPath(); ctx.ellipse(-bw * .5, -4, 16, 16, 0, 0, Math.PI * 2); ctx.fill(); }
    if (hl.has('shoulders')) { ctx.beginPath(); ctx.arc(0, -L.torso + 2, 16, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
  // pierna cercana
  limb(ctx, hipN, [kn[0], kn[1]], pose.fN, 26, 22, pants, pants);
  shoe(ctx, [kn[0], kn[1]], pose.fN, lk.shoes);
  if (hl.has('legs') || hl.has('hamstrings')) glow(ctx, hipN, [kn[0], kn[1]], 25, ha);
  if (hl.has('calves') || hl.has('legs')) glow(ctx, [kn[0], kn[1]], pose.fN, 21, ha);
  // cabeza
  const headA = (T * (pose.hf ?? .3) + (pose.H || 0)) * D2R;
  const axis = [Math.sin(T * D2R), -Math.cos(T * D2R)];
  const neck = [S[0] + axis[0] * 6, S[1] + axis[1] * 6];
  ctx.strokeStyle = skinD; ctx.lineWidth = 17; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(S[0], S[1] + 4 * axis[1]); ctx.lineTo(neck[0] + axis[0] * 8, neck[1] + axis[1] * 8); ctx.stroke();
  const hc = [S[0] + Math.sin(T * D2R + headA * .6) * 44, S[1] - Math.cos(T * D2R + headA * .6) * 44];
  drawHead(ctx, lk, ex, hc, headA + (T * D2R) * (1 - (pose.hf ?? .3)) * 0, st, t);
  if (lk.top === 'blazer' || lk.top === 'shirt') { /* cuello de camisa sobre el cuello */ }
  // accesorio medio (por ejemplo barra delante del cuerpo)
  if (st.prop && st.prop.mid) st.prop.mid(ctx, geo, pose, t);
  // brazo cercano
  ac = armCols(false);
  limb(ctx, shN, [en[0], en[1]], hN, 19, 17, ac[0], sleeveTee ? null : ac[1], sleeveTee ? .55 : null);
  if (sleeveTee) { ctx.strokeStyle = skin; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(lerp(shN[0], en[0], .6), lerp(shN[1], en[1], .6)); ctx.lineTo(en[0], en[1]); ctx.lineTo(hN[0], hN[1]); ctx.stroke(); }
  if (sleeveFull) { ctx.strokeStyle = shade(top, .12); ctx.lineWidth = 18; ctx.beginPath(); const c = [lerp(en[0], hN[0], .82), lerp(en[1], hN[1], .82)]; ctx.moveTo(c[0], c[1]); ctx.lineTo(lerp(en[0], hN[0], .86), lerp(en[1], hN[1], .86)); ctx.stroke(); }
  hand(ctx, hN, skin);
  if (hl.has('arms') || hl.has('grip')) glow(ctx, hl.has('arms') ? shN : [en[0], en[1]], hN, 21, ha);
  if (st.prop && st.prop.front) st.prop.front(ctx, geo, pose, t);
  ctx.restore();
  return geo;
};
function hand(ctx, h, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(h[0], h[1], 10, 0, Math.PI * 2); ctx.fill(); }
function shoe(ctx, knee, ankle, col) {
  const a = Math.atan2(ankle[1] - knee[1], ankle[0] - knee[0]) - Math.PI / 2;
  ctx.save(); ctx.translate(ankle[0], ankle[1]); ctx.rotate(clampN(a, -1.2, 1.2));
  ctx.fillStyle = col; rr(ctx, -10, -4, 38, 14, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-10, 6, 38, 4);
  ctx.restore();
}
function clothDetails(ctx, lk, bw) {
  const top = -L.torso;
  if (lk.top === 'hoodie') {
    ctx.fillStyle = shade(lk.topColor, -.12); rr(ctx, -bw * .62, -54, bw * 1.24, 28, 8); ctx.fill();
    ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-6, top + 6); ctx.lineTo(-8, top + 34); ctx.moveTo(8, top + 6); ctx.lineTo(9, top + 32); ctx.stroke();
  } else if (lk.top === 'blazer') {
    ctx.fillStyle = lk.shirt || '#eee'; ctx.beginPath(); ctx.moveTo(-11, top - 2); ctx.lineTo(11, top - 2); ctx.lineTo(0, top + 46); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(lk.topColor, -.25); ctx.beginPath(); ctx.moveTo(-12, top - 2); ctx.lineTo(-3, top + 44); ctx.lineTo(-18, top + 20); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, top - 2); ctx.lineTo(3, top + 44); ctx.lineTo(18, top + 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(lk.topColor, .25); ctx.beginPath(); ctx.arc(2, top + 62, 3, 0, 7); ctx.arc(2, top + 80, 3, 0, 7); ctx.fill();
  } else if (lk.top === 'tee') {
    ctx.strokeStyle = shade(lk.topColor, -.3); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, top - 6, 13, .2 * Math.PI, .8 * Math.PI); ctx.stroke();
  } else if (lk.top === 'tank') {
    ctx.fillStyle = lk.skin; ctx.beginPath(); ctx.moveTo(-12, top - 4); ctx.quadraticCurveTo(0, top + 16, 12, top - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-bw + 2, -40, bw * 2 - 4, 5);
  } else if (lk.top === 'shirt') {
    ctx.strokeStyle = shade(lk.topColor, -.3); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, top + 4); ctx.lineTo(0, -16); ctx.stroke();
  }
  ctx.fillStyle = shade(lk.pants, -.35); ctx.fillRect(-bw + 1, -22, bw * 2 - 2, 5);
}
function drawHead(ctx, lk, ex, c, ang, st, t) {
  ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(ang);
  const hairC = lk.hairColor, skin = lk.skin;
  // pelo trasero
  if (lk.hair === 'long') { ctx.fillStyle = shade(hairC, -.1); rr(ctx, -33, -22, 58, 76, 22); ctx.fill(); }
  if (lk.hair === 'bun') { ctx.fillStyle = hairC; ctx.beginPath(); ctx.arc(-14, -36, 14, 0, 7); ctx.fill(); }
  if (lk.hair === 'ponytail') { ctx.fillStyle = shade(hairC, -.08); ctx.beginPath(); ctx.moveTo(-22, -26); ctx.quadraticCurveTo(-58 + Math.sin(t * 3) * 4, -10, -44 + Math.sin(t * 3) * 6, 40); ctx.quadraticCurveTo(-36, 6, -16, -14); ctx.closePath(); ctx.fill(); }
  // oreja
  ctx.fillStyle = shade(skin, -.1); ctx.beginPath(); ctx.ellipse(-25, 3, 6, 9, 0, 0, 7); ctx.fill();
  // cabeza
  ctx.fillStyle = skin; ctx.beginPath(); ctx.moveTo(-28, -6); ctx.bezierCurveTo(-30, -40, 30, -44, 30, -6); ctx.bezierCurveTo(31, 18, 18, 34, 2, 34); ctx.bezierCurveTo(-16, 34, -27, 20, -28, -6); ctx.fill();
  // barba
  if (/beard/.test(lk.acc)) { ctx.fillStyle = lk.beardColor || hairC; ctx.beginPath(); ctx.moveTo(-24, 8); ctx.bezierCurveTo(-22, 30, -6, 37, 3, 37); ctx.bezierCurveTo(16, 37, 28, 28, 29, 8); ctx.bezierCurveTo(22, 20, 14, 18, 4, 18); ctx.bezierCurveTo(-8, 18, -18, 20, -24, 8); ctx.fill(); }
  // pelo delantero
  ctx.fillStyle = hairC;
  if (lk.hair === 'short' || lk.hair === 'fade') { ctx.beginPath(); ctx.moveTo(-29, -4); ctx.bezierCurveTo(-32, -44, 32, -48, 30, -10); ctx.bezierCurveTo(22, -26, 0, -28, -18, -20); ctx.lineTo(-22, -2); ctx.closePath(); ctx.fill(); if (lk.hair === 'fade') { ctx.fillStyle = shade(skin, -.28); ctx.globalAlpha *= .5; ctx.beginPath(); ctx.ellipse(-24, -6, 6, 12, 0, 0, 7); ctx.fill(); ctx.globalAlpha /= .5; } }
  else if (lk.hair === 'curly') { for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i * .11); ctx.beginPath(); ctx.arc(Math.cos(a) * 26, Math.sin(a) * 26 - 6, 11, 0, 7); ctx.fill(); } ctx.beginPath(); ctx.ellipse(0, -24, 26, 14, 0, 0, 7); ctx.fill(); }
  else if (lk.hair === 'long' || lk.hair === 'bun' || lk.hair === 'ponytail') { ctx.beginPath(); ctx.moveTo(-30, 10); ctx.bezierCurveTo(-36, -46, 34, -50, 31, -4); ctx.bezierCurveTo(22, -24, 4, -26, -6, -22); ctx.bezierCurveTo(-14, -14, -22, -4, -24, 14); ctx.closePath(); ctx.fill(); }
  else if (lk.hair === 'bald') { ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.ellipse(8, -26, 10, 5, -.3, 0, 7); ctx.fill(); }
  // gorra / cinta
  if (/cap/.test(lk.acc)) { ctx.fillStyle = lk.capColor || '#222'; ctx.beginPath(); ctx.moveTo(-30, -12); ctx.bezierCurveTo(-30, -48, 30, -48, 30, -12); ctx.closePath(); ctx.fill(); rr(ctx, 14, -16, 30, 7, 3); ctx.fill(); }
  if (/headband/.test(lk.acc)) { ctx.fillStyle = lk.bandColor || '#fff'; ctx.beginPath(); ctx.moveTo(-29, -12); ctx.quadraticCurveTo(0, -24, 30, -14); ctx.lineTo(30, -6); ctx.quadraticCurveTo(0, -16, -29, -4); ctx.fill(); }
  const visor = /visor/.test(lk.acc || '');
  if (visor) { const pulse = .65 + .35 * Math.sin(t * 4) + (st.talk || 0) * .4; ctx.fillStyle = '#0f1216'; rr(ctx, -27, -15, 57, 21, 10); ctx.fill(); ctx.save(); ctx.globalAlpha *= Math.min(1, pulse); ctx.fillStyle = lk.visorColor || '#d7ff3a'; const wv = 40 * (ex.eye || 1); rr(ctx, 2 - wv / 2, -8, wv, 6 + (ex.mouth === 'o' || ex.mouth === 'open' ? 3 : 0), 3); ctx.fill(); ctx.restore(); ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(ctx, -22, -13, 22, 4, 2); ctx.fill(); }
  if (!visor) {
  // ojos
  const blinkCycle = (t + (st.seed || 0)) % 4.1; const blink = blinkCycle < .12 ? .1 : 1;
  const eo = ex.eye * blink; const lx = ex.look ? ex.look[0] : (st.gaze || 0), ly = ex.look ? ex.look[1] : 0;
  for (const [x, br] of [[-6, ex.bl], [16, ex.br]]) {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, -2, 6.4, 7.6 * eo, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1a1412'; ctx.beginPath(); ctx.ellipse(x + 1.5 + lx, -1.5 + ly, 3.6, 4.2 * Math.min(1, eo), 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 2.6 + lx, -3.4 + ly, 1.2, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(x + 1, -14 + br[0]); ctx.rotate(br[1] * D2R * (x < 0 ? 1 : 1)); ctx.strokeStyle = shade(hairC, -.1); ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke(); ctx.restore();
  }
  // nariz
  ctx.strokeStyle = shade(skin, -.3); ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(6, 2); ctx.quadraticCurveTo(11, 10, 5, 11); ctx.stroke();
  // boca
  const talk = st.talk || 0; const mx = 5, my = 20;
  ctx.lineWidth = 3; ctx.strokeStyle = '#5a2620'; ctx.fillStyle = '#5a2620';
  if (talk > .05) { const h = 3 + talk * 9; ctx.beginPath(); ctx.ellipse(mx, my + 1, 8, h / 2 + 1, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#e46a6a'; ctx.beginPath(); ctx.ellipse(mx, my + h / 2 - 1, 5, h / 4 + .5, 0, 0, 7); ctx.fill(); }
  else {
    ctx.beginPath();
    switch (ex.mouth) {
      case 'grin': ctx.moveTo(mx - 10, my - 2); ctx.quadraticCurveTo(mx, my + 12, mx + 10, my - 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(mx - 7, my - 1, 14, 3); break;
      case 'open': ctx.ellipse(mx, my + 1, 8, 7, 0, 0, 7); ctx.fill(); break;
      case 'o': ctx.ellipse(mx, my + 1, 4.5, 6, 0, 0, 7); ctx.fill(); break;
      case 'wavy': ctx.moveTo(mx - 9, my + 2); ctx.quadraticCurveTo(mx - 4, my - 3, mx, my + 2); ctx.quadraticCurveTo(mx + 4, my + 6, mx + 9, my + 1); ctx.stroke(); break;
      case 'side': ctx.moveTo(mx - 4, my + 2); ctx.lineTo(mx + 9, my - 1); ctx.stroke(); break;
      case 'smirk': ctx.moveTo(mx - 7, my + 2); ctx.quadraticCurveTo(mx + 3, my + 6, mx + 10, my - 3); ctx.stroke(); break;
      case 'frown': ctx.moveTo(mx - 8, my + 5); ctx.quadraticCurveTo(mx, my - 3, mx + 8, my + 5); ctx.stroke(); break;
      case 'tight': ctx.moveTo(mx - 8, my + 3); ctx.lineTo(mx + 8, my + 2); ctx.stroke(); break;
      default: ctx.moveTo(mx - 8, my); ctx.quadraticCurveTo(mx, my + 7, mx + 8, my); ctx.stroke();
    }
  }
  }
  // gafas / aretes
  if (/glasses/.test(lk.acc)) { ctx.strokeStyle = '#151515'; ctx.lineWidth = 2.4; rr(ctx, -14, -10, 16, 14, 4); ctx.stroke(); rr(ctx, 8, -10, 16, 14, 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(2, -4); ctx.lineTo(8, -4); ctx.moveTo(-14, -5); ctx.lineTo(-24, -6); ctx.stroke(); }
  if (/earrings/.test(lk.acc)) { ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(-25, 15, 3.4, 0, 7); ctx.fill(); }
  ctx.restore();
}


/* ---------- estilo stickman (2D tinta y cabeza de bola) ---------- */
function polyline(ctx, pts, col, lw) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); }
function drawMouthAt(ctx, kind, talk, k, dark, tongue) {
  ctx.save(); ctx.scale(k, k); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = dark; ctx.fillStyle = dark;
  if (talk > .05) { const h = 3 + talk * 10; ctx.beginPath(); ctx.ellipse(0, 1, 9, h / 2 + 1.5, 0, 0, 7); ctx.fill(); ctx.fillStyle = tongue; ctx.beginPath(); ctx.ellipse(0, h / 2 - .5, 5.5, h / 4 + .8, 0, 0, 7); ctx.fill(); }
  else { ctx.beginPath(); switch (kind) {
    case 'grin': ctx.moveTo(-11, -2); ctx.quadraticCurveTo(0, 14, 11, -2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-8, -1, 16, 3.4); ctx.fillStyle = tongue; ctx.beginPath(); ctx.ellipse(0, 6, 5, 2.4, 0, 0, 7); ctx.fill(); break;
    case 'open': ctx.ellipse(0, 1, 9, 8, 0, 0, 7); ctx.fill(); ctx.fillStyle = tongue; ctx.beginPath(); ctx.ellipse(0, 5, 5, 3, 0, 0, 7); ctx.fill(); break;
    case 'o': ctx.ellipse(0, 1, 5, 6.5, 0, 0, 7); ctx.fill(); break;
    case 'wavy': ctx.moveTo(-10, 2); ctx.quadraticCurveTo(-5, -3, 0, 2); ctx.quadraticCurveTo(5, 7, 10, 1); ctx.stroke(); break;
    case 'side': ctx.moveTo(-5, 2); ctx.lineTo(10, -1); ctx.stroke(); break;
    case 'smirk': ctx.moveTo(-8, 2); ctx.quadraticCurveTo(3, 7, 11, -3); ctx.stroke(); break;
    case 'frown': ctx.moveTo(-9, 5); ctx.quadraticCurveTo(0, -3, 9, 5); ctx.stroke(); break;
    case 'tight': ctx.moveTo(-9, 3); ctx.lineTo(9, 2); ctx.stroke(); break;
    default: ctx.moveTo(-9, 0); ctx.quadraticCurveTo(0, 8, 9, 0); ctx.stroke(); } }
  ctx.restore();
}
function drawStick(ctx, lk, ex, g, pose, st, t, hl, ha) {
  const ink = lk.ink || '#151515', is3d = lk.style === 'stick3d', w = is3d ? 8 : 10;
  const {S, P, hN, hF, kn, kf, en, ef} = g;
  const T = pose.T * D2R, ax = [Math.sin(T), -Math.cos(T)];
  if (st.prop && st.prop.back) st.prop.back(ctx, g, pose, t);
  const far = is3d ? '#2b2b2b' : shade(ink, .12);
  const foot = (k, f, col) => { if (is3d) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(f[0] + 5, f[1] + 2, 9, 5, 0, 0, 7); ctx.fill(); return; } const a = Math.atan2(f[1] - k[1], f[0] - k[0]) - Math.PI / 2; polyline(ctx, [f, [f[0] + Math.cos(a) * 15, f[1] + Math.sin(a) * 15]], col, w); };
  const hand = (h, near) => { if (!is3d) return; const r = 12; const gr = ctx.createRadialGradient(h[0] - 3, h[1] - 4, 2, h[0], h[1], r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, near ? '#d9d6d0' : '#c9c5be'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(h[0], h[1], r, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5; ctx.stroke(); };
  polyline(ctx, [S, [ef[0], ef[1]], hF], far, w); hand(hF, false);
  polyline(ctx, [P, [kf[0], kf[1]], pose.fF], far, w); foot([kf[0], kf[1]], pose.fF, far);
  polyline(ctx, [P, [S[0] + ax[0] * 4, S[1] + ax[1] * 4]], ink, w);
  if (/tie/.test(lk.acc || '')) { ctx.save(); ctx.translate(S[0], S[1]); ctx.rotate(T); ctx.fillStyle = lk.topColor || '#2ee59d'; ctx.beginPath(); ctx.moveTo(-5, 2); ctx.lineTo(5, 2); ctx.lineTo(3, 8); ctx.lineTo(8, 46 + Math.sin(t * 4) * 2); ctx.lineTo(0, 56); ctx.lineTo(-8, 46 + Math.sin(t * 4) * 2); ctx.lineTo(-3, 8); ctx.closePath(); ctx.fill(); ctx.restore(); }
  polyline(ctx, [P, [kn[0], kn[1]], pose.fN], ink, w); foot([kn[0], kn[1]], pose.fN, ink);
  // cabeza
  const R = is3d ? 62 : 50, ang = T * (pose.hf ?? .3) + (pose.H || 0) * D2R;
  const hc = [S[0] + Math.sin(T + ang * .3) * (R + 4), S[1] - Math.cos(T + ang * .3) * (R + 4)];
  ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate(ang);
  const blink = ((t + (st.seed || 0)) % 4.1) < .12 ? .1 : 1, eo = ex.eye * blink;
  const lx = ex.look ? ex.look[0] : 2, ly = ex.look ? ex.look[1] : 0;
  if (is3d) {
    const gr = ctx.createRadialGradient(-R * .35, -R * .4, R * .1, 0, 0, R * 1.05); gr.addColorStop(0, '#fbfaf7'); gr.addColorStop(.7, lk.skin || '#e5e1da'); gr.addColorStop(1, shade(lk.skin || '#e5e1da', -.18));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const [x0, c1, x1] of [[-14, -30, -24], [-2, -26, -6], [10, -28, 16]]) { ctx.beginPath(); ctx.moveTo(x0, -R + 2); ctx.quadraticCurveTo(x0 + (x1 - x0) * .2, -R - 14, x1, -R - 16); ctx.stroke(); }
    for (const [x, br] of [[-14, ex.bl], [16, ex.br]]) {
      ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(x + lx, -6 + ly, 5.5, 9 * eo, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(x, -24 + br[0]); ctx.rotate(br[1] * D2R); ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(0, -4, 8, 0); ctx.stroke(); ctx.restore();
    }
    ctx.translate(2, 22); drawMouthAt(ctx, ex.mouth, st.talk || 0, 1.9, '#6e1f1f', '#ef7b8a');
  } else {
    ctx.fillStyle = lk.skin || '#ffffff'; ctx.strokeStyle = ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); ctx.stroke();
    for (const [x, br] of [[-11, ex.bl], [13, ex.br]]) {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = ink; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(x, -4, 9, 11 * eo, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(x + 2.5 + lx, -3 + ly, 4.2, 5 * Math.min(1, eo), 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(x, -20 + br[0]); ctx.rotate(br[1] * D2R); ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke(); ctx.restore();
    }
    ctx.translate(2, 19); drawMouthAt(ctx, ex.mouth, st.talk || 0, 1.25, ink, '#e46a6a');
  }
  ctx.restore();
  if (st.prop && st.prop.mid) st.prop.mid(ctx, g, pose, t);
  polyline(ctx, [S, [en[0], en[1]], hN], ink, w); hand(hN, true);
  if (hl.size) drawGlows(ctx, g, pose, hl, ha);
  if (st.prop && st.prop.front) st.prop.front(ctx, g, pose, t);
}
function drawGlows(ctx, g, pose, hl, ha) {
  const {S, P, hN, hF, kn, kf, en, ef, hipN, hipF, shN, shF} = g;
  if (hl.has('arms') || hl.has('grip')) { glow(ctx, hl.has('arms') ? shF : [ef[0], ef[1]], hF, 20, ha); glow(ctx, hl.has('arms') ? shN : [en[0], en[1]], hN, 21, ha); }
  if (hl.has('legs') || hl.has('hamstrings')) { glow(ctx, hipF, [kf[0], kf[1]], 26, ha); glow(ctx, hipN, [kn[0], kn[1]], 27, ha); }
  if (hl.has('calves') || hl.has('legs')) { glow(ctx, [kf[0], kf[1]], pose.fF, 20, ha); glow(ctx, [kn[0], kn[1]], pose.fN, 21, ha); }
  const T = pose.T * D2R;
  ctx.save(); ctx.translate(P[0], P[1]); ctx.rotate(T); ctx.globalAlpha = ha; ctx.fillStyle = HL;
  if (hl.has('chest')) { ctx.beginPath(); ctx.ellipse(6, -L.torso + 30, 26, 18, 0, 0, Math.PI * 2); ctx.fill(); }
  if (hl.has('core')) { rr(ctx, -16, -66, 32, 46, 12); ctx.fill(); }
  if (hl.has('back')) { rr(ctx, -30, -L.torso + 6, 24, 80, 14); ctx.fill(); }
  if (hl.has('glutes')) { ctx.beginPath(); ctx.ellipse(-14, -4, 16, 16, 0, 0, Math.PI * 2); ctx.fill(); }
  if (hl.has('shoulders')) { ctx.beginPath(); ctx.arc(0, -L.torso + 2, 16, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

/* ---------- estilo anatómico (maniquí atlético con músculos marcados) ---------- */
function drawAnatomy(ctx, lk, ex, g, pose, st, t, hl, ha) {
  const skin = lk.skin, sd = shade(skin, -.2), sdd = shade(skin, -.34), sl = shade(skin, .22), sh = lk.pants || '#1c2026', b = lk.build || 1, fem = lk.body === 'f';
  const {S, P, hN, hF, kn, kf, en, ef, hipN, hipF, shN, shF} = g;
  const T = pose.T * D2R;
  if (st.prop && st.prop.back) st.prop.back(ctx, g, pose, t);
  const belly = (a, c, at, len, wid, col) => { const m = [lerp(a[0], c[0], at), lerp(a[1], c[1], at)]; const an = Math.atan2(c[1] - a[1], c[0] - a[0]); ctx.save(); ctx.translate(m[0], m[1]); ctx.rotate(an); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, len, wid, 0, 0, 7); ctx.fill(); ctx.restore(); };
  const muscleLimb = (a, j, c, w1, w2, col, light) => {
    limb(ctx, a, j, c, w1, w2, col, col);
    const d1 = Math.hypot(j[0] - a[0], j[1] - a[1]), d2 = Math.hypot(c[0] - j[0], c[1] - j[1]);
    belly(a, j, .42, d1 * .36, w1 * .64, col); belly(j, c, .3, d2 * .3, w2 * .62, col);
    ctx.save(); ctx.globalAlpha *= .35; ctx.strokeStyle = light; ctx.lineWidth = w1 * .18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lerp(a[0], j[0], .2), lerp(a[1], j[1], .2) - w1 * .2); ctx.lineTo(lerp(a[0], j[0], .7), lerp(a[1], j[1], .7) - w1 * .2); ctx.stroke(); ctx.restore();
  };
  const bareFoot = (k, f, col) => { const a = clampN(Math.atan2(f[1] - k[1], f[0] - k[0]) - Math.PI / 2, -1.2, 1.2); ctx.save(); ctx.translate(f[0], f[1]); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(10, 4, 18, 8, 0, 0, 7); ctx.fill(); ctx.restore(); };
  const shortsThigh = (hip, knee, col, w) => { const m = [lerp(hip[0], knee[0], .42), lerp(hip[1], knee[1], .42)]; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(m[0], m[1]); ctx.stroke(); ctx.lineCap = 'round'; };
  // lado lejano
  muscleLimb(shF, [ef[0], ef[1]], hF, 20 * b, 16 * b, sd, skin); ctx.fillStyle = sd; ctx.beginPath(); ctx.arc(hF[0], hF[1], 10, 0, 7); ctx.fill();
  muscleLimb(hipF, [kf[0], kf[1]], pose.fF, 30 * b, 21 * b, sd, skin); bareFoot([kf[0], kf[1]], pose.fF, sd); shortsThigh(hipF, [kf[0], kf[1]], shade(sh, -.2), 33 * b);
  // torso
  ctx.save(); ctx.translate(P[0], P[1]); ctx.rotate(T);
  const hip = (fem ? 28 : 25) * b, waist = (fem ? 22 : 24) * b, chest = (fem ? 29 : 36) * b, sho = (fem ? 31 : 40) * b, top = -L.torso;
  ctx.fillStyle = skin; ctx.beginPath(); ctx.moveTo(-hip, 8); ctx.lineTo(hip, 8);
  ctx.quadraticCurveTo(waist + 2, -30, waist, -44); ctx.quadraticCurveTo(chest + 2, -74, sho, top + 10); ctx.quadraticCurveTo(sho - 4, top - 6, 12, top - 6); ctx.lineTo(-12, top - 6); ctx.quadraticCurveTo(-sho + 4, top - 6, -sho, top + 10); ctx.quadraticCurveTo(-chest - 2, -74, -waist, -44); ctx.quadraticCurveTo(-waist - 2, -30, -hip, 8); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,.13)'; ctx.fillRect(-sho - 4, top - 8, sho * .7, L.torso + 30); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(sho * .45, top - 8, sho * .6, L.torso + 30); ctx.restore();
  ctx.strokeStyle = sdd; ctx.lineCap = 'round'; ctx.globalAlpha *= .55; ctx.lineWidth = 2.4;
  if (!fem) { ctx.beginPath(); ctx.moveTo(-chest + 6, top + 36); ctx.quadraticCurveTo(-14, top + 50, -2, top + 40); ctx.moveTo(chest - 6, top + 36); ctx.quadraticCurveTo(14, top + 50, 2, top + 40); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, top + 14); ctx.lineTo(0, -16); ctx.stroke(); for (const y of [-58, -44, -30]) { ctx.beginPath(); ctx.moveTo(-12, y); ctx.quadraticCurveTo(-6, y + 3, -1, y); ctx.moveTo(1, y); ctx.quadraticCurveTo(6, y + 3, 12, y); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-waist + 3, -40); ctx.quadraticCurveTo(-14, -18, -8, -6); ctx.moveTo(waist - 3, -40); ctx.quadraticCurveTo(14, -18, 8, -6); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, -22); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-waist + 4, -40); ctx.quadraticCurveTo(-12, -20, -8, -6); ctx.moveTo(waist - 4, -40); ctx.quadraticCurveTo(12, -20, 8, -6); ctx.stroke(); }
  ctx.globalAlpha /= .55;
  if (fem || lk.topColor) { if (fem) { ctx.fillStyle = lk.topColor || '#1f2a33'; ctx.beginPath(); ctx.moveTo(-chest - 1, top + 22); ctx.quadraticCurveTo(0, top + 6, chest + 1, top + 22); ctx.lineTo(chest - 2, top + 50); ctx.quadraticCurveTo(0, top + 56, -chest + 2, top + 50); ctx.closePath(); ctx.fill(); } }
  ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(-hip - 1, 12); ctx.lineTo(hip + 1, 12); ctx.lineTo(hip, -18); ctx.lineTo(-hip, -18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(sh, .25); ctx.fillRect(-hip, -18, hip * 2, 4);
  ctx.restore();
  // lado cercano
  muscleLimb(hipN, [kn[0], kn[1]], pose.fN, 31 * b, 22 * b, skin, sl); bareFoot([kn[0], kn[1]], pose.fN, skin); shortsThigh(hipN, [kn[0], kn[1]], sh, 34 * b);
  // cuello y cabeza
  const axis = [Math.sin(T), -Math.cos(T)];
  ctx.strokeStyle = sd; ctx.lineWidth = (fem ? 15 : 21) * b; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(S[0], S[1]); ctx.lineTo(S[0] + axis[0] * 16, S[1] + axis[1] * 16); ctx.stroke();
  if (!fem) { ctx.fillStyle = skin; ctx.save(); ctx.translate(S[0], S[1]); ctx.rotate(T); ctx.beginPath(); ctx.moveTo(-26 * b, 6); ctx.quadraticCurveTo(-10, -12, 0, -14); ctx.quadraticCurveTo(10, -12, 26 * b, 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
  const headA = T * (pose.hf ?? .3) + (pose.H || 0) * D2R;
  const hc = [S[0] + Math.sin(T + headA * .6) * 44, S[1] - Math.cos(T + headA * .6) * 44];
  drawHead(ctx, {...lk, hair: lk.hair || 'bald', hairColor: lk.hairColor || sd}, ex, hc, headA, st, t);
  if (st.prop && st.prop.mid) st.prop.mid(ctx, g, pose, t);
  muscleLimb(shN, [en[0], en[1]], hN, 22 * b, 18 * b, skin, sl);
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(shN[0], shN[1], 15 * b, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(shN[0] + 3, shN[1] - 4, 7 * b, 0, 7); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hN[0], hN[1], 11, 0, 7); ctx.fill();
  if (hl.size) drawGlows(ctx, g, pose, hl, ha);
  if (st.prop && st.prop.front) st.prop.front(ctx, g, pose, t);
}

/* ---------- implementos (props) del gimnasio ---------- */
const PLATE = '#22262c', PLATE2 = '#3a414b', STEEL = '#c7ccd3';
function plate(ctx, x, y, r, col = PLATE) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.fillStyle = PLATE2; ctx.beginPath(); ctx.arc(x, y, r * .7, 0, 7); ctx.fill(); ctx.fillStyle = STEEL; ctx.beginPath(); ctx.arc(x, y, r * .16, 0, 7); ctx.fill(); }
const mid2 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
Art.PROPS = {
  barhands: {front: (c, g) => { const m = mid2(g.hN, g.hF); plate(c, m[0], m[1], 44, '#d64545'); }},
  barback: {front: (c, g) => { const s = g.S; plate(c, s[0] - 8, s[1] + 2, 44, '#3c7dd9'); }},
  bench: {back: (c) => { c.fillStyle = '#3a3f47'; c.fillRect(-150, -66, 170, 14); c.fillStyle = '#20242a'; c.fillRect(-120, -52, 10, 52); c.fillRect(-10, -52, 10, 52); c.fillStyle = '#596270'; c.fillRect(-156, -230, 8, 230); }, front: (c, g) => { const m = mid2(g.hN, g.hF); plate(c, m[0], m[1], 44, '#d64545'); }},
  dumbbells: {back: (c, g) => dumb(c, g.hF, .8), front: (c, g) => dumb(c, g.hN, 1)},
  kbhands: {front: (c, g) => { const m = mid2(g.hN, g.hF); const a = Math.atan2(m[1] - g.S[1], m[0] - g.S[0]); kb(c, m, a - Math.PI / 2); }},
  kbchest: {front: (c, g) => { const m = mid2(g.hN, g.hF); kb(c, [m[0] + 4, m[1] + 4], Math.PI); }},
  pullbar: {back: (c) => { c.fillStyle = '#596270'; c.fillRect(-150, BAR_Y - 6, 8, 420); c.fillRect(140, BAR_Y - 6, 8, 420); c.fillStyle = STEEL; c.fillRect(-150, BAR_Y - 5, 298, 9); }},
  rings: {back: (c, g) => { c.strokeStyle = '#d9b26c'; c.lineWidth = 4; for (const x of [10, -6]) { c.beginPath(); c.moveTo(x, -560); c.lineTo(x, RING_Y - 14); c.stroke(); } c.strokeStyle = '#7b5b2e'; c.lineWidth = 6; c.beginPath(); c.arc(-6, RING_Y, 12, 0, 7); c.stroke(); }, front: (c) => { c.strokeStyle = '#8a6532'; c.lineWidth = 6; c.beginPath(); c.arc(10, RING_Y, 12, 0, 7); c.stroke(); }},
  mat: {back: (c) => { c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, -200, -6, 360, 8, 4); c.fill(); }},
  box: {back: (c) => { c.fillStyle = '#8b5a2b'; rr(c, 20, -112, 110, 112, 6); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(20, -112, 110, 10); }},
  sled: {back: (c, g, p, t) => { c.fillStyle = '#2d3138'; c.fillRect(96, -40, 120, 26); c.fillStyle = STEEL; c.fillRect(100, -200, 8, 170); plate(c, 160, -60, 40, '#d64545'); c.fillStyle = '#596270'; c.fillRect(90, -16, 140, 6); }},
  handles: {back: (c, g) => handle(c, g.hF, .85), front: (c, g) => handle(c, g.hN, 1)},
  ropes: {front: (c, g, p, t) => { for (const [h, off, col] of [[g.hF, 0, '#3a6b52'], [g.hN, Math.PI, '#4a8a69']]) { c.strokeStyle = col; c.lineWidth = 7; c.beginPath(); c.moveTo(h[0], h[1]); for (let x = 0; x <= 1; x += .05) { const X = lerp(h[0], 360, x), amp = (1 - x) * 30 * Math.sin(t * 12 - x * 12 + off); c.lineTo(X, lerp(h[1], -20, x) + amp); } c.stroke(); } }},
  wall: {back: (c) => { c.fillStyle = '#4a4f5a'; c.fillRect(64, -620, 220, 620); const holds = [[70, -100, '#ffb000'], [72, -60, '#2ec4b6'], [74, -160, '#e94f37'], [70, -330, '#ffb000'], [72, -400, '#2ec4b6'], [74, -430, '#e94f37'], [90, -250, '#8f5bd6'], [140, -300, '#2ec4b6'], [180, -180, '#e94f37'], [200, -420, '#ffb000']]; for (const [x, y, col] of holds) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, 10, 7, .4, 0, 7); c.fill(); } }},
  club: {front: (c, g, p) => { const m = mid2(g.hN, g.hF); const a = (p.clubA || 0); c.save(); c.translate(m[0], m[1]); c.rotate(a + Math.PI / 2); c.fillStyle = '#6b4a2e'; c.fillRect(-4, -96, 8, 96); c.fillStyle = '#3a2a1c'; c.beginPath(); c.arc(0, -100, 18, 0, 7); c.fill(); c.restore(); }},
  sandbag: {front: (c, g, p) => { const b = p.bag || 0; const pos = b > .8 ? [g.S[0] - 6, g.S[1] - 2] : mid2(g.hN, g.hF); c.fillStyle = '#6d6a4a'; rr(c, pos[0] - 34, pos[1] - 20, 68, 40, 18); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(pos[0] - 4, pos[1] - 20, 8, 40); }},
  stone: {back: (c) => { c.fillStyle = '#3d424b'; c.fillRect(110, -210, 110, 210); }, front: (c, g, p) => { const s = p.st || 0; const m = mid2(g.hN, g.hF); const pos = s >= 1 && p.hN && p.hN[0] < 50 ? [150, -250] : [m[0] - 6, m[1] + 6]; c.fillStyle = '#8d9097'; c.beginPath(); c.arc(pos[0], pos[1], 40, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(pos[0] - 12, pos[1] - 12, 14, 0, 7); c.fill(); }},
  medball: {front: (c, g, p) => { const m = mid2(g.hN, g.hF); c.fillStyle = '#2f3540'; c.beginPath(); c.arc(m[0], m[1] - 8, 24, 0, 7); c.fill(); c.strokeStyle = '#ff7a45'; c.lineWidth = 3; c.beginPath(); c.arc(m[0], m[1] - 8, 24, -.6, .6); c.stroke(); }},
  nordicpad: {back: (c) => { c.fillStyle = '#3a3f47'; c.fillRect(-90, -30, 24, 22); c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, -110, -6, 270, 8, 4); c.fill(); }},
  bills: {front: (c, g, p, t) => { const m = mid2(g.hN, g.hF); c.save(); c.translate(m[0], m[1]); c.rotate(-.2 + Math.sin(t * 7) * .05); c.fillStyle = '#5fbf7a'; rr(c, -18, -12, 36, 20, 3); c.fill(); c.fillStyle = '#2e7d4a'; c.beginPath(); c.arc(0, -2, 5, 0, 7); c.fill(); c.restore(); }},
  breath: {back: (c, g, p, t) => { const s = (Math.sin(t * Math.PI * 2 / 6) + 1) / 2; c.save(); c.globalAlpha = .18; c.fillStyle = '#6cb8ff'; c.beginPath(); c.arc(0, -230, 70 + s * 40, 0, 7); c.fill(); c.restore(); }}
};
function dumb(c, h, k) { c.save(); c.globalAlpha *= k > .9 ? 1 : .9; plate(c, h[0], h[1], 15 * k + 2, '#2c3138'); c.restore(); }
function kb(c, p, a) { c.save(); c.translate(p[0], p[1]); c.rotate(a); c.strokeStyle = '#2c3138'; c.lineWidth = 6; c.beginPath(); c.arc(0, 8, 11, Math.PI, 0); c.stroke(); c.fillStyle = '#2c3138'; c.beginPath(); c.arc(0, 30, 21, 0, 7); c.fill(); c.restore(); }
function handle(c, h, k) { c.fillStyle = '#596270'; c.fillRect(h[0] - 4, h[1] - 36, 8, 74); plate(c, h[0], h[1] + 30, 22 * k, '#2c3138'); plate(c, h[0], h[1] - 30, 22 * k, '#2c3138'); }

/* ---------- fondos ---------- */
const BG = Art.BG = {};
const BG_LABEL = Art.BG_LABEL = {oficina: 'Oficina', casa: 'Casa', tienda: 'Tienda', banco: 'Banco', calle: 'Calle', negocio: 'Negocio / café', ciudad: 'Ciudad de noche', estudio: 'Estudio con pizarra', gimnasio: 'Gimnasio', parque: 'Parque', pista: 'Pista de atletismo', muro: 'Muro de escalada', patio: 'Patio strongman', papel: 'Papel blanco (stickman)', habitacion: 'Habitación', cuadricula: 'Estudio cuadriculado claro', cuadricula_osc: 'Estudio cuadriculado oscuro', gym_oscuro: 'Gimnasio oscuro (estudio 3D)', plano_azul: 'Plano azul cuadriculado', rayos: 'Blanco con rayos'};
function floor(c, W, H, gy, col, line) { c.fillStyle = col; c.fillRect(-W, gy, W * 3, H); if (line) { c.fillStyle = line; c.fillRect(-W, gy, W * 3, Math.max(2, H * .004)); } }
function win(c, x, y, w, h, sky, t) { c.fillStyle = '#d7dde4'; rr(c, x - 8, y - 8, w + 16, h + 16, 8); c.fill(); const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); c.fillStyle = g; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 5; i++) { const bx = x + (i * 0.23 * w + t * 4) % w; c.fillRect(bx, y + h * .55 - (i % 3) * h * .12, w * .14, h * .45 + (i % 3) * h * .12); } c.fillStyle = '#d7dde4'; c.fillRect(x + w / 2 - 4, y, 8, h); }
function plant(c, x, y, s) { c.fillStyle = '#c3683f'; rr(c, x - 24 * s, y - 40 * s, 48 * s, 40 * s, 6 * s); c.fill(); c.fillStyle = '#2f8f5b'; for (let i = 0; i < 6; i++) { c.save(); c.translate(x, y - 40 * s); c.rotate(-1.2 + i * .48); c.beginPath(); c.ellipse(0, -36 * s, 11 * s, 34 * s, 0, 0, 7); c.fill(); c.restore(); } }
function sky(c, W, H, a, b) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3); }
function skyline(c, W, H, base, col, t, seed = 1, lit = false) { let x = -W * .2; let i = 0; while (x < W * 1.2) { const w = W * (.08 + ((i * 37 * seed) % 7) / 60), h = H * (.12 + ((i * 53 * seed) % 11) / 40); c.fillStyle = col; c.fillRect(x, base - h, w, h); if (lit) { c.fillStyle = 'rgba(255,214,120,.55)'; for (let yy = base - h + 12; yy < base - 14; yy += 26) for (let xx = x + 8; xx < x + w - 10; xx += 18) if (((xx * 7 + yy * 3 + i) | 0) % 5 < 2) c.fillRect(xx, yy, 7, 11); } x += w + W * .01; i++; } }
BG.oficina = (c, W, H, gy, t) => { c.fillStyle = '#1e2c3a'; c.fillRect(-W, -H, W * 3, H * 3); c.fillStyle = '#243548'; c.fillRect(-W, gy - H * .5, W * 3, H * .5); win(c, W * .08, H * .16, W * .44, H * .26, ['#7fc6ff', '#cfe9ff'], t); c.fillStyle = '#2e4258'; rr(c, W * .62, H * .2, W * .3, H * .2, 10); c.fill(); c.strokeStyle = '#2ee59d'; c.lineWidth = W * .008; c.beginPath(); c.moveTo(W * .65, H * .36); c.lineTo(W * .72, H * .31); c.lineTo(W * .79, H * .33); c.lineTo(W * .88, H * .24); c.stroke(); floor(c, W, H, gy, '#3b2f2a', '#4b3c35'); c.fillStyle = '#5a463b'; rr(c, W * .55, gy - H * .1, W * .5, H * .025, 6); c.fill(); c.fillStyle = '#2a2a2e'; c.fillRect(W * .6, gy - H * .075, W * .02, H * .075); c.fillRect(W * .98, gy - H * .075, W * .02, H * .075); c.fillStyle = '#11161c'; rr(c, W * .68, gy - H * .16, W * .16, H * .06, 6); c.fill(); plant(c, W * .06, gy, W / 700); };
BG.casa = (c, W, H, gy, t) => { c.fillStyle = '#3d2f45'; c.fillRect(-W, -H, W * 3, H * 3); c.fillStyle = 'rgba(255,255,255,.04)'; for (let x = -W; x < W * 2; x += W * .08) c.fillRect(x, 0, W * .04, gy); win(c, W * .58, H * .18, W * .3, H * .22, ['#ffb27a', '#ffd9a8'], t); c.fillStyle = '#c9a26b'; rr(c, W * .08, H * .2, W * .2, H * .14, 6); c.fill(); c.fillStyle = '#7a5c99'; rr(c, W * .1, H * .22, W * .16, H * .1, 4); c.fill(); floor(c, W, H, gy, '#6b4b3a', '#7d5a46'); c.fillStyle = '#4b6fa8'; rr(c, -W * .1, gy - H * .09, W * .42, H * .09, 18); c.fill(); c.fillStyle = '#5a80ba'; rr(c, -W * .1, gy - H * .13, W * .4, H * .05, 14); c.fill(); plant(c, W * .92, gy, W / 650); };
BG.tienda = (c, W, H, gy, t) => { c.fillStyle = '#f2e6d0'; c.fillRect(-W, -H, W * 3, H * 3); const cols = ['#ef5a3c', '#2ea8e5', '#2ee59d', '#ffc857', '#8f5bd6']; for (let r = 0; r < 3; r++) { c.fillStyle = '#c8b28c'; c.fillRect(-W * .1, H * (.18 + r * .11), W * 1.2, H * .012); for (let i = 0; i < 14; i++) { c.fillStyle = cols[(i + r) % 5]; rr(c, -W * .08 + i * W * .09, H * (.18 + r * .11) - H * .06, W * .06, H * .06, 4); c.fill(); } } floor(c, W, H, gy, '#d4cbbb', '#c3b9a7'); c.fillStyle = '#7a5235'; rr(c, W * .58, gy - H * .12, W * .5, H * .12, 8); c.fill(); c.fillStyle = '#2b2b30'; rr(c, W * .7, gy - H * .17, W * .12, H * .05, 6); c.fill(); };
BG.banco = (c, W, H, gy, t) => { c.fillStyle = '#e8e2d4'; c.fillRect(-W, -H, W * 3, H * 3); c.fillStyle = '#d4ccb9'; for (let i = 0; i < 6; i++) c.fillRect(-W * .1 + i * W * .24, H * .1, W * .07, gy - H * .1); c.fillStyle = '#1f3355'; c.fillRect(-W, H * .06, W * 3, H * .05); c.fillStyle = '#ffd36b'; c.font = `900 ${W * .05}px Archivo, sans-serif`; c.textAlign = 'center'; c.fillText('BANCO', W * .5, H * .1); c.fillStyle = '#5b6b80'; c.beginPath(); c.arc(W * .8, H * .32, W * .1, 0, 7); c.fill(); c.fillStyle = '#7d8ea5'; c.beginPath(); c.arc(W * .8, H * .32, W * .075, 0, 7); c.fill(); c.strokeStyle = '#d0d6de'; c.lineWidth = W * .01; c.beginPath(); c.moveTo(W * .8, H * .32); c.lineTo(W * .86, H * .3); c.stroke(); floor(c, W, H, gy, '#b9ad97', '#a89c86'); c.fillStyle = '#6b4c34'; rr(c, -W * .05, gy - H * .12, W * .45, H * .12, 6); c.fill(); };
BG.calle = (c, W, H, gy, t) => { sky(c, W, H, '#79c4ff', '#d8efff'); skyline(c, W, H, gy - H * .02, '#9fb3c8', t, 1); skyline(c, W, H, gy, '#6e8299', t, 2); c.fillStyle = '#2b2f36'; c.fillRect(-W, gy, W * 3, H); c.fillStyle = '#9aa1ab'; c.fillRect(-W, gy, W * 3, H * .03); c.fillStyle = '#e8e8e8'; for (let x = -W + (t * 40) % (W * .2); x < W * 2; x += W * .2) c.fillRect(x, gy + H * .08, W * .1, H * .008); };
BG.negocio = (c, W, H, gy, t) => { c.fillStyle = '#2f2a24'; c.fillRect(-W, -H, W * 3, H * 3); c.fillStyle = '#3d362e'; for (let x = -W; x < W * 2; x += W * .12) { c.fillRect(x, 0, W * .11, gy); } c.fillStyle = '#c9483b'; c.beginPath(); c.moveTo(-W * .1, H * .14); for (let i = 0; i <= 12; i++) { c.lineTo(-W * .1 + i * W * .1, H * .14 + (i % 2 ? H * .03 : 0)); } c.lineTo(W * 1.1, H * .1); c.lineTo(-W * .1, H * .1); c.fill(); c.fillStyle = '#ffe8b0'; c.font = `800 ${W * .045}px Archivo, sans-serif`; c.textAlign = 'left'; c.fillText('ABIERTO', W * .07, H * .26); c.fillStyle = '#ffd36b'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(W * (.2 + i * .2), H * .3, W * .015, 0, 7); c.fill(); } floor(c, W, H, gy, '#5a4a3a', '#6a5845'); c.fillStyle = '#8a6a4a'; rr(c, W * .55, gy - H * .11, W * .5, H * .11, 6); c.fill(); };
BG.ciudad = (c, W, H, gy, t) => { sky(c, W, H, '#0b1530', '#2b2457'); c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 30; i++) c.fillRect((i * 97) % W, (i * 53) % (H * .3), 2, 2); skyline(c, W, H, gy - H * .04, '#1c2547', t, 1, true); skyline(c, W, H, gy, '#121a35', t, 3, true); c.fillStyle = '#0d1226'; c.fillRect(-W, gy, W * 3, H); };
BG.estudio = (c, W, H, gy, t, pal) => { c.fillStyle = '#16211d'; c.fillRect(-W, -H, W * 3, H * 3); c.fillStyle = '#f2f5f3'; rr(c, W * .1, H * .14, W * .8, H * .3, 14); c.fill(); c.strokeStyle = '#c3ccc7'; c.lineWidth = 2; for (let y = H * .2; y < H * .42; y += H * .04) { c.beginPath(); c.moveTo(W * .14, y); c.lineTo(W * .86, y); c.stroke(); } c.fillStyle = '#2b3a33'; c.fillRect(W * .1, H * .44, W * .8, H * .012); floor(c, W, H, gy, '#22302a', '#2c3c35'); };
BG.gimnasio = (c, W, H, gy, t) => { c.fillStyle = '#23262c'; c.fillRect(-W, -H, W * 3, H * 3); c.fillStyle = '#2b2f37'; for (let x = -W; x < W * 2; x += W * .25) c.fillRect(x, 0, W * .02, gy); c.fillStyle = '#ff7a45'; c.fillRect(-W, gy - H * .3, W * 3, H * .008); c.fillStyle = 'rgba(255,255,255,.06)'; c.font = `900 ${W * .16}px Archivo, sans-serif`; c.textAlign = 'center'; c.fillText('TRAIN', W * .5, gy - H * .36); c.fillStyle = '#3a3f47'; c.fillRect(W * .8, gy - H * .26, W * .02, H * .26); c.fillRect(W * .96, gy - H * .26, W * .02, H * .26); for (let i = 0; i < 4; i++) { c.fillStyle = '#2c3138'; c.beginPath(); c.arc(W * .9, gy - H * (.05 + i * .055), W * .04, 0, 7); c.fill(); } floor(c, W, H, gy, '#15171b', '#2f333a'); };
BG.parque = (c, W, H, gy, t) => { sky(c, W, H, '#8fd3ff', '#e6f7ff'); c.fillStyle = '#9ed6a3'; c.beginPath(); c.ellipse(W * .2, gy, W * .7, H * .12, 0, Math.PI, 0); c.fill(); c.fillStyle = '#7cc488'; c.beginPath(); c.ellipse(W * .9, gy, W * .6, H * .09, 0, Math.PI, 0); c.fill(); for (const [x, s] of [[.12, 1], [.85, 1.2], [.6, .8]]) { c.fillStyle = '#6b4a2e'; c.fillRect(W * x - W * .012 * s, gy - H * .18 * s, W * .024 * s, H * .18 * s); c.fillStyle = '#2f8f5b'; c.beginPath(); c.arc(W * x, gy - H * .2 * s, W * .1 * s, 0, 7); c.fill(); } floor(c, W, H, gy, '#5aa865', '#4e9a59'); };
BG.pista = (c, W, H, gy, t, pal, loco = 0) => { sky(c, W, H, '#ffb27a', '#ffe1c2'); c.fillStyle = '#7d8a99'; c.fillRect(-W, gy - H * .12, W * 3, H * .12); c.fillStyle = '#c4553d'; c.fillRect(-W, gy, W * 3, H); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(2, W * .004); for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-W, gy + i * H * .04); c.lineTo(W * 2, gy + i * H * .04); c.stroke(); } };
BG.muro = (c, W, H, gy, t) => { c.fillStyle = '#2a2f38'; c.fillRect(-W, -H, W * 3, H * 3); c.fillStyle = '#373d48'; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(-W * .1 + i * W * .2, 0); c.lineTo(W * .1 + i * W * .2, gy); c.lineTo(-W * .1 + i * W * .2 + W * .12, gy); c.closePath(); c.fill(); } floor(c, W, H, gy, '#3a4a6a', '#4a5a7a'); };
BG.patio = (c, W, H, gy, t) => { sky(c, W, H, '#c9d6e3', '#eef2f6'); c.fillStyle = '#9aa3ad'; c.fillRect(-W, gy - H * .2, W * 3, H * .2); c.fillStyle = '#7e8791'; for (let x = -W; x < W * 2; x += W * .16) c.fillRect(x, gy - H * .2, W * .008, H * .2); c.fillStyle = '#3a3f47'; rr(c, W * .78, gy - H * .07, W * .22, H * .07, 10); c.fill(); floor(c, W, H, gy, '#6d6e6a', '#5d5e5a'); };

function grid(c, W, H, gy, step, col) { c.strokeStyle = col; c.lineWidth = Math.max(1, W * .0018); c.beginPath(); for (let x = -W; x < W * 2; x += step) { c.moveTo(x, -H); c.lineTo(x, gy); } for (let y = gy; y > -H; y -= step) { c.moveTo(-W, y); c.lineTo(W * 2, y); } c.stroke(); c.beginPath(); for (let i = -12; i <= 12; i++) { c.moveTo(W / 2 + i * step * .6, gy); c.lineTo(W / 2 + i * step * 2.2, H * 1.2); } for (let k = 1; k < 6; k++) { const y = gy + (H - gy) * (k * k) / 36; c.moveTo(-W, y); c.lineTo(W * 2, y); } c.stroke(); }
BG.cuadricula = (c, W, H, gy, t) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f4f5f7'); g.addColorStop(1, '#d9dde2'); c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3); c.fillStyle = 'rgba(0,0,0,.04)'; c.fillRect(-W, gy, W * 3, H); grid(c, W, H, gy, W * .085, 'rgba(120,130,145,.28)'); };
BG.cuadricula_osc = (c, W, H, gy, t) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2f4253'); g.addColorStop(1, '#1d2a36'); c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-W, gy, W * 3, H); grid(c, W, H, gy, W * .085, 'rgba(140,175,205,.22)'); };
BG.papel = (c, W, H, gy, t) => { c.fillStyle = '#f6f6f3'; c.fillRect(-W, -H, W * 3, H * 3); c.strokeStyle = 'rgba(110,125,145,.35)'; c.lineWidth = Math.max(2, W * .003); c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const y = H * (.1 + i * .09), x = ((i * 0.37 + t * .03) % 1.4 - .2) * W; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + W * .2, y - H * .01, x + W * .45, y + H * .004); c.stroke(); } c.fillStyle = '#e9ebef'; c.fillRect(-W, gy, W * 3, H); c.strokeStyle = '#151515'; c.lineWidth = Math.max(3, W * .004); c.beginPath(); c.moveTo(-W, gy); c.lineTo(W * 2, gy); c.stroke(); c.strokeStyle = 'rgba(110,125,145,.4)'; c.lineWidth = Math.max(2, W * .002); for (let i = 0; i < 5; i++) { const x = W * (.1 + i * .22); c.beginPath(); c.moveTo(x, gy + H * .04); c.quadraticCurveTo(x + W * .03, gy + H * .03, x + W * .06, gy + H * .04); c.stroke(); } };
BG.habitacion = (c, W, H, gy, t) => { c.fillStyle = '#c9b6a6'; c.fillRect(-W, -H, W * 3, H * 3); c.fillStyle = '#d9c8b8'; rr(c, W * .58, H * .12, W * .34, H * .3, 10); c.fill(); c.fillStyle = '#fff3df'; c.fillRect(W * .61, H * .14, W * .28, H * .26); c.fillStyle = '#a38672'; c.fillRect(W * .55, H * .1, W * .1, H * .36); c.fillRect(W * .85, H * .1, W * .1, H * .36); floor(c, W, H, gy, '#8a6b56', '#7a5d4a'); c.fillStyle = '#6e5444'; rr(c, -W * .05, gy - H * .2, W * .1, H * .2, 8); c.fill(); c.fillStyle = '#e9e4dd'; rr(c, -W * .02, gy - H * .1, W * .62, H * .06, 14); c.fill(); c.fillStyle = '#b9a9c9'; rr(c, W * .14, gy - H * .085, W * .5, H * .08, 18); c.fill(); c.fillStyle = '#f4efe8'; rr(c, W * .0, gy - H * .14, W * .16, H * .05, 16); c.fill(); c.fillStyle = '#5b4537'; c.fillRect(W * .02, gy - H * .04, W * .56, H * .04); };

BG.gym_oscuro = (c, W, H, gy, t) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d2228'); g.addColorStop(1, '#0b0e11'); c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3); c.fillStyle = 'rgba(235,240,245,.85)'; for (let i = 0; i < 3; i++) rr(c, W * (.13 + i * .3), H * .015, W * .14, H * .008, 4), c.fill(); c.fillStyle = '#0d1013'; c.fillRect(W * .02, gy - H * .5, W * .03, H * .5); c.fillRect(W * .16, gy - H * .5, W * .03, H * .5); c.fillRect(W * .8, gy - H * .34, W * .18, H * .02); floor(c, W, H, gy, '#0e1114', '#1b2026'); };
BG.plano_azul = (c, W, H, gy, t) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#dcecf8'); g.addColorStop(1, '#bcd6ea'); c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3); grid(c, W, H, gy, W * .06, 'rgba(255,255,255,.7)'); };
BG.rayos = (c, W, H, gy, t) => { c.fillStyle = '#f7f7f8'; c.fillRect(-W, -H, W * 3, H * 3); c.save(); c.translate(W * .6, H * .4); c.fillStyle = 'rgba(0,0,0,.035)'; for (let i = 0; i < 16; i++) { c.rotate(Math.PI / 8); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.max(W, H) * 1.3, -Math.max(W, H) * .09); c.lineTo(Math.max(W, H) * 1.3, Math.max(W, H) * .09); c.closePath(); c.fill(); } c.restore(); c.fillStyle = 'rgba(0,0,0,.04)'; c.fillRect(-W, gy, W * 3, H); };
/* casa humilde (falta de dinero) y mansión (riqueza): el guion elige el escenario */
BG.casa_humilde = (c, W, H, gy, t) => {
  c.fillStyle = '#6d6a5e'; c.fillRect(-W, -H, W * 3, H * 3);
  c.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 9; i++) { c.fillRect(-W * .2 + i * W * .17, H * (.08 + (i % 3) * .07), W * .09, H * .05); }
  c.strokeStyle = 'rgba(40,35,30,.55)'; c.lineWidth = W * .004; c.beginPath(); c.moveTo(W * .3, H * .05); c.lineTo(W * .33, H * .14); c.lineTo(W * .31, H * .2); c.lineTo(W * .35, H * .3); c.stroke();
  c.fillStyle = '#2b2a27'; c.fillRect(W * .5 - 1, 0, 2, H * .1); const fl = .85 + .15 * Math.sin(t * 9) * Math.sin(t * 3.3); c.fillStyle = `rgba(255,236,170,${.9 * fl})`; c.beginPath(); c.arc(W * .5, H * .11, W * .018, 0, 7); c.fill(); c.fillStyle = `rgba(255,236,170,${.08 * fl})`; c.beginPath(); c.arc(W * .5, H * .11, W * .25, 0, 7); c.fill();
  c.fillStyle = '#4c5a6a'; rr(c, W * .64, H * .16, W * .22, H * .17, 4); c.fill(); c.fillStyle = '#9fb3c6'; c.fillRect(W * .66, H * .18, W * .18, H * .13); c.fillStyle = '#6d6a5e'; c.fillRect(W * .748, H * .18, W * .006, H * .13); c.fillRect(W * .66, H * .243, W * .18, H * .006);
  floor(c, W, H, gy, '#8a7f6d', '#7a705f');
  c.fillStyle = '#6b5a4a'; rr(c, -W * .05, gy - H * .085, W * .36, H * .085, 10); c.fill(); c.fillStyle = '#b07d4f'; rr(c, W * .06, gy - H * .07, W * .08, H * .04, 4); c.fill();
  c.fillStyle = '#3a3a3a'; rr(c, W * .72, gy - H * .11, W * .14, H * .09, 4); c.fill(); c.fillStyle = '#6f8a8a'; c.fillRect(W * .735, gy - H * .1, W * .11, H * .06); c.fillStyle = '#5c4a39'; c.fillRect(W * .7, gy - H * .02, W * .18, H * .02);
  c.fillStyle = '#4b86b5'; c.beginPath(); c.moveTo(W * .9, gy); c.lineTo(W * .92, gy - H * .05); c.lineTo(W * .99, gy - H * .05); c.lineTo(W * 1.01, gy); c.fill();
};
BG.mansion = (c, W, H, gy, t) => {
  const g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, '#f6efe2'); g.addColorStop(1, '#e8dcc4'); c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3);
  for (let i = 0; i < 3; i++) { const x = W * (.06 + i * .22); const sky = c.createLinearGradient(0, H * .12, 0, H * .52); sky.addColorStop(0, '#7cc4f5'); sky.addColorStop(1, '#cdeeff'); c.fillStyle = '#c9a75a'; c.fillRect(x - W * .008, H * .1, W * .176, H * .44); c.fillStyle = sky; c.fillRect(x, H * .115, W * .16, H * .41); c.fillStyle = '#5cb4e6'; c.fillRect(x, H * .44, W * .16, H * .085); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x + W * .02 + Math.sin(t + i) * W * .01, H * .46, W * .05, H * .006); }
  c.fillStyle = '#c9a75a'; c.fillRect(W * .5, H * .0, W * .004, H * .07); c.save(); c.translate(W * .78, H * .1); c.rotate(Math.sin(t * .8) * .02); c.fillStyle = '#e8c56b'; c.beginPath(); c.ellipse(0, 0, W * .08, H * .025, 0, 0, 7); c.fill(); for (let i = -3; i <= 3; i++) { c.fillStyle = `rgba(255,255,255,${.6 + .4 * Math.sin(t * 4 + i)})`; c.beginPath(); c.arc(i * W * .022, H * .035, W * .007, 0, 7); c.fill(); } c.restore();
  c.fillStyle = '#c9a75a'; rr(c, W * .74, H * .2, W * .2, H * .15, 4); c.fill(); c.fillStyle = '#3d5a80'; c.fillRect(W * .755, H * .215, W * .17, H * .12); c.fillStyle = '#e09f3e'; c.beginPath(); c.arc(W * .84, H * .27, W * .03, 0, 7); c.fill();
  const fg = c.createLinearGradient(0, gy, 0, H); fg.addColorStop(0, '#f2ede6'); fg.addColorStop(1, '#d9d0c4'); c.fillStyle = fg; c.fillRect(-W, gy, W * 3, H); c.strokeStyle = 'rgba(160,140,110,.25)'; c.lineWidth = 1; for (let x = -W; x < W * 2; x += W * .12) { c.beginPath(); c.moveTo(x, gy); c.lineTo(x - W * .2, H); c.stroke(); }
  c.fillStyle = '#f4f0ea'; rr(c, -W * .05, gy - H * .11, W * .46, H * .11, 22); c.fill(); c.fillStyle = '#e6dfd4'; rr(c, -W * .05, gy - H * .155, W * .44, H * .06, 18); c.fill(); c.fillStyle = '#c9a75a'; rr(c, W * .05, gy - H * .12, W * .07, H * .05, 8); c.fill();
  c.fillStyle = '#2d6a4f'; c.beginPath(); c.ellipse(W * .95, gy - H * .1, W * .05, H * .07, 0, 0, 7); c.fill(); c.fillStyle = '#c9a75a'; rr(c, W * .92, gy - H * .045, W * .06, H * .045, 4); c.fill();
};
Object.assign(BG_LABEL, {casa_humilde: 'Casa humilde (poco dinero)', mansion: 'Mansión (riqueza)'});
Art.bgKeys = Object.keys(BG);
/* textura de suelo en movimiento para locomoción */
Art.groundMotion = (c, W, H, gy, t, speed) => { if (!speed) return; c.save(); c.globalAlpha = .25; c.fillStyle = '#fff'; const sp = speed * W * .02; for (let x = -((t * sp) % (W * .16)); x < W * 1.2; x += W * .16) c.fillRect(x, gy + H * .015, W * .06, Math.max(2, H * .004)); c.restore(); };

/* ---------- objetos animados (finanzas y genéricos) ---------- */
const OB = Art.OBJ = {};
Art.OBJ_LABEL = {coins: 'Monedas', chart_up: 'Gráfica subiendo', chart_down: 'Gráfica bajando', piggy: 'Alcancía', card: 'Tarjeta', phone: 'Celular', cart: 'Carrito', box: 'Paquete', calculator: 'Calculadora', bills: 'Billetes', house: 'Casa', laptop: 'Laptop', alarm: 'Reloj', target: 'Meta', lightbulb: 'Idea', warning: 'Advertencia', check: 'Correcto', cross: 'Error', rocket: 'Cohete', bank: 'Banco', percent: 'Porcentaje', wallet: 'Billetera', bars: 'Barras', dumbbell: 'Mancuerna', heart: 'Corazón/cardio', muscle: 'Músculo', timer: 'Cronómetro', book: 'Estudio/evidencia'};
const G = '#2ee59d', Y = '#ffc857', R = '#ff5d6c', B = '#6cb8ff', WH = '#f4f6f8', DK = '#1a2026';
OB.coins = (c, s, t) => { for (let i = 0; i < 4; i++) { c.fillStyle = '#d99b1e'; c.beginPath(); c.ellipse(0, 30 - i * 14, 42, 13, 0, 0, 7); c.fill(); c.fillStyle = Y; c.beginPath(); c.ellipse(0, 26 - i * 14, 42, 13, 0, 0, 7); c.fill(); } for (let i = 0; i < 3; i++) { const y = ((t * 120 + i * 60) % 180) - 150; c.save(); c.translate(-30 + i * 30, y); c.scale(Math.abs(Math.cos(t * 4 + i)), 1); c.fillStyle = Y; c.beginPath(); c.arc(0, 0, 16, 0, 7); c.fill(); c.fillStyle = '#d99b1e'; c.font = '900 18px Archivo,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 0, 1); c.restore(); } };
function chart(c, t, up) { c.fillStyle = WH; rr(c, -70, -60, 140, 120, 14); c.fill(); c.strokeStyle = '#d0d6dd'; c.lineWidth = 2; for (let y = -30; y < 50; y += 25) { c.beginPath(); c.moveTo(-55, y); c.lineTo(55, y); c.stroke(); } const pts = up ? [[-55, 40], [-25, 20], [0, 28], [25, -5], [55, -38]] : [[-55, -38], [-25, -10], [0, -20], [25, 15], [55, 40]]; const prog = Math.min(1, t * 1.3); c.strokeStyle = up ? '#16b97a' : R; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); const n = (pts.length - 1) * prog; for (let i = 0; i <= Math.floor(n); i++) i ? c.lineTo(...pts[i]) : c.moveTo(...pts[i]); const f = n - Math.floor(n), i0 = Math.floor(n); if (i0 < pts.length - 1) c.lineTo(lerp(pts[i0][0], pts[i0 + 1][0], f), lerp(pts[i0][1], pts[i0 + 1][1], f)); c.stroke(); }
OB.chart_up = (c, s, t) => chart(c, t, true); OB.chart_down = (c, s, t) => chart(c, t, false);
OB.bars = (c, s, t) => { c.fillStyle = WH; rr(c, -70, -60, 140, 120, 14); c.fill(); const hs = [30, 52, 44, 78]; hs.forEach((h, i) => { const k = Math.min(1, Math.max(0, t * 2 - i * .2)); c.fillStyle = i === 3 ? '#16b97a' : '#9fb3c8'; c.fillRect(-52 + i * 28, 46 - h * k, 20, h * k); }); };
OB.piggy = (c, s, t) => { const b = Math.sin(t * 5) * 3; c.translate(0, b); c.fillStyle = '#ff8fab'; c.beginPath(); c.ellipse(0, 0, 62, 46, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(56, -2, 16, 14, 0, 0, 7); c.fill(); c.fillStyle = '#e46d8c'; c.beginPath(); c.arc(52, -4, 3, 0, 7); c.arc(60, -4, 3, 0, 7); c.fill(); c.fillStyle = '#ff8fab'; c.beginPath(); c.moveTo(18, -40); c.lineTo(34, -58); c.lineTo(38, -34); c.fill(); c.fillRect(-36, 34, 14, 22); c.fillRect(20, 34, 14, 22); c.fillStyle = DK; c.beginPath(); c.arc(30, -14, 4, 0, 7); c.fill(); c.fillStyle = '#c94f70'; c.fillRect(-14, -46, 28, 6); c.fillStyle = Y; c.beginPath(); c.arc(0, -60 - ((t * 80) % 40), 12, 0, 7); c.fill(); };
OB.card = (c, s, t) => { c.rotate(Math.sin(t * 2) * .08); const g = c.createLinearGradient(-80, -50, 80, 50); g.addColorStop(0, '#3a6df0'); g.addColorStop(1, '#8f5bd6'); c.fillStyle = g; rr(c, -82, -52, 164, 104, 14); c.fill(); c.fillStyle = Y; rr(c, -60, -20, 30, 22, 4); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 4; i++) c.fillRect(-60 + i * 32, 22, 24, 6); };
OB.phone = (c, s, t) => { c.fillStyle = DK; rr(c, -40, -78, 80, 156, 16); c.fill(); c.fillStyle = '#25303b'; rr(c, -33, -66, 66, 132, 8); c.fill(); const k = (Math.sin(t * 4) + 1) / 2; c.fillStyle = G; rr(c, -28, -50 + k * 4, 56, 26, 6); c.fill(); c.fillStyle = DK; c.fillRect(-20, -42 + k * 4, 30, 4); c.fillRect(-20, -34 + k * 4, 20, 4); c.fillStyle = '#3a4757'; for (let i = 0; i < 3; i++) { rr(c, -28, -12 + i * 24, 56, 18, 5); c.fill(); } };
OB.cart = (c, s, t) => { c.translate(Math.sin(t * 3) * 6, 0); c.strokeStyle = WH; c.lineWidth = 7; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-80, -50); c.lineTo(-58, -50); c.lineTo(-40, 24); c.lineTo(50, 24); c.lineTo(66, -30); c.lineTo(-50, -30); c.stroke(); c.fillStyle = WH; c.beginPath(); c.arc(-30, 44, 10, 0, 7); c.arc(42, 44, 10, 0, 7); c.fill(); c.fillStyle = '#ef5a3c'; rr(c, -36, -56, 30, 30, 4); c.fill(); c.fillStyle = B; rr(c, 0, -62, 34, 36, 4); c.fill(); };
OB.box = (c, s, t) => { c.translate(0, Math.abs(Math.sin(t * 4)) * -8); c.fillStyle = '#c98f52'; c.fillRect(-56, -40, 112, 86); c.fillStyle = '#b07a42'; c.beginPath(); c.moveTo(-56, -40); c.lineTo(-40, -62); c.lineTo(72, -62); c.lineTo(56, -40); c.fill(); c.fillStyle = '#e8c48f'; c.fillRect(-10, -40, 20, 86); };
OB.calculator = (c, s, t) => { c.fillStyle = '#2f3540'; rr(c, -52, -72, 104, 144, 14); c.fill(); c.fillStyle = '#b8e6c7'; rr(c, -40, -60, 80, 32, 6); c.fill(); c.fillStyle = DK; c.font = '800 20px Archivo,sans-serif'; c.textAlign = 'right'; c.fillText(String(Math.floor(t * 37) % 1000), 34, -37); for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) { c.fillStyle = (r + q + Math.floor(t * 3)) % 7 === 0 ? G : '#56606e'; rr(c, -40 + q * 28, -16 + r * 28, 22, 22, 5); c.fill(); } };
OB.bills = (c, s, t) => { for (let i = 0; i < 4; i++) { c.save(); c.translate(Math.sin(t * 2 + i) * 30, -40 + ((t * 70 + i * 40) % 140)); c.rotate(Math.sin(t * 3 + i) * .5); c.fillStyle = '#5fbf7a'; rr(c, -40, -20, 80, 40, 5); c.fill(); c.fillStyle = '#2e7d4a'; c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill(); c.restore(); } };
OB.house = (c, s, t) => { c.fillStyle = '#e8dccb'; c.fillRect(-56, -20, 112, 76); c.fillStyle = '#c9483b'; c.beginPath(); c.moveTo(-72, -16); c.lineTo(0, -76); c.lineTo(72, -16); c.fill(); c.fillStyle = '#6b4a2e'; c.fillRect(-14, 16, 28, 40); c.fillStyle = B; c.fillRect(-46, -4, 24, 22); c.fillRect(22, -4, 24, 22); };
OB.laptop = (c, s, t) => { c.fillStyle = '#c7ccd3'; rr(c, -76, -56, 152, 98, 8); c.fill(); c.fillStyle = '#1d2733'; c.fillRect(-66, -46, 132, 78); c.strokeStyle = G; c.lineWidth = 4; c.beginPath(); c.moveTo(-54, 20); c.lineTo(-20, -2); c.lineTo(8, 8); c.lineTo(50, -30); c.stroke(); c.fillStyle = '#9aa1ab'; c.beginPath(); c.moveTo(-92, 42); c.lineTo(92, 42); c.lineTo(80, 54); c.lineTo(-80, 54); c.fill(); };
OB.alarm = (c, s, t) => { c.rotate(Math.sin(t * 30) * .06); c.fillStyle = R; c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fill(); c.fillStyle = WH; c.beginPath(); c.arc(0, 0, 46, 0, 7); c.fill(); c.strokeStyle = DK; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -30); c.moveTo(0, 0); c.lineTo(Math.cos(t * 2) * 24, Math.sin(t * 2) * 24); c.stroke(); };
OB.timer = OB.alarm;
OB.target = (c, s, t) => { for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? WH : R; c.beginPath(); c.arc(0, 0, 64 - i * 16, 0, 7); c.fill(); } const k = Math.min(1, t * 1.5); c.strokeStyle = DK; c.lineWidth = 5; c.beginPath(); c.moveTo(90 - 90 * k, -90 + 90 * k); c.lineTo(130 - 90 * k, -130 + 90 * k); c.stroke(); };
OB.lightbulb = (c, s, t) => { c.save(); c.globalAlpha *= .3 + .2 * Math.sin(t * 6); c.fillStyle = Y; c.beginPath(); c.arc(0, -10, 80, 0, 7); c.fill(); c.restore(); c.fillStyle = Y; c.beginPath(); c.arc(0, -16, 44, 0, 7); c.fill(); c.fillStyle = '#9aa1ab'; rr(c, -20, 22, 40, 28, 5); c.fill(); };
OB.warning = (c, s, t) => { const k = 1 + Math.sin(t * 8) * .05; c.scale(k, k); c.fillStyle = Y; c.beginPath(); c.moveTo(0, -66); c.lineTo(68, 52); c.lineTo(-68, 52); c.closePath(); c.fill(); c.fillStyle = DK; rr(c, -6, -26, 12, 46, 5); c.fill(); c.beginPath(); c.arc(0, 34, 7, 0, 7); c.fill(); };
OB.check = (c, s, t) => { c.fillStyle = G; c.beginPath(); c.arc(0, 0, 60, 0, 7); c.fill(); const k = Math.min(1, t * 2); c.strokeStyle = '#04140d'; c.lineWidth = 13; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-28, 2); c.lineTo(-8, 22); if (k > .4) c.lineTo(lerp(-8, 30, (k - .4) / .6), lerp(22, -22, (k - .4) / .6)); c.stroke(); };
OB.cross = (c, s, t) => { c.fillStyle = R; c.beginPath(); c.arc(0, 0, 60, 0, 7); c.fill(); c.strokeStyle = WH; c.lineWidth = 13; c.lineCap = 'round'; c.beginPath(); c.moveTo(-24, -24); c.lineTo(24, 24); c.moveTo(24, -24); c.lineTo(-24, 24); c.stroke(); };
OB.rocket = (c, s, t) => { c.translate(Math.sin(t * 20) * 2, -((t * 30) % 40)); c.fillStyle = Y; c.beginPath(); c.moveTo(-14, 50); c.lineTo(0, 90 + Math.sin(t * 30) * 10); c.lineTo(14, 50); c.fill(); c.fillStyle = WH; c.beginPath(); c.moveTo(0, -76); c.quadraticCurveTo(40, -20, 24, 52); c.lineTo(-24, 52); c.quadraticCurveTo(-40, -20, 0, -76); c.fill(); c.fillStyle = B; c.beginPath(); c.arc(0, -14, 13, 0, 7); c.fill(); c.fillStyle = R; c.beginPath(); c.moveTo(-24, 20); c.lineTo(-44, 54); c.lineTo(-22, 50); c.fill(); c.beginPath(); c.moveTo(24, 20); c.lineTo(44, 54); c.lineTo(22, 50); c.fill(); };
OB.bank = (c, s, t) => { c.fillStyle = WH; c.beginPath(); c.moveTo(-76, -30); c.lineTo(0, -74); c.lineTo(76, -30); c.fill(); c.fillRect(-72, 40, 144, 14); for (let i = 0; i < 4; i++) c.fillRect(-60 + i * 36, -24, 16, 64); c.fillStyle = Y; c.beginPath(); c.arc(0, -44, 10, 0, 7); c.fill(); };
OB.percent = (c, s, t) => { c.fillStyle = '#8f5bd6'; c.beginPath(); c.arc(0, 0, 62, 0, 7); c.fill(); c.fillStyle = WH; c.font = '900 72px Archivo,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('%', 0, 4); };
OB.wallet = (c, s, t) => { c.fillStyle = '#6b4a2e'; rr(c, -70, -44, 140, 92, 14); c.fill(); c.fillStyle = '#8a6240'; rr(c, 10, -14, 66, 36, 10); c.fill(); c.fillStyle = Y; c.beginPath(); c.arc(38, 4, 7, 0, 7); c.fill(); c.fillStyle = '#5fbf7a'; rr(c, -60, -60 - Math.abs(Math.sin(t * 3)) * 10, 90, 26, 4); c.fill(); };
OB.dumbbell = (c, s, t) => { c.rotate(Math.sin(t * 3) * .1); c.fillStyle = '#9aa1ab'; c.fillRect(-60, -6, 120, 12); for (const x of [-64, 64]) { c.fillStyle = '#2c3138'; rr(c, x - 14, -34, 28, 68, 6); c.fill(); } };
OB.heart = (c, s, t) => { const k = 1 + Math.max(0, Math.sin(t * 8)) * .12; c.scale(k, k); c.fillStyle = R; c.beginPath(); c.moveTo(0, 50); c.bezierCurveTo(-90, -10, -40, -76, 0, -30); c.bezierCurveTo(40, -76, 90, -10, 0, 50); c.fill(); };
OB.muscle = (c, s, t) => { c.fillStyle = '#ff7a45'; c.beginPath(); c.ellipse(0, 0, 70, 36 + Math.sin(t * 4) * 6, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(-60, i * 10); c.quadraticCurveTo(0, i * 14, 60, i * 10); c.stroke(); } };
OB.book = (c, s, t) => { c.fillStyle = B; rr(c, -60, -70, 120, 140, 8); c.fill(); c.fillStyle = WH; c.fillRect(-46, -50, 92, 8); c.fillRect(-46, -34, 70, 8); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-60, -70, 14, 140); };
/* emojis tipo sticker: borde blanco, sombra suave, entrada con rebote y leve flotación */
const EMO = Art.EMO = {coins: '🪙', chart_up: '📈', chart_down: '📉', piggy: '🐷', card: '💳', phone: '📱', cart: '🛒', box: '📦', calculator: '🧮', bills: '💵', house: '🏠', laptop: '💻', alarm: '⏰', target: '🎯', lightbulb: '💡', warning: '⚠️', check: '✅', cross: '❌', rocket: '🚀', bank: '🏦', percent: '💯', wallet: '👛', bars: '📊', dumbbell: '🏋️', heart: '❤️', muscle: '💪', timer: '⏱️', book: '📚',
  money: '💰', rich: '🤑', fire: '🔥', brain: '🧠', calendar: '🗓️', star: '⭐', trophy: '🏆', gem: '💎', handshake: '🤝', shock: '😱', think: '🤔', sleep: '😴', food: '🥗', water: '💧', clock: '⌛', store: '🏪', mail: '📩', key: '🔑', chain: '⛓️', growth: '🌱', medal: '🥇', bolt: '⚡', stop: '🛑', question: '❓', idea2: '✨', run: '🏃', bike: '🚴', stretch: '🧘', scale: '⚖️', car: '🚗', plane: '✈️', gift: '🎁'};
Art.EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif';
Art.sticker = (ctx, e, x, y, size, t = 1) => {
  const pop = Math.min(1, t / .4), k = pop < 1 ? Math.sin(pop * Math.PI / 2) * (1 + .25 * Math.sin(pop * Math.PI)) : 1;
  ctx.save(); ctx.translate(x, y + Math.sin(t * 2.2 + x * .01) * size * .03); ctx.rotate(Math.sin(t * 1.3 + x * .02) * .06); ctx.scale(k, k);
  ctx.globalAlpha *= Math.min(1, t / .2);
  ctx.font = `${Math.round(size * .78)}px ${Art.EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const o = Math.max(2, size * .035);
  ctx.filter = `drop-shadow(0 0 ${o}px #fff) drop-shadow(0 0 ${o * .6}px #fff) drop-shadow(0 ${size * .06}px ${size * .08}px rgba(0,0,0,.35))`;
  ctx.fillText(e, 0, 0); ctx.filter = 'none'; ctx.restore();
};
Art.drawObject = (ctx, key, x, y, size, t) => {
  if (EMO[key]) return Art.sticker(ctx, EMO[key], x, y, size, t);
  const f = OB[key]; if (!f) return;
  const pop = Math.min(1, t / .35), s = size / 160 * (pop < 1 ? (1.15 * Math.sin(pop * Math.PI / 2) + (pop > .8 ? -.15 * (pop - .8) / .2 : 0)) : 1);
  ctx.save(); ctx.translate(x, y + Math.sin(t * 2.2 + x) * size * .02); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, t / .2); f(ctx, size, t); ctx.restore();
};
})();
