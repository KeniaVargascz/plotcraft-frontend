import { chromium } from '@playwright/test';

const FRONTEND_URL = 'https://plotcraft-frontend.vercel.app';

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Intercept features/active and modify response
await page.route('**/features/active**', async (route) => {
  console.log('INTERCEPTED features/active request!');
  const response = await route.fetch();
  const body = await response.json();
  console.log('Original response:', body.data?.length, 'flags');
  console.log('social.feed present:', body.data?.includes('social.feed'));
  await route.fulfill({ response });
});

console.log('Going to login...');
await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

console.log('Logging in...');
await page.locator('#identifier').fill('demo@plotcraft.com');
await page.locator('input[formcontrolname="password"]').fill('Demo1234!');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(5000);

console.log('URL after login:', page.url());

// Manually check what the frontend thinks about feature flags
const check = await page.evaluate(() => {
  // Make direct API call from browser context
  return fetch('https://plotcraft-backend.onrender.com/api/features/active')
    .then(r => r.json())
    .then(d => ({ count: d.data?.length, hasFeed: d.data?.includes('social.feed') }));
});
console.log('Direct API call from browser:', check);

// Try to navigate to feed
await page.goto(`${FRONTEND_URL}/feed`, { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);
console.log('After /feed:', page.url());

await ctx.close();
await browser.close();
