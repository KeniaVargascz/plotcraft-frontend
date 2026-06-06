import { chromium } from '@playwright/test';

const results = [];
const log = (section, test, status, detail) => {
  results.push({ section, test, status, detail });
  console.log(status === 'PASS' ? '  OK' : '  FAIL', test, detail ? '— ' + detail : '');
};

const browser = await chromium.launch();
const p = await browser.newPage();

// Login
await p.goto('http://localhost:4202/login', { waitUntil: 'networkidle' });
await p.locator('input[name="email"]').fill('admin@plotcraft.com');
await p.locator('input[name="password"]').fill('Admin1234!');
await p.getByRole('button', { name: /iniciar/i }).click();
await p.waitForTimeout(3000);
console.log('Login:', p.url().includes('/dashboard') ? 'OK' : 'FAIL');

// Helper: get token
const getToken = () => p.evaluate(() => localStorage.getItem('admin_access_token'));

// ========================================
// ENTREGABLE 4: CONTENT MANAGEMENT
// ========================================

// === 1. NOVELS ===
console.log('\n=== E4.1 NOVELAS ===');
await p.goto('http://localhost:4202/novels', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const novelsText = await p.locator('body').innerText();
log('novels', '1.1 Pagina carga', novelsText.includes('Novelas') ? 'PASS' : 'FAIL', '');

const novelRows = await p.locator('tr').count();
log('novels', '1.2 Tabla tiene filas', novelRows > 1 ? 'PASS' : 'FAIL', novelRows + ' rows');

// API: list
const novelList = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/novels?page=1&limit=5', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, total: body.data?.pagination?.total, hasData: body.data?.data?.length > 0 };
});
log('novels', '1.3 API listar novelas', novelList.status === 200 && novelList.hasData ? 'PASS' : 'FAIL', 'total=' + novelList.total);

// API: detail
const novelDetail = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const list = await (await fetch('http://localhost:3000/api/v1/admin/novels?limit=1', { headers: { Authorization: 'Bearer ' + t } })).json();
  const id = list.data?.data?.[0]?.id;
  if (!id) return { status: 0 };
  const r = await fetch('http://localhost:3000/api/v1/admin/novels/' + id, { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, hasCount: !!body.data?._count, title: body.data?.title };
});
log('novels', '1.4 API detalle novela', novelDetail.status === 200 ? 'PASS' : 'FAIL', novelDetail.title);

// API: moderate (change visibility)
const novelMod = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const list = await (await fetch('http://localhost:3000/api/v1/admin/novels?limit=1', { headers: { Authorization: 'Bearer ' + t } })).json();
  const id = list.data?.data?.[0]?.id;
  if (!id) return { status: 0 };
  const r = await fetch('http://localhost:3000/api/v1/admin/novels/' + id, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ isPublic: true }),
  });
  return { status: r.status };
});
log('novels', '1.5 API moderar novela', novelMod.status === 200 ? 'PASS' : 'FAIL', 'status=' + novelMod.status);

// === 2. FORUM ===
console.log('\n=== E4.2 FORO ===');
await p.goto('http://localhost:4202/forum', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const forumText = await p.locator('body').innerText();
log('forum', '2.1 Pagina carga', forumText.includes('Foro') ? 'PASS' : 'FAIL', '');

const forumRows = await p.locator('tr').count();
log('forum', '2.2 Tabla tiene filas', forumRows > 1 ? 'PASS' : 'FAIL', forumRows + ' rows');

// API: list threads
const threadList = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/forum/threads?page=1&limit=5', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, total: body.data?.pagination?.total };
});
log('forum', '2.3 API listar hilos', threadList.status === 200 ? 'PASS' : 'FAIL', 'total=' + threadList.total);

// API: pin toggle
const pinTest = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const list = await (await fetch('http://localhost:3000/api/v1/admin/forum/threads?limit=1', { headers: { Authorization: 'Bearer ' + t } })).json();
  const id = list.data?.data?.[0]?.id;
  if (!id) return { status: 0, error: 'no threads' };
  const r = await fetch('http://localhost:3000/api/v1/admin/forum/threads/' + id + '/pin', {
    method: 'PATCH', headers: { Authorization: 'Bearer ' + t },
  });
  return { status: r.status };
});
log('forum', '2.4 API pin/unpin hilo', pinTest.status === 200 ? 'PASS' : 'FAIL', 'status=' + pinTest.status);

// === 3. CATALOGS ===
console.log('\n=== E4.3 CATALOGOS ===');
await p.goto('http://localhost:4202/catalogs', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const catalogsText = await p.locator('body').innerText();
log('catalogs', '3.1 Pagina carga', catalogsText.toLowerCase().includes('catálogos') || catalogsText.toLowerCase().includes('catalogos') || catalogsText.toLowerCase().includes('generos') || catalogsText.toLowerCase().includes('géneros') ? 'PASS' : 'FAIL', '');

// API: genres
const genresRes = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/catalogs/genres', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, count: body.data?.length };
});
log('catalogs', '3.2 API listar generos', genresRes.status === 200 ? 'PASS' : 'FAIL', genresRes.count + ' generos');

// API: languages
const langsRes = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/catalogs/languages', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, count: body.data?.length };
});
log('catalogs', '3.3 API listar idiomas', langsRes.status === 200 ? 'PASS' : 'FAIL', langsRes.count + ' idiomas');

// API: warnings
const warnsRes = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/catalogs/warnings', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, count: body.data?.length };
});
log('catalogs', '3.4 API listar warnings', warnsRes.status === 200 ? 'PASS' : 'FAIL', warnsRes.count + ' warnings');

// API: romance genres
const rgRes = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/catalogs/romance-genres', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, count: body.data?.length };
});
log('catalogs', '3.5 API listar romance genres', rgRes.status === 200 ? 'PASS' : 'FAIL', rgRes.count + ' romance genres');

// === 4. POSTS ===
console.log('\n=== E4.4 POSTS ===');
await p.goto('http://localhost:4202/posts', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const postsText = await p.locator('body').innerText();
log('posts', '4.1 Pagina carga', postsText.includes('Posts') ? 'PASS' : 'FAIL', '');

const postRows = await p.locator('tr').count();
log('posts', '4.2 Tabla tiene filas', postRows > 1 ? 'PASS' : 'FAIL', postRows + ' rows');

// API: list posts
const postList = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/posts?page=1&limit=5', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, total: body.data?.pagination?.total };
});
log('posts', '4.3 API listar posts', postList.status === 200 ? 'PASS' : 'FAIL', 'total=' + postList.total);

// ========================================
// ENTREGABLE 5: ANALYTICS & MONITOREO
// ========================================

// === 5. ANALYTICS ===
console.log('\n=== E5.1 ANALYTICS ===');
await p.goto('http://localhost:4202/analytics', { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);
const analyticsText = await p.locator('body').innerText();
log('analytics', '5.1 Pagina carga', analyticsText.includes('Analytics') ? 'PASS' : 'FAIL', '');

// API: overview
const overviewRes = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/analytics/overview?days=30', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, hasMetrics: !!body.data?.metrics, period: body.data?.period };
});
log('analytics', '5.2 API overview con deltas', overviewRes.status === 200 && overviewRes.hasMetrics ? 'PASS' : 'FAIL', 'period=' + overviewRes.period);

// API: top novels
const topNovels = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/analytics/top-novels?limit=5', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, count: body.data?.length };
});
log('analytics', '5.3 API top novelas', topNovels.status === 200 ? 'PASS' : 'FAIL', topNovels.count + ' novelas');

// API: top authors
const topAuthors = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/analytics/top-authors?limit=5', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, count: body.data?.length };
});
log('analytics', '5.4 API top autores', topAuthors.status === 200 ? 'PASS' : 'FAIL', topAuthors.count + ' autores');

// API: content breakdown
const breakdown = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/analytics/content-breakdown', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return {
    status: r.status,
    hasByStatus: !!body.data?.novelsByStatus,
    hasByRating: !!body.data?.novelsByRating,
    hasByType: !!body.data?.novelsByType,
    hasByCat: !!body.data?.threadsByCategory,
  };
});
log('analytics', '5.5 API content breakdown', breakdown.status === 200 && breakdown.hasByStatus ? 'PASS' : 'FAIL',
  `status:${breakdown.hasByStatus} rating:${breakdown.hasByRating} type:${breakdown.hasByType} cat:${breakdown.hasByCat}`);

// Check charts rendered
const hasCharts = analyticsText.includes('Top Novelas') || analyticsText.includes('top') || analyticsText.includes('Top');
log('analytics', '5.6 Muestra tablas/charts', hasCharts ? 'PASS' : 'FAIL', '');

// Period selector
const hasPeriod = analyticsText.includes('7 dias') || analyticsText.includes('30 dias') || analyticsText.includes('90 dias');
log('analytics', '5.7 Period selector visible', hasPeriod ? 'PASS' : 'FAIL', '');

// === 6. AUDIT LOGS (improved) ===
console.log('\n=== E5.2 AUDIT LOGS (mejorado) ===');
await p.goto('http://localhost:4202/audit-logs', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
const auditText = await p.locator('body').innerText();
log('audit', '6.1 Pagina carga', auditText.includes('Audit') ? 'PASS' : 'FAIL', '');
log('audit', '6.2 Registra moderacion de novela', auditText.includes('NOVEL_MODERATED') ? 'PASS' : 'FAIL', '');
log('audit', '6.3 Registra pin de hilo', auditText.includes('THREAD_PINNED') || auditText.includes('THREAD_UNPINNED') ? 'PASS' : 'FAIL', '');

// API: filtered query
const auditFiltered = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/audit-logs?resourceType=novel&limit=5', { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, count: body.data?.data?.length };
});
log('audit', '6.4 API filtro por resourceType', auditFiltered.status === 200 ? 'PASS' : 'FAIL', auditFiltered.count + ' resultados');

// === 7. SETTINGS ===
console.log('\n=== E5.3 SETTINGS ===');
await p.goto('http://localhost:4202/settings', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const settingsText = await p.locator('body').innerText();
log('settings', '7.1 Pagina carga', settingsText.toLowerCase().includes('configuraci') || settingsText.toLowerCase().includes('settings') ? 'PASS' : 'FAIL', '');

// API: get settings
const settingsGet = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/settings', { headers: { Authorization: 'Bearer ' + t } });
  return { status: r.status, body: await r.json() };
});
log('settings', '7.2 API get settings', settingsGet.status === 200 ? 'PASS' : 'FAIL', 'status=' + settingsGet.status);

// API: update setting
const settingsUpdate = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/settings', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ testSetting: 'testValue' }),
  });
  return { status: r.status };
});
log('settings', '7.3 API update setting', settingsUpdate.status === 200 ? 'PASS' : 'FAIL', '');

// Verify setting was saved
const settingsVerify = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await (await fetch('http://localhost:3000/api/v1/admin/settings', { headers: { Authorization: 'Bearer ' + t } })).json();
  return { hasTest: r.data?.testSetting === 'testValue' };
});
log('settings', '7.4 Setting persiste en DB', settingsVerify.hasTest ? 'PASS' : 'FAIL', '');

// Clean up test setting
await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  await fetch('http://localhost:3000/api/v1/admin/settings', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ testSetting: '' }),
  });
});

// === 8. NAV COMPLETA ===
console.log('\n=== 8. NAVEGACION COMPLETA ===');
await p.goto('http://localhost:4202/dashboard', { waitUntil: 'networkidle' });
const nav = await p.locator('aside, .sidenav').first().innerText();
const navItems = ['Dashboard', 'Feature', 'Audit', 'Usuarios', 'Comunidades', 'Novelas', 'Foro', 'Catalogos', 'Posts', 'Analytics', 'Configuraci'];
for (const item of navItems) {
  log('nav', `8.x Nav: ${item}`, nav.includes(item) || nav.toLowerCase().includes(item.toLowerCase()) ? 'PASS' : 'FAIL', '');
}

// === 9. CONSOLE ERRORS ===
console.log('\n=== 9. CONSOLE ERRORS ===');
const errors = [];
p.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

for (const route of ['/novels', '/forum', '/catalogs', '/posts', '/analytics', '/settings']) {
  await p.goto('http://localhost:4202' + route, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
}
log('console', '9.1 Console errors en paginas E4/E5', errors.length === 0 ? 'PASS' : 'FAIL', errors.length + ' errores');
if (errors.length > 0) {
  errors.slice(0, 5).forEach(e => console.log('    ERR:', e.substring(0, 150)));
}

// === SUMMARY ===
console.log('\n========================================');
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`TOTAL: ${passed} passed, ${failed} failed, ${results.length} total`);
if (failed > 0) {
  console.log('\nFAILED:');
  results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  [${r.section}] ${r.test} — ${r.detail || ''}`));
}

await p.close();
await browser.close();
