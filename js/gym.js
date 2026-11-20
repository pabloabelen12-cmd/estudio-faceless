'use strict';
/* ============ Estudio Gym: Training Methodology Lab + descubrimiento de contenido ============ */
(() => {
const {esc, uid, clone, fmtDate, $, $$} = App.util;
const {UI, AI, Store, Files, icon} = App;
const A = App.Art, E = App.Engine, V = App.views;
const CATS = [['A', 'Entrenamiento tradicional con pesas'], ['B', 'Entrenamiento con peso corporal'], ['C', 'Metodologías de hipertrofia'], ['D', 'Sistemas de programación'], ['E', 'Métodos de fuerza y potencia'], ['F', 'Entrenamientos alternativos y poco habituales'], ['G', 'Resistencia y acondicionamiento'], ['H', 'Movilidad, flexibilidad y recuperación']];
const KL = {E: 'Establecido', S: 'Especializado', P: 'Poco conocido', M: 'Emergente', X: 'Experimental', N: 'Sin evidencia suficiente'};
const KLC = {E: 'ok', S: 'info', P: 'acc', M: 'warn', X: 'bad', N: 'bad'};
const EV = {A: 'Alta', M: 'Moderada', L: 'Limitada', B: 'Baja o insuficiente'};
const EVC = {A: 'ok', M: 'info', L: 'warn', B: 'bad'};
const LV = {P: 'Principiante', I: 'Intermedio', A: 'Avanzado'};
const BG = {A: 'gimnasio', B: 'parque', C: 'gimnasio', D: 'gimnasio', E: 'patio', F: 'patio', G: 'pista', H: 'parque'};
const base = App.GYM_RAW.map(r => { const [id, n, c, k, e, l, q, o, s, rk, m, sup, v, en] = r; return {id, n, c, k, e, l, q, o, s, r: rk, m, sup: !!sup, v, en: en || '', cat: CATS.find(x => x[0] === c)[1], kl: KL[k], ev: EV[e], bg: m === 'climb' || id === 'hangboard' ? 'muro' : ['sprint', 'jog', 'sled'].includes(m) ? 'pista' : BG[c]}; });
let custom = [];
const Gym = App.Gym = {
  CATS, KL, EV, LV, base,
  all() { return base.concat(custom); },
  byId(id) { return this.all().find(m => m.id === id); },
  async loadCustom() { custom = (await Store.list('method')).map(m => ({...m, id: m._id, cat: (CATS.find(x => x[0] === m.c) || CATS[5])[1], kl: KL[m.k] || m.k, ev: EV[m.e] || m.e, custom: true})); return custom; }
};
App.FIN_CATS && null;
const tags = m => `<span class="tag ${KLC[m.k]}">${esc(KL[m.k])}</span><span class="tag ${EVC[m.e]}">Evidencia ${esc((EV[m.e] || '').toLowerCase())}</span><span class="tag">${esc(LV[m.l])}</span>${m.sup ? '<span class="tag bad">Requiere supervisión</span>' : ''}${m.custom ? '<span class="tag info">Añadido con IA · verificar</span>' : ''}`;

/* mini lienzo con NEXO haciendo el método */
const nexo = async () => { const all = await App.Lib.chars(); return all.find(c => c.id === (App.state.gymChar || 'volt')) || all.find(c => c.id === 'nexo') || A.defaultCharacters[4]; };
function demoCanvas(cv, m, ch, {animate = true, highlight = false, w = 420, h = 420} = {}) {
  cv.width = w; cv.height = h; const ctx = cv.getContext('2d'); const mv = A.MOVES[m.m] || A.MOVES.idle; const t0 = performance.now();
  if (cv._raf) cancelAnimationFrame(cv._raf);
  if (arguments[3] && arguments[3].three && App.Art3D && App.Art3D.supports(ch)) { const loop3 = () => { if (!document.body.contains(cv)) return; const t = (performance.now() - t0) / 1000; ctx.clearRect(0, 0, w, h); App.Art3D.draw(ctx, w, h, {char: ch, move: mv.id, t, highlight, theme: App.Art3D.themeFor(m.bg), fitH: .9, cyFrac: .5}); cv._raf = requestAnimationFrame(loop3); }; loop3(); return; }
  const bg = A.BG[m.bg] || A.BG.gimnasio;
  const frame = t => { ctx.save(); ctx.clearRect(0, 0, w, h); const gy = h * .86; ctx.save(); bg(ctx, w, h, gy, t); ctx.restore(); if (mv.loco) A.groundMotion(ctx, w, h, gy, t, mv.loco); const {pose} = A.poseAt(mv.id, t); const sc = h * .72 / 340 * (mv.id === 'climb' || mv.id === 'pullup' || mv.id === 'hang' || mv.id === 'dip' ? .78 : 1); A.drawCharacter(ctx, ch, {x: w * .42, y: gy, scale: sc, facing: 1, pose, expr: 'confident', t, act: mv.id, exercise: !A.actList.includes(mv.id), prop: A.PROPS[mv.prop], highlight: highlight ? (mv.muscles || []) : []}); ctx.restore(); };
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) { frame(mv.dur * .45); return; }
  const loop = () => { if (!document.body.contains(cv)) return; frame((performance.now() - t0) / 1000); cv._raf = requestAnimationFrame(loop); };
  loop();
}

/* ---------- Inicio ---------- */
V['gym-inicio'] = async (main) => {
  await Gym.loadCustom(); const all = Gym.all(); const ps = await App.Projects.list('gym'); const angles = await Store.list('angle');
  const pick = all[Math.floor(Math.random() * all.length)];
  main.innerHTML = App.head('Gym', 'Training Methodology Lab', 'Una enciclopedia de formas de entrenar —conocidas, poco populares, históricas y emergentes— con su evidencia, sus riesgos y un camino directo a convertirlas en videos.') + `
  <div class="hero2" id="dg"><div class="card"><canvas id="hero" style="width:100%;border-radius:12px;background:#000;display:block"></canvas></div>
  <div class="card stack"><h2>Buscar un método</h2><input id="gq" placeholder="Ej.: agarre, pliometría, kettlebell, estiramiento…"><div class="list" id="gqr"></div>
  <div class="sep"></div><div class="small">Método sugerido</div><div class="item"><div class="grow"><b>${esc(pick.n)}</b><div class="small">${esc(pick.cat)}</div></div><button class="btn sm" data-f="${pick.id}">Ver ficha</button></div></div></div>
  <div id="ideasHost" style="margin-top:16px"></div>
  <div class="grid g4" style="margin-top:16px"><div class="card kpi"><b>${all.length}</b><span>Métodos en la biblioteca</span></div><div class="card kpi"><b>${all.filter(m => ['P', 'M', 'X', 'N'].includes(m.k)).length}</b><span>Poco conocidos, emergentes o experimentales</span></div><div class="card kpi"><b>${angles.length}</b><span>Ángulos de video guardados</span></div><div class="card kpi"><b>${ps.length}</b><span>Videos de gym</span></div></div>
  <div class="card" style="margin-top:16px"><h3>Categorías</h3><div class="grid g4">${CATS.map(([k, l]) => `<button class="btn" style="justify-content:space-between;white-space:normal;text-align:left;min-height:56px" data-cat="${k}"><span>${esc(l)}</span><span class="tag">${all.filter(m => m.c === k).length}</span></button>`).join('')}</div></div>
  <div class="grid g3" style="margin-top:16px"><a class="card" href="#gym-raros" style="text-decoration:none;color:inherit"><h3>${icon('flask')} Métodos poco conocidos</h3><div class="small">Buscador de modalidades novedosas para tu audiencia, sin inventar métodos.</div></a><a class="card" href="#gym-descubrir" style="text-decoration:none;color:inherit"><h3>${icon('compass')} Descubrimiento de contenido</h3><div class="small">Ángulos originales con puntuación de originalidad, interés, competencia, utilidad y respaldo.</div></a><a class="card" href="#gym-evidencia" style="text-decoration:none;color:inherit"><h3>${icon('shield')} Evidencia y seguridad</h3><div class="small">Cómo se clasifica cada método y qué precauciones se aplican.</div></a></div>`;
  App.heroLoop($('#hero'), 'gym');
  App.ideasPanel($('#ideasHost'), 'gym');
  const res = () => { const q = $('#gq').value.trim().toLowerCase(); $('#gqr').innerHTML = q ? all.filter(m => (m.n + ' ' + m.o + ' ' + m.s + ' ' + m.cat).toLowerCase().includes(q)).slice(0, 6).map(m => `<button class="btn sm ghost" style="justify-content:flex-start;white-space:normal;text-align:left" data-f="${m.id}">${esc(m.n)}</button>`).join('') || '<div class="small">Sin resultados. Prueba en "Métodos poco conocidos".</div>' : ''; $$('#gqr [data-f]').forEach(b => b.onclick = () => openFicha(b.dataset.f)); };
  $('#gq').oninput = res;
  $$('[data-f]').forEach(b => b.onclick = () => openFicha(b.dataset.f));
  $$('[data-cat]').forEach(b => b.onclick = () => { App.state.libCat = b.dataset.cat; App.go('gym-biblioteca'); });
};
const openFicha = id => { App.state.fichaId = id; App.go('gym-ficha'); };
Gym.openFicha = openFicha;

/* ---------- Biblioteca ---------- */
V['gym-biblioteca'] = async (main) => {
  await Gym.loadCustom(); const all = Gym.all(); const ch = await nexo();
  const f = App.state.libFilter || {cat: App.state.libCat || '', k: '', e: '', l: '', q: ''}; App.state.libCat = null; App.state.libFilter = f;
  main.innerHTML = App.head('Gym', 'Biblioteca de métodos', 'Cada ficha incluye objetivo, funcionamiento, equipamiento, nivel, ventajas, riesgos, evidencia y ideas de video. Marca varias para compararlas.', `<button class="btn" id="cmpGo">${icon('compare')}Comparar seleccionados (<span id="cmpN">0</span>)</button>`) + `
  <div class="card stack"><input id="lq" placeholder="Buscar por nombre, objetivo o equipamiento" value="${esc(f.q)}">
  <div class="chips" id="fc"><button class="chip" data-c="" aria-pressed="${!f.cat}">Todas</button>${CATS.map(([k, l]) => `<button class="chip" data-c="${k}" aria-pressed="${f.cat === k}">${esc(l)}</button>`).join('')}</div>
  <div class="row"><select id="fk" style="width:auto"><option value="">Toda clasificación</option>${Object.entries(KL).map(([k, v]) => `<option value="${k}" ${f.k === k ? 'selected' : ''}>${v}</option>`).join('')}</select><select id="fe" style="width:auto"><option value="">Toda evidencia</option>${Object.entries(EV).map(([k, v]) => `<option value="${k}" ${f.e === k ? 'selected' : ''}>Evidencia ${v.toLowerCase()}</option>`).join('')}</select><select id="fl" style="width:auto"><option value="">Todo nivel</option>${Object.entries(LV).map(([k, v]) => `<option value="${k}" ${f.l === k ? 'selected' : ''}>${v}</option>`).join('')}</select><span class="small" id="fcount"></span></div></div>
  <div class="grid gauto" id="lg" style="margin-top:16px"></div>`;
  const sel = App.state.compare = App.state.compare || [];
  const draw = () => {
    const q = f.q.toLowerCase();
    const list = all.filter(m => (!f.cat || m.c === f.cat) && (!f.k || m.k === f.k) && (!f.e || m.e === f.e) && (!f.l || m.l === f.l) && (!q || (m.n + ' ' + m.o + ' ' + m.s + ' ' + m.q).toLowerCase().includes(q)));
    $('#fcount').textContent = list.length + ' métodos';
    $('#lg').innerHTML = list.map(m => `<div class="card stack" style="padding:14px"><canvas data-dc="${m.id}" style="width:100%;border-radius:10px;background:#000;aspect-ratio:16/10"></canvas><div class="small" style="color:var(--acc)">${esc(m.cat)}</div><h3 style="margin:0">${esc(m.n)}</h3><div class="small">${esc(m.o)}</div><div class="chips">${tags(m)}</div>
      <div class="row"><button class="btn sm primary" data-f="${m.id}">Ver ficha</button><label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-cmp="${m.id}" ${sel.includes(m.id) ? 'checked' : ''}>Comparar</label></div></div>`).join('') || '<div class="empty">Ningún método coincide con esos filtros.</div>';
    list.forEach(m => { const cv = $(`[data-dc="${m.id}"]`); demoCanvas(cv, m, ch, {animate: false, w: 320, h: 200}); cv.onmouseenter = () => { if (!cv.dataset.anim) { cv.dataset.anim = 1; demoCanvas(cv, m, ch, {w: 320, h: 200}); } }; });
    $$('[data-f]').forEach(b => b.onclick = () => openFicha(b.dataset.f));
    $$('[data-cmp]').forEach(c => c.onchange = () => { const id = c.dataset.cmp; const i = sel.indexOf(id); if (c.checked && i < 0) { if (sel.length >= 4) { c.checked = false; return UI.toast('Máximo 4 métodos para comparar.', 'warn'); } sel.push(id); } else if (!c.checked && i >= 0) sel.splice(i, 1); $('#cmpN').textContent = sel.length; });
    $('#cmpN').textContent = sel.length;
  };
  $('#lq').oninput = e => { f.q = e.target.value; draw(); };
  $$('#fc .chip').forEach(b => b.onclick = () => { f.cat = b.dataset.c; $$('#fc .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
  $('#fk').onchange = e => { f.k = e.target.value; draw(); }; $('#fe').onchange = e => { f.e = e.target.value; draw(); }; $('#fl').onchange = e => { f.l = e.target.value; draw(); };
  $('#cmpGo').onclick = () => App.go('gym-comparador');
  draw();
};

/* ---------- Ficha completa (16 campos) ---------- */
const similar = m => Gym.all().filter(x => x.id !== m.id && (x.m === m.m || x.c === m.c)).sort((a, b) => (b.m === m.m) - (a.m === m.m)).slice(0, 5);
const fichaAI = async (m, force) => {
  const key = 'f_' + m.id.replace(/[^\w.~:@+-]/g, ''); let d = await Store.get(key);
  if (d && !force) return d;
  const r = await AI.json(`Eres un preparador físico con criterio científico. Completa la ficha de este método para un canal educativo hispanohablante.
Método: ${m.n}
Categoría: ${m.cat}. Clasificación en la biblioteca: ${m.kl}. Nivel de evidencia asignado: ${m.ev}. Nivel recomendado: ${LV[m.l]}.
Datos base: ${m.s} Equipamiento: ${m.q}. Riesgos: ${m.r} ${m.en ? 'Nota de evidencia: ' + m.en : ''}
Reglas estrictas: no inventes estudios, autores, cifras ni porcentajes; si algo no está claro, dilo ("la evidencia es limitada"). No confundas popularidad con efectividad. No recomiendes técnicas extremas, fallo constante ni métodos avanzados a principiantes; indica si requiere supervisión; no asumas que sirve igual para adolescentes. No presentes el método como superior a series tradicionales salvo que haya buena evidencia.
Formato: {"funcionamiento":"2-3 frases","como_se_aplica":"pasos o pauta práctica general, sin prescribir cargas extremas","ventajas":["",""],"desventajas":["",""],"riesgos":["",""],"evidencia":"resumen honesto de lo que se sabe y sus limitaciones","ejemplo_practico":"","diferencias":"en qué se diferencia de métodos parecidos","ideas_video":["3 ideas de video con ángulo atractivo y riguroso"]}`, {label: 'Ficha: ' + m.n});
  d = {type: 'ficha', methodId: m.id, ...r, at: Date.now()}; await Store.set(key, d); return d;
};
V['gym-ficha'] = async (main) => {
  await Gym.loadCustom(); const m = Gym.byId(App.state.fichaId) || Gym.all()[0]; const ch = await nexo();
  const key = 'f_' + m.id.replace(/[^\w.~:@+-]/g, ''); let ai = await Store.get(key);
  const sims = similar(m);
  const li = a => Array.isArray(a) && a.length ? `<ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  const aiField = v => v ? (Array.isArray(v) ? li(v) : esc(v)) + ' <span class="ai">IA · revisar</span>' : '<span class="small mute">Pulsa "Completar ficha con IA".</span>';
  const draw = () => {
    main.innerHTML = App.head(m.cat, m.n, '', `<a class="btn" href="#gym-biblioteca">← Biblioteca</a><button class="btn" id="fCmp">${icon('compare')}Comparar</button><button class="btn primary" id="fVid">${icon('film')}Crear video</button>`) + `
    <div class="chips" style="margin:-8px 0 16px">${tags(m)}</div>
    <div class="stage"><div class="card ficha"><dl style="margin:0">
      <dt>1. Nombre</dt><dd>${esc(m.n)}</dd><dt>2. Categoría</dt><dd>${esc(m.cat)} · ${esc(m.kl)}</dd>
      <dt>3. Objetivo principal</dt><dd>${esc(m.o)}</dd><dt>4. Explicación sencilla</dt><dd>${esc(m.s)}</dd>
      <dt>5. Funcionamiento</dt><dd>${aiField(ai && ai.funcionamiento)}</dd><dt>6. Cómo se aplica</dt><dd>${aiField(ai && ai.como_se_aplica)}</dd>
      <dt>7. Equipamiento necesario</dt><dd>${esc(m.q)}</dd><dt>8. Nivel de experiencia recomendado</dt><dd>${esc(LV[m.l])}${m.sup ? ' · <b>requiere supervisión especializada</b>' : ''}</dd>
      <dt>9. Ventajas</dt><dd>${aiField(ai && ai.ventajas)}</dd><dt>10. Desventajas</dt><dd>${aiField(ai && ai.desventajas)}</dd>
      <dt>11. Riesgos y precauciones</dt><dd>${esc(m.r)}${ai && ai.riesgos ? li(ai.riesgos) + '<span class="ai">IA · revisar</span>' : ''}</dd>
      <dt>12. Evidencia científica disponible</dt><dd><span class="tag ${EVC[m.e]}">${esc(m.ev)}</span> ${esc(m.en)} ${ai && ai.evidencia ? '<div style="margin-top:6px">' + aiField(ai.evidencia) + '</div>' : ''}</dd>
      <dt>13. Ejemplo práctico</dt><dd>${aiField(ai && ai.ejemplo_practico)}</dd>
      <dt>14. Métodos similares</dt><dd>${sims.map(s => `<button class="btn sm ghost" data-f="${s.id}">${esc(s.n)}</button>`).join(' ')}</dd>
      <dt>15. Diferencias con otros sistemas</dt><dd>${aiField(ai && ai.diferencias)}</dd>
      <dt>16. Ideas para producir videos</dt><dd>${esc(m.v)}${ai && ai.ideas_video ? li(ai.ideas_video) + '<span class="ai">IA</span>' : ''}</dd></dl>
      <div class="row" style="margin-top:14px"><button class="btn primary" id="fAI">${icon('spark')}${ai ? 'Regenerar con IA' : 'Completar ficha con IA'}</button>${ai ? `<span class="small">Generada ${fmtDate(ai.at)}</span>` : ''}</div></div>
    <div class="stack"><div class="canvasbox"><canvas id="fDemo"></canvas></div><div class="row"><div class="chips"><button class="chip" id="v3d" aria-pressed="true">Vista 3D</button><button class="chip" id="v2d" aria-pressed="false">Vista 2D</button></div><label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="fHl"> Resaltar músculos implicados</label></div>
      <div class="card small">Demostración: <b>${esc((A.MOVES[m.m] || {}).label || '')}</b>. La vista 3D usa el motor 3D propio de la app (gratis, en tu navegador); la cámara gira alrededor del personaje.</div>
      ${m.sup || m.k === 'X' || m.k === 'N' ? `<div class="note bad">${m.sup ? 'Requiere supervisión especializada. ' : ''}${m.k === 'X' ? 'Método experimental: preséntalo como tal. ' : ''}${m.k === 'N' ? 'Sin evidencia suficiente: no lo presentes como eficaz. ' : ''}</div>` : ''}
      ${m.l === 'A' ? '<div class="note">Método avanzado: en los videos, aclara que no es para principiantes ni para adolescentes sin supervisión.</div>' : ''}</div></div>`;
    let three = true; const redraw = () => demoCanvas($('#fDemo'), m, ch, {w: 520, h: 420, highlight: $('#fHl').checked, three});
    redraw(); $('#fHl').onchange = redraw;
    $('#v3d').onclick = () => { three = true; $('#v3d').setAttribute('aria-pressed', true); $('#v2d').setAttribute('aria-pressed', false); redraw(); };
    $('#v2d').onclick = () => { three = false; $('#v2d').setAttribute('aria-pressed', true); $('#v3d').setAttribute('aria-pressed', false); redraw(); };
    $$('[data-f]').forEach(b => b.onclick = () => openFicha(b.dataset.f));
    $('#fAI').onclick = e => UI.busy(e.currentTarget, async () => { ai = await fichaAI(m, true); draw(); }, 'Investigando…');
    $('#fCmp').onclick = () => { const s = App.state.compare = App.state.compare || []; if (!s.includes(m.id)) s.push(m.id); App.go('gym-comparador'); };
    $('#fVid').onclick = () => videoFormats(m);
  };
  draw();
};
/* 8 formatos de video desde una ficha */
function videoFormats(m) {
  const dur = {Short: 30, 'Video tipo documental': 90, 'Video comparativo': 60, 'Video explicativo': 60, 'Video de curiosidades': 30, 'Video demostrativo': 30, 'Animación anatómica': 30, 'Demostración 3D': 30};
  const {el, close} = UI.modal(`<h2>Crear video sobre ${esc(m.n)}</h2><p class="small">Elige el formato. Se abrirá la producción con la ficha como contexto; NEXO demostrará el método.</p>
    <div class="grid g2">${App.GYM_FORMATS.map(f => `<button class="btn" style="justify-content:space-between;min-height:56px;white-space:normal;text-align:left" data-fmt="${esc(f)}"><span>${esc(f)}</span><span class="small">${dur[f]} s</span></button>`).join('')}</div>
    <div class="note info" style="margin-top:12px">En los videos de Gym, cuando el personaje habla a la cámara se anima en 2D y las demostraciones del ejercicio se renderizan en 3D con el motor propio de la app (maniquí 3D estilizado, cámara que gira y músculos resaltados). No es un modelo anatómico médico.</div>
    <div class="row end" style="margin-top:12px"><button class="btn" data-close>Cerrar</button></div>`);
  el.querySelectorAll('[data-fmt]').forEach(b => b.onclick = () => { const f = b.dataset.fmt; close(); App.state.newProject = {module: 'gym', init: {idea: `${f}: ${m.n}. ${m.o}.`, category: m.cat, methodId: m.id, formatHint: f, duration: dur[f], format: f === 'Video tipo documental' ? 'horizontal' : 'vertical', cast: ['volt']}}; App.go('gym-crear'); });
}
Gym.videoFormats = videoFormats;

/* ---------- Comparador ---------- */
V['gym-comparador'] = async (main) => {
  await Gym.loadCustom(); const all = Gym.all(); const sel = App.state.compare = App.state.compare || []; const ch = await nexo();
  main.innerHTML = App.head('Gym', 'Comparador de metodologías', 'Compara dos o más métodos lado a lado para mostrar sus diferencias.') + `
  <div class="card row"><select id="cAdd" style="flex:1;min-width:220px"><option value="">Añadir método…</option>${CATS.map(([k, l]) => `<optgroup label="${esc(l)}">${all.filter(m => m.c === k).map(m => `<option value="${m.id}">${esc(m.n)}</option>`).join('')}</optgroup>`).join('')}</select><button class="btn" id="cClear">Vaciar</button><button class="btn primary" id="cAI">${icon('spark')}Análisis comparativo con IA</button></div>
  <div id="cBody" style="margin-top:16px"></div><div id="cAIOut" style="margin-top:16px"></div>`;
  const draw = () => {
    const ms = sel.map(id => Gym.byId(id)).filter(Boolean);
    if (!ms.length) { $('#cBody').innerHTML = '<div class="empty">Añade al menos dos métodos.</div>'; return; }
    const rows = [['Animación', m => `<canvas data-cc="${m.id}" style="width:100%;max-width:220px;border-radius:8px;background:#000"></canvas>`], ['Categoría', m => esc(m.cat)], ['Clasificación', m => `<span class="tag ${KLC[m.k]}">${esc(m.kl)}</span>`], ['Evidencia', m => `<span class="tag ${EVC[m.e]}">${esc(m.ev)}</span> <span class="small">${esc(m.en)}</span>`], ['Objetivo', m => esc(m.o)], ['Explicación', m => esc(m.s)], ['Equipamiento', m => esc(m.q)], ['Nivel', m => esc(LV[m.l]) + (m.sup ? ' · supervisión' : '')], ['Riesgos', m => esc(m.r)], ['', m => `<button class="btn sm" data-rm="${m.id}">Quitar</button> <button class="btn sm" data-f="${m.id}">Ficha</button>`]];
    $('#cBody').innerHTML = `<div class="card scroll"><table style="min-width:${ms.length * 220 + 120}px"><thead><tr><th></th>${ms.map(m => `<th style="color:var(--ink);font-size:15px">${esc(m.n)}</th>`).join('')}</tr></thead><tbody>${rows.map(([l, f]) => `<tr><th>${l}</th>${ms.map(m => `<td>${f(m)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    ms.forEach(m => demoCanvas($(`[data-cc="${m.id}"]`), m, ch, {w: 300, h: 220}));
    $$('[data-rm]').forEach(b => b.onclick = () => { sel.splice(sel.indexOf(b.dataset.rm), 1); draw(); });
    $$('[data-f]').forEach(b => b.onclick = () => openFicha(b.dataset.f));
  };
  $('#cAdd').onchange = e => { const id = e.target.value; if (id && !sel.includes(id)) { if (sel.length >= 4) UI.toast('Máximo 4 métodos.', 'warn'); else sel.push(id); } e.target.value = ''; draw(); };
  $('#cClear').onclick = () => { sel.length = 0; draw(); $('#cAIOut').innerHTML = ''; };
  $('#cAI').onclick = e => UI.busy(e.currentTarget, async () => {
    const ms = sel.map(id => Gym.byId(id)).filter(Boolean); if (ms.length < 2) return UI.toast('Añade al menos dos métodos.', 'warn');
    const r = await AI.json(`Compara con rigor científico estos métodos de entrenamiento para una audiencia general:
${ms.map(m => `- ${m.n}: ${m.s} (evidencia asignada: ${m.ev}; nivel: ${LV[m.l]})`).join('\n')}
No inventes estudios ni cifras. No confundas popularidad con efectividad. Señala para quién conviene cada uno y precauciones.
Formato: {"resumen":"","criterios":[{"criterio":"","valores":["uno por método en el mismo orden"]}],"cuando_elegir":["uno por método"],"idea_video":"un ángulo de video comparativo atractivo y riguroso"}`, {label: 'Comparación de métodos'});
    $('#cAIOut').innerHTML = `<div class="card stack"><div class="row between"><h3 style="margin:0">Análisis comparativo</h3><span class="ai">Generado con IA · revisar</span></div><p>${esc(r.resumen)}</p>
      <div class="scroll"><table><thead><tr><th>Criterio</th>${ms.map(m => `<th>${esc(m.n)}</th>`).join('')}</tr></thead><tbody>${(r.criterios || []).map(c => `<tr><th>${esc(c.criterio)}</th>${ms.map((m, i) => `<td>${esc((c.valores || [])[i] || '')}</td>`).join('')}</tr>`).join('')}<tr><th>Cuándo elegirlo</th>${ms.map((m, i) => `<td>${esc((r.cuando_elegir || [])[i] || '')}</td>`).join('')}</tr></tbody></table></div>
      ${r.idea_video ? `<div class="row"><div class="grow"><b>Idea de video:</b> ${esc(r.idea_video)}</div><button class="btn primary" id="cMake">${icon('film')}Producir video comparativo</button></div>` : ''}</div>`;
    const mk = $('#cMake'); if (mk) mk.onclick = () => { App.state.newProject = {module: 'gym', init: {idea: r.idea_video, methodId: ms[0].id, formatHint: 'Video comparativo', duration: 60, cast: ['volt']}}; App.go('gym-crear'); };
  }, 'Comparando…');
  draw();
};

/* ---------- Métodos poco conocidos ---------- */
V['gym-raros'] = async (main) => {
  await Gym.loadCustom(); const all = Gym.all();
  const rare = all.filter(m => ['P', 'S', 'M', 'X', 'N'].includes(m.k));
  main.innerHTML = App.head('Gym', 'Buscador de métodos poco conocidos', 'Métodos menos difundidos, técnicas de deportes concretos, métodos históricos, variaciones poco explicadas e investigaciones recientes. Nada se inventa para parecer revolucionario.') + `
  <div class="card stack"><h3>Investigar con IA</h3><div class="grid g3"><label class="f">Disciplina o deporte<input id="rDisc" placeholder="Ej.: escalada, lucha, atletismo, strongman"></label><label class="f">Objetivo<input id="rGoal" placeholder="Ej.: agarre, estabilidad, potencia"></label><label class="f">Tipo<select id="rType"><option>Cualquiera</option><option>Métodos históricos</option><option>Técnicas de deportes específicos</option><option>Variaciones poco explicadas de ejercicios</option><option>Combinaciones de modalidades</option><option>Investigaciones recientes</option><option>Conceptos que los principiantes desconocen</option></select></label></div>
  <button class="btn primary" id="rGo">${icon('spark')}Buscar métodos</button><div class="small">La IA debe clasificar cada hallazgo y no puede inventar métodos, estudios ni cifras. Si propone algo dudoso, se marca como "sin evidencia suficiente". Revisa siempre antes de publicar.</div></div>
  <div id="rOut" style="margin-top:16px"></div>
  <h2 style="margin-top:24px">En la biblioteca (${rare.length})</h2><div class="chips" id="rk">${['P', 'S', 'M', 'X', 'N'].map(k => `<button class="chip" data-k="${k}" aria-pressed="false">${KL[k]}</button>`).join('')}</div><div class="grid gauto" id="rList" style="margin-top:12px"></div>`;
  let kf = '';
  const draw = () => { $('#rList').innerHTML = rare.filter(m => !kf || m.k === kf).map(m => `<div class="card stack"><h3 style="margin:0">${esc(m.n)}</h3><div class="chips">${tags(m)}</div><div class="small">${esc(m.s)}</div><div class="small mute">Video: ${esc(m.v)}</div><div class="row"><button class="btn sm" data-f="${m.id}">Ficha</button><button class="btn sm primary" data-v="${m.id}">${icon('film')}Video</button></div></div>`).join(''); $$('#rList [data-f]').forEach(b => b.onclick = () => openFicha(b.dataset.f)); $$('#rList [data-v]').forEach(b => b.onclick = () => videoFormats(Gym.byId(b.dataset.v))); };
  $$('#rk .chip').forEach(b => b.onclick = () => { kf = kf === b.dataset.k ? '' : b.dataset.k; $$('#rk .chip').forEach(x => x.setAttribute('aria-pressed', x.dataset.k === kf)); draw(); });
  draw();
  $('#rGo').onclick = e => UI.busy(e.currentTarget, async () => {
    const r = await AI.json(`Busca métodos y modalidades de entrenamiento que puedan resultar novedosos para una audiencia general hispanohablante.
Disciplina: ${$('#rDisc').value || 'cualquiera'}. Objetivo: ${$('#rGoal').value || 'cualquiera'}. Tipo: ${$('#rType').value}.
Ya están en la biblioteca (no los repitas): ${all.map(m => m.n).join('; ')}.
Reglas: solo métodos que existen de verdad; no inventes nombres, estudios ni cifras; clasifica honestamente cada uno con una de estas claves: E (establecido), S (especializado), P (poco conocido), M (emergente), X (experimental), N (sin evidencia suficiente). Evidencia: A alta, M moderada, L limitada, B baja. Nivel: P principiante, I intermedio, A avanzado. Indica si requiere supervisión. Propón un título de video con ángulo de curiosidad pero sin exagerar.
Movimiento para la animación (elige el más cercano): ${A.moveList.map(m => m.id).join('|')}.
Formato: {"metodos":[{"nombre":"","disciplina":"","categoria":"A-H según: ${CATS.map(c => c[0] + ' ' + c[1]).join('; ')}","clasificacion":"P","evidencia":"L","nivel":"I","equipamiento":"","objetivo":"","explicacion":"","precauciones":"","supervision":false,"movimiento":"","titulo_video":"","por_que_interesa":""}]}`, {label: 'Buscador de métodos poco conocidos'});
    const found = (r.metodos || []).slice(0, 8);
    $('#rOut').innerHTML = `<div class="grid gauto">${found.map((m, i) => `<div class="card stack"><div class="row between"><h3 style="margin:0">${esc(m.nombre)}</h3><span class="ai">IA · verificar</span></div><div class="chips"><span class="tag ${KLC[m.clasificacion] || ''}">${esc(KL[m.clasificacion] || m.clasificacion)}</span><span class="tag ${EVC[m.evidencia] || ''}">Evidencia ${esc((EV[m.evidencia] || m.evidencia || '').toLowerCase())}</span>${m.supervision ? '<span class="tag bad">Supervisión</span>' : ''}</div><div class="small"><b>${esc(m.disciplina)}</b> · ${esc(m.explicacion)}</div><div class="small"><b>Precauciones:</b> ${esc(m.precauciones)}</div><div class="small"><b>Idea de video:</b> ${esc(m.titulo_video)}</div><div class="row"><button class="btn sm" data-add="${i}">${icon('plus')}Añadir a la biblioteca</button><button class="btn sm primary" data-mk="${i}">${icon('film')}Producir</button></div></div>`).join('') || '<div class="empty">Sin resultados.</div>'}</div>`;
    $$('[data-add]').forEach(b => b.onclick = async () => { const m = found[+b.dataset.add]; const id = 'm_' + uid(); const rec = {type: 'method', n: m.nombre, c: CATS.some(c => c[0] === m.categoria) ? m.categoria : 'F', k: KL[m.clasificacion] ? m.clasificacion : 'N', e: EV[m.evidencia] ? m.evidencia : 'B', l: LV[m.nivel] ? m.nivel : 'I', q: m.equipamiento || '', o: m.objetivo || '', s: m.explicacion || '', r: m.precauciones || '', m: A.MOVES[m.movimiento] ? m.movimiento : 'idle', sup: !!m.supervision, v: m.titulo_video || '', en: 'Añadido con IA: verifica la información.', bg: 'gimnasio', source: m.disciplina}; await Store.set(id, rec); b.disabled = true; b.textContent = 'Añadido'; UI.toast('Añadido a la biblioteca con la etiqueta "verificar".'); });
    $$('[data-mk]').forEach(b => b.onclick = () => { const m = found[+b.dataset.mk]; App.state.newProject = {module: 'gym', init: {idea: `${m.titulo_video}. ${m.explicacion} Precauciones: ${m.precauciones}`, duration: 60, cast: ['volt']}}; App.go('gym-crear'); });
  }, 'Investigando…');
};

/* ---------- Descubrimiento de contenido original ---------- */
V['gym-descubrir'] = async (main) => {
  let saved = await Store.list('angle');
  main.innerHTML = App.head('Gym', 'Descubrimiento de contenido original', 'No basta con un método: busca el ángulo audiovisual que hace que alguien quiera ver el video. Cada propuesta se puntúa de 1 a 10.') + `
  <div class="card stack"><div class="row"><input id="dq" placeholder="Tema o ejercicio (ej.: sentadilla, agarre, cardio)" style="flex:1;min-width:220px"><button class="btn primary" id="dGo">${icon('spark')}Buscar ángulos</button></div>
  <div class="small">Las puntuaciones son estimaciones de la IA, no datos de plataformas. "Competencia" alta = poca competencia (más hueco para ti). "Respaldo" = cuánto apoyo científico tiene la información.</div></div>
  <div id="dOut" style="margin-top:16px"></div><h2 style="margin-top:24px">Ángulos guardados</h2><div class="grid gauto" id="dSaved"></div>`;
  const score = a => { const s = a.puntuaciones || {}; return ['originalidad', 'interes', 'competencia', 'utilidad', 'respaldo'].reduce((t, k) => t + (+s[k] || 0), 0); };
  const card = (a, i, isSaved) => `<div class="card stack"><div class="row between"><span class="tag acc">${esc(a.formato || 'Video')}</span><b style="font-family:Archivo;font-size:22px">${score(a)}<span class="small">/50</span></b></div><h3 style="margin:0">${esc(a.titulo)}</h3><div class="small">${esc(a.enfoque)}</div>
    ${UI.scoreBar('Originalidad', a.puntuaciones.originalidad)}${UI.scoreBar('Interés', a.puntuaciones.interes)}${UI.scoreBar('Competencia', a.puntuaciones.competencia)}${UI.scoreBar('Utilidad', a.puntuaciones.utilidad)}${UI.scoreBar('Respaldo', a.puntuaciones.respaldo)}
    ${a.rigor ? `<div class="small mute">${esc(a.rigor)}</div>` : ''}<div class="row">${isSaved ? `<button class="btn sm danger" data-del="${a._id}">${icon('trash')}</button>` : `<button class="btn sm" data-save="${i}">Guardar</button>`}<button class="btn sm primary" data-make="${isSaved ? a._id : i}" data-s="${isSaved ? 1 : 0}">${icon('film')}Producir</button></div></div>`;
  let found = [];
  const make = a => { App.state.newProject = {module: 'gym', init: {idea: `${a.titulo}. ${a.enfoque}`, formatHint: a.formato, duration: /short/i.test(a.formato || '') ? 30 : 60, cast: ['volt']}}; App.go('gym-crear'); };
  const draw = () => {
    $('#dSaved').innerHTML = saved.sort((a, b) => score(b) - score(a)).map((a, i) => card(a, i, true)).join('') || '<div class="empty">Ninguno guardado.</div>';
    $('#dOut').innerHTML = found.length ? `<div class="grid gauto">${found.map((a, i) => card(a, i, false)).join('')}</div>` : '';
    $$('[data-save]').forEach(b => b.onclick = async () => { const a = found[+b.dataset.save]; const id = 'a_' + uid(); const rec = {type: 'angle', ...a}; await Store.set(id, rec); rec._id = id; saved.push(rec); found.splice(+b.dataset.save, 1); draw(); });
    $$('[data-del]').forEach(b => b.onclick = async () => { await Store.del(b.dataset.del); saved = saved.filter(a => a._id !== b.dataset.del); draw(); });
    $$('[data-make]').forEach(b => b.onclick = () => make(b.dataset.s === '1' ? saved.find(a => a._id === b.dataset.make) : found[+b.dataset.make]));
  };
  draw();
  $('#dGo').onclick = e => UI.busy(e.currentTarget, async () => {
    const q = $('#dq').value.trim(); if (!q) return UI.toast('Escribe un tema.', 'warn');
    const related = Gym.all().filter(m => (m.n + ' ' + m.o + ' ' + m.s).toLowerCase().includes(q.toLowerCase().split(' ')[0])).slice(0, 8).map(m => m.n);
    const r = await AI.json(`Eres productor de un canal faceless de entrenamiento con rigor científico. Tema: "${q}".
Métodos relacionados en nuestra biblioteca: ${related.join('; ') || 'ninguno'}.
Propón 6 ángulos audiovisuales ORIGINALES (no el típico "cómo hacer X"), como: cómo cambia el movimiento según la anatomía, diferencias entre variantes con animación, cómo entrenan atletas de distintos deportes, equipamiento poco convencional, qué ocurre en músculos y articulaciones. Busca curiosidad aunque no sea el tema más popular, combinando utilidad real, entretenimiento, rigor y originalidad.
Puntúa de 1 a 10: originalidad, interes, competencia (10 = poca competencia), utilidad, respaldo (apoyo científico de la información). Sé honesto: si algo tiene poco respaldo, puntúalo bajo.
Formato: {"angulos":[{"titulo":"","enfoque":"","formato":"Short|Video explicativo|Video comparativo|Video de curiosidades|Video demostrativo|Video tipo documental|Animación anatómica","puntuaciones":{"originalidad":0,"interes":0,"competencia":0,"utilidad":0,"respaldo":0},"rigor":"nota breve sobre la evidencia o precauciones"}]}`, {label: 'Descubrimiento de contenido'});
    found = (r.angulos || []).map(a => ({...a, tema: q, puntuaciones: a.puntuaciones || {}})); draw();
  }, 'Buscando ángulos…');
};

/* ---------- Evidencia y seguridad ---------- */
V['gym-evidencia'] = async (main) => {
  const all = Gym.all();
  main.innerHTML = App.head('Gym', 'Evidencia y seguridad', 'Cómo clasifica la biblioteca cada método y qué reglas siguen todos los guiones y fichas.') + `
  <div class="grid g2"><div class="card"><h3>Clasificación de métodos</h3><table class="stack-t"><thead><tr><th>Clase</th><th>Significado</th><th class="num">Métodos</th></tr></thead><tbody>
    ${[['E', 'Uso amplio y bien documentado.'], ['S', 'Útil en contextos concretos (deportes, objetivos específicos) o con material especial.'], ['P', 'Existe y tiene sentido, pero se explica poco en canales convencionales.'], ['M', 'Investigación reciente con resultados prometedores, aún en desarrollo.'], ['X', 'Se practica, pero con evidencia escasa y riesgos discutidos.'], ['N', 'Popular o tradicional, sin estudios suficientes que lo respalden.']].map(([k, d]) => `<tr><td><span class="tag ${KLC[k]}">${KL[k]}</span></td><td>${d}</td><td class="num">${all.filter(m => m.k === k).length}</td></tr>`).join('')}</tbody></table></div>
  <div class="card"><h3>Niveles de evidencia</h3><table class="stack-t"><thead><tr><th>Nivel</th><th>Qué quiere decir</th></tr></thead><tbody>
    <tr><td><span class="tag ok">Alta</span></td><td>Muchos estudios coinciden; es improbable que cambie.</td></tr><tr><td><span class="tag info">Moderada</span></td><td>Buena base, con matices o poblaciones limitadas.</td></tr>
    <tr><td><span class="tag warn">Limitada</span></td><td>Pocos estudios, muestras pequeñas o resultados mixtos.</td></tr><tr><td><span class="tag bad">Baja o insuficiente</span></td><td>Experiencia práctica o tradición, sin investigación sólida.</td></tr></tbody></table></div></div>
  <div class="card" style="margin-top:16px"><h3>Reglas que aplica la app en fichas y guiones</h3><ul>
    <li>No confundir popularidad con efectividad: que un método sea viral no lo hace mejor.</li>
    <li>No presentar técnicas de intensidad (drop sets, rest-pause, etc.) como superiores a las series tradicionales.</li>
    <li>No recomendar técnicas extremas, cargas peligrosas, entrenar siempre al fallo ni métodos avanzados a personas sin experiencia.</li>
    <li>Los métodos que requieren supervisión especializada lo indican claramente (${all.filter(m => m.sup).length} en la biblioteca).</li>
    <li>La restricción del flujo sanguíneo (BFR) se trata como práctica especializada, nunca como recomendación general.</li>
    <li>Los programas para adultos no se asumen apropiados para adolescentes.</li>
    <li>No se inventan estudios, autores, cifras ni métodos para que parezcan revolucionarios; lo generado por IA lleva la etiqueta "revisar".</li>
    <li>Este contenido es educativo y no sustituye la valoración de un profesional sanitario o de un entrenador cualificado.</li></ul></div>
  <div class="card" style="margin-top:16px"><h3>Métodos que requieren supervisión</h3><div class="chips">${all.filter(m => m.sup).map(m => `<button class="chip" data-f="${m.id}">${esc(m.n)}</button>`).join('')}</div></div>`;
  $$('[data-f]').forEach(b => b.onclick = () => openFicha(b.dataset.f));
};

V['gym-crear'] = main => App.productionView(main, 'gym');
V['gym-videos'] = main => App.videosView(main, 'gym');
V['gym-personajes'] = main => App.charactersView(main, 'gym');
})();
