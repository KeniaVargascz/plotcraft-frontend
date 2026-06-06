import { chromium } from '@playwright/test';

const FRONTEND_URL = 'https://plotcraft-frontend.vercel.app';
const API_URL = 'https://plotcraft-backend.onrender.com/api/v1';

const results = [];
const log = (phase, test, status, detail) => {
  results.push({ phase, test, status, detail });
  const icon = status === 'PASS' ? '  OK' : '  FAIL';
  console.log(`${icon} ${test}${detail ? ' — ' + detail : ''}`);
};

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
async function adminLogin() {
  const r = await fetch(`${API_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@plotcraft.com', password: 'Admin1234!' }),
  });
  return (await r.json()).data.accessToken;
}

async function setFeatureFlag(token, key, enabled) {
  const r = await fetch(`${API_URL}/admin/features/${key}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ enabled }),
  });
  return r.status;
}

async function getActiveFlags() {
  const r = await fetch(`${API_URL}/features/active?_t=${Date.now()}`);
  return (await r.json()).data;
}

/** Open a fresh browser context, login as demo user, return page */
async function freshLogin(browser) {
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await pg.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await pg.waitForTimeout(2000);
  await pg.locator('#identifier').fill('demo@plotcraft.com');
  await pg.locator('input[formcontrolname="password"]').fill('Demo1234!');
  await pg.locator('button[type="submit"]').click();
  await pg.waitForTimeout(5000);
  return { ctx, page: pg };
}

const FLAGS_TO_TEST = [
  'social.feed',
  'explore.search',
  'author.novels',
  'community.communities',
  'reader.library',
];

const FLAG_ROUTE_MAP = {
  'social.feed': '/feed',
  'explore.search': '/buscar',
  'author.novels': '/mis-novelas',
  'community.communities': '/comunidades',
  'reader.library': '/biblioteca',
};

const FLAG_NAV_LABELS = {
  'social.feed': ['Feed'],
  'explore.search': ['Buscar', 'Explorar'],
  'author.novels': ['Mis Novelas', 'Novelas'],
  'community.communities': ['Comunidades'],
  'reader.library': ['Biblioteca'],
};

// ═══════════════════════════════════════
// SETUP
// ═══════════════════════════════════════
console.log('═══════════════════════════════════════');
console.log(' ADMIN ↔ FRONTEND COORDINATION TEST');
console.log(' (Feature Flag toggle verification)');
console.log('═══════════════════════════════════════');
console.log('\n=== SETUP ===');

const adminToken = await adminLogin();
console.log('  Admin logged in');

// Ensure all flags start ENABLED
for (const f of FLAGS_TO_TEST) await setFeatureFlag(adminToken, f, true);
await new Promise(r => setTimeout(r, 2000));
console.log('  All 5 test flags ensured ENABLED');

const browser = await chromium.launch();

// ═══════════════════════════════════════
// PHASE 1: BASELINE — All features ENABLED
// ═══════════════════════════════════════
console.log('\n=== FASE 1: BASELINE (todos los flags ACTIVOS) ===');

const activeBaseline = await getActiveFlags();
for (const f of FLAGS_TO_TEST) {
  log('baseline', `API: ${f} activo`, activeBaseline.includes(f) ? 'PASS' : 'FAIL', '');
}

// Login fresh and test routes
const s1 = await freshLogin(browser);
log('baseline', 'Login demo_writer exitoso', !s1.page.url().includes('/login') ? 'PASS' : 'FAIL', s1.page.url().split('.app')[1]);

for (const f of FLAGS_TO_TEST) {
  const route = FLAG_ROUTE_MAP[f];
  await s1.page.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await s1.page.waitForTimeout(2000);
  const stayed = s1.page.url().includes(route);
  log('baseline', `Ruta ${route} accesible`, stayed ? 'PASS' : 'FAIL',
    stayed ? 'OK' : `redirigió a ${s1.page.url().split('.app')[1]}`);
}

// Check nav
await s1.page.goto(`${FRONTEND_URL}/feed`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await s1.page.waitForTimeout(2000);
const navBaseline = await s1.page.locator('body').innerText();
for (const f of FLAGS_TO_TEST) {
  const labels = FLAG_NAV_LABELS[f];
  const found = labels.some(l => navBaseline.includes(l));
  log('baseline', `Nav: "${labels[0]}" visible`, found ? 'PASS' : 'FAIL', found ? '' : 'no encontrado en nav');
}
await s1.ctx.close();

// ═══════════════════════════════════════
// PHASE 2: ADMIN DISABLES 5 features
// ═══════════════════════════════════════
console.log('\n=== FASE 2: ADMIN DESACTIVA 5 FEATURES ===');

for (const f of FLAGS_TO_TEST) {
  const st = await setFeatureFlag(adminToken, f, false);
  log('admin-off', `Admin desactivó ${f}`, st === 200 ? 'PASS' : 'FAIL', `HTTP ${st}`);
}

console.log('  Esperando invalidación de cache (3s)...');
await new Promise(r => setTimeout(r, 3000));

const activeAfterDisable = await getActiveFlags();
for (const f of FLAGS_TO_TEST) {
  const isActive = activeAfterDisable.includes(f);
  log('admin-off', `API confirma ${f} desactivado`, !isActive ? 'PASS' : 'FAIL', isActive ? 'AÚN ACTIVO' : 'OK');
}

// ═══════════════════════════════════════
// PHASE 3: FRONTEND verifies disabled
// (Fresh login = FeatureFlagService re-fetches)
// ═══════════════════════════════════════
console.log('\n=== FASE 3: FRONTEND VERIFICA FEATURES DESACTIVADOS ===');
console.log('  (Sesión fresca → FeatureFlagService carga flags actualizados)');

const s3 = await freshLogin(browser);

for (const f of FLAGS_TO_TEST) {
  const route = FLAG_ROUTE_MAP[f];
  await s3.page.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await s3.page.waitForTimeout(2000);
  const url = s3.page.url();
  const blocked = !url.includes(route);
  log('frontend-off', `Ruta ${route} BLOQUEADA (${f} off)`, blocked ? 'PASS' : 'FAIL',
    blocked ? `redirigió a ${url.split('.app')[1]}` : 'ruta aún accesible!');
}

// Check nav — go to a route not affected by our flags
await s3.page.goto(`${FRONTEND_URL}/descubrir`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await s3.page.waitForTimeout(3000);
// If discovery is also blocked, try profile
if (s3.page.url().includes('/login')) {
  const s3b = await freshLogin(browser);
  await s3b.page.goto(`${FRONTEND_URL}/perfil`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await s3b.page.waitForTimeout(2000);
  const navD = await s3b.page.locator('body').innerText();
  for (const f of FLAGS_TO_TEST) {
    const labels = FLAG_NAV_LABELS[f];
    const found = labels.some(l => navD.includes(l));
    log('frontend-off', `Nav: "${labels[0]}" OCULTO (${f} off)`, !found ? 'PASS' : 'FAIL',
      found ? 'aún visible!' : 'oculto');
  }
  await s3b.ctx.close();
} else {
  const navD = await s3.page.locator('body').innerText();
  for (const f of FLAGS_TO_TEST) {
    const labels = FLAG_NAV_LABELS[f];
    const found = labels.some(l => navD.includes(l));
    log('frontend-off', `Nav: "${labels[0]}" OCULTO (${f} off)`, !found ? 'PASS' : 'FAIL',
      found ? 'aún visible!' : 'oculto');
  }
}
await s3.ctx.close();

// ═══════════════════════════════════════
// PHASE 4: ADMIN RE-ENABLES features
// ═══════════════════════════════════════
console.log('\n=== FASE 4: ADMIN RE-ACTIVA 5 FEATURES ===');

for (const f of FLAGS_TO_TEST) {
  const st = await setFeatureFlag(adminToken, f, true);
  log('admin-on', `Admin activó ${f}`, st === 200 ? 'PASS' : 'FAIL', `HTTP ${st}`);
}

console.log('  Esperando invalidación de cache (3s)...');
await new Promise(r => setTimeout(r, 3000));

const activeAfterEnable = await getActiveFlags();
for (const f of FLAGS_TO_TEST) {
  const isActive = activeAfterEnable.includes(f);
  log('admin-on', `API confirma ${f} activado`, isActive ? 'PASS' : 'FAIL', !isActive ? 'AÚN DESACTIVADO' : 'OK');
}

// ═══════════════════════════════════════
// PHASE 5: FRONTEND verifies re-enabled
// ═══════════════════════════════════════
console.log('\n=== FASE 5: FRONTEND VERIFICA FEATURES RE-ACTIVADOS ===');

const s5 = await freshLogin(browser);

for (const f of FLAGS_TO_TEST) {
  const route = FLAG_ROUTE_MAP[f];
  await s5.page.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await s5.page.waitForTimeout(2000);
  const stayed = s5.page.url().includes(route);
  log('frontend-on', `Ruta ${route} ACCESIBLE (${f} on)`, stayed ? 'PASS' : 'FAIL',
    stayed ? 'OK' : `redirigió a ${s5.page.url().split('.app')[1]}`);
}

await s5.page.goto(`${FRONTEND_URL}/feed`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await s5.page.waitForTimeout(2000);
const navEnabled = await s5.page.locator('body').innerText();
for (const f of FLAGS_TO_TEST) {
  const labels = FLAG_NAV_LABELS[f];
  const found = labels.some(l => navEnabled.includes(l));
  log('frontend-on', `Nav: "${labels[0]}" visible (${f} on)`, found ? 'PASS' : 'FAIL', found ? '' : 'no encontrado');
}
await s5.ctx.close();

// ═══════════════════════════════════════
// PHASE 6: INDIVIDUAL TOGGLE TEST
// ═══════════════════════════════════════
console.log('\n=== FASE 6: TOGGLE INDIVIDUAL (social.feed) ===');

// Disable only social.feed
await setFeatureFlag(adminToken, 'social.feed', false);
await new Promise(r => setTimeout(r, 2000));

const s6a = await freshLogin(browser);
await s6a.page.goto(`${FRONTEND_URL}/feed`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await s6a.page.waitForTimeout(2000);
const feedBlocked = !s6a.page.url().includes('/feed');
log('toggle', '/feed BLOQUEADO (solo social.feed off)', feedBlocked ? 'PASS' : 'FAIL', s6a.page.url().split('.app')[1]);

await s6a.page.goto(`${FRONTEND_URL}/buscar`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await s6a.page.waitForTimeout(2000);
log('toggle', '/buscar sigue OK (explore.search no tocado)', s6a.page.url().includes('/buscar') ? 'PASS' : 'FAIL', s6a.page.url().split('.app')[1]);

await s6a.page.goto(`${FRONTEND_URL}/biblioteca`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await s6a.page.waitForTimeout(2000);
log('toggle', '/biblioteca sigue OK (reader.library no tocado)', s6a.page.url().includes('/biblioteca') ? 'PASS' : 'FAIL', s6a.page.url().split('.app')[1]);
await s6a.ctx.close();

// Re-enable
await setFeatureFlag(adminToken, 'social.feed', true);
await new Promise(r => setTimeout(r, 2000));

const s6b = await freshLogin(browser);
await s6b.page.goto(`${FRONTEND_URL}/feed`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await s6b.page.waitForTimeout(2000);
log('toggle', '/feed RESTAURADO (social.feed re-enabled)', s6b.page.url().includes('/feed') ? 'PASS' : 'FAIL', s6b.page.url().split('.app')[1]);
await s6b.ctx.close();

// ═══════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════
console.log('\n=== CLEANUP ===');
for (const f of FLAGS_TO_TEST) await setFeatureFlag(adminToken, f, true);
const finalActive = await getActiveFlags();
const allRestored = FLAGS_TO_TEST.every(f => finalActive.includes(f));
log('cleanup', 'Todos los flags restaurados', allRestored ? 'PASS' : 'FAIL', `${finalActive.length} flags activos`);

// ═══════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════
await browser.close();

console.log('\n═══════════════════════════════════════════════════');
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`TOTAL: ${passed} passed, ${failed} failed, ${results.length} total`);

if (failed > 0) {
  console.log('\nFAILED:');
  results.filter(r => r.status === 'FAIL').forEach(r =>
    console.log(`  [${r.phase}] ${r.test}${r.detail ? ' — ' + r.detail : ''}`));
}

console.log('\n--- Por fase ---');
for (const phase of ['baseline', 'admin-off', 'frontend-off', 'admin-on', 'frontend-on', 'toggle', 'cleanup']) {
  const pTests = results.filter(r => r.phase === phase);
  if (pTests.length > 0) {
    const pPassed = pTests.filter(r => r.status === 'PASS').length;
    console.log(`  ${phase}: ${pPassed}/${pTests.length}`);
  }
}
console.log('═══════════════════════════════════════════════════');
