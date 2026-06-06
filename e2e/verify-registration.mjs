import { chromium } from '@playwright/test';

const FRONTEND_URL = 'https://plotcraft-frontend.vercel.app';
const log = (test, pass, detail) => console.log(pass ? '  OK' : '  FAIL', test, detail ? '— ' + detail : '');

const browser = await chromium.launch();

// Test 1: Registration disabled
console.log('=== platform.registration DISABLED ===');
const ctx1 = await browser.newContext();
const p1 = await ctx1.newPage();

await p1.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
await p1.waitForTimeout(3000);
const loginText = await p1.locator('.auth-card').innerText().catch(() => p1.locator('body').innerText());
const hasRegisterLink = loginText.toLowerCase().includes('registr') || loginText.toLowerCase().includes('crear cuenta');
log('Login page: link "Registrarse" OCULTO', !hasRegisterLink, hasRegisterLink ? 'aún visible!' : 'oculto');

// Try direct navigation to /register
await p1.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await p1.waitForTimeout(2000);
const regBlocked = !p1.url().includes('/register');
log('Ruta /register BLOQUEADA', regBlocked, p1.url().split('.app')[1]);

await ctx1.close();

// Test 2: Re-enable and verify it shows
console.log('\n=== platform.registration ENABLED ===');
const adminRes = await fetch('https://plotcraft-backend.onrender.com/api/v1/admin/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@plotcraft.com', password: 'Admin1234!' }),
});
const adminToken = (await adminRes.json()).data.accessToken;
await fetch('https://plotcraft-backend.onrender.com/api/v1/admin/features/platform.registration', {
  method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ enabled: true }),
});
await new Promise(r => setTimeout(r, 2000));

const ctx2 = await browser.newContext();
const p2 = await ctx2.newPage();
await p2.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
await p2.waitForTimeout(3000);
const loginText2 = await p2.locator('.auth-card').innerText().catch(() => p2.locator('body').innerText());
const hasRegisterLink2 = loginText2.toLowerCase().includes('registr') || loginText2.toLowerCase().includes('crear cuenta');
log('Login page: link "Registrarse" VISIBLE', hasRegisterLink2, !hasRegisterLink2 ? 'no visible!' : 'visible');

await p2.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await p2.waitForTimeout(2000);
const regAllowed = p2.url().includes('/register');
log('Ruta /register ACCESIBLE', regAllowed, p2.url().split('.app')[1]);

await ctx2.close();
await browser.close();
