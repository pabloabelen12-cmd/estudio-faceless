'use strict';
/* ============ Render de alta calidad: cuadro por cuadro (WebCodecs) → MP4 H.264 con FPS exactos (24–144) y hasta 4K ============
   Antes se grababa en tiempo real con MediaRecorder: si la computadora tardaba más de 16 ms en un cuadro, el video salía a 15–20 FPS.
   Ahora cada cuadro se dibuja, se codifica y recibe su marca de tiempo exacta, sin importar cuánto tarde; el resultado es siempre fluido. */
(() => {
const E = App.Engine;

E.RES = {720: 'HD 720p', 1080: 'Full HD 1080p', 1440: '2K 1440p', 2160: '4K 2160p'};
E.FPS_OPTS = {30: '30 FPS', 60: '60 FPS (recomendado)', 90: '90 FPS', 120: '120 FPS', 144: '144 FPS'};
E.QUALS = {std: 'Normal', alta: 'Alta (recomendada)', max: 'Máxima'};
E.sizeFor = (format, res = 1080) => { const r = +res || 1080, w = Math.round(r * 16 / 9 / 2) * 2; return format === 'vertical' ? {W: r, H: w} : {W: w, H: r}; };
E.bitrateHQ = (W, H, fps, q = 'alta') => Math.round(Math.min(120e6, Math.max(4e6, W * H * fps * ({std: .07, alta: .12, max: .2}[q] || .12))));

/* ---------- MP4 (ISO BMFF) mínimo: 1 pista de video H.264 + 1 de audio AAC u Opus ---------- */
const cat = (...parts) => { const flat = []; parts.forEach(p => { if (p == null) return; flat.push(p instanceof Uint8Array ? p : Uint8Array.from(p)); }); const n = flat.reduce((a, b) => a + b.length, 0), o = new Uint8Array(n); let k = 0; flat.forEach(p => { o.set(p, k); k += p.length; }); return o; };
const u32 = n => [n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255], u16 = n => [n >> 8 & 255, n & 255];
const u64 = n => [...u32(Math.floor(n / 4294967296)), ...u32(n >>> 0)];
const str = s => [...s].map(c => c.charCodeAt(0));
const box = (type, ...p) => { const d = cat(...p); return cat(u32(8 + d.length), str(type), d); };
const fbox = (type, ver, flags, ...p) => box(type, [ver, flags >> 16 & 255, flags >> 8 & 255, flags & 255], ...p);
const MATRIX = [...u32(0x10000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x10000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x40000000)];

function sttsOf(durs) { const e = []; durs.forEach(d => { const l = e[e.length - 1]; if (l && l[1] === d) l[0]++; else e.push([1, d]); }); return fbox('stts', 0, 0, u32(e.length), ...e.map(([c, d]) => cat(u32(c), u32(d)))); }
const u32arr = v => { const o = new Uint8Array(v.length * 4), dv = new DataView(o.buffer); v.forEach((x, i) => dv.setUint32(i * 4, x)); return o; };
const u64arr = v => { const o = new Uint8Array(v.length * 8), dv = new DataView(o.buffer); v.forEach((x, i) => { dv.setUint32(i * 8, Math.floor(x / 4294967296)); dv.setUint32(i * 8 + 4, x >>> 0); }); return o; };
function stblOf(tr, entry) {
  const sm = tr.samples, n = sm.length, co64 = n && sm[n - 1].off > 4e9, keys = [];
  sm.forEach((s, i) => { if (s.key) keys.push(i + 1); });
  const parts = [fbox('stsd', 0, 0, u32(1), entry), sttsOf(sm.map(s => s.dur)), tr.video ? fbox('stss', 0, 0, u32(keys.length), u32arr(keys)) : null,
    fbox('stsz', 0, 0, u32(0), u32(n), u32arr(sm.map(s => s.size))), fbox('stsc', 0, 0, u32(1), u32(1), u32(1), u32(1)),
    co64 ? fbox('co64', 0, 0, u32(n), u64arr(sm.map(s => s.off))) : fbox('stco', 0, 0, u32(n), u32arr(sm.map(s => s.off)))];
  return box('stbl', ...parts.filter(Boolean));
}
const nameBytes = s => cat([s.length], str(s), new Array(31 - s.length).fill(0));
function videoEntry(tr) {
  return box('avc1', new Array(6).fill(0), u16(1), u16(0), u16(0), new Array(12).fill(0), u16(tr.W), u16(tr.H), u32(0x480000), u32(0x480000), u32(0), u16(1), nameBytes(''), u16(0x18), [255, 255], box('avcC', tr.desc));
}
function audioEntry(tr) {
  const head = [new Array(6).fill(0), u16(1), u32(0), u32(0), u16(tr.ch), u16(16), u16(0), u16(0), u32(tr.rate * 65536)];
  if (tr.codec === 'opus') {
    const d = tr.desc && tr.desc.length >= 19 ? tr.desc : null; const dv = d ? new DataView(d.buffer, d.byteOffset, d.byteLength) : null;
    const pre = dv ? dv.getUint16(10, true) : 312, rate = dv ? dv.getUint32(12, true) : tr.rate, gain = dv ? dv.getInt16(16, true) : 0;
    return box('Opus', ...head, box('dOps', [0, tr.ch], u16(pre), u32(rate), u16(gain & 0xffff), [0]));
  }
  const asc = tr.desc || new Uint8Array([0x11, 0x90]);
  const dec = cat([0x04, 13 + 2 + asc.length, 0x40, 0x15, 0, 0, 0], u32(0), u32(0), [0x05, asc.length], asc);
  return box('mp4a', ...head, fbox('esds', 0, 0, [0x03, 3 + dec.length + 3, 0, 0, 0], dec, [0x06, 1, 2]));
}
function trakOf(tr, id, movTS) {
  const dur = tr.samples.reduce((a, s) => a + s.dur, 0), movDur = Math.round(dur / tr.ts * movTS);
  const tkhd = fbox('tkhd', 0, 3, u32(0), u32(0), u32(id), u32(0), u32(movDur), u32(0), u32(0), u16(0), u16(0), u16(tr.video ? 0 : 0x100), u16(0), MATRIX, u32(tr.video ? tr.W * 65536 : 0), u32(tr.video ? tr.H * 65536 : 0));
  const mdhd = fbox('mdhd', 0, 0, u32(0), u32(0), u32(tr.ts), u32(dur), u16(0x55c4), u16(0));
  const hdlr = fbox('hdlr', 0, 0, u32(0), str(tr.video ? 'vide' : 'soun'), u32(0), u32(0), u32(0), [...str(tr.video ? 'VideoHandler' : 'SoundHandler'), 0]);
  const media = tr.video ? fbox('vmhd', 0, 1, u16(0), u16(0), u16(0), u16(0)) : fbox('smhd', 0, 0, u16(0), u16(0));
  const dinf = box('dinf', fbox('dref', 0, 0, u32(1), fbox('url ', 0, 1)));
  return box('trak', tkhd, box('mdia', mdhd, hdlr, box('minf', media, dinf, stblOf(tr, tr.video ? videoEntry(tr) : audioEntry(tr)))));
}
E.muxMP4 = (tracks, mdatSize, headLen) => {
  const movTS = 1000, dur = Math.max(...tracks.map(t => Math.round(t.samples.reduce((a, s) => a + s.dur, 0) / t.ts * movTS)));
  const mvhd = fbox('mvhd', 0, 0, u32(0), u32(0), u32(movTS), u32(dur), u32(0x10000), u16(0x100), u16(0), u32(0), u32(0), MATRIX, new Array(24).fill(0), u32(tracks.length + 1));
  return box('moov', mvhd, ...tracks.map((t, i) => trakOf(t, i + 1, movTS)));
};

/* ---------- soporte ---------- */
const VIDEO_CODECS = ['avc1.640034', 'avc1.640033', 'avc1.64002A', 'avc1.4D4028', 'avc1.42E028'];
E.hqSupport = async (W, H, fps, bitrate) => {
  if (!window.VideoEncoder || !window.VideoFrame || !window.AudioEncoder || !window.AudioData) return null;
  let vc = null;
  for (const codec of VIDEO_CODECS) { try { const r = await VideoEncoder.isConfigSupported({codec, width: W, height: H, bitrate, framerate: fps, avc: {format: 'avc'}}); if (r.supported) { vc = {codec, width: W, height: H, bitrate, framerate: fps, avc: {format: 'avc'}, latencyMode: 'quality', bitrateMode: 'variable'}; break; } } catch {} }
  if (!vc) return null;
  let ac = null;
  for (const [codec, extra, br] of [['mp4a.40.2', {aac: {format: 'aac'}}, 192000], ['opus', {}, 160000]]) { try { const c = {codec, sampleRate: 48000, numberOfChannels: 2, bitrate: br, ...extra}; const r = await AudioEncoder.isConfigSupported(c); if (r.supported) { ac = c; break; } } catch {} }
  return ac ? {video: vc, audio: ac} : null;
};

const yieldNow = () => new Promise(r => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });

/* ---------- el render ---------- */
E.recordHQ = async (tl, {narration, fps = 60, qual = 'alta', bitrate, onProgress, cancel, support} = {}) => {
  bitrate = bitrate || E.bitrateHQ(tl.W, tl.H, fps, qual);
  support = support || await E.hqSupport(tl.W, tl.H, fps, bitrate);
  if (!support) return null;
  const SR = 48000, CH = 2, N = Math.ceil((tl.duration + .3) * fps), totalSec = N / fps;
  const cv = document.createElement('canvas'); cv.width = tl.W; cv.height = tl.H; const ctx = cv.getContext('2d', {alpha: false});
  if (document.fonts && document.fonts.load) { try { await Promise.all([document.fonts.load('900 40px Archivo'), document.fonts.load('700 40px "Inter Tight"')]); } catch {} }
  if (App.Art.preload) await App.Art.preload(Object.values(tl.chars));
  E.drawFrame(ctx, tl, 0);
  const fail = {e: null};
  const vtrack = {video: true, ts: 90000, W: tl.W, H: tl.H, samples: [], desc: null}, atrack = {video: false, ts: SR, rate: SR, ch: CH, samples: [], desc: null, codec: support.audio.codec === 'opus' ? 'opus' : 'aac'};
  /* área de datos (mdat): se acumula en bloques para que el navegador pueda pasarlos a disco en videos largos */
  const FT = cat(box('ftyp', str('isom'), u32(512), str('isom'), str('iso2'), str('avc1'), str('mp41')));
  const HEAD = 16; let pos = 0, buf = [], bufBytes = 0; const blobs = [];
  const put = (chunk, tr, meta) => {
    const u8 = new Uint8Array(chunk.byteLength); chunk.copyTo(u8);
    if (meta && meta.decoderConfig && meta.decoderConfig.description && !tr.desc) { const d = meta.decoderConfig.description; tr.desc = new Uint8Array(d instanceof ArrayBuffer ? d.slice(0) : d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength)); }
    tr.samples.push({size: u8.length, off: FT.length + HEAD + pos, key: chunk.type === 'key', ts: chunk.timestamp, cdur: chunk.duration});
    buf.push(u8); pos += u8.length; bufBytes += u8.length;
    if (bufBytes > 48e6) { blobs.push(new Blob(buf)); buf = []; bufBytes = 0; }
  };
  const venc = new VideoEncoder({output: (c, m) => put(c, vtrack, m), error: e => { fail.e = e; }});
  venc.configure(support.video);
  const aenc = new AudioEncoder({output: (c, m) => put(c, atrack, m), error: e => { fail.e = e; }});
  aenc.configure(support.audio);

  /* audio: se mezcla en tramos de 30 s a 48 kHz y se envía al codificador poco a poco */
  const WIN = 30; let win = null, fed = 0;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  let carry = null;   // cola de la ventana anterior (notas que cruzan el borde)
  const renderWin = async from => {
    const to = Math.min(from + WIN, totalSec), len = Math.ceil((to - from) * SR);
    const m = await E.renderAudioWindow(tl, from, to, !!narration, null, SR);
    const L = new Float32Array(len), R = new Float32Array(len), ml = m.getChannelData(0), mr = m.getChannelData(1);
    for (let i = 0; i < len && i < ml.length; i++) { L[i] = ml[i]; R[i] = mr[i]; }
    if (carry) for (let i = 0; i < carry.L.length && i < len; i++) { L[i] += carry.L[i]; R[i] += carry.R[i]; }
    carry = {L: ml.slice(len), R: mr.slice(len)};
    if (narration && from - .1 < narration.duration) {
      const oc = new OAC(2, len, SR), s = oc.createBufferSource(); s.buffer = narration; const g = oc.createGain(); g.gain.value = 1.3; s.connect(g); g.connect(oc.destination);
      s.start(Math.max(0, .1 - from), Math.max(0, from - .1)); const nb = await oc.startRendering(), nl = nb.getChannelData(0), nr = nb.getChannelData(1);
      for (let i = 0; i < len; i++) { L[i] += nl[i]; R[i] += nr[i]; }
    }
    for (let i = 0; i < len; i++) { L[i] = Math.max(-1, Math.min(1, L[i])); R[i] = Math.max(-1, Math.min(1, R[i])); }
    win = {from, to, L, R};
  };
  const BLOCK = SR >> 1;
  const feedAudio = async upTo => {
    while (fed < Math.min(upTo, totalSec) - 1e-6) {
      if (!win || fed >= win.to - 1e-6) await renderWin(win ? win.to : 0);
      const i0 = Math.round((fed - win.from) * SR), n = Math.min(BLOCK, win.L.length - i0); if (n <= 0) { fed = win.to; continue; }
      const data = new Float32Array(n * 2); data.set(win.L.subarray(i0, i0 + n), 0); data.set(win.R.subarray(i0, i0 + n), n);
      const ad = new AudioData({format: 'f32-planar', sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((win.from + i0 / SR) * 1e6), data});
      aenc.encode(ad); ad.close(); fed = win.from + (i0 + n) / SR;
    }
  };

  const t0 = performance.now(), frameUs = 1e6 / fps;
  const waitQ = async () => { let k = 0; while (venc.encodeQueueSize > 10 && !fail.e) { await yieldNow(); if (++k > 200) await new Promise(r => setTimeout(r, 4)); } };
  try {
    for (let i = 0; i < N; i++) {
      if (cancel && cancel.cancelled) throw Object.assign(new Error('Render cancelado'), {userMsg: 'Render cancelado.'});
      if (fail.e) throw fail.e;
      E.drawFrame(ctx, tl, i / fps);
      const vf = new VideoFrame(cv, {timestamp: Math.round(i * frameUs), duration: Math.round(frameUs)});
      venc.encode(vf, {keyFrame: i % (fps * 2) === 0}); vf.close();
      if (i % 8 === 0) await waitQ();
      if (i % fps === 0) await feedAudio(i / fps + 2);
      if (i % 6 === 0) {
        const k = i / N, el = (performance.now() - t0) / 1000, eta = k > .02 ? el / k - el : 0;
        onProgress && onProgress(k, `Renderizando cuadro ${i + 1} de ${N} a ${fps} FPS${eta > 3 ? ' · faltan ≈ ' + (eta >= 90 ? Math.round(eta / 60) + ' min' : Math.round(eta) + ' s') : ''} ·`);
        if (i % 24 === 0) await yieldNow();
      }
    }
    await feedAudio(totalSec + 1);
    await venc.flush(); await aenc.flush();
    if (fail.e) throw fail.e;
  } finally { try { venc.close(); } catch {} try { aenc.close(); } catch {} }
  if (!vtrack.desc) throw new Error('El codificador no entregó la configuración H.264.');
  /* duraciones por muestra */
  vtrack.samples.forEach((s, i) => { s.dur = Math.round((i + 1) * 90000 / fps) - Math.round(i * 90000 / fps); });
  atrack.samples.forEach(s => { s.dur = Math.round((s.cdur || 21333) * SR / 1e6); });
  const tracks = atrack.samples.length ? [vtrack, atrack] : [vtrack];
  const mdatHead = cat(u32(1), str('mdat'), u64(HEAD + pos));
  const moov = E.muxMP4(tracks, pos, HEAD);
  if (buf.length) blobs.push(new Blob(buf));
  const blob = new Blob([FT, mdatHead, ...blobs, moov], {type: 'video/mp4'});
  onProgress && onProgress(1, 'Listo');
  return {blob, mime: 'video/mp4', ext: 'mp4', size: blob.size, W: tl.W, H: tl.H, duration: tl.duration, fps, bitrate, codec: support.video.codec, audioCodec: support.audio.codec, hq: true, tookSec: (performance.now() - t0) / 1000};
};
})();
