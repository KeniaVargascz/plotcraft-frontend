import { chromium } from '@playwright/test';

const API = 'https://plotcraft-backend.onrender.com/api/v1';
const FRONT = 'https://plotcraft-frontend.vercel.app';
const ADMIN = 'https://plotcraft-admin.vercel.app';

const results = [];
const log = (test, pass, detail) => {
  results.push({ test, pass });
  console.log(pass ? '  OK' : '  FAIL', test, detail ? '— ' + detail : '');
};

// Admin login
const token = (await (await fetch(API + '/admin/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@plotcraft.com', password: 'Admin1234!' }),
})).json()).data.accessToken;

const genres = (await (await fetch(API + '/admin/catalogs/genres', { headers: { Authorization: 'Bearer ' + token } })).json()).data;
const accion = genres.find(g => g.label === 'Acción');

// Ensure all start enabled
for (const g of genres) {
  if (!g.isActive) await fetch(API + '/admin/catalogs/genres/' + g.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ isActive: true }) });
}
await new Promise(r => setTimeout(r, 1500));

const browser = await chromium.launch();

// ═══════════════════════════════════
console.log('\n=== FASE 1: BASELINE (Acción activo) ===');
// ═══════════════════════════════════

const pubBefore = (await (await fetch(API + '/genres')).json()).data;
log('1.1 API /genres incluye Acción', pubBefore.some(g => g.label === 'Acción'), pubBefore.length + ' genres');

let c = await browser.newContext(); let p = await c.newPage();
await p.goto(FRONT + '/novelas/generos', { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(6000);
log('1.2 /novelas/generos muestra Accion', (await p.locator('body').innerText()).includes('Accion'));
await c.close();

c = await browser.newContext(); p = await c.newPage();
await p.goto(FRONT + '/novelas/genero/accion', { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(6000);
log('1.3 /novelas/genero/accion accesible', p.url().includes('/genero/accion'), p.url().split('.app')[1]);
await c.close();

// ═══════════════════════════════════
console.log('\n=== FASE 2: ADMIN DESACTIVA Acción ===');
// ═══════════════════════════════════

c = await browser.newContext(); p = await c.newPage();
await p.goto(ADMIN + '/login', { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(2000);
await p.locator('input[name="email"]').fill('admin@plotcraft.com');
await p.locator('input[name="password"]').fill('Admin1234!');
await p.getByRole('button', { name: /iniciar/i }).click();
await p.waitForTimeout(5000);
await p.goto(ADMIN + '/catalogs', { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(3000);

const rows = await p.locator('.item-row').all();
for (const row of rows) {
  const label = (await row.locator('.item-label').innerText().catch(() => '')).trim();
  if (label === 'Acción') {
    const toggle = row.locator('mat-slide-toggle');
    const cls = await toggle.getAttribute('class');
    if (cls.includes('checked')) {
      await toggle.click();
      await p.waitForTimeout(3000);
    }
    const cls2 = await toggle.getAttribute('class');
    log('2.1 Admin UI toggle Acción OFF', !cls2.includes('checked'));
    break;
  }
}
await c.close();
await new Promise(r => setTimeout(r, 1500));

const adminState = (await (await fetch(API + '/admin/catalogs/genres', { headers: { Authorization: 'Bearer ' + token } })).json()).data.find(g => g.label === 'Acción');
log('2.2 API admin confirma isActive=false', adminState.isActive === false);

const pubAfter = (await (await fetch(API + '/genres')).json()).data;
log('2.3 API /genres excluye Acción', !pubAfter.some(g => g.label === 'Acción'), pubAfter.length + ' genres');

// ═══════════════════════════════════
console.log('\n=== FASE 3: FRONTEND USER VERIFICA ===');
// ═══════════════════════════════════

c = await browser.newContext(); p = await c.newPage();
await p.goto(FRONT + '/novelas/generos', { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(6000);
const cards3 = await p.locator('app-genre-spotlight-card').count();
log('3.1 /novelas/generos oculta Accion', !(await p.locator('body').innerText()).includes('Accion'), cards3 + ' cards');
await c.close();

c = await browser.newContext(); p = await c.newPage();
await p.goto(FRONT + '/novelas/genero/accion', { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(6000);
log('3.2 /novelas/genero/accion redirige', !p.url().includes('/genero/accion'), '-> ' + p.url().split('.app')[1]);
await c.close();

c = await browser.newContext(); p = await c.newPage();
await p.goto(FRONT + '/novelas/genero/fantasia', { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(6000);
log('3.3 /novelas/genero/fantasia sigue OK', p.url().includes('/genero/fantasia'));
await c.close();

const novRes = await (await fetch(API + '/novels?genre=accion&limit=5')).json();
const novCount = novRes.data?.data?.length ?? novRes.data?.length ?? 0;
log('3.4 API /novels?genre=accion vacío', novCount === 0, novCount + ' novels');

// ═══════════════════════════════════
console.log('\n=== FASE 4: ADMIN RE-ACTIVA Acción ===');
// ═══════════════════════════════════

await fetch(API + '/admin/catalogs/genres/' + accion.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ isActive: true }) });
await new Promise(r => setTimeout(r, 1500));

const reEnabled = (await (await fetch(API + '/admin/catalogs/genres', { headers: { Authorization: 'Bearer ' + token } })).json()).data.find(g => g.label === 'Acción');
log('4.1 API confirma isActive=true', reEnabled.isActive === true);

const pubFinal = (await (await fetch(API + '/genres')).json()).data;
log('4.2 API /genres incluye Acción', pubFinal.some(g => g.label === 'Acción'), pubFinal.length + ' genres');

c = await browser.newContext(); p = await c.newPage();
await p.goto(FRONT + '/novelas/generos', { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(6000);
log('4.3 /novelas/generos muestra Accion', (await p.locator('body').innerText()).includes('Accion'));
await c.close();

c = await browser.newContext(); p = await c.newPage();
await p.goto(FRONT + '/novelas/genero/accion', { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(6000);
log('4.4 /novelas/genero/accion accesible', p.url().includes('/genero/accion'), p.url().split('.app')[1]);
await c.close();

await browser.close();

// ═══════════════════════════════════
console.log('\n════════════════════════════════════');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log('TOTAL:', passed, 'passed,', failed, 'failed,', results.length, 'total');
if (failed) {
  console.log('\nFAILED:');
  results.filter(r => !r.pass).forEach(r => console.log(' ', r.test));
}
console.log('════════════════════════════════════');
