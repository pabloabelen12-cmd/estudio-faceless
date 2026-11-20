'use strict';
/* ============ Núcleo: utilidades, servicios en la nube, IA, voces, almacén, router ============ */
const App = window.App = {views:{}, state:{}};
/* versión de escritorio (programa en tu laptop): js/desktop.js define window.EFS_DESKTOP */
App.DESKTOP = window.EFS_DESKTOP || null;
/* por ahora todo en 2D y solo con los personajes del usuario y los stickman */
App.NO3D = true;
App.HIDDEN_CHARS = ['nico', 'marcus', 'alex', 'lia', 'nexo', 'volt', 'kora'];
App.charIn = (c, mod) => c.module === 'both' || (App.Art && App.Art.isImage(c)) || (mod === 'gym' ? c.module === 'gym' : c.module !== 'gym');
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clone = o => JSON.parse(JSON.stringify(o ?? null));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtDate = t => t ? new Date(t).toLocaleString('es-DO', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'}) : '—';
const monthKey = () => new Date().toISOString().slice(0, 7);
const fmtBytes = b => b == null ? '—' : b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.round(b / 1024) + ' KB';
App.util = {$, $$, esc, uid, sleep, clone, clamp, fmtDate, fmtBytes};

/* ---------- iconos (trazos propios) ---------- */
const ICONS = {
  dash:'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z', plus:'M12 5v14M5 12h14', bulb:'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z',
  search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4', users:'M16 19c0-2.2-1.8-4-4-4H7c-2.2 0-4 1.8-4 4M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 19c0-2-1.3-3.6-3-3.9M15.5 4.2a3.5 3.5 0 0 1 0 6.6',
  doc:'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6', film:'M4 5h16v14H4zM4 9h16M4 15h16M8 5v4M16 5v4M8 15v4M16 15v4', image:'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 8.5h.01',
  tag:'M3 12V4h8l9 9-8 8zM7.5 7.5h.01', coin:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM14.5 9.5c-.5-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2-.5-2.5-1.5M12 6.5v11',
  gear:'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.7 3.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3z',
  chart:'M4 20V4M4 20h16M8 16l4-5 3 3 5-7', dumbbell:'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12', book:'M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4zM5 16a4 4 0 0 1 4-4h10',
  compare:'M8 4v16M16 4v16M4 8h4M16 16h4M4 16h4M16 8h4', compass:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z', shield:'M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z M9 12l2 2 4-4',
  spark:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z', play:'M7 4l13 8-13 8z', stop:'M6 6h12v12H6z',
  download:'M12 4v11M7 10l5 5 5-5M5 20h14', trash:'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13', copy:'M8 8h12v12H8zM4 16V4h12', edit:'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  check:'M5 12l5 5 9-10', x:'M6 6l12 12M18 6L6 18', refresh:'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7', mic:'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  wand:'M4 20L16 8M14 4v3M18 8h3M17.5 4.5l-2 2M19 12l-1.5-1.5', link:'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  upload:'M12 20V9M7 14l5-5 5 5M5 4h14', home:'M4 11l8-7 8 7v9H4z M10 20v-5h4v5', flask:'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3'
};
const icon = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[n] || ICONS.dash}"/></svg>`;
App.icon = icon;

/* ---------- capacidades de la plataforma (todas gratuitas para ti) ---------- */
const Caps = App.Caps = {sample:null, tts:null, db:null, user:null, assets:null, downloads:null, uid:null, ready:false, images:false};
App.capsReady = (async () => {
  const c = window.claude;
  if (!c || typeof c.use !== 'function') { Caps.ready = true; return Caps; }
  const names = ['sample', 'tts', 'db', 'user', 'assets', 'downloads'];
  const got = await Promise.all(names.map(n => Promise.resolve().then(() => c.use(n)).catch(() => null)));
  names.forEach((n, i) => Caps[n] = got[i] || null);
  if (Caps.user) { try { Caps.uid = await Caps.user.id(); } catch { Caps.uid = null; } }
  if (Caps.sample && Caps.sample.limits) { try { Caps.images = !!(await Caps.sample.limits()).images; } catch {} }
  Caps.ready = true;
  return Caps;
})();

/* ---------- UI: avisos, modales ---------- */
const UI = App.UI = {
  toast(msg, type = '', ms = 5200) {
    const t = document.createElement('div'); t.className = 'toast ' + type; t.innerHTML = msg;
    $('#toasts').appendChild(t); setTimeout(() => t.remove(), ms);
  },
  modal(html, {wide = false} = {}) {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="card" role="dialog" aria-modal="true" style="${wide ? 'width:min(1000px,100%)' : ''}">${html}</div>`;
    const close = () => { m.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(m); return {el: m.firstElementChild, close};
  },
  confirm(text, okLabel = 'Confirmar') {
    return new Promise(res => {
      const {el, close} = UI.modal(`<h3>${esc(text)}</h3><div class="row end" style="margin-top:14px"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-ok>${esc(okLabel)}</button></div>`);
      el.querySelector('[data-ok]').onclick = () => { close(); res(true); };
      el.closest('.modal').addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target.classList.contains('modal')) res(false); });
    });
  },
  /* ejecuta una acción mostrando estado ocupado en el botón */
  async busy(btn, fn, label = 'Trabajando…') {
    if (!btn) return fn();
    if (btn.dataset.busy) return;
    const old = btn.innerHTML; btn.dataset.busy = 1; btn.disabled = true;
    btn.innerHTML = `<i class="spin"></i>${esc(label)}`;
    try { return await fn(); }
    catch (e) { UI.error(e); }
    finally { btn.innerHTML = old; btn.disabled = false; delete btn.dataset.busy; }
  },
  error(e) {
    console.error(e);
    const msg = e && (e.userMsg || e.message) || 'Algo salió mal.';
    UI.toast(esc(msg), 'bad', 8000);
  },
  copy(text) {
    navigator.clipboard.writeText(text).then(() => UI.toast('Copiado al portapapeles.'), () => {
      const {el} = UI.modal(`<h3>Copia manual</h3><p class="small">Tu navegador no permitió copiar automáticamente. Selecciona y copia:</p><textarea style="min-height:200px">${esc(text)}</textarea><div class="row end"><button class="btn" data-close>Cerrar</button></div>`);
      el.querySelector('textarea').select();
    });
  },
  scoreBar(label, v, max = 10) {
    return `<div class="score"><span>${esc(label)}</span><div class="bar"><i style="width:${clamp(v / max * 100, 0, 100)}%"></i></div><b>${v ?? '—'}</b></div>`;
  }
};

/* ---------- Almacén: nube (db privada por usuario) con respaldo local ---------- */
const Store = App.Store = {
  mode: 'local', cache: new Map(), chains: new Map(), onChange: [],
  async init() {
    await App.capsReady;
    if (Caps.db && Caps.uid) {
      try { await this.col().doc('settings').get(); this.mode = 'cloud'; }
      catch (e) { console.warn('db', e); this.mode = 'local'; }
    }
    return this.mode;
  },
  col() { return Caps.db.collection('data/users/' + Caps.uid); },
  lsKey(k) { return 'efs:' + k; },
  async get(k) {
    if (this.cache.has(k)) return clone(this.cache.get(k));
    let v = null;
    if (this.mode === 'cloud') {
      try { const s = await this.col().doc(k).get(); v = s.exists ? clone(s.data()) : null; }
      catch (e) { console.warn(e); }
    } else { try { v = JSON.parse(localStorage.getItem(this.lsKey(k)) || 'null'); } catch {} }
    if (v) this.cache.set(k, v);
    return clone(v);
  },
  set(k, v) {
    v = clone(v); v.updatedAt = Date.now(); this.cache.set(k, v);
    const prev = this.chains.get(k) || Promise.resolve();
    const p = prev.then(async () => {
      if (this.mode === 'cloud') {
        try { await this.col().doc(k).set(v); }
        catch (e) {
          if (e && e.code === 'quota_exceeded') UI.toast('La nube gratuita está llena (' + esc(e.message) + '). Borra proyectos o videos viejos para liberar espacio. No se activó ningún servicio de pago.', 'bad', 10000);
          else if (e && e.code === 'invalid_argument') { UI.toast('No se pudo guardar en la nube; se guardó en este navegador.', 'warn'); this.localSet(k, v); }
          else UI.toast('Guardado en la nube falló temporalmente. Reintentando…', 'warn');
          if (e && e.code === 'unavailable') { await sleep(1200 + Math.random() * 800); try { await this.col().doc(k).set(v); } catch {} }
        }
      } else this.localSet(k, v);
    });
    this.chains.set(k, p.catch(() => {}));
    this.onChange.forEach(f => f(k));
    return p;
  },
  localSet(k, v) { try { localStorage.setItem(this.lsKey(k), JSON.stringify(v)); } catch { UI.toast('Este navegador no permite guardar más datos.', 'bad'); } },
  async del(k) {
    this.cache.delete(k);
    if (this.mode === 'cloud') { try { await this.col().doc(k).delete(); } catch (e) { UI.error(e); } }
    else try { localStorage.removeItem(this.lsKey(k)); } catch {}
  },
  async list(type) {
    let out = [];
    if (this.mode === 'cloud') {
      try {
        const q = await this.col().where('type', '==', type).limit(500).get();
        out = q.docs.map(d => { const v = clone(d.data()); v._id = d.id; this.cache.set(d.id, v); return v; });
      } catch (e) { console.warn(e); }
    } else {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i); if (!key.startsWith('efs:')) continue;
          const v = JSON.parse(localStorage.getItem(key)); if (v && v.type === type) { v._id = key.slice(4); out.push(v); }
        }
      } catch {}
    }
    return out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
};

/* ---------- Uso y operaciones pendientes (para Control de costos) ---------- */
const Usage = App.Usage = {
  doc: null, timer: null,
  async load() { this.doc = await Store.get('usage') || {type: 'usage', months: {}, pending: [], log: []}; return this.doc; },
  bump(kind, n = 1) {
    if (!this.doc) return;
    const m = this.doc.months[monthKey()] ||= {ai: 0, tts: 0, renders: 0, uploads: 0, limits: 0};
    m[kind] = (m[kind] || 0) + n; this.save();
  },
  log(msg) { if (!this.doc) return; this.doc.log.unshift({at: Date.now(), msg}); this.doc.log = this.doc.log.slice(0, 40); this.save(); },
  addPending(label, route) {
    if (!this.doc) return;
    this.doc.pending = (this.doc.pending || []).filter(p => p.label !== label);
    this.doc.pending.unshift({id: uid(), label, route: route || location.hash, at: Date.now()});
    this.bump('limits'); this.save();
  },
  clearPending(id) { if (!this.doc) return; this.doc.pending = this.doc.pending.filter(p => p.id !== id); this.save(); },
  save() { clearTimeout(this.timer); this.timer = setTimeout(() => Store.set('usage', this.doc), 1500); }
};

/* ---------- IA: Claude a través de la página (incluido en tu plan, sin cobros extra) ---------- */
class AIError extends Error { constructor(code, userMsg) { super(userMsg); this.code = code; this.userMsg = userMsg; } }
const AI = App.AI = {
  disabled: false,
  available() { return !!Caps.sample && !this.disabled; },
  async run(prompt, {tier = 'default', onText, label = 'Operación de IA', signal, images} = {}) {
    await App.capsReady;
    if (!this.available()) throw new AIError('no_ai', 'La IA no está disponible en esta vista (ábrela en claude.ai con tu sesión iniciada y permite el acceso). Puedes usar la alternativa manual o por plantillas que aparece en esta pantalla.');
    Usage.bump('ai');
    try {
      const r = await Caps.sample(prompt, {modelTier: tier, cache: false, signal, onText: onText ? ({text}) => onText(text) : undefined, ...(images ? {images} : {})});
      return r.text || '';
    } catch (e) {
      const code = e && e.code;
      if (code === 'not_granted') { this.disabled = true; App.refreshStatus(); throw new AIError(code, 'No diste permiso para usar la IA en esta página. Puedes activarlo recargando y aceptando el aviso. Mientras tanto, usa las alternativas manuales.'); }
      if (code === 'image_rejected' || code === 'images_unavailable') throw new AIError(code, 'La IA no pudo leer esa imagen (' + (e.message || code) + '). El personaje se crea igual con los colores detectados automáticamente.');
      if (code === 'rate_limited') { Usage.addPending(label); App.refreshStatus(); throw new AIError(code, 'Se alcanzó el límite de uso de IA de tu plan por ahora. La operación quedó en "Operaciones pendientes" (Control de costos). Espera un rato y reintenta: no se activó ningún servicio de pago.'); }
      throw new AIError(code || 'ai_error', 'La IA no respondió (' + (e && e.message || 'error') + '). Reintenta en unos segundos.');
    }
  },
  parse(text) {
    let t = String(text).replace(/```(?:json)?/gi, '').trim();
    const a = t.indexOf('{'), b = t.indexOf('['); let s = a < 0 ? b : b < 0 ? a : Math.min(a, b);
    if (s < 0) throw new AIError('bad_json', 'La IA devolvió un formato inesperado. Pulsa de nuevo para regenerar.');
    const close = t[s] === '{' ? '}' : ']'; const e = t.lastIndexOf(close);
    try { return JSON.parse(t.slice(s, e + 1)); }
    catch { try { return JSON.parse(t.slice(s, e + 1).replace(/,\s*([}\]])/g, '$1')); } catch { throw new AIError('bad_json', 'La IA devolvió un JSON incompleto. Pulsa de nuevo para regenerar.'); } }
  },
  async json(prompt, opts = {}) {
    const txt = await this.run(prompt + '\n\nResponde ÚNICAMENTE con JSON válido (sin markdown, sin comentarios, sin texto antes o después).', opts);
    return this.parse(txt);
  }
};

/* ---------- Voces: voz de Claude (gratis en tu plan) + voces del navegador (gratis) ---------- */
const Voice = App.Voice = {
  claudeVoices: [
    {id: 'buttery', label: 'Cálida (Claude)'}, {id: 'airy', label: 'Ligera (Claude)'},
    {id: 'glassy', label: 'Clara (Claude)'}, {id: 'rounded', label: 'Grave (Claude)'}],
  browserVoices() {
    try { return (speechSynthesis.getVoices() || []).filter(v => /^es/i.test(v.lang)); } catch { return []; }
  },
  speaking: false,
  async speak(text, cfg = {}) {
    cfg = {engine: 'claude', voice: 'buttery', rate: 1, pitch: 1, ...cfg};
    text = String(text || '').slice(0, 1900);
    if (!text.trim()) return;
    if (cfg.engine === 'claude' && Caps.tts) {
      Usage.bump('tts');
      try { await Caps.tts.speak([{text, voice: cfg.voice, rate: clamp(cfg.rate, .7, 1.5), language: 'es'}]); return; }
      catch (e) { if (e && e.code === 'rate_limited') throw new AIError('rate_limited', 'Límite temporal de la voz de Claude. Usa una voz del navegador o espera.'); if (e && e.code === 'not_granted') { Caps.tts = null; App.refreshStatus(); } else if (e && /stop|viewer/.test(e.code || '')) return; }
    }
    return this.speakBrowser(text, cfg);
  },
  speakBrowser(text, cfg) {
    return new Promise(res => {
      try {
        const u = new SpeechSynthesisUtterance(text); u.lang = 'es-ES';
        const vs = this.browserVoices(); const male = /pablo|jorge|ra[uú]l|alvaro|álvaro|diego|gonzalo|enrique|carlos|juan|andr[eé]s|gerardo|jos[eé]|antonio|miguel|male|hombre/i; const v = vs.find(x => x.name === cfg.browserVoice) || (cfg.gender === 'm' && vs.find(x => male.test(x.name))) || vs[0];
        if (v) { u.voice = v; u.lang = v.lang; }
        u.rate = clamp(cfg.rate || 1, .6, 1.6); u.pitch = clamp(cfg.pitch || 1, .5, 1.6);
        u.onend = u.onerror = () => res(); speechSynthesis.speak(u);
      } catch { res(); }
    });
  },
  stop() { try { Caps.tts && Caps.tts.stop(); } catch {} try { speechSynthesis.cancel(); } catch {} }
};
try { speechSynthesis.onvoiceschanged = () => App.refreshStatus && App.refreshStatus(); } catch {}

/* ---------- Archivos: nube (assets) y descargas ---------- */
const Files = App.Files = {
  async save(filename, data) {
    await App.capsReady;
    if (!Caps.downloads) {
      // sin la capacidad de Claude (versión de escritorio o navegador normal): descarga directa a tu carpeta Descargas
      try {
        const blob = data instanceof Blob ? data : new Blob([data], {type: /\.json$/.test(filename) ? 'application/json' : /\.(srt|txt|md)$/.test(filename) ? 'text/plain' : 'application/octet-stream'});
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
        UI.toast(`Descargado: <b>${esc(filename)}</b> (carpeta Descargas).`); return true;
      } catch (e) { UI.toast('No se pudo descargar: ' + esc(e.message), 'bad'); return false; }
    }
    try { await Caps.downloads.save({filename, data}); return true; }
    catch (e) {
      if (e && e.code === 'declined') return false;
      if (e && e.code === 'rate_limited') UI.toast('Ya hay una descarga esperando confirmación.', 'warn');
      else if (e && e.code === 'too_large') UI.toast('El archivo es demasiado grande para guardarlo desde esta app del teléfono. Ábrelo en tu computadora (Chrome o Edge) para descargarlo.', 'bad', 10000);
      else UI.toast('No se pudo descargar: ' + esc(e && (e.message || e.code)), 'bad');
      return false;
    }
  },
  async upload(blob, label = 'archivo') {
    await App.capsReady;
    if (!Caps.assets) return null;
    try { const r = await Caps.assets.upload(blob); Usage.bump('uploads'); return r; }
    catch (e) {
      UI.toast('No se pudo guardar ' + esc(label) + ' en la nube gratuita: ' + esc(e && (e.message || e.code)) + '. Puedes descargarlo directamente.', 'warn', 9000);
      return null;
    }
  },
  url(id) { return id ? '/_blob/' + id : ''; },
  async remove(id) { if (Caps.assets && id) { try { await Caps.assets.delete(id); } catch (e) { console.warn(e); } } },
  async usage() { if (!Caps.assets) return null; try { return await Caps.assets.list(); } catch { return null; } },
  canvasBlob(cv, type = 'image/png', q) { return new Promise(r => cv.toBlob(r, type, q)); }
};

/* ---------- Navegación: dos estudios ---------- */
const NAV = App.NAV = {
  fin: {label: 'Finanzas', icon: 'coin', items: [
    ['dashboard', 'Inicio', 'home'], ['-', 'Crear'], ['mivideo', 'Mi video (guion propio)', 'doc'], ['crear', 'Crear video', 'plus'], ['ideas', 'Ideas', 'bulb'],
    ['-', 'Biblioteca'], ['videos', 'Videos', 'film'], ['personajes', 'Personajes', 'users'], ['guiones', 'Guiones', 'doc'], ['miniaturas', 'Miniaturas', 'image'],
    ['-', 'Canal'], ['identidad', 'Identidad del canal', 'tag'], ['investigacion', 'Investigación', 'search'],
    ['-', 'General'], ['costos', 'Control de costos', 'coin'], ['config', 'Configuración', 'gear']]},
  gym: {label: 'Gym', icon: 'dumbbell', items: [
    ['inicio', 'Inicio', 'home'], ['-', 'Crear'], ['mivideo', 'Mi video (guion propio)', 'doc'], ['crear', 'Crear video', 'plus'], ['descubrir', 'Ideas y ángulos', 'compass'],
    ['-', 'Biblioteca'], ['videos', 'Videos', 'film'], ['personajes', 'Personajes', 'users'],
    ['-', 'Laboratorio'], ['biblioteca', 'Métodos de entrenamiento', 'book'], ['comparador', 'Comparador', 'compare'], ['raros', 'Métodos poco conocidos', 'flask'], ['evidencia', 'Evidencia y seguridad', 'shield'],
    ['-', 'General'], ['costos', 'Control de costos', 'coin'], ['config', 'Configuración', 'gear']]}
};
App.defaultView = {fin: 'dashboard', gym: 'inicio'};
App.lastView = {fin: 'dashboard', gym: 'inicio'};

App.go = (hash) => { if (location.hash === '#' + hash) App.route(); else location.hash = hash; };

App.renderChrome = (studio, view) => {
  document.body.dataset.studio = studio;
  $$('[data-switch]').forEach(sw => {
    sw.innerHTML = ['fin', 'gym'].map(s => `<button data-s="${s}" ${s === studio ? 'data-on aria-pressed="true"' : 'aria-pressed="false"'} title="Alt+${s === 'fin' ? 1 : 2}">${icon(NAV[s].icon, 17)}${NAV[s].label}</button>`).join('');
  });
  $('#nav').innerHTML = NAV[studio].items.map(([id, label, ic]) => id === '-' ? `<div class="navlbl">${label}</div>` :
    `<a href="#${studio}-${id}" ${id === view || (view === 'ficha' && id === 'biblioteca') ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`).join('');
  $('#zeroLink').href = '#' + studio + '-costos';
};

App.route = async () => {
  const h = (location.hash || '').slice(1);
  let [studio, ...rest] = h.split('-'); let view = rest.join('-');
  if (!NAV[studio]) { studio = sessionGet('studio') || 'fin'; view = App.lastView[studio]; }
  if (!view || !App.views[studio + '-' + view]) view = App.defaultView[studio];
  App.lastView[studio] = view; sessionSet('studio', studio); sessionSet('last-' + studio, view);
  App.renderChrome(studio, view);
  delete document.body.dataset.menu;
  const v = App.views[studio + '-' + view];
  const main = $('#main');
  main.innerHTML = '';
  App.state.studio = studio;
  try { await v(main, studio); } catch (e) { UI.error(e); main.innerHTML += `<div class="note bad">Esta pantalla tuvo un error: ${esc(e.message)}</div>`; }
  main.focus({preventScroll: true});
  window.scrollTo(0, 0);
};
function sessionGet(k) { try { return sessionStorage.getItem('efs-' + k); } catch { return null; } }
function sessionSet(k, v) { try { sessionStorage.setItem('efs-' + k, v); } catch {} }
App.switchStudio = s => { const v = sessionGet('last-' + s) || App.defaultView[s]; App.go(s + '-' + v); };

App.refreshStatus = () => {
  const set = (id, cls, txt) => { const d = $('#dot' + id), l = $('#lbl' + id); if (!d || !l) return; d.className = 'dot ' + cls; l.textContent = txt; };
  if (!Caps.ready) return;
  set('AI', AI.available() ? 'ok' : 'warn', AI.available() ? 'IA: Claude lista' : App.DESKTOP ? 'IA: en la versión de Claude (aquí, ideas sin IA)' : 'IA: no disponible aquí');
  set('DB', Store.mode === 'cloud' ? 'ok' : App.DESKTOP ? 'ok' : 'warn', Store.mode === 'cloud' ? 'Nube: proyectos guardados' : App.DESKTOP ? 'Guardado en esta laptop' : 'Guardado solo en este navegador');
  const bv = Voice.browserVoices().length;
  set('TTS', Caps.tts || bv ? 'ok' : 'warn', Caps.tts ? `Voces: Claude + ${bv} del navegador` : bv ? `Voces: ${bv} del navegador` : 'Voces: sin voces en español');
};

/* encabezado común de pantalla */
App.head = (crumb, title, desc, actions = '') => `<div class="viewhead"><div><div class="crumb">${esc(crumb)}</div><h1>${esc(title)}</h1>${desc ? `<p>${desc}</p>` : ''}</div><div class="row">${actions}</div></div>`;

/* ---------- versión de escritorio: avisos y actualización en vivo ---------- */
if (App.DESKTOP) {
  document.documentElement.dataset.desktop = '1';
  /* cuando Claude cambia los archivos de la app en tu laptop, js/version.js cambia: la app lo detecta y se recarga */
  const cur = App.DESKTOP.version; let shown = false;
  window.EFS_LATEST = v => {
    if (!v || v === cur || shown) return;
    try { if (sessionStorage.getItem('efs-reloaded-for') === v) return; sessionStorage.setItem('efs-reloaded-for', v); } catch {}
    const busy = App.state.recording || document.querySelector('.modal');
    if (!busy) { shown = true; UI.toast('Claude actualizó la app. Recargando…', '', 3000); setTimeout(() => location.reload(), 1200); return; }
    shown = true;
    const bar = document.createElement('div'); bar.className = 'toast'; bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:14px;z-index:99;display:flex;gap:12px;align-items:center';
    bar.innerHTML = '<span>Claude actualizó la app. Recarga cuando termines lo que estás haciendo.</span><button class="btn sm primary">Recargar ahora</button>';
    bar.querySelector('button').onclick = () => location.reload(); document.body.appendChild(bar);
  };
  /* versión web instalable (GitHub Pages): funciona sin internet y se instala como app con ícono */
  if (App.DESKTOP.web && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  try { if (new URLSearchParams(location.search).has('app')) sessionStorage.setItem('efs-app', '1'); } catch {}
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone || (() => { try { return sessionStorage.getItem('efs-app') === '1'; } catch { return false; } })();
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); if (standalone()) return;
    const foot = document.querySelector('.sidefoot'); if (!foot || document.getElementById('installBtn')) return;
    foot.insertAdjacentHTML('afterbegin', '<button class="btn primary sm" id="installBtn" style="margin-bottom:8px;justify-content:center">Instalar app en el escritorio</button>');
    document.getElementById('installBtn').onclick = async () => { e.prompt(); const r = await e.userChoice; if (r.outcome === 'accepted') document.getElementById('installBtn').remove(); };
  });
  window.addEventListener('appinstalled', () => { const b = document.getElementById('installBtn'); if (b) b.remove(); UI.toast('App instalada. Ábrela desde el ícono "Estudio Faceless" del Escritorio o del menú Inicio.'); });
  setInterval(() => { const sc = document.createElement('script'); sc.src = 'js/version.js?t=' + Date.now(); sc.onload = sc.onerror = () => sc.remove(); document.head.appendChild(sc); }, 3000);
}
