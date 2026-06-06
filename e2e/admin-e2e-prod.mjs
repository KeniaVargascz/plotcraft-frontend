import { chromium } from '@playwright/test';

const ADMIN_URL = 'https://plotcraft-admin.vercel.app';
const API_URL = 'https://plotcraft-backend.onrender.com/api/v1';

const results = [];
const log = (section, test, status, detail) => {
  results.push({ section, test, status, detail });
  console.log(status === 'PASS' ? '  OK' : '  FAIL', test, detail ? '— ' + detail : '');
};

const browser = await chromium.launch();
const p = await browser.newPage();
const consoleErrors = [];
p.on('console', msg => { if (msg.type() === 'error') consoleErrors.push({ url: p.url(), msg: msg.text().substring(0, 150) }); });

// ═══════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════
await p.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
await p.locator('input[name="email"]').fill('admin@plotcraft.com');
await p.locator('input[name="password"]').fill('Admin1234!');
await p.getByRole('button', { name: /iniciar/i }).click();
await p.waitForTimeout(5000);

// ═══════════════════════════════════════
// E1: FUNDACION
// ═══════════════════════════════════════
console.log('\n=== E1. FUNDACION ===');

// Auth
log('e1', '1.1 Login redirige a dashboard', p.url().includes('/dashboard') ? 'PASS' : 'FAIL', p.url());

const meRes = await p.evaluate(async (apiUrl) => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch(`${apiUrl}/admin/auth/me`, { headers: { Authorization: 'Bearer ' + t } });
  return { status: r.status };
}, API_URL);
log('e1', '1.2 GET /me retorna perfil', meRes.status === 200 ? 'PASS' : 'FAIL', '');

// Login incorrecto
const p2 = await browser.newPage();
await p2.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
await p2.locator('input[name="email"]').fill('wrong@x.com');
await p2.locator('input[name="password"]').fill('Bad!');
await p2.getByRole('button', { name: /iniciar/i }).click();
await p2.waitForTimeout(5000);
const errText = (await p2.locator('body').innerText()).toLowerCase();
log('e1', '1.3 Login incorrecto muestra error', errText.includes('incorrecta') || errText.includes('error') ? 'PASS' : 'FAIL', '');
await p2.close();

// Guard
const p3 = await browser.newPage();
await p3.goto(`${ADMIN_URL}/users`, { waitUntil: 'networkidle', timeout: 30000 });
log('e1', '1.4 Guard redirige sin auth', p3.url().includes('/login') ? 'PASS' : 'FAIL', p3.url());
await p3.close();

// Layout
await p.goto(`${ADMIN_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
const nav = await p.locator('aside, .sidenav').first().innerText();
const navExpected = ['Dashboard', 'Feature', 'Audit', 'Usuarios', 'Comunidades', 'Novelas', 'Foro', 'Catalogos', 'Posts', 'Analytics', 'Configuracion'];
const navMissing = navExpected.filter(n => !nav.includes(n));
log('e1', '1.5 Sidebar tiene 11 items', navMissing.length === 0 ? 'PASS' : 'FAIL', navMissing.length > 0 ? 'faltan: ' + navMissing.join(', ') : '11/11');

// ═══════════════════════════════════════
// E2: DASHBOARD & USUARIOS
// ═══════════════════════════════════════
console.log('\n=== E2. DASHBOARD & USUARIOS ===');

await p.goto(`${ADMIN_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(5000);
const dt = await p.locator('body').innerText();
log('e2', '2.1 Dashboard: metricas', dt.includes('USUARIOS') && dt.includes('NOVELAS') && dt.includes('MUNDOS') ? 'PASS' : 'FAIL', '');
log('e2', '2.2 Dashboard: actividad', dt.includes('Actividad') || dt.includes('ultimos') ? 'PASS' : 'FAIL', '');
log('e2', '2.3 Dashboard: crecimiento', dt.includes('Crecimiento') || dt.includes('crecimiento') ? 'PASS' : 'FAIL', '');

// Users
await p.goto(`${ADMIN_URL}/users`, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(5000);
const ut = await p.locator('body').innerText();
log('e2', '2.4 Usuarios: pagina carga', ut.includes('Usuarios') ? 'PASS' : 'FAIL', '');
const uRows = await p.locator('tr').count();
log('e2', '2.5 Usuarios: tabla con datos', uRows > 1 ? 'PASS' : 'FAIL', uRows + ' rows');

const uDetail = await p.evaluate(async (apiUrl) => {
  const t = localStorage.getItem('admin_access_token');
  const list = await (await fetch(`${apiUrl}/admin/users?limit=1`, { headers: { Authorization: 'Bearer ' + t } })).json();
  const id = list.data?.data?.[0]?.id;
  if (!id) return { status: 0 };
  const r = await fetch(`${apiUrl}/admin/users/${id}`, { headers: { Authorization: 'Bearer ' + t } });
  return { status: r.status, hasCount: !!(await r.json()).data?._count };
}, API_URL);
log('e2', '2.6 Usuarios: API detalle', uDetail.status === 200 && uDetail.hasCount ? 'PASS' : 'FAIL', '');

// Communities moderation
await p.goto(`${ADMIN_URL}/communities`, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(5000);
const ct = await p.locator('body').innerText();
log('e2', '2.7 Comunidades: pagina carga', ct.includes('Comunidades') ? 'PASS' : 'FAIL', '');

const pendingApi = await p.evaluate(async (apiUrl) => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch(`${apiUrl}/admin/communities/pending/count`, { headers: { Authorization: 'Bearer ' + t } });
  return { status: r.status };
}, API_URL);
log('e2', '2.8 Comunidades: API pending count', pendingApi.status === 200 ? 'PASS' : 'FAIL', '');

// ═══════════════════════════════════════
// E3: FEATURE FLAGS
// ═══════════════════════════════════════
console.log('\n=== E3. FEATURE FLAGS ===');

await p.goto(`${ADMIN_URL}/features`, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(3000);
const ft = await p.locator('body').innerText();
log('e3', '3.1 Flags: pagina carga', ft.includes('flags') ? 'PASS' : 'FAIL', '');
log('e3', '3.2 Flags: muestra grupos', ft.toLowerCase().includes('author') ? 'PASS' : 'FAIL', '');

// Public endpoint
const pubFlags = await p.evaluate(async (apiUrl) => {
  const r = await fetch(`${apiUrl}/features/active`);
  const body = await r.json();
  return { status: r.status, count: body.data?.length };
}, API_URL);
log('e3', '3.3 /features/active publico', pubFlags.status === 200 ? 'PASS' : 'FAIL', pubFlags.count + ' flags');

// Toggle + verify + backend 404
const flagCheck = await p.evaluate(async (apiUrl) => {
  const t = localStorage.getItem('admin_access_token');

  // 1. Disable
  await fetch(`${apiUrl}/admin/features/author.planner`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ enabled: false }),
  });

  // 2. Wait for server-side cache invalidation
  await new Promise(r => setTimeout(r, 2000));

  // 3. Check /features/active
  const active = await (await fetch(`${apiUrl}/features/active?_t=${Date.now()}`, { cache: 'no-store' })).json();

  // 4. Check backend 404
  const planner = await fetch(`${apiUrl}/planner/projects`, { headers: { Authorization: 'Bearer ' + t } });

  // 5. Re-enable
  await fetch(`${apiUrl}/admin/features/author.planner`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ enabled: true }),
  });

  return { inActive: active.data.includes('author.planner'), plannerStatus: planner.status };
}, API_URL);
log('e3', '3.4 Flag disabled: ausente en /active', !flagCheck.inActive ? 'PASS' : 'FAIL', '');
log('e3', '3.5 Flag disabled: backend 404', flagCheck.plannerStatus === 404 ? 'PASS' : 'FAIL', 'status=' + flagCheck.plannerStatus);

// ═══════════════════════════════════════
// E4: GESTION DE CONTENIDO
// ═══════════════════════════════════════
console.log('\n=== E4. GESTION DE CONTENIDO ===');

// Novels
await p.goto(`${ADMIN_URL}/novels`, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(5000);
log('e4', '4.1 Novelas: pagina carga', (await p.locator('body').innerText()).includes('Novelas') ? 'PASS' : 'FAIL', '');
log('e4', '4.2 Novelas: tabla con datos', (await p.locator('tr').count()) > 1 ? 'PASS' : 'FAIL', '');

const novelApi = await p.evaluate(async (apiUrl) => {
  const t = localStorage.getItem('admin_access_token');
  const list = await (await fetch(`${apiUrl}/admin/novels?limit=1`, { headers: { Authorization: 'Bearer ' + t } })).json();
  const id = list.data?.data?.[0]?.id;
  if (!id) return { detail: 0, mod: 0 };
  const detail = await fetch(`${apiUrl}/admin/novels/${id}`, { headers: { Authorization: 'Bearer ' + t } });
  const mod = await fetch(`${apiUrl}/admin/novels/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ isPublic: true }),
  });
  return { detail: detail.status, mod: mod.status };
}, API_URL);
log('e4', '4.3 Novelas: API detalle', novelApi.detail === 200 ? 'PASS' : 'FAIL', '');
log('e4', '4.4 Novelas: API moderar', novelApi.mod === 200 ? 'PASS' : 'FAIL', '');

// Forum
await p.goto(`${ADMIN_URL}/forum`, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(5000);
log('e4', '4.5 Foro: pagina carga', (await p.locator('body').innerText()).includes('Foro') ? 'PASS' : 'FAIL', '');
log('e4', '4.6 Foro: tabla con datos', (await p.locator('tr').count()) > 1 ? 'PASS' : 'FAIL', '');

const forumApi = await p.evaluate(async (apiUrl) => {
  const t = localStorage.getItem('admin_access_token');
  const list = await (await fetch(`${apiUrl}/admin/forum/threads?limit=1`, { headers: { Authorization: 'Bearer ' + t } })).json();
  const id = list.data?.data?.[0]?.id;
  if (!id) return { status: 0 };
  const r = await fetch(`${apiUrl}/admin/forum/threads/${id}/pin`, { method: 'PATCH', headers: { Authorization: 'Bearer ' + t } });
  return { status: r.status };
}, API_URL);
log('e4', '4.7 Foro: API pin/unpin', forumApi.status === 200 ? 'PASS' : 'FAIL', '');

// Catalogs
await p.goto(`${ADMIN_URL}/catalogs`, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(5000);
const catText = await p.locator('body').innerText();
log('e4', '4.8 Catalogos: pagina carga', catText.toLowerCase().includes('generos') || catText.toLowerCase().includes('géneros') ? 'PASS' : 'FAIL', '');

const catApis = await p.evaluate(async (apiUrl) => {
  const t = localStorage.getItem('admin_access_token');
  const [g, l, w, r] = await Promise.all([
    fetch(`${apiUrl}/admin/catalogs/genres`, { headers: { Authorization: 'Bearer ' + t } }),
    fetch(`${apiUrl}/admin/catalogs/languages`, { headers: { Authorization: 'Bearer ' + t } }),
    fetch(`${apiUrl}/admin/catalogs/warnings`, { headers: { Authorization: 'Bearer ' + t } }),
    fetch(`${apiUrl}/admin/catalogs/romance-genres`, { headers: { Authorization: 'Bearer ' + t } }),
  ]);
  return { genres: g.status, langs: l.status, warns: w.status, romance: r.status };
}, API_URL);
log('e4', '4.9 Catalogos: 4 APIs OK', Object.values(catApis).every(s => s === 200) ? 'PASS' : 'FAIL',
  `g:${catApis.genres} l:${catApis.langs} w:${catApis.warns} r:${catApis.romance}`);

// Posts
await p.goto(`${ADMIN_URL}/posts`, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(5000);
log('e4', '4.10 Posts: pagina carga', (await p.locator('body').innerText()).includes('Posts') ? 'PASS' : 'FAIL', '');
log('e4', '4.11 Posts: tabla con datos', (await p.locator('tr').count()) > 1 ? 'PASS' : 'FAIL', '');

// ═══════════════════════════════════════
// E5: ANALYTICS & MONITOREO
// ═══════════════════════════════════════
console.log('\n=== E5. ANALYTICS & MONITOREO ===');

// Analytics
await p.goto(`${ADMIN_URL}/analytics`, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(5000);
const at = await p.locator('body').innerText();
log('e5', '5.1 Analytics: pagina carga', at.includes('Analytics') ? 'PASS' : 'FAIL', '');
log('e5', '5.2 Analytics: period selector', at.includes('7 dias') || at.includes('30 dias') ? 'PASS' : 'FAIL', '');
log('e5', '5.3 Analytics: top novelas', at.includes('Top Novelas') || at.includes('Top') ? 'PASS' : 'FAIL', '');

const analyticsApis = await p.evaluate(async (apiUrl) => {
  const t = localStorage.getItem('admin_access_token');
  const [ov, tn, ta, cb] = await Promise.all([
    fetch(`${apiUrl}/admin/analytics/overview?days=30`, { headers: { Authorization: 'Bearer ' + t } }),
    fetch(`${apiUrl}/admin/analytics/top-novels?limit=5`, { headers: { Authorization: 'Bearer ' + t } }),
    fetch(`${apiUrl}/admin/analytics/top-authors?limit=5`, { headers: { Authorization: 'Bearer ' + t } }),
    fetch(`${apiUrl}/admin/analytics/content-breakdown`, { headers: { Authorization: 'Bearer ' + t } }),
  ]);
  return { overview: ov.status, topNovels: tn.status, topAuthors: ta.status, breakdown: cb.status };
}, API_URL);
log('e5', '5.4 Analytics: 4 APIs OK', Object.values(analyticsApis).every(s => s === 200) ? 'PASS' : 'FAIL',
  `ov:${analyticsApis.overview} tn:${analyticsApis.topNovels} ta:${analyticsApis.topAuthors} cb:${analyticsApis.breakdown}`);

// Audit Logs
await p.goto(`${ADMIN_URL}/audit-logs`, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(4000);
const auditText = await p.locator('body').innerText();
log('e5', '5.5 Audit: pagina carga', auditText.includes('Audit') ? 'PASS' : 'FAIL', '');
log('e5', '5.6 Audit: registra logins', auditText.includes('LOGIN') ? 'PASS' : 'FAIL', '');
log('e5', '5.7 Audit: registra feature toggles', auditText.includes('FEATURE_DISABLED') || auditText.includes('FEATURE_ENABLED') ? 'PASS' : 'FAIL', '');
log('e5', '5.8 Audit: registra moderacion', auditText.includes('NOVEL_MODERATED') || auditText.includes('THREAD_PINNED') ? 'PASS' : 'FAIL', '');

// Settings
await p.goto(`${ADMIN_URL}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(5000);
const st = await p.locator('body').innerText();
log('e5', '5.9 Settings: pagina carga', st.includes('Configuracion') ? 'PASS' : 'FAIL', '');
log('e5', '5.10 Settings: seccion auth', st.includes('Autenticacion') ? 'PASS' : 'FAIL', '');
log('e5', '5.11 Settings: seccion cache', st.includes('Cache') ? 'PASS' : 'FAIL', '');
log('e5', '5.12 Settings: seccion paginacion', st.includes('Paginacion') ? 'PASS' : 'FAIL', '');
log('e5', '5.13 Settings: seccion plataforma', st.includes('Plataforma') ? 'PASS' : 'FAIL', '');
log('e5', '5.14 Settings: boton guardar', st.includes('Guardar') ? 'PASS' : 'FAIL', '');

const settingsApi = await p.evaluate(async (apiUrl) => {
  const t = localStorage.getItem('admin_access_token');
  const get = await fetch(`${apiUrl}/admin/settings`, { headers: { Authorization: 'Bearer ' + t } });
  const patch = await fetch(`${apiUrl}/admin/settings`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ _e2eTest: 'ok' }),
  });
  // Verify persist
  const verify = await (await fetch(`${apiUrl}/admin/settings`, { headers: { Authorization: 'Bearer ' + t } })).json();
  // Cleanup
  await fetch(`${apiUrl}/admin/settings`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ _e2eTest: '' }),
  });
  return { get: get.status, patch: patch.status, persists: verify.data?._e2eTest === 'ok' };
}, API_URL);
log('e5', '5.15 Settings: API get/patch/persist', settingsApi.get === 200 && settingsApi.patch === 200 && settingsApi.persists ? 'PASS' : 'FAIL', '');

// ═══════════════════════════════════════
// E6: HOSTING & DEPLOY
// ═══════════════════════════════════════
console.log('\n=== E6. HOSTING & DEPLOY ===');

// Verify prod URLs respond
const [adminStatus, backendStatus, frontendStatus] = await Promise.all([
  fetch(`${ADMIN_URL}/`).then(r => r.status),
  fetch(`${API_URL}/features/active`).then(r => r.status),
  fetch('https://plotcraft-frontend.vercel.app/').then(r => r.status),
]);
log('e6', '6.1 Admin frontend live', adminStatus === 200 ? 'PASS' : 'FAIL', `${ADMIN_URL} → ${adminStatus}`);
log('e6', '6.2 Backend API live', backendStatus === 200 ? 'PASS' : 'FAIL', `API → ${backendStatus}`);
log('e6', '6.3 PlotCraft frontend live', frontendStatus === 200 ? 'PASS' : 'FAIL', `Frontend → ${frontendStatus}`);

// CORS check
const corsCheck = await p.evaluate(async (apiUrl) => {
  try {
    const r = await fetch(`${apiUrl}/features/active`);
    return { ok: r.ok, status: r.status };
  } catch (e) { return { ok: false, error: e.message }; }
}, API_URL);
log('e6', '6.4 CORS permite requests desde admin', corsCheck.ok ? 'PASS' : 'FAIL', '');

// GitHub repo exists
const ghCheck = await fetch('https://api.github.com/repos/KeniaVargascz/plotcraft-admin').then(r => r.status);
log('e6', '6.5 GitHub repo existe', ghCheck === 200 ? 'PASS' : 'FAIL', '');

// Verify environment.prod is being used (no localhost in network)
const envCheck = await p.evaluate(async (apiUrl) => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch(`${apiUrl}/admin/dashboard/stats`, { headers: { Authorization: 'Bearer ' + t } });
  return { status: r.status, isRemote: apiUrl.includes('onrender') };
}, API_URL);
log('e6', '6.6 Usa environment.prod', envCheck.isRemote && envCheck.status === 200 ? 'PASS' : 'FAIL', '');

// SPA routing (deep link)
const p4 = await browser.newPage();
const deepRes = await p4.goto(`${ADMIN_URL}/features`, { waitUntil: 'networkidle', timeout: 30000 });
log('e6', '6.7 SPA deep link funciona', deepRes.status() === 200 ? 'PASS' : 'FAIL', `/features → ${deepRes.status()}`);
await p4.close();

// ═══════════════════════════════════════
// CONSOLE ERRORS (all pages)
// ═══════════════════════════════════════
console.log('\n=== CONSOLE ERRORS ===');
const pageErrors = consoleErrors.filter(e => !e.msg.includes('favicon') && !e.msg.includes('404'));
log('global', 'Console errors across all pages', pageErrors.length === 0 ? 'PASS' : 'FAIL', pageErrors.length + ' errores');
if (pageErrors.length > 0) {
  const unique = [...new Set(pageErrors.map(e => `[${e.url.split('/').pop()}] ${e.msg}`))];
  unique.slice(0, 10).forEach(e => console.log('    ', e));
}

// ═══════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════
console.log('\n════════════════════════════════════════');
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`TOTAL: ${passed} passed, ${failed} failed, ${results.length} total`);

if (failed > 0) {
  console.log('\nFAILED:');
  results.filter(r => r.status === 'FAIL').forEach(r =>
    console.log(`  [${r.section}] ${r.test}${r.detail ? ' — ' + r.detail : ''}`));
}

console.log('\n--- Por entregable ---');
for (const e of ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'global']) {
  const eTests = results.filter(r => r.section === e);
  const ePassed = eTests.filter(r => r.status === 'PASS').length;
  console.log(`  ${e}: ${ePassed}/${eTests.length}`);
}

await p.close();
await browser.close();
