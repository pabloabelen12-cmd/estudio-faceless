'use strict';
/* ============ Motor 3D propio (sin librerías ni servicios externos) ============
   Maniquí 3D hecho de cápsulas y esferas con perspectiva real, iluminación, sombra,
   cámara orbital, suelo cuadriculado, implementos y músculos resaltados. */
const Art3D = App.Art3D = {};
(() => {
const A = App.Art, D2R = Math.PI / 180, shade = A.shade;
const ik = A._ik, L = A._L, shoulderOf = A._shoulderOf;
const V = {add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len: a => Math.hypot(a[0], a[1], a[2]), norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]};
const LIGHT = V.norm([-.35, .85, .55]);
const HLC = '#ff3b5c';
function mixHex(a, b, t) { const p = h => { h = h.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16); return [n >> 16, (n >> 8) & 255, n & 255]; }; const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

/* ancho lateral (eje Z) de manos y pies según el movimiento */
const GRIP = {backsquat: 52, flywheel: 52, deadlift: 34, press: 40, bench: 48, clean: 36, pushup: 42, pullup: 50, hang: 46, dip: 34, kbswing: 7, goblet: 11, slam: 14, clubs: 6, sandbag: 22, stone: 26, ropes: 30, climb: 36, carry: 44, row: 34, curl: 40, lunge: 40, stretch: 20, plank: 26, crawl: 32, nordic: 26, handstand: 36, breathe: 36, mobility: 42, squat: 26, jump: 40, boxjump: 40, sprint: 40, jog: 40, sled: 30};
const STANCE = {squat: 26, goblet: 26, backsquat: 26, flywheel: 26, kbswing: 26, sprint: 12, jog: 12, lunge: 13, carry: 15, ropes: 24, sled: 14, crawl: 18, deadlift: 16, clean: 18};

/* articulaciones del esqueleto en el plano sagital (las mismas del 2D) */
function joints(pose) {
  const P = pose.P, T = pose.T, S = shoulderOf(P, T), ax = [Math.sin(T * D2R), -Math.cos(T * D2R)];
  const rel = v => v[0] === 'S' ? [S[0] + v[1], S[1] + v[2]] : v;
  const hN = rel(pose.hN), hF = rel(pose.hF), S2 = [S[0] - ax[0] * 8, S[1] - ax[1] * 8];
  const kn = ik(P[0], P[1], pose.fN[0], pose.fN[1], L.thigh, L.shin, pose.ks), kf = ik(P[0], P[1], pose.fF[0], pose.fF[1], L.thigh, L.shin, pose.ks);
  const en = ik(S2[0], S2[1], hN[0], hN[1], L.up, L.fore, pose.esN), ef = ik(S2[0], S2[1], hF[0], hF[1], L.up, L.fore, pose.esF);
  const headA = (T * (pose.hf ?? .3) + (pose.H || 0)) * D2R;
  const hc = [S[0] + Math.sin(T * D2R + headA * .6) * 36, S[1] - Math.cos(T * D2R + headA * .6) * 36];
  return {P, S, S2, ax, T, hN, hF, kn: [kn[0], kn[1]], kf: [kf[0], kf[1]], en: [en[0], en[1]], ef: [ef[0], ef[1]], fN: pose.fN, fF: pose.fF, hc, face: [Math.cos(headA), Math.sin(headA)]};
}
const W3 = (v, z = 0) => [v[0], -v[1], z];

/* construye las primitivas 3D del personaje
   opt: {variant: 'normal'|'sobrepeso'|'delgado', tint, handZ(s), talk, offset:[x,y,z]} */
function buildBody(ch, pose, move, t, hlSet, opt = {}) {
  const lk = {build: 1, ...ch.look}, b = lk.build || 1, fem = lk.body === 'f';
  const anat = lk.style === 'anatomy';
  const fat = opt.variant === 'sobrepeso', thin = opt.variant === 'delgado';
  const bL = b * (thin ? .72 : fat ? 1.16 : 1), bT = b * (thin ? .8 : fat ? 1.22 : 1);
  const skin = opt.tint || lk.skin, top = anat ? skin : (lk.topColor || skin), shorts = lk.pants || '#1c2026', shoes = anat ? skin : (lk.shoes || '#eeeeee');
  const J = joints(pose), id = move ? move.id : '';
  const g = GRIP[id] || 20, st = STANCE[id] || 11;
  const handZ = s => opt.handZ ? opt.handZ(s) : s * g;
  const out = [];
  const hl = k => hlSet && hlSet.has(k);
  const cap = (a, c, r1, r2, color, h) => out.push({type: 'cap', a, b: c, r1, r2, color, hl: h, body: true});
  const sph = (c, r, color, h) => out.push({type: 'sph', c, r, color, hl: h, body: true});
  const fwd = [Math.cos(J.T * D2R), -Math.sin(J.T * D2R)];
  const P3 = W3(J.P), up3 = [J.ax[0], -J.ax[1], 0], f3 = [fwd[0], -fwd[1], 0];
  const hipZ = 11 * bT, shZ = (fem ? 17 : 22) * bT;
  for (const s of [1, -1]) {
    const k = s > 0 ? J.kn : J.kf, f = s > 0 ? J.fN : J.fF;
    const hip = V.add(P3, [0, 0, s * hipZ]), knee = W3(k, s * (hipZ + st) / 2 + s * 2), ank = W3(f, s * st);
    const mid = V.lerp(hip, knee, .45);
    cap(hip, mid, 18 * bL, 16.5 * bL, shorts, false);
    cap(mid, knee, 16 * bL, 10.5 * bL, skin, hl('legs') || hl('hamstrings'));
    cap(knee, ank, 12 * bL, 7, skin, hl('legs') || hl('calves'));
    const sa = Math.atan2(f[1] - k[1], f[0] - k[0]) - Math.PI / 2, fd = [Math.cos(Math.max(-1.2, Math.min(1.2, sa))), -Math.sin(Math.max(-1.2, Math.min(1.2, sa))), 0];
    cap(ank, V.add(ank, V.mul(fd, 22)), 6.5, 6, shoes, false);
  }
  cap(V.add(P3, [0, 0, -hipZ - 2]), V.add(P3, [0, 0, hipZ + 2]), 17 * bT, 17 * bT, shorts, hl('glutes') || hl('grasa'));
  const chestC = W3([J.S[0] - J.ax[0] * 26, J.S[1] - J.ax[1] * 26]), upperC = W3([J.S[0] - J.ax[0] * 10, J.S[1] - J.ax[1] * 10]);
  cap(V.add(P3, V.mul(up3, 10)), chestC, (fem ? 15 : 17.5) * bT, (fem ? 16 : 20) * bT, top, hl('core') || hl('grasa'));
  cap(V.add(upperC, [0, 0, -shZ + 4]), V.add(upperC, [0, 0, shZ - 4]), (fem ? 14.5 : 19) * bT, (fem ? 14.5 : 19) * bT, top, hl('back'));
  if (fat) { const bc = V.add(V.lerp(P3, chestC, .32), V.mul(f3, 12 * bT)); sph(bc, 25 * bT, top, hl('core') || hl('grasa')); for (const s of [1, -1]) sph(V.add(V.lerp(P3, chestC, .2), [-f3[0] * 4, 0, s * 20 * bT]), 14 * bT, top, hl('grasa') || hl('core')); }
  if (!thin) { const pc = V.add(V.add(chestC, V.mul(f3, (fem ? 6 : 7) * bT)), [0, 7, 0]); cap(V.add(pc, [0, 0, -(fem ? 9 : 12) * bT]), V.add(pc, [0, 0, (fem ? 9 : 12) * bT]), (fem ? 10 : 13) * bT, (fem ? 10 : 13) * bT, fem ? (lk.topColor || top) : top, hl('chest')); }
  for (const s of [1, -1]) sph(V.add(P3, [-f3[0] * 9, -f3[1] * 9 - 3, s * 8]), 13 * bT, shorts, hl('glutes'));
  const S3 = W3(J.S), hc = W3(J.hc), face3 = [J.face[0], -J.face[1], 0], hup = V.norm(V.sub(hc, S3));
  cap(S3, V.add(S3, V.mul(hup, 14)), 10 * bT, 9, skin, false);
  out.push({type: 'head', c: hc, r: 24, color: skin, face: face3, up: hup, lk, t, talk: opt.talk || 0, body: true});
  for (const s of [1, -1]) {
    const e = s > 0 ? J.en : J.ef, h = s > 0 ? J.hN : J.hF;
    const hz = handZ(s), sh = W3(J.S2, s * shZ), hand = W3(h, hz), el = W3(e, (s * shZ + hz) / 2 + s * 4);
    const armC = anat || lk.top === 'tank' ? skin : top;
    sph(sh, 14 * bL, armC, hl('shoulders'));
    cap(sh, el, 13 * bL, 10 * bL, armC, hl('arms'));
    cap(el, hand, 10 * bL, 7, skin, hl('arms') || hl('grip'));
    sph(hand, 8.5, skin, hl('grip'));
  }
  if (opt.offset) translate(out, opt.offset);
  return {prims: out, J, g, st};
}
function translate(list, o) {
  const T = q => [q[0] + o[0], q[1] + o[1], q[2] + o[2]];
  for (const p of list) { if (p.a) p.a = T(p.a); if (p.b) p.b = T(p.b); if (p.c) p.c = T(p.c); if (p.pts) p.pts = p.pts.map(T); if (p.min) { p.min = T(p.min); p.max = T(p.max); } }
}


/* ---------- cuerpo humano esculpido (elipsoides musculares) ---------- */
function ellOf(c, main, rM, sec, rS, rT, color, h, extra) {
  main = V.norm(main); let s2 = V.sub(sec, V.mul(main, V.dot(sec, main))); if (V.len(s2) < 1e-3) s2 = Math.abs(main[1]) < .9 ? V.sub([0, 1, 0], V.mul(main, main[1])) : V.sub([1, 0, 0], V.mul(main, main[0])); s2 = V.norm(s2); const t3 = V.cross(main, s2);
  return {type: 'ell', c, A: V.mul(main, rM), B: V.mul(s2, rS), C: V.mul(t3, rT), color, hl: h, body: true, ...(extra || {})};
}
function perpTo(v, ref, fb) { let p = V.sub(ref, V.mul(v, V.dot(ref, v))); if (V.len(p) < 1e-3) p = fb; return V.norm(p); }
function buildHuman(ch, pose, move, t, hlSet, opt = {}) {
  const lk = {build: 1, ...ch.look}, b = lk.build || 1, fem = lk.body === 'f', anat = lk.style === 'anatomy';
  const fat = opt.variant === 'sobrepeso', thin = opt.variant === 'delgado';
  const mus = thin ? .55 : fat ? .85 : 1, fk = fat ? 1 : 0;
  const skin = opt.tint || lk.skin, top = anat ? skin : (lk.topColor || skin), shorts = lk.pants || '#1c2026', feetC = anat ? skin : (lk.shoes || '#eeeeee');
  const armC = anat || lk.top === 'tank' ? skin : top;
  const J = joints(pose), id = move ? move.id : '';
  const g = GRIP[id] ?? 38, st = STANCE[id] ?? 15;
  const handZ = s => opt.handZ ? opt.handZ(s) : s * g;
  const out = [], hl = k => !!(hlSet && hlSet.has(k));
  const E = (...a) => out.push(ellOf(...a));
  const C = (a, c, r1, r2, color, h) => out.push({type: 'cap', a, b: c, r1, r2, color, hl: h, body: true});
  const Zv = [0, 0, 1];
  const P3 = W3(J.P), up3 = [J.ax[0], -J.ax[1], 0], f3 = [Math.cos(J.T * D2R), Math.sin(J.T * D2R) * -1, 0];
  const shZ = (fem ? 27 : 35) * b * (thin ? .85 : 1), hipZ = (fem ? 16 : 14) * b;
  const chestC = W3([J.S[0] - J.ax[0] * 30, J.S[1] - J.ax[1] * 30]), waistC = V.lerp(P3, chestC, .48);
  // pelvis y glúteos
  E(V.add(P3, V.mul(up3, 4)), Zv, (fem ? 29 : 27) * b + fk * 6, up3, 20, (fem ? 21 : 19) + fk * 4, shorts, hl('glutes') || hl('grasa'));
  for (const s of [1, -1]) E(V.add(V.add(P3, V.mul(f3, -8)), V.add(V.mul(up3, -2), [0, 0, s * 11 * b])), up3, 14 * (fem ? 1.1 : 1), Zv, 12 * b * (fem ? 1.1 : 1), 10, shorts, hl('glutes'));
  // abdomen, tórax, dorsales, pectorales, trapecios
  E(waistC, up3, 30, Zv, (fem ? 21 : 23.5) * b * (thin ? .9 : 1) + fk * 12, (fem ? 16 : 17) + fk * 12, top, hl('core') || hl('grasa'));
  E(chestC, Zv, (fem ? 25 : 32) * b * (thin ? .86 : 1), up3, 27, (fem ? 17 : 20) * b, top, hl('back'));
  if (fem) E(V.add(V.add(chestC, V.mul(f3, 6)), V.mul(up3, 3)), Zv, 24, up3, 12, 15, lk.topColor || '#1f2a33', hl('chest'));
  if (!fem && !thin) for (const s of [1, -1]) E(V.add(V.add(chestC, V.mul(up3, -12)), V.add(V.mul(f3, -5), [0, 0, s * 23 * b])), up3, 25, Zv, 11 * b * mus, 15 * b, top, hl('back'));
  if (!thin && !fem) for (const s of [1, -1]) E(V.add(V.add(chestC, V.mul(f3, 12 * b)), V.add(V.mul(up3, 6), [0, 0, s * 13 * b])), Zv, 14 * b * mus, up3, 9.5 * b * mus, 6.5 * b * mus, top, hl('chest'));
  if (!fem && !fat && !thin) for (let r = 0; r < 3; r++) for (const s of [1, -1]) E(V.add(V.add(waistC, V.mul(f3, 14)), V.add(V.mul(up3, 9 - r * 9.5), [0, 0, s * 5.8])), up3, 4.2, Zv, 4.8, 3, top, hl('core'), {fine: true});
  if (fat) E(V.add(V.add(waistC, V.mul(f3, 16)), V.mul(up3, -5)), up3, 23, Zv, 25, 17, top, hl('core') || hl('grasa'));
  const S3 = W3(J.S), hc = W3(J.hc), face3 = [J.face[0], -J.face[1], 0], hup = V.norm(V.sub(hc, S3));
  E(V.add(S3, V.add(V.mul(up3, 3), V.mul(f3, -5))), Zv, (fem ? 17 : 24) * b, up3, 9, 11, armC === skin ? skin : top, hl('back') || hl('shoulders'));
  C(S3, V.add(S3, V.mul(hup, 12)), (fem ? 9.5 : 13.5) * b, (fem ? 8.5 : 11.5) * b, skin, false);
  out.push({type: 'hhead', c: hc, r: fem ? 18.5 : 21, face: face3, up: hup, lk, talk: opt.talk || 0, body: true});
  // brazos
  for (const s of [1, -1]) {
    const e = s > 0 ? J.en : J.ef, h = s > 0 ? J.hN : J.hF, hz = handZ(s);
    const sh = W3(J.S2, s * shZ), hand = W3(h, hz), el = W3(e, (s * shZ + hz) / 2 + s * 7);
    const ua = V.norm(V.sub(el, sh)), fa = V.norm(V.sub(hand, el)), fr = perpTo(ua, fa, f3);
    C(sh, el, 10.5 * b * (thin ? .8 : 1), 8.5 * b * (thin ? .8 : 1), armC, hl('arms'));
    E(V.add(sh, V.mul(ua, 4)), ua, 15 * b * mus + 3, fr, 14 * b * mus + 2, 15 * b * mus + 2, armC, hl('shoulders'));
    E(V.add(V.lerp(sh, el, .56), V.mul(fr, 3.5)), ua, 18, fr, 9.5 * b * mus + 1, 9 * b * mus + 1, armC, hl('arms'));
    E(V.add(V.lerp(sh, el, .45), V.mul(fr, -4.5)), ua, 21, fr, 9 * b * mus + 1, 9.5 * b * mus + 1, armC, hl('arms'));
    C(el, hand, 9 * b * (thin ? .8 : 1), 6, skin, hl('arms') || hl('grip'));
    E(V.lerp(el, hand, .28), fa, 14, fr, 8.5 * b * mus + 1, 8 * b * mus + 1, skin, hl('arms') || hl('grip'));
    E(V.add(hand, V.mul(fa, 4)), fa, 9, Zv, 7, 4.8, skin, hl('grip'));
  }
  // piernas
  for (const s of [1, -1]) {
    const k = s > 0 ? J.kn : J.kf, f = s > 0 ? J.fN : J.fF;
    const hip = V.add(P3, [0, 0, s * hipZ]), knee = W3(k, s * (hipZ + st) / 2 + s * 1), ank = W3(f, s * st);
    const th = V.norm(V.sub(knee, hip)), sh2 = V.norm(V.sub(ank, knee));
    const sa = Math.atan2(f[1] - k[1], f[0] - k[0]) - Math.PI / 2, fd = [Math.cos(Math.max(-1.2, Math.min(1.2, sa))), -Math.sin(Math.max(-1.2, Math.min(1.2, sa))), 0];
    const lf = perpTo(th, V.add(fd, V.mul(f3, .3)), f3), sf = perpTo(sh2, fd, f3);
    C(hip, knee, 16.5 * b * (thin ? .8 : 1) + fk * 3, 10.5 * b, skin, hl('legs') || hl('hamstrings'));
    E(V.add(V.lerp(hip, knee, .52), V.mul(lf, 6)), th, 27, lf, 12 * b * mus + 2 + fk * 2, 13 * b * mus + 2 + fk * 3, skin, hl('legs'));
    E(V.add(V.lerp(hip, knee, .5), V.mul(lf, -6)), th, 25, lf, 10.5 * b * mus + 1, 12 * b * mus + 1, skin, hl('hamstrings') || hl('legs'));
    C(hip, V.lerp(hip, knee, .4), 19.5 * b + fk * 4, 18.5 * b + fk * 3, shorts, false);
    E(knee, sh2, 8, lf, 8, 8, skin, false);
    C(knee, ank, 9.5 * b, 6.2, skin, hl('legs') || hl('calves'));
    E(V.add(V.lerp(knee, ank, .3), V.mul(sf, -5)), sh2, 18, sf, 9 * b * mus + 1, 9.5 * b * mus + 1, skin, hl('calves') || hl('legs'));
    E(V.add(V.add(ank, V.mul(fd, 10)), V.mul(up3, -2)), fd, 15, Zv, 6.5, 5, feetC, false);
  }
  if (opt.offset) translate(out, opt.offset);
  return {prims: out, J, g, st};
}
function ellScreen(cam, p, extra = 0) {
  const c = cam.proj(p.c); if (c[2] < 5) return null; const k = cam.F / c[2];
  const a = cam.scr(p.A), b = cam.scr(p.B), d = cam.scr(p.C);
  const P = a[0] * a[0] + b[0] * b[0] + d[0] * d[0], Q = a[0] * a[1] + b[0] * b[1] + d[0] * d[1], R = a[1] * a[1] + b[1] * b[1] + d[1] * d[1];
  const tr = (P + R) / 2, dd = Math.sqrt(((P - R) / 2) ** 2 + Q * Q);
  return {x: c[0], y: c[1], r1: Math.sqrt(tr + dd) * k + extra, r2: Math.sqrt(Math.max(1e-6, tr - dd)) * k + extra, th: .5 * Math.atan2(2 * Q, P - R)};
}
function drawEll(ctx, cam, p, t, glowCol) {
  const e = ellScreen(cam, p); if (!e || e.r1 < .3) return;
  let col = p.color; if (p.hl) col = mixHex(col, HLC, .4 + .18 * Math.sin(t * 5));
  ctx.save(); if (p.hl) { ctx.shadowColor = 'rgba(255,40,80,.95)'; ctx.shadowBlur = 24; } if (glowCol) { ctx.shadowColor = glowCol; ctx.shadowBlur = 14; }
  ctx.translate(e.x, e.y); ctx.rotate(e.th); ctx.scale(e.r1, e.r2);
  const L2 = cam.scr(LIGHT); const lx = L2[0] * Math.cos(e.th) + L2[1] * Math.sin(e.th), ly = -L2[0] * Math.sin(e.th) + L2[1] * Math.cos(e.th); const ll = Math.hypot(lx / e.r1, ly / e.r2) || 1; const gx = lx / e.r1 / ll * .42, gy = ly / e.r2 / ll * .42;
  const gr = ctx.createRadialGradient(gx, gy, .04, 0, 0, 1.04); gr.addColorStop(0, shade(col, p.fine ? .18 : .3)); gr.addColorStop(.5, col); gr.addColorStop(1, shade(col, p.fine ? -.22 : -.36));
  ctx.fillStyle = glowCol ? col : gr; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill();
  if (!glowCol && !p.fine) { ctx.globalAlpha = .16; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(gx * 1.15, gy * 1.15, .22, .14, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}
function drawHumanHead(ctx, cam, p, t) {
  const {c, r, face, up, lk} = p; const side = V.norm(V.cross(face, up));
  const at = (fw, u, sd) => V.add(c, V.add(V.add(V.mul(face, fw), V.mul(up, u)), V.mul(side, sd)));
  const facing = V.dot(face, V.mul(cam.f, -1)) > -.15;
  const skin = p.color || lk.skin;
  const cranium = ellOf(at(-1, 3, 0), up, r * 1.02, face, r * 1.02, r * .93, skin, false);
  const jaw = ellOf(at(3, -8, 0), up, r * .62, face, r * .7, r * .64, skin, false);
  const ears = [1, -1].map(sd => ellOf(at(-2, 0, sd * r * .93), up, r * .3, face, r * .2, r * .12, shade(skin, -.06), false));
  const hairOn = lk.hair && lk.hair !== 'bald' && lk.hair !== 'none';
  const hair = hairOn ? ellOf(at(-1, 10.5, 0), up, r * (lk.hair === 'fade' ? .9 : .95), face, r * 1.02, r * .99, lk.hairColor || '#222', false) : null;
  const tail = lk.hair === 'ponytail' ? {type: 'cap', a: at(-r * .7, r * .4, 0), b: at(-r * 1.5, -r * .6, 0), r1: 7.5, r2: 3.5, color: lk.hairColor} : null;
  const earsBack = ears.filter(e => cam.depth(e.c) > cam.depth(c)), earsFront = ears.filter(e => cam.depth(e.c) <= cam.depth(c));
  if (facing) { if (tail) drawCap(ctx, cam, tail, t); if (hair) drawEll(ctx, cam, hair, t); earsBack.forEach(e => drawEll(ctx, cam, e, t)); drawEll(ctx, cam, jaw, t); drawEll(ctx, cam, cranium, t); earsFront.forEach(e => drawEll(ctx, cam, e, t)); }
  else { earsBack.forEach(e => drawEll(ctx, cam, e, t)); drawEll(ctx, cam, jaw, t); drawEll(ctx, cam, cranium, t); earsFront.forEach(e => drawEll(ctx, cam, e, t)); if (hair) drawEll(ctx, cam, hair, t); if (tail) drawCap(ctx, cam, tail, t); }
  if (!facing) return;
  const tk = p.talk || 0;
  drawEll(ctx, cam, ellOf(at(r * .97, -2, 0), up, 4.2, face, 3.2, 2.6, skin, false), t);
  if (/visor/.test(lk.acc || '')) {
    drawEll(ctx, cam, ellOf(at(r * .8, 3.5, 0), side, r * .86, up, 5.2, 4.2, '#0e1216', false), t);
    drawEll(ctx, cam, ellOf(at(r * .86 + 2.6, 3.8, 0), side, r * .62, up, 1.7 + tk * .9, 1.2, lk.visorColor || '#d7ff3a', false), t, lk.visorColor || '#d7ff3a');
  } else {
    for (const sd of [-1, 1]) { drawEll(ctx, cam, ellOf(at(r * .86, 3.5, sd * 6.5), side, 3.4, up, 2.3, 1.6, '#ffffff', false, {fine: true}), t); drawEll(ctx, cam, ellOf(at(r * .9, 3.4, sd * 6.5), side, 1.7, up, 1.9, 1, '#141414', false, {fine: true}), t); drawEll(ctx, cam, ellOf(at(r * .88, 8, sd * 7), side, 4, up, .9, 1, shade(lk.hairColor || '#333', -.1), false, {fine: true}), t); }
  }
  drawEll(ctx, cam, ellOf(at(r * .9, -7.5, 0), side, 4.2 + tk * .6, up, .9 + tk * 2.6, 1.2, '#5a2620', false, {fine: true}), t);
  if (/headband/.test(lk.acc || '')) drawEll(ctx, cam, ellOf(at(r * .1, 8, 0), side, r * 1.04, up, 3.2, r * 1.02, lk.bandColor || '#f4f4f4', false), t);
}

/* implementos en 3D */
const STEEL = '#c9ced6', IRON = '#2b3038';
function plateDisc(out, c, r, color) { out.push({type: 'disc', c: V.add(c, [0, 0, -3]), r, axis: [0, 0, 1], color: shade(color, -.25)}); out.push({type: 'disc', c, r, axis: [0, 0, 1], color}); out.push({type: 'disc', c: V.add(c, [0, 0, .2]), r: r * .18, axis: [0, 0, 1], color: STEEL}); }
function barbell(out, c, color = '#d64545') { out.push({type: 'cap', a: V.add(c, [0, 0, -100]), b: V.add(c, [0, 0, 100]), r1: 2.6, r2: 2.6, color: STEEL}); for (const s of [1, -1]) { for (const k of [72, 79]) plateDisc(out, V.add(c, [0, 0, s * k]), 44, color); out.push({type: 'cap', a: V.add(c, [0, 0, s * 66]), b: V.add(c, [0, 0, s * 68]), r1: 4, r2: 4, color: STEEL}); } }
function dumbbell(out, c) { out.push({type: 'cap', a: V.add(c, [0, 0, -12]), b: V.add(c, [0, 0, 12]), r1: 2.4, r2: 2.4, color: STEEL}); for (const s of [1, -1]) { plateDisc(out, V.add(c, [0, 0, s * 11]), 14, IRON); plateDisc(out, V.add(c, [0, 0, s * 15]), 12, IRON); } }
function box(out, min, max, color) { out.push({type: 'box', min, max, color}); }
const PROP3 = {
  barhands: (o, J, B) => barbell(o, W3([(J.hN[0] + J.hF[0]) / 2, (J.hN[1] + J.hF[1]) / 2])),
  barback: (o, J) => barbell(o, W3([J.S[0] - 8, J.S[1] + 2]), '#3c7dd9'),
  bench: (o, J) => { box(o, [-150, 52, -22], [20, 66, 22], '#3a3f47'); box(o, [-120, 0, -10], [-110, 52, 10], '#20242a'); box(o, [-10, 0, -10], [0, 52, 10], '#20242a'); for (const s of [1, -1]) box(o, [-160, 0, s * 40 - 4], [-152, 230, s * 40 + 4], '#596270'); barbell(o, W3([(J.hN[0] + J.hF[0]) / 2, (J.hN[1] + J.hF[1]) / 2])); },
  dumbbells: (o, J, B) => { dumbbell(o, W3(J.hN, B.g)); dumbbell(o, W3(J.hF, -B.g)); },
  kbhands: (o, J) => { const m = [(J.hN[0] + J.hF[0]) / 2, (J.hN[1] + J.hF[1]) / 2]; const d = V.norm(V.sub(W3(m), W3(J.S2))); const c = V.add(W3(m), V.mul(d, 24)); o.push({type: 'sph', c, r: 20, color: IRON}); o.push({type: 'cap', a: V.add(W3(m), [0, 0, -8]), b: V.add(W3(m), [0, 0, 8]), r1: 3, r2: 3, color: IRON}); },
  kbchest: (o, J) => { const m = W3([(J.hN[0] + J.hF[0]) / 2, (J.hN[1] + J.hF[1]) / 2]); o.push({type: 'sph', c: V.add(m, [6, -16, 0]), r: 20, color: IRON}); },
  pullbar: (o) => { const y = -A._BAR_Y; o.push({type: 'cap', a: [0, y, -95], b: [0, y, 95], r1: 3.2, r2: 3.2, color: STEEL}); for (const s of [1, -1]) o.push({type: 'cap', a: [0, 0, s * 95], b: [0, y, s * 95], r1: 4.5, r2: 4.5, color: '#596270'}); },
  rings: (o, J, B) => { const y = -A._RING_Y; for (const s of [1, -1]) { o.push({type: 'line', pts: [[J.hN[0], 560, s * B.g], [J.hN[0], y + 13, s * B.g]], w: 3, color: '#d9b26c'}); o.push({type: 'ring', c: [J.hN[0], y, s * B.g], r: 12, color: '#8a6532'}); } },
  mat: (o) => o.push({type: 'quad', pts: [[-220, .5, -55], [180, .5, -55], [180, .5, 55], [-220, .5, 55]], color: '#3a6b52', floor: true}),
  box: (o) => box(o, [20, 0, -55], [130, 112, 55], '#8b5a2b'),
  sled: (o) => { box(o, [96, 0, -40], [216, 26, 40], '#2d3138'); o.push({type: 'cap', a: [104, 26, -26], b: [104, 200, -26], r1: 4, r2: 4, color: STEEL}); o.push({type: 'cap', a: [104, 26, 26], b: [104, 200, 26], r1: 4, r2: 4, color: STEEL}); plateDisc(o, [160, 60, 0], 40, '#d64545'); },
  handles: (o, J, B) => { for (const [h, s] of [[J.hN, 1], [J.hF, -1]]) { const c = W3(h, s * B.g); o.push({type: 'cap', a: V.add(c, [0, -36, 0]), b: V.add(c, [0, 36, 0]), r1: 3.5, r2: 3.5, color: '#596270'}); o.push({type: 'sph', c: V.add(c, [0, -32, 0]), r: 15, color: IRON}); } },
  ropes: (o, J, B, t) => { for (const [h, s, off] of [[J.hN, 1, 0], [J.hF, -1, Math.PI]]) { const pts = []; for (let x = 0; x <= 1.0001; x += .05) { const X = h[0] + (380 - h[0]) * x; const Y = -h[1] + (20 + h[1]) * x + (1 - x) * 30 * Math.sin(t * 12 - x * 12 + off); pts.push([X, Y, s * B.g * (1 - x) + s * 20 * x]); } o.push({type: 'line', pts, w: 7, color: s > 0 ? '#4a8a69' : '#3a6b52'}); } },
  wall: (o) => { o.push({type: 'quad', pts: [[64, 0, -160], [64, 620, -160], [64, 620, 160], [64, 0, 160]], color: '#4a4f5a', back: true}); [[70, 100, 20, '#ffb000'], [72, 60, -20, '#2ec4b6'], [74, 160, 30, '#e94f37'], [70, 330, 22, '#ffb000'], [72, 400, -22, '#2ec4b6'], [74, 430, 25, '#e94f37'], [90, 250, -60, '#8f5bd6'], [80, 300, 80, '#2ec4b6'], [80, 180, -90, '#e94f37']].forEach(([x, y, z, c]) => o.push({type: 'sph', c: [x - 4, y, z], r: 9, color: c})); },
  club: (o, J, B, t, pose) => { const m = W3([(J.hN[0] + J.hF[0]) / 2, (J.hN[1] + J.hF[1]) / 2]); const a = (pose.clubA || 0) + Math.PI / 2; const d = [Math.cos(a) * -1, Math.sin(a), 0]; const e = V.add(m, V.mul(d, 95)); o.push({type: 'cap', a: m, b: e, r1: 4, r2: 7, color: '#6b4a2e'}); o.push({type: 'sph', c: e, r: 17, color: '#3a2a1c'}); },
  sandbag: (o, J, B, t, pose) => { const c = (pose.bag || 0) > .8 ? W3([J.S[0] - 6, J.S[1] - 2]) : W3([(J.hN[0] + J.hF[0]) / 2, (J.hN[1] + J.hF[1]) / 2]); o.push({type: 'cap', a: V.add(c, [0, 0, -34]), b: V.add(c, [0, 0, 34]), r1: 19, r2: 19, color: '#6d6a4a'}); },
  stone: (o, J, B, t, pose) => { box(o, [110, 0, -50], [220, 210, 50], '#3d424b'); const s = pose.st || 0; const m = [(J.hN[0] + J.hF[0]) / 2, (J.hN[1] + J.hF[1]) / 2]; const c = s >= 1 && pose.hN && pose.hN[0] < 50 ? [150, 250, 0] : W3([m[0] - 6, m[1] + 6]); o.push({type: 'sph', c, r: 40, color: '#8d9097'}); },
  medball: (o, J) => o.push({type: 'sph', c: W3([(J.hN[0] + J.hF[0]) / 2, (J.hN[1] + J.hF[1]) / 2 - 8]), r: 24, color: '#2f3540'}),
  nordicpad: (o) => box(o, [-92, 0, -40], [-66, 26, 40], '#3a3f47'),
  breath: () => {}
};

/* cámara y proyección */
function camera(target, az, el, dist, F, cx, cy) {
  const C = [target[0] + Math.sin(az) * Math.cos(el) * dist, target[1] + Math.sin(el) * dist, target[2] + Math.cos(az) * Math.cos(el) * dist];
  const f = V.norm(V.sub(target, C)), r = V.norm(V.cross(f, [0, 1, 0])), u = V.cross(r, f);
  return {C, f, r, u, F, cx, cy, proj(p) { const v = V.sub(p, C); const z = V.dot(v, f); return [cx + V.dot(v, r) * F / z, cy - V.dot(v, u) * F / z, z]; }, depth(p) { return V.dot(V.sub(p, C), f); }, scr(d) { return [V.dot(d, r), -V.dot(d, u)]; }};
}

/* dibujo de primitivas */
function capPath(ctx, cam, p, extra) {
  const a = cam.proj(p.a), b = cam.proj(p.b); if (a[2] < 5 || b[2] < 5) return null;
  const ra = p.r1 * cam.F / a[2] + extra, rb = p.r2 * cam.F / b[2] + extra;
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
  ctx.beginPath();
  if (d < .5) { ctx.arc(a[0], a[1], Math.max(ra, rb), 0, 7); return {a, b, ra, rb, px: 0, py: 1, round: true}; }
  const ux = dx / d, uy = dy / d, px = -uy, py = ux, th = Math.atan2(uy, ux);
  ctx.moveTo(a[0] + px * ra, a[1] + py * ra); ctx.lineTo(b[0] + px * rb, b[1] + py * rb);
  ctx.arc(b[0], b[1], rb, th + Math.PI / 2, th - Math.PI / 2, true); ctx.lineTo(a[0] - px * ra, a[1] - py * ra);
  ctx.arc(a[0], a[1], ra, th - Math.PI / 2, th + Math.PI / 2, true); ctx.closePath();
  return {a, b, ra, rb, px, py};
}
function drawCap(ctx, cam, p, t) {
  let col = p.color; if (p.hl) col = mixHex(col, HLC, .55 + .25 * Math.sin(t * 5));
  ctx.save(); if (p.hl) { ctx.shadowColor = 'rgba(255,59,92,.75)'; ctx.shadowBlur = 18; }
  const g0 = capPath(ctx, cam, p, 0); if (!g0) { ctx.restore(); return; }
  const {a, b, ra, rb, px, py} = g0;
  if (g0.round) { ctx.fillStyle = sphereGrad(ctx, cam, a[0], a[1], Math.max(ra, rb), col); ctx.fill(); ctx.restore(); return; }
  const axis = V.norm(V.sub(p.b, p.a)); let n = V.sub(LIGHT, V.mul(axis, V.dot(LIGHT, axis))); const nl = V.len(n); n = V.norm(n);
  const ns = cam.scr(n); const side = (ns[0] * px + ns[1] * py) >= 0 ? 1 : -1; const rm = Math.max(ra, rb);
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const gr = ctx.createLinearGradient(mx - px * rm * side, my - py * rm * side, mx + px * rm * side, my + py * rm * side);
  gr.addColorStop(0, shade(col, -.34)); gr.addColorStop(.4, shade(col, -.05)); gr.addColorStop(.78, shade(col, .1 + nl * .16)); gr.addColorStop(1, shade(col, .02));
  ctx.fillStyle = gr; ctx.fill(); ctx.restore();
}
function drawRim(ctx, cam, p, px, col) {
  if (p.type === 'ell') { if (p.fine) return; const e = ellScreen(cam, p, px); if (!e) return; ctx.save(); ctx.fillStyle = col; ctx.translate(e.x, e.y); ctx.rotate(e.th); ctx.beginPath(); ctx.ellipse(0, 0, e.r1, e.r2, 0, 0, 7); ctx.fill(); ctx.restore(); return; }
  if (p.type === 'hhead') { const c = cam.proj(p.c); if (c[2] < 5) return; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(c[0], c[1], p.r * 1.08 * cam.F / c[2] + px, 0, 7); ctx.fill(); return; }
  if (p.type === 'cap') { if (capPath(ctx, cam, p, px)) { ctx.fillStyle = col; ctx.fill(); } }
  else if (p.type === 'sph' || p.type === 'head') { const c = cam.proj(p.c); if (c[2] < 5) return; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(c[0], c[1], p.r * cam.F / c[2] + px, 0, 7); ctx.fill(); }
}
function sphereGrad(ctx, cam, x, y, r, col) { const ls = cam.scr(LIGHT); const l = Math.hypot(ls[0], ls[1]) || 1; const gx = x + ls[0] / l * r * .38, gy = y + ls[1] / l * r * .38; const gr = ctx.createRadialGradient(gx, gy, r * .08, x, y, r * 1.02); gr.addColorStop(0, shade(col, .3)); gr.addColorStop(.5, col); gr.addColorStop(1, shade(col, -.45)); return gr; }
function drawSph(ctx, cam, p, t) {
  const c = cam.proj(p.c); if (c[2] < 5) return; const r = p.r * cam.F / c[2];
  let col = p.color; if (p.hl) col = mixHex(col, HLC, .55 + .25 * Math.sin(t * 5));
  ctx.save(); if (p.hl) { ctx.shadowColor = 'rgba(255,59,92,.75)'; ctx.shadowBlur = 18; }
  ctx.fillStyle = sphereGrad(ctx, cam, c[0], c[1], r, col); ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, 7); ctx.fill(); ctx.restore();
}
function circlePts(c, r, axis, n = 28) { const a = V.norm(axis); const t1 = V.norm(Math.abs(a[1]) < .9 ? V.cross(a, [0, 1, 0]) : V.cross(a, [1, 0, 0])), t2 = V.cross(a, t1); const out = []; for (let i = 0; i < n; i++) { const th = i / n * Math.PI * 2; out.push(V.add(c, V.add(V.mul(t1, Math.cos(th) * r), V.mul(t2, Math.sin(th) * r)))); } return out; }
function drawDisc(ctx, cam, p) { const pts = circlePts(p.c, p.r, p.axis).map(q => cam.proj(q)); if (pts.some(q => q[2] < 5)) return; const k = .62 + .38 * Math.abs(V.dot(V.norm(p.axis), LIGHT)); ctx.fillStyle = shade(p.color, k - 1); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.stroke(); }
function drawRing(ctx, cam, p) { const pts = circlePts(p.c, p.r, [0, 0, 1]).map(q => cam.proj(q)); ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(2, 5 * cam.F / pts[0][2]); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke(); }
function drawLine(ctx, cam, p) { const pts = p.pts.map(q => cam.proj(q)); if (pts.some(q => q[2] < 5)) return; ctx.strokeStyle = p.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, p.w * cam.F / pts[0][2]); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); }
function drawQuad(ctx, cam, p) { const pts = p.pts.map(q => cam.proj(q)); if (pts.some(q => q[2] < 5)) return; const n = V.norm(V.cross(V.sub(p.pts[1], p.pts[0]), V.sub(p.pts[2], p.pts[0]))); const k = .7 + .3 * Math.abs(V.dot(n, LIGHT)); ctx.fillStyle = shade(p.color, k - 1); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); }
function drawBox(ctx, cam, p) {
  const [x0, y0, z0] = p.min, [x1, y1, z1] = p.max;
  const faces = [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]]];
  faces.map(f => ({f, d: cam.depth(V.mul(f.slice(0, 4).reduce((s, q) => V.add(s, q), [0, 0, 0]), .25))})).sort((a, b) => b.d - a.d).forEach(({f}) => {
    const n = f[4], c = V.mul(f.slice(0, 4).reduce((s, q) => V.add(s, q), [0, 0, 0]), .25); if (V.dot(n, V.sub(cam.C, c)) <= 0) return;
    const pts = f.slice(0, 4).map(q => cam.proj(q)); const k = .55 + .45 * Math.max(0, V.dot(n, LIGHT));
    ctx.fillStyle = shade(p.color, k - 1); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill();
  });
}
function drawHead(ctx, cam, p, t) {
  const {c, r, face, up, lk} = p;
  const side = V.norm(V.cross(face, up)); // eje lateral de la cara
  const at = (fw, u, s) => V.add(c, V.add(V.add(V.mul(face, fw), V.mul(up, u)), V.mul(side, s)));
  if (['ponytail', 'fade', 'short', 'long', 'curly', 'bun'].includes(lk.hair)) { if (lk.hair === 'ponytail') drawCap(ctx, cam, {a: at(-14, 10, 0), b: at(-32, -18, 0), r1: 8, r2: 4, color: lk.hairColor}, t); drawSph(ctx, cam, {c: at(-4, lk.hair === 'fade' ? 3 : 5, 0), r: r * (lk.hair === 'fade' ? 1.0 : 1.06), color: lk.hairColor}, t); }
  drawSph(ctx, cam, {c, r, color: p.color}, t);
  if (['ponytail', 'short', 'long', 'curly', 'bun', 'fade'].includes(lk.hair)) { const hp = cam.proj(at(2, r * .62, 0)); if (hp[2] > 5) { ctx.save(); ctx.beginPath(); const hc0 = cam.proj(c); ctx.arc(hc0[0], hc0[1], r * cam.F / hc0[2], 0, 7); ctx.clip(); const hr = r * cam.F / hc0[2]; ctx.fillStyle = lk.hairColor; ctx.beginPath(); ctx.ellipse(hp[0], hp[1] - hr * .18, hr * .95, hr * .52, 0, 0, 7); ctx.fill(); ctx.restore(); } }
  const facing = V.dot(face, V.mul(cam.f, -1)) > -.2; // la cara mira hacia la cámara
  const parts = [];
  if (/headband/.test(lk.acc || '')) parts.push({type: 'cap', a: at(16, 9, -17), b: at(16, 9, 17), r1: 4.5, r2: 4.5, color: lk.bandColor || '#f4f4f4'});
  if (facing) {
    if (/visor/.test(lk.acc || '')) { parts.push({type: 'cap', a: at(r * .78, 3, -13), b: at(r * .78, 3, 13), r1: 6.5, r2: 6.5, color: '#0f1216'}); const tk = p.talk || 0; parts.push({type: 'cap', a: at(r * .78 + 5.5, 3, -9), b: at(r * .78 + 5.5, 3, 9), r1: 2.2 + tk * 1.2, r2: 2.2 + tk * 1.2, color: lk.visorColor || '#d7ff3a', glow: true}); }
    else { for (const s of [-1, 1]) parts.push({type: 'sph', c: at(r * .9, 4, s * 8), r: 3, color: '#141414'}); parts.push({type: 'cap', a: at(r * .92, -9, -5), b: at(r * .92, -9, 5), r1: 1.6 + (p.talk || 0) * 2.4, r2: 1.6 + (p.talk || 0) * 2.4, color: '#5a2620'}); }
  }
  parts.map(q => ({q, d: cam.depth(q.c || V.lerp(q.a, q.b, .5))})).sort((a, b) => b.d - a.d).forEach(({q}) => { if (q.glow) { ctx.save(); ctx.shadowColor = q.color; ctx.shadowBlur = 14; } q.type === 'sph' ? drawSph(ctx, cam, q, t) : drawCap(ctx, cam, q, t); if (q.glow) ctx.restore(); });
}

/* encuadre estable por movimiento */
const bboxCache = new Map();
function bboxFor(ch, move) {
  const key = ch.id + ':' + move.id; if (bboxCache.has(key)) return bboxCache.get(key);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < 16; i++) { const {pose} = A.poseAt(move.id, move.dur * i / 16); const J = joints(pose); for (const p of [J.P, J.S, J.hN, J.hF, J.kn, J.kf, J.fN, J.fF, J.hc, J.en, J.ef]) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, -p[1]); y1 = Math.max(y1, -p[1]); } }
  y1 += 30; y0 = Math.min(0, y0); if (['pullup', 'hang'].includes(move.id)) y1 = Math.max(y1, -A._BAR_Y + 20); if (move.id === 'climb') y1 = Math.max(y1, 470);
  const b = {cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0 + 60, h: y1 - y0 + 40}; bboxCache.set(key, b); return b;
}

/* fondos de estudio 3D */
function backdrop(ctx, W, H, theme, t) {
  let g = ctx.createLinearGradient(0, 0, 0, H);
  if (theme === 'gymdark') {
    g.addColorStop(0, '#1d2228'); g.addColorStop(.62, '#12161a'); g.addColorStop(1, '#0b0e11'); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
    ctx.save(); for (let i = 0; i < 3; i++) { const x = W * (.2 + i * .3); const gl = ctx.createRadialGradient(x, H * .02, 2, x, H * .02, W * .28); gl.addColorStop(0, 'rgba(255,255,255,.22)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(x - W * .3, 0, W * .6, H * .4); ctx.fillStyle = 'rgba(235,240,245,.85)'; A.rr(ctx, x - W * .07, H * .015, W * .14, H * .008, 4); ctx.fill(); }
    ctx.fillStyle = '#0d1013'; ctx.fillRect(W * .02, H * .28, W * .03, H * .36); ctx.fillRect(W * .16, H * .28, W * .03, H * .36); ctx.fillRect(W * .02, H * .28, W * .17, H * .02); ctx.fillStyle = '#161b20'; A.rr(ctx, W * .07, H * .42, W * .07, H * .1, 6); ctx.fill();
    ctx.fillStyle = '#0d1013'; ctx.fillRect(W * .8, H * .44, W * .18, H * .02); ctx.fillRect(W * .8, H * .52, W * .18, H * .02); for (let i = 0; i < 4; i++) for (const y of [.43, .51]) { ctx.beginPath(); ctx.arc(W * (.83 + i * .04), H * y, W * .014, 0, 7); ctx.fill(); }
    ctx.restore();
  } else if (theme === 'blueprint') {
    g.addColorStop(0, '#dcecf8'); g.addColorStop(1, '#bcd6ea'); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
    ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = Math.max(1, W * .0015); const st = Math.min(W, H) * .05; ctx.beginPath(); for (let x = 0; x <= W; x += st) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = 0; y <= H; y += st) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
  } else if (theme === 'rays') {
    ctx.fillStyle = '#f7f7f8'; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.save(); ctx.translate(W * .62, H * .4); ctx.rotate(t * .02); ctx.fillStyle = 'rgba(0,0,0,.035)'; for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.max(W, H) * 1.2, -Math.max(W, H) * .09); ctx.lineTo(Math.max(W, H) * 1.2, Math.max(W, H) * .09); ctx.closePath(); ctx.fill(); } ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let x = W * .78; x < W; x += W * .02) for (let y = H * .05; y < H * .3; y += W * .02) { ctx.beginPath(); ctx.arc(x, y, W * .003, 0, 7); ctx.fill(); }
  } else if (theme === 'dark') { g.addColorStop(0, '#2f4253'); g.addColorStop(1, '#16212b'); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3); }
  else { g.addColorStop(0, '#f6f7f9'); g.addColorStop(1, '#d4d9df'); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3); }
}
const GRID_COL = {gymdark: 'rgba(120,140,160,.12)', blueprint: 'rgba(255,255,255,.7)', rays: 'rgba(0,0,0,.05)', dark: 'rgba(150,185,215,.22)', light: 'rgba(110,122,140,.28)'};
const RIM = {gymdark: 'rgba(190,225,255,.55)', blueprint: 'rgba(255,255,255,.95)', rays: 'rgba(120,190,255,.6)', dark: 'rgba(190,225,255,.5)', light: 'rgba(140,200,255,.55)'};
/* gestos de frente para hablar a cámara (manos se abren hacia los lados) */
const FRONT_HANDS = {talk: (s, t) => s * (40 + 18 * Math.abs(Math.sin(t * 3 + (s > 0 ? 0 : 1.3)))), present: s => s > 0 ? 82 : 40, shrug: s => s * 76, point: s => s > 0 ? 56 : 38, think: s => s > 0 ? 8 : 26, celebrate: s => s * 64, worried: s => s * 14, facepalm: s => s > 0 ? 10 : 36, count: s => s * 14, idle: s => s * 40, walk: s => s * 40};

/* escena 3D completa
   o: {char, char2, move, act, t, highlight, muscles, theme, view, closeup, variant, tint, variant2, tint2, talk, shiftX, cyFrac, fitH} */
Art3D.draw = (ctx, W, H, o) => {
  if (A.isImage(o.char)) o = {...o, char: A.bodyDouble(o.char)};
  if (o.char2 && A.isImage(o.char2)) o = {...o, char2: A.bodyDouble(o.char2)};
  const ch = o.char, t = o.t || 0, theme = o.theme || 'light', vertical = H > W;
  const isMove = o.move && A.MOVES[o.move];
  const move = isMove ? A.MOVES[o.move] : A.MOVES[o.act || 'talk'] || A.MOVES.talk;
  const {pose} = A.poseAt(move.id, t, o.speed || 1);
  const hlSet = o.highlight ? new Set(o.muscles && o.muscles.length ? o.muscles : (move.muscles || [])) : null;
  backdrop(ctx, W, H, theme, t);
  const front = !isMove || o.view === 'frente';
  const handZ = !isMove && FRONT_HANDS[move.id] ? s => FRONT_HANDS[move.id](s, t) : null;
  const pair = !!o.char2;
  // encuadre
  let bb, F, target, az, el; const dist = 1200;
  if (!isMove || o.closeup) {
    const span = pair ? 1.25 : 1; const hWorld = o.closeup === 'full' ? 380 : 250;
    target = [0, o.closeup === 'full' ? 190 : 262, 0];
    F = dist * Math.min((o.fitH || (vertical ? .62 : .82)) * H / hWorld, .9 * W / (pair ? 420 : 200));
    az = (o.view === 'espalda' ? -90 : o.view === 'perfil' ? 0 : o.view === 'tres_cuartos' ? 45 : 90) * D2R + Math.sin(t * .4) * 4 * D2R; el = (6 + Math.sin(t * .3) * 1.5) * D2R;
  } else {
    bb = bboxFor(ch, move);
    F = dist * Math.min((o.fitH || (vertical ? .55 : .7)) * H / bb.h, .86 * W / Math.max(bb.w, 200));
    target = [bb.cx, bb.cy, 0];
    const base = o.view === 'frente' ? 90 : o.view === 'perfil' ? 0 : o.view === 'espalda' ? -120 : o.view === 'tres_cuartos' ? 40 : ({climb: -130, hang: 50, pullup: 50}[move.id] ?? 34);
    az = base * D2R + (o.view && o.view !== 'orbita' ? Math.sin(t * .35) * 5 * D2R : Math.sin(t * .35) * 16 * D2R); el = (11 + Math.sin(t * .27) * 3) * D2R;
  }
  const cam = camera(target, az, el, dist, F, W * (o.shiftX || .5), H * (o.cyFrac || (!isMove ? (vertical ? .6 : .56) : (vertical ? .58 : .6))));
  // suelo
  ctx.save(); ctx.strokeStyle = GRID_COL[theme] || GRID_COL.light; ctx.lineWidth = Math.max(1, W * .0016);
  for (let k = -600; k <= 600; k += 50) for (const [a, b] of [[[k, 0, -600], [k, 0, 600]], [[-600, 0, k], [600, 0, k]]]) { const pa = cam.proj(a), pb = cam.proj(b); if (pa[2] < 20 || pb[2] < 20) continue; ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke(); }
  ctx.restore();
  // personajes e implementos
  const prims = []; const bodies = [];
  const addBody = (c, variant, tint, z) => { const B = buildHuman(c, pose, isMove ? move : null, t, hlSet, {variant, tint, handZ, talk: o.talk || 0, offset: [0, 0, z]}); prims.push(...B.prims); bodies.push(B); return B; };
  const B1 = addBody(ch, o.variant, o.tint, pair ? 120 : 0);
  if (pair) addBody(o.char2, o.variant2, o.tint2, -120);
  const pr = isMove ? PROP3[o.prop || move.prop] : null; if (pr) pr(prims, B1.J, B1, t, pose);
  // sombra
  for (const B of bodies) { const z0 = B.prims[0] ? 0 : 0; const pc = [(B.J.P[0] + B.J.fN[0]) / 2, .3, 0]; const zc = B === bodies[1] ? -120 : (pair ? 120 : 0); const sp = circlePts(pc, 1, [0, 1, 0], 24).map(q => cam.proj([pc[0] + (q[0] - pc[0]) * 85, .3, zc + q[2] * 60])); ctx.save(); ctx.filter = 'blur(' + Math.round(W * .008) + 'px)'; ctx.fillStyle = 'rgba(0,0,0,' + (theme === 'gymdark' || theme === 'dark' ? .4 : .2) + ')'; ctx.beginPath(); sp.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); ctx.restore(); }
  const centerOf = p => p.type === 'cap' ? V.lerp(p.a, p.b, .5) : p.type === 'box' ? V.lerp(p.min, p.max, .5) : p.type === 'line' ? p.pts[Math.floor(p.pts.length / 2)] : p.type === 'quad' ? V.mul(p.pts.reduce((s, q) => V.add(s, q), [0, 0, 0]), .25) : p.c;
  const sorted = prims.map(p => ({p, d: p.floor ? 1e9 : p.back ? 1e8 : cam.depth(centerOf(p)) + (p.type === 'head' || p.type === 'hhead' ? -2 : 0) + (p.fine ? -3 : 0)})).sort((a, b) => b.d - a.d);
  // contorno luminoso (rim light) de la silueta
  const rimPx = Math.max(2, Math.min(W, H) * .0045), rimCol = RIM[theme] || RIM.light;
  ctx.save(); ctx.shadowColor = rimCol; ctx.shadowBlur = rimPx * 3; for (const {p} of sorted) if (p.body) drawRim(ctx, cam, p, rimPx, rimCol); ctx.restore();
  for (const {p} of sorted) {
    switch (p.type) { case 'cap': drawCap(ctx, cam, p, t); break; case 'sph': drawSph(ctx, cam, p, t); break; case 'disc': drawDisc(ctx, cam, p); break; case 'ring': drawRing(ctx, cam, p); break; case 'line': drawLine(ctx, cam, p); break; case 'quad': drawQuad(ctx, cam, p); break; case 'box': drawBox(ctx, cam, p); break; case 'head': drawHead(ctx, cam, p, t); break; case 'ell': drawEll(ctx, cam, p, t); break; case 'hhead': drawHumanHead(ctx, cam, p, t); break; }
  }
  return cam;
};
/* mode 'talk': una imagen subida habla en 2D (se ve tal cual); en ejercicios usa su doble 3D */
Art3D.supports = (ch, mode) => !App.NO3D && !!ch && !/stick/.test((ch.look || {}).style || '') && !(mode === 'talk' && A.isImage(ch));
Art3D.themeFor = bg => ({gym_oscuro: 'gymdark', gimnasio: 'gymdark', plano_azul: 'blueprint', rayos: 'rays', cuadricula_osc: 'dark', ciudad: 'dark', muro: 'dark', negocio: 'dark'})[bg] || 'light';
})();
