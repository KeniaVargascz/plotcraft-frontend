import { chromium } from '@playwright/test';

const API_URL = 'https://plotcraft-backend.onrender.com/api/v1';
const FRONTEND_URL = 'https://plotcraft-frontend.vercel.app';

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Track ALL network requests
const requests = [];
page.on('request', (req) => {
  if (req.url().includes('plotcraft-backend') || req.url().includes('features')) {
    requests.push({ url: req.url(), method: req.method() });
  }
});

page.on('response', async (res) => {
  if (res.url().includes('features/active')) {
    const body = await res.text().catch(() => '');
    console.log('  [RESPONSE] features/active:', res.status(), body.substring(0, 200));
  }
});

console.log('1. Going to login page...');
await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

console.log('\nRequests after page load:');
requests.forEach(r => console.log(`  ${r.method} ${r.url}`));

console.log('\n2. Logging in...');
await page.locator('#identifier').fill('demo@plotcraft.com');
await page.locator('input[formcontrolname="password"]').fill('Demo1234!');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(5000);

console.log('\nRequests after login:');
requests.forEach(r => console.log(`  ${r.method} ${r.url}`));

console.log('\nURL after login:', page.url());

// Check what the FeatureFlagService thinks
const flagState = await page.evaluate(() => {
  // Try to access Angular's injector
  return { url: window.location.href };
});
console.log('Page state:', flagState);

// Navigate to /feed
console.log('\n3. Navigating to /feed...');
await page.goto(`${FRONTEND_URL}/feed`, { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);
console.log('URL:', page.url());

// Check if feed content loaded or if it's empty
const bodyText = await page.locator('body').innerText();
console.log('Body text length:', bodyText.length);
console.log('Body preview:', bodyText.substring(0, 300));

await ctx.close();
await browser.close();
