'use strict';
/* ============ Estudio de Finanzas + pantallas generales (costos y configuración) ============ */
(() => {
const {esc, uid, clone, fmtDate, fmtBytes, $, $$} = App.util;
const {UI, AI, Store, Files, Usage, Voice, icon, Caps} = App;
const E = App.Engine, A = App.Art, V = App.views;

/* ---------- Dashboard ---------- */
V['fin-dashboard'] = async (main) => {
  const ps = await App.Projects.list('fin'); const u = Usage.doc && Usage.doc.months[new Date().toISOString().slice(0, 7)] || {};
  const brand = await App.Lib.brand('fin');
  main.innerHTML = App.head('Finanzas', brand.name ? brand.name : 'Estudio de finanzas faceless', 'Convierte una idea en un video animado 2D con guion, personajes, voces, subtítulos, miniatura y control de calidad.') + `
  <div class="hero2" id="dg">
    <div class="card stack" style="padding:22px"><h2>¿De qué trata tu próximo video?</h2>
      <textarea id="qIdea" placeholder="Ej.: 5 gastos hormiga que se comen tu sueldo sin que lo notes" style="min-height:110px"></textarea>
      <div class="row"><select id="qCat" style="width:auto">${App.FIN_CATS.map(c => `<option>${esc(c)}</option>`).join('')}</select><select id="qDur" style="width:auto" aria-label="Duración">${App.DUR_PRESETS.map(d => `<option value="${d}" ${d === 30 ? 'selected' : ''}>${App.fmtDur(d)}</option>`).join('')}</select><button class="btn primary big" id="qGo">${icon('spark', 20)}Crear video</button></div></div>
    <div class="card"><canvas id="hero" style="width:100%;border-radius:12px;background:#000;display:block"></canvas></div>
  </div>
  <div id="ideasHost" style="margin-top:16px"></div>
  <div class="grid g4" style="margin-top:16px">
    <div class="card kpi"><b>${ps.length}</b><span>Proyectos</span></div><div class="card kpi"><b>${ps.filter(p => p.render).length}</b><span>Videos renderizados</span></div>
    <div class="card kpi"><b>${ps.filter(p => p.qa && p.qa.approved).length}</b><span>Aprobados por calidad</span></div><div class="card kpi"><b style="color:var(--acc)">RD$0</b><span>Gasto acumulado · ${u.ai || 0} usos de IA este mes</span></div></div>
  <div class="grid g2" style="margin-top:16px"><div class="card"><div class="row between"><h3>Recientes</h3><a href="#fin-videos" class="small">Ver todos</a></div><div class="list">${ps.slice(0, 5).map(p => { const [st, cls] = App.Projects.status(p); return `<div class="item"><div class="grow"><b>${esc(p.title || p.idea || 'Sin título')}</b><div class="small">${fmtDate(p.updatedAt)} · ${App.fmtDur(p.duration)}</div></div><span class="tag ${cls}">${st}</span><button class="btn sm" data-open="${p.id}">Abrir</button></div>`; }).join('') || '<div class="empty">Aún no hay proyectos.</div>'}</div></div>
  <div class="card"><h3>Atajos</h3><div class="grid g2"><a class="btn" href="#fin-ideas">${icon('bulb')}Banco de ideas</a><a class="btn" href="#fin-identidad">${icon('tag')}Nombre y logo</a><a class="btn" href="#fin-personajes">${icon('users')}Personajes</a><a class="btn" href="#fin-investigacion">${icon('search')}Investigación</a><button class="btn" id="toGym">${icon('dumbbell')}Ir al estudio Gym</button><a class="btn" href="#fin-costos">${icon('coin')}Control de costos</a></div></div></div>`;
  $('#qGo').onclick = () => { const idea = $('#qIdea').value.trim(); if (!idea) return UI.toast('Escribe una idea.', 'warn'); App.state.newProject = {module: 'fin', init: {idea, category: $('#qCat').value, duration: +$('#qDur').value}}; App.go('fin-crear'); };
  $('#toGym').onclick = () => App.switchStudio('gym');
  $$('[data-open]').forEach(b => b.onclick = () => App.openProject('fin', b.dataset.open));
  heroLoop($('#hero'), 'fin');
  App.ideasPanel($('#ideasHost'), 'fin');
};
/* escena animada de portada */
async function heroLoop(cv, mod) {
  const all = await App.Lib.chars(); const alien = all.find(c => A.isImage(c) && App.charIn(c, 'gym')); if (alien) await A.preload([alien]);
  const chars = A.defaultCharacters.concat(alien ? [alien] : []); const gid = alien ? alien.id : 'tomi';
  const tl = E.build({format: 'horizontal', module: mod, subs: false, progressBar: false, storyboard: {scenes: mod === 'fin'
    ? [{bg: 'estudio', chars: [{id: 'tomi', pos: 'izq', act: 'present', expr: 'confident'}, {id: 'boli', pos: 'der', act: 'think', expr: 'thinking'}], speaker: 'tomi', dialogue: 'Antes de gastar, mira a dónde va cada peso.', text: 'Tu dinero, claro', objects: ['chart_up', 'piggy'], camera: 'zoom_in', dur: 5, transition: 'cut'},
       {bg: 'ciudad', chars: [{id: 'tomi', pos: 'izq', act: 'talk', expr: 'happy'}, {id: 'boli', pos: 'der', act: 'celebrate', expr: 'excited'}], speaker: 'tomi', dialogue: 'Paso a paso.', text: 'Aprende y crece', objects: ['coins'], camera: 'push_speaker', dur: 5, transition: 'wipe'}]
    : [{bg: 'gimnasio', chars: [{id: gid, move: 'kbswing'}], speaker: 'narrador', dialogue: '', text: 'Training Lab', objects: ['muscle'], camera: 'zoom_in', dur: 4, transition: 'cut', highlight: true},
       {bg: 'patio', chars: [{id: gid, move: 'carry'}], speaker: 'narrador', dialogue: '', text: 'Métodos distintos', objects: [], camera: 'pan_left', dur: 4, transition: 'slide'},
       {bg: 'muro', chars: [{id: gid, move: 'climb'}], speaker: 'narrador', dialogue: '', text: 'Con evidencia', objects: ['book'], camera: 'zoom_out', dur: 4, transition: 'fade'}]}}, chars);
  const res = .4; cv.width = tl.W * res; cv.height = tl.H * res; const ctx = cv.getContext('2d'); const t0 = performance.now();
  const loop = () => { if (!document.body.contains(cv)) return; ctx.save(); ctx.scale(res, res); E.drawFrame(ctx, tl, ((performance.now() - t0) / 1000) % tl.duration); ctx.restore(); requestAnimationFrame(loop); };
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) loop(); else { ctx.scale(res, res); E.drawFrame(ctx, tl, 2); }
}
App.heroLoop = heroLoop;

V['fin-crear'] = main => App.productionView(main, 'fin');
V['fin-personajes'] = main => App.charactersView(main, 'fin');
V['fin-videos'] = main => App.videosView(main, 'fin');

/* ---------- Ideas ---------- */
const ideasView = async (main, mod) => {
  const key = 'ideas_' + mod; const bank = await Store.get(key) || {type: 'ideas', list: []};
  const cats = mod === 'fin' ? App.FIN_CATS : App.Gym.CATS.map(c => c[1]);
  main.innerHTML = App.head(mod === 'fin' ? 'Finanzas' : 'Gym', 'Ideas', 'Banco de ideas por categoría. Genera, guarda y convierte cualquier idea en un video con un clic.') + `
   <div class="card stack"><div class="row"><select id="iCat" style="width:auto">${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select><input id="iHint" placeholder="Enfoque opcional (ej.: para estudiantes, con poco dinero…)" style="flex:1;min-width:200px"><button class="btn primary" id="iGen">${icon('spark')}Generar 8 ideas${AI.available() ? '' : ' (sin IA)'}</button></div>
   <div class="small">Las ideas son originales y educativas; no se basan en copiar videos existentes.</div></div>
   <div class="grid gauto" id="iList" style="margin-top:16px"></div>`;
  const draw = () => { $('#iList').innerHTML = bank.list.length ? bank.list.map((x, i) => `<div class="card stack"><span class="tag">${esc(x.cat)}</span><h3 style="margin:0">${esc(x.titulo)}</h3><div class="small">${esc(x.angulo || '')}</div><div class="row"><button class="btn sm primary" data-make="${i}">${icon('film')}Producir</button><button class="btn sm danger" data-rm="${i}" aria-label="Quitar">${icon('trash')}</button></div></div>`).join('') : '<div class="empty">Tu banco de ideas está vacío.</div>';
    $$('[data-make]').forEach(b => b.onclick = () => { const x = bank.list[+b.dataset.make]; App.Ideas.produce(mod, x); });
    $$('[data-rm]').forEach(b => b.onclick = async () => { bank.list.splice(+b.dataset.rm, 1); await Store.set(key, bank); draw(); }); };
  draw();
  $('#iGen').onclick = e => UI.busy(e.currentTarget, async () => {
    const cat = $('#iCat').value;
    if (!AI.available()) { const gen = mod === 'fin' ? App.Ideas.generate('fin', 8, {cat, hint: $('#iHint').value}) : App.Ideas.generate('gym', 8, {catKey: (App.Gym.CATS.find(c => c[1] === cat) || [])[0], hint: $('#iHint').value}); bank.list = gen.map(x => ({titulo: x.titulo, angulo: x.angulo, cat, dur: x.dur, methodId: x.methodId})).concat(bank.list).slice(0, 120); await Store.set(key, bank); draw(); UI.toast('Ideas creadas sin IA (generador incluido).'); return; }
    const r = await AI.json(`Propón 8 ideas originales de videos cortos para un canal faceless de ${mod === 'fin' ? 'educación financiera y emprendimiento para principiantes hispanohablantes' : 'entrenamiento físico con rigor científico'}.
Categoría: ${cat}. ${$('#iHint').value ? 'Enfoque: ' + $('#iHint').value : ''}
Variedad de formatos (historia, error común, comparación, mito vs realidad, paso a paso). Nada de promesas de dinero fácil${mod === 'gym' ? ' ni métodos extremos para principiantes' : ''}; no inventes estadísticas.
Formato: {"ideas":[{"titulo":"","angulo":"1 frase sobre el enfoque"}]}`, {label: 'Banco de ideas', tier: 'quick'});
    bank.list = (r.ideas || []).map(x => ({...x, cat})).concat(bank.list).slice(0, 120); await Store.set(key, bank); draw();
  }, 'Pensando…');
};
App.ideasView = ideasView;
V['fin-ideas'] = main => ideasView(main, 'fin');

/* ---------- Investigación ---------- */
const researchView = async (main, mod) => {
  const refs = (await Store.list('ref')).filter(r => r.module === mod);
  main.innerHTML = App.head(mod === 'fin' ? 'Finanzas' : 'Gym', 'Investigación e inspiración', 'Busca referencias en las plataformas y analiza su estructura para crear videos originales. Nunca se copian guiones, personajes, voces ni diseños.') + `
  <div class="grid g2"><div class="card stack"><h3>1. Buscar en las plataformas</h3><label class="f">Tema<input id="rq" placeholder="${mod === 'fin' ? 'ej.: presupuesto 50/30/20' : 'ej.: entrenamiento de agarre'}"></label>
    <div class="row" id="rLinks"></div>
    <div class="note info">No existe una fuente gratuita y autorizada que esta página pueda consultar automáticamente en YouTube, TikTok o Instagram, así que la búsqueda se abre en la plataforma. La app no inventa visualizaciones ni estadísticas: solo guarda las métricas públicas que tú copies.</div></div>
  <div class="card stack"><h3>2. Analizar una referencia</h3>
    <div class="grid g2"><label class="f">Enlace<input id="rUrl" placeholder="https://…"></label><label class="f">Plataforma<select id="rPlat"><option>YouTube</option><option>TikTok</option><option>Instagram</option><option>Otra</option></select></label></div>
    <label class="f">Título<input id="rTitle"></label>
    <div class="grid g3"><label class="f">Vistas (las que viste)<input id="rViews" inputmode="numeric"></label><label class="f">Me gusta<input id="rLikes" inputmode="numeric"></label><label class="f">Comentarios<input id="rComm" inputmode="numeric"></label></div>
    <label class="f">Descripción, transcripción o tus notas del video<textarea id="rText" placeholder="Pega aquí la transcripción o describe qué pasa en cada parte"></textarea></label>
    ${Caps.images ? '<label class="f">Captura de la miniatura (opcional)<input type="file" id="rImg" accept="image/*"></label>' : ''}
    <button class="btn primary" id="rGo">${icon('spark')}Analizar y guardar</button></div></div>
  <h2 style="margin-top:24px">Referencias guardadas</h2><div class="list" id="rList"></div>`;
  const links = () => { const q = encodeURIComponent($('#rq').value.trim() || (mod === 'fin' ? 'finanzas personales' : 'métodos de entrenamiento')); $('#rLinks').innerHTML = `<a class="btn sm" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${q}">YouTube</a><a class="btn sm" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${q}&sp=EgIQCQ%253D%253D">YouTube Shorts</a><a class="btn sm" target="_blank" rel="noopener" href="https://www.tiktok.com/search?q=${q}">TikTok</a><a class="btn sm" target="_blank" rel="noopener" href="https://www.instagram.com/explore/search/keyword/?q=${q}">Instagram</a>`; };
  $('#rq').oninput = links; links();
  const draw = () => { $('#rList').innerHTML = refs.length ? refs.map(r => `<div class="card stack"><div class="row between"><div><span class="tag">${esc(r.platform)}</span> <b>${esc(r.title || 'Sin título')}</b></div><div class="row">${r.url ? `<a class="btn sm" href="${esc(r.url)}" target="_blank" rel="noopener">${icon('link')}Abrir</a>` : ''}<button class="btn sm" data-idea="${r._id}">${icon('bulb')}Idea original</button><button class="btn sm danger" data-del="${r._id}">${icon('trash')}</button></div></div>
    <div class="small">${[r.views && `Vistas: ${esc(r.views)}`, r.likes && `Me gusta: ${esc(r.likes)}`, r.comments && `Comentarios: ${esc(r.comments)}`].filter(Boolean).join(' · ') || 'Sin métricas registradas'} <span class="mute">(datos introducidos por ti)</span></div>
    ${r.analysis ? `<div class="grid g3 small">${[['Gancho', 'gancho'], ['Estructura', 'estructura'], ['Ritmo', 'ritmo'], ['Escenarios', 'escenarios'], ['Animaciones', 'animaciones'], ['Miniatura', 'miniatura']].map(([l, k]) => `<div><b>${l}</b><div>${esc(r.analysis[k] || '—')}</div></div>`).join('')}</div>${r.analysis.ideas_originales ? `<div class="small"><b>Ideas originales inspiradas:</b> ${esc(r.analysis.ideas_originales.join(' · '))}</div>` : ''}` : ''}</div>`).join('') : '<div class="empty">Sin referencias guardadas.</div>';
    $$('[data-del]').forEach(b => b.onclick = async () => { await Store.del(b.dataset.del); refs.splice(refs.findIndex(r => r._id === b.dataset.del), 1); draw(); });
    $$('[data-idea]').forEach(b => b.onclick = () => { const r = refs.find(x => x._id === b.dataset.idea); const idea = (r.analysis && r.analysis.ideas_originales && r.analysis.ideas_originales[0]) || ('Mi versión original sobre: ' + (r.title || '')); App.state.newProject = {module: mod, init: {idea}}; App.go(mod + '-crear'); });
  };
  draw();
  $('#rGo').onclick = e => UI.busy(e.currentTarget, async () => {
    const r = {type: 'ref', module: mod, url: $('#rUrl').value.trim(), platform: $('#rPlat').value, title: $('#rTitle').value.trim(), views: $('#rViews').value.trim(), likes: $('#rLikes').value.trim(), comments: $('#rComm').value.trim(), notes: $('#rText').value.trim(), createdAt: Date.now()};
    if (!r.title && !r.notes) return UI.toast('Escribe al menos el título o tus notas del video.', 'warn');
    const img = $('#rImg') && $('#rImg').files[0];
    if (AI.available()) {
      const prompt = `Analiza esta referencia de video (${r.platform}) para inspirar contenido ORIGINAL de un canal faceless de ${mod === 'fin' ? 'finanzas' : 'entrenamiento'}. No copies su guion ni personajes.
Título: ${r.title}\nNotas/transcripción del usuario: ${r.notes || '(no hay)'}\n${img ? 'Se adjunta la miniatura.' : ''}
Analiza solo lo que se puede deducir de estos datos (si algo no se puede saber, dilo). No inventes métricas.
Formato: {"gancho":"","estructura":"","ritmo":"","escenarios":"","animaciones":"","miniatura":"","ideas_originales":["3 ideas propias y diferentes"]}`;
      try { r.analysis = img ? AI.parse((await Caps.sample(prompt + '\nResponde solo con JSON.', {images: [img], modelTier: 'default', cache: false})).text) : await AI.json(prompt, {label: 'Análisis de referencia'}); Usage.bump('ai'); }
      catch (err) { UI.error(err.code ? err : Object.assign(err, {userMsg: 'No se pudo analizar con IA; la referencia se guardó sin análisis.'})); }
    } else UI.toast('Guardada sin análisis: la IA no está disponible ahora.', 'warn');
    const id = 'r_' + uid(); await Store.set(id, r); r._id = id; refs.unshift(r); draw(); ['#rUrl', '#rTitle', '#rViews', '#rLikes', '#rComm', '#rText'].forEach(s => $(s).value = '');
  }, 'Analizando…');
};
App.researchView = researchView;
V['fin-investigacion'] = main => researchView(main, 'fin');

/* ---------- Guiones ---------- */
const scriptsView = async (main, mod) => {
  const ps = (await App.Projects.list(mod)).filter(p => p.script);
  main.innerHTML = App.head(mod === 'fin' ? 'Finanzas' : 'Gym', 'Guiones', 'Todos los guiones de tus proyectos. Ábrelos para editarlos o regenerarlos antes de producir.') +
    (ps.length ? `<div class="list">${ps.map(p => `<details class="card"><summary><b style="color:var(--ink)">${esc(p.script.title)}</b> <span class="small">· ${App.fmtDur(p.duration)} · ${fmtDate(p.updatedAt)}</span></summary>
    <div class="stack" style="margin-top:10px">${p.script.sections.map((s, i) => `<div><b class="small" style="color:var(--acc)">${esc(App.partLabel(p.script.sections, i))} · ${esc(s.speaker)}</b><div>${esc(s.text)}</div></div>`).join('')}
    <div class="row"><button class="btn sm primary" data-ed="${p.id}">${icon('edit')}Editar</button><button class="btn sm" data-cp="${p.id}">${icon('copy')}Copiar</button><button class="btn sm" data-dl="${p.id}">${icon('download')}.txt</button></div></div></details>`).join('')}</div>` : '<div class="empty">Aún no hay guiones.</div>');
  $$('[data-ed]').forEach(b => b.onclick = () => App.openProject(mod, b.dataset.ed, 2));
  $$('[data-cp]').forEach(b => b.onclick = () => UI.copy(App.scriptText(ps.find(p => p.id === b.dataset.cp))));
  $$('[data-dl]').forEach(b => b.onclick = () => { const p = ps.find(x => x.id === b.dataset.dl); Files.save(`guion-${App.slug(p.title)}.txt`, App.scriptText(p)); });
};
App.scriptsView = scriptsView;
V['fin-guiones'] = main => scriptsView(main, 'fin');

/* ---------- Miniaturas ---------- */
const thumbsView = async (main, mod) => {
  const ps = (await App.Projects.list(mod)).filter(p => p.thumb); const chars = (await App.Lib.chars()).filter(c => App.charIn(c, mod)); const brand = await App.Lib.brand(mod);
  main.innerHTML = App.head(mod === 'fin' ? 'Finanzas' : 'Gym', 'Miniaturas', 'Las miniaturas elegidas de tus videos y un creador rápido con tus personajes y colores.') + `
  <div class="stage"><div class="card"><canvas id="tq" width="1280" height="720" style="width:100%;border-radius:10px;background:#000"></canvas></div>
  <div class="card stack"><h3>Creador rápido</h3><label class="f">Texto (máx. 4–5 palabras)<input id="tqT" value="${mod === 'fin' ? 'Deja de perder dinero' : 'Entrena distinto'}"></label>
  <div class="grid g2"><label class="f">Diseño<select id="tqV">${E.THUMB_LAYOUTS.map((l, i) => `<option value="${i}">${l}</option>`).join('')}</select></label><label class="f">Personaje<select id="tqC">${chars.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label></div>
  <div class="grid g2"><label class="f">Fondo<select id="tqB">${Object.entries(A.BG_LABEL).map(([k, v]) => `<option value="${k}" ${k === (mod === 'gym' ? 'gimnasio' : 'calle') ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label class="f">${mod === 'gym' ? 'Movimiento' : 'Objeto'}<select id="tqO">${mod === 'gym' ? A.moveList.map(m => `<option value="${m.id}">${m.label}</option>`).join('') : Object.entries(A.OBJ_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label></div>
  <button class="btn primary" id="tqD">${icon('download')}Descargar PNG</button></div></div>
  <h2 style="margin-top:24px">Elegidas en tus proyectos</h2><div class="grid gauto">${ps.map(p => `<div class="card stack">${p.thumb.assetId ? `<img src="${Files.url(p.thumb.assetId)}" alt="" style="width:100%;border-radius:8px">` : '<div class="empty">No guardada en la nube</div>'}<b>${esc(p.title)}</b><button class="btn sm" data-open="${p.id}">Cambiar</button></div>`).join('') || '<div class="empty">Ninguna todavía.</div>'}</div>`;
  const draw = () => { const c = chars.find(x => x.id === $('#tqC').value) || chars[0]; const o = $('#tqO').value; E.drawThumb($('#tq').getContext('2d'), 1280, 720, {variant: +$('#tqV').value, text: $('#tqT').value, char: c, char2: c, bg: $('#tqB').value, obj: mod === 'gym' ? 'dumbbell' : o, move: mod === 'gym' ? o : null, accent: brand.c1 || (mod === 'gym' ? '#ff7a45' : '#2ee59d'), brandName: brand.name || '', highlight: true}); };
  ['#tqT', '#tqV', '#tqC', '#tqB', '#tqO'].forEach(s => $(s).oninput = $(s).onchange = draw); draw();
  if (document.fonts) document.fonts.ready.then(draw);
  $('#tqD').onclick = async () => Files.save(`miniatura-${App.slug($('#tqT').value)}.png`, await Files.canvasBlob($('#tq')));
  $$('[data-open]').forEach(b => b.onclick = () => App.openProject(mod, b.dataset.open, 7));
};
App.thumbsView = thumbsView;
V['fin-miniaturas'] = main => thumbsView(main, 'fin');

/* ---------- Identidad del canal ---------- */
const identityView = async (main, mod) => {
  let brand = await App.Lib.brand(mod); const store = await Store.get('names_' + mod) || {type: 'names', list: []};
  const def = {name: '', handle: '', slogan: '', description: '', c1: mod === 'gym' ? '#ff7a45' : '#2ee59d', c2: '#0b1210', c3: '#ffffff', icon: mod === 'gym' ? 'bolt' : 'arrow', shape: 'squircle', initials: ''};
  brand = {...def, ...brand};
  main.innerHTML = App.head(mod === 'fin' ? 'Finanzas' : 'Gym', 'Identidad del canal', 'Genera 20 nombres originales con descripción, eslogan e identidad visual. Elige uno, ajusta el logo y descarga los archivos para YouTube, TikTok e Instagram.') + `
  <div class="stage"><div class="stack"><div class="card stack"><div class="row between"><h3 style="margin:0">Nombres propuestos</h3><div class="row"><button class="btn primary" id="nAI">${icon('spark')}Generar 20 con IA</button><button class="btn" id="nMix">Combinador sin IA</button></div></div>
    <div class="list" id="nList"></div></div></div>
  <div class="stack"><div class="card stack"><h3>Marca elegida</h3>
    <canvas id="lg" width="512" height="512" style="width:180px;margin:auto;display:block"></canvas>
    <label class="f">Nombre<input id="bName" value="${esc(brand.name)}"></label><label class="f">@usuario<input id="bHandle" value="${esc(brand.handle)}" placeholder="@micanal"></label>
    <label class="f">Eslogan<input id="bSlogan" value="${esc(brand.slogan)}"></label>
    <div class="grid g3"><label class="f">Principal<input type="color" id="bC1" value="${brand.c1}"></label><label class="f">Fondo<input type="color" id="bC2" value="${brand.c2}"></label><label class="f">Detalle<input type="color" id="bC3" value="${brand.c3}"></label></div>
    <div class="grid g2"><label class="f">Icono<select id="bIcon">${Object.entries(E.LOGO_ICONS).map(([k, v]) => `<option value="${k}" ${k === brand.icon ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label class="f">Forma<select id="bShape">${Object.entries(E.LOGO_SHAPES).map(([k, v]) => `<option value="${k}" ${k === brand.shape ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
    <label class="f">Iniciales (opcional)<input id="bIni" maxlength="2" value="${esc(brand.initials)}"></label>
    <div class="row"><button class="btn" id="bVar">${icon('refresh')}Otra variante</button><button class="btn primary" id="bSave">${icon('check')}Guardar marca</button></div>
    <div class="sep"></div><b class="small">Descargas</b><div class="row"><button class="btn sm" data-dl="1024">Logo 1024 px</button><button class="btn sm" data-dl="800">Perfil YouTube 800</button><button class="btn sm" data-dl="320">Instagram 320</button><button class="btn sm" data-dl="200">TikTok 200</button><button class="btn sm" id="dlBan">Banner YouTube 2560×1440</button></div>
    <div class="sep"></div><b class="small">Disponibilidad del @usuario</b><div class="row" id="avail"></div>
    <div class="small">No existe una herramienta gratuita que esta página pueda consultar para confirmarlo; abre cada enlace: si la página dice que no existe, el nombre probablemente está libre.</div></div></div></div>`;
  const read = () => ({...brand, name: $('#bName').value.trim(), handle: $('#bHandle').value.trim(), slogan: $('#bSlogan').value.trim(), c1: $('#bC1').value, c2: $('#bC2').value, c3: $('#bC3').value, icon: $('#bIcon').value, shape: $('#bShape').value, initials: $('#bIni').value.trim()});
  const draw = () => { const b = read(); E.drawLogo($('#lg').getContext('2d'), 512, b); const h = (b.handle || b.name).replace(/^@/, '').replace(/\s+/g, '').toLowerCase(); $('#avail').innerHTML = h ? `<a class="btn sm" target="_blank" rel="noopener" href="https://www.youtube.com/@${encodeURIComponent(h)}">YouTube @${esc(h)}</a><a class="btn sm" target="_blank" rel="noopener" href="https://www.tiktok.com/@${encodeURIComponent(h)}">TikTok</a><a class="btn sm" target="_blank" rel="noopener" href="https://www.instagram.com/${encodeURIComponent(h)}/">Instagram</a>` : '<span class="small">Escribe un nombre.</span>'; };
  ['#bName', '#bHandle', '#bSlogan', '#bC1', '#bC2', '#bC3', '#bIcon', '#bShape', '#bIni'].forEach(s => $(s).oninput = $(s).onchange = draw);
  if (document.fonts) document.fonts.ready.then(draw); draw();
  const drawNames = () => { $('#nList').innerHTML = store.list.length ? store.list.map((n, i) => `<div class="item"><canvas data-nl="${i}" width="96" height="96" style="width:48px;height:48px"></canvas><div class="grow"><b>${esc(n.nombre)}</b> <span class="small">${esc(n.handle || '')}</span><div class="small">${esc(n.eslogan || '')}</div><div class="small mute">${esc(n.descripcion || '')}</div></div><button class="btn sm" data-use="${i}">Usar</button></div>`).join('') : '<div class="empty">Genera nombres para empezar.</div>';
    store.list.forEach((n, i) => { const cv = $(`[data-nl="${i}"]`); E.drawLogo(cv.getContext('2d'), 96, {name: n.nombre, c1: n.colores && n.colores[0], c2: n.colores && n.colores[1] || '#0b1210', icon: n.icono || 'initials', shape: 'squircle'}); });
    $$('[data-use]').forEach(b => b.onclick = () => { const n = store.list[+b.dataset.use]; $('#bName').value = n.nombre; $('#bHandle').value = n.handle || '@' + n.nombre.replace(/\s+/g, '').toLowerCase(); $('#bSlogan').value = n.eslogan || ''; if (n.colores && n.colores[0]) $('#bC1').value = n.colores[0]; if (n.colores && n.colores[1]) $('#bC2').value = n.colores[1]; if (n.icono && E.LOGO_ICONS[n.icono]) $('#bIcon').value = n.icono; brand.description = n.descripcion; draw(); }); };
  drawNames();
  $('#nAI').onclick = e => UI.busy(e.currentTarget, async () => {
    const r = await AI.json(`Crea 20 nombres ORIGINALES para un canal faceless de ${mod === 'fin' ? 'educación financiera, emprendimiento e ingresos para principiantes hispanohablantes' : 'métodos de entrenamiento físico explicados con rigor científico'} (YouTube, TikTok e Instagram).
Evita nombres de marcas o canales conocidos. Cortos, fáciles de recordar y de escribir.
Para cada uno: handle sugerido, descripción (1 frase), eslogan, 2 colores hex (principal llamativo y fondo oscuro) e icono de esta lista: ${Object.keys(E.LOGO_ICONS).join('|')}.
Formato: {"nombres":[{"nombre":"","handle":"@","descripcion":"","eslogan":"","colores":["#",""],"icono":""}]}`, {label: 'Nombres del canal'});
    store.list = (r.nombres || []).slice(0, 20); await Store.set('names_' + mod, store); drawNames();
  }, 'Creando nombres…');
  $('#nMix').onclick = async () => {
    const a = mod === 'fin' ? ['Peso', 'Bolsillo', 'Cifra', 'Capital', 'Moneda', 'Ahorro', 'Dinero', 'Billete', 'Finanza', 'Negocio'] : ['Fuerza', 'Método', 'Rep', 'Atleta', 'Músculo', 'Movimiento', 'Carga', 'Potencia', 'Forma', 'Entreno'];
    const b = mod === 'fin' ? ['Claro', 'Simple', 'Lab', 'en Corto', 'Diario', 'Real', 'Inteligente', 'Express', 'Base', 'Directo'] : ['Lab', 'Real', 'Ciencia', 'Distinto', 'Total', 'Base', 'Directo', 'Pro', 'Explicado', 'Libre'];
    const cols = mod === 'fin' ? ['#2ee59d', '#ffc857', '#6cb8ff', '#ff7a45'] : ['#ff7a45', '#ffd166', '#6cb8ff', '#2ee59d'];
    const icons = Object.keys(E.LOGO_ICONS); const out = new Set(); while (out.size < 20) out.add(a[Math.floor(Math.random() * a.length)] + ' ' + b[Math.floor(Math.random() * b.length)]);
    store.list = [...out].map((n, i) => ({nombre: n, handle: '@' + n.replace(/\s+/g, '').toLowerCase(), descripcion: 'Combinación generada sin IA.', eslogan: '', colores: [cols[i % cols.length], '#0b1210'], icono: icons[i % icons.length]}));
    await Store.set('names_' + mod, store); drawNames();
  };
  $('#bVar').onclick = () => { const ic = Object.keys(E.LOGO_ICONS), sh = Object.keys(E.LOGO_SHAPES); $('#bIcon').value = ic[Math.floor(Math.random() * ic.length)]; $('#bShape').value = sh[Math.floor(Math.random() * sh.length)]; draw(); };
  $('#bSave').onclick = e => UI.busy(e.currentTarget, async () => { const b = read(); const cv = document.createElement('canvas'); cv.width = cv.height = 1024; E.drawLogo(cv.getContext('2d'), 1024, b); const up = await Files.upload(await Files.canvasBlob(cv), 'el logo'); if (brand.logoAsset && up) Files.remove(brand.logoAsset); b.logoAsset = up ? up.id : brand.logoAsset || null; brand = b; await App.Lib.saveBrand(mod, b); UI.toast('Marca guardada. Se usará en miniaturas y videos.'); }, 'Guardando…');
  $$('[data-dl]').forEach(b => b.onclick = async () => { const s = +b.dataset.dl; const cv = document.createElement('canvas'); cv.width = cv.height = s; E.drawLogo(cv.getContext('2d'), s, read()); Files.save(`logo-${App.slug(read().name)}-${s}.png`, await Files.canvasBlob(cv)); });
  $('#dlBan').onclick = async () => { const cv = document.createElement('canvas'); cv.width = 2560; cv.height = 1440; E.drawBanner(cv.getContext('2d'), 2560, 1440, read()); Files.save(`banner-${App.slug(read().name)}.png`, await Files.canvasBlob(cv)); };
};
App.identityView = identityView;
V['fin-identidad'] = main => identityView(main, 'fin');

/* ---------- Control de costos (general) ---------- */
const costsView = async (main, mod) => {
  const u = Usage.doc || {months: {}, pending: [], log: []}; const m = u.months[new Date().toISOString().slice(0, 7)] || {};
  const assetInfo = await Files.usage(); const projects = await Store.list('project');
  const bv = Voice.browserVoices().length; const mime = E.pickMime();
  const usageTxt = (() => { if (!assetInfo) return Caps.assets ? 'No disponible' : '—'; const us = assetInfo.usage || {}; const parts = Object.entries(us).filter(([, v]) => typeof v === 'number').map(([k, v]) => `${k}: ${/byte|size/i.test(k) ? fmtBytes(v) : v}`); return `${(assetInfo.assets || []).length} archivo(s)${parts.length ? ' · ' + parts.join(' · ') : ''}`; })();
  const rows = [
    ['IA (Claude)', 'Propuestas, guiones, storyboard, revisión, ideas, fichas', 'Nube de Anthropic', 'RD$0 adicional: incluida en tu plan de Claude', 'El límite de uso de tu plan. La plataforma no expone la cuota restante; si se alcanza, la operación se detiene y queda pendiente.', AI.available() ? ['Activa', 'ok'] : ['Necesita permiso o sesión', 'warn']],
    ['Voz de Claude', 'Escuchar guiones y probar voces', 'Nube de Anthropic', 'RD$0 adicional', 'Hasta 2.000 caracteres por lectura; límites temporales posibles.', Caps.tts ? ['Activa', 'ok'] : ['No disponible en esta vista', 'warn']],
    ['Voces del navegador', 'Alternativa gratuita de voz', 'Tu navegador', 'RD$0', 'Sin límite.', bv ? [bv + ' voces en español', 'ok'] : ['Sin voces en español', 'warn']],
    ['Base de datos de proyectos', 'Guardar proyectos, personajes, marca e ideas', Store.mode === 'cloud' ? 'Nube (privada para ti)' : 'Este navegador', 'RD$0', 'Hasta 25.000 documentos y 256 KB por documento.', Store.mode === 'cloud' ? [projects.length + ' proyectos', 'ok'] : ['Solo local', 'warn']],
    ['Almacenamiento de archivos', 'Videos, miniaturas y logos', 'Nube', 'RD$0', 'Máximo 20 MB por archivo. ' + usageTxt, Caps.assets ? ['Activo', 'ok'] : ['No disponible: descarga los archivos', 'warn']],
    ['Render de video', 'Componer y grabar el MP4/WebM', 'Tu navegador (la nube gratuita disponible no renderiza video)', 'RD$0', 'Sin límite; tarda lo que dura el video y requiere la pestaña visible.', mime ? [mime.startsWith('video/mp4') ? 'MP4' : 'WebM', 'ok'] : ['Navegador no compatible', 'bad']],
    ['Música y efectos', 'Bandas sonoras y sonidos', 'Tu navegador (sintetizados)', 'RD$0', 'Originales, sin licencias de terceros.', ['Activo', 'ok']],
    ['Publicación automática', 'Subir a YouTube/TikTok/Instagram', '—', 'RD$0', 'No hay integración oficial gratuita conectable desde esta página.', ['No configurada', 'warn']],
    ['Búsqueda en plataformas', 'Encontrar videos de referencia', 'Enlaces a cada plataforma', 'RD$0', 'Sin API gratuita accesible desde aquí: búsqueda manual.', ['Manual', 'warn']],
    ['Verificación de nombres', 'Comprobar @usuario libre', 'Enlaces a cada plataforma', 'RD$0', 'Comprobación manual.', ['Manual', 'warn']]];
  const needs = [!AI.available() && 'IA: abre la app en claude.ai con tu sesión iniciada y acepta el permiso de IA cuando aparezca.', Store.mode !== 'cloud' && 'Nube: inicia sesión en claude.ai para que tus proyectos se guarden en la nube y no solo en este navegador.', !Caps.downloads && 'Descargas: no disponibles en esta vista.', !mime && 'Render: usa Chrome o Edge actualizados en la computadora.', !bv && !Caps.tts && 'Voces: tu navegador no tiene voces en español instaladas.'].filter(Boolean);
  main.innerHTML = App.head('General', 'Control de costos', 'Todo funciona con servicios gratuitos o incluidos en tu plan actual. La app no tiene servicios de pago, no pide tarjeta y nunca cambia sola a una opción de pago.') + `
  <div class="grid g4"><div class="card kpi"><b style="color:var(--acc)">RD$0.00</b><span>Costo acumulado del proyecto</span></div><div class="card kpi"><b>${m.ai || 0}</b><span>Usos de IA este mes</span></div><div class="card kpi"><b>${m.renders || 0}</b><span>Videos renderizados este mes</span></div><div class="card kpi"><b>${m.limits || 0}</b><span>Veces que se alcanzó un límite</span></div></div>
  <div class="card" style="margin-top:16px"><h3>Servicios utilizados</h3><div class="scroll"><table class="stack-t"><thead><tr><th>Servicio</th><th>Para qué</th><th>Dónde se ejecuta</th><th>Costo</th><th>Cuota / límite</th><th>Estado</th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="small">${esc(r[4])}</td><td><span class="tag ${r[5][1]}">${esc(r[5][0])}</span></td></tr>`).join('')}</tbody></table></div></div>
  <div class="grid g2" style="margin-top:16px"><div class="card"><h3>Operaciones pendientes</h3><div class="list">${(u.pending || []).map(p => `<div class="item"><div class="grow"><b>${esc(p.label)}</b><div class="small">Detenida por límite de uso · ${fmtDate(p.at)}</div></div><a class="btn sm" href="${esc(p.route)}">Reintentar</a><button class="btn sm" data-rm="${p.id}">Quitar</button></div>`).join('') || '<div class="empty">Ninguna.</div>'}</div></div>
  <div class="card"><h3>Servicios que necesitan configuración</h3>${needs.length ? `<ul>${needs.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '<div class="note ok">Todo lo disponible está configurado.</div>'}
  <div class="note info" style="margin-top:10px"><b>Sobre el procesamiento en la nube:</b> la IA, el guardado de proyectos y los archivos están en la nube. El render del video y la música se hacen en tu navegador porque la única nube de render gratuita y sin tarjeta que esta app puede usar no existe; tu equipo solo dibuja y graba (no se instala nada).</div></div></div>`;
  $$('[data-rm]').forEach(b => b.onclick = () => { Usage.clearPending(b.dataset.rm); App.route(); });
};
V['fin-costos'] = main => costsView(main, 'fin');
V['gym-costos'] = main => costsView(main, 'gym');

/* ---------- Configuración (general) ---------- */
const configView = async (main) => {
  const s = await App.Lib.settings();
  main.innerHTML = App.head('General', 'Configuración', 'Valores por defecto para nuevos videos y gestión de tus datos.') + `
  <div class="grid g2"><div class="card stack"><h3>Videos nuevos</h3>
    <div class="grid g2"><label class="f">Duración por defecto<select id="sDur">${App.DUR_PRESETS.concat(App.DUR_PRESETS.includes(s.duration) ? [] : [s.duration]).map(d => `<option value="${d}" ${d === s.duration ? 'selected' : ''}>${App.fmtDur(d)}</option>`).join('')}</select></label><label class="f">Formato<select id="sFmt">${Object.entries(E.FORMATS).map(([k, v]) => `<option value="${k}" ${k === s.format ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label></div>
    <div class="grid g2"><label class="f">Música Finanzas<select id="sMf">${Object.entries(E.MUSIC).map(([k, v]) => `<option value="${k}" ${k === s.music.fin ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label class="f">Música Gym<select id="sMg">${Object.entries(E.MUSIC).map(([k, v]) => `<option value="${k}" ${k === s.music.gym ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
    <label class="f" style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="sSubs" ${s.subs ? 'checked' : ''}> Subtítulos animados</label>
    <label class="f" style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="sBar" ${s.progressBar ? 'checked' : ''}> Barra de progreso arriba del video</label>
    <label class="f" style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="sHandle" ${s.showHandle ? 'checked' : ''}> Mostrar @usuario del canal en el video</label>
    <label class="f">Estilo visual de Gym<select id="sGym"><option value="estudio3d" ${(s.gymStyle || 'estudio3d') === 'estudio3d' ? 'selected' : ''}>Estudio 3D completo: personaje 3D hablando de frente, ejercicios en 3D, tier lists, pizarras y gráficos</option><option value="mixto" ${s.gymStyle === 'mixto' ? 'selected' : ''}>Mixto: habla a cámara en 2D y ejercicios en 3D</option><option value="plano" ${s.gymStyle === 'plano' ? 'selected' : ''}>Todo en 2D</option></select></label>
    <div class="grid g2" ${App.NO3D ? 'hidden' : ''}><label class="f">Animación por defecto en Finanzas<select id="sAf"><option value="2d" ${(s.anim || {}).fin !== '3d' ? 'selected' : ''}>2D</option><option value="3d" ${(s.anim || {}).fin === '3d' ? 'selected' : ''}>3D</option></select></label><label class="f">Animación por defecto en Gym<select id="sAg"><option value="2d" ${(s.anim || {}).gym === '2d' ? 'selected' : ''}>2D</option><option value="3d" ${(s.anim || {}).gym !== '2d' ? 'selected' : ''}>3D</option></select></label></div>
    <label class="f">Motion (íconos animados en pantalla)<select id="sMo"><option value="alto" ${(s.motion || 'alto') === 'alto' ? 'selected' : ''}>Alto: muchos íconos en movimiento, ritmo rápido</option><option value="medio" ${s.motion === 'medio' ? 'selected' : ''}>Medio: pocos íconos</option><option value="off" ${s.motion === 'off' ? 'selected' : ''}>Apagado</option></select></label>
<div class="grid g3"><label class="f">Resolución<select id="sRes">${(o => Object.entries(o).map(([k, v]) => `<option value="${k}" ${String(k) === String(s.res || 1080) ? 'selected' : ''}>${v}</option>`).join(''))(App.Engine.RES)}</select></label><label class="f">Fluidez (FPS)<select id="sFps">${(o => Object.entries(o).map(([k, v]) => `<option value="${k}" ${String(k) === String(s.fps || 60) ? 'selected' : ''}>${v}</option>`).join(''))(App.Engine.FPS_OPTS)}</select></label><label class="f">Calidad de render<select id="sQ">${(o => Object.entries(o).map(([k, v]) => `<option value="${k}" ${String(k) === String(s.qual || 'alta') ? 'selected' : ''}>${v}</option>`).join(''))(App.Engine.QUALS)}</select></label></div>
    <button class="btn primary" id="sSave">${icon('check')}Guardar</button></div>
  <div class="card stack"><h3>Tus datos</h3><div class="small">Guardado: ${Store.mode === 'cloud' ? 'en tu nube privada (solo tú puedes verlo)' : 'solo en este navegador'}.</div>
    <button class="btn" id="sExp">${icon('download')}Exportar todo (.json)</button>
    <label class="f">Importar copia (.json)<input type="file" id="sImp" accept="application/json"></label>
    <div class="sep"></div><h3>Atajos</h3><div class="small"><code>Alt+1</code> Finanzas · <code>Alt+2</code> Gym</div></div></div>`;
  $('#sSave').onclick = async () => { Object.assign(s, {duration: +$('#sDur').value, format: $('#sFmt').value, music: {fin: $('#sMf').value, gym: $('#sMg').value}, subs: $('#sSubs').checked, progressBar: $('#sBar').checked, showHandle: $('#sHandle').checked, gymStyle: $('#sGym').value, render3d: $('#sGym').value !== 'plano', res: +$('#sRes').value, fps: +$('#sFps').value, qual: $('#sQ').value, anim: {fin: $('#sAf').value, gym: $('#sAg').value}, motion: $('#sMo').value}); await Store.set('settings', s); UI.toast('Configuración guardada.'); };
  $('#sExp').onclick = async () => { const out = {exportedAt: new Date().toISOString(), app: 'Estudio Faceless', docs: {}}; for (const t of ['project', 'sbchunk', 'ref', 'ficha', 'angle', 'method']) for (const d of await Store.list(t)) out.docs[d._id] = d; for (const k of ['settings', 'chars', 'brand', 'ideas_fin', 'ideas_gym', 'names_fin', 'names_gym']) { const d = await Store.get(k); if (d) out.docs[k] = d; } if (out.docs.chars && out.docs.chars.list) for (const c of out.docs.chars.list) if (c.look && c.look.img && c.look.img.src && !c.look.img.src.startsWith('data:')) { c.look.img = {...c.look.img, src: await App.CharImage.embed(c.look.img.src), local: true}; delete c.look.img.assetId; } Files.save('estudio-faceless-copia.json', JSON.stringify(out, null, 2)); };
  $('#sImp').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const o = JSON.parse(await f.text()); const docs = o.docs || {}; const n = Object.keys(docs).length; if (!(await UI.confirm(`¿Importar ${n} elementos? Los que tengan el mismo identificador se reemplazarán.`, 'Importar'))) return; for (const [k, v] of Object.entries(docs)) { if (!/^[\w.~:@+-]+$/.test(k) || typeof v !== 'object') continue; delete v._id; await Store.set(k, v); } UI.toast('Importación completa.'); } catch { UI.toast('Ese archivo no es una copia válida.', 'bad'); } };
};
V['fin-config'] = main => configView(main);
V['gym-config'] = main => configView(main);
})();
