'use strict';
/* ============ Motor: línea de tiempo, dibujo de cuadros, audio sintetizado, render a video, miniaturas y logos ============ */
const Engine = App.Engine = {};
(() => {
const A = App.Art, rr = A.rr;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const lerp = (a, b, t) => a + (b - a) * t;
const TR = .4;
Engine.FORMATS = {vertical: {W: 1080, H: 1920, label: 'Vertical 9:16 (1080×1920)'}, horizontal: {W: 1920, H: 1080, label: 'Horizontal 16:9 (1920×1080)'}};
Engine.CAMERAS = {static: 'Suave', zoom_in: 'Acercamiento', zoom_out: 'Alejamiento', pan_left: 'Paneo izquierda', pan_right: 'Paneo derecha', push_speaker: 'Enfoque al que habla', shake: 'Impacto'};
Engine.TRANSITIONS = {cut: 'Corte', fade: 'Fundido', slide: 'Deslizar', zoom: 'Zoom', wipe: 'Barrido'};
Engine.MUSIC = {upbeat: 'Animada', lofi: 'Lo-fi tranquila', tension: 'Tensión / misterio', motivacion: 'Motivación (gym)', none: 'Sin música'};

/* ---------- línea de tiempo ---------- */
Engine.build = (project, charLib, opts = {}) => {
  const fmt = Engine.FORMATS[project.format || 'vertical'] || Engine.FORMATS.vertical;
  const W = opts.W || fmt.W, H = opts.H || fmt.H, vertical = H > W;
  const scenes = []; let t = 0;
  const sb = (project.storyboard && project.storyboard.scenes) || [];
  let scale = 1;
  if (opts.fitTo && sb.length) { const tot = sb.reduce((a, s) => a + (+s.dur || 3), 0); scale = opts.fitTo / tot; }
  sb.forEach((s, i) => {
    const dur = Math.max(1.2, (+s.dur || 3) * scale);
    const sc = {...s, i, start: t, end: t + dur, dur};
    sc.words = wordTimes(sc.dialogue || '', t + .15, t + dur - .2);
    sc.chunks = chunk(sc.words, vertical ? 4 : 7);
    scenes.push(sc); t += dur;
  });
  const chars = {}; (charLib || []).forEach(c => chars[c.id] = c);
  return {W, H, vertical, scenes, duration: t, chars, brand: project.brand || {}, music: project.music || 'upbeat', module: project.module || 'fin',
    motion: project.motion || 'alto', subs: project.subs !== false, render3d: project.render3d !== false && project.gymStyle !== 'plano', gymStyle: project.gymStyle || 'estudio3d', captionStyle: project.module === 'gym' && (project.gymStyle || 'estudio3d') === 'estudio3d' ? 'clean' : 'box', progress: project.progressBar !== false, handle: project.handle || '', accent: project.module === 'gym' ? '#ff7a45' : '#2ee59d'};
};
function wordTimes(text, a, b) {
  const words = String(text).trim().split(/\s+/).filter(Boolean); if (!words.length) return [];
  const w = words.map(x => x.replace(/[^\wáéíóúñü]/gi, '').length + 2), tot = w.reduce((x, y) => x + y, 0);
  let t = a; const span = Math.max(.5, b - a);
  return words.map((x, i) => { const d = span * w[i] / tot; const o = {w: x, s: t, e: t + d}; t += d; return o; });
}
function chunk(words, n) { const out = []; for (let i = 0; i < words.length; i += n) { const g = words.slice(i, i + n); out.push({words: g, s: g[0].s, e: g[g.length - 1].e}); } return out; }
Engine.estimateDur = text => Math.max(1.6, String(text || '').trim().split(/\s+/).filter(Boolean).length / 2.6 + .6);

/* ---------- geometría de escena ---------- */
function layout(tl) {
  const {W, H, vertical} = tl;
  return vertical ? {gy: H * .79, charH: H * .35, cap: H * .13, objY: H * .32, objX: [W * .2, W * .5, W * .8], objS: W * .26, sub: H * .875, pos: {izq: .27, centro: .5, der: .73}}
    : {gy: H * .87, charH: H * .55, cap: H * .12, objY: H * .4, objX: [W * .72, W * .86, W * .79], objS: H * .26, sub: H * .955, pos: {izq: .2, centro: .36, der: .53}};
}
function camera(sc, u, lt, tl, Lo, speakerX) {
  const {W, H} = tl; let s = 1, tx = 0, ty = 0; const e = ease(Math.min(1, u));
  switch (sc.camera) {
    case 'zoom_in': s = 1 + .14 * e; break;
    case 'zoom_out': s = 1.14 - .14 * e; break;
    case 'pan_left': s = 1.08; tx = W * .045 * (1 - 2 * u); break;
    case 'pan_right': s = 1.08; tx = -W * .045 * (1 - 2 * u); break;
    case 'push_speaker': { const k = ease(Math.min(1, u * 1.5)); s = 1 + .2 * k; tx = (W / 2 - (speakerX ?? W / 2)) * .5 * k; break; }
    case 'shake': s = 1.05; if (lt < .5) { const a = (1 - lt / .5) * W * .012; tx = Math.sin(lt * 90) * a; ty = Math.cos(lt * 70) * a; } break;
    default: s = 1 + .03 * u;
  }
  return {s, tx, ty, cx: W / 2, cy: Lo.gy - H * .2};
}
function charScale(tl, Lo) { return Lo.charH / 340; }

/* dibuja una escena (sin subtítulos) */
function drawScene(ctx, tl, sc, time, prevIds) {
  const {W, H} = tl, Lo = layout(tl);
  const lt = time - sc.start, u = Math.max(0, Math.min(1, lt / sc.dur));
  const list = (sc.chars || []).filter(c => tl.chars[c.id]);
  const n = list.length;
  const ovSide = sc.overlay && sc.overlay.type && !tl.vertical;
  const xs0 = list.map((c, i) => { const p = c.pos; if (typeof p === 'number') return p; if (Lo.pos[p] != null) return Lo.pos[p]; return n === 1 ? Lo.pos.centro : n === 2 ? (i ? Lo.pos.der : Lo.pos.izq) : [Lo.pos.izq, Lo.pos.centro, Lo.pos.der][i] ?? .5; });
  const xs = ovSide ? xs0.map(x => .6 + x * .32) : xs0;
  const gymMove = list.some(c => c.move && A.MOVES[c.move]);
  const speakerIdx = list.findIndex(c => c.id === sc.speaker);
  const speakerX = speakerIdx >= 0 ? xs[speakerIdx] * W : null;
  const cam = camera(sc, u, lt, tl, Lo, speakerX);
  ctx.save();
  ctx.translate(cam.cx + cam.tx, cam.cy + cam.ty); ctx.scale(cam.s, cam.s); ctx.translate(-cam.cx, -cam.cy);
  const A3 = App.Art3D;
  const demo3d = tl.render3d && A3 && n === 1 && list[0].move && A.MOVES[list[0].move] && A3.supports(tl.chars[list[0].id]);
  const talk3d = !demo3d && tl.render3d && tl.gymStyle === 'estudio3d' && A3 && n >= 1 && n <= 2 && list.every(c => !c.move && A3.supports(tl.chars[c.id], 'talk'));
  const use3d = demo3d || talk3d;
  if (use3d) {
    const ov = sc.overlay && sc.overlay.type, c0 = list[0], c1 = list[1];
    let talkAmp = 0; if (talk3d && (sc.speaker === c0.id || (c1 && sc.speaker === c1.id))) { const w = sc.words.find(w => time >= w.s && time <= w.e); if (w) talkAmp = .4 + .6 * Math.abs(Math.sin((time - w.s) * 15)); }
    A3.draw(ctx, W, H, {char: tl.chars[c0.id], char2: talk3d && c1 ? tl.chars[c1.id] : null, move: demo3d ? c0.move : null, act: talk3d ? (c0.act || 'talk') : null, t: Math.max(0, lt) + sc.i * 1.3, talk: talkAmp,
      highlight: !!sc.highlight, muscles: c0.muscles, theme: A3.themeFor(sc.bg), speed: c0.speed || 1, view: sc.view, variant: c0.variant, tint: c0.tint, variant2: c1 && c1.variant, tint2: c1 && c1.tint,
      shiftX: ov && !tl.vertical ? .72 : .5, cyFrac: ov && tl.vertical ? (talk3d ? .8 : .78) : undefined, fitH: ov && tl.vertical ? (talk3d ? .5 : .4) : (ov && !tl.vertical ? (talk3d ? .72 : .6) : undefined)});
  }
  else { const bgf = A.BG[sc.bg] || A.BG[tl.module === 'gym' ? 'gimnasio' : 'oficina']; bgf(ctx, W, H, Lo.gy, time); }
  // locomoción
  const loco = list.map(c => c.move && A.MOVES[c.move] && A.MOVES[c.move].loco).find(Boolean);
  if (loco && !use3d) A.groundMotion(ctx, W, H, Lo.gy, time, loco);
  // objetos (detrás de personajes en horizontal, arriba en vertical)
  const objs = sc.overlay && sc.overlay.type ? [] : (sc.objects || []).filter(k => A.OBJ[k]).slice(0, 3);
  objs.forEach((k, i) => {
    const delay = .35 + i * .3; const ot = lt - delay; if (ot < 0) return;
    const cnt = objs.length; const ox = tl.vertical ? (cnt === 1 ? W * .5 : cnt === 2 ? [W * .3, W * .7][i] : Lo.objX[i]) : (cnt === 1 ? W * .78 : Lo.objX[i]);
    const oy = tl.vertical ? Lo.objY + (i % 2) * H * .02 : (cnt === 1 ? Lo.objY : H * (.28 + i * .2));
    ctx.save(); ctx.globalAlpha = .25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(ox, oy + Lo.objS * .55, Lo.objS * .32, Lo.objS * .05, 0, 0, 7); ctx.fill(); ctx.restore();
    A.drawObject(ctx, k, ox, oy, Lo.objS * (cnt > 2 ? .85 : 1), ot);
  });
  // personajes
  if (!use3d) list.forEach((c, i) => {
    const ch = tl.chars[c.id]; const isMove = c.move && A.MOVES[c.move];
    let act = isMove ? c.move : (c.act || (c.id === sc.speaker ? 'talk' : 'idle'));
    let x = xs[i] * W;
    const facing = c.facing || (n > 1 ? (xs[i] < .5 ? 1 : -1) : (isMove ? 1 : 1));
    // entrada caminando si no estaba en la escena anterior
    let alpha = 1;
    if (!isMove && prevIds && !prevIds.has(c.id) && lt < .55) { const k = ease(lt / .55); const from = xs[i] < .5 ? -W * .25 : W * 1.25; x = lerp(from, x, k); act = 'walk'; }
    const speed = isMove ? (c.speed || 1) : 1;
    const {pose, move} = A.poseAt(act, Math.max(0, lt) + i * .37, speed);
    let talk = 0;
    if (c.id === sc.speaker && !isMove && tl.talkOn !== false) {
      const w = sc.words.find(w => time >= w.s && time <= w.e);
      if (w) talk = .35 + .65 * Math.abs(Math.sin((time - w.s) * 15));
    }
    const talkCam = tl.module === 'gym' && n === 1 && !isMove;
    const sScale = charScale(tl, Lo) * (talkCam ? (tl.vertical ? 1.5 : 1.3) : 1) * (isMove && n === 1 ? (tl.vertical ? (['pushup', 'plank', 'crawl', 'bench', 'nordic'].includes(c.move) ? 1.12 : 1.4) : 1.1) : 1) * (c.scale || 1);
    const wide = ['pushup', 'plank', 'crawl', 'bench', 'nordic'].includes(c.move); const cx = isMove && n === 1 ? W * (tl.vertical ? (wide ? .53 : .44) : (wide ? .5 : .38)) : x;
    A.drawCharacter(ctx, ch, {x: talkCam ? W / 2 : cx, y: talkCam ? Lo.gy + Lo.charH * .42 : Lo.gy, noShadow: talkCam, scale: sScale, facing, pose, expr: c.expr || (c.id === sc.speaker ? 'happy' : 'neutral'), t: time, talk, alpha, seed: i * 1.7, act, exercise: !!isMove,
      prop: A.PROPS[c.prop || (move && move.prop)], highlight: sc.highlight ? (c.muscles || (move && move.muscles) || []) : []});
  });
  ctx.restore();
}

/* texto en pantalla (caption) */
function wrapText(ctx, text, maxW) {
  const words = String(text).split(/\s+/); const lines = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line); return lines;
}
Engine.wrapText = wrapText;
function drawCaption(ctx, tl, sc, time) {
  if (!sc.text) return; const {W, H} = tl, Lo = layout(tl); const lt = time - sc.start - .12; if (lt < 0) return;
  const k = Math.min(1, lt / .28); const sc2 = .7 + .3 * (1 - Math.pow(1 - k, 3)) + (k >= 1 ? 0 : .06 * Math.sin(k * Math.PI));
  const fs = tl.vertical ? W * .078 : H * .085;
  ctx.save(); ctx.font = `900 ${fs}px Archivo, "Inter Tight", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = wrapText(ctx, String(sc.text).toUpperCase(), W * (tl.vertical ? .82 : .62)).slice(0, 3);
  const lh = fs * 1.08, bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + fs * .9, bh = lines.length * lh + fs * .5;
  const cx = tl.vertical ? W / 2 : (sc.overlay && sc.overlay.type ? W * .3 : W * .36), cy = Lo.cap + bh / 2 - fs * .2;
  ctx.translate(cx, cy); ctx.scale(sc2, sc2); ctx.globalAlpha = k; ctx.rotate(-.02);
  if (tl.captionStyle === 'clean') { ctx.lineJoin = 'round'; lines.forEach((l, i) => { const y = -bh / 2 + fs * .25 + lh * (i + .5); ctx.lineWidth = fs * .2; ctx.strokeStyle = '#111'; ctx.strokeText(l, 0, y); ctx.fillStyle = i === lines.length - 1 ? tl.accent : '#ffffff'; ctx.fillText(l, 0, y); }); ctx.restore(); return; }
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, -bw / 2 + 10, -bh / 2 + 14, bw, bh, fs * .25); ctx.fill();
  ctx.fillStyle = '#0d1411'; rr(ctx, -bw / 2, -bh / 2, bw, bh, fs * .25); ctx.fill();
  ctx.fillStyle = tl.accent; rr(ctx, -bw / 2, -bh / 2, fs * .22, bh, [fs * .25, 0, 0, fs * .25]); ctx.fill();
  lines.forEach((l, i) => { ctx.fillStyle = i === lines.length - 1 ? tl.accent : '#ffffff'; ctx.fillText(l, fs * .08, -bh / 2 + fs * .25 + lh * (i + .5)); });
  ctx.restore();
}
function drawSubs(ctx, tl, sc, time) {
  if (!tl.subs || !sc.chunks.length) return; const {W, H} = tl, Lo = layout(tl);
  const ch = sc.chunks.find(c => time >= c.s - .05 && time <= c.e + .15) || (time > sc.chunks[sc.chunks.length - 1].e && time < sc.end ? sc.chunks[sc.chunks.length - 1] : null);
  if (!ch) return;
  const fs = tl.vertical ? W * .062 : H * .058;
  ctx.save(); ctx.font = `900 ${fs}px Archivo, "Inter Tight", sans-serif`; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const words = ch.words.map(w => ({...w, t: w.w.toUpperCase()}));
  const space = ctx.measureText(' ').width; const maxW = W * .86;
  const lines = []; let cur = [], cw = 0;
  for (const w of words) { const ww = ctx.measureText(w.t).width; if (cw + ww > maxW && cur.length) { lines.push({ws: cur, w: cw - space}); cur = []; cw = 0; } cur.push({...w, ww}); cw += ww + space; }
  if (cur.length) lines.push({ws: cur, w: cw - space});
  lines.forEach((ln, li) => {
    let x = W / 2 - ln.w / 2; const y = Lo.sub - (lines.length - 1 - li) * fs * 1.12;
    ln.ws.forEach(w => {
      const on = time >= w.s && time <= w.e + .05;
      ctx.lineWidth = fs * .2; ctx.strokeStyle = '#000'; ctx.strokeText(w.t, x, y);
      ctx.fillStyle = on ? tl.accent : '#fff'; ctx.fillText(w.t, x, y);
      x += w.ww + space;
    });
  });
  ctx.restore();
}


/* ---------- gráficos superpuestos: tier list, pizarra, checklist, gráfico circular, ERROR, comparación, emojis ---------- */
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif';
const backOut = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const TIER_COL = {S: '#ff5c5c', A: '#ffb86b', B: '#ffe36b', C: '#7ee08a', D: '#8fb6ff'};
function overlayTimes(ov) { const n = (ov.items || []).length; const base = ov.type === 'board' ? .7 : ov.type === 'error' ? .3 : ov.type === 'versus' ? .4 : .5; const step = ov.type === 'board' || ov.type === 'checklist' ? .75 : .55; return Array.from({length: Math.min(n, 8)}, (_, i) => base + i * step); }
Engine.overlayTimes = overlayTimes;
function panelRect(tl) { const {W, H} = tl; return tl.vertical ? {x: W * .06, y: H * .21, w: W * .88, h: H * .31} : {x: W * .04, y: H * .24, w: W * .52, h: H * .62}; }
function emo(ctx, e, x, y, size) { ctx.font = `${size}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, x, y); }
function txt(ctx, s, x, y, size, col = '#111', align = 'center', weight = 800, stroke = null) { ctx.font = `${weight} ${size}px Archivo, "Inter Tight", sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = size * .18; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); } ctx.fillStyle = col; ctx.fillText(s, x, y); }
function curvedArrow(ctx, x0, y0, x1, y1, k, w) { if (k <= 0) return; const cx = x0 - (y1 - y0) * .25, cy = y0 + (y1 - y0) * .7; ctx.save(); ctx.strokeStyle = '#ff2d2d'; ctx.fillStyle = '#ff2d2d'; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); const N = 24; let px = x0, py = y0, qx = x0, qy = y0; for (let i = 1; i <= N * k; i++) { const t = i / N; px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1; py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1; ctx.lineTo(px, py); if (i === Math.floor(N * k) - 1) { qx = px; qy = py; } } ctx.stroke(); if (k > .95) { const a = Math.atan2(py - qy, px - qx); ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * w * 1.6, py + Math.sin(a) * w * 1.6); ctx.lineTo(px + Math.cos(a + 2.4) * w * 2.2, py + Math.sin(a + 2.4) * w * 2.2); ctx.lineTo(px + Math.cos(a - 2.4) * w * 2.2, py + Math.sin(a - 2.4) * w * 2.2); ctx.closePath(); ctx.fill(); } ctx.restore(); }
function drawOverlay(ctx, tl, sc, time) {
  const ov = sc.overlay; if (!ov || !ov.type) return;
  const lt = time - sc.start; if (lt < 0) return;
  const {W, H} = tl, R = panelRect(tl), items = (ov.items || []).slice(0, 8), times = overlayTimes(ov), u = Math.min(W, H);
  const dark = ['gym_oscuro', 'gimnasio', 'cuadricula_osc', 'ciudad', 'muro'].includes(sc.bg);
  const k = Math.min(1, lt / .4); const ek = backOut(k);
  ctx.save();
  if (ov.type === 'tier') {
    const rows = ['S', 'A', 'B', 'C']; const rh = R.h / 4; ctx.globalAlpha = Math.min(1, k * 1.5);
    ctx.save(); ctx.translate(-(1 - ek) * R.w * .6, 0);
    rows.forEach((r, i) => { const y = R.y + i * rh; ctx.fillStyle = dark ? 'rgba(20,24,28,.8)' : 'rgba(255,255,255,.88)'; ctx.fillRect(R.x + rh, y, R.w - rh, rh - 3); ctx.fillStyle = TIER_COL[r]; ctx.fillRect(R.x, y, rh, rh - 3); ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(2, u * .004); ctx.strokeRect(R.x, y, R.w, rh - 3); txt(ctx, r, R.x + rh / 2, y + rh / 2, rh * .6, '#111', 'center', 900); });
    const cnt = {S: 0, A: 0, B: 0, C: 0};
    items.forEach((it, i) => { const tr = rows.includes(it.tier) ? it.tier : 'C'; const ri = rows.indexOf(tr); const slot = cnt[tr]++; const t0 = times[i]; if (lt < t0) return; const p = Math.min(1, (lt - t0) / .45); const bp = backOut(p);
      const size = rh * .8, x = R.x + rh + size * .62 + slot * size * 1.05, yT = R.y + ri * rh + rh / 2, y = yT - (1 - bp) * rh * 1.6;
      if (lt - t0 < 1.2 && i === items.findIndex((_, j) => lt >= times[j] && (j === items.length - 1 || lt < times[j + 1]))) { ctx.save(); ctx.globalAlpha = .35 * (1 - Math.min(1, (lt - t0) / 1.2)); ctx.fillStyle = TIER_COL[tr]; ctx.beginPath(); ctx.arc(x, yT, size * .6, 0, 7); ctx.fill(); ctx.restore(); }
      if (it.emoji) emo(ctx, it.emoji, x, y - (it.text ? size * .1 : 0), size * .62);
      if (it.text) txt(ctx, it.text.slice(0, 14), x, y + size * .34, size * .17, dark ? '#fff' : '#111', 'center', 800);
    });
    ctx.restore();
    if (ov.title && !sc.text) txt(ctx, ov.title.toUpperCase(), R.x + R.w / 2, R.y - u * .04, u * .05, '#fff', 'center', 900, '#111');
  } else if (ov.type === 'board' || ov.type === 'checklist') {
    const clip = ov.type === 'checklist'; const off = (1 - ek) * -(R.y + R.h);
    ctx.translate(0, off);
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = u * .03; ctx.shadowOffsetY = u * .01;
    if (clip) { ctx.fillStyle = '#b07a42'; rr(ctx, R.x, R.y, R.w, R.h, u * .02); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.fillStyle = '#fbfbf8'; rr(ctx, R.x + R.w * .05, R.y + R.h * .1, R.w * .9, R.h * .86, u * .01); ctx.fill(); ctx.fillStyle = '#9aa1ab'; rr(ctx, R.x + R.w * .35, R.y - R.h * .03, R.w * .3, R.h * .1, u * .012); ctx.fill(); }
    else { ctx.fillStyle = '#cfd5dc'; rr(ctx, R.x, R.y, R.w, R.h, u * .015); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.fillStyle = '#ffffff'; rr(ctx, R.x + R.w * .025, R.y + R.h * .04, R.w * .95, R.h * .9, u * .01); ctx.fill(); ctx.fillStyle = '#9aa1ab'; ctx.fillRect(R.x + R.w * .25, R.y + R.h * .95, R.w * .5, R.h * .03); }
    const top = R.y + R.h * (clip ? .2 : .14);
    if (ov.title) txt(ctx, ov.title, R.x + R.w / 2, top, Math.min(R.h * .11, u * .055), '#111', 'center', 900);
    const n = Math.max(1, items.length), lh = (R.h * (clip ? .66 : .72)) / Math.max(4, n);
    items.forEach((it, i) => { if (lt < times[i]) return; const p = Math.min(1, (lt - times[i]) / .3); ctx.globalAlpha = p; const y = top + lh * (i + 1) + R.h * .02; const fs = Math.min(lh * .48, u * .042);
      const mark = it.emoji || (it.ok === false ? '❌' : it.ok === true ? '✅' : '•'); emo(ctx, mark, R.x + R.w * .1, y, fs * 1.1);
      ctx.font = `700 ${fs}px Archivo, "Inter Tight", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; let t2 = it.text || ''; while (ctx.measureText(t2).width > R.w * .76 && t2.length > 4) t2 = t2.slice(0, -2); if (t2 !== (it.text || '')) t2 += '…';
      ctx.fillStyle = it.ok === false ? '#d62828' : it.ok === true ? '#16884a' : '#1b1f24'; ctx.fillText(t2, R.x + R.w * .17, y);
      ctx.globalAlpha = 1; });
  } else if (ov.type === 'pie') {
    const cx = R.x + R.w * .3, cy = R.y + R.h * .5, r = Math.min(R.w * .26, R.h * .42) * ek; const cols = ['#ff5c5c', '#7ee08a', '#ffe36b', '#6cb8ff', '#c48bff', '#ffb86b'];
    const tot = items.reduce((a, it) => a + (+it.value || 1), 0) || 1; const sweep = Math.min(1, lt / 1.2); let a0 = -Math.PI / 2;
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = u * .02;
    items.forEach((it, i) => { const a1 = a0 + (+it.value || 1) / tot * Math.PI * 2 * sweep; ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fill(); a0 = a1; });
    ctx.shadowColor = 'transparent';
    items.forEach((it, i) => { if (lt < .9 + i * .3) return; const y = R.y + R.h * (.15 + i * .16); const x = R.x + R.w * .62; ctx.fillStyle = cols[i % cols.length]; rr(ctx, x, y - u * .018, u * .036, u * .036, u * .008); ctx.fill(); txt(ctx, `${it.emoji ? it.emoji + ' ' : ''}${it.text || ''}${it.value ? ' ' + it.value + '%' : ''}`, x + u * .05, y, u * .034, dark ? '#fff' : '#111', 'left', 800, dark ? null : null); });
    if (ov.title && !sc.text) txt(ctx, ov.title.toUpperCase(), R.x + R.w / 2, R.y - u * .03, u * .05, '#fff', 'center', 900, '#111');
  } else if (ov.type === 'error') {
    const fs = u * .12; const y = R.y + R.h * .3; ctx.save(); ctx.translate(R.x + R.w / 2, y); ctx.scale(ek, ek); txt(ctx, (ov.title || 'ERROR').toUpperCase() + ' ❌', 0, 0, fs, '#ff2d2d', 'center', 900, '#ffffff'); ctx.restore();
    const ph = (items[0] && items[0].text) || ''; if (ph && lt > .3) { const fs2 = u * .052; ctx.font = `800 ${fs2}px Archivo, "Inter Tight", sans-serif`; const lines = wrapText(ctx, ph, R.w * .95).slice(0, 2); lines.forEach((l, i) => { const yy = R.y + R.h * .62 + i * fs2 * 1.15; txt(ctx, l, R.x + R.w / 2, yy, fs2, '#fff', 'center', 800, '#111'); const sk = Math.min(1, Math.max(0, (lt - .9 - i * .25) / .45)); if (sk > 0) { const w = ctx.measureText(l).width; ctx.strokeStyle = '#ff2d2d'; ctx.lineWidth = fs2 * .16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(R.x + R.w / 2 - w / 2 - 6, yy); ctx.lineTo(R.x + R.w / 2 - w / 2 - 6 + (w + 12) * sk, yy); ctx.stroke(); } }); }
  } else if (ov.type === 'versus') {
    const a = items[0] || {}, b = items[1] || {}; const sz = Math.min(R.h * .5, R.w * .3); const y = R.y + R.h * .45;
    const pa = Math.min(1, Math.max(0, lt - .2) / .4), pb = Math.min(1, Math.max(0, lt - .7) / .4);
    if (pa > 0) { ctx.save(); ctx.translate(R.x + R.w * .2, y); ctx.scale(backOut(pa), backOut(pa)); emo(ctx, a.emoji || '❓', 0, 0, sz); ctx.restore(); if (a.text) txt(ctx, a.text, R.x + R.w * .2, y + sz * .7, u * .038, '#fff', 'center', 900, '#111'); }
    if (lt > .5) { ctx.fillStyle = '#21c55d'; ctx.beginPath(); const tx = R.x + R.w * .5, s2 = sz * .2; ctx.moveTo(tx - s2 * .6, y - s2); ctx.lineTo(tx + s2, y); ctx.lineTo(tx - s2 * .6, y + s2); ctx.closePath(); ctx.fill(); }
    if (pb > 0) { ctx.save(); ctx.translate(R.x + R.w * .8, y); ctx.scale(backOut(pb), backOut(pb)); emo(ctx, b.emoji || '❓', 0, 0, sz); ctx.restore(); if (b.text) txt(ctx, b.text, R.x + R.w * .8, y + sz * .7, u * .038, '#fff', 'center', 900, '#111'); }
    if (ov.title && !sc.text) txt(ctx, ov.title.toUpperCase(), R.x + R.w / 2, R.y, u * .055, '#fff', 'center', 900, '#111');
    if (ov.arrow !== false && lt > 1.1) { const k2 = Math.min(1, (lt - 1.1) / .6); const x1 = tl.vertical ? W * .5 : W * .66, y1 = tl.vertical ? H * .62 : H * .62; curvedArrow(ctx, R.x + R.w * .5, y + sz * .5, x1, y1, k2, u * .012); }
  }
  ctx.restore();
}
function drawEmojis(ctx, tl, sc, time) {
  const es = (sc.emojis || []).slice(0, 3); if (!es.length) return; const lt = time - sc.start; const {W, H} = tl, u = Math.min(W, H);
  const pos = tl.vertical ? [[.2, .44], [.8, .4], [.78, .58]] : [[.58, .3], [.9, .28], [.9, .6]];
  es.forEach((e, i) => { const t0 = .5 + i * .35; if (lt < t0) return; const p = Math.min(1, (lt - t0) / .45); const s = backOut(p); const [px, py] = pos[i]; ctx.save(); ctx.translate(W * px, H * py + Math.sin(time * 2.4 + i) * u * .01); ctx.rotate(Math.sin(time * 1.7 + i) * .12); ctx.scale(s, s); emo(ctx, e, 0, 0, u * .13); ctx.restore(); });
}

/* cuadro completo */
Engine.drawFrame = (ctx, tl, time) => {
  const {W, H, scenes} = tl;
  if (!scenes.length) { ctx.fillStyle = '#0b100e'; ctx.fillRect(0, 0, W, H); return; }
  time = Math.max(0, Math.min(time, tl.duration - .001));
  let i = scenes.findIndex(s => time >= s.start && time < s.end); if (i < 0) i = scenes.length - 1;
  const sc = scenes[i], prev = scenes[i - 1];
  const prevIds = prev ? new Set((prev.chars || []).map(c => c.id)) : new Set();
  const into = time - sc.start;
  ctx.save(); ctx.clearRect(0, 0, W, H);
  if (prev && into < TR && sc.transition && sc.transition !== 'cut') {
    const pp = new Set(((scenes[i - 2] || {}).chars || []).map(c => c.id));
    drawScene(ctx, tl, prev, time, pp);
    const k = ease(into / TR);
    ctx.save();
    if (sc.transition === 'fade') ctx.globalAlpha = k;
    else if (sc.transition === 'slide') ctx.translate((1 - k) * W, 0);
    else if (sc.transition === 'zoom') { ctx.globalAlpha = k; ctx.translate(W / 2, H / 2); ctx.scale(1.25 - .25 * k, 1.25 - .25 * k); ctx.translate(-W / 2, -H / 2); }
    else if (sc.transition === 'wipe') { ctx.beginPath(); ctx.rect(0, 0, W * k, H); ctx.clip(); }
    drawScene(ctx, tl, sc, time, prevIds);
    ctx.restore();
    if (sc.transition === 'wipe') { ctx.fillStyle = tl.accent; ctx.fillRect(W * k - W * .012, 0, W * .012, H); }
  } else drawScene(ctx, tl, sc, time, prevIds);
  drawMotion(ctx, tl, sc, time);
  drawOverlay(ctx, tl, sc, time);
  drawEmojis(ctx, tl, sc, time);
  drawCaption(ctx, tl, sc, time);
  drawSubs(ctx, tl, sc, time);
  if (tl.progress) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(0, 0, W, Math.max(6, H * .005)); ctx.fillStyle = tl.accent; ctx.fillRect(0, 0, W * time / tl.duration, Math.max(6, H * .005)); }
  if (tl.handle) { ctx.font = `700 ${Math.round(Math.min(W, H) * .028)}px "Inter Tight", sans-serif`; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(tl.handle, W - W * .04, H * .02); }
  ctx.restore();
};


/* ---------- capa de motion: íconos que entran, flotan y salen al ritmo de cada escena ---------- */
const ICON_KEYS = [[/ahorr|alcanc/i, 'piggy'], [/tarjeta|deuda|crédito|credito|préstamo|prestamo/i, 'card'], [/invers|crec|gananc|sub[ei]|aument/i, 'chart_up'], [/perd|riesgo|ca[eí]|baj[aóo]|crisis/i, 'chart_down'], [/compr|carrito|gast|tienda/i, 'cart'], [/envío|envio|paquete|producto|pedido/i, 'box'], [/celular|app|redes|tiktok|instagram|youtube|internet/i, 'phone'], [/idea|aprend|entend|clave/i, 'lightbulb'], [/meta|objetivo|plan/i, 'target'], [/tiempo|mes|año|semana|día|dia|hora/i, 'alarm'], [/interés|interes|porcentaje|%/i, 'percent'], [/banco|cuenta/i, 'bank'], [/dinero|pesos|sueldo|salario|ingreso|pago|cobr/i, 'coins'], [/billete|efectivo|rico|riqueza|millon/i, 'bills'], [/presupuesto|calcul|sumar|cuentas/i, 'calculator'], [/error|cuidado|ojo|evita|peligro|nunca/i, 'warning'], [/músculo|musculo|hipertrofia|fuerza|pesa|levant/i, 'muscle'], [/cardio|corazón|corazon|resistencia|correr/i, 'heart'], [/estudio|evidencia|ciencia|investig/i, 'book'], [/casa|hogar|renta|alquiler/i, 'house'], [/bien|correcto|logr|éxito|exito/i, 'check'], [/mal|incorrecto|no funciona/i, 'cross'], [/negocio|emprend|vender|venta|cliente/i, 'store'], [/cartera|billetera/i, 'wallet'], [/pesa|mancuerna|gimnasio|gym|entren/i, 'dumbbell']];
Engine.iconsFor = text => { const out = []; ICON_KEYS.forEach(([re, k]) => { if (A.OBJ[k] && re.test(text || '') && !out.includes(k)) out.push(k); }); return out; };
function drawMotion(ctx, tl, sc, time) {
  if (tl.motion === 'off') return;
  const lt = time - sc.start; if (lt < 0) return;
  const {W, H} = tl, u = Math.min(W, H);
  const icons = (sc._icons = sc._icons || [...new Set([...(sc.objects || []), ...Engine.iconsFor(sc.dialogue + ' ' + (sc.text || ''))])].filter(k => A.OBJ[k]));
  const n = tl.motion === 'medio' ? 3 : 6, pool = icons.length ? icons : ['lightbulb', 'check', 'target'];
  // zonas laterales y superiores, sin tapar la cara del personaje ni los subtítulos
  const slots = tl.vertical ? [[.12, .13], [.86, .16], [.1, .52], [.9, .5], [.18, .66], [.82, .68]] : [[.07, .16], [.93, .18], [.06, .7], [.94, .66], [.2, .1], [.8, .1]];
  const seed = sc.i * 7.13;
  for (let j = 0; j < n; j++) {
    const k = pool[(j + sc.i) % pool.length], [sx, sy] = slots[j];
    const t0 = .15 + j * Math.min(.45, sc.dur / (n + 2)), age = lt - t0; if (age < 0) continue;
    const out = sc.dur - lt; const a = Math.min(1, age / .25) * Math.min(1, Math.max(0, out / .3));
    if (a <= 0) continue;
    const pop = age < .35 ? 1 + .35 * Math.sin(age / .35 * Math.PI) : 1;
    const x = W * sx + Math.sin(time * .9 + seed + j) * u * .018, y = H * sy + Math.cos(time * 1.1 + seed + j * 2) * u * .016;
    const size = u * (tl.vertical ? .085 : .075) * (j < 2 ? 1.15 : .9) * pop;
    ctx.save(); ctx.globalAlpha = a * .92;
    // halo de color detrás del ícono
    ctx.fillStyle = tl.accent; ctx.globalAlpha = a * .18; ctx.beginPath(); ctx.arc(x, y, size * .62, 0, 7); ctx.fill(); ctx.globalAlpha = a * .92;
    ctx.translate(x, y); ctx.rotate(Math.sin(time * 1.4 + j) * .12); A.drawObject(ctx, k, 0, 0, size, age); ctx.restore();
  }
  // destellos y formas de acento (movimiento constante pero suave)
  const m = tl.motion === 'medio' ? 4 : 9;
  for (let j = 0; j < m; j++) {
    const ph = (lt * .35 + j / m + sc.i * .17) % 1, x = W * ((j * .37 + sc.i * .11) % 1), y = H * (.08 + ((j * .53) % .55)) - ph * H * .06;
    ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI) * .5; ctx.strokeStyle = j % 3 ? tl.accent : '#ffffff'; ctx.lineWidth = u * .004; const r = u * (.006 + (j % 3) * .004);
    if (j % 3 === 0) { ctx.beginPath(); ctx.moveTo(x - r * 2, y); ctx.lineTo(x + r * 2, y); ctx.moveTo(x, y - r * 2); ctx.lineTo(x, y + r * 2); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, 7); ctx.stroke(); }
    ctx.restore();
  }
}

/* ---------- audio: música original sintetizada + efectos ---------- */
Engine.newAudioContext = () => { const AC = window.AudioContext || window.webkitAudioContext; return AC ? new AC() : null; };
/* Mezcla un tramo [from, to) de la línea de tiempo. Cada sonido se incluye solo en el tramo donde empieza,
   y el búfer lleva una cola extra para que las notas que cruzan el borde suenen completas. Así un video de
   30 minutos se mezcla en tramos de 30 s en vez de un único búfer enorme. */
const AUDIO_TAIL = 3;
Engine.renderAudioWindow = async (tl, from, to, nar, mix) => {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const sr = 44100, D = tl.duration + .3; to = Math.min(to, D + .2);
  const len = Math.max(1, Math.ceil((to - from + AUDIO_TAIL) * sr));
  const ac = new OAC(2, len, sr);
  const master = ac.createDynamicsCompressor(); master.threshold.value = -14; master.ratio.value = 4;
  const out = ac.createGain(); out.gain.value = 1.6; out.connect(ac.destination); master.connect(out);
  const musicBus = ac.createGain(); const mv = nar ? .2 : .45; musicBus.gain.value = mv; musicBus.connect(master);
  const sfxBus = ac.createGain(); sfxBus.gain.value = .45; sfxBus.connect(master);
  const noise = ac.createBuffer(1, sr, sr); const nd = noise.getChannelData(0); for (let i = 0; i < sr; i++) nd[i] = Math.random() * 2 - 1;
  const inWin = t => t >= from && t < to && t <= D;
  const L = t => Math.max(0, t - from);
  const tone = (f, t, d, type, g, bus, attack = .01) => { if (!inWin(t)) return; const lt = L(t); const o = ac.createOscillator(); o.type = type; o.frequency.value = f; const v = ac.createGain(); v.gain.setValueAtTime(0, lt); v.gain.linearRampToValueAtTime(g, lt + attack); v.gain.exponentialRampToValueAtTime(.0001, lt + d); o.connect(v); v.connect(bus); o.start(lt); o.stop(lt + d + .05); };
  const hit = (t, d, g, fType, f, bus) => { if (!inWin(t)) return; const lt = L(t); const s = ac.createBufferSource(); s.buffer = noise; const fl = ac.createBiquadFilter(); fl.type = fType; fl.frequency.value = f; const v = ac.createGain(); v.gain.setValueAtTime(g, lt); v.gain.exponentialRampToValueAtTime(.0001, lt + d); s.connect(fl); fl.connect(v); v.connect(bus); s.start(lt, Math.random() * .5); s.stop(lt + d + .05); };
  const kick = (t, g = .9) => { if (!inWin(t)) return; const lt = L(t); const o = ac.createOscillator(); o.frequency.setValueAtTime(140, lt); o.frequency.exponentialRampToValueAtTime(42, lt + .14); const v = ac.createGain(); v.gain.setValueAtTime(g, lt); v.gain.exponentialRampToValueAtTime(.0001, lt + .32); o.connect(v); v.connect(musicBus); o.start(lt); o.stop(lt + .35); };
  const sweep = (t0, t1, d, f0, f1, g, Q, bus) => { if (!inWin(t0)) return; const a = L(t0), b = L(t1); const s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = Q; f.frequency.setValueAtTime(f0, a); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, b + .1); const v = ac.createGain(); v.gain.setValueAtTime(t1 > t0 ? 0 : g, a); if (t1 > t0) v.gain.linearRampToValueAtTime(g, b); v.gain.exponentialRampToValueAtTime(.0001, b + d); s.connect(f); f.connect(v); v.connect(bus); s.start(a); s.stop(b + d + .05); };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const style = tl.music || 'upbeat';
  if (style !== 'none') {
    const cfg = {upbeat: {bpm: 116, prog: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], pad: 'triangle', drums: 'pop'},
      lofi: {bpm: 82, prog: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]], pad: 'sine', drums: 'lofi'},
      tension: {bpm: 96, prog: [[57, 60, 64], [57, 60, 65], [56, 60, 63], [55, 58, 62]], pad: 'sawtooth', drums: 'pulse'},
      motivacion: {bpm: 128, prog: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], pad: 'sawtooth', drums: 'four'}}[style] || null;
    if (cfg) {
      const beat = 60 / cfg.bpm, bar = beat * 4;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = style === 'lofi' ? 1400 : 2600; lp.connect(musicBus);
      for (let b = Math.max(0, Math.floor(from / bar) - 1), t = b * bar; t < Math.min(to, D); b++, t += bar) {
        const ch = cfg.prog[b % cfg.prog.length];
        ch.forEach(m => tone(mtof(m), t, bar * .98, cfg.pad, cfg.pad === 'sawtooth' ? .035 : .07, lp, .25));
        tone(mtof(ch[0] - 24), t, beat * 1.8, 'sine', .32, musicBus); tone(mtof(ch[0] - 24), t + beat * 2, beat * 1.8, 'sine', .28, musicBus);
        if (style === 'upbeat' || style === 'motivacion') for (let s = 0; s < 8; s++) tone(mtof(ch[(s * 2) % ch.length] + 12), t + s * beat / 2, beat * .4, 'triangle', .045, lp);
        for (let q = 0; q < 4; q++) {
          const bt = t + q * beat;
          if (cfg.drums === 'four') { kick(bt); hit(bt + beat / 2, .05, .22, 'highpass', 7000, musicBus); if (q % 2) hit(bt, .18, .35, 'bandpass', 1800, musicBus); }
          else if (cfg.drums === 'pop') { if (q % 2 === 0) kick(bt, .8); else hit(bt, .16, .3, 'bandpass', 1600, musicBus); hit(bt + beat / 2, .04, .16, 'highpass', 8000, musicBus); }
          else if (cfg.drums === 'lofi') { if (q === 0) kick(bt, .55); if (q === 2) hit(bt, .2, .2, 'bandpass', 1200, musicBus); hit(bt, .05, .08, 'highpass', 6000, musicBus); }
          else if (cfg.drums === 'pulse') { kick(bt, .45); tone(mtof(45), bt, beat * .3, 'sine', .14, musicBus); }
        }
      }
      // salida suave al final del video (solo en el tramo que contiene el final)
      if (D - 1.2 < to + AUDIO_TAIL && D > from) { musicBus.gain.setValueAtTime(mv, L(Math.max(from, D - 1.2))); musicBus.gain.linearRampToValueAtTime(0, L(D)); }
    }
  }
  // efectos: whoosh en transiciones, pop en objetos, campana en monedas/check
  tl.scenes.forEach((sc, i) => {
    if (sc.end < from - 1 || sc.start - .3 >= to) return;
    if (i && sc.transition !== 'cut') sweep(sc.start - .25, sc.start, .3, 400, 3500, .5, 1.4, sfxBus);
    (sc.objects || []).slice(0, 3).forEach((k, j) => {
      const t = sc.start + .35 + j * .3;
      tone(520 + j * 90, t, .12, 'sine', .4, sfxBus, .005);
      if (['coins', 'check', 'piggy', 'bills', 'wallet'].includes(k)) { tone(1568, t + .05, .5, 'sine', .22, sfxBus, .005); tone(2093, t + .12, .6, 'sine', .18, sfxBus, .005); }
      if (k === 'cross' || k === 'warning' || k === 'chart_down') { tone(196, t, .35, 'square', .1, sfxBus); tone(147, t + .15, .4, 'square', .1, sfxBus); }
    });
    if (sc.camera === 'shake') hit(sc.start, .4, .7, 'lowpass', 300, sfxBus);
    if (sc.overlay && sc.overlay.type) { overlayTimes(sc.overlay).forEach((ot, j) => { const tt = sc.start + ot; if (tt < sc.end) { tone(660 + (j % 4) * 110, tt, .1, 'sine', .35, sfxBus, .004); if (sc.overlay.type === 'checklist' || sc.overlay.type === 'board') tone(1320, tt + .04, .18, 'triangle', .12, sfxBus, .004); } }); if (sc.overlay.type === 'board') sweep(sc.start + .05, sc.start + .05, .35, 900, 900, .4, 1, sfxBus); if (sc.overlay.type === 'error') { tone(220, sc.start + .3, .3, 'square', .12, sfxBus); tone(165, sc.start + .45, .4, 'square', .12, sfxBus); } }
    (sc.emojis || []).slice(0, 3).forEach((e, j) => tone(880 + j * 120, sc.start + .5 + j * .35, .1, 'sine', .3, sfxBus, .004));
  });
  if (mix && from === 0) { const s = ac.createBufferSource(); s.buffer = mix; s.connect(master); s.start(.1); }
  return ac.startRendering();
};
/* mezcla completa en un solo búfer (solo para videos cortos y pruebas) */
Engine.renderAudio = (tl, narration) => Engine.renderAudioWindow(tl, 0, tl.duration + .5, !!narration, narration || null);

/* Reproduce la mezcla en tramos de 30 s preparados por adelantado sobre un AudioContext en vivo.
   start(desde) devuelve el tiempo del AudioContext en que suena ese instante del video. */
Engine.AudioStreamer = class {
  constructor(ac, dest, tl, narration, {chunk = 30, ahead = 40} = {}) {
    Object.assign(this, {ac, tl, narration, chunk, ahead}); this.srcs = []; this.stopped = false; this.busy = false;
    this.out = ac.createGain(); this.out.connect(dest);
  }
  async start(startAt = 0, lead = .2) {
    this.startAt = startAt; this.next = Math.floor(startAt / this.chunk) * this.chunk; this.end = this.tl.duration + .5;
    const from = this.next; this.next = Math.min(from + this.chunk, this.end);
    const first = await Engine.renderAudioWindow(this.tl, from, this.next, !!this.narration);
    if (this.stopped) return this.ac.currentTime;
    this.t0 = this.ac.currentTime + lead;
    this.schedule(first, from);
    if (this.narration) {
      const s = this.ac.createBufferSource(); s.buffer = this.narration; const g = this.ac.createGain(); g.gain.value = 1.3; s.connect(g); g.connect(this.out);
      const off = startAt - .1; if (off < 0) s.start(this.t0 - off); else if (off < this.narration.duration) s.start(this.t0, off);
      this.srcs.push(s);
    }
    this.timer = setInterval(() => this.pump(), 500); this.pump();
    return this.t0;
  }
  when(t) { return this.t0 + (t - this.startAt); }
  now() { return this.ac.currentTime - this.t0 + this.startAt; }
  async pump() {
    if (this.busy || this.stopped || this.next >= this.end || this.next - this.now() > this.ahead) return;
    this.busy = true;
    try { const from = this.next; this.next = Math.min(from + this.chunk, this.end); const buf = await Engine.renderAudioWindow(this.tl, from, this.next, !!this.narration); if (!this.stopped) this.schedule(buf, from); }
    catch (e) { console.warn('audio', e); }
    finally { this.busy = false; }
    if (!this.stopped && this.next < this.end && this.next - this.now() <= this.ahead) this.pump();
  }
  schedule(buf, from) {
    const s = this.ac.createBufferSource(); s.buffer = buf; s.connect(this.out);
    const now = this.ac.currentTime; let w = this.when(from), off = 0;
    if (from < this.startAt) off = this.startAt - from, w = this.t0;
    if (w < now) { off += now - w; w = now; }
    if (off >= buf.duration) return;
    s.start(w, off); this.srcs.push(s); s.onended = () => { this.srcs = this.srcs.filter(x => x !== s); };
  }
  stop() { this.stopped = true; clearInterval(this.timer); this.srcs.forEach(s => { try { s.stop(); } catch {} }); this.srcs = []; try { this.out.disconnect(); } catch {} }
};
Engine.decodeAudio = async (file) => { const ac = Engine.newAudioContext(); const buf = await ac.decodeAudioData(await file.arrayBuffer()); ac.close && ac.close(); return buf; };
Engine.analyzeAudio = (buf) => { if (!buf) return null; const d = buf.getChannelData(0); let peak = 0, sum = 0, silent = 0; const step = 64; for (let i = 0; i < d.length; i += step) { const v = Math.abs(d[i]); peak = Math.max(peak, v); sum += v * v; if (v < .005) silent++; } const rms = Math.sqrt(sum / (d.length / step)); return {peak, rms, silentRatio: silent / (d.length / step), duration: buf.duration}; };

/* ---------- reproductor de vista previa ---------- */
Engine.Player = class {
  constructor(canvas, tl, {res = .5} = {}) {
    this.cv = canvas; this.tl = tl; this.res = res; this.t = 0; this.playing = false; this.raf = 0; this.onTime = null; this.audio = null;
    canvas.width = Math.round(tl.W * res); canvas.height = Math.round(tl.H * res); this.ctx = canvas.getContext('2d');
    this.draw();
  }
  setTimeline(tl) { this.tl = tl; this.cv.width = Math.round(tl.W * this.res); this.cv.height = Math.round(tl.H * this.res); this.t = Math.min(this.t, tl.duration); this.draw(); }
  draw() { const c = this.ctx; c.save(); c.scale(this.res, this.res); Engine.drawFrame(c, this.tl, this.t); c.restore(); this.onTime && this.onTime(this.t); }
  seek(t) { this.t = Math.max(0, Math.min(t, this.tl.duration)); if (this.playing) { this.stop(true); this.play(); } else this.draw(); }
  async play({withAudio = true} = {}) {
    if (this.playing) return; if (this.t >= this.tl.duration - .05) this.t = 0;
    this.playing = true; const startT = this.t; let t0 = performance.now(), clock = null;
    if (App.Art.preload) await App.Art.preload(Object.values(this.tl.chars));
    if (withAudio) {
      try {
        this.ac = this.ac || Engine.newAudioContext(); await this.ac.resume();
        this.streamer = new Engine.AudioStreamer(this.ac, this.ac.destination, this.tl, this.narration);
        const at = await this.streamer.start(startT);
        if (!this.playing) { this.streamer.stop(); return; }
        clock = () => startT + (this.ac.currentTime - at);
      } catch (e) { console.warn('audio', e); }
    }
    t0 = performance.now(); clock = clock || (() => startT + (performance.now() - t0) / 1000);
    const tick = () => { if (!this.playing) return; if (!this.cv.isConnected) { this.destroy(); return; } this.t = Math.max(startT, clock()); if (this.t >= this.tl.duration) { this.t = this.tl.duration; this.draw(); this.stop(); return; } this.draw(); this.raf = requestAnimationFrame(tick); };
    tick();
  }
  stop(keep) { this.playing = false; cancelAnimationFrame(this.raf); try { this.streamer && this.streamer.stop(); } catch {} this.streamer = null; if (!keep) this.onEnd && this.onEnd(); }
  /* vista previa con voz en vivo: cada escena avanza al terminar su locución y mide la duración real */
  async playWithVoice(voiceFor) {
    this.stop(true); this.voiceMode = true; this.measured = [];
    const tl = this.tl;
    for (const sc of tl.scenes) {
      if (!this.voiceMode) break;
      const t0 = performance.now(); let done = false;
      const tick = () => { if (done || !this.voiceMode) return; const el = (performance.now() - t0) / 1000; this.t = sc.start + Math.min(el, sc.dur - .02); this.draw(); this.raf = requestAnimationFrame(tick); };
      tick();
      const v = voiceFor(sc);
      try { if (sc.dialogue && v) await App.Voice.speak(sc.dialogue, v); else await new Promise(r => setTimeout(r, sc.dur * 1000)); } catch (e) { App.UI.error(e); this.voiceMode = false; }
      done = true; cancelAnimationFrame(this.raf);
      this.measured.push((performance.now() - t0) / 1000);
    }
    const ok = this.voiceMode; this.voiceMode = false; return ok ? this.measured : null;
  }
  stopVoice() { this.voiceMode = false; App.Voice.stop(); cancelAnimationFrame(this.raf); }
  destroy() { this.stop(true); this.stopVoice(); try { this.ac && this.ac.close(); } catch {} }
};

/* ---------- render a archivo de video (en tu navegador, gratis) ---------- */
Engine.pickMime = () => {
  if (!window.MediaRecorder) return null;
  const c = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.4D401F,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4;codecs=avc1,opus', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return c.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } }) || null;
};
Engine.record = async (tl, {ac, narration, bitrate, onProgress, cancel} = {}) => {
  const mime = Engine.pickMime();
  if (!mime) throw Object.assign(new Error('Este navegador no puede grabar video. Usa Chrome o Edge actualizados en tu computadora.'), {userMsg: 'Este navegador no puede grabar video. Usa Chrome o Edge actualizados en tu computadora.'});
  const cv = document.createElement('canvas'); cv.width = tl.W; cv.height = tl.H; const ctx = cv.getContext('2d', {alpha: false});
  if (document.fonts && document.fonts.load) { try { await Promise.all([document.fonts.load('900 40px Archivo'), document.fonts.load('700 40px "Inter Tight"')]); } catch {} }
  if (App.Art.preload) await App.Art.preload(Object.values(tl.chars));
  Engine.drawFrame(ctx, tl, 0);
  onProgress && onProgress(0, 'Mezclando música y efectos…');
  ac = ac || Engine.newAudioContext(); await ac.resume();
  const dest = ac.createMediaStreamDestination();
  const streamer = new Engine.AudioStreamer(ac, dest, tl, narration);
  const vStream = cv.captureStream(30);
  const stream = new MediaStream([...vStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const rec = new MediaRecorder(stream, {mimeType: mime, videoBitsPerSecond: bitrate || 6e6, audioBitsPerSecond: 128000});
  const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise(r => rec.onstop = r);
  // pantalla encendida mientras graba (si el navegador lo permite)
  let lock = null; const wake = async () => { try { if (navigator.wakeLock && !document.hidden) lock = await navigator.wakeLock.request('screen'); } catch {} };
  await wake();
  // si la pestaña se oculta, el navegador deja de dibujar: se pausa todo y se reanuda al volver
  let paused = false, pausedAt = 0;
  const onVis = async () => {
    if (document.hidden && !paused && rec.state === 'recording') { paused = true; try { rec.pause(); } catch {} try { await ac.suspend(); } catch {} }
    else if (!document.hidden && paused) { try { await ac.resume(); } catch {} try { rec.resume(); } catch {} paused = false; wake(); }
  };
  document.addEventListener('visibilitychange', onVis);
  App.state.recording = true;
  const t0 = await streamer.start(0, .15);
  rec.start(tl.duration > 120 ? 2000 : 500);
  await new Promise((resolve, reject) => {
    let last = -1;
    const loop = () => {
      if (cancel && cancel.cancelled) { reject(Object.assign(new Error('Render cancelado'), {userMsg: 'Render cancelado.'})); return; }
      const t = ac.currentTime - t0;
      if (paused) { onProgress && onProgress(Math.max(0, Math.min(1, t / tl.duration)), 'En pausa: vuelve a esta pestaña para continuar…'); return void setTimeout(loop, 250); }
      if (t >= 0 && t !== last) { Engine.drawFrame(ctx, tl, Math.min(t, tl.duration)); last = t; }
      const left = Math.max(0, tl.duration - t);
      onProgress && onProgress(Math.max(0, Math.min(1, t / tl.duration)), tl.duration > 90 ? `Grabando (mantén esta pestaña visible) · faltan ${left >= 60 ? Math.floor(left / 60) + ' min ' : ''}${Math.round(left % 60)} s ·` : 'Grabando cuadros (mantén esta pestaña visible)…');
      if (t >= tl.duration + .2) resolve(); else requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }).finally(() => {
    App.state.recording = false;
    document.removeEventListener('visibilitychange', onVis);
    try { lock && lock.release(); } catch {}
    try { if (ac.state === 'suspended') ac.resume(); } catch {}
    try { rec.state !== 'inactive' && rec.stop(); } catch {}
    streamer.stop();
  });
  await stopped;
  vStream.getTracks().forEach(t => t.stop());
  const type = mime.split(';')[0];
  const blob = new Blob(chunks, {type});
  return {blob, mime: type, ext: type === 'video/mp4' ? 'mp4' : 'webm', size: blob.size, W: tl.W, H: tl.H, duration: tl.duration};
};
/* verifica el archivo resultante en un elemento <video> */
Engine.probeVideo = (blob) => new Promise(res => {
  const v = document.createElement('video'); v.muted = true; v.preload = 'metadata'; const url = URL.createObjectURL(blob);
  const done = o => { URL.revokeObjectURL(url); res(o); };
  v.onloadedmetadata = () => done({w: v.videoWidth, h: v.videoHeight, duration: isFinite(v.duration) ? v.duration : null});
  v.onerror = () => done(null); setTimeout(() => done(null), 6000); v.src = url;
});

/* ---------- miniaturas ---------- */
Engine.THUMB_LAYOUTS = ['Impacto', 'Antes / después', 'Objeto gigante', 'Palabra clave', 'Advertencia'];
Engine.THUMB_LAYOUTS_GYM = ['Tier list 3D', 'Cuerpo 3D de espalda'];
Engine.drawThumb = (ctx, W, H, o) => {
  const ch = o.char, ch2 = o.char2 || o.char, acc = o.accent || '#2ee59d', v = o.variant || 0;
  const gy = H * .98, sc = H * .9 / 340;
  ctx.save(); ctx.clearRect(0, 0, W, H);
  const bg = App.Art.BG[o.bg] || App.Art.BG.oficina; bg(ctx, W, H, H * .9, 1.2);
  const grad = ctx.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, 'rgba(5,10,8,.88)'); grad.addColorStop(.55, 'rgba(5,10,8,.35)'); grad.addColorStop(1, 'rgba(5,10,8,.1)');
  const poseOf = (id, t = .6) => App.Art.poseAt(id, t).pose;
  const text = String(o.text || '').toUpperCase();
  const big = (txt, x, y, maxW, fs, align = 'left', lastAcc = true) => {
    ctx.font = `900 ${fs}px Archivo, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
    let lines = wrapText(ctx, txt, maxW); while (lines.length > 3 && fs > 40) { fs *= .88; ctx.font = `900 ${fs}px Archivo, sans-serif`; lines = wrapText(ctx, txt, maxW); }
    lines.forEach((l, i) => { const yy = y + i * fs * 1.02; ctx.lineWidth = fs * .16; ctx.strokeStyle = '#000'; ctx.strokeText(l, x, yy); ctx.fillStyle = lastAcc && i === lines.length - 1 ? acc : '#fff'; ctx.fillText(l, x, yy); });
    return lines.length * fs * 1.02;
  };
  const move = o.move && App.Art.MOVES[o.move];
  const drawCh = (c, x, expr, act, s = sc, facing = -1) => App.Art.drawCharacter(ctx, c, {x, y: gy, scale: s, facing, pose: poseOf(move ? o.move : act, move ? move.dur * .45 : .6), expr, t: .4, act: move ? o.move : act, exercise: !!move, prop: move ? App.Art.PROPS[move.prop] : null, highlight: move && o.highlight ? move.muscles : []});
  if ((v === 5 || v === 6) && App.Art3D && App.Art3D.supports(ch, 'talk')) {
    const off = document.createElement('canvas'); off.width = Math.round(W * .62); off.height = H;
    App.Art3D.draw(off.getContext('2d'), off.width, H, {char: ch, act: v === 6 ? 'idle' : 'talk', view: v === 6 ? 'espalda' : 'tres_cuartos', theme: 'rays', highlight: true, muscles: o.zone && o.zone.length ? o.zone : ['grasa', 'core'], t: 1.2, fitH: v === 6 ? 1.15 : 1.05, cyFrac: .62});
    ctx.fillStyle = '#f7f7f8'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W * .6, H * .4); ctx.fillStyle = 'rgba(0,0,0,.035)'; for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, -W * .08); ctx.lineTo(W, W * .08); ctx.closePath(); ctx.fill(); } ctx.restore();
    ctx.drawImage(off, W * .42, 0);
    let x0 = W * .04;
    if (v === 5) { const rows = ['S', 'A', 'B', 'C'], cols = ['#ff5c5c', '#ffb86b', '#ffe36b', '#7ee08a'], rh = H / 4; rows.forEach((r, i) => { ctx.fillStyle = cols[i]; ctx.fillRect(0, i * rh, W * .15, rh); ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.strokeRect(0, i * rh, W * .15, rh); ctx.fillStyle = '#111'; ctx.font = `900 ${rh * .62}px Archivo, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(r, W * .075, i * rh + rh / 2); }); x0 = W * .2; }
    ctx.font = `900 ${H * .1}px Archivo, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; const ls = wrapText(ctx, text, W * .42).slice(0, 2); ls.forEach((l, i) => { ctx.lineWidth = H * .016; ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff'; ctx.strokeText(l, x0, H * .1 + i * H * .11); ctx.fillStyle = '#111'; ctx.fillText(l, x0, H * .1 + i * H * .11); });
    const its = (o.items || []).filter(it => it.emoji).slice(0, 2);
    if (its.length) { ctx.font = `${H * .2}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(its[0].emoji, x0 + W * .07, H * .52); if (its[1]) { ctx.fillStyle = '#21c55d'; ctx.beginPath(); ctx.moveTo(x0 + W * .15, H * .48); ctx.lineTo(x0 + W * .19, H * .52); ctx.lineTo(x0 + W * .15, H * .56); ctx.fill(); ctx.fillText(its[1].emoji, x0 + W * .27, H * .52); } }
    ctx.strokeStyle = '#ff2d2d'; ctx.fillStyle = '#ff2d2d'; ctx.lineWidth = H * .016; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + W * .1, H * .66); ctx.quadraticCurveTo(x0 + W * .1, H * .82, x0 + W * .3, H * .78); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0 + W * .33, H * .775); ctx.lineTo(x0 + W * .29, H * .74); ctx.lineTo(x0 + W * .3, H * .82); ctx.closePath(); ctx.fill();
  }
  else if (v === 0) { ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H); drawCh(ch, W * .76, o.expr || 'surprised', 'point'); big(text, W * .05, H * .12, W * .56, H * .17); if (o.obj) App.Art.drawObject(ctx, o.obj, W * .5, H * .72, H * .3, 2); }
  else if (v === 1) {
    ctx.fillStyle = 'rgba(255,60,80,.45)'; ctx.fillRect(0, 0, W / 2, H); ctx.fillStyle = 'rgba(46,229,157,.4)'; ctx.fillRect(W / 2, 0, W / 2, H);
    drawCh(ch, W * .25, 'sad', 'worried', sc * .9, 1); drawCh(ch2, W * .75, 'happy', 'celebrate', sc * .9, -1);
    ctx.font = `900 ${H * .1}px Archivo, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineWidth = 12; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff';
    ctx.strokeText('ANTES', W * .25, H * .06); ctx.fillText('ANTES', W * .25, H * .06); ctx.strokeText('DESPUÉS', W * .75, H * .06); ctx.fillText('DESPUÉS', W * .75, H * .06);
    ctx.fillStyle = acc; ctx.beginPath(); ctx.moveTo(W * .44, H * .44); ctx.lineTo(W * .56, H * .52); ctx.lineTo(W * .44, H * .6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(0, H * .76, W, H * .24); big(text, W / 2, H * .79, W * .9, H * .14, 'center');
  } else if (v === 2) { ctx.fillStyle = 'rgba(5,10,8,.45)'; ctx.fillRect(0, 0, W, H); App.Art.drawObject(ctx, o.obj || 'coins', W * .32, H * .45, H * .62, 2); drawCh(ch, W * .78, o.expr || 'excited', 'point', sc * .95, -1); ctx.fillStyle = acc; ctx.fillRect(0, H * .8, W, H * .2); ctx.fillStyle = '#000'; ctx.font = `900 ${H * .13}px Archivo, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const l = wrapText(ctx, text, W * .92)[0] || ''; ctx.fillText(l, W / 2, H * .9); }
  else if (v === 3) { ctx.fillStyle = 'rgba(5,10,8,.7)'; ctx.fillRect(0, 0, W, H); drawCh(ch, W * .18, o.expr || 'confident', 'present', sc * .85, 1); const words = text.split(' '); const key = words.sort((a, b) => b.length - a.length)[0] || text; ctx.font = `900 ${H * .3}px Archivo, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; let fs = H * .3; while (ctx.measureText(key).width > W * .6 && fs > 60) { fs *= .9; ctx.font = `900 ${fs}px Archivo, sans-serif`; } ctx.lineWidth = fs * .08; ctx.strokeStyle = acc; ctx.strokeText(key, W * .64, H * .42); ctx.fillStyle = '#fff'; ctx.fillText(key, W * .64, H * .42); const rest = String(o.text || '').toUpperCase().split(' ').filter(w => w !== key).join(' '); if (rest) big(rest, W * .64, H * .64, W * .6, H * .09, 'center', false); }
  else { ctx.fillStyle = 'rgba(5,10,8,.6)'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.strokeStyle = '#ffc857'; ctx.lineWidth = H * .05; ctx.setLineDash([H * .08, H * .08]); ctx.strokeRect(H * .025, H * .025, W - H * .05, H - H * .05); ctx.restore(); drawCh(ch, W * .74, 'worried', 'worried'); App.Art.drawObject(ctx, 'warning', W * .5, H * .26, H * .3, 2); ctx.fillStyle = '#ff5d6c'; const h = H * .16; ctx.font = `900 ${h * .8}px Archivo, sans-serif`; const lines = wrapText(ctx, text, W * .5); lines.slice(0, 3).forEach((l, i) => { const w = ctx.measureText(l).width + h * .5; ctx.fillStyle = i % 2 ? '#fff' : '#ff5d6c'; ctx.fillRect(W * .05, H * .45 + i * h * 1.05, w, h); ctx.fillStyle = i % 2 ? '#ff5d6c' : '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(l, W * .05 + h * .25, H * .45 + i * h * 1.05 + h / 2); }); }
  if (o.brandName) { ctx.font = `800 ${H * .035}px "Inter Tight"`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(o.brandName, W - H * .03, H - H * .02); }
  ctx.restore();
};

/* ---------- logos (dibujados en canvas para exportar PNG) ---------- */
Engine.LOGO_ICONS = {coin: 'Moneda', arrow: 'Flecha al alza', bars: 'Barras', piggy: 'Alcancía', rocket: 'Cohete', key: 'Llave', sprout: 'Brote', bolt: 'Rayo', initials: 'Iniciales'};
Engine.LOGO_SHAPES = {circle: 'Círculo', squircle: 'Cuadrado redondeado', hex: 'Hexágono', shield: 'Escudo'};
Engine.drawLogo = (ctx, S, sp) => {
  const c1 = sp.c1 || '#2ee59d', c2 = sp.c2 || '#0b1210', c3 = sp.c3 || '#ffffff';
  ctx.save(); ctx.clearRect(0, 0, S, S); ctx.translate(S / 2, S / 2);
  const shape = () => { ctx.beginPath(); const r = S * .46; if (sp.shape === 'squircle') rr(ctx, -r, -r, r * 2, r * 2, r * .42); else if (sp.shape === 'hex') { for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); } else if (sp.shape === 'shield') { ctx.moveTo(-r * .85, -r * .85); ctx.lineTo(r * .85, -r * .85); ctx.lineTo(r * .85, 0); ctx.quadraticCurveTo(r * .8, r * .7, 0, r); ctx.quadraticCurveTo(-r * .8, r * .7, -r * .85, 0); ctx.closePath(); } else ctx.arc(0, 0, r, 0, Math.PI * 2); };
  shape(); const g = ctx.createLinearGradient(-S / 2, -S / 2, S / 2, S / 2); g.addColorStop(0, c2); g.addColorStop(1, Art.shade(c2, .12)); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = S * .035; ctx.strokeStyle = c1; ctx.stroke();
  const u = S / 100; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ini = (sp.initials || (sp.name || 'EF').split(/\s+/).map(w => w[0]).join('').slice(0, 2)).toUpperCase();
  switch (sp.icon) {
    case 'coin': ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(0, 0, 26 * u, 0, 7); ctx.fill(); ctx.fillStyle = c2; ctx.font = `900 ${30 * u}px Archivo, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ini[0] || '$', 0, 2 * u); break;
    case 'arrow': ctx.strokeStyle = c1; ctx.lineWidth = 9 * u; ctx.beginPath(); ctx.moveTo(-26 * u, 18 * u); ctx.lineTo(-8 * u, 0); ctx.lineTo(4 * u, 10 * u); ctx.lineTo(26 * u, -16 * u); ctx.stroke(); ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(30 * u, -22 * u); ctx.lineTo(12 * u, -20 * u); ctx.lineTo(28 * u, -4 * u); ctx.fill(); break;
    case 'bars': ctx.fillStyle = c1; [[-24, 14], [-8, 24], [8, 34], [24, 46]].forEach(([x, h], i) => { ctx.globalAlpha = .55 + i * .15; rr(ctx, (x - 6) * u, (22 - h) * u, 12 * u, h * u, 3 * u); ctx.fill(); }); ctx.globalAlpha = 1; break;
    case 'piggy': ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, 4 * u, 28 * u, 21 * u, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(27 * u, 2 * u, 7 * u, 7 * u, 0, 0, 7); ctx.fill(); ctx.fillStyle = c2; ctx.fillRect(-8 * u, -16 * u, 16 * u, 4 * u); ctx.beginPath(); ctx.arc(12 * u, -4 * u, 3 * u, 0, 7); ctx.fill(); break;
    case 'rocket': ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(0, -32 * u); ctx.quadraticCurveTo(18 * u, -6 * u, 11 * u, 20 * u); ctx.lineTo(-11 * u, 20 * u); ctx.quadraticCurveTo(-18 * u, -6 * u, 0, -32 * u); ctx.fill(); ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(0, -6 * u, 6 * u, 0, 7); ctx.fill(); ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(-11 * u, 8 * u); ctx.lineTo(-22 * u, 26 * u); ctx.lineTo(-8 * u, 20 * u); ctx.fill(); ctx.beginPath(); ctx.moveTo(11 * u, 8 * u); ctx.lineTo(22 * u, 26 * u); ctx.lineTo(8 * u, 20 * u); ctx.fill(); break;
    case 'key': ctx.strokeStyle = c1; ctx.lineWidth = 8 * u; ctx.beginPath(); ctx.arc(-12 * u, 0, 13 * u, 0, 7); ctx.moveTo(1 * u, 0); ctx.lineTo(30 * u, 0); ctx.moveTo(20 * u, 0); ctx.lineTo(20 * u, 11 * u); ctx.moveTo(28 * u, 0); ctx.lineTo(28 * u, 9 * u); ctx.stroke(); break;
    case 'sprout': ctx.strokeStyle = c1; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.moveTo(0, 28 * u); ctx.lineTo(0, -6 * u); ctx.stroke(); ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(-12 * u, -12 * u, 14 * u, 8 * u, -.6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(13 * u, -18 * u, 16 * u, 9 * u, .6, 0, 7); ctx.fill(); break;
    case 'bolt': ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(6 * u, -34 * u); ctx.lineTo(-18 * u, 4 * u); ctx.lineTo(-2 * u, 4 * u); ctx.lineTo(-8 * u, 34 * u); ctx.lineTo(18 * u, -6 * u); ctx.lineTo(2 * u, -6 * u); ctx.closePath(); ctx.fill(); break;
    default: ctx.fillStyle = c1; ctx.font = `900 ${(ini.length > 1 ? 40 : 52) * u}px Archivo, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ini, 0, 3 * u);
  }
  ctx.restore();
};
Engine.drawBanner = (ctx, W, H, sp) => {
  const c1 = sp.c1 || '#2ee59d', c2 = sp.c2 || '#0b1210';
  ctx.fillStyle = c2; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .18; ctx.strokeStyle = c1; ctx.lineWidth = H * .012; ctx.beginPath(); for (let i = 0; i <= 12; i++) { const x = W * i / 12, y = H * (.75 - i * .04 + Math.sin(i * 1.7) * .05); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
  // zona segura de YouTube: 1546×423 centrada
  const sx = (W - 1546 * W / 2560) / 2, sw = 1546 * W / 2560;
  const ls = H * .22; const cv = document.createElement('canvas'); cv.width = cv.height = 512; Engine.drawLogo(cv.getContext('2d'), 512, sp);
  ctx.drawImage(cv, sx + ls * .1, H / 2 - ls / 2, ls, ls);
  ctx.fillStyle = '#fff'; ctx.font = `900 ${H * .085}px Archivo, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(sp.name || 'Mi canal', sx + ls * 1.3, H / 2 - H * .03);
  ctx.fillStyle = c1; ctx.font = `700 ${H * .035}px "Inter Tight"`; ctx.fillText(sp.slogan || '', sx + ls * 1.3, H / 2 + H * .05);
};
})();
