'use strict';
/* ============ Producción compartida: biblioteca, marca, ajustes y el flujo idea → video completo ============ */
(() => {
const {esc, uid, clone, clamp, fmtDate, fmtBytes} = App.util;
const {UI, AI, Store, Files, Usage, Voice, icon} = App;
const E = App.Engine, A = App.Art;

/* ---------- biblioteca de personajes, ajustes y marca ---------- */
const Lib = App.Lib = {
  async chars() { const d = await Store.get('chars'); const saved = (d && d.list) || []; const base = A.defaultCharacters.map(c => ({...clone(c), ...(saved.find(s => s.id === c.id) || {})})); return base.concat(saved.filter(s => !A.defaultCharacters.some(c => c.id === s.id))); },
  async saveChars(list) { await Store.set('chars', {type: 'chars', list}); },
  async settings() { return {type: 'settings', duration: 30, format: 'vertical', music: {fin: 'upbeat', gym: 'motivacion'}, subs: true, progressBar: true, showHandle: true, quality: 'cloud', render3d: true, gymStyle: 'estudio3d', motion: 'alto', anim: {fin: '2d', gym: '3d'}, ...(await Store.get('settings') || {})}; },
  async brand(mod) { const b = await Store.get('brand') || {type: 'brand'}; return b[mod] || {}; },
  async saveBrand(mod, data) { const b = await Store.get('brand') || {type: 'brand'}; b[mod] = data; await Store.set('brand', b); }
};
App.FIN_CATS = ['Finanzas personales', 'Ahorro y presupuestos', 'Administración del dinero', 'Cómo comenzar negocios', 'Dropshipping', 'E-commerce', 'Trading y sus riesgos', 'Inversiones básicas', 'Ingresos activos y pasivos', 'Marketing digital', 'Canales faceless', 'IA aplicada a los negocios', 'Errores financieros', 'Mentalidad emprendedora', 'Comparación de modelos de negocio'];
App.GYM_FORMATS = ['Video explicativo', 'Video comparativo', 'Video de curiosidades', 'Video demostrativo', 'Video tipo documental', 'Short', 'Animación anatómica', 'Demostración 3D'];
const PARTS = [['gancho', 'Gancho inicial'], ['problema', 'Presentación del problema'], ['explicacion', 'Explicación sencilla'], ['ejemplo', 'Ejemplo cotidiano'], ['conclusion', 'Conclusión'], ['cta', 'Llamada a la acción']];
App.PARTS = PARTS;
const GYM3D_RULES = 'ESTILO ESTUDIO 3D: todo se renderiza en 3D. Dos tipos de escena: (1) HABLA A CÁMARA: uno o dos personajes de frente en primer plano, sin "movimiento", con "accion" talk, present, shrug, point o think; (2) DEMOSTRACIÓN: un solo personaje con "movimiento". A cualquier escena puedes añadir un gráfico "overlay" para explicar: tier (lista S/A/B/C; items {emoji, text, tier}), board (pizarra; title e items {text, ok true/false}), checklist (resumen; items {text, ok}), pie (gráfico circular; items {text, value}), error (title "ERROR" y 1 item con la frase equivocada, que se tacha), versus (2 items {emoji, text} comparados con una flecha). Usa emojis reales de comida, gimnasio o reacción. "emojis": hasta 3 que aparecen junto al personaje. "vista": frente|perfil|tres_cuartos|espalda|orbita. En "personajes", "variante": normal|sobrepeso|delgado y "color" hex opcional para comparar cuerpos (por ejemplo, dos personajes con variantes distintas). "zona": zonas a resaltar en rojo (legs, glutes, core, chest, back, arms, shoulders, grip, calves, hamstrings, grasa). Fondos recomendados: gym_oscuro, rayos, plano_azul. Escenas cortas de 3 a 6 s y un gráfico o cambio visual frecuente. No inventes datos en los gráficos: usa solo lo que dice el guion.';
const STOP = new Set(['de', 'del', 'con', 'por', 'la', 'el', 'y', 'que', 'qué', 'a', 'en', 'los', 'las', 'un', 'una', 'para', 'o', 'tu', 'tus', 'se', 'si', 'lo', 'al', 'es', 'no', 'mi', 'su']);
const trimStop = w => { w = [...w]; while (w.length > 1 && STOP.has(w[w.length - 1].toLowerCase())) w.pop(); return w; };
const STEPS = ['Idea', 'Propuestas', 'Guion', 'Storyboard', 'Voces', 'Vista previa', 'Render', 'Miniatura', 'Calidad', 'Exportar'];
const WPS = 2.5;
/* ---------- duración: de 10 s a 30 min ---------- */
const DUR_MIN = 10, DUR_MAX = 1800, LONG_SEC = 150;
const DUR_PRESETS = [15, 30, 60, 90, 180, 300, 600, 900, 1200, 1800];
const fmtDur = s => { s = Math.round(+s || 0); return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ' ' + (s % 60) + ' s' : ''}`; };
const chaptersFor = dur => clamp(Math.round(dur / 150), 3, 16);
const isLong = dur => dur > LONG_SEC;
const CLOUD_MAX = 18 * 1024 * 1024;
const bitrateFor = (dur, q) => { if (q === 'max') return 8e6; const fit = Math.floor(CLOUD_MAX * 8 / Math.max(1, dur) * .85); return fit >= 1.2e6 ? Math.min(8e6, fit) : dur > 600 ? 2e6 : 2.5e6; };
const sizeFor = (dur, q) => (bitrateFor(dur, q) + 128000) * dur / 8;
const durEstimate = (dur, q = 'cloud') => {
  const words = Math.round(dur * WPS), scenes = Math.max(3, Math.round(dur / 4)), ch = isLong(dur) ? chaptersFor(dur) : 0;
  const ai = 1 + (ch ? 1 + ch : 1) + Math.max(1, Math.ceil(words / 350)) + 3;
  const size = sizeFor(dur, q);
  return {words, scenes, chapters: ch, ai, size, cloud: size <= 20 * 1024 * 1024};
};
App.fmtDur = fmtDur; App.DUR_PRESETS = DUR_PRESETS; App.durEstimate = durEstimate; App.bitrateFor = bitrateFor;
const partLabel = (sections, i) => { const s = sections[i]; if (s.part === 'capitulo') { const n = sections.slice(0, i + 1).filter(x => x.part === 'capitulo').length; return `Capítulo ${n}${s.title ? ': ' + s.title : ''}`; } return (PARTS.find(x => x[0] === s.part) || [, s.part || 'Parte'])[1]; };
const partKind = part => part === 'capitulo' ? 'explicacion' : part;
App.partLabel = partLabel;

/* ---------- proyectos ---------- */
const Projects = App.Projects = {
  async list(mod) { return (await Store.list('project')).filter(p => !mod || p.module === mod); },
  /* Las escenas de videos largos no caben en un solo documento (máx. 256 KB): se guardan en partes de 40
     escenas y solo se reescriben las partes que cambiaron. */
  _sbn: new Map(), _sbc: new Map(),
  async get(id) {
    const p = id ? await Store.get(id) : null;
    if (p && p.storyboard && p.storyboard.chunks) {
      const n = p.storyboard.chunks; const parts = await Promise.all(Array.from({length: n}, (_, k) => Store.get(`${p.id}_sb${k}`)));
      parts.forEach((d, k) => { if (d) this._sbc.set(`${p.id}_sb${k}`, JSON.stringify(d.scenes)); });
      p.storyboard.scenes = parts.flatMap(d => d ? d.scenes : []); delete p.storyboard.chunks; this._sbn.set(p.id, n);
    }
    return p;
  },
  async save(p) {
    p.updatedAt = Date.now();
    const sc = p.storyboard && p.storyboard.scenes, prevN = this._sbn.get(p.id) || 0, writes = [];
    let n = 0, doc = p;
    if (sc && sc.length > 40) {
      n = Math.ceil(sc.length / 40);
      for (let k = 0; k < n; k++) {
        const key = `${p.id}_sb${k}`, part = sc.slice(k * 40, k * 40 + 40), js = JSON.stringify(part);
        if (this._sbc.get(key) !== js) { this._sbc.set(key, js); writes.push(Store.set(key, {type: 'sbchunk', project: p.id, scenes: part})); }
      }
      doc = {...p, storyboard: {...p.storyboard, scenes: [], chunks: n}};
    }
    for (let k = n; k < prevN; k++) { this._sbc.delete(`${p.id}_sb${k}`); writes.push(Store.del(`${p.id}_sb${k}`)); }
    this._sbn.set(p.id, n);
    writes.push(Store.set(p.id, doc)); await Promise.all(writes); return p;
  },
  async remove(p) { const n = (p.storyboard && p.storyboard.chunks) || this._sbn.get(p.id) || 0; for (let k = 0; k < n; k++) await Store.del(`${p.id}_sb${k}`); this._sbn.delete(p.id); await Store.del(p.id); },
  async create(mod, init = {}) { const s = await Lib.settings(); const p = {type: 'project', id: 'p_' + uid(), module: mod, createdAt: Date.now(), title: '', idea: '', category: mod === 'fin' ? App.FIN_CATS[0] : '', duration: s.duration, format: s.format, music: s.music[mod] || 'upbeat', step: 0, cast: mod === 'fin' ? ['nico', 'marcus'] : ['volt'], ...init}; await this.save(p); return p; },
  current: {}, setCurrent(mod, id) { this.current[mod] = id; try { sessionStorage.setItem('efs-cur-' + mod, id); } catch {} },
  getCurrent(mod) { if (this.current[mod]) return this.current[mod]; try { return sessionStorage.getItem('efs-cur-' + mod); } catch { return null; } },
  status(p) { if (p.publish && p.publish.manualPublished) return ['Publicado por ti', 'ok']; if (p.qa && p.qa.approved) return ['Aprobado', 'ok']; if (p.render) return ['Renderizado', 'info']; if (p.storyboard) return p.storyboard.partial ? ['Storyboard a medias', 'warn'] : ['Storyboard listo', 'warn']; if (p.scriptJob) return ['Guion a medias', 'warn']; if (p.script) return ['Guion listo', 'warn']; if (p.proposals) return ['Propuestas', '']; return ['Idea', '']; }
};
App.openProject = (mod, id, step) => { Projects.setCurrent(mod, id); if (step != null) App.state.jumpStep = step; App.go(mod + '-crear'); };

/* ---------- textos de contexto para la IA ---------- */
const channelCtx = mod => mod === 'gym'
  ? 'un canal faceless de entrenamiento físico con rigor científico (público hispanohablante amplio, principiantes incluidos). Nunca recomiendes técnicas extremas a principiantes; señala cuando un método requiere supervisión; no asumas que programas de adultos sirven para adolescentes.'
  : 'un canal faceless de educación financiera, emprendimiento y generación de ingresos para principiantes hispanohablantes (por ejemplo, en República Dominicana). Contenido educativo y entretenido; sin promesas de dinero fácil ni rendimientos garantizados; en trading o inversiones, menciona siempre los riesgos.';
const castCtx = (chars, ids) => chars.filter(c => !ids || ids.includes(c.id)).map(c => `- ${c.id}: ${c.name}, ${c.role}. Personalidad: ${c.personality}`).join('\n');
const methodCtx = p => { const m = p.methodId && App.Gym && App.Gym.byId(p.methodId); return m ? `\nMétodo de entrenamiento: ${m.n} (categoría ${m.cat}; clasificación: ${m.kl}; evidencia: ${m.ev}). Resumen: ${m.s} Precauciones: ${m.r}` : ''; };

/* ---------- generadores (IA y alternativas sin IA) ---------- */
const Gen = App.Gen = {
  async proposals(p, chars) {
    const r = await AI.json(`Eres guionista jefe de ${channelCtx(p.module)}
Idea del usuario: "${p.idea}"
${p.category ? 'Categoría: ' + p.category : ''}${methodCtx(p)}${p.formatHint ? '\nTipo de video pedido: ' + p.formatHint : ''}
Duración objetivo: ${fmtDur(p.duration)} (${p.duration} segundos)${isLong(p.duration) ? ', video largo que se escribirá por capítulos: el concepto debe dar para varios capítulos' : ''}. Formato: ${p.format === 'vertical' ? 'vertical 9:16' : 'horizontal 16:9'}.
Personajes disponibles (usa sus id):
${castCtx(chars, null)}
Crea 3 propuestas realmente DIFERENTES entre sí (enfoque, estructura narrativa y tono distintos). Originales: no copies videos ni personajes existentes. No inventes estadísticas ni casos reales.
Formato: {"propuestas":[{"titulo":"","gancho":"frase inicial de máximo 15 palabras","concepto":"2-3 frases","personajes":["id"],"estilo_narrativo":"","duracion_seg":${p.duration},"por_que_funciona":"1 frase"}]}`, {label: 'Propuestas de video'});
    return (r.propuestas || r || []).slice(0, 5).map(x => ({titulo: x.titulo, gancho: x.gancho, concepto: x.concepto, personajes: (x.personajes || []).filter(id => chars.some(c => c.id === id)), estilo: x.estilo_narrativo, duracion: p.duration, por_que: x.por_que_funciona}));
  },
  proposalsTemplate(p, chars) {
    const idea = p.idea.trim().split(/\.\s/)[0].replace(/\.$/, ''); const ids = chars.map(c => c.id);
    const pick = (...want) => want.filter(w => ids.includes(w)).concat(ids).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2);
    const gc = (p.cast && p.cast[0]) || 'volt', gn = (chars.find(c => c.id === gc) || {name: 'VOLT'}).name;
    if (p.module === 'gym') return [
      {titulo: `${idea}: explicado en ${fmtDur(p.duration)}`, gancho: `Casi nadie te explica esto sobre ${idea.toLowerCase()}.`, concepto: `${gn} habla a cámara en 2D y la demostración del movimiento se ve en 3D: qué es, cómo se hace y para quién sirve.`, personajes: [gc], estilo: 'Explicativo con demostración', duracion: p.duration, por_que: 'Muestra el método en acción y resuelve una duda concreta.'},
      {titulo: `${idea}: ¿qué dice la evidencia?`, gancho: '¿Funciona de verdad o es solo popular?', concepto: 'Separa popularidad de efectividad: qué está respaldado, qué no y qué precauciones tomar.', personajes: [gc], estilo: 'Mito contra evidencia', duracion: p.duration, por_que: 'La curiosidad por la verdad retiene hasta el final.'},
      {titulo: `3 errores comunes con ${idea.toLowerCase()}`, gancho: 'Si haces esto, estás perdiendo el beneficio.', concepto: `${gn} muestra en 3D la versión incorrecta y la corregida, con riesgos y alternativas para principiantes.`, personajes: [gc], estilo: 'Errores y correcciones', duracion: p.duration, por_que: 'Formato de lista claro y práctico.'}];
    return [
      {titulo: `El error con ${idea.toLowerCase()} que casi todos cometen`, gancho: `¿Y si el problema con ${idea.toLowerCase()} no es lo que crees?`, concepto: 'ALEX comete el error típico y MARCUS le explica por qué pasa y cómo evitarlo con un ejemplo cotidiano.', personajes: pick('alex', 'marcus'), estilo: 'Historia con error y lección', duracion: p.duration, por_que: 'Ver a alguien equivocarse genera identificación.'},
      {titulo: `${idea}: explicado desde cero`, gancho: `Nadie me explicó ${idea.toLowerCase()} así de simple.`, concepto: 'NICO aprende el concepto paso a paso; cada paso se ilustra con objetos animados.', personajes: pick('nico', 'marcus'), estilo: 'Explicación paso a paso', duracion: p.duration, por_que: 'Promesa clara de aprender algo útil rápido.'},
      {titulo: `Lo que aprendí probando ${idea.toLowerCase()}`, gancho: 'Lo probé en pequeño antes de arriesgar más.', concepto: 'LÍA cuenta cómo validar la idea con poco dinero, qué medir y qué riesgos considerar.', personajes: pick('lia', 'nico'), estilo: 'Caso práctico narrado', duracion: p.duration, por_que: 'Enfoque práctico y honesto, sin promesas.'}];
  },
  /* Guion largo: primero un esquema (gancho, problema, capítulos, conclusión y llamada a la acción) y después
     un capítulo por llamada. Se guarda tras cada paso: si la IA llega a su límite, se continúa donde quedó. */
  async scriptLong(p, chars, {onProgress, save} = {}) {
    const prop = p.proposals[p.selected]; const cast = prop.personajes && prop.personajes.length ? prop.personajes : p.cast;
    const words = Math.round(p.duration * WPS), nCh = chaptersFor(p.duration);
    const hookW = clamp(Math.round(words * .03), 25, 60), probW = clamp(Math.round(words * .06), 50, 220), concW = clamp(Math.round(words * .05), 50, 200), ctaW = 30;
    const chW = Math.max(60, Math.round((words - hookW - probW - concW - ctaW) / nCh));
    const spk = h => h && (h === 'narrador' || chars.some(c => c.id === h)) ? h : (cast[0] || 'narrador');
    let job = p.scriptJob && p.scriptJob.duration === p.duration && p.scriptJob.selected === p.selected ? p.scriptJob : null;
    if (!job) {
      onProgress && onProgress(0, nCh + 1, 'Esquema del video');
      const r = await AI.json(`Vas a escribir el guion de un video LARGO de ${fmtDur(p.duration)} (≈ ${words} palabras en total) para ${channelCtx(p.module)}
Propuesta elegida: ${JSON.stringify(prop)}${methodCtx(p)}
Personajes (usa su id) o "narrador":
${castCtx(chars, cast)}
Primero crea el ESQUEMA y escribe completas solo las partes de inicio y cierre:
- gancho: texto completo de ≈ ${hookW} palabras que atrape en los primeros segundos.
- problema: texto completo de ≈ ${probW} palabras.
- capitulos: EXACTAMENTE ${nCh}, en orden lógico, sin repetir ideas; cada uno con titulo (máx. 6 palabras), idea_clave (1 frase), ejemplo (1 frase con un ejemplo cotidiano hipotético) y hablante.
- conclusion: texto completo de ≈ ${concW} palabras que resuma los capítulos.
- cta: ≈ ${ctaW} palabras; no pide dinero.
Reglas: español claro, ortografía perfecta (¿ ¡ y tildes); no inventes cifras ni estudios (si das números, son ejemplos hipotéticos y lo dices); no prometas resultados.
Formato: {"titulo":"","gancho":{"hablante":"","texto":""},"problema":{"hablante":"","texto":""},"capitulos":[{"titulo":"","idea_clave":"","ejemplo":"","hablante":""}],"conclusion":{"hablante":"","texto":""},"cta":{"hablante":"","texto":""},"datos_a_verificar":[""]}`, {label: 'Guion largo: esquema'});
      const caps = (r.capitulos || []).slice(0, 16);
      if (!caps.length) throw Object.assign(new Error('La IA no devolvió capítulos.'), {userMsg: 'La IA no devolvió los capítulos del guion. Pulsa de nuevo para reintentar.'});
      const sec = (k, o) => ({part: k, speaker: spk(o && o.hablante), text: String((o && o.texto) || '').trim()});
      job = {duration: p.duration, selected: p.selected, title: r.titulo || prop.titulo, verify: r.datos_a_verificar || [], chW,
        head: [sec('gancho', r.gancho), sec('problema', r.problema)], tail: [sec('conclusion', r.conclusion), sec('cta', r.cta)],
        chapters: caps.map(c => ({part: 'capitulo', title: String(c.titulo || '').slice(0, 60), key: c.idea_clave || '', example: c.ejemplo || '', speaker: spk(c.hablante), text: ''}))};
      p.scriptJob = job; save && await save();
    }
    const outline = job.chapters.map((c, i) => `${i + 1}. ${c.title}: ${c.key}`).join('\n');
    for (let i = 0; i < job.chapters.length; i++) {
      const c = job.chapters[i]; if (c.text) continue;
      onProgress && onProgress(i + 1, job.chapters.length + 1, `Capítulo ${i + 1} de ${job.chapters.length}`);
      const prev = i ? job.chapters[i - 1].text : job.head.map(s => s.text).join(' ');
      const r = await AI.json(`Escribe el CAPÍTULO ${i + 1} de ${job.chapters.length} del guion "${job.title}" para ${channelCtx(p.module)}${methodCtx(p)}
Esquema completo del video:
${outline}
Este capítulo: "${c.title}". Idea clave: ${c.key}. Ejemplo a usar: ${c.example}
Así terminó lo anterior: "…${prev.split(/\s+/).slice(-45).join(' ')}"
Longitud: ≈ ${job.chW} palabras (entre ${Math.round(job.chW * .9)} y ${Math.round(job.chW * 1.1)}). Lo dice ${c.speaker === 'narrador' ? 'el narrador' : c.speaker}.
Reglas: continúa con naturalidad desde lo anterior; explica con frases cortas y el ejemplo cotidiano; no repitas lo que ya se dijo ni adelantes otros capítulos; no saludes ni te despidas; ortografía perfecta; no inventes cifras ni estudios; no prometas resultados.
Formato: {"texto":""}`, {label: `Guion largo: capítulo ${i + 1}`});
      c.text = String(r.texto || '').trim();
      if (!c.text) throw Object.assign(new Error('Capítulo vacío'), {userMsg: `La IA devolvió vacío el capítulo ${i + 1}. Pulsa de nuevo para continuar desde ahí.`});
      p.scriptJob = job; save && await save();
    }
    const sections = [...job.head, ...job.chapters.map(({part, title, key, speaker, text}) => ({part, title, key, speaker, text})), ...job.tail];
    delete p.scriptJob;
    return {title: job.title, sections, verify: job.verify, source: 'ia', long: true, dur: p.duration};
  },
  async script(p, chars, opts = {}) {
    if (isLong(p.duration)) return this.scriptLong(p, chars, opts);
    const prop = p.proposals[p.selected]; const words = Math.round(p.duration * WPS);
    const cast = prop.personajes && prop.personajes.length ? prop.personajes : p.cast;
    const r = await AI.json(`Escribe el guion final para ${channelCtx(p.module)}
Propuesta elegida: ${JSON.stringify(prop)}${methodCtx(p)}
Duración: ${p.duration} segundos ≈ ${words} palabras en total (no más de ${Math.round(words * 1.1)}).
Estructura obligatoria de 6 partes en este orden: gancho, problema, explicacion, ejemplo, conclusion, cta.
Cada parte la dice un personaje (usa su id) o "narrador". Personajes:
${castCtx(chars, cast)}
Reglas: español claro con frases cortas; ortografía perfecta (con ¿ ¡ y tildes); no inventes cifras ni estudios: si usas números, que sean ejemplos hipotéticos y dilo ("por ejemplo"); no prometas resultados; la llamada a la acción no pide dinero.
Formato: {"titulo":"","secciones":[{"parte":"gancho","hablante":"id o narrador","texto":""}],"datos_a_verificar":["afirmaciones que conviene comprobar antes de publicar"]}`, {label: 'Guion'});
    const secs = PARTS.map(([k]) => { const s = (r.secciones || []).find(x => (x.parte || '').toLowerCase().replace('ó', 'o') === k) || {}; return {part: k, speaker: s.hablante && (s.hablante === 'narrador' || chars.some(c => c.id === s.hablante)) ? s.hablante : (cast[0] || 'narrador'), text: s.texto || ''}; });
    return {title: r.titulo || prop.titulo, sections: secs, verify: r.datos_a_verificar || [], source: 'ia', dur: p.duration};
  },
  scriptTemplate(p) {
    const prop = p.proposals && p.proposals[p.selected] || {}; const sp = (prop.personajes && prop.personajes[0]) || p.cast[0] || 'narrador'; const sp2 = (prop.personajes && prop.personajes[1]) || sp;
    return {title: prop.titulo || p.idea, source: 'manual', verify: [], dur: p.duration, sections: [
      {part: 'gancho', speaker: sp, text: prop.gancho || ''}, {part: 'problema', speaker: sp, text: ''}, {part: 'explicacion', speaker: sp2, text: ''},
      ...(isLong(p.duration) ? Array.from({length: chaptersFor(p.duration)}, (_, i) => ({part: 'capitulo', title: '', speaker: i % 2 ? sp2 : sp, text: ''})) : [{part: 'ejemplo', speaker: sp2, text: ''}]),
      {part: 'conclusion', speaker: sp2, text: ''}, {part: 'cta', speaker: sp, text: 'Guarda este video y síguenos para aprender más.'}].filter(s => !(isLong(p.duration) && s.part === 'explicacion'))};
  },
  /* Bloques de ≈350 palabras para que la IA haga el storyboard de un video largo por partes */
  sbBlocks(p) {
    const wc = t => t.split(/\s+/).filter(Boolean).length; const units = [];
    p.script.sections.forEach((s, si) => {
      if (!s.text.trim()) return;
      const sents = s.text.match(/[^.!?]+[.!?]*/g) || [s.text]; let cur = '', cw = 0, first = true;
      const push = () => { units.push({...s, si, text: cur.trim(), cont: !first}); first = false; cur = ''; cw = 0; };
      sents.forEach(x => { const w = wc(x); if (cw && cw + w > 350) push(); cur += x; cw += w; });
      if (cur.trim()) push();
    });
    const blocks = []; let b = [], bw = 0;
    units.forEach(u => { const w = wc(u.text); if (bw && bw + w > 350) { blocks.push(b); b = []; bw = 0; } b.push(u); bw += w; });
    if (b.length) blocks.push(b);
    return blocks;
  },
  async storyboardBlock(p, chars, units, target, k, n) {
    const allowed = `fondo: ${A.bgKeys.join('|')}
accion: ${A.actList.join('|')}
expresion: ${Object.keys(A.EXPR).join('|')}
objetos: ${Object.keys(A.OBJ).join('|')}
camara: ${Object.keys(E.CAMERAS).join('|')}
transicion: ${Object.keys(E.TRANSITIONS).join('|')}
pos: izq|centro|der${p.module === 'gym' ? '\nmovimiento (solo para nexo; deja "" si habla o actúa): ' + A.moveList.map(m => m.id).join('|') : ''}`;
    const script = units.map(s => `[${s.part}${s.title ? ': ' + s.title : ''}${s.cont ? ' (continuación)' : ''}] (${s.speaker}) ${s.text}`).join('\n');
    const g3 = p.module === 'gym' && (App.state.gymStyle || 'estudio3d') === 'estudio3d';
    const r = await AI.json(`Convierte este guion en un storyboard de animación 2D para ${channelCtx(p.module)}
${n > 1 ? `Es el BLOQUE ${k + 1} de ${n} de un video largo de ${fmtDur(p.duration)}: haz solo las escenas de este bloque (sin presentar de nuevo el video). Duración de este bloque ≈ ${Math.round(target)} s.` : `Duración total ≈ ${p.duration} s.`}${methodCtx(p)}
GUION:
${script}
Valores permitidos (usa exactamente estos):
${allowed}
Personajes: ${chars.map(c => c.id).join(', ')}
Reglas: una escena por cada 8 a 15 palabras de diálogo; cada escena de 2 a 6 s; cambia de fondo o de cámara con frecuencia (nada estático); máximo 2 personajes por escena; máximo 3 objetos; texto_pantalla de máximo 5 palabras; el diálogo de cada escena es un fragmento LITERAL y consecutivo del guion (no inventes texto nuevo) y entre todas cubren el guion completo de este bloque; en "parte" copia la etiqueta entre corchetes sin el título (gancho, problema, explicacion, ejemplo, capitulo, conclusion o cta). ${g3 ? GYM3D_RULES + ' Usa el personaje del reparto (' + (p.cast || ['volt']).join(', ') + ').' : p.module === 'gym' ? 'Hay dos tipos de escena: (1) el personaje HABLA A CÁMARA (sin \"movimiento\", un solo personaje): se anima en 2D en plano medio; úsalas para gancho, problema, conclusión y llamada a la acción; (2) DEMOSTRACIÓN del ejercicio (un solo personaje con \"movimiento\" y hablante \"narrador\" o el mismo personaje en off): se renderiza en 3D; úsalas para explicación, ejemplo y capítulos. Alterna ambos tipos. Activa \"musculos\": true en las demostraciones que expliquen qué músculo trabaja. Usa el personaje del reparto (' + (p.cast || ['nexo']).join(', ') + ').' : 'Usa expresiones y acciones que acompañen lo que se dice.'} El FONDO siempre ilustra lo que se narra: pobreza o falta de dinero → casa_humilde; riqueza, lujo o libertad financiera → mansion; préstamos o cuentas → banco; compras → tienda; negocio o clientes → negocio; inversiones → ciudad. Todo lo que se mencione se muestra con objetos y, cuando se enumeren cosas, se comparen opciones o se den números de ejemplo, añade un "overlay" (checklist, board, pie, versus, tier o error) con datos del guion, sin inventar cifras.
Formato: {"escenas":[{"parte":"","fondo":"","personajes":[{"id":"","pos":"izq","accion":"talk","expresion":"happy","movimiento":""}],"hablante":"id o narrador","dialogo":"","texto_pantalla":"","objetos":[],"camara":"","transicion":"","duracion_seg":3${p.module === 'gym' ? ',"musculos":false' : ''}${g3 ? ',"vista":"frente","emojis":[],"zona":[]' : ''},"overlay":{"type":"","title":"","items":[{"emoji":"","text":"","tier":"","ok":true,"value":0}]}}]}${g3 ? '  (en "personajes" puedes añadir "variante" y "color")' : ''}`, {label: n > 1 ? `Storyboard: bloque ${k + 1} de ${n}` : 'Storyboard'});
    const sc = normalizeScenes(r.escenas || [], chars, p, target);
    if (!sc.length) throw Object.assign(new Error('Sin escenas'), {code: 'bad_json', userMsg: 'La IA no devolvió escenas.'});
    return sc;
  },
  async storyboard(p, chars, {onProgress, save, rulesChars} = {}) {
    const blocks = this.sbBlocks(p); const wc = u => u.reduce((a, s) => a + s.text.split(/\s+/).filter(Boolean).length, 0);
    if (blocks.length <= 1) return {scenes: await this.storyboardBlock(p, chars, blocks[0] || [], p.duration, 0, 1), source: 'ia'};
    let sb = p.storyboard && p.storyboard.partial && p.storyboard.partial.total === blocks.length ? p.storyboard : {source: 'ia', scenes: [], partial: {done: 0, total: blocks.length, rules: 0}};
    for (let k = sb.partial.done; k < blocks.length; k++) {
      onProgress && onProgress(k, blocks.length, `Bloque ${k + 1} de ${blocks.length}`);
      const target = wc(blocks[k]) / WPS; let sc = null;
      for (let tries = 0; tries < 2 && !sc; tries++) {
        try { sc = await this.storyboardBlock(p, chars, blocks[k], target, k, blocks.length); }
        catch (e) { if (['rate_limited', 'no_ai', 'not_granted'].includes(e.code)) { p.storyboard = sb; save && await save(); throw e; } }
      }
      if (!sc) { sc = this.storyboardRules(p, rulesChars || chars, blocks[k], target).scenes; sb.partial.rules++; }
      if (sb.scenes.length && sc[0]) sc[0].transition = sc[0].transition === 'cut' ? 'fade' : sc[0].transition;
      sb.scenes.push(...sc); sb.partial.done = k + 1; p.storyboard = sb; save && await save();
    }
    if (sb.partial.rules) sb.source = 'mixto'; delete sb.partial;
    return sb;
  },
  storyboardRules(p, chars, sections = p.script.sections, target = p.duration) {
    const ids = chars.map(c => c.id); const method = p.methodId && App.Gym && App.Gym.byId(p.methodId);
    const BGK = [[/pobre|pobreza|sin dinero|no (te |le |me |nos )?alcanza|no tiene[ns]? dinero|humilde|escasez|apenas|deudas? (que|y)|quiebra|bancarrota/i, 'casa_humilde'], [/\brico|riqueza|millonari|lujo|mansión|mansion|libertad financiera|patrimonio|adinerad|fortuna/i, 'mansion'], [/banco|préstamo|prestamo|crédito|credito/i, 'banco'], [/tienda|compr|super|gast/i, 'tienda'], [/negocio|emprend|vender|venta|cliente/i, 'negocio'], [/casa|hogar|familia|renta|alquiler/i, 'casa'], [/ciudad|calle|trabajo|empleo/i, 'calle'], [/invers|bolsa|trading|acciones|cripto/i, 'ciudad']];
    const OBK = [[/ahorr/i, 'piggy'], [/tarjeta|deuda|crédito|credito/i, 'card'], [/invers|crec|gananc|subir/i, 'chart_up'], [/perd|riesgo|caer|baj/i, 'chart_down'], [/compr|carrito|gast/i, 'cart'], [/envío|envio|dropshipping|paquete|producto/i, 'box'], [/celular|app|redes|tiktok|instagram|youtube/i, 'phone'], [/idea|aprend/i, 'lightbulb'], [/meta|objetivo/i, 'target'], [/tiempo|mes|año|ano|día|dia/i, 'alarm'], [/interés|interes|porcentaje|%/i, 'percent'], [/banco/i, 'bank'], [/dinero|pesos|sueldo|salario|ingreso/i, 'coins'], [/billete|efectivo/i, 'bills'], [/presupuesto|calcul|cuenta/i, 'calculator'], [/error|cuidado|ojo|evita/i, 'warning'], [/músculo|musculo|hipertrofia/i, 'muscle'], [/cardio|corazón|corazon|resistencia/i, 'heart'], [/estudio|evidencia|ciencia/i, 'book']];
    const CAM = {gancho: 'shake', problema: 'push_speaker', explicacion: 'pan_left', ejemplo: 'zoom_in', conclusion: 'zoom_out', cta: 'zoom_in'};
    const CAMS = ['pan_left', 'zoom_in', 'push_speaker', 'zoom_out', 'pan_right'];
    const EXP = {gancho: 'surprised', problema: 'worried', explicacion: 'confident', ejemplo: 'thinking', conclusion: 'happy', cta: 'excited'};
    const EXPS = ['confident', 'thinking', 'happy', 'surprised', 'confident'];
    const TRS = ['cut', 'slide', 'fade', 'zoom', 'wipe', 'slide'];
    const LBL = {problema: 'El problema', explicacion: 'La clave', ejemplo: 'Un ejemplo', conclusion: 'En resumen', cta: 'Tu siguiente paso'};
    const wc = t => t.split(/\s+/).filter(Boolean).length;
    // agrupa frases en escenas de máximo ≈ 18 palabras (las frases muy largas se parten)
    const groupsOf = text => {
      const sents = (text.match(/[^.!?]+[.!?]*/g) || [text]).flatMap(x => { const w = x.trim().split(/\s+/); if (w.length <= 26) return [x]; const out = []; for (let i = 0; i < w.length; i += 16) out.push(w.slice(i, i + 16).join(' ')); return out; });
      const out = []; let cur = '', cw = 0;
      sents.forEach(x => { const w = wc(x); if (cw && cw + w > 18) { out.push(cur.trim()); cur = ''; cw = 0; } cur += (cur ? ' ' : '') + x.trim(); cw += w; });
      if (cur.trim()) out.push(cur.trim()); return out;
    };
    const scenes = []; let bgPrev = '';
    sections.forEach((s, i) => {
      if (!s.text.trim()) return;
      const pk = partKind(s.part), chap = s.part === 'capitulo';
      groupsOf(s.text).forEach((txt, j) => {
        let bg = (p.module === 'fin' || !/gimnasio|pesa|entren|ejercicio/i.test(txt) ? (BGK.find(([re]) => re.test(txt)) || [])[1] : '') || (p.module === 'gym' ? ['gimnasio', 'pista', 'patio', 'parque'][(i + j) % 4] : ['oficina', 'estudio', 'casa', 'calle', 'negocio'][(i + j) % 5]);
        if (bg === bgPrev && p.module !== 'gym') bg = ['estudio', 'oficina', 'calle'][(i + j) % 3]; bgPrev = bg;
        const objs = []; OBK.forEach(([re, k]) => { if (re.test(txt) && objs.length < 2 && !objs.includes(k)) objs.push(k); });
        const ex = chap ? EXPS[j % EXPS.length] : EXP[pk];
        let cs;
        if (p.module === 'gym') { const mv = method ? method.m : 'squat'; const demo = ['explicacion', 'ejemplo'].includes(pk) && (!chap || j % 2 === 0); cs = [{id: (p.cast && ids.includes(p.cast[0])) ? p.cast[0] : ids.includes('nexo') ? 'nexo' : ids[0], pos: 'centro', move: demo ? mv : '', act: pk === 'cta' ? 'present' : pk === 'problema' ? 'shrug' : chap ? ['talk', 'point', 'present', 'think'][j % 4] : 'talk', expr: ex}]; }
        else { const sp = s.speaker !== 'narrador' && ids.includes(s.speaker) ? s.speaker : ids[0]; const other = (p.cast || []).find(c => c !== sp && ids.includes(c)); cs = [{id: sp, pos: other ? 'izq' : 'centro', act: pk === 'conclusion' ? 'present' : pk === 'explicacion' ? ['point', 'talk', 'present'][j % 3] : 'talk', expr: ex}]; if (other && pk !== 'cta') cs.push({id: other, pos: 'der', act: pk === 'problema' ? 'worried' : pk === 'gancho' ? 'idle' : ['think', 'idle', 'talk'][j % 3], expr: pk === 'problema' ? 'worried' : ['thinking', 'happy', 'surprised'][j % 3]}); }
        const words = txt.replace(/[¿¡?!.,:;"…]/g, '').split(/\s+/).filter(Boolean);
        const key = chap && j === 0 && s.title ? trimStop(s.title.replace(/[¿¡?!.,:;"…]/g, '').split(/\s+/).slice(0, 5)).join(' ') : words.length <= 5 ? words.join(' ') : pk === 'gancho' ? trimStop(words.slice(0, 5)).join(' ') : (LBL[pk] || trimStop(words.slice(0, 4)).join(' '));
        scenes.push({part: s.part, bg: p.module === 'gym' && method && method.bg && j === 0 && ['explicacion', 'ejemplo'].includes(pk) ? method.bg : bg, chars: cs, speaker: s.speaker, dialogue: txt.trim(), text: (pk === 'gancho' || j === 0) && !s.cont ? key : '', objects: objs, camera: chap || pk === 'explicacion' ? CAMS[(i + j) % CAMS.length] : (CAM[pk] || 'static'), transition: scenes.length ? TRS[scenes.length % TRS.length] : 'cut', dur: +E.estimateDur(txt).toFixed(1), highlight: p.module === 'gym' && (pk === 'explicacion' || /anat/i.test(p.formatHint || '')), chapterTitle: chap && j === 0 && !s.cont ? s.title || '' : undefined});
      });
    });
    { const sentences = t => (t.match(/[^.!?;]+[.!?;]?/g) || []).map(x => x.replace(/[¿¡?!.;]/g, '').trim()).filter(Boolean);
      if (!(p.module === 'gym' && (App.state.gymStyle || 'estudio3d') === 'estudio3d')) scenes.forEach(sc => {
        if (sc.part === 'problema' && !sc.overlay) { const f = sentences(sc.dialogue)[0] || ''; if (f) sc.overlay = {type: 'error', title: 'ERROR', items: [{text: f.split(/\s+/).slice(0, 9).join(' ')}]}; }
        if (sc.chapterTitle && !sc.overlay) sc.overlay = {type: 'board', title: sc.chapterTitle.slice(0, 40), items: sentences(sc.dialogue).slice(0, 2).map(x => ({text: x.split(/\s+/).slice(0, 6).join(' '), ok: true}))};
        if (sc.part === 'conclusion' && !sc.overlay) { const its = sentences(sc.dialogue).slice(0, 3).map(x => ({text: x.split(/\s+/).slice(0, 6).join(' '), ok: true})); if (its.length) sc.overlay = {type: 'checklist', title: 'Resumen', items: its}; }
        if (!sc.overlay && /\b(vs|versus|en vez de|o mejor)\b/i.test(sc.dialogue)) { const [a, b] = sc.dialogue.split(/\b(?:vs|versus|en vez de|o mejor)\b/i).map(x => x.replace(/[¿¡?!.,]/g, '').trim().split(/\s+/).slice(-3).join(' ')); if (a && b) sc.overlay = {type: 'versus', title: '', items: [{emoji: '', text: a}, {emoji: '', text: b}]}; }
      });
    }
    if (p.module === 'gym' && (App.state.gymStyle || 'estudio3d') === 'estudio3d') {
      const sentences = t => (t.match(/[^.!?;]+[.!?;]?/g) || []).map(x => x.replace(/[¿¡?!.;]/g, '').trim()).filter(Boolean);
      scenes.forEach((sc, i) => {
        const talk = !sc.chars.some(c => c.move);
        sc.bg = talk ? ['gym_oscuro', 'rayos'][i % 2] : ['plano_azul', 'gym_oscuro', 'rayos'][i % 3];
        if (talk) { sc.view = 'frente'; sc.chars.forEach(c => c.act = c.act === 'idle' ? 'talk' : c.act); }
        else if (sc.part === 'capitulo') sc.view = ['tres_cuartos', 'perfil', 'orbita', 'frente'][i % 4];
        if (sc.part === 'gancho') sc.emojis = /\?/.test(sc.dialogue) ? ['🤔', '❓'] : ['🔥', '💪'];
        if (sc.part === 'problema' && !sc.overlay) { const f = sentences(sc.dialogue)[0] || ''; if (f) sc.overlay = {type: 'error', title: 'ERROR', items: [{text: f.split(/\s+/).slice(0, 9).join(' ')}]}; }
        if (sc.chapterTitle && !sc.overlay) { const its = sentences(sc.dialogue).slice(0, 2).map(x => ({text: x.split(/\s+/).slice(0, 6).join(' '), ok: true})); sc.overlay = {type: 'board', title: sc.chapterTitle.slice(0, 40), items: its}; }
        if (sc.part === 'conclusion' && !sc.overlay) { const its = sentences(sc.dialogue).slice(0, 3).map(x => ({text: x.split(/\s+/).slice(0, 6).join(' '), ok: true})); if (its.length) sc.overlay = {type: 'checklist', title: 'Resumen', items: its}; }
        if (sc.part === 'cta') sc.emojis = ['✅', '💪'];
      });
    }
    scenes.forEach(sc => delete sc.chapterTitle);
    return {scenes: fitDurations(scenes, target), source: 'reglas'};
  },
  async qaReview(p) {
    return AI.json(`Revisa este guion de un video de ${channelCtx(p.module)}
GUION:
${p.script.sections.map(s => `[${s.part}] ${s.text}`).join('\n')}
Devuelve errores de ortografía o gramática (con el texto EXACTO a reemplazar), afirmaciones con riesgo de ser falsas, engañosas o que prometan resultados, y si la historia es coherente.
"riesgo": "alto" solo si es falsa, engañosa o promete ganancias/resultados; "medio" si necesita matiz o fuente; "bajo" si está bien.
Formato: {"ortografia":[{"original":"","correccion":""}],"exactitud":[{"afirmacion":"","riesgo":"bajo","nota":""}],"coherencia":{"ok":true,"nota":""}}`, {label: 'Control de calidad del guion', tier: 'default'});
  },
  async thumbTexts(p) {
    const r = await AI.json(`Escribe 5 textos MUY cortos para miniaturas de YouTube (máximo 4 palabras cada uno, en mayúsculas no hace falta) para este video de ${channelCtx(p.module)}
Título: ${p.script ? p.script.title : p.idea}
Gancho: ${p.script ? p.script.sections[0].text : ''}
Deben ser llamativos pero honestos (sin clickbait engañoso ni promesas de dinero). Formato: {"textos":["","","","",""]}`, {label: 'Textos de miniatura', tier: 'quick'});
    return (r.textos || []).slice(0, 5);
  },
  thumbTextsTemplate(p) { const t = ((p.script && p.script.title) || p.idea || 'Mira esto').split(/[:.]/)[0]; const w = t.replace(/[¿¡?!,]/g, '').split(/\s+/).filter(Boolean); return [trimStop(w.slice(0, 4)).join(' '), '¿Lo sabías?', 'Error común', 'Evita esto', trimStop(w.slice(-3).filter((x, i, a) => i > 0 || !STOP.has(x.toLowerCase()))).join(' ') || 'Mira esto']; },
  async publishPack(p) {
    const r = await AI.json(`Prepara la publicación de este video de ${channelCtx(p.module)}
Título del guion: ${p.script.title}
Guion: ${p.script.sections.map(s => s.text).join(' ')}
Formato: ${p.format === 'vertical' ? 'Short / Reel / TikTok' : 'YouTube horizontal'}.
Devuelve: título (máx. 70 caracteres, honesto), descripción (3-5 líneas, incluye al final un aviso: "Contenido educativo; no es asesoría ${p.module === 'gym' ? 'médica ni de entrenamiento personalizada' : 'financiera'}."), y 6 a 10 hashtags en español.
Formato: {"titulo":"","descripcion":"","hashtags":["#"]}`, {label: 'Paquete de publicación', tier: 'quick'});
    return {title: r.titulo || p.script.title, desc: r.descripcion || '', tags: (r.hashtags || []).map(h => h.startsWith('#') ? h : '#' + h), source: 'ia'};
  },
  publishTemplate(p) {
    const cat = (p.category || '').toLowerCase().replace(/[^a-záéíóúñ ]/gi, '').split(' ').filter(Boolean);
    return {title: (p.script && p.script.title || p.idea).slice(0, 70), desc: `${p.script ? p.script.sections[0].text : ''}\n\n${p.script ? (p.script.sections.find(s => s.part === 'conclusion') || {text: ''}).text : ''}\n\nContenido educativo; no es asesoría ${p.module === 'gym' ? 'médica ni de entrenamiento personalizada' : 'financiera'}.`,
      tags: p.module === 'gym' ? ['#gimnasio', '#entrenamiento', '#fitness', '#fuerza', '#cienciadelentrenamiento', '#shorts'] : ['#finanzaspersonales', '#educacionfinanciera', '#dinero', '#emprendimiento', '#ahorro', '#shorts'].concat(cat.length ? ['#' + cat.join('')] : []), source: 'plantilla'};
  }
};

const VIEWS = {frente: 'De frente', tres_cuartos: 'Tres cuartos', perfil: 'Perfil', espalda: 'Espalda', orbita: 'Cámara orbital'};
const OVT = {tier: 'Tier list S/A/B/C', board: 'Pizarra', checklist: 'Checklist / resumen', pie: 'Gráfico circular', error: 'ERROR tachado', versus: 'Comparación con flecha'};
const ZONES = ['legs', 'glutes', 'core', 'chest', 'back', 'arms', 'shoulders', 'grip', 'calves', 'hamstrings', 'grasa'];
App.VIEWS = VIEWS; App.OVT = OVT; App.ZONES = ZONES;
function cleanOverlay(o) {
  if (!o || !OVT[o.type]) return null;
  return {type: o.type, title: String(o.title || o.titulo || '').slice(0, 40), items: (o.items || []).slice(0, 8).map(it => { const tier = String(it.tier || '').toUpperCase(); const v = +(it.value ?? it.valor); return {emoji: String(it.emoji || '').slice(0, 4), text: String(it.text || it.texto || '').slice(0, 40), tier: ['S', 'A', 'B', 'C'].includes(tier) ? tier : undefined, ok: it.ok === true ? true : it.ok === false ? false : undefined, value: v > 0 ? v : undefined}; })};
}
function extras3d(s, cs) {
  const out = {};
  if (VIEWS[s.vista]) out.view = s.vista;
  const ov = cleanOverlay(s.overlay); if (ov) out.overlay = ov;
  const em = (s.emojis || []).filter(e => typeof e === 'string' && e.trim()).map(e => e.trim().slice(0, 4)).slice(0, 3); if (em.length) out.emojis = em;
  const z = (s.zona || []).filter(k => ZONES.includes(k)); if (z.length && cs[0]) { out.highlight = true; cs[0].muscles = z; }
  return out;
}
App.parseItems = txt => String(txt || '').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 8).map(l => { const [left, right = ''] = l.split('|').map(x => x.trim()); const m = left.match(/^(\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*)\s*(.*)$/u); const it = {emoji: m ? m[1] : '', text: (m ? m[2] : left).slice(0, 40)}; const r = right.toUpperCase(); if (['S', 'A', 'B', 'C'].includes(r)) it.tier = r; else if (/^(OK|SI|SÍ|✅)$/.test(r)) it.ok = true; else if (/^(NO|X|❌)$/.test(r)) it.ok = false; else if (+right > 0) it.value = +right; return it; });
App.itemsText = items => (items || []).map(it => `${it.emoji ? it.emoji + ' ' : ''}${it.text || ''}${it.tier ? ' | ' + it.tier : it.ok === true ? ' | ok' : it.ok === false ? ' | no' : it.value ? ' | ' + it.value : ''}`).join('\n');
function normalizeScenes(list, chars, p, target = p.duration) {
  const ids = chars.map(c => c.id); const pick = (v, set, d) => set.includes(v) ? v : d;
  const out = list.map((s, i) => {
    let cs = (s.personajes || []).filter(c => ids.includes(c.id)).slice(0, 3).map(c => ({id: c.id, pos: pick(c.pos, ['izq', 'centro', 'der'], 'centro'), act: pick(c.accion, A.actList, 'talk'), expr: pick(c.expresion, Object.keys(A.EXPR), 'neutral'), move: A.MOVES[c.movimiento] && !A.actList.includes(c.movimiento) ? c.movimiento : '', variant: pick(c.variante, ['sobrepeso', 'delgado'], ''), tint: /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : ''}));
    if (!cs.length) cs = [{id: (p.cast || ids)[0], pos: 'centro', act: 'talk', expr: 'neutral', move: ''}];
    const dialogue = String(s.dialogo || '').trim();
    return {part: s.parte || '', bg: pick(s.fondo, A.bgKeys, p.module === 'gym' ? 'gimnasio' : 'oficina'), chars: cs, speaker: s.hablante === 'narrador' || ids.includes(s.hablante) ? s.hablante : cs[0].id,
      dialogue, text: String(s.texto_pantalla || '').split(/\s+/).slice(0, 6).join(' '), objects: (s.objetos || []).filter(k => A.OBJ[k]).slice(0, 3),
      camera: pick(s.camara, Object.keys(E.CAMERAS), 'static'), transition: i ? pick(s.transicion, Object.keys(E.TRANSITIONS), 'fade') : 'cut',
      dur: Math.max(+s.duracion_seg || 3, E.estimateDur(dialogue)), highlight: !!s.musculos, ...extras3d(s, cs)};
  });
  return fitDurations(out, target);
}
function fitDurations(scenes, target) {
  const tot = scenes.reduce((a, s) => a + s.dur, 0); if (!tot) return scenes;
  // solo se estiran escenas cortas; nunca se acortan por debajo de lo que tarda en leerse
  if (tot < target * .9) { const k = target / tot; scenes.forEach(s => s.dur = s.dur * k); }
  scenes.forEach(s => s.dur = +(+s.dur).toFixed(1));
  return scenes;
}
App.normalizeScenes = normalizeScenes;

/* ---------- utilidades de exportación ---------- */
const srtTime = t => { const ms = Math.round(t * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, r = ms % 1000; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(r).padStart(3, '0')}`; };
App.makeSRT = tl => { let i = 0; return tl.scenes.flatMap(s => s.chunks.map(c => `${++i}\n${srtTime(c.s)} --> ${srtTime(c.e + .1)}\n${c.words.map(w => w.w).join(' ')}\n`)).join('\n'); };
App.scriptText = p => `${p.script.title}\n\n` + p.script.sections.map((s, i) => `${partLabel(p.script.sections, i).toUpperCase()} (${s.speaker})\n${s.text}`).join('\n\n');
const slug = s => String(s || 'video').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'video';
App.slug = slug;

/* ---------- control de calidad ---------- */
const QA = App.QA = {
  async run(p, chars, {useAI = true, tl} = {}) {
    const checks = []; const add = (id, label, status, detail, fixable) => checks.push({id, label, status, detail, fixable: !!fixable});
    const secs = p.script ? p.script.sections : [];
    // ortografía y exactitud
    let ai = null;
    if (useAI && AI.available() && p.script) { try { ai = await Gen.qaReview(p); } catch (e) { UI.toast(esc(e.userMsg || e.message), 'warn'); } }
    const localSp = []; secs.forEach(s => { (s.text.match(/(^|[\s"])([A-ZÁÉÍÓÚÑa-záéíóúñ][^¿?]*\?)/g) || []).forEach(q => { if (!/¿/.test(s.text.slice(0, s.text.indexOf(q.trim()) + 1)) && !/¿/.test(q)) localSp.push(q.trim()); }); if (/\s{2,}/.test(s.text)) localSp.push('espacios dobles'); if (/\b(\w+)\s+\1\b/i.test(s.text)) localSp.push('palabra repetida'); });
    const spell = (ai && ai.ortografia || []).filter(x => x.original && x.correccion && x.original !== x.correccion);
    if (!p.script) add('ortografia', 'Ortografía', 'fail', 'No hay guion.');
    else if (spell.length || localSp.length) add('ortografia', 'Ortografía', 'warn', `${spell.length + localSp.length} posible(s) corrección(es): ${esc([...spell.map(x => `«${x.original}» → «${x.correccion}»`), ...localSp.slice(0, 3)].slice(0, 5).join('; '))}`, true);
    else add('ortografia', 'Ortografía', ai ? 'ok' : 'warn', ai ? 'Sin errores detectados.' : 'Revisión básica sin errores; la revisión completa requiere IA.');
    const risky = (ai && ai.exactitud || []).filter(x => x.riesgo === 'alto' || x.riesgo === 'medio');
    if (!p.script) add('exactitud', 'Exactitud de la información', 'fail', 'No hay guion.');
    else if (!ai) add('exactitud', 'Exactitud de la información', 'warn', 'No verificada automáticamente (IA no disponible). Revisa las afirmaciones manualmente.' + (p.script.verify && p.script.verify.length ? ' Pendientes: ' + esc(p.script.verify.join('; ')) : ''));
    else if (risky.some(x => x.riesgo === 'alto')) add('exactitud', 'Exactitud de la información', 'fail', 'Afirmaciones problemáticas: ' + esc(risky.filter(x => x.riesgo === 'alto').map(x => `«${x.afirmacion}» (${x.nota})`).join('; ')) + '. Corrígelas en el guion.');
    else if (risky.length) add('exactitud', 'Exactitud de la información', 'warn', 'Conviene matizar: ' + esc(risky.map(x => `«${x.afirmacion}» (${x.nota})`).join('; ')));
    else add('exactitud', 'Exactitud de la información', 'ok', 'Sin afirmaciones de riesgo detectadas.');
    // coherencia
    const empty = secs.filter(s => !s.text.trim()).map(s => s.part);
    if (!p.script || empty.length) add('coherencia', 'Coherencia del guion', 'fail', empty.length ? 'Partes vacías: ' + secs.map((s, i) => s.text.trim() ? null : partLabel(secs, i)).filter(Boolean).join(', ') : 'No hay guion.');
    else if (ai && ai.coherencia && ai.coherencia.ok === false) add('coherencia', 'Coherencia del guion', 'warn', esc(ai.coherencia.nota || 'La IA sugiere revisar la secuencia.'));
    else add('coherencia', 'Coherencia del guion', 'ok', `Las ${secs.length} partes del guion están completas.`);
    // audio
    const nar = App.narrations[p.id];
    if (nar) { const a = E.analyzeAudio(nar.buffer); if (a.peak > .99) add('audio', 'Calidad del audio', 'warn', 'La narración tiene picos saturados (clipping). Grábala con menos volumen.'); else if (a.rms < .02) add('audio', 'Calidad del audio', 'warn', 'La narración tiene volumen muy bajo.'); else if (a.silentRatio > .55) add('audio', 'Calidad del audio', 'warn', 'La narración tiene muchos silencios.'); else add('audio', 'Calidad del audio', 'ok', `Narración correcta (${a.duration.toFixed(1)} s, pico ${(a.peak * 100).toFixed(0)}%).`); }
    else add('audio', 'Calidad del audio', p.music === 'none' ? 'warn' : 'ok', p.music === 'none' ? 'El video no tiene voz grabada ni música.' : 'Música y efectos sintetizados (originales). El archivo no lleva voz grabada: se apoya en subtítulos. Puedes subir una narración en el paso Voces.');
    // subtítulos
    if (tl && tl.scenes.length) {
      let fast = 0, outside = 0; tl.scenes.forEach(s => { const chars2 = (s.dialogue || '').length; if (chars2 / Math.max(.5, s.dur - .35) > 17) fast++; s.chunks.forEach(c => { if (c.s < s.start || c.e > s.end) outside++; }); });
      add('subtitulos', 'Sincronización de subtítulos', fast || outside ? 'warn' : 'ok', fast ? `${fast} escena(s) con lectura demasiado rápida (más de 17 caracteres/s).` : outside ? 'Hay subtítulos fuera de su escena.' : (nar ? 'Sincronía estimada por longitud de palabras; revisa la vista previa con tu narración.' : 'Cada subtítulo cae dentro de su escena con velocidad de lectura cómoda.'), fast > 0);
    } else add('subtitulos', 'Sincronización de subtítulos', 'fail', 'No hay storyboard.');
    // personajes
    const sb = p.storyboard ? p.storyboard.scenes : [];
    const missing = [...new Set(sb.flatMap(s => s.chars.map(c => c.id)).filter(id => !chars.some(c => c.id === id)))];
    add('personajes', 'Consistencia de personajes', missing.length ? 'fail' : sb.length ? 'ok' : 'fail', missing.length ? 'Personajes inexistentes: ' + missing.join(', ') : sb.length ? 'Todos los personajes usan su diseño guardado de la biblioteca (misma ropa, colores y voz en todo el video).' : 'Sin escenas.', missing.length > 0);
    // animaciones
    if (sb.length) { const statics = sb.filter(s => s.camera === 'static').length; const long = sb.filter(s => s.dur > 8).length; const emptyS = sb.filter(s => !s.chars.length && !s.objects.length).length; const st = emptyS ? 'fail' : (statics / sb.length > .5 || long) ? 'warn' : 'ok'; add('animaciones', 'Funcionamiento de animaciones', st, emptyS ? `${emptyS} escena(s) sin personajes ni objetos.` : long ? `${long} escena(s) de más de 8 s sin cambio de plano.` : statics / sb.length > .5 ? 'Demasiadas escenas con cámara suave; puede sentirse estático.' : `${sb.length} escenas con movimiento de cámara, transiciones y personajes animados.`, st !== 'ok'); }
    else add('animaciones', 'Funcionamiento de animaciones', 'fail', 'Sin escenas.');
    // render
    if (!p.render) add('render', 'Calidad de renderizado', 'fail', 'Aún no se ha renderizado el video.');
    else { const r = p.render; const okRes = r.probe ? (r.probe.w === r.W && r.probe.h === r.H) : null; add('render', 'Calidad de renderizado', r.size > 0 && okRes !== false ? 'ok' : 'fail', `${r.W}×${r.H}, ${r.ext.toUpperCase()}, ${fmtBytes(r.size)}${r.probe ? `, verificado en reproductor (${r.probe.w}×${r.probe.h})` : ''}${r.stale ? '. Ojo: el storyboard cambió después del render; vuelve a renderizar.' : ''}.`); if (r.stale) checks[checks.length - 1].status = 'warn'; }
    // duración
    const dur = tl ? tl.duration : 0; const ratio = dur / p.duration;
    add('duracion', 'Duración', !dur ? 'fail' : ratio > 2 || ratio < .5 ? 'fail' : Math.abs(ratio - 1) > .2 ? 'warn' : 'ok', dur ? `${fmtDur(dur)} (objetivo ${fmtDur(p.duration)}).${ratio > 1.2 ? ' El guion es más largo que el objetivo: acórtalo en el paso Guion si necesitas esa duración exacta.' : ''}` : 'Sin duración.', dur > 0 && ratio < .8);
    // legibilidad
    const longCap = sb.filter(s => (s.text || '').split(/\s+/).filter(Boolean).length > 6).length;
    add('legibilidad', 'Legibilidad de textos', longCap ? 'warn' : 'ok', longCap ? `${longCap} texto(s) en pantalla con más de 6 palabras.` : 'Textos en pantalla cortos, letra gruesa con contorno y contraste alto.', longCap > 0);
    // miniatura
    if (!p.thumb) add('miniatura', 'Correspondencia de la miniatura', 'warn', 'Aún no elegiste miniatura.');
    else { const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\W+/).filter(w => w.length > 3); const tw = norm(p.thumb.text), ttl = norm((p.script && p.script.title) + ' ' + (p.publish ? p.publish.title : '') + ' ' + secs.map(s => s.text).join(' ')); const share = tw.filter(w => ttl.includes(w)).length; add('miniatura', 'Correspondencia de la miniatura', share || !tw.length ? 'ok' : 'warn', share ? 'El texto de la miniatura coincide con el tema del video.' : 'El texto de la miniatura no aparece en el guion: comprueba que no sea engañoso.'); }
    const approved = !checks.some(c => c.status === 'fail');
    return {at: Date.now(), checks, approved: false, canApprove: approved, ai: ai ? {ortografia: spell, exactitud: risky} : null};
  },
  async autofix(p, qa, chars) {
    const fixed = [];
    if (p.script) {
      const sp = (qa.ai && qa.ai.ortografia) || [];
      p.script.sections.forEach(s => {
        let t = s.text; sp.forEach(x => { if (t.includes(x.original)) t = t.split(x.original).join(x.correccion); });
        t = t.replace(/\s{2,}/g, ' ').replace(/\b(\w+)\s+\1\b/gi, '$1');
        t = t.replace(/(^|[.!¡]\s+)([A-ZÁÉÍÓÚÑa-záéíóúñ][^.!?¿]*\?)/g, (m, a, q) => a + '¿' + q);
        if (t !== s.text) { fixed.push('Ortografía en ' + s.part); s.text = t; }
      });
      if (p.storyboard) p.storyboard.scenes.forEach(sc => { let t = sc.dialogue; sp.forEach(x => { if (t.includes(x.original)) t = t.split(x.original).join(x.correccion); }); t = t.replace(/\s{2,}/g, ' ').replace(/(^|[.!¡]\s+)([A-ZÁÉÍÓÚÑa-záéíóúñ][^.!?¿]*\?)/g, (m, a, q) => a + '¿' + q); if (t !== sc.dialogue) { sc.dialogue = t; } });
    }
    if (p.storyboard) {
      const ids = chars.map(c => c.id);
      p.storyboard.scenes.forEach(s => {
        const before = s.chars.length; s.chars = s.chars.filter(c => ids.includes(c.id)); if (!s.chars.length) s.chars = [{id: (p.cast || ids)[0], pos: 'centro', act: 'talk', expr: 'neutral'}]; if (s.chars.length !== before) fixed.push('Personaje reemplazado');
        const need = (s.dialogue || '').length / 17 + .45; if (s.dur < need) { s.dur = +need.toFixed(1); fixed.push('Duración ampliada para leer subtítulos'); }
        const w = (s.text || '').split(/\s+/).filter(Boolean); if (w.length > 6) { s.text = w.slice(0, 5).join(' '); fixed.push('Texto en pantalla acortado'); }
        if (s.dur > 8 && s.camera === 'static') { s.camera = 'zoom_in'; fixed.push('Cámara añadida a escena larga'); }
      });
      const statics = p.storyboard.scenes.filter(s => s.camera === 'static'); if (statics.length / p.storyboard.scenes.length > .5) { statics.forEach((s, i) => s.camera = ['zoom_in', 'pan_left', 'push_speaker', 'zoom_out'][i % 4]); fixed.push('Variedad de cámara'); }
      const tot = p.storyboard.scenes.reduce((a, s) => a + s.dur, 0);
      if (tot < p.duration * .8) { p.storyboard.scenes.forEach(s => s.dur = +(s.dur * p.duration / tot).toFixed(1)); fixed.push('Duración ajustada al objetivo'); }
      if (p.render && fixed.length) p.render.stale = true;
    }
    return [...new Set(fixed)];
  }
};
App.narrations = {};

/* ============ Vista: Crear video (flujo completo) ============ */
App.productionView = async (main, mod) => {
  const chars = (await Lib.chars()).filter(c => c.module === mod || (mod === 'fin' && c.module !== 'gym'));
  const allChars = await Lib.chars(); await A.preload(allChars);
  const settings = await Lib.settings(); const brand = await Lib.brand(mod);
  const animOf = () => p.anim || ((settings.anim || {})[mod]) || (mod === 'gym' ? (settings.gymStyle === 'plano' ? '2d' : '3d') : '2d');
  const styleOf = () => animOf() === '3d' ? (mod === 'gym' && settings.gymStyle === 'mixto' ? 'mixto' : 'estudio3d') : 'plano';
  const look3d = () => ({render3d: animOf() === '3d', gymStyle: styleOf(), motion: settings.motion || 'alto'});
  let p = await Projects.get(Projects.getCurrent(mod));
  if (!p || p.module !== mod) p = null;
  if (App.state.newProject && App.state.newProject.module === mod) { p = await Projects.create(mod, App.state.newProject.init); Projects.setCurrent(mod, p.id); App.state.newProject = null; }
  if (!p) { const blank = (await Projects.list(mod)).find(x => !x.idea && !x.proposals); p = blank || await Projects.create(mod); Projects.setCurrent(mod, p.id); }
  if (App.state.jumpStep != null) { p.step = App.state.jumpStep; App.state.jumpStep = null; }
  App.state.gymStyle = styleOf();
  let player = null;
  const save = () => Projects.save(p);
  const projects = await Projects.list(mod);
  const tlOf = (o = {}) => { const tl = E.build({...p, brand, handle: settings.showHandle ? (brand.handle || '') : '', subs: settings.subs, progressBar: settings.progressBar, ...look3d()}, allChars, o); return tl; };
  const done = i => [!!p.idea, p.selected != null, !!p.script, !!(p.storyboard && p.storyboard.scenes.length && !p.storyboard.partial), !!p.voiceChecked, !!p.previewed, !!p.render, !!p.thumb, !!(p.qa && p.qa.approved), !!(p.exported)][i];

  main.innerHTML = App.head(mod === 'fin' ? 'Finanzas · Producción' : 'Gym · Producción', p.title || (mod === 'fin' ? 'Nuevo video financiero' : 'Nuevo video de entrenamiento'),
    'Idea → propuestas → guion → storyboard → voces → render → miniatura → control de calidad → exportar. Todo se guarda automáticamente.',
    `<select id="projSel" aria-label="Proyecto" style="width:auto;max-width:260px">${projects.map(x => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.title || x.idea || 'Sin título').slice(0, 40)}</option>`).join('')}</select><button class="btn" id="newProj">${icon('plus')}Nuevo</button>`) +
    `<div class="steps" id="steps"></div><div id="genAll"></div><div id="stepBody"></div>`;
  $('#projSel').onchange = e => { Projects.setCurrent(mod, e.target.value); App.route(); };
  $('#newProj').onclick = async () => { const n = await Projects.create(mod); Projects.setCurrent(mod, n.id); App.route(); };

  const renderSteps = () => {
    const h1 = $('main h1'); if (h1) h1.textContent = p.title || (mod === 'fin' ? 'Nuevo video financiero' : 'Nuevo video de entrenamiento'); const op = $(`#projSel option[value="${p.id}"]`); if (op) op.textContent = (p.title || p.idea || 'Sin título').slice(0, 40);
    $('#steps').innerHTML = STEPS.map((s, i) => `<button data-i="${i}" ${p.step === i ? 'aria-current="step"' : ''} ${done(i) ? 'data-done' : ''}><i>${done(i) ? '✓' : i + 1}</i>${s}</button>`).join('');
    $$('#steps button').forEach(b => b.onclick = () => go(+b.dataset.i));
    $('#genAll').innerHTML = p.selected != null ? `<div class="card" style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"><div><b>Producción automática</b><div class="small">Completa lo que falte: guion, storyboard, render, miniatura, calidad y textos de publicación. Se detiene y te avisa si se agota una cuota gratuita.</div></div><button class="btn primary big" id="genAllBtn">${icon('spark', 20)}GENERAR VIDEO COMPLETO</button></div>` : '';
    const g = $('#genAllBtn'); if (g) g.onclick = () => generateAll(g);
  };
  const go = i => { if (player) { player.destroy(); player = null; } p.step = i; save(); renderSteps(); renderStep(); window.scrollTo({top: 0}); };
  const body = () => $('#stepBody');
  const nextBtn = (label, i) => `<button class="btn primary" data-next="${i}">${esc(label)} →</button>`;
  const bindNext = () => $$('[data-next]').forEach(b => b.onclick = () => go(+b.dataset.next));

  /* ---- paso 0: idea ---- */
  const stepIdea = () => {
    const cats = mod === 'fin' ? App.FIN_CATS : (App.Gym ? App.Gym.CATS.map(c => c[1]) : []);
    body().innerHTML = `<div class="grid g2"><div class="card stack">
      <label class="f">Escribe tu idea de video<textarea id="idea" placeholder="${mod === 'fin' ? 'Ej.: por qué la gente que gana bien igual llega sin dinero a fin de mes' : 'Ej.: cómo entrenan el agarre los escaladores'}" style="min-height:120px">${esc(p.idea)}</textarea></label>
      <div class="grid g2"><label class="f">Categoría<select id="cat">${cats.map(c => `<option ${c === p.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
      <label class="f">Formato<select id="fmt">${Object.entries(E.FORMATS).map(([k, v]) => `<option value="${k}" ${k === p.format ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label></div>
      <div class="stack" style="gap:8px"><div class="small">Duración del video: <b id="durLbl"></b> <span class="mute">(de 10 s a 30 min)</span></div>
        <div class="chips" id="durs">${DUR_PRESETS.map(d => `<button class="chip" aria-pressed="${d === p.duration}" data-d="${d}">${fmtDur(d)}</button>`).join('')}</div>
        <div class="row" style="align-items:end;gap:8px"><label class="f" style="width:96px">Minutos<input type="number" id="dMin" min="0" max="30" step="1" inputmode="numeric"></label><label class="f" style="width:96px">Segundos<input type="number" id="dSec" min="0" max="59" step="1" inputmode="numeric"></label><span class="small mute" style="padding-bottom:10px">Duración personalizada</span></div>
        <div class="note" id="durEst" style="margin:0"></div></div>
      <div><div class="small" style="margin-bottom:6px">Animación del video</div><div class="chips" id="animSel">${[['2d', '2D (dibujos animados; tus personajes-imagen se ven tal cual)'], ['3d', '3D (personajes en 3D; las imágenes usan su doble 3D)']].map(([k, l]) => `<button class="chip" data-a="${k}" aria-pressed="${animOf() === k}">${l}</button>`).join('')}</div></div>
      <div><div class="small" style="margin-bottom:6px">Personajes del reparto</div><div class="chips" id="cast">${chars.map(c => `<button class="chip" aria-pressed="${p.cast.includes(c.id)}" data-c="${c.id}">${esc(c.name)}</button>`).join('')}</div></div>
      ${p.methodId && App.Gym ? `<div class="note info">Basado en la ficha: <b>${esc(App.Gym.byId(p.methodId)?.n || '')}</b>${p.formatHint ? ' · ' + esc(p.formatHint) : ''}</div>` : ''}
      <div class="row"><button class="btn primary" id="genProps">${icon('spark')}Generar propuestas con IA</button><button class="btn" id="tplProps">Usar plantillas (sin IA)</button></div>
    </div><div class="card"><h3>Cómo funciona</h3><ol class="small" style="padding-left:18px;margin:0">
      <li>Escribe la idea con tus palabras; no tiene que ser perfecta.</li><li>La IA (Claude, incluida en tu plan) crea al menos 3 propuestas distintas.</li><li>Elige una y pulsa <b>GENERAR VIDEO COMPLETO</b>, o avanza paso a paso para revisar y editar.</li><li>El video se dibuja y graba en tu navegador (gratis) y se guarda en tu nube gratuita si cabe.</li></ol>
      <div class="sep"></div><div class="small">Si la IA alcanza su límite, la operación se detiene, queda en "Operaciones pendientes" y puedes usar las plantillas sin IA. Nunca se activa nada de pago.</div></div></div>`;
    const sync = () => { p.idea = $('#idea').value.trim(); p.category = $('#cat').value; p.format = $('#fmt').value; };
    $('#idea').oninput = () => { sync(); clearTimeout(stepIdea.t); stepIdea.t = setTimeout(save, 800); };
    $('#cat').onchange = $('#fmt').onchange = () => { sync(); save(); };
    const showDur = (fromInputs) => {
      const d = p.duration, e = durEstimate(d, settings.quality);
      $('#durLbl').textContent = fmtDur(d);
      if (!fromInputs) { $('#dMin').value = Math.floor(d / 60); $('#dSec').value = d % 60; }
      $$('#durs .chip').forEach(x => x.setAttribute('aria-pressed', +x.dataset.d === d));
      const lines = [`≈ ${e.words.toLocaleString('es')} palabras de guion · ≈ ${e.scenes} escenas`,
        e.chapters ? `Guion por capítulos: esquema + ${e.chapters} capítulos (≈ ${e.ai} usos de IA en total; si la IA llega a su límite, se pausa y continúas después donde quedó)` : `≈ ${e.ai} usos de IA en total`,
        `Grabar el video tarda lo mismo que dura: ≈ ${fmtDur(d)} con la pestaña visible`,
        `Archivo ≈ ${fmtBytes(e.size)}${e.cloud ? ' (cabe en tu nube gratuita)' : ' · no cabe en la nube gratuita (máx. 20 MB): se descarga directo al terminar'}`];
      if (d > 180 && p.format === 'vertical') lines.push('<b>Consejo:</b> para más de 3 minutos usa formato horizontal 16:9 (video normal de YouTube); en vertical ya no cuenta como Short.');
      if (p.script && p.script.dur && p.script.dur !== d) lines.push('<b>Ojo:</b> ya hay un guion hecho para otra duración. Regenéralo en el paso Guion para que coincida.');
      $('#durEst').innerHTML = lines.map(l => `<div>${l}</div>`).join('');
      $('#durEst').className = 'note' + (d > 600 ? ' warn' : ' info');
    };
    const setDur = (d, fromInputs) => { p.duration = clamp(Math.round(d), DUR_MIN, DUR_MAX); showDur(fromInputs); clearTimeout(stepIdea.d); stepIdea.d = setTimeout(save, 500); };
    $$('#durs .chip').forEach(b => b.onclick = () => setDur(+b.dataset.d));
    const fromBoxes = () => { const m = clamp(Math.floor(+$('#dMin').value || 0), 0, 30), s = clamp(Math.floor(+$('#dSec').value || 0), 0, 59); setDur(m * 60 + s, true); };
    $('#dMin').oninput = $('#dSec').oninput = fromBoxes;
    // los recuadros se corrigen (p. ej. 3 s → 10 s) solo al salir de ellos, para no estorbar mientras escribes
    $('#dMin').onblur = $('#dSec').onblur = () => setTimeout(() => { if (!['dMin', 'dSec'].includes((document.activeElement || {}).id)) showDur(false); }, 0);
    $('#fmt').addEventListener('change', () => showDur(true));
    showDur(false);
    $$('#animSel .chip').forEach(b => b.onclick = () => { p.anim = b.dataset.a; App.state.gymStyle = styleOf(); $$('#animSel .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); if (p.storyboard) { p.storyboard = null; UI.toast('Cambiaste la animación: el storyboard se rehará con el nuevo estilo.', 'warn'); } if (p.render) p.render.stale = true; save(); renderSteps(); });
    $$('#cast .chip').forEach(b => b.onclick = () => { const id = b.dataset.c; p.cast = p.cast.includes(id) ? p.cast.filter(x => x !== id) : [...p.cast, id]; if (!p.cast.length) p.cast = [id]; b.setAttribute('aria-pressed', p.cast.includes(id)); save(); });
    const need = () => { sync(); if (!p.idea) { UI.toast('Escribe primero una idea.', 'warn'); return false; } return true; };
    $('#genProps').onclick = e => need() && UI.busy(e.currentTarget, async () => { p.proposals = await Gen.proposals(p, chars.filter(c => p.cast.includes(c.id)).concat(chars.filter(c => !p.cast.includes(c.id)))); p.proposalSource = 'ia'; p.selected = null; await save(); go(1); }, 'Pensando propuestas…');
    $('#tplProps').onclick = () => { if (!need()) return; p.proposals = Gen.proposalsTemplate(p, chars.filter(c => p.cast.includes(c.id))); p.proposalSource = 'plantilla'; p.selected = null; save(); go(1); };
  };

  /* ---- paso 1: propuestas ---- */
  const stepProps = () => {
    if (!p.proposals) { body().innerHTML = `<div class="empty">Aún no hay propuestas. Vuelve al paso Idea.</div>`; return; }
    body().innerHTML = `<div class="row between" style="margin-bottom:12px"><span class="tag ${p.proposalSource === 'ia' ? 'info' : ''}">${p.proposalSource === 'ia' ? 'Generadas con IA' : 'Plantillas sin IA'}</span><button class="btn sm" id="regen">${icon('refresh')}Regenerar</button></div>
    <div class="grid g3">${p.proposals.map((x, i) => `<div class="card prop stack" data-i="${i}" aria-selected="${p.selected === i}" tabindex="0" role="button"><div class="row between"><span class="tag acc">Propuesta ${i + 1}</span><span class="small">${fmtDur(x.duracion)}</span></div>
      <h3>${esc(x.titulo)}</h3><div><b class="small">Gancho</b><div>“${esc(x.gancho)}”</div></div><div><b class="small">Concepto</b><div class="small">${esc(x.concepto)}</div></div>
      <div class="small"><b>Personajes:</b> ${esc((x.personajes || []).map(id => (chars.find(c => c.id === id) || {}).name || id).join(', ') || '—')} · <b>Estilo:</b> ${esc(x.estilo || '—')}</div>
      ${x.por_que ? `<div class="small mute">${esc(x.por_que)}</div>` : ''}<button class="btn ${p.selected === i ? 'primary' : ''}" data-pick="${i}">${p.selected === i ? 'Seleccionada' : 'Elegir esta'}</button></div>`).join('')}</div>`;
    $$('[data-pick]').forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.pick; if (p.selected !== i) { p.script = null; p.storyboard = null; p.render = p.render ? {...p.render, stale: true} : null; } p.selected = i; p.title = p.proposals[i].titulo; const pc = p.proposals[i].personajes; if (pc && pc.length) p.cast = pc; save(); go(2); });
    $('#regen').onclick = e => UI.busy(e.currentTarget, async () => { if (p.proposalSource === 'ia' || AI.available()) { p.proposals = await Gen.proposals(p, chars); p.proposalSource = 'ia'; } else p.proposals = Gen.proposalsTemplate(p, chars); p.selected = null; await save(); renderSteps(); stepProps(); });
  };

  /* ---- paso 2: guion ---- */
  const stepScript = () => {
    if (p.selected == null) { body().innerHTML = `<div class="empty">Elige primero una propuesta.</div>`; return; }
    if (!p.script) {
      const long = isLong(p.duration), nCh = chaptersFor(p.duration), job = p.scriptJob && p.scriptJob.duration === p.duration && p.scriptJob.selected === p.selected ? p.scriptJob : null;
      const doneCh = job ? job.chapters.filter(c => c.text).length : 0;
      body().innerHTML = `<div class="card stack"><h3>${esc(p.proposals[p.selected].titulo)}</h3>
      <p class="small">${long ? `Video largo de ${fmtDur(p.duration)} (≈ ${Math.round(p.duration * WPS).toLocaleString('es')} palabras). La IA escribe primero el esquema (gancho, problema, conclusión y llamada a la acción) y después ${nCh} capítulos, uno por uno. Cada capítulo se guarda al terminar.` : `Guion de ${fmtDur(p.duration)} (≈ ${Math.round(p.duration * WPS)} palabras) con 6 partes: gancho, problema, explicación, ejemplo, conclusión y llamada a la acción.`}</p>
      ${job ? `<div class="note info">Guion a medias: esquema listo y ${doneCh} de ${job.chapters.length} capítulos escritos. Pulsa continuar para seguir desde el capítulo ${doneCh + 1}.</div>` : ''}
      <div class="bar" id="scBar" hidden><i style="width:0%"></i></div><div class="small" id="scLbl"></div>
      <div class="row"><button class="btn primary" id="genScript">${icon('spark')}${job ? 'Continuar guion con IA' : 'Generar guion con IA'}</button><button class="btn" id="manScript">Escribirlo yo (plantilla${long ? ' por capítulos' : ''})</button>${job ? '<button class="btn ghost" id="dropJob">Empezar de cero</button>' : ''}</div></div>`;
      const onProgress = (k, n, msg) => { const b = $('#scBar'); if (!b) return; b.hidden = false; b.firstElementChild.style.width = (k / n * 100).toFixed(0) + '%'; $('#scLbl').textContent = `${msg}…`; };
      $('#genScript').onclick = e => UI.busy(e.currentTarget, async () => {
        try { p.script = await Gen.script(p, chars, {onProgress, save}); }
        catch (err) { renderSteps(); stepScript(); throw err; }
        p.storyboard = null; await save(); renderSteps(); stepScript();
      }, long ? 'Escribiendo capítulos…' : 'Escribiendo guion…');
      $('#manScript').onclick = () => { p.script = Gen.scriptTemplate(p); delete p.scriptJob; save(); renderSteps(); stepScript(); };
      const dj = $('#dropJob'); if (dj) dj.onclick = async () => { if (!(await UI.confirm('¿Descartar el guion a medias y empezar de cero?', 'Descartar'))) return; delete p.scriptJob; await save(); stepScript(); };
      return;
    }
    const opts = sel => ['narrador', ...chars.map(c => c.id)].map(id => `<option value="${id}" ${id === sel ? 'selected' : ''}>${esc(id === 'narrador' ? 'Narrador' : chars.find(c => c.id === id).name)}</option>`).join('');
    const count = () => { const w = p.script.sections.reduce((a, s) => a + s.text.split(/\s+/).filter(Boolean).length, 0); const sec = w / WPS; $('#wc').innerHTML = `${w.toLocaleString('es')} palabras · ≈ ${fmtDur(sec)} de ${fmtDur(p.duration)} ${Math.abs(sec - p.duration) / p.duration > .2 ? '<span class="tag warn">ajusta la longitud</span>' : '<span class="tag ok">duración adecuada</span>'}`; };
    body().innerHTML = `<div class="stage"><div class="stack">
      <label class="f">Título<input id="stitle" value="${esc(p.script.title)}"></label>
      ${p.script.sections.map((s, i) => `<div class="card stack"><div class="row between"><b>${i + 1}. ${esc(partLabel(p.script.sections, i))}</b><div class="row"><select data-sp="${i}" style="width:auto">${opts(s.speaker)}</select><button class="btn sm" data-improve="${i}" title="Reescribir este bloque con IA">${icon('wand')}Mejorar</button></div></div><textarea data-tx="${i}" style="min-height:76px">${esc(s.text)}</textarea></div>`).join('')}
    </div><div class="stack"><div class="card"><div id="wc" class="small"></div><div class="sep"></div>
      <div class="row"><button class="btn" id="regenScript">${icon('refresh')}Regenerar todo</button><button class="btn" id="copyScript">${icon('copy')}Copiar</button></div></div>
      ${p.script.verify && p.script.verify.length ? `<div class="note"><b>Datos a verificar antes de publicar</b><ul style="margin:6px 0 0;padding-left:18px">${p.script.verify.map(v => `<li>${esc(v)}</li>`).join('')}</ul></div>` : ''}
      <div class="card small">Puedes editar libremente. Los cambios se guardan solos. Si cambias el guion después de crear el storyboard, pulsa "Rehacer storyboard" en el siguiente paso.</div>
      ${nextBtn('Crear storyboard', 3)}</div></div>`;
    count(); bindNext();
    $('#stitle').oninput = e => { p.script.title = e.target.value; p.title = e.target.value; clearTimeout(stepScript.t); stepScript.t = setTimeout(save, 700); };
    $$('[data-tx]').forEach(t => t.oninput = () => { p.script.sections[+t.dataset.tx].text = t.value; count(); if (p.render) p.render.stale = true; clearTimeout(stepScript.t); stepScript.t = setTimeout(save, 700); });
    $$('[data-sp]').forEach(s => s.onchange = () => { p.script.sections[+s.dataset.sp].speaker = s.value; save(); });
    $$('[data-improve]').forEach(b => b.onclick = () => UI.busy(b, async () => {
      const i = +b.dataset.improve, s = p.script.sections[i];
      const r = await AI.json(`Mejora este bloque (${partLabel(p.script.sections, i)}) de un guion para ${channelCtx(mod)} Hazlo más claro, breve y entretenido, sin cambiar los datos ni inventar cifras. Mantén aproximadamente ${s.text.split(/\s+/).length} palabras. Ortografía perfecta.\nContexto del guion: ${p.script.sections.length > 8 ? [p.script.sections[i - 1], p.script.sections[i + 1]].filter(Boolean).map(x => x.text).join(' … ') : p.script.sections.map(x => x.text).join(' ')}\nBloque: "${s.text}"\nFormato: {"texto":""}`, {label: 'Mejorar bloque de guion', tier: 'quick'});
      if (r.texto) { s.text = r.texto; await save(); stepScript(); }
    }, 'Mejorando…'));
    $('#regenScript').onclick = async () => { if (!(await UI.confirm('¿Reemplazar el guion actual por uno nuevo?', 'Regenerar'))) return; p.script = null; delete p.scriptJob; p.storyboard = null; await save(); renderSteps(); stepScript(); $('#genScript').click(); };
    $('#copyScript').onclick = () => UI.copy(App.scriptText(p));
  };

  /* ---- paso 3: storyboard ---- */
  const sceneCanvas = (tl, i, w = 110) => { const cv = document.createElement('canvas'); const s = tl.scenes[i]; if (!s) return cv; const scale = w / tl.W; cv.width = w; cv.height = Math.round(tl.H * scale); const c = cv.getContext('2d'); c.scale(scale, scale); E.drawFrame(c, tl, s.start + Math.min(s.dur * .6, 1.6)); return cv; };
  const stepStory = () => {
    if (!p.script) { body().innerHTML = `<div class="empty">Primero crea el guion.</div>`; return; }
    const sbChars = allChars.filter(c => mod === 'gym' ? true : c.module !== 'gym');
    const partial = p.storyboard && p.storyboard.partial;
    if (!p.storyboard || !p.storyboard.scenes.length || partial) {
      const nb = Gen.sbBlocks(p).length;
      body().innerHTML = `<div class="card stack"><h3>Convertir el guion en escenas</h3><p class="small">Cada escena tendrá personajes, fondo, acción, diálogo, texto en pantalla, objetos animados, cámara, duración y transición.${nb > 1 ? ` Este guion es largo: la IA lo hará en ${nb} bloques y guarda cada bloque al terminar.` : ''}</p>
      ${partial ? `<div class="note info">Storyboard a medias: ${partial.done} de ${partial.total} bloques hechos (${p.storyboard.scenes.length} escenas). Puedes continuar con IA o completar el resto por reglas, sin IA.</div>` : ''}
      <div class="bar" id="sbBar" hidden><i style="width:0%"></i></div><div class="small" id="sbLbl"></div>
      <div class="row"><button class="btn primary" id="genSB">${icon('spark')}${partial ? 'Continuar con IA' : 'Generar storyboard con IA'}</button><button class="btn" id="ruleSB">${partial ? 'Completar el resto por reglas (sin IA)' : 'Generar automático por reglas (sin IA)'}</button></div></div>`;
      const onProgress = (k, n, msg) => { const b = $('#sbBar'); if (!b) return; b.hidden = false; b.firstElementChild.style.width = (k / n * 100).toFixed(0) + '%'; $('#sbLbl').textContent = msg + '…'; };
      $('#genSB').onclick = e => UI.busy(e.currentTarget, async () => {
        try { p.storyboard = await Gen.storyboard(p, sbChars, {onProgress, save, rulesChars: chars}); }
        catch (err) { renderSteps(); stepStory(); throw err; }
        if (p.render) p.render.stale = true; await save(); renderSteps(); stepStory();
      }, nb > 1 ? 'Dibujando bloques…' : 'Dibujando escenas…');
      $('#ruleSB').onclick = () => {
        if (partial) { const rest = Gen.sbBlocks(p).slice(partial.done); const wc = u => u.reduce((a, s) => a + s.text.split(/\s+/).filter(Boolean).length, 0); rest.forEach(bl => p.storyboard.scenes.push(...Gen.storyboardRules(p, chars, bl, wc(bl) / WPS).scenes)); p.storyboard.source = 'mixto'; delete p.storyboard.partial; }
        else p.storyboard = Gen.storyboardRules(p, chars);
        if (p.render) p.render.stale = true; save(); renderSteps(); stepStory();
      };
      return;
    }
    const tl = tlOf(); const sb = p.storyboard.scenes; const PER = 20;
    const pages = Math.max(1, Math.ceil(sb.length / PER)); stepStory.page = clamp(stepStory.page || 0, 0, pages - 1);
    const pg = stepStory.page, from = pg * PER, shown = sb.slice(from, from + PER);
    const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const pager = pages > 1 ? `<div class="row" style="justify-content:center;margin:12px 0"><button class="btn sm" data-pg="${pg - 1}" ${pg ? '' : 'disabled'}>← Anteriores</button><select data-pgsel style="width:auto" aria-label="Página de escenas">${Array.from({length: pages}, (_, k) => { const s = tl.scenes[k * PER]; return `<option value="${k}" ${k === pg ? 'selected' : ''}>Escenas ${k * PER + 1}–${Math.min(sb.length, k * PER + PER)} · desde ${mmss(s ? s.start : 0)}</option>`; }).join('')}</select><button class="btn sm" data-pg="${pg + 1}" ${pg < pages - 1 ? '' : 'disabled'}>Siguientes →</button></div>` : '';
    body().innerHTML = `<div class="row between" style="margin-bottom:12px"><span class="small">${sb.length} escenas · ${fmtDur(tl.duration)} · origen: ${p.storyboard.source === 'ia' ? 'IA' : p.storyboard.source === 'mixto' ? 'IA + reglas' : 'reglas automáticas'}</span>
      <div class="row"><button class="btn sm" id="redoSB">${icon('refresh')}Rehacer storyboard</button><button class="btn sm" id="addSc">${icon('plus')}Añadir escena</button>${nextBtn('Voces', 4)}</div></div>${pager}
      <div class="list" id="scList">${shown.map((s, k) => { const i = from + k; return `<div class="card scene"><div data-cv="${i}"></div><div class="stack" style="gap:6px">
        <div class="row between"><b>Escena ${i + 1} <span class="small">· ${esc(s.part === 'capitulo' ? 'Capítulo' : (PARTS.find(x => x[0] === s.part) || [, s.part])[1] || '')} · ${(+s.dur).toFixed(1)} s · ${mmss(tl.scenes[i] ? tl.scenes[i].start : 0)}</span></b>
        <div class="row"><button class="btn sm ghost" data-up="${i}" aria-label="Subir">↑</button><button class="btn sm ghost" data-down="${i}" aria-label="Bajar">↓</button><button class="btn sm" data-edit="${i}">${icon('edit')}Editar</button><button class="btn sm danger" data-del="${i}" aria-label="Eliminar escena">${icon('trash')}</button></div></div>
        <div class="small"><b>Fondo:</b> ${esc(A.BG_LABEL[s.bg] || s.bg)} · <b>Cámara:</b> ${esc(E.CAMERAS[s.camera] || s.camera)} · <b>Transición:</b> ${esc(E.TRANSITIONS[s.transition] || s.transition)}</div>
        <div class="small"><b>Personajes:</b> ${s.chars.map(c => esc((allChars.find(x => x.id === c.id) || {}).name || c.id) + ' (' + esc(c.move && A.MOVES[c.move] ? A.MOVES[c.move].label : (A.ACT_LABEL[c.act] || c.act)) + ', ' + esc(A.EXPR_LABEL[c.expr] || c.expr) + ')').join(' · ')}</div>
        <div>“${esc(s.dialogue)}”</div>${s.text ? `<div class="small"><b>Texto en pantalla:</b> ${esc(s.text)}</div>` : ''}${s.objects.length ? `<div class="small"><b>Objetos:</b> ${s.objects.map(o => esc(A.OBJ_LABEL[o] || o)).join(', ')}</div>` : ''}${s.overlay ? `<div class="small"><b>Gráfico:</b> ${esc(App.OVT[s.overlay.type] || s.overlay.type)}${s.overlay.title ? ' · ' + esc(s.overlay.title) : ''} (${(s.overlay.items || []).length} elementos)</div>` : ''}${s.emojis && s.emojis.length ? `<div class="small"><b>Emojis:</b> ${esc(s.emojis.join(' '))}</div>` : ''}
      </div></div>`; }).join('')}</div>${pager}`;
    shown.forEach((s, k) => { const host = $(`[data-cv="${from + k}"]`); host.appendChild(sceneCanvas(tl, from + k)); });
    $$('[data-pg]').forEach(b => b.onclick = () => { stepStory.page = +b.dataset.pg; stepStory(); window.scrollTo({top: 0}); });
    $$('[data-pgsel]').forEach(s => s.onchange = () => { stepStory.page = +s.value; stepStory(); });
    bindNext();
    const mutate = () => { if (p.render) p.render.stale = true; save(); stepStory(); };
    $$('[data-del]').forEach(b => b.onclick = async () => { if (await UI.confirm('¿Eliminar esta escena?', 'Eliminar')) { sb.splice(+b.dataset.del, 1); mutate(); } });
    $$('[data-up]').forEach(b => b.onclick = () => { const i = +b.dataset.up; if (i > 0) { [sb[i - 1], sb[i]] = [sb[i], sb[i - 1]]; mutate(); } });
    $$('[data-down]').forEach(b => b.onclick = () => { const i = +b.dataset.down; if (i < sb.length - 1) { [sb[i + 1], sb[i]] = [sb[i], sb[i + 1]]; mutate(); } });
    $$('[data-edit]').forEach(b => b.onclick = () => editScene(+b.dataset.edit, mutate));
    $('#addSc').onclick = () => { stepStory.page = Math.floor(sb.length / 20); sb.push({part: 'extra', bg: mod === 'gym' ? 'gimnasio' : 'estudio', chars: [{id: chars[0].id, pos: 'centro', act: 'talk', expr: 'happy', move: ''}], speaker: chars[0].id, dialogue: '', text: '', objects: [], camera: 'zoom_in', transition: 'fade', dur: 3}); mutate(); editScene(sb.length - 1, mutate); };
    $('#redoSB').onclick = async () => { if (!(await UI.confirm('¿Rehacer todas las escenas a partir del guion?', 'Rehacer'))) return; p.storyboard = null; stepStory.page = 0; if (p.render) p.render.stale = true; save(); stepStory(); };
  };
  const editScene = (i, onDone) => {
    const s = p.storyboard.scenes[i];
    const sel = (id, obj, val) => `<select id="${id}">${Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`;
    const charRow = (c, j) => `<div class="grid g4" data-cr="${j}" style="align-items:end"><label class="f">Personaje${sel('c_id' + j, Object.fromEntries(allChars.map(x => [x.id, x.name])), c.id)}</label><label class="f">Posición${sel('c_pos' + j, {izq: 'Izquierda', centro: 'Centro', der: 'Derecha'}, c.pos)}</label><label class="f">${mod === 'gym' ? 'Acción / movimiento' : 'Acción'}${sel('c_act' + j, {...A.ACT_LABEL, ...(mod === 'gym' ? Object.fromEntries(A.moveList.map(m => ['mv:' + m.id, '▶ ' + m.label])) : {})}, c.move ? 'mv:' + c.move : c.act)}</label><label class="f">Expresión${sel('c_ex' + j, A.EXPR_LABEL, c.expr)}</label>${mod === 'gym' ? `<label class="f">Cuerpo (3D)${sel('c_va' + j, {'': 'Normal', sobrepeso: 'Sobrepeso', delgado: 'Delgado'}, c.variant || '')}</label><label class="f">Color (3D, opcional)<input id="c_ti${j}" placeholder="#7fd18b" value="${esc(c.tint || '')}"></label>` : ''}</div>`;
    const {el, close} = UI.modal(`<h2>Escena ${i + 1}</h2><div class="stage" style="grid-template-columns:minmax(0,1fr) 200px"><div class="stack">
      <label class="f">Diálogo / narración<textarea id="e_dlg">${esc(s.dialogue)}</textarea></label>
      <div class="grid g2"><label class="f">Habla${sel('e_sp', {narrador: 'Narrador', ...Object.fromEntries(allChars.map(x => [x.id, x.name]))}, s.speaker)}</label><label class="f">Texto en pantalla (máx. 6 palabras)<input id="e_txt" value="${esc(s.text)}"></label></div>
      <div class="grid g3"><label class="f">Fondo${sel('e_bg', A.BG_LABEL, s.bg)}</label><label class="f">Cámara${sel('e_cam', E.CAMERAS, s.camera)}</label><label class="f">Transición${sel('e_tr', E.TRANSITIONS, s.transition)}</label></div>
      <div class="grid g2"><label class="f">Duración (s)<input id="e_dur" type="number" min="1" max="15" step=".1" value="${s.dur}"></label>${mod === 'gym' ? `<label class="f" style="flex-direction:row;display:flex;align-items:center;gap:10px;margin-top:24px"><input type="checkbox" id="e_hl" ${s.highlight ? 'checked' : ''}> Resaltar músculos (animación anatómica 2D)</label>` : '<div></div>'}</div>
      ${mod === 'gym' ? `<div class="card stack" style="background:var(--bg)"><b class="small">Estilo estudio 3D</b>
        <div class="grid g3"><label class="f">Vista de cámara${sel('e_view', {'': 'Automática', ...App.VIEWS}, s.view || '')}</label><label class="f">Gráfico${sel('e_ovt', {'': 'Ninguno', ...App.OVT}, (s.overlay && s.overlay.type) || '')}</label><label class="f">Título del gráfico<input id="e_ovtitle" value="${esc((s.overlay && s.overlay.title) || '')}"></label></div>
        <label class="f">Elementos del gráfico (uno por línea: emoji texto | S/A/B/C, ok/no o un número)<textarea id="e_ovitems" placeholder="🍠 Batata | S&#10;🍞 Pan blanco | B&#10;Evita azúcar añadida | no">${esc(App.itemsText(s.overlay && s.overlay.items))}</textarea></label>
        <div class="grid g2"><label class="f">Emojis junto al personaje (separados por espacio)<input id="e_emo" value="${esc((s.emojis || []).join(' '))}" placeholder="🔥 💪"></label><label class="f">Zonas a resaltar en rojo (separadas por coma)<input id="e_zone" value="${esc(((s.chars[0] || {}).muscles || []).join(', '))}" placeholder="core, grasa"></label></div>
        <div class="small">Zonas: ${App.ZONES.join(', ')}.</div></div>` : ''}
      <div><div class="small" style="margin-bottom:6px">Objetos animados (máx. 3)</div><div class="chips" id="e_obj">${Object.entries(A.OBJ_LABEL).map(([k, v]) => `<button class="chip" data-o="${k}" aria-pressed="${s.objects.includes(k)}">${esc(v)}</button>`).join('')}</div></div>
      <div class="stack" id="e_chars">${s.chars.map(charRow).join('')}</div>
      <div class="row"><button class="btn sm" id="e_addc">${icon('plus')}Personaje</button><button class="btn sm" id="e_rmc">Quitar último</button></div>
      </div><div><canvas id="e_prev" style="width:100%;border-radius:10px;background:#000"></canvas><div class="small" style="margin-top:6px">Vista previa en vivo</div></div></div>
      <div class="row end" style="margin-top:14px"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="e_ok">Guardar escena</button></div>`, {wide: true});
    const read = () => {
      const n = el.querySelectorAll('[data-cr]').length; const cs = [];
      for (let j = 0; j < n; j++) { const a = el.querySelector('#c_act' + j).value; const va = el.querySelector('#c_va' + j), ti = el.querySelector('#c_ti' + j); cs.push({id: el.querySelector('#c_id' + j).value, pos: el.querySelector('#c_pos' + j).value, act: a.startsWith('mv:') ? 'idle' : a, move: a.startsWith('mv:') ? a.slice(3) : '', expr: el.querySelector('#c_ex' + j).value, variant: va ? va.value : '', tint: ti && /^#[0-9a-f]{6}$/i.test(ti.value.trim()) ? ti.value.trim() : ''}); }
      const extra = {};
      if (el.querySelector('#e_view')) { extra.view = el.querySelector('#e_view').value || undefined; const ovt = el.querySelector('#e_ovt').value; extra.overlay = ovt ? {type: ovt, title: el.querySelector('#e_ovtitle').value.trim(), items: App.parseItems(el.querySelector('#e_ovitems').value)} : null; extra.emojis = el.querySelector('#e_emo').value.split(/\s+/).filter(Boolean).slice(0, 3); const z = el.querySelector('#e_zone').value.split(/[,\s]+/).filter(k => App.ZONES.includes(k)); if (cs[0]) cs[0].muscles = z.length ? z : undefined; if (z.length) extra.zoneHL = true; }
      return {...s, dialogue: el.querySelector('#e_dlg').value.trim(), speaker: el.querySelector('#e_sp').value, text: el.querySelector('#e_txt').value.trim(), bg: el.querySelector('#e_bg').value, camera: el.querySelector('#e_cam').value, transition: el.querySelector('#e_tr').value, dur: clamp(+el.querySelector('#e_dur').value || 3, 1, 15), chars: cs, objects: [...el.querySelectorAll('#e_obj [aria-pressed=true]')].map(b => b.dataset.o).slice(0, 3), highlight: !!(el.querySelector('#e_hl') || {}).checked || !!extra.zoneHL, view: extra.view, overlay: extra.overlay !== undefined ? extra.overlay : s.overlay, emojis: extra.emojis || s.emojis};
    };
    const cv = el.querySelector('#e_prev'); let raf, t0 = performance.now();
    const loop = () => { if (!document.body.contains(cv)) return cancelAnimationFrame(raf); const tmp = read(); const tl = E.build({...p, storyboard: {scenes: [tmp]}, subs: settings.subs, ...look3d()}, allChars, {W: 360, H: p.format === 'vertical' ? 640 : 202}); if (p.format !== 'vertical') { tl.W = 360; tl.H = 202; } cv.width = tl.W; cv.height = tl.H; const ctx = cv.getContext('2d'); E.drawFrame(ctx, tl, ((performance.now() - t0) / 1000) % tl.duration); raf = requestAnimationFrame(loop); };
    loop();
    el.querySelectorAll('#e_obj .chip').forEach(b => b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; if (on && el.querySelectorAll('#e_obj [aria-pressed=true]').length >= 3) return UI.toast('Máximo 3 objetos por escena.', 'warn'); b.setAttribute('aria-pressed', on); });
    el.querySelector('#e_addc').onclick = () => { const cur = read(); if (cur.chars.length >= 3) return UI.toast('Máximo 3 personajes por escena.', 'warn'); const host = el.querySelector('#e_chars'); host.insertAdjacentHTML('beforeend', charRow({id: chars[0].id, pos: 'der', act: 'idle', expr: 'neutral'}, cur.chars.length)); };
    el.querySelector('#e_rmc').onclick = () => { const rows = el.querySelectorAll('[data-cr]'); if (rows.length > 1) rows[rows.length - 1].remove(); };
    el.querySelector('#e_ok').onclick = () => { p.storyboard.scenes[i] = read(); close(); onDone(); };
  };

  /* ---- paso 4: voces ---- */
  const stepVoice = () => {
    if (!p.storyboard) { body().innerHTML = `<div class="empty">Primero crea el storyboard.</div>`; return; }
    const used = [...new Set(p.storyboard.scenes.map(s => s.speaker))];
    const nar = App.narrations[p.id];
    const voiceLabel = v => v.engine === 'claude' ? (Voice.claudeVoices.find(x => x.id === v.voice) || {}).label || v.voice : 'Navegador: ' + (v.browserVoice || 'automática');
    body().innerHTML = `<div class="grid g2"><div class="card stack"><h3>Voces de los personajes</h3>
      ${used.map(id => { const c = allChars.find(x => x.id === id); const v = c ? c.voice : (p.narratorVoice || {engine: 'claude', voice: 'rounded', rate: 1}); return `<div class="item"><div class="grow"><b>${esc(c ? c.name : 'Narrador')}</b><div class="small">${esc(voiceLabel(v))} · ritmo ${v.rate || 1} · ${esc(v.style || 'educativo')}</div></div><button class="btn sm" data-test="${id}">${icon('play')}Probar</button></div>`; }).join('')}
      <div class="small">Cada personaje conserva la misma voz en todos los videos. Cámbiala en <a href="#${mod}-personajes">Personajes</a>.</div>
      ${used.includes('narrador') ? `<label class="f">Voz del narrador<select id="narV">${Voice.claudeVoices.map(v => `<option value="claude:${v.id}" ${p.narratorVoice && p.narratorVoice.voice === v.id ? 'selected' : ''}>${v.label}</option>`).join('')}${Voice.browserVoices().map(v => `<option value="browser:${esc(v.name)}" ${p.narratorVoice && p.narratorVoice.browserVoice === v.name ? 'selected' : ''}>Navegador: ${esc(v.name)}</option>`).join('')}</select></label>` : ''}
    </div><div class="card stack"><h3>Voz dentro del archivo de video</h3>
      <div class="note info">La voz de Claude y las voces del navegador son gratuitas y suenan en la vista previa, pero el navegador no permite grabarlas dentro del archivo. Para que el MP4 lleve voz, sube una narración grabada (por ejemplo, tu propia voz leyendo el guion con la grabadora del celular, o un audio de un TTS gratuito que permita descargar).</div>
      <label class="f">Subir narración (MP3, M4A, WAV, OGG)<input type="file" id="narFile" accept="audio/*"></label>
      ${nar ? `<div class="item"><div class="grow"><b>${esc(nar.name)}</b><div class="small">${nar.buffer.duration.toFixed(1)} s · se mezclará con la música y las escenas se ajustarán a su duración</div></div><button class="btn sm danger" id="narRm">Quitar</button></div>` : '<div class="small">Sin narración: el video llevará música, efectos y subtítulos animados.</div>'}
      <div class="small">La narración subida se usa en esta sesión del navegador; si recargas la página, vuelve a seleccionarla antes de renderizar.</div>
      <div class="row"><button class="btn" id="vOk">${icon('check')}Voces revisadas</button>${nextBtn('Vista previa', 5)}</div></div></div>`;
    bindNext();
    const narSel = $('#narV'); if (narSel) narSel.onchange = () => { const [eng, v] = narSel.value.split(':'); p.narratorVoice = eng === 'claude' ? {engine: 'claude', voice: v, rate: 1} : {engine: 'browser', browserVoice: v, rate: 1}; save(); };
    $$('[data-test]').forEach(b => b.onclick = () => UI.busy(b, async () => { const id = b.dataset.test; const c = allChars.find(x => x.id === id); const line = (p.storyboard.scenes.find(s => s.speaker === id) || {}).dialogue || 'Hola, esta es mi voz.'; Voice.stop(); await Voice.speak(line, c ? c.voice : (p.narratorVoice || {engine: 'claude', voice: 'rounded'})); }, 'Hablando…'));
    $('#narFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const buffer = await E.decodeAudio(f); App.narrations[p.id] = {name: f.name, buffer}; p.narrationName = f.name; p.narrationDur = buffer.duration; if (p.render) p.render.stale = true; await save(); UI.toast('Narración cargada: ' + esc(f.name)); stepVoice(); } catch (err) { UI.toast('No se pudo leer ese audio. Prueba con MP3 o WAV.', 'bad'); } };
    const rm = $('#narRm'); if (rm) rm.onclick = () => { delete App.narrations[p.id]; p.narrationName = null; save(); stepVoice(); };
    $('#vOk').onclick = () => { p.voiceChecked = true; save(); go(5); };
  };
  const voiceFor = sc => { const c = allChars.find(x => x.id === sc.speaker); return c ? c.voice : (p.narratorVoice || {engine: 'claude', voice: 'rounded', rate: 1}); };
  const fitOpts = () => { const n = App.narrations[p.id]; return n ? {fitTo: n.buffer.duration + .4} : {}; };

  /* ---- paso 5: vista previa ---- */
  const stepPreview = () => {
    if (!p.storyboard) { body().innerHTML = `<div class="empty">Primero crea el storyboard.</div>`; return; }
    const tl = tlOf(fitOpts());
    body().innerHTML = `<div class="stage"><div class="canvasbox ${tl.vertical ? 'vert' : ''}"><canvas id="pv"></canvas></div><div class="stack"><div class="card stack">
      <div class="row"><button class="btn primary" id="pvPlay">${icon('play')}Reproducir</button><button class="btn" id="pvVoice">${icon('mic')}Con voz en vivo</button><button class="btn" id="pvStop">${icon('stop')}Detener</button></div>
      <input type="range" id="pvSeek" min="0" max="${tl.duration}" step=".05" value="0" aria-label="Posición"><div class="small" id="pvTime"></div>
      <div class="small">“Con voz en vivo” lee cada escena con la voz de su personaje y mide cuánto tarda de verdad. Después puedes ajustar las duraciones a esa medida.</div>
      <button class="btn" id="pvFit" disabled>Ajustar duraciones a la voz medida</button></div>
      <div class="card"><b>Escenas</b> <span class="small">(${tl.scenes.length} · ${fmtDur(tl.duration)})</span><div class="list" style="margin-top:8px;max-height:420px;overflow:auto">${tl.scenes.map((s, i) => `<button class="btn sm ghost" style="justify-content:flex-start" data-j="${s.start}">${i + 1}. <span class="mute">${Math.floor(s.start / 60)}:${String(Math.floor(s.start % 60)).padStart(2, '0')}</span> ${esc((s.dialogue || '').slice(0, 48))}…</button>`).join('')}</div></div>
      <button class="btn" id="pvOk">${icon('check')}Se ve bien</button>${nextBtn('Renderizar', 6)}</div></div>`;
    bindNext();
    player = new E.Player($('#pv'), tl); player.narration = App.narrations[p.id] ? App.narrations[p.id].buffer : null;
    const mm = t => tl.duration >= 60 ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}` : t.toFixed(1) + ' s'; player.onTime = t => { $('#pvTime').textContent = `${mm(t)} / ${mm(tl.duration)}`; $('#pvSeek').value = t; };
    player.draw();
    $('#pvPlay').onclick = () => player.playing ? player.stop() : player.play();
    $('#pvStop').onclick = () => { player.stop(); player.stopVoice(); };
    $('#pvSeek').oninput = e => player.seek(+e.target.value);
    $$('[data-j]').forEach(b => b.onclick = () => player.seek(+b.dataset.j + .01));
    let measured = null;
    $('#pvVoice').onclick = async () => { const m = await player.playWithVoice(voiceFor); if (m) { measured = m; $('#pvFit').disabled = false; UI.toast('Duraciones medidas. Puedes ajustarlas.'); } };
    $('#pvFit').onclick = () => { if (!measured) return; p.storyboard.scenes.forEach((s, i) => { if (measured[i]) s.dur = +Math.max(1.5, measured[i] + .35).toFixed(1); }); if (p.render) p.render.stale = true; save(); UI.toast('Duraciones ajustadas a la voz.'); stepPreview(); };
    $('#pvOk').onclick = () => { p.previewed = true; save(); go(6); };
  };

  /* ---- paso 6: render ---- */
  let cancel = null;
  const doRender = async (btn, {auto = false} = {}) => {
    const ac = E.newAudioContext();
    const tl = tlOf(fitOpts()); const nar = App.narrations[p.id];
    const bitrate = bitrateFor(tl.duration, settings.quality);
    cancel = {cancelled: false};
    const prog = $('#rProg'), lbl = $('#rLbl');
    const res = await E.record(tl, {ac, narration: nar ? nar.buffer : null, bitrate, cancel, onProgress: (k, msg) => { if (prog) prog.style.width = (k * 100).toFixed(1) + '%'; if (lbl) lbl.textContent = `${msg} ${(k * 100).toFixed(0)}%`; }});
    try { ac.close(); } catch {}
    Usage.bump('renders');
    const probe = await E.probeVideo(res.blob);
    App.lastBlobs = App.lastBlobs || {}; App.lastBlobs[p.id] = res.blob;
    if (lbl) lbl.textContent = 'Guardando en tu nube gratuita…';
    let up = null; if (res.size <= 20 * 1024 * 1024) up = await Files.upload(res.blob, 'el video');
    if (p.render && p.render.assetId && up) Files.remove(p.render.assetId);
    p.render = {assetId: up ? up.id : null, url: up ? up.url : null, mime: res.mime, ext: res.ext, size: res.size, W: res.W, H: res.H, duration: res.duration, at: Date.now(), probe, bitrate, withNarration: !!nar, stale: false, cloud: !!up};
    await save();
    if (!up && !auto) UI.toast(res.size > 20 * 1024 * 1024 ? `El video pesa ${fmtBytes(res.size)}, más que los 20 MB de la nube gratuita: pulsa "Descargar video" ahora (queda disponible solo mientras esta página esté abierta).` : 'No se guardó en la nube; descárgalo ahora.', 'warn', 12000);
    return res;
  };
  const videoSrc = () => (App.lastBlobs && App.lastBlobs[p.id]) ? URL.createObjectURL(App.lastBlobs[p.id]) : (p.render && p.render.assetId ? Files.url(p.render.assetId) : '');
  const downloadVideo = async () => {
    let blob = App.lastBlobs && App.lastBlobs[p.id];
    if (!blob && p.render && p.render.assetId) { try { blob = await (await fetch(Files.url(p.render.assetId))).blob(); } catch { blob = null; } }
    if (!blob) return UI.toast('El archivo no está disponible en esta sesión. Vuelve a renderizar.', 'warn');
    await Files.save(`${slug(p.title)}.${p.render.ext}`, blob);
  };
  const stepRender = () => {
    if (!p.storyboard) { body().innerHTML = `<div class="empty">Primero crea el storyboard.</div>`; return; }
    const tl = tlOf(fitOpts()); const mime = E.pickMime(); const est = durEstimate(tl.duration, settings.quality);
    body().innerHTML = `<div class="stage"><div class="stack"><div class="card stack"><h3>Renderizar ${tl.W}×${tl.H} · ${fmtDur(tl.duration)}</h3>
      <div class="small">Se dibuja cuadro a cuadro y se graba en tu navegador (gratis). Tarda lo mismo que dura el video (≈ ${fmtDur(tl.duration)}). Mantén esta pestaña visible mientras graba: si cambias de pestaña o minimizas, la grabación se pausa sola y sigue cuando vuelves.</div>
      <div class="small" id="rEst">Archivo estimado: ≈ ${fmtBytes(est.size)}${est.cloud ? ' (cabe en la nube gratuita)' : ' · no cabe en la nube gratuita de 20 MB: al terminar, descárgalo antes de cerrar la página'}.</div>
      ${tl.duration > 300 ? '<div class="note">Video largo: conecta el cargador, cierra otras pestañas pesadas y no dejes que la computadora se suspenda. Usa Chrome o Edge en computadora.</div>' : ''}
      ${mime ? `<div class="small">Formato de salida: <b>${mime.startsWith('video/mp4') ? 'MP4' : 'WebM'}</b>${mime.startsWith('video/webm') ? ' (tu navegador no graba MP4; YouTube y TikTok aceptan WebM; para Instagram puede hacer falta convertirlo)' : ''}.</div>` : '<div class="note bad">Este navegador no puede grabar video. Usa Chrome o Edge en tu computadora.</div>'}
      <label class="f">Calidad<select id="qSel"><option value="cloud" ${settings.quality !== 'max' ? 'selected' : ''}>${tl.duration > 107 ? 'Automática para videos largos (' + (bitrateFor(tl.duration, 'cloud') / 1e6).toFixed(1) + ' Mbps)' : 'Optimizada para la nube gratuita (≤ 18 MB)'}</option><option value="max" ${settings.quality === 'max' ? 'selected' : ''}>Máxima (8 Mbps; ≈ 1 MB por segundo de video)</option></select></label>
      ${App.narrations[p.id] ? `<div class="tag ok">Con narración: ${esc(App.narrations[p.id].name)}</div>` : p.narrationName ? `<div class="note">Usaste la narración "${esc(p.narrationName)}" antes. Vuelve a subirla en el paso Voces si quieres que el nuevo render la incluya.</div>` : ''}
      <div class="bar"><i id="rProg" style="width:0%"></i></div><div class="small" id="rLbl"></div>
      <div class="row"><button class="btn primary" id="rGo" ${mime ? '' : 'disabled'}>${icon('film')}Renderizar video</button><button class="btn" id="rCancel">Cancelar</button></div></div>
      ${p.render ? `<div class="card small">Último render: ${fmtDate(p.render.at)} · ${p.render.ext.toUpperCase()} · ${fmtBytes(p.render.size)} · ${p.render.cloud ? 'guardado en la nube' : 'solo en esta sesión'}${p.render.stale ? ' · <span class="tag warn">desactualizado: hubo cambios</span>' : ''}</div>` : ''}
      ${nextBtn('Miniatura', 7)}</div>
      <div>${p.render && videoSrc() ? `<div class="canvasbox ${p.render.H > p.render.W ? 'vert' : ''}"><video id="rVid" controls playsinline src="${videoSrc()}" style="width:100%;display:block"></video></div><div class="row" style="margin-top:10px"><button class="btn" id="rDl">${icon('download')}Descargar video</button></div>` : '<div class="empty">El video aparecerá aquí.</div>'}</div></div>`;
    bindNext();
    $('#qSel').onchange = async e => { settings.quality = e.target.value; await Store.set('settings', settings); const x = durEstimate(tl.duration, settings.quality); $('#rEst').textContent = `Archivo estimado: ≈ ${fmtBytes(x.size)}${x.cloud ? ' (cabe en la nube gratuita)' : ' · no cabe en la nube gratuita de 20 MB: al terminar, descárgalo antes de cerrar la página'}.`; };
    $('#rGo').onclick = e => UI.busy(e.currentTarget, async () => { await doRender(e.currentTarget); renderSteps(); stepRender(); UI.toast('Video renderizado.'); }, 'Renderizando…');
    $('#rCancel').onclick = () => { if (cancel) cancel.cancelled = true; };
    const dl = $('#rDl'); if (dl) dl.onclick = downloadVideo;
  };

  /* ---- paso 7: miniatura ---- */
  const thumbData = (text, v) => { const sb = p.storyboard ? p.storyboard.scenes : []; const main = sb.find(s => s.chars.length) || {chars: [{id: chars[0].id}]}; const c = allChars.find(x => x.id === (p.cast[0] || main.chars[0].id)) || chars[0]; const c2 = allChars.find(x => x.id === p.cast[1]) || c; const mv = sb.flatMap(s => s.chars).find(x => x.move); return {variant: v, text, char: c, char2: c2, obj: (sb.find(s => s.objects.length) || {objects: [mod === 'gym' ? 'dumbbell' : 'coins']}).objects[0], bg: (sb[0] || {}).bg || (mod === 'gym' ? 'gimnasio' : 'oficina'), accent: brand.c1 || (mod === 'gym' ? '#ff7a45' : '#2ee59d'), brandName: brand.name || '', move: mv ? mv.move : null, highlight: v === 2, items: ((sb.find(s => s.overlay && (s.overlay.items || []).some(it => it.emoji)) || {}).overlay || {}).items, zone: (sb.flatMap(s => s.chars).find(c => c.muscles) || {}).muscles}; };
  const stepThumb = () => {
    p.thumbTexts = p.thumbTexts || Gen.thumbTextsTemplate(p);
    const variants = E.THUMB_LAYOUTS.concat(mod === 'gym' ? E.THUMB_LAYOUTS_GYM : []).map((name, v) => ({name, v, text: p.thumbTexts[v % p.thumbTexts.length]}));
    body().innerHTML = `<div class="row between" style="margin-bottom:12px"><span class="small">5 propuestas · 1280×720 · conservan los colores de tu canal</span><div class="row"><button class="btn sm" id="tAI">${icon('spark')}Textos con IA</button>${nextBtn('Control de calidad', 8)}</div></div>
      <div class="grid g3">${variants.map(x => `<div class="card prop stack" aria-selected="${p.thumb && p.thumb.variant === x.v && p.thumb.text === x.text}"><canvas data-th="${x.v}" style="width:100%;border-radius:8px;background:#000"></canvas><b>${esc(x.name)}</b><input data-tt="${x.v}" value="${esc(x.text)}" aria-label="Texto de la miniatura"><div class="row"><button class="btn sm primary" data-ts="${x.v}">${icon('check')}Elegir y guardar</button><button class="btn sm" data-td="${x.v}">${icon('download')}PNG</button></div></div>`).join('')}</div>`;
    bindNext();
    const draw = v => { const cv = $(`[data-th="${v}"]`); cv.width = 1280; cv.height = 720; E.drawThumb(cv.getContext('2d'), 1280, 720, thumbData($(`[data-tt="${v}"]`).value, v)); };
    variants.forEach(x => draw(x.v));
    $$('[data-tt]').forEach(i => i.oninput = () => { draw(+i.dataset.tt); p.thumbTexts[+i.dataset.tt] = i.value; clearTimeout(stepThumb.t); stepThumb.t = setTimeout(save, 700); });
    $$('[data-td]').forEach(b => b.onclick = async () => { const blob = await Files.canvasBlob($(`[data-th="${b.dataset.td}"]`)); Files.save(`miniatura-${slug(p.title)}-${+b.dataset.td + 1}.png`, blob); });
    $$('[data-ts]').forEach(b => b.onclick = () => UI.busy(b, async () => { const v = +b.dataset.ts; await saveThumb(v, $(`[data-tt="${v}"]`).value, $(`[data-th="${v}"]`)); renderSteps(); stepThumb(); }, 'Guardando…'));
    $('#tAI').onclick = e => UI.busy(e.currentTarget, async () => { const t = await Gen.thumbTexts(p); if (t.length) { p.thumbTexts = t; await save(); stepThumb(); } }, 'Escribiendo…');
  };
  const saveThumb = async (v, text, cv) => {
    if (!cv) { cv = document.createElement('canvas'); cv.width = 1280; cv.height = 720; E.drawThumb(cv.getContext('2d'), 1280, 720, thumbData(text, v)); }
    const blob = await Files.canvasBlob(cv, 'image/jpeg', .9); const up = await Files.upload(blob, 'la miniatura');
    if (p.thumb && p.thumb.assetId && up) Files.remove(p.thumb.assetId);
    p.thumb = {variant: v, text, assetId: up ? up.id : null, at: Date.now()}; App.lastThumbs = App.lastThumbs || {}; App.lastThumbs[p.id] = blob; await save();
  };

  /* ---- paso 8: control de calidad ---- */
  const stepQA = () => {
    const qa = p.qa;
    const ic = s => s === 'ok' ? '<span class="tag ok">OK</span>' : s === 'warn' ? '<span class="tag warn">Revisar</span>' : '<span class="tag bad">Problema</span>';
    body().innerHTML = `<div class="stage"><div class="stack">${qa ? `<div class="card"><div class="row between"><h3 style="margin:0">Resultado · ${fmtDate(qa.at)}</h3>${qa.approved ? '<span class="tag ok">APROBADO</span>' : qa.canApprove ? '<span class="tag warn">Listo para aprobar</span>' : '<span class="tag bad">No aprobable: hay problemas importantes</span>'}</div>
      <table style="margin-top:10px" class="stack-t"><thead><tr><th>Verificación</th><th>Estado</th><th>Detalle</th></tr></thead><tbody>${qa.checks.map(c => `<tr><td><b>${esc(c.label)}</b></td><td>${ic(c.status)}</td><td class="small">${c.detail}</td></tr>`).join('')}</tbody></table>
      ${qa.fixed && qa.fixed.length ? `<div class="note ok" style="margin-top:10px">Corregido automáticamente: ${esc(qa.fixed.join(', '))}. ${p.render && p.render.stale ? 'Vuelve a renderizar para que el video incluya los cambios.' : ''}</div>` : ''}</div>` : '<div class="empty">Aún no se ha revisado este video.</div>'}</div>
      <div class="stack"><div class="card stack"><button class="btn primary" id="qRun">${icon('shield')}Revisar ahora</button><button class="btn" id="qFix" ${qa && qa.checks.some(c => c.fixable && c.status !== 'ok') ? '' : 'disabled'}>${icon('wand')}Corregir automáticamente</button>
      <button class="btn" id="qApprove" ${qa && qa.canApprove && !qa.approved ? '' : 'disabled'}>${icon('check')}Aprobar video</button>
      <div class="small">Solo se puede aprobar si no hay problemas importantes. Las advertencias no bloquean, pero conviene leerlas.</div></div>${nextBtn('Exportar', 9)}</div></div>`;
    bindNext();
    $('#qRun').onclick = e => UI.busy(e.currentTarget, async () => { p.qa = await QA.run(p, allChars, {tl: tlOf(fitOpts())}); await save(); renderSteps(); stepQA(); }, 'Revisando…');
    $('#qFix').onclick = e => UI.busy(e.currentTarget, async () => { const fixed = await QA.autofix(p, p.qa, allChars); p.qa = await QA.run(p, allChars, {tl: tlOf(fitOpts()), useAI: false}); p.qa.fixed = fixed; await save(); renderSteps(); stepQA(); }, 'Corrigiendo…');
    $('#qApprove').onclick = () => { if (!p.qa.canApprove) return; p.qa.approved = true; save(); renderSteps(); stepQA(); UI.toast('Video aprobado.'); };
  };

  /* ---- paso 9: exportar ---- */
  const stepExport = () => {
    const pub = p.publish;
    body().innerHTML = `<div class="grid g2"><div class="card stack"><div class="row between"><h3 style="margin:0">Publicación</h3><div class="row"><button class="btn sm" id="pAI">${icon('spark')}Con IA</button><button class="btn sm" id="pTpl">Plantilla</button></div></div>
      ${pub ? `<label class="f">Título<input id="pT" value="${esc(pub.title)}"></label><label class="f">Descripción<textarea id="pD" style="min-height:150px">${esc(pub.desc)}</textarea></label><label class="f">Hashtags<input id="pH" value="${esc(pub.tags.join(' '))}"></label>
      <div class="row"><button class="btn" id="pCopy">${icon('copy')}Copiar todo</button></div>` : '<div class="empty">Genera el título, la descripción y los hashtags.</div>'}
      </div><div class="stack"><div class="card stack"><h3>Descargas</h3>
      <div class="list"><button class="btn" id="dVid" ${p.render ? '' : 'disabled'}>${icon('download')}Video (${p.render ? p.render.ext.toUpperCase() : '—'})</button>
      <button class="btn" id="dThumb" ${p.thumb ? '' : 'disabled'}>${icon('download')}Miniatura (JPG)</button>
      <button class="btn" id="dSrt" ${p.storyboard ? '' : 'disabled'}>${icon('download')}Subtítulos (.srt)</button>
      <button class="btn" id="dTxt" ${p.script ? '' : 'disabled'}>${icon('download')}Guion (.txt)</button>
      <button class="btn" id="dJson">${icon('download')}Proyecto completo (.json)</button></div></div>
      <div class="card stack"><h3>Estado de publicación</h3>
      <div class="note info">Publicación automática: <b>no disponible</b>. YouTube, TikTok e Instagram exigen apps registradas con sus sistemas oficiales (OAuth) que esta página no puede conectar de forma gratuita desde aquí. Sube el archivo exportado desde la app o web de cada plataforma.</div>
      <div><span class="tag ${p.exported ? 'info' : ''}">${p.exported ? 'Exportado ' + fmtDate(p.exported) : 'Aún no exportado'}</span> ${p.publish && p.publish.manualPublished ? `<span class="tag ok">Publicado por ti</span>` : ''}</div>
      <label class="f">Enlace del video publicado (opcional, lo registras tú)<input id="pUrl" placeholder="https://…" value="${esc(p.publish && p.publish.url || '')}"></label>
      <button class="btn" id="pMark" ${p.publish ? '' : 'disabled'}>${icon('check')}Marcar como publicado por mí</button>
      ${p.qa && p.qa.approved ? '' : '<div class="small">Consejo: aprueba el control de calidad antes de publicar.</div>'}</div></div></div>`;
    const mark = () => { p.exported = Date.now(); save(); renderSteps(); };
    $('#pAI').onclick = e => UI.busy(e.currentTarget, async () => { if (!p.script) return UI.toast('Falta el guion.', 'warn'); p.publish = {...(p.publish || {}), ...(await Gen.publishPack(p))}; await save(); stepExport(); }, 'Escribiendo…');
    $('#pTpl').onclick = () => { if (!p.script) return UI.toast('Falta el guion.', 'warn'); p.publish = {...(p.publish || {}), ...Gen.publishTemplate(p)}; save(); stepExport(); };
    if (pub) { const upd = () => { p.publish.title = $('#pT').value; p.publish.desc = $('#pD').value; p.publish.tags = $('#pH').value.split(/\s+/).filter(Boolean); clearTimeout(stepExport.t); stepExport.t = setTimeout(save, 700); }; ['#pT', '#pD', '#pH'].forEach(s => $(s).oninput = upd); $('#pCopy').onclick = () => UI.copy(`${p.publish.title}\n\n${p.publish.desc}\n\n${p.publish.tags.join(' ')}`); }
    $('#dVid').onclick = async () => { await downloadVideo(); mark(); };
    $('#dThumb').onclick = async () => { let blob = App.lastThumbs && App.lastThumbs[p.id]; if (!blob && p.thumb.assetId) { try { blob = await (await fetch(Files.url(p.thumb.assetId))).blob(); } catch {} } if (!blob) { const cv = document.createElement('canvas'); cv.width = 1280; cv.height = 720; E.drawThumb(cv.getContext('2d'), 1280, 720, thumbData(p.thumb.text, p.thumb.variant)); blob = await Files.canvasBlob(cv, 'image/jpeg', .9); } await Files.save(`miniatura-${slug(p.title)}.jpg`, blob); mark(); };
    $('#dSrt').onclick = () => { Files.save(`${slug(p.title)}.srt`, App.makeSRT(tlOf(fitOpts()))); mark(); };
    $('#dTxt').onclick = () => { Files.save(`guion-${slug(p.title)}.txt`, App.scriptText(p) + (p.publish ? `\n\n---\n${p.publish.title}\n${p.publish.desc}\n${p.publish.tags.join(' ')}` : '')); mark(); };
    $('#dJson').onclick = () => { const o = clone(p); Files.save(`proyecto-${slug(p.title)}.json`, JSON.stringify(o, null, 2)); };
    $('#pUrl').oninput = e => { p.publish = p.publish || {}; p.publish.url = e.target.value.trim(); clearTimeout(stepExport.u); stepExport.u = setTimeout(save, 700); };
    $('#pMark').onclick = () => { p.publish.manualPublished = Date.now(); save(); renderSteps(); stepExport(); UI.toast('Marcado como publicado (registro manual).'); };
  };

  /* ---- GENERAR VIDEO COMPLETO ---- */
  const generateAll = async (btn) => {
    if (p.duration > 180) {
      const e = durEstimate(p.duration, settings.quality);
      const ok = await UI.confirm(`Video largo de ${fmtDur(p.duration)}. Antes de empezar: · usará ≈ ${e.ai} operaciones de IA; si se alcanza el límite gratuito, se detiene, guarda lo hecho y continúas después con el mismo botón. · La grabación tarda ≈ ${fmtDur(p.duration)} en tiempo real: deja esta pestaña visible y el cargador conectado (si cambias de pestaña, se pausa sola). · El archivo pesará ≈ ${fmtBytes(e.size)}${e.cloud ? '' : ': no cabe en la nube gratuita, así que al terminar descárgalo antes de cerrar la página'}.`, 'Empezar');
      if (!ok) return;
    }
    const ac = E.newAudioContext(); try { await ac.resume(); } catch {}
    const stages = [['script', 'Guion'], ['storyboard', 'Storyboard'], ['render', 'Render del video'], ['thumb', 'Miniatura'], ['publish', 'Textos de publicación'], ['qa', 'Control de calidad']];
    const {el, close} = UI.modal(`<h2>Generando video completo</h2><p class="small">Mantén esta pestaña visible: el video se graba en tiempo real.</p><div class="list" id="gaList">${stages.map(([k, l]) => `<div class="item" data-st="${k}"><span class="dot"></span><div class="grow">${l}</div><span class="small" data-msg></span></div>`).join('')}</div><div class="bar" style="margin-top:12px"><i id="rProg" style="width:0%"></i></div><div class="small" id="rLbl"></div><div class="row end" style="margin-top:14px"><button class="btn" id="gaStop">Detener</button></div>`);
    let stop = false; el.querySelector('#gaStop').onclick = () => { stop = true; if (cancel) cancel.cancelled = true; close(); };
    const mark = (k, st, msg = '') => { const r = el.querySelector(`[data-st="${k}"]`); if (!r) return; r.querySelector('.dot').className = 'dot ' + (st === 'ok' ? 'ok' : st === 'run' ? 'warn' : st === 'bad' ? 'bad' : ''); r.querySelector('[data-msg]').textContent = msg; };
    try {
      const prog = (k, n, msg) => { const b = el.querySelector('#rProg'), l = el.querySelector('#rLbl'); if (b) b.style.width = (k / n * 100).toFixed(0) + '%'; if (l) l.textContent = msg + '…'; };
      mark('script', 'run'); if (!p.script) { p.script = AI.available() ? await Gen.script(p, chars, {onProgress: (k, n, m) => { prog(k, n, m); mark('script', 'run', m); }, save}) : null; if (!p.script) throw new Error('Sin IA disponible para escribir el guion. Escríbelo en el paso Guion (plantilla) y vuelve a pulsar el botón.'); await save(); } mark('script', 'ok', p.script.source === 'ia' ? 'IA' : 'tuyo');
      if (stop) return;
      mark('storyboard', 'run'); if (!p.storyboard || !p.storyboard.scenes.length || p.storyboard.partial) {
        try { p.storyboard = await Gen.storyboard(p, allChars.filter(c => mod === 'gym' ? true : c.module !== 'gym'), {onProgress: (k, n, m) => { prog(k, n, m); mark('storyboard', 'run', m); }, save, rulesChars: chars}); }
        catch (e) {
          // el storyboard por reglas no usa IA: se completa lo que falte y se avisa
          if (p.storyboard && p.storyboard.partial) { const wc = u => u.reduce((a, s) => a + s.text.split(/\s+/).filter(Boolean).length, 0); Gen.sbBlocks(p).slice(p.storyboard.partial.done).forEach(bl => p.storyboard.scenes.push(...Gen.storyboardRules(p, chars, bl, wc(bl) / WPS).scenes)); p.storyboard.source = 'mixto'; delete p.storyboard.partial; }
          else p.storyboard = Gen.storyboardRules(p, chars);
          UI.toast('La IA no estuvo disponible (' + esc(e.userMsg || e.message) + '): lo que faltaba del storyboard se hizo por reglas, sin IA.', 'warn', 9000);
        }
        await save(); } mark('storyboard', 'ok', p.storyboard.scenes.length + ' escenas');
      if (stop) return;
      mark('render', 'run'); if (!p.render || p.render.stale || !(App.lastBlobs && App.lastBlobs[p.id]) && !p.render.assetId) { await doRender(null, {auto: true}); } mark('render', 'ok', p.render.cloud ? 'en la nube' : 'en esta sesión');
      if (stop) return;
      mark('thumb', 'run'); if (!p.thumb) { try { p.thumbTexts = await Gen.thumbTexts(p); } catch { p.thumbTexts = Gen.thumbTextsTemplate(p); } await saveThumb(0, p.thumbTexts[0]); } mark('thumb', 'ok');
      mark('publish', 'run'); if (!p.publish || !p.publish.title) { try { p.publish = {...(p.publish || {}), ...(await Gen.publishPack(p))}; } catch { p.publish = {...(p.publish || {}), ...Gen.publishTemplate(p)}; } await save(); } mark('publish', 'ok');
      mark('qa', 'run'); p.qa = await QA.run(p, allChars, {tl: tlOf(fitOpts())}); if (p.qa.checks.some(c => c.fixable && c.status !== 'ok')) { const fixed = await QA.autofix(p, p.qa, allChars); if (fixed.length && p.render && p.render.stale) { mark('qa', 'run', 'aplicando correcciones y re-renderizando'); await doRender(null, {auto: true}); } p.qa = await QA.run(p, allChars, {tl: tlOf(fitOpts()), useAI: false}); p.qa.fixed = fixed; }
      await save(); mark('qa', p.qa.canApprove ? 'ok' : 'bad', p.qa.canApprove ? 'listo para aprobar' : 'hay problemas');
      close(); p.step = 8; await save(); renderSteps(); renderStep();
      UI.toast(p.qa.canApprove ? 'Video completo generado. Revisa el control de calidad y apruébalo.' : 'Video generado, pero el control de calidad encontró problemas importantes. Revísalos antes de publicar.', p.qa.canApprove ? '' : 'warn', 9000);
    } catch (e) {
      const cur = stages.find(([k]) => { const r = el.querySelector(`[data-st="${k}"] .dot`); return r && r.classList.contains('warn'); }); if (cur) mark(cur[0], 'bad', 'detenido');
      UI.error(e); await save(); renderSteps();
      el.querySelector('#rLbl').innerHTML = `<span style="color:var(--bad)">${esc(e.userMsg || e.message)}</span> El progreso quedó guardado; puedes continuar luego.`;
    } finally { try { ac.close(); } catch {} }
  };

  const renderStep = () => [stepIdea, stepProps, stepScript, stepStory, stepVoice, stepPreview, stepRender, stepThumb, stepQA, stepExport][p.step || 0]();
  renderSteps(); renderStep();
};

/* ============ Vistas compartidas: personajes, videos, miniaturas, guiones ============ */
App.charactersView = async (main, mod) => {
  let list = await Lib.chars();
  const mine = () => list.filter(c => mod === 'gym' ? c.module === 'gym' : c.module !== 'gym');
  await A.preload(mine());
  main.innerHTML = App.head(mod === 'fin' ? 'Finanzas' : 'Gym', mod === 'fin' ? 'Personajes' : 'NEXO y personajes', 'Biblioteca de personajes originales y recurrentes. Su diseño y su voz se guardan y se reutilizan igual en todas las escenas y videos. También puedes crear uno con una imagen de tu computadora.', `<button class="btn" id="newImg">${icon('image')}Desde una imagen</button><button class="btn primary" id="newC">${icon('plus')}Nuevo personaje</button><input type="file" id="imgPick" accept="${App.CharImage.accept}" hidden>`) + `<div class="grid gauto" id="cg"></div>`;
  const isImg = c => A.isImage(c);
  const draw = () => {
    $('#cg').innerHTML = mine().map(c => `<div class="card stack"><canvas data-cc="${c.id}" width="300" height="300" style="width:100%;background:var(--bg);border-radius:10px"></canvas><div class="row between"><h3 style="margin:0">${esc(c.name)}</h3><button class="btn sm" data-ce="${c.id}">${icon('edit')}Editar</button></div><div class="small">${esc(c.role)}</div><div class="small mute">${esc(c.personality)}</div><div class="row">${isImg(c) ? '<span class="tag info">Desde imagen</span>' : ''}<span class="tag">${esc(c.voice.engine === 'claude' ? (Voice.claudeVoices.find(v => v.id === c.voice.voice) || {}).label : 'Voz del navegador')}</span><button class="btn sm" data-cv="${c.id}">${icon('play')}Voz</button></div></div>`).join('');
    const t0 = performance.now(); const acts = ['talk', 'present', 'think', 'celebrate', 'point'];
    const label = (x, txt, dark) => { x.fillStyle = dark ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.75)'; x.font = '600 13px "Inter Tight",sans-serif'; x.textAlign = 'left'; x.fillText(txt, 10, 20); };
    const loop = () => {
      if (!$('#cg')) return; const t = (performance.now() - t0) / 1000;
      mine().forEach((c, i) => {
        const cv = $(`[data-cc="${c.id}"]`); if (!cv) return; const x = cv.getContext('2d'); x.clearRect(0, 0, 300, 300);
        const ph = Math.floor(t / 4);
        if (isImg(c)) {
          if (c.module === 'gym' && ph % 2 === 1 && App.Art3D) { const mv = A.moveList[Math.floor(t / 8) % A.moveList.length].id; App.Art3D.draw(x, 300, 300, {char: c, move: mv, t, highlight: true, theme: 'light', fitH: .8}); label(x, 'Doble 3D para ejercicios · ' + A.MOVES[mv].label, true); return; }
          const act = acts[(i + Math.floor(t / 3)) % acts.length]; const {pose} = A.poseAt(act, t);
          A.drawCharacter(x, c, {x: 150, y: 285, scale: .78, facing: 1, pose, act, expr: ['happy', 'confident', 'thinking', 'excited', 'surprised'][(i + Math.floor(t / 3)) % 5], t, talk: act === 'talk' ? Math.abs(Math.sin(t * 12)) * .8 : 0});
          label(x, 'Imagen animada · ' + (A.ACT_LABEL[act] || act)); return;
        }
        const mv = c.module === 'gym' ? A.moveList[Math.floor(t / 4) % A.moveList.length].id : acts[(i + Math.floor(t / 3)) % acts.length];
        if (c.module === 'gym' && App.Art3D && App.Art3D.supports(c)) { App.Art3D.draw(x, 300, 300, {char: c, move: mv, t, highlight: true, theme: 'light', fitH: .8}); label(x, A.MOVES[mv].label + ' · 3D', true); return; }
        const {pose, move} = A.poseAt(mv, t); A.drawCharacter(x, c, {x: 150, y: 270, scale: .62, facing: 1, pose, act: mv, expr: ['happy', 'confident', 'thinking', 'excited', 'surprised'][(i + Math.floor(t / 3)) % 5], t, talk: mv === 'talk' ? Math.abs(Math.sin(t * 12)) * .8 : 0, prop: move && A.PROPS[move.prop]});
        if (c.module === 'gym') label(x, A.MOVES[mv].label);
      });
      requestAnimationFrame(loop);
    };
    loop();
    $$('[data-ce]').forEach(b => b.onclick = () => edit(list.find(c => c.id === b.dataset.ce)));
    $$('[data-cv]').forEach(b => b.onclick = () => UI.busy(b, async () => { const c = list.find(x => x.id === b.dataset.cv); Voice.stop(); await Voice.speak(`Hola, soy ${c.name}. ${c.role}.`, c.voice); }, 'Hablando…'));
  };
  /* procesa un archivo de imagen elegido en tu computadora */
  const takeImage = async (file, removeBg) => {
    const res = await App.CharImage.fromFile(file, {removeBg});
    const img = await App.CharImage.save(res);
    await A.loadImage(img.src);
    return {res, img};
  };
  const edit = (c, pre) => {
    const isNew = !c; c = c ? clone(c) : {id: 'c' + uid().slice(-6), name: 'NUEVO', module: mod, role: '', personality: '', look: clone(A.defaultCharacters[mod === 'gym' ? 4 : 0].look), voice: {engine: 'claude', voice: 'buttery', rate: 1, pitch: 1, gender: 'm', style: 'educativo'}};
    const L = c.look; const origAsset = L.img && L.img.assetId; let img = L.img ? clone(L.img) : null; const dropAssets = [];
    if (pre) { img = pre.img; Object.assign(L, pre.palette, {style: 'image'}); }
    const opt = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`).join('');
    const styles = () => ({...(img ? {image: 'Imagen de mi computadora'} : {}), normal: 'Personaje 2D con ropa', stick: 'Stickman 2D (tinta)', stick3d: 'Stickman cabeza de bola', anatomy: 'Anatómico (músculos marcados)'});
    const {el, close} = UI.modal(`<h2>${isNew ? 'Nuevo personaje' : esc(c.name)}</h2><div class="stage" style="grid-template-columns:minmax(0,1fr) 240px"><div class="stack">
      <div class="card stack" style="background:var(--bg)"><div class="row between"><b>Imagen desde tu computadora</b><span class="small mute">PNG, JPG o WebP</span></div>
        <div class="row" style="align-items:center"><button class="btn sm" id="k_pick">${icon('upload')}${img ? 'Cambiar imagen' : 'Elegir imagen'}</button><label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="k_rmbg" checked> Quitar fondo liso automáticamente</label>${img ? '<button class="btn sm ghost" id="k_noimg">Quitar imagen</button>' : ''}<input type="file" id="k_file" accept="${App.CharImage.accept}" hidden></div>
        <div class="small" id="k_imgmsg">${img ? (img.local ? 'Imagen guardada dentro del personaje (versión reducida, porque la nube gratuita no está disponible en esta vista).' : 'Imagen guardada en tu nube gratuita.') : 'Sube un dibujo o PNG de tu personaje (mejor con fondo transparente o liso). Se anima solo: rebota al hablar, se balancea, salta al celebrar y tiembla si está preocupado.'}</div>
        <div class="grid g2" id="k_imgopts" ${img ? '' : 'hidden'}><label class="f">La imagen mira hacia<select id="k_faces">${opt({front: 'Al frente (no se voltea)', right: 'La derecha', left: 'La izquierda'}, (img && img.faces) || 'front')}</select></label><label class="f">Tamaño en escena<input type="range" id="k_iscale" min=".7" max="1.3" step=".02" value="${L.imgScale || 1}"></label></div>
        <div class="small mute">En videos 2D tu imagen se anima sola en cada acción y ejercicio (sentadilla, pesas, correr, saltar…) con los implementos dibujados encima. En videos 3D se usa un doble 3D con los colores de abajo. Usa imágenes tuyas o que tengas derecho a usar.</div>
        <div id="k_poses" ${img ? '' : 'hidden'}><b class="small">Imágenes por acción (opcional)</b><div class="small mute">Si tienes una imagen de tu personaje en una pose concreta, súbela y se usará sola en esa acción o ejercicio.</div>
          <div class="row" style="margin-top:6px"><select id="k_pact" style="width:auto">${Object.entries({...A.ACT_LABEL, ...Object.fromEntries(A.moveList.map(m => [m.id, '▶ ' + m.label]))}).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select><button class="btn sm" id="k_padd">${icon('upload')}Subir imagen de esa acción</button><input type="file" id="k_pfile" accept="${App.CharImage.accept}" hidden></div><div class="chips" id="k_plist" style="margin-top:6px"></div></div></div>
      <div class="grid g2"><label class="f">Nombre<input id="k_name" value="${esc(c.name)}"></label><label class="f">Rol<input id="k_role" value="${esc(c.role)}"></label></div>
      <label class="f">Personalidad<textarea id="k_pers">${esc(c.personality)}</textarea></label>
      <div class="grid g2"><label class="f">Estilo de dibujo<select id="k_style2">${opt(styles(), L.style === 'image' && img ? 'image' : (L.style && L.style !== 'image' ? L.style : 'normal'))}</select></label><label class="f">Complexión anatómica${img ? ' / del doble' : ''}<select id="k_body">${opt({m: 'Masculina', f: 'Femenina'}, L.body || 'm')}</select></label></div>
      <div class="grid g3"><label class="f">Piel<input type="color" id="k_skin" value="${L.skin}"></label><label class="f">Pelo<select id="k_hair">${opt({short: 'Corto', fade: 'Degradado', curly: 'Rizado', long: 'Largo', bun: 'Moño', ponytail: 'Cola de caballo', bald: 'Calvo'}, L.hair)}</select></label><label class="f">Color de pelo<input type="color" id="k_hc" value="${L.hairColor}"></label></div>
      <div class="grid g3"><label class="f">Prenda<select id="k_top">${opt({hoodie: 'Sudadera', blazer: 'Saco', tee: 'Camiseta', shirt: 'Camisa', tank: 'Camiseta deportiva'}, L.top)}</select></label><label class="f">Color prenda<input type="color" id="k_tc" value="${L.topColor || '#3a7bd5'}"></label><label class="f">Pantalón<input type="color" id="k_pc" value="${L.pants}"></label></div>
      <div class="grid g3"><label class="f">Zapatos<input type="color" id="k_sc" value="${L.shoes}"></label><label class="f">Accesorio<select id="k_acc">${opt({none: 'Ninguno', glasses: 'Gafas', 'glasses+beard': 'Gafas y barba', beard: 'Barba', cap: 'Gorra', earrings: 'Aretes', headband: 'Cinta', visor: 'Visor (anatómico)', tie: 'Corbata (stickman)'}, L.acc)}</select></label><label class="f">Complexión<input type="range" id="k_build" min=".85" max="1.2" step=".01" value="${L.build || 1}"></label></div>
      <div class="grid g3"><label class="f">Voz<select id="k_voice">${Voice.claudeVoices.map(v => `<option value="claude:${v.id}" ${c.voice.engine === 'claude' && c.voice.voice === v.id ? 'selected' : ''}>${v.label}</option>`).join('')}${Voice.browserVoices().map(v => `<option value="browser:${esc(v.name)}" ${c.voice.browserVoice === v.name ? 'selected' : ''}>Navegador: ${esc(v.name)}</option>`).join('')}</select></label><label class="f">Ritmo<input type="range" id="k_rate" min=".8" max="1.3" step=".02" value="${c.voice.rate || 1}"></label><label class="f">Estilo<select id="k_style">${opt({educativo: 'Educativo', narrativo: 'Narrativo', 'energético': 'Energético'}, c.voice.style)}</select></label></div>
      </div><div><canvas id="k_cv" width="240" height="300" style="width:100%;background:var(--bg);border-radius:10px"></canvas><div class="small" id="k_cvlbl" style="margin-top:4px"></div><button class="btn sm" id="k_test" style="margin-top:8px">${icon('play')}Probar voz</button></div></div>
      <div class="row between" style="margin-top:14px">${!isNew && !A.defaultCharacters.some(d => d.id === c.id) ? `<button class="btn danger" id="k_del">${icon('trash')}Eliminar</button>` : !isNew ? `<button class="btn" id="k_reset">Restaurar diseño original</button>` : '<span></span>'}<div class="row"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="k_ok">Guardar</button></div></div>`, {wide: true});
    const q = s => el.querySelector(s);
    const read = () => { const [eng, v] = q('#k_voice').value.split(':'); const st = q('#k_style2').value; const useImg = st === 'image' && img; return {...c, name: q('#k_name').value.trim() || 'SIN NOMBRE', role: q('#k_role').value, personality: q('#k_pers').value, look: {...L, skin: q('#k_skin').value, hair: q('#k_hair').value, hairColor: q('#k_hc').value, top: q('#k_top').value, topColor: q('#k_tc').value, pants: q('#k_pc').value, shoes: q('#k_sc').value, acc: q('#k_acc').value, build: +q('#k_build').value, style: useImg ? 'image' : st === 'normal' ? undefined : st === 'image' ? undefined : st, body: q('#k_body').value, shirt: L.shirt || '#e9eef5', beardColor: L.beardColor || q('#k_hc').value, img: img ? {...img, faces: q('#k_faces').value} : undefined, imgScale: +q('#k_iscale').value}, voice: {...c.voice, engine: eng, voice: eng === 'claude' ? v : c.voice.voice, browserVoice: eng === 'browser' ? v : c.voice.browserVoice, rate: +q('#k_rate').value, style: q('#k_style').value}}; };
    const cv = q('#k_cv'); const t0 = performance.now();
    const loop = () => {
      if (!document.body.contains(cv)) return; const t = (performance.now() - t0) / 1000; const x = cv.getContext('2d'); x.clearRect(0, 0, 240, 300); const ch = read();
      const ph = Math.floor(t / 4) % 3;
      if (A.isImage(ch) && mod === 'gym' && ph === 2 && App.Art3D) { App.Art3D.draw(x, 240, 300, {char: ch, move: 'squat', t, theme: 'light', fitH: .8}); q('#k_cvlbl').textContent = 'Video 3D: doble 3D con los colores de abajo'; }
      else if (A.isImage(ch) && mod === 'gym' && ph === 1) { const mv = ['squat', 'curl', 'press', 'sprint', 'pushup'][Math.floor(t / 12) % 5]; const {pose} = A.poseAt(mv, t); A.drawCharacter(x, ch, {x: 120, y: 285, scale: .76, facing: 1, pose, act: mv, exercise: true, expr: 'confident', t}); q('#k_cvlbl').textContent = 'Video 2D: ' + A.MOVES[mv].label + ' con tu imagen'; }
      else { const act = A.isImage(ch) ? ['talk', 'celebrate', 'think', 'worried'][Math.floor(t / 2.5) % 4] : 'talk'; const {pose} = A.poseAt(act, t); A.drawCharacter(x, ch, {x: 120, y: 285, scale: .76, facing: 1, pose, act, expr: act === 'think' ? 'thinking' : act === 'worried' ? 'worried' : 'happy', t, talk: act === 'talk' ? Math.abs(Math.sin(t * 12)) * .7 : 0}); q('#k_cvlbl').textContent = A.isImage(ch) ? 'Vista previa: ' + (A.ACT_LABEL[act] || act) : ''; }
      requestAnimationFrame(loop);
    };
    loop();
    const setImg = (nimg, msg) => {
      if (img && img.assetId && img.assetId !== origAsset) dropAssets.push(img.assetId);
      img = nimg; q('#k_imgopts').hidden = !img; q('#k_poses').hidden = !img; q('#k_imgmsg').textContent = msg;
      const cur = q('#k_style2').value; q('#k_style2').innerHTML = opt(styles(), img ? 'image' : cur === 'image' ? 'normal' : cur);
    };
    const fillFromAI = async (blob) => {
      if (!AI.available() || !App.Caps.images) { q('#k_imgmsg').textContent += ' Colores del doble detectados automáticamente; ajústalos si hace falta.'; return; }
      const base = q('#k_imgmsg').textContent; q('#k_imgmsg').textContent = base + ' Analizando la imagen con IA para sugerir nombre, rol y colores…';
      try {
        const r = await App.CharImage.analyze(blob, mod); if (!document.body.contains(cv)) return;
        const setv = (sel, v, ok = x => x) => { if (v && ok(v)) q(sel).value = v; };
        const isHex = v => /^#[0-9a-f]{6}$/i.test(v);
        if (q('#k_name').value === 'NUEVO' && r.nombre) q('#k_name').value = String(r.nombre).toUpperCase().slice(0, 18);
        if (!q('#k_role').value && r.rol) q('#k_role').value = r.rol; if (!q('#k_pers').value && r.personalidad) q('#k_pers').value = r.personalidad;
        setv('#k_body', r.cuerpo, v => ['m', 'f'].includes(v)); setv('#k_skin', r.piel, isHex); setv('#k_hair', r.pelo, v => ['short', 'fade', 'curly', 'long', 'bun', 'ponytail', 'bald'].includes(v)); setv('#k_hc', r.color_pelo, isHex); setv('#k_tc', r.color_prenda, isHex); setv('#k_pc', r.color_pantalon, isHex); setv('#k_sc', r.color_zapatos, isHex);
        const f = {frente: 'front', derecha: 'right', izquierda: 'left'}[r.mira_hacia]; if (f) q('#k_faces').value = f;
        q('#k_imgmsg').innerHTML = esc(base) + ' La IA sugirió nombre, rol y colores; cámbialos si quieres.' + (r.conocido ? `<div class="note" style="margin-top:6px"><b>Ojo con los derechos:</b> ${esc(r.aviso || 'parece un personaje existente de otra marca o canal.')} Úsalo solo si es tuyo o tienes permiso.</div>` : '');
      } catch (e) { q('#k_imgmsg').textContent = base + ' ' + (e.userMsg || 'La IA no pudo analizarla; los colores del doble se detectaron automáticamente.'); }
    };
    L.poses = L.poses || {};
    const drawPoses = () => { const lbl = {...A.ACT_LABEL, ...Object.fromEntries(A.moveList.map(m => [m.id, m.label]))}; q('#k_plist').innerHTML = Object.keys(L.poses).map(k => `<button class="chip" data-prm="${k}" title="Quitar">${esc(lbl[k] || k)} ✕</button>`).join('') || '<span class="small mute">Sin imágenes extra: se usan las animaciones automáticas.</span>'; el.querySelectorAll('[data-prm]').forEach(b => b.onclick = () => { const pz = L.poses[b.dataset.prm]; if (pz && pz.assetId) dropAssets.push(pz.assetId); delete L.poses[b.dataset.prm]; drawPoses(); }); };
    drawPoses();
    q('#k_padd').onclick = () => q('#k_pfile').click();
    q('#k_pfile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; UI.busy(q('#k_padd'), async () => { const {img: pi} = await takeImage(f, q('#k_rmbg').checked); L.poses[q('#k_pact').value] = pi; drawPoses(); UI.toast('Imagen añadida para esa acción.'); }, 'Procesando…'); };
    q('#k_pick').onclick = () => q('#k_file').click();
    q('#k_file').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; UI.busy(q('#k_pick'), async () => {
      const {res, img: ni} = await takeImage(f, q('#k_rmbg').checked);
      Object.entries(res.palette).forEach(([k, v]) => { const sel = {skin: '#k_skin', hairColor: '#k_hc', topColor: '#k_tc', pants: '#k_pc', shoes: '#k_sc'}[k]; if (sel) q(sel).value = v; });
      setImg({...ni, faces: q('#k_faces').value}, App.CharImage.bgNote(res.bg) + (ni.local ? ' Guardada dentro del personaje (versión reducida).' : ' Guardada en tu nube gratuita.'));
      fillFromAI(res.blob);
    }, 'Procesando imagen…'); };
    const noimg = q('#k_noimg'); if (noimg) noimg.onclick = () => { setImg(null, 'Imagen quitada. El personaje usará el estilo dibujado.'); noimg.remove(); };
    if (pre) { q('#k_imgmsg').textContent = App.CharImage.bgNote(pre.res.bg) + (pre.img.local ? ' Guardada dentro del personaje (versión reducida).' : ' Guardada en tu nube gratuita.'); fillFromAI(pre.res.blob); }
    q('#k_test').onclick = e => UI.busy(e.currentTarget, () => Voice.speak('Hola, así suena mi voz en los videos.', read().voice), 'Hablando…');
    q('#k_ok').onclick = async () => {
      const n = read(); if (!n.look.img) delete n.look.img;
      if (JSON.stringify(n).length > 150000) return UI.toast('La imagen es demasiado grande para guardarla dentro del personaje. Ábrelo en claude.ai para usar la nube gratuita.', 'bad');
      const i = list.findIndex(x => x.id === n.id); if (i >= 0) list[i] = n; else list.push(n);
      await Lib.saveChars(list);
      if (origAsset && (!n.look.img || n.look.img.assetId !== origAsset)) Files.remove(origAsset);
      dropAssets.filter(id => !n.look.img || n.look.img.assetId !== id).forEach(id => Files.remove(id));
      close(); draw(); UI.toast('Personaje guardado. Se usará igual en todos los videos.');
    };
    const del = q('#k_del'); if (del) del.onclick = async () => { if (!(await UI.confirm('¿Eliminar este personaje?', 'Eliminar'))) return; list = list.filter(x => x.id !== c.id); await Lib.saveChars(list); if (origAsset) Files.remove(origAsset); close(); draw(); };
    const rs = q('#k_reset'); if (rs) rs.onclick = async () => { const d = A.defaultCharacters.find(x => x.id === c.id); const i = list.findIndex(x => x.id === c.id); list[i] = clone(d); await Lib.saveChars(list); if (origAsset) Files.remove(origAsset); close(); draw(); };
    // cancelar: las imágenes subidas que no se guardaron se borran de la nube
    el.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { dropAssets.concat(img && img.assetId && img.assetId !== origAsset ? [img.assetId] : []).forEach(id => Files.remove(id)); }));
  };
  $('#newC').onclick = () => edit(null);
  $('#newImg').onclick = () => $('#imgPick').click();
  $('#imgPick').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; UI.busy($('#newImg'), async () => { const {res, img} = await takeImage(f, true); edit(null, {res, img: {...img, faces: 'front'}, palette: res.palette}); }, 'Procesando imagen…'); };
  draw();
};

App.videosView = async (main, mod) => {
  const ps = await Projects.list(mod);
  main.innerHTML = App.head(mod === 'fin' ? 'Finanzas' : 'Gym', 'Videos', 'Todos tus proyectos, guardados en la nube. Ábrelos para continuar donde los dejaste.', `<button class="btn primary" id="nv">${icon('plus')}Nuevo video</button>`) +
    (ps.length ? `<div class="grid gauto">${ps.map(p => { const [st, cls] = Projects.status(p); return `<div class="card stack">${p.render && p.render.assetId ? `<video src="${Files.url(p.render.assetId)}" preload="metadata" controls playsinline style="width:100%;max-height:300px;background:#000;border-radius:10px"></video>` : p.thumb && p.thumb.assetId ? `<img src="${Files.url(p.thumb.assetId)}" alt="" style="width:100%;border-radius:10px">` : '<div class="empty">Sin render guardado</div>'}
      <div class="row between"><span class="tag ${cls}">${st}</span><span class="small">${fmtDate(p.updatedAt)}</span></div><h3 style="margin:0">${esc(p.title || p.idea || 'Sin título')}</h3>
      <div class="small">${fmtDur(p.duration)} · ${p.format === 'vertical' ? '9:16' : '16:9'}${p.render ? ' · ' + fmtBytes(p.render.size) + (p.render.cloud ? ' en la nube' : ' (no guardado en la nube)') : ''}</div>
      <div class="row"><button class="btn sm primary" data-open="${p.id}">Abrir</button><button class="btn sm danger" data-del="${p.id}">${icon('trash')}Borrar</button></div></div>`; }).join('')}</div>` : `<div class="empty">Todavía no hay videos. Pulsa “Nuevo video”.</div>`);
  $('#nv').onclick = () => { App.state.newProject = {module: mod, init: {}}; App.go(mod + '-crear'); };
  $$('[data-open]').forEach(b => b.onclick = () => App.openProject(mod, b.dataset.open));
  $$('[data-del]').forEach(b => b.onclick = async () => { const p = ps.find(x => x.id === b.dataset.del); if (!(await UI.confirm('¿Borrar este proyecto y sus archivos en la nube?', 'Borrar'))) return; if (p.render && p.render.assetId) await Files.remove(p.render.assetId); if (p.thumb && p.thumb.assetId) await Files.remove(p.thumb.assetId); await Projects.remove(p); App.route(); });
};
const $ = App.util.$, $$ = App.util.$$;
})();
