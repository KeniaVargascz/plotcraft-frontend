import { chromium } from '@playwright/test';

const API_URL = 'https://plotcraft-backend.onrender.com/api/v1';
const FRONTEND_URL = 'https://plotcraft-frontend.vercel.app';

// Check API state
const active = await (await fetch(`${API_URL}/features/active`)).json();
console.log('API active flags count:', active.data.length);
console.log('social.feed in API:', active.data.includes('social.feed'));

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Intercept the features/active request
page.on('response', async (response) => {
  if (response.url().includes('features/active')) {
    const body = await response.json().catch(() => null);
    console.log('\nBROWSER fetched features/active:');
    console.log('  URL:', response.url());
    console.log('  Status:', response.status());
    console.log('  Flags count:', body?.data?.length);
    console.log('  social.feed:', body?.data?.includes('social.feed'));
    console.log('  author.novels:', body?.data?.includes('author.novels'));
  }
});

await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

// Login
await page.locator('#identifier').fill('demo@plotcraft.com');
await page.locator('input[formcontrolname="password"]').fill('Demo1234!');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(5000);

console.log('\nCurrent URL after login:', page.url());

// Navigate to /feed
await page.goto(`${FRONTEND_URL}/feed`, { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);
console.log('After /feed navigate:', page.url());

await ctx.close();
await browser.close();
