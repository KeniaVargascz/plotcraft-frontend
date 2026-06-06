import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'https://plotcraft-frontend.vercel.app';
const BACKEND_URL = 'https://plotcraft-backend.onrender.com/api/v1';

const EMAIL = 'demo@plotcraft.com';
const PASSWORD = 'Demo1234!';

test.describe('Feature visibility - initial state', () => {
  test.setTimeout(180_000);

  test('login via UI, check sidebar nav items, and test routes', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    // ── Step 1: Get feature flags via API ──
    console.log('--- Fetching active feature flags via API ---');
    const loginRes = await page.request.post(`${BACKEND_URL}/auth/login`, {
      data: { identifier: EMAIL, password: PASSWORD },
    });
    const loginData = await loginRes.json();
    expect(loginData.success).toBe(true);
    const token = loginData.data.accessToken;

    const flagsRes = await page.request.get(`${BACKEND_URL}/features/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const flagsData = await flagsRes.json();
    const activeFlags: string[] = flagsData.data;
    console.log(`Active feature flags (${activeFlags.length}):`);
    activeFlags.sort().forEach((f) => console.log(`  [ON] ${f}`));

    const navFeatureKeys = [
      'social.feed',
      'explore.discovery',
      'explore.novels_catalog',
      'explore.worlds_catalog',
      'explore.characters_catalog',
      'explore.search',
      'community.forum',
      'community.communities',
      'author.novels',
      'author.worlds',
      'author.characters',
      'author.visual_boards',
      'author.timelines',
      'author.planner',
      'reader.library',
      'reader.subscriptions',
      'author.analytics',
      'platform.templates',
    ];
    console.log('\n--- Nav-relevant feature flags status ---');
    for (const key of navFeatureKeys) {
      const status = activeFlags.includes(key) ? 'ON' : 'OFF';
      console.log(`  [${status}] ${key}`);
    }

    // ── Step 2: Login via the UI ──
    console.log('\n--- Logging in via UI ---');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.locator('input[formcontrolname="identifier"]').fill(EMAIL);
    await page.locator('input[formcontrolname="password"]').fill(PASSWORD);

    await Promise.all([
      page.waitForURL('**/feed', { timeout: 30_000 }).catch(() => {
        // feed might be disabled, wait for any navigation
      }),
      page.getByRole('button', { name: /iniciar|login/i }).click(),
    ]);

    // Wait for navigation to settle
    await page.waitForTimeout(3000);
    const urlAfterLogin = page.url();
    console.log(`URL after login: ${urlAfterLogin}`);

    // If feed is disabled, we might land on landing page. Check if we're authenticated.
    const isAuthenticated = await page.evaluate(() => !!localStorage.getItem('plotcraft_access_token'));
    console.log(`Authenticated (has accessToken in localStorage): ${isAuthenticated}`);

    if (!isAuthenticated) {
      // Login might redirect differently. Try waiting a bit more.
      await page.waitForTimeout(3000);
      const retryAuth = await page.evaluate(() => !!localStorage.getItem('plotcraft_access_token'));
      console.log(`Retry auth check: ${retryAuth}`);
    }

    // ── Step 3: Navigate to a protected route to get into the private layout ──
    // Try /descubrir first since it has feature flag ON
    console.log('\n--- Navigating to /descubrir to check private layout ---');
    await page.goto(`${FRONTEND_URL}/descubrir`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(2000);
    console.log(`Current URL: ${page.url()}`);

    // ── Step 4: Check sidebar navigation items ──
    console.log('\n--- Checking sidebar navigation ---');
    const sidebar = page.locator('aside.sidebar.desktop-sidebar');
    const sidebarExists = (await sidebar.count()) > 0;
    console.log(`Desktop sidebar visible: ${sidebarExists}`);

    const visibleNavItems: { group: string; label: string; href: string }[] = [];

    if (sidebarExists) {
      const groups = sidebar.locator('.nav-group');
      const groupCount = await groups.count();
      console.log(`Number of nav groups: ${groupCount}`);

      for (let g = 0; g < groupCount; g++) {
        const group = groups.nth(g);
        const groupLabel = (await group.locator('.group-label').textContent())?.trim() ?? '';
        const links = group.locator('a');
        const linkCount = await links.count();
        console.log(`\n  Group: "${groupLabel}" (${linkCount} visible items)`);

        for (let i = 0; i < linkCount; i++) {
          const link = links.nth(i);
          const text = (await link.textContent())?.trim() ?? '';
          const href = (await link.getAttribute('href')) ?? '';
          console.log(`    - "${text}" -> ${href}`);
          visibleNavItems.push({ group: groupLabel, label: text, href });
        }
      }
    } else {
      console.log('Sidebar not found - checking if private layout is active...');
      // Maybe we need to screenshot to debug
      await page.screenshot({
        path: 'C:/Users/damia/Documents/Kenia/PlotCraft2.0/plotcraft-frontend/test-results/feature-visibility-debug.png',
      });
      console.log('Screenshot saved to test-results/feature-visibility-debug.png');
    }

    // ── Step 5: Test route accessibility ──
    console.log('\n--- Testing route access (authenticated) ---');
    const routesToTest = [
      { path: '/feed', name: 'Feed', flag: 'social.feed' },
      { path: '/buscar', name: 'Buscar', flag: 'explore.search' },
      { path: '/descubrir', name: 'Descubrir', flag: 'explore.discovery' },
      { path: '/novelas', name: 'Novelas', flag: 'explore.novels_catalog' },
      { path: '/mundos', name: 'Mundos', flag: 'explore.worlds_catalog' },
      { path: '/personajes', name: 'Personajes', flag: 'explore.characters_catalog' },
      { path: '/mis-novelas', name: 'Mis Novelas', flag: 'author.novels' },
      { path: '/mis-mundos', name: 'Mis Mundos', flag: 'author.worlds' },
      { path: '/mis-personajes', name: 'Mis Personajes', flag: 'author.characters' },
      { path: '/comunidades', name: 'Comunidades', flag: 'community.communities' },
      { path: '/mis-comunidades', name: 'Mis Comunidades', flag: 'community.communities' },
      { path: '/biblioteca', name: 'Biblioteca', flag: 'reader.library' },
      { path: '/mis-suscripciones', name: 'Suscripciones', flag: 'reader.subscriptions' },
      { path: '/foro', name: 'Foro', flag: 'community.forum' },
      { path: '/planner', name: 'Planner', flag: 'author.planner' },
      { path: '/analytics', name: 'Analytics', flag: 'author.analytics' },
      { path: '/referencias-visuales', name: 'Tableros', flag: 'author.visual_boards' },
      { path: '/mis-timelines', name: 'Timelines', flag: 'author.timelines' },
      { path: '/herramientas/plantillas', name: 'Plantillas', flag: 'platform.templates' },
    ];

    const results: {
      name: string;
      path: string;
      flag: string;
      flagActive: boolean;
      finalUrl: string;
      accessible: boolean;
    }[] = [];

    for (const route of routesToTest) {
      await page.goto(`${FRONTEND_URL}${route.path}`, {
        waitUntil: 'networkidle',
        timeout: 20_000,
      });
      await page.waitForTimeout(800);
      const finalUrl = page.url();
      const accessible = finalUrl.includes(route.path);
      const flagActive = activeFlags.includes(route.flag);
      results.push({
        name: route.name,
        path: route.path,
        flag: route.flag,
        flagActive,
        finalUrl,
        accessible,
      });
      const flagIcon = flagActive ? 'FLAG-ON' : 'FLAG-OFF';
      const accessIcon = accessible ? 'OK' : 'BLOCKED';
      console.log(
        `  [${accessIcon}] [${flagIcon}] ${route.name} (${route.path}) -> ${finalUrl}`,
      );
    }

    // ── Step 6: Summary ──
    console.log('\n========================================');
    console.log('          FINAL SUMMARY');
    console.log('========================================');

    console.log('\nACCESSIBLE ROUTES:');
    results
      .filter((r) => r.accessible)
      .forEach((r) =>
        console.log(`  [OK] ${r.name} (${r.path}) -- flag "${r.flag}" is ${r.flagActive ? 'ON' : 'OFF'}`),
      );

    console.log('\nBLOCKED/REDIRECTED ROUTES:');
    results
      .filter((r) => !r.accessible)
      .forEach((r) =>
        console.log(
          `  [BLOCKED] ${r.name} (${r.path}) -> ${r.finalUrl} -- flag "${r.flag}" is ${r.flagActive ? 'ON' : 'OFF'}`,
        ),
      );

    console.log('\nSIDEBAR NAV ITEMS VISIBLE:');
    if (visibleNavItems.length > 0) {
      for (const item of visibleNavItems) {
        console.log(`  [${item.group}] "${item.label}" -> ${item.href}`);
      }
    } else {
      console.log('  (sidebar was not visible - user may not be in private layout)');
    }

    console.log('\nFEATURE FLAGS MISSING (relevant to navigation):');
    navFeatureKeys
      .filter((k) => !activeFlags.includes(k))
      .forEach((k) => console.log(`  [OFF] ${k}`));

    await context.close();
  });
});
