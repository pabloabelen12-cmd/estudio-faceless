'use strict';
/* ============ Mi video: pegas tu idea, guion, prompt de imágenes y prompt de animaciones (de cualquier fuente) y se hace el video así ============ */
(() => {
const {esc, $, $$, clamp} = App.util;
const {UI, AI, Store, icon} = App;
const A = App.Art;
const DRAFT = mod => 'efs:mivideo-' + mod;
const words = t => String(t || '').split(/\s+/).filter(Boolean).length;

/* convierte el guion pegado en partes: respeta encabezados ("GANCHO:", "Escena 2", "## Parte") y nombres de personajes ("NICO: …") */
function parseScript(text, chars, cast) {
  const ids = chars.map(c => c.id), byName = n => { const k = String(n || '').toLowerCase().trim(); const c = chars.find(x => x.id === k || x.name.toLowerCase() === k); return c ? c.id : null; };
  const blocks = String(text).replace(/\r/g, '').split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);
  const KIND = [[/gancho|hook|intro/i, 'gancho'], [/problema/i, 'problema'], [/conclus|resumen|cierre/i, 'conclusion'], [/llamad|cta|suscr|s[ií]gue/i, 'cta'], [/ejemplo/i, 'ejemplo']];
  const out = [];
  blocks.forEach(b => {
    let lines = b.split('\n').map(l => l.trim()).filter(Boolean), title = '', part = '';
    const head = lines[0].match(/^(?:#+\s*|\[)?([^\]:\n]{2,60}?)(?:\]|:)?\s*$/);
    if (lines.length > 1 && head && words(head[1]) <= 7 && !/[.!?]$/.test(lines[0])) { title = head[1].replace(/^(escena|parte|cap[ií]tulo)\s*\d*[:.\-–]?\s*/i, '').trim(); part = (KIND.find(([re]) => re.test(lines[0])) || [])[1] || ''; lines = lines.slice(1); }
    // líneas "NOMBRE: texto" → hablante
    let speaker = null; const txt = lines.map(l => { const m = l.match(/^([A-ZÁÉÍÓÚÑa-záéíóúñ ]{2,20}):\s+(.+)$/); if (m && byName(m[1])) { speaker = speaker || byName(m[1]); return m[2]; } return l.replace(/^\(.*?\)\s*/, ''); }).join(' ').replace(/\s+/g, ' ').trim();
    if (txt) out.push({part, title, speaker, text: txt});
  });
  // asigna partes que falten: primera = gancho, segunda = problema, penúltima = conclusión, última corta = cta, el resto capítulos/explicación
  const n = out.length;
  out.forEach((s, i) => {
    if (!s.part) s.part = i === 0 ? 'gancho' : (i === n - 1 && words(s.text) <= 30) ? 'cta' : (i === n - 2 && n > 3) || (i === n - 1) ? 'conclusion' : (i === 1 && n > 3) ? 'problema' : n > 6 ? 'capitulo' : 'explicacion';
    if (!s.speaker) s.speaker = (cast && cast[i % Math.max(1, cast.length)]) || ids[0] || 'narrador';
    if (s.part === 'capitulo' && !s.title) s.title = s.text.split(/\s+/).slice(0, 5).join(' ');
  });
  return out;
}
App.parseUserScript = parseScript;

/* sin IA: aplica las indicaciones de imágenes y animación al storyboard por reglas */
App.applyCustomPrompts = (p, sb) => {
  const img = (p.custom && p.custom.img || '').toLowerCase(), anim = (p.custom && p.custom.anim || '').toLowerCase(); if (!img && !anim) return sb;
  const BG_WORDS = [['casa_humilde', 'humilde'], ['casa_humilde', 'pobre'], ['mansion', 'mansión'], ['mansion', 'mansion'], ['mansion', 'lujo'], ['ciudad', 'noche'], ['gimnasio', 'gym'], ['estudio', 'pizarra'], ['papel', 'papel blanco']].concat(Object.entries(A.BG_LABEL).map(([k, l]) => [k, l.toLowerCase().split(/[ (/]/)[0]]));
  // "mansión cuando habla de riqueza, oficina en el ejemplo" → reglas fondo ↔ palabras del guion
  const stem = w => w.normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 5);
  const rules = img.split(/[,;.\n]|\by\b(?= (?:una?|el|la|los|las) )/).map(cl => { const bg = (BG_WORDS.find(([, w]) => w.length > 3 && cl.includes(w)) || [])[0]; if (!bg) return null; const m = cl.match(/(?:cuando (?:se )?(?:habla|hable|mencion\w*|dice)(?: de| que)?|al hablar de|en (?:el|la|los|las)|durante (?:el|la))\s+(.+)$/); const trig = m ? m[1].split(/\s+/).filter(w => w.length > 3).map(stem) : []; return {bg, trig}; }).filter(Boolean);
  const general = rules.filter(r => !r.trig.length).map(r => r.bg);
  const fast = /r[aá]pid|fren[eé]tic|din[aá]mic|energ/.test(anim), soft = /suave|calmad|lent|tranquil/.test(anim);
  const zoom = /zoom|acerc/.test(anim), shake = /sacud|impact|temblor/.test(anim), slide = /desliz|barrid/.test(anim);
  sb.scenes.forEach((s, i) => {
    const said = (s.dialogue + ' ' + (s.part || '')).toLowerCase().split(/\W+/).map(stem); const hit = rules.find(r => r.trig.length && r.trig.some(t => said.includes(t)));
    if (hit) s.bg = hit.bg; else if (general.length && !/casa_humilde|mansion/.test(s.bg)) s.bg = general[i % general.length];
    if (zoom) s.camera = i % 2 ? 'zoom_in' : 'push_speaker'; if (shake && s.part === 'gancho') s.camera = 'shake';
    if (fast) { s.dur = +Math.max(1.6, s.dur * .85).toFixed(1); s.transition = i ? ['slide', 'zoom', 'wipe'][i % 3] : 'cut'; }
    if (soft && i) s.transition = 'fade'; if (slide && i) s.transition = 'slide';
    if (/gr[aá]fic|checklist|lista/.test(anim) && !s.overlay && words(s.dialogue) > 10 && i % 3 === 1) { const its = s.dialogue.split(/[.,;]/).map(x => x.trim()).filter(Boolean).slice(0, 3); if (its.length > 1) s.overlay = {type: 'checklist', title: '', items: its.map(t => ({text: t.split(/\s+/).slice(0, 6).join(' '), ok: true}))}; }
    if (/emoji/.test(anim) && !s.emojis) s.emojis = ['🔥', '💡'];
  });
  if (fast) p.motion = 'alto'; if (soft) p.motion = 'medio';
  return sb;
};

const view = async (main, mod) => {
  const chars = (await App.Lib.chars()).filter(c => mod === 'gym' ? c.module === 'gym' : c.module !== 'gym');
  const settings = await App.Lib.settings();
  let d = {}; try { d = JSON.parse(localStorage.getItem(DRAFT(mod)) || '{}'); } catch {}
  d = {titulo: '', idea: '', guion: '', img: '', anim: '', format: settings.format, anim3d: ((settings.anim || {})[mod]) || (mod === 'gym' ? '3d' : '2d'), cast: mod === 'fin' ? ['nico', 'marcus'] : ['volt'], ...d};
  main.innerHTML = App.head(mod === 'fin' ? 'Finanzas' : 'Gym', 'Mi video', 'Pega tu propio material (de esta app, de ChatGPT o de donde sea) y el video se hace siguiendo exactamente tu guion y tus indicaciones de imágenes y animación.') + `
  <div class="mv">
    <div class="stack">
      <div class="card stack"><div class="mvh"><span class="mvn">1</span><div><h3>La idea</h3><div class="small mute">Título y de qué trata.</div></div></div>
        <input id="mvT" placeholder="Título del video" value="${esc(d.titulo)}"><textarea id="mvI" placeholder="Idea o descripción del video" style="min-height:70px">${esc(d.idea)}</textarea></div>
      <div class="card stack"><div class="mvh"><span class="mvn">2</span><div><h3>El guion completo</h3><div class="small mute">Se usa tal cual. Separa las partes con una línea en blanco. Puedes poner encabezados (“Gancho:”, “Escena 3”) y quién habla (“NICO: …”).</div></div></div>
        <textarea id="mvG" placeholder="Pega aquí el guion completo…" style="min-height:260px">${esc(d.guion)}</textarea><div class="small" id="mvW"></div></div>
      <div class="grid g2">
        <div class="card stack"><div class="mvh"><span class="mvn">3</span><div><h3>Prompt de imágenes</h3><div class="small mute">Cómo se ve: personajes, escenarios, estilo.</div></div></div><textarea id="mvP" placeholder="Ej.: el personaje en una casa humilde al hablar de deudas y en una mansión al hablar de inversiones; estilo cartoon plano…" style="min-height:150px">${esc(d.img)}</textarea></div>
        <div class="card stack"><div class="mvh"><span class="mvn">4</span><div><h3>Prompt de animaciones</h3><div class="small mute">Cómo se mueve: ritmo, cámara, transiciones, gráficos.</div></div></div><textarea id="mvA" placeholder="Ej.: ritmo rápido, zoom en cada dato, íconos de dinero flotando, checklist al final, transiciones deslizadas…" style="min-height:150px">${esc(d.anim)}</textarea></div>
      </div>
    </div>
    <div class="stack mvside">
      <div class="card stack"><h3>Ajustes</h3>
        <label class="f">Formato<select id="mvF">${Object.entries(App.Engine.FORMATS).map(([k, v]) => `<option value="${k}" ${k === d.format ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
        <div><div class="small" style="margin-bottom:6px">Animación</div><div class="chips" id="mv3">${['2d', '3d'].map(k => `<button class="chip" data-a="${k}" aria-pressed="${d.anim3d === k}">${k.toUpperCase()}</button>`).join('')}</div></div>
        <div><div class="small" style="margin-bottom:6px">Personajes</div><div class="chips" id="mvC">${chars.map(c => `<button class="chip" data-c="${c.id}" aria-pressed="${d.cast.includes(c.id)}">${esc(c.name)}</button>`).join('')}</div></div>
        <div class="small" id="mvDur"></div>
        <div class="note info small" style="margin:0">${AI.available() ? 'Con IA: Claude convierte tu guion en escenas siguiendo tus prompts al pie de la letra.' : 'Sin IA (versión instalada): las escenas se arman por reglas y se aplican las palabras clave de tus prompts (fondos, zoom, ritmo, gráficos, emojis).'}</div>
        <button class="btn primary big" id="mvGo">${icon('spark', 20)}Crear el video completo</button>
        <button class="btn" id="mvStep">${icon('edit')}Crear y revisar escena por escena</button>
        <button class="btn ghost sm" id="mvClear">Vaciar formulario</button></div>
    </div>
  </div>`;
  const read = () => ({titulo: $('#mvT').value.trim(), idea: $('#mvI').value.trim(), guion: $('#mvG').value, img: $('#mvP').value.trim(), anim: $('#mvA').value.trim(), format: $('#mvF').value, anim3d: d.anim3d, cast: d.cast});
  const keep = () => { d = read(); try { localStorage.setItem(DRAFT(mod), JSON.stringify(d)); } catch {} const w = words(d.guion); $('#mvW').textContent = w ? `${w.toLocaleString('es')} palabras · ${parseScript(d.guion, chars, d.cast).length} partes` : ''; $('#mvDur').innerHTML = w ? `Duración estimada: <b>${App.fmtDur(clamp(Math.round(w / 2.5), 10, 1800))}</b> (según tu guion)` : ''; };
  ['#mvT', '#mvI', '#mvG', '#mvP', '#mvA'].forEach(s => $(s).oninput = keep); $('#mvF').onchange = keep; keep();
  $$('#mv3 .chip').forEach(b => b.onclick = () => { d.anim3d = b.dataset.a; $$('#mv3 .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); keep(); });
  $$('#mvC .chip').forEach(b => b.onclick = () => { const id = b.dataset.c; d.cast = d.cast.includes(id) ? d.cast.filter(x => x !== id) : [...d.cast, id]; if (!d.cast.length) d.cast = [id]; b.setAttribute('aria-pressed', d.cast.includes(id)); keep(); });
  $('#mvClear').onclick = async () => { if (!(await UI.confirm('¿Vaciar el formulario?', 'Vaciar'))) return; try { localStorage.removeItem(DRAFT(mod)); } catch {} view(main, mod); };
  const make = async auto => {
    const x = read(); if (words(x.guion) < 5) return UI.toast('Pega primero el guion completo.', 'warn');
    const sections = parseScript(x.guion, chars, x.cast);
    const title = x.titulo || x.idea.split(/[.\n]/)[0] || sections[0].text.split(/\s+/).slice(0, 8).join(' ');
    const dur = clamp(Math.round(words(x.guion) / 2.5), 10, 1800);
    const p = await App.Projects.create(mod, {idea: x.idea || title, title, duration: dur, format: x.format, anim: x.anim3d, cast: x.cast, custom: {img: x.img, anim: x.anim, source: 'mío'},
      proposals: [{titulo: title, gancho: sections[0].text.split(/\s+/).slice(0, 15).join(' '), concepto: x.idea || 'Guion propio', personajes: x.cast, estilo: 'Guion propio', duracion: dur, por_que: 'Material propio'}], proposalSource: 'propio', selected: 0, step: auto ? 3 : 3,
      script: {title, sections, verify: [], source: 'propio', dur}});
    App.Projects.setCurrent(mod, p.id); App.state.autoGen = !!auto; App.go(mod + '-crear');
  };
  $('#mvGo').onclick = () => make(true);
  $('#mvStep').onclick = () => make(false);
};
App.views['fin-mivideo'] = main => view(main, 'fin');
App.views['gym-mivideo'] = main => view(main, 'gym');
})();
