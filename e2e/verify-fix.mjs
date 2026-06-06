import { chromium } from '@playwright/test';

const FRONTEND_URL = 'https://plotcraft-frontend.vercel.app';
const API_URL = 'https://plotcraft-backend.onrender.com/api/v1';

const results = [];
const log = (test, status, detail) => {
  results.push({ test, status, detail });
  console.log(status === 'PASS' ? '  OK' : '  FAIL', test, detail ? '— ' + detail : '');
};

console.log('═══════════════════════════════════════');
console.log(' VERIFY FEATURE FLAG FIX');
console.log('═══════════════════════════════════════');

// Disabled flags: social.feed, author.novels, reader.library
const DISABLED = ['social.feed', 'author.novels', 'reader.library'];
const ENABLED = ['explore.search', 'community.communities'];

const active = await (await fetch(`${API_URL}/features/active`)).json();
console.log('\nAPI state:', active.data.length, 'active flags');
for (const f of DISABLED) log(`API: ${f} desactivado`, !active.data.includes(f) ? 'PASS' : 'FAIL', '');

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Login
await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
await page.locator('#identifier').fill('demo@plotcraft.com');
await page.locator('input[formcontrolname="password"]').fill('Demo1234!');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(6000);

console.log('\nURL after login:', page.url());
log('Login exitoso', !page.url().includes('/login') ? 'PASS' : 'FAIL', page.url().split('.app')[1]);

// After fix: login should NOT redirect to /feed since social.feed is disabled
log('Login NO redirige a /feed (flag off)', !page.url().includes('/feed') ? 'PASS' : 'FAIL', page.url().split('.app')[1]);

// Test disabled routes - should redirect
console.log('\n--- Rutas DESACTIVADAS (deben bloquear) ---');
const disabledRoutes = { 'social.feed': '/feed', 'author.novels': '/mis-novelas', 'reader.library': '/biblioteca' };
for (const [flag, route] of Object.entries(disabledRoutes)) {
  await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const url = page.url();
  const blocked = !url.includes(route);
  log(`${route} BLOQUEADA (${flag} off)`, blocked ? 'PASS' : 'FAIL',
    blocked ? `→ ${url.split('.app')[1]}` : 'aún accesible!');
}

// Test enabled routes - should work
console.log('\n--- Rutas ACTIVAS (deben funcionar) ---');
const enabledRoutes = { 'explore.search': '/buscar', 'community.communities': '/comunidades' };
for (const [flag, route] of Object.entries(enabledRoutes)) {
  await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const stayed = page.url().includes(route);
  log(`${route} accesible (${flag} on)`, stayed ? 'PASS' : 'FAIL',
    stayed ? 'OK' : `→ ${page.url().split('.app')[1]}`);
}

// Check nav items
console.log('\n--- Nav items ---');
await page.goto(`${FRONTEND_URL}/descubrir`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(3000);
const nav = await page.locator('body').innerText();

log('Nav: "Feed" OCULTO', !nav.includes('Feed') ? 'PASS' : 'FAIL', '');
log('Nav: "Mis novelas" OCULTO', !nav.includes('Mis novelas') ? 'PASS' : 'FAIL', '');
log('Nav: "Biblioteca" OCULTO', !nav.includes('Biblioteca') ? 'PASS' : 'FAIL', '');
log('Nav: "Comunidades" visible', nav.includes('Comunidades') ? 'PASS' : 'FAIL', '');
log('Nav: "Descubrir" visible', nav.includes('Descubrir') ? 'PASS' : 'FAIL', '');

await ctx.close();
await browser.close();

// Summary
console.log('\n═══════════════════════════════════════');
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`TOTAL: ${passed} passed, ${failed} failed, ${results.length} total`);
if (failed > 0) {
  console.log('\nFAILED:');
  results.filter(r => r.status === 'FAIL').forEach(r =>
    console.log(`  ${r.test}${r.detail ? ' — ' + r.detail : ''}`));
}
