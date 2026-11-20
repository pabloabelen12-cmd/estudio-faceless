'use strict';
/* ============ Arranque ============ */
(async () => {
  const {UI, Store, Usage} = App;
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-switch] button'); if (b) { App.switchStudio(b.dataset.s); return; }
    if (e.target.closest('#menuBtn')) { document.body.dataset.menu ? delete document.body.dataset.menu : document.body.dataset.menu = 1; return; }
    if (document.body.dataset.menu && !e.target.closest('#side')) delete document.body.dataset.menu;
  });
  document.addEventListener('keydown', e => { if (e.altKey && (e.key === '1' || e.key === '2')) { e.preventDefault(); App.switchStudio(e.key === '1' ? 'fin' : 'gym'); } });
  window.addEventListener('hashchange', () => App.route());
  App.renderChrome('fin', 'dashboard');
  await App.capsReady;
  await Store.init();
  await Usage.load();
  try { await App.Gym.loadCustom(); } catch {}
  App.refreshStatus();
  if (App.DESKTOP) {
    const foot = document.querySelector('.sidefoot'); if (foot && App.DESKTOP.claudeUrl) foot.insertAdjacentHTML('afterbegin', `<a class="btn sm" href="${App.DESKTOP.claudeUrl}" target="_blank" rel="noopener" style="margin-bottom:8px;justify-content:center">Abrir versión con IA (Claude)</a>`);
    try { if (!localStorage.getItem('efs:desktop-hello')) { localStorage.setItem('efs:desktop-hello', '1'); UI.toast('Versión de escritorio: tus proyectos se guardan en esta laptop. Las ideas funcionan sin IA; para guiones e ideas con IA usa "Abrir versión con IA (Claude)". Puedes pasar tus proyectos de una versión a otra en Configuración → Exportar / Importar.', 'info', 14000); } } catch {}
  } else if (Store.mode !== 'cloud') UI.toast('Tus proyectos se guardarán solo en este navegador. Abre la app en claude.ai con tu sesión iniciada para guardarlos en la nube.', 'warn', 9000);
  await App.route();
})();
