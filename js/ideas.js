'use strict';
/* ============ Ideas de videos: del día, por tema y a partir de tus videos ============
   Funciona sin IA (banco de temas + ángulos probados) y, cuando la IA de Claude está disponible, puede pedirle ideas nuevas. */
(() => {
const {esc, $, $$} = App.util;
const {UI, AI, Store, icon} = App;

/* temas concretos por categoría de finanzas (frases que encajan en los títulos) */
const FIN_TOPICS = {
  'Finanzas personales': ['el sueldo que no alcanza', 'los gastos hormiga', 'la regla 50/30/20', 'vivir por debajo de tus ingresos', 'el dinero que se va en delivery', 'las suscripciones que olvidaste', 'pagarte a ti primero', 'el orden de tus prioridades financieras'],
  'Ahorro y presupuestos': ['el fondo de emergencia', 'un presupuesto en papel', 'el método de los sobres', 'ahorrar con un sueldo bajo', 'el reto de ahorro de 52 semanas', 'ahorrar para una meta concreta', 'el presupuesto base cero', 'las compras del supermercado'],
  'Administración del dinero': ['separar el dinero del negocio y el personal', 'el control de gastos semanal', 'las cuentas por pagar', 'organizar el dinero de la quincena', 'el dinero en efectivo vs la tarjeta', 'revisar tu estado de cuenta', 'los pagos automáticos', 'el dinero compartido en pareja'],
  'Cómo comenzar negocios': ['validar una idea con poco dinero', 'el primer cliente', 'poner precio a tu producto', 'calcular el punto de equilibrio', 'vender antes de producir', 'un negocio desde la casa', 'los costos ocultos de emprender', 'el plan de negocio de una página'],
  'Dropshipping': ['elegir un producto ganador', 'los tiempos de envío', 'las devoluciones en dropshipping', 'calcular el margen real', 'los proveedores poco confiables', 'los anuncios que no venden', 'una tienda que inspire confianza', 'los riesgos del dropshipping'],
  'E-commerce': ['las fotos de producto con el celular', 'la descripción que vende', 'el carrito abandonado', 'los métodos de pago', 'el costo de envío', 'las reseñas de clientes', 'vender por WhatsApp', 'el inventario'],
  'Trading y sus riesgos': ['el apalancamiento', 'el stop loss', 'el trading con dinero prestado', 'las señales de trading pagadas', 'la diferencia entre invertir y especular', 'las cuentas demo', 'la psicología de las pérdidas', 'las promesas de ganancias rápidas'],
  'Inversiones básicas': ['el interés compuesto', 'la diversificación', 'el riesgo y la rentabilidad', 'los certificados financieros', 'invertir poco a poco', 'el horizonte de inversión', 'la inflación', 'los fondos de inversión'],
  'Ingresos activos y pasivos': ['el ingreso pasivo de verdad', 'vender tu tiempo', 'los productos digitales', 'alquilar lo que no usas', 'un segundo ingreso', 'escalar un servicio', 'las regalías', 'el trabajo extra los fines de semana'],
  'Marketing digital': ['el cliente ideal', 'el contenido que vende sin vender', 'los anuncios con poco presupuesto', 'la marca personal', 'el embudo de ventas', 'el correo a clientes', 'las métricas que importan', 'los testimonios'],
  'Canales faceless': ['un canal sin mostrar la cara', 'elegir el nicho', 'la constancia al publicar', 'las miniaturas que llaman la atención', 'el guion que retiene', 'los primeros 1.000 suscriptores', 'la monetización de un canal', 'las ideas que no se acaban'],
  'IA aplicada a los negocios': ['la IA para responder clientes', 'la IA para escribir anuncios', 'automatizar tareas repetitivas', 'la IA para analizar ventas', 'los errores al usar IA', 'la IA para crear contenido', 'los datos de tus clientes y la IA', 'la IA como asistente'],
  'Errores financieros': ['comprar a crédito por impulso', 'prestar dinero a amigos', 'no tener seguro', 'pagar solo el mínimo de la tarjeta', 'gastar el aumento de sueldo', 'firmar como garante', 'no leer el contrato', 'endeudarse para aparentar'],
  'Mentalidad emprendedora': ['el miedo a empezar', 'aprender del fracaso', 'la disciplina sobre la motivación', 'compararte con otros', 'la paciencia con los resultados', 'decir que no', 'el tiempo como recurso', 'pedir ayuda'],
  'Comparación de modelos de negocio': ['vender productos o servicios', 'el negocio físico o el online', 'la franquicia o el negocio propio', 'el colmado o la tienda online', 'trabajar solo o con socios', 'el dropshipping o tener inventario', 'la suscripción o el pago único', 'el freelance o el empleo']
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
/* ángulos de finanzas: cada uno da título, gancho, enfoque y formato */
const FIN_ANGLES = [
  {f: 'Error común', t: x => `${cap(x)}: el error que casi todos cometen`, g: x => `Si haces esto con ${x}, lo estás haciendo al revés.`, a: 'ALEX comete el error típico; MARCUS explica por qué pasa y cómo evitarlo.', why: 'Ver a alguien equivocarse genera identificación.'},
  {f: 'Mito vs realidad', t: x => `${cap(x)}: mito vs realidad`, g: x => `¿Es verdad todo lo que te dijeron sobre ${x}?`, a: 'Tres creencias populares y qué es cierto en cada una, sin cifras inventadas.', why: 'La curiosidad por la verdad retiene hasta el final.'},
  {f: 'Paso a paso', t: x => `${cap(x)}: explicación fácil, paso a paso`, g: x => `Nadie me explicó ${x} así de simple.`, a: 'NICO aprende en 3 pasos claros, cada uno con un objeto animado.', why: 'Promesa concreta de aprender algo útil rápido.'},
  {f: 'Historia', t: x => `La historia de ALEX y ${x}`, g: () => 'ALEX pensaba que lo tenía todo bajo control…', a: 'Una historia corta con problema, giro y lección práctica al final.', why: 'Las historias se recuerdan mejor que los consejos.'},
  {f: 'Números de ejemplo', t: x => `${cap(x)}: las cuentas con un ejemplo`, g: () => 'Hagamos las cuentas con un ejemplo sencillo.', cats: ['Finanzas personales', 'Ahorro y presupuestos', 'Administración del dinero', 'Cómo comenzar negocios', 'Dropshipping', 'E-commerce', 'Trading y sus riesgos', 'Inversiones básicas', 'Ingresos activos y pasivos', 'Errores financieros'], a: 'Un ejemplo hipotético con números redondos (y dicho como ejemplo) para ver el efecto.', why: 'Ver las cuentas convence más que la teoría.'},
  {f: 'Lo que nadie dice', t: x => `Lo que nadie te explica sobre ${x}`, g: x => `Hay algo sobre ${x} que casi nadie menciona.`, a: 'El detalle poco conocido, por qué importa y qué hacer con él.', why: 'Promete información que el espectador no tiene.'},
  {f: 'Preguntas', t: x => `3 preguntas antes de decidir sobre ${x}`, g: () => 'Antes de decidir, hazte estas tres preguntas.', a: 'Tres preguntas que ordenan la decisión, con un ejemplo cotidiano.', why: 'Formato práctico que la gente guarda para después.'},
  {f: 'Checklist', t: x => `Checklist rápido: ${x}`, g: () => 'Si cumples estos puntos, vas bien.', a: 'Lista de 4 o 5 puntos que el espectador puede revisar en su vida.', why: 'Es fácil de guardar y compartir.'}
];
/* ángulos de gym a partir de las fichas de la biblioteca */
const GYM_ANGLES = [
  {f: 'Video explicativo', t: m => `${m.n}: qué es y para quién sirve`, g: m => `Casi nadie te explica bien ${m.n.toLowerCase()}.`, a: () => 'VOLT lo explica a cámara y lo demuestra en 3D: cómo se hace, para quién sirve y precauciones.', why: 'Resuelve una duda concreta con demostración.'},
  {f: 'Mito vs evidencia', t: m => `${m.n}: ¿qué dice la evidencia?`, g: () => '¿Funciona de verdad o solo es popular?', a: m => `Separa popularidad de efectividad (evidencia: ${m.ev}).`, why: 'La curiosidad por la verdad retiene hasta el final.'},
  {f: 'Errores comunes', t: m => `${m.n}: 3 errores comunes`, g: () => 'Si haces esto, pierdes el beneficio.', a: () => 'Versión incorrecta y corregida en 3D, con alternativas para principiantes.', why: 'Formato de lista claro y práctico.'},
  {f: 'Video de curiosidades', t: m => `El método poco conocido: ${m.n}`, g: () => 'Pocos entrenan así, y tiene su lógica.', a: m => `Origen, cómo funciona y por qué casi nadie lo usa (${m.kl}).`, why: 'La novedad despierta curiosidad.', only: m => ['P', 'M', 'X'].includes(m.k)},
  {f: 'Short', t: m => `${m.n} en 30 segundos`, g: () => 'Te lo explico en 30 segundos.', a: () => 'Lo esencial: qué es, un consejo de técnica y una precaución.', why: 'Formato corto fácil de terminar y compartir.', dur: 30},
  {f: 'Video comparativo', t: (m, o) => `${m.n} vs ${o.n}`, g: () => '¿Cuál te conviene más?', a: (m, o) => `Comparación lado a lado con tier list: objetivo, dificultad y riesgo de ${m.n} y ${o.n}.`, why: 'Las comparaciones ayudan a decidir.', pair: true},
  {f: 'Animación anatómica', t: m => `¿Qué músculos trabaja? ${m.n}`, g: () => 'Mira qué se activa en cada repetición.', a: () => 'Demostración 3D con los músculos resaltados en rojo.', why: 'Lo visual explica mejor que las palabras.', only: m => ['A', 'B', 'C', 'E'].includes(m.c)}
];

/* números pseudoaleatorios repetibles (las ideas del día no cambian al recargar) */
const seeded = seed => { let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const today = () => new Date().toLocaleDateString('en-CA');
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const Ideas = App.Ideas = {
  finTopics: FIN_TOPICS,
  /* una idea de finanzas */
  fin(cat, topic, angle) { return {titulo: angle.t(topic), gancho: angle.g(topic), angulo: angle.a, formato: angle.f, por_que: angle.why, cat, dur: angle.f === 'Historia' || angle.f === 'Números de ejemplo' ? 60 : 30, src: 'sin IA'}; },
  gym(m, angle, other) { return {titulo: angle.t(m, other), gancho: angle.g(m), angulo: angle.a(m, other) + (m.sup ? ' Incluye que requiere supervisión.' : ''), formato: angle.f, por_que: angle.why, cat: m.cat, methodId: m.id, dur: angle.dur || (angle.f === 'Video tipo documental' ? 300 : 60), src: 'sin IA'}; },
  /* genera n ideas variadas; opts: cat (finanzas), catKey (gym), methodId, seed, exclude (títulos ya usados) */
  generate(mod, n = 6, opts = {}) {
    const rnd = seeded(opts.seed || Math.random()); const pick = a => a[Math.floor(rnd() * a.length)];
    const used = new Set((opts.exclude || []).map(norm)); const out = []; const seen = new Set();
    for (let tries = 0; out.length < n && tries < n * 30; tries++) {
      let idea;
      if (mod === 'fin') {
        const cat = opts.cat || pick(Object.keys(FIN_TOPICS)); const topic = pick(FIN_TOPICS[cat] || FIN_TOPICS['Finanzas personales']);
        const hint = opts.hint ? opts.hint.trim() : '';
        idea = Ideas.fin(cat, topic, pick(FIN_ANGLES.filter(a => !a.cats || a.cats.includes(cat)))); if (hint) idea.angulo += ' Enfoque: ' + hint + '.';
        idea.key = topic;
      } else {
        const G = App.Gym; if (!G) return [];
        let pool = G.all(); if (opts.methodId) pool = pool.filter(m => m.id === opts.methodId); else if (opts.catKey) pool = pool.filter(m => m.c === opts.catKey);
        if (!pool.length) return [];
        const m = pick(pool); const angles = GYM_ANGLES.filter(a => !a.only || a.only(m)); const a = pick(angles);
        let other = null; if (a.pair) { const sib = G.all().filter(x => x.c === m.c && x.id !== m.id); if (!sib.length) continue; other = pick(sib); }
        idea = Ideas.gym(m, a, other); idea.key = m.id + (other ? '+' + other.id : '');
        if (opts.hint) idea.angulo += ' Enfoque: ' + opts.hint.trim() + '.';
      }
      const k = norm(idea.titulo); if (seen.has(k) || used.has(k) || seen.has(idea.key + idea.formato)) continue;
      seen.add(k); seen.add(idea.key + idea.formato); out.push(idea);
    }
    return out;
  },
  /* ideas del día: fijas durante el día; "otras" avanza la semilla */
  daily(mod, n, shift = 0, exclude) { return Ideas.generate(mod, n, {seed: today() + mod + shift, exclude}); },
  /* continuaciones y series basadas en tus proyectos */
  fromProjects(mod, ps) {
    const out = []; const done = ps.filter(p => p.title || p.idea).slice(0, 8);
    done.forEach(p => {
      const base = (p.title || p.idea).replace(/\s+/g, ' ').trim(); const short = base.split(/[:.¿?]/).filter(Boolean)[0].trim().slice(0, 70);
      const m = p.methodId && App.Gym && App.Gym.byId(p.methodId);
      const extra = {cat: p.category || (m && m.cat) || '', methodId: p.methodId, from: base, src: 'tus videos'};
      out.push({...extra, titulo: `${short}: parte 2`, gancho: 'En el video anterior te conté lo básico; ahora vamos más profundo.', angulo: 'Continúa el video anterior con el siguiente paso, un caso práctico y las dudas más comunes.', formato: 'Serie', por_que: 'Quien vio la parte 1 tiene motivo para ver la 2.', dur: p.duration || 60});
      out.push({...extra, titulo: `Preguntas frecuentes sobre ${short.toLowerCase()}`, gancho: 'Estas son las dudas que más salen sobre este tema.', angulo: 'Responde 4 o 5 dudas típicas del tema, una por escena, con respuestas cortas y honestas.', formato: 'Preguntas y respuestas', por_que: 'Aprovecha un tema que ya trabajaste y resuelve dudas reales.', dur: 60});
      if ((p.duration || 0) >= 150) out.push({...extra, titulo: `${short} en 30 segundos`, gancho: 'Lo más importante, en medio minuto.', angulo: 'Versión Short del video largo con la idea principal y una invitación a ver el completo.', formato: 'Short', por_que: 'Los Shorts llevan público al video largo.', dur: 30});
      else out.push({...extra, titulo: `${short}: la guía completa`, gancho: 'Te lo explico todo, de principio a fin.', angulo: 'Versión larga por capítulos (horizontal) que amplía el video corto con ejemplos.', formato: 'Video largo', por_que: 'Un tema que ya funcionó en corto puede dar para un video largo.', dur: 480, format: 'horizontal'});
      if (m && App.Gym) { const sib = App.Gym.all().filter(x => x.c === m.c && x.id !== m.id); if (sib.length) { const o = sib[(base.length + out.length) % sib.length]; out.push({...Ideas.gym(m, GYM_ANGLES.find(a => a.pair), o), from: base, src: 'tus videos'}); } }
      else if (mod === 'fin') { out.push({...extra, titulo: `El error más común con ${short.toLowerCase()}`, gancho: 'Casi todos fallan en lo mismo.', angulo: 'ALEX comete el error del tema anterior y MARCUS lo corrige.', formato: 'Error común', por_que: 'Mismo tema, enfoque nuevo y muy compartible.', dur: 30}); }
    });
    return out;
  },
  async withAI(mod, {cat, hint, n = 6, projects} = {}) {
    const ctx = mod === 'fin' ? 'educación financiera, emprendimiento y negocios para principiantes hispanohablantes (por ejemplo, en República Dominicana)' : 'entrenamiento físico con rigor científico para público hispanohablante amplio, principiantes incluidos';
    const r = await AI.json(`Propón ${n} ideas ORIGINALES de videos para un canal faceless de ${ctx}.
${cat ? 'Tema o categoría: ' + cat + '.' : 'Variedad de temas.'}${hint ? ' Enfoque pedido: ' + hint + '.' : ''}${projects && projects.length ? '\nVideos que el canal ya hizo (no los repitas; propone continuaciones, series o enfoques nuevos):\n- ' + projects.slice(0, 12).join('\n- ') : ''}
Varía el formato (error común, mito vs realidad, paso a paso, historia, comparación, preguntas, short, video largo). Sin promesas de dinero fácil${mod === 'gym' ? ' ni métodos extremos para principiantes' : ''}; no inventes estadísticas ni copies videos existentes.
Formato: {"ideas":[{"titulo":"","gancho":"frase inicial de máximo 15 palabras","angulo":"1-2 frases","formato":"","por_que":"1 frase","duracion_seg":60}]}`, {label: 'Ideas de video', tier: 'quick'});
    return (r.ideas || []).slice(0, n).map(x => ({titulo: x.titulo, gancho: x.gancho, angulo: x.angulo, formato: x.formato, por_que: x.por_que, cat: cat || '', dur: Math.max(10, Math.min(1800, +x.duracion_seg || 60)), src: 'IA'}));
  },
  /* convierte una idea en un proyecto nuevo y abre el flujo de producción */
  produce(mod, x) {
    App.state.newProject = {module: mod, init: {idea: `${x.titulo}. ${x.angulo || ''}`.trim(), category: x.cat || (mod === 'fin' ? App.FIN_CATS[0] : ''), duration: x.dur || 60, ...(x.format ? {format: x.format} : {}), ...(x.methodId ? {methodId: x.methodId, formatHint: x.formato} : {}), ...(mod === 'gym' ? {cast: ['volt']} : {})}};
    App.go(mod + '-crear');
  },
  async save(mod, x) { const key = 'ideas_' + mod; const bank = await Store.get(key) || {type: 'ideas', list: []}; if (!bank.list.some(y => y.titulo === x.titulo)) bank.list.unshift({titulo: x.titulo, angulo: x.angulo, cat: x.cat, dur: x.dur, methodId: x.methodId, formato: x.formato}); await Store.set(key, bank); }
};

/* ---------- panel de ideas (pantalla de inicio de cada estudio) ---------- */
App.ideasPanel = async (host, mod) => {
  const ps = await App.Projects.list(mod); const usedTitles = ps.map(p => p.title || p.idea);
  let tab = 'hoy', shift = 0, list = [], note = '';
  const G = App.Gym;
  const topicSel = mod === 'fin' ? `<select id="ipCat" style="width:auto" aria-label="Tema">${App.FIN_CATS.map(c => `<option>${esc(c)}</option>`).join('')}</select>`
    : `<select id="ipCat" style="width:auto" aria-label="Categoría">${G.CATS.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select><select id="ipMet" style="width:auto;max-width:260px" aria-label="Método"><option value="">Cualquier método</option></select>`;
  host.innerHTML = `<div class="card stack"><div class="row between"><h3 style="margin:0">${icon('bulb')} Ideas de videos</h3><div class="chips" role="tablist">${[['hoy', 'Ideas de hoy'], ['tema', 'Por tema'], ['mios', 'De mis videos']].map(([k, l]) => `<button class="chip" role="tab" data-tab="${k}" aria-pressed="${k === tab}">${l}</button>`).join('')}</div></div>
    <div id="ipCtl"></div><div class="small mute" id="ipNote"></div><div class="grid g3" id="ipList"></div></div>`;
  const ctl = () => {
    const c = $('#ipCtl', host);
    if (tab === 'hoy') c.innerHTML = `<div class="row"><span class="small">Ideas nuevas cada día, listas para producir con un clic.</span><button class="btn sm" id="ipMore">${icon('refresh')}Otras ideas</button>${AI.available() ? `<button class="btn sm" id="ipAI">${icon('spark')}Ideas frescas con IA</button>` : ''}</div>`;
    else if (tab === 'tema') c.innerHTML = `<div class="row">${topicSel}<input id="ipHint" placeholder="Enfoque opcional (ej.: para estudiantes, con poco dinero…)" style="flex:1;min-width:180px"><button class="btn primary sm" id="ipGo">${icon('spark')}Dame ideas</button>${AI.available() ? '<label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="ipUseAI" checked> Usar IA</label>' : ''}</div>`;
    else c.innerHTML = `<div class="row"><span class="small">${ps.length ? `Continuaciones, series y versiones basadas en tus ${ps.length} video(s).` : 'Cuando hagas videos, aquí aparecerán continuaciones y series basadas en ellos.'}</span>${ps.length && AI.available() ? `<button class="btn sm" id="ipMineAI">${icon('spark')}Más con IA</button>` : ''}</div>`;
    bind();
  };
  const draw = () => {
    $('#ipNote', host).textContent = note;
    $('#ipList', host).innerHTML = list.length ? list.map((x, i) => `<div class="card stack" style="background:var(--bg)"><div class="row between"><span class="tag">${esc(x.formato || 'Idea')}</span><span class="small">${App.fmtDur(x.dur || 60)}${x.src ? ' · ' + esc(x.src) : ''}</span></div>
      <b style="font-size:16px">${esc(x.titulo)}</b>${x.gancho ? `<div class="small">“${esc(x.gancho)}”</div>` : ''}<div class="small mute">${esc(x.angulo || '')}</div>${x.from ? `<div class="small mute">Basada en: ${esc(x.from.slice(0, 60))}</div>` : x.cat ? `<div class="small mute">${esc(x.cat)}</div>` : ''}
      <div class="row"><button class="btn sm primary" data-ip-make="${i}">${icon('film')}Crear video</button><button class="btn sm" data-ip-save="${i}">${icon('check')}Guardar</button></div></div>`).join('') : `<div class="empty" style="grid-column:1/-1">${tab === 'mios' ? 'Aún no hay videos para basarse.' : 'Sin ideas todavía.'}</div>`;
    $$('[data-ip-make]', host).forEach(b => b.onclick = () => Ideas.produce(mod, list[+b.dataset.ipMake]));
    $$('[data-ip-save]', host).forEach(b => b.onclick = async () => { await Ideas.save(mod, list[+b.dataset.ipSave]); b.innerHTML = icon('check') + 'Guardada'; b.disabled = true; UI.toast(`Idea guardada en tu banco de ideas${mod === 'fin' ? ' (sección Ideas)' : ''}.`); });
  };
  const load = async () => {
    note = '';
    if (tab === 'hoy') {
      const cached = shift === 0 && await Store.get('ideas_today_' + mod);
      list = cached && cached.day === today() && cached.list && cached.list.length ? cached.list : Ideas.daily(mod, 6, shift, usedTitles);
      note = cached && cached.day === today() && cached.ai && shift === 0 ? 'Ideas de hoy generadas con IA.' : '';
    } else if (tab === 'tema') list = [];
    else list = Ideas.fromProjects(mod, ps).slice(0, 9);
    draw();
  };
  function bind() {
    const more = $('#ipMore', host); if (more) more.onclick = () => { shift++; list = Ideas.daily(mod, 6, shift, usedTitles); note = ''; draw(); };
    const ai = $('#ipAI', host); if (ai) ai.onclick = () => UI.busy(ai, async () => { const r = await Ideas.withAI(mod, {n: 6, projects: usedTitles}); if (r.length) { list = r; note = 'Ideas de hoy generadas con IA.'; await Store.set('ideas_today_' + mod, {type: 'ideas_today', day: today(), list: r, ai: true}); draw(); } }, 'Pensando…');
    const met = $('#ipMet', host), catSel = $('#ipCat', host);
    const fillMet = () => { if (!met) return; met.innerHTML = '<option value="">Cualquier método</option>' + G.all().filter(m => m.c === catSel.value).map(m => `<option value="${m.id}">${esc(m.n)}</option>`).join(''); };
    if (met) { fillMet(); catSel.onchange = fillMet; }
    const go = $('#ipGo', host); if (go) go.onclick = () => UI.busy(go, async () => {
      const hint = $('#ipHint', host).value.trim(); const useAI = $('#ipUseAI', host) && $('#ipUseAI', host).checked;
      const label = mod === 'fin' ? catSel.value : (met && met.value ? G.byId(met.value).n : catSel.options[catSel.selectedIndex].text);
      if (useAI) { try { list = await Ideas.withAI(mod, {cat: label, hint, n: 6, projects: usedTitles}); note = 'Ideas generadas con IA.'; draw(); return; } catch (e) { note = (e.userMsg || 'La IA no respondió') + ' Te muestro ideas sin IA.'; } }
      list = mod === 'fin' ? Ideas.generate('fin', 6, {cat: catSel.value, hint, exclude: usedTitles}) : Ideas.generate('gym', 6, {catKey: catSel.value, methodId: met.value || undefined, hint, exclude: usedTitles});
      draw();
    }, 'Pensando…');
    const mai = $('#ipMineAI', host); if (mai) mai.onclick = () => UI.busy(mai, async () => { const r = await Ideas.withAI(mod, {n: 6, projects: usedTitles}); list = r.map(x => ({...x, src: 'IA · tus videos'})).concat(list).slice(0, 12); note = 'La IA propuso continuaciones a partir de tus videos.'; draw(); }, 'Pensando…');
  }
  $$('[data-tab]', host).forEach(b => b.onclick = () => { tab = b.dataset.tab; shift = 0; $$('[data-tab]', host).forEach(x => x.setAttribute('aria-pressed', x === b)); ctl(); load(); });
  ctl(); load();
};
})();
