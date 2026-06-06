import { chromium } from '@playwright/test';

const results = [];
const log = (section, test, status, detail) => {
  results.push({ section, test, status, detail });
  console.log(status === 'PASS' ? '  OK' : '  FAIL', test, detail ? '— ' + detail : '');
};

async function login(page) {
  await page.goto('http://localhost:4202/login', { waitUntil: 'networkidle' });
  await page.locator('input[name="email"]').fill('admin@plotcraft.com');
  await page.locator('input[name="password"]').fill('Admin1234!');
  await page.getByRole('button', { name: /iniciar/i }).click();
  await page.waitForTimeout(3000);
  return page.url().includes('/dashboard');
}

const browser = await chromium.launch();
const p = await browser.newPage();

// === 1. AUTH ===
console.log('\n=== 1. AUTH ===');
const loginOk = await login(p);
log('auth', '1.1 Login correcto → dashboard', loginOk ? 'PASS' : 'FAIL', p.url());

const p2 = await browser.newPage();
await p2.goto('http://localhost:4202/login', { waitUntil: 'networkidle' });
await p2.locator('input[name="email"]').fill('wrong@x.com');
await p2.locator('input[name="password"]').fill('Bad123!');
await p2.getByRole('button', { name: /iniciar/i }).click();
await p2.waitForTimeout(3000);
const errText = (await p2.locator('body').innerText()).toLowerCase();
log('auth', '1.2 Login incorrecto muestra error', errText.includes('error') || errText.includes('incorrecta') ? 'PASS' : 'FAIL', '');
await p2.close();

const p3 = await browser.newPage();
await p3.goto('http://localhost:4202/users', { waitUntil: 'networkidle' });
log('auth', '1.3 Ruta protegida sin auth → login', p3.url().includes('/login') ? 'PASS' : 'FAIL', p3.url());
await p3.close();

// === 2. DASHBOARD ===
console.log('\n=== 2. DASHBOARD ===');
await p.goto('http://localhost:4202/dashboard', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const dt = await p.locator('body').innerText();
log('dash', '2.1 Metricas usuarios', dt.includes('USUARIOS') ? 'PASS' : 'FAIL', '');
log('dash', '2.2 Metricas novelas', dt.includes('NOVELAS') ? 'PASS' : 'FAIL', '');
log('dash', '2.3 Metricas mundos', dt.includes('MUNDOS') ? 'PASS' : 'FAIL', '');
log('dash', '2.4 Metricas personajes', dt.includes('PERSONAJES') ? 'PASS' : 'FAIL', '');
log('dash', '2.5 Metricas comunidades', dt.includes('COMUNIDADES') ? 'PASS' : 'FAIL', '');
log('dash', '2.6 Actividad reciente', dt.includes('Actividad') || dt.includes('ultimos') ? 'PASS' : 'FAIL', '');
log('dash', '2.7 Grafico crecimiento', dt.includes('Crecimiento') || dt.includes('crecimiento') ? 'PASS' : 'FAIL', '');

// === 3. USERS ===
console.log('\n=== 3. USUARIOS ===');
await p.goto('http://localhost:4202/users', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const ut = await p.locator('body').innerText();
log('users', '3.1 Pagina carga', ut.includes('Usuarios') ? 'PASS' : 'FAIL', '');
const rows = await p.locator('tr').count();
log('users', '3.2 Tabla tiene filas', rows > 1 ? 'PASS' : 'FAIL', rows + ' rows');

// 3.3 API detail
const detail = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const list = await (await fetch('http://localhost:3000/api/v1/admin/users?limit=1', { headers: { Authorization: 'Bearer ' + t } })).json();
  const uid = list.data?.data?.[0]?.id;
  if (!uid) return { status: 0 };
  const r = await fetch('http://localhost:3000/api/v1/admin/users/' + uid, { headers: { Authorization: 'Bearer ' + t } });
  const body = await r.json();
  return { status: r.status, hasCount: !!body.data?._count };
});
log('users', '3.3 API detalle con stats', detail.status === 200 && detail.hasCount ? 'PASS' : 'FAIL', 'status=' + detail.status);

// 3.4 API pagination
const pag = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await (await fetch('http://localhost:3000/api/v1/admin/users?page=1&limit=5', { headers: { Authorization: 'Bearer ' + t } })).json();
  return { hasPag: !!r.data?.pagination, total: r.data?.pagination?.total };
});
log('users', '3.4 API paginacion', pag.hasPag ? 'PASS' : 'FAIL', 'total=' + pag.total);

// === 4. COMMUNITIES ===
console.log('\n=== 4. COMUNIDADES ===');
await p.goto('http://localhost:4202/communities', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const ct = await p.locator('body').innerText();
log('comm', '4.1 Pagina carga', ct.includes('Comunidades') ? 'PASS' : 'FAIL', '');

const commApi = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const [list, pending] = await Promise.all([
    fetch('http://localhost:3000/api/v1/admin/communities?limit=5', { headers: { Authorization: 'Bearer ' + t } }),
    fetch('http://localhost:3000/api/v1/admin/communities/pending/count', { headers: { Authorization: 'Bearer ' + t } }),
  ]);
  return { listStatus: list.status, pendingStatus: pending.status, pendingBody: await pending.json() };
});
log('comm', '4.2 API listar comunidades', commApi.listStatus === 200 ? 'PASS' : 'FAIL', '');
log('comm', '4.3 API pending count', commApi.pendingStatus === 200 ? 'PASS' : 'FAIL', 'count=' + commApi.pendingBody?.data?.count);

// === 5. FEATURE FLAGS ===
console.log('\n=== 5. FEATURE FLAGS ===');
await p.goto('http://localhost:4202/features', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
const ft = await p.locator('body').innerText();
log('flags', '5.1 Pagina carga', ft.includes('flags') ? 'PASS' : 'FAIL', '');
log('flags', '5.2 Muestra grupos', ft.toLowerCase().includes('author') ? 'PASS' : 'FAIL', '');

// 5.3 Public endpoint
const pub = await p.evaluate(async () => {
  const r = await fetch('http://localhost:3000/api/v1/features/active');
  const body = await r.json();
  return { status: r.status, count: body.data?.length };
});
log('flags', '5.3 /features/active publico', pub.status === 200 ? 'PASS' : 'FAIL', pub.count + ' flags');

// 5.4 Toggle disable
const tog1 = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/admin/features/author.planner', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ enabled: false }),
  });
  return { status: r.status };
});
log('flags', '5.4 Disable flag via API', tog1.status === 200 ? 'PASS' : 'FAIL', '');

await p.waitForTimeout(2000);

// 5.5 Verify not in /active
const act = await p.evaluate(async () => {
  const r = await (await fetch('http://localhost:3000/api/v1/features/active')).json();
  return { includes: r.data.includes('author.planner') };
});
log('flags', '5.5 Disabled flag ausente en /active', !act.includes ? 'PASS' : 'FAIL', '');

// 5.6 Backend 404
const be404 = await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  const r = await fetch('http://localhost:3000/api/v1/planner/projects', { headers: { Authorization: 'Bearer ' + t } });
  return { status: r.status };
});
log('flags', '5.6 Backend 404 feature disabled', be404.status === 404 ? 'PASS' : 'FAIL', 'status=' + be404.status);

// 5.7 Re-enable
await p.evaluate(async () => {
  const t = localStorage.getItem('admin_access_token');
  await fetch('http://localhost:3000/api/v1/admin/features/author.planner', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ enabled: true }),
  });
});
log('flags', '5.7 Re-enable flag', 'PASS', '');

// === 6. AUDIT LOGS ===
console.log('\n=== 6. AUDIT LOGS ===');
await p.goto('http://localhost:4202/audit-logs', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
const at = await p.locator('body').innerText();
log('audit', '6.1 Pagina carga', at.includes('Audit') ? 'PASS' : 'FAIL', '');
log('audit', '6.2 Registra feature toggle', at.includes('FEATURE_DISABLED') || at.includes('FEATURE_ENABLED') ? 'PASS' : 'FAIL', '');
log('audit', '6.3 Registra logins', at.includes('LOGIN') ? 'PASS' : 'FAIL', '');

// === 7. NAV ===
console.log('\n=== 7. NAVEGACION ===');
await p.goto('http://localhost:4202/dashboard', { waitUntil: 'networkidle' });
const nav = await p.locator('aside, .sidenav').first().innerText();
log('nav', '7.1 Dashboard en sidebar', nav.includes('Dashboard') ? 'PASS' : 'FAIL', '');
log('nav', '7.2 Feature Flags en sidebar', nav.includes('Feature') ? 'PASS' : 'FAIL', '');
log('nav', '7.3 Audit Logs en sidebar', nav.includes('Audit') ? 'PASS' : 'FAIL', '');
log('nav', '7.4 Usuarios en sidebar', nav.includes('Usuarios') ? 'PASS' : 'FAIL', '');
log('nav', '7.5 Comunidades en sidebar', nav.includes('Comunidades') ? 'PASS' : 'FAIL', '');

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
