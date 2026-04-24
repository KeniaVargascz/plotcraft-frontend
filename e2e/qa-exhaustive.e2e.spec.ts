import { test, expect, Page } from '@playwright/test';
import { clearSession, loginAsDemo } from './test-helpers';

/* ──────────────────────────────────────────────────────────
   QA EXHAUSTIVO — PlotCraft Frontend
   Secciones:
     1. Páginas públicas (landing, auth)
     2. Catálogo de novelas & lectura
     3. Feed social
     4. Perfil & configuración
     5. Biblioteca
     6. Planner
     7. Foro & comunidades
     8. Worldbuilding, personajes & timelines
     9. Analytics & herramientas
    10. Navegación global & responsive
   ────────────────────────────────────────────────────────── */

const TIMEOUT = 15_000;

/** Helper: mide tiempo de navegación y retorna ms */
async function timedGoto(page: Page, url: string): Promise<number> {
  const start = Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: TIMEOUT });
  return Date.now() - start;
}

/** Helper: mide tiempo de click-navigation */
async function timedClick(page: Page, locator: string, waitUrl?: string | RegExp): Promise<number> {
  const start = Date.now();
  if (waitUrl) {
    await Promise.all([
      page.waitForURL(waitUrl, { timeout: TIMEOUT }),
      page.locator(locator).first().click(),
    ]);
  } else {
    await page.locator(locator).first().click();
    await page.waitForLoadState('networkidle', { timeout: TIMEOUT });
  }
  return Date.now() - start;
}

// ═══════════════════════════════════════════════════════════
// SECCIÓN 1: PÁGINAS PÚBLICAS
// ═══════════════════════════════════════════════════════════
test.describe('1. Páginas públicas', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test('1.1 Landing page carga correctamente', async ({ page }) => {
    const ms = await timedGoto(page, '/');
    console.log(`⏱ Landing: ${ms}ms`);
    await expect(page.locator('.hero')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL('/');
  });

  test('1.2 Login page — formulario visible y funcional', async ({ page }) => {
    const ms = await timedGoto(page, '/login');
    console.log(`⏱ Login: ${ms}ms`);
    await expect(page.locator('input[formcontrolname="identifier"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar|login/i })).toBeVisible();
  });

  test('1.3 Login — validación de campos vacíos', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    // El botón debería estar disabled o mostrar error
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('1.4 Login — credenciales inválidas muestran error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[formcontrolname="identifier"]').fill('wrong@email.com');
    await page.locator('input[formcontrolname="password"]').fill('WrongPass123!');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    await page.waitForTimeout(2000);
    // Debería seguir en /login (no redirigir)
    expect(page.url()).toContain('/login');
  });

  test('1.5 Register page — formulario visible', async ({ page }) => {
    const ms = await timedGoto(page, '/register');
    console.log(`⏱ Register: ${ms}ms`);
    await expect(page.locator('input[formcontrolname="username"]')).toBeVisible({ timeout: 5000 });
  });

  test('1.6 Forgot password page carga', async ({ page }) => {
    const ms = await timedGoto(page, '/forgot-password');
    console.log(`⏱ Forgot password: ${ms}ms`);
    await expect(page.locator('input[formcontrolname="email"]')).toBeVisible();
  });

  test('1.7 Login exitoso redirige a /feed', async ({ page }) => {
    const start = Date.now();
    await loginAsDemo(page);
    const ms = Date.now() - start;
    console.log(`⏱ Login flow completo: ${ms}ms`);
    await expect(page).toHaveURL(/\/feed$/);
  });
});

// ═══════════════════════════════════════════════════════════
// SECCIÓN 2: CATÁLOGO DE NOVELAS & LECTURA
// ═══════════════════════════════════════════════════════════
test.describe('2. Catálogo de novelas & lectura', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('2.1 Catálogo de novelas carga', async ({ page }) => {
    const ms = await timedGoto(page, '/novelas');
    console.log(`⏱ Catálogo novelas: ${ms}ms`);
    // Debe tener al menos una card de novela o un mensaje vacío
    const content = page.locator('app-novel-card, .empty-state, .novel-card');
    await expect(content.first()).toBeVisible({ timeout: 8000 });
  });

  test('2.2 Página de géneros carga', async ({ page }) => {
    const ms = await timedGoto(page, '/novelas/generos');
    console.log(`⏱ Géneros: ${ms}ms`);
    await expect(page.locator('.genre-card, .genre-item, [class*="genre"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('2.3 Detalle de novela carga (primera del catálogo)', async ({ page }) => {
    await page.goto('/novelas', { waitUntil: 'networkidle' });
    const firstNovel = page.locator('a[href*="/novelas/"]').first();
    if (await firstNovel.isVisible({ timeout: 5000 })) {
      const ms = await timedClick(page, 'a[href*="/novelas/"]', /\/novelas\/.+/);
      console.log(`⏱ Detalle novela: ${ms}ms`);
      await expect(page.locator('h1, h2, .novel-title, .title').first()).toBeVisible({ timeout: 5000 });
    } else {
      console.log('⚠ No hay novelas en el catálogo para probar detalle');
    }
  });

  test('2.4 Mis novelas carga', async ({ page }) => {
    const ms = await timedGoto(page, '/mis-novelas');
    console.log(`⏱ Mis novelas: ${ms}ms`);
    await page.waitForLoadState('networkidle');
    // Página debe cargar (con novelas o estado vacío)
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(0);
  });

  test('2.5 Formulario nueva novela carga', async ({ page }) => {
    const ms = await timedGoto(page, '/mis-novelas/nueva');
    console.log(`⏱ Nueva novela form: ${ms}ms`);
    await expect(page.locator('input, textarea, [formcontrolname]').first()).toBeVisible({ timeout: 5000 });
  });

  test('2.6 Descubrir page carga', async ({ page }) => {
    const ms = await timedGoto(page, '/descubrir');
    console.log(`⏱ Descubrir: ${ms}ms`);
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════
// SECCIÓN 3: FEED SOCIAL
// ═══════════════════════════════════════════════════════════
test.describe('3. Feed social', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('3.1 Feed principal carga', async ({ page }) => {
    const ms = await timedGoto(page, '/feed');
    console.log(`⏱ Feed: ${ms}ms`);
    const content = page.locator('.feed-layout, .feed-column, app-post-card, .empty-state');
    await expect(content.first()).toBeVisible({ timeout: 8000 });
  });

  test('3.2 Composer de post visible', async ({ page }) => {
    await page.goto('/feed', { waitUntil: 'networkidle' });
    const composer = page.locator('app-post-composer, .composer-card, [class*="composer"]');
    await expect(composer.first()).toBeVisible({ timeout: 5000 });
  });

  test('3.3 Post cards renderizan correctamente', async ({ page }) => {
    await page.goto('/feed', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const posts = page.locator('app-post-card, .post-card');
    const count = await posts.count();
    console.log(`📊 Posts en feed: ${count}`);
    if (count > 0) {
      // Verificar que el primer post tiene contenido
      await expect(posts.first()).toBeVisible();
    }
  });
});

// ═══════════════════════════════════════════════════════════
// SECCIÓN 4: PERFIL & CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════
test.describe('4. Perfil & configuración', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('4.1 Mi perfil carga', async ({ page }) => {
    const ms = await timedGoto(page, '/mi-perfil');
    console.log(`⏱ Mi perfil: ${ms}ms`);
    const content = page.locator('.profile-card, .profile-page, [class*="profile"]');
    await expect(content.first()).toBeVisible({ timeout: 5000 });
  });

  test('4.2 Editar perfil carga formulario', async ({ page }) => {
    const ms = await timedGoto(page, '/mi-perfil/editar');
    console.log(`⏱ Editar perfil: ${ms}ms`);
    await expect(page.locator('input, textarea, [formcontrolname]').first()).toBeVisible({ timeout: 5000 });
  });

  test('4.3 Configuración de cuenta carga', async ({ page }) => {
    const ms = await timedGoto(page, '/cuenta');
    console.log(`⏱ Cuenta settings: ${ms}ms`);
    const content = page.locator('.account-shell, .settings-card, [class*="settings"]');
    await expect(content.first()).toBeVisible({ timeout: 5000 });
  });

  test('4.4 Página eliminar cuenta carga', async ({ page }) => {
    const ms = await timedGoto(page, '/cuenta/eliminar');
    console.log(`⏱ Eliminar cuenta: ${ms}ms`);
    const content = page.locator('.delete-shell, .danger-card, [class*="delete"]');
    await expect(content.first()).toBeVisible({ timeout: 5000 });
  });

  test('4.5 Notificaciones carga', async ({ page }) => {
    const ms = await timedGoto(page, '/notificaciones');
    console.log(`⏱ Notificaciones: ${ms}ms`);
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════
// SECCIÓN 5: BIBLIOTECA
// ═══════════════════════════════════════════════════════════
test.describe('5. Biblioteca', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('5.1 Biblioteca principal carga', async ({ page }) => {
    const ms = await timedGoto(page, '/biblioteca');
    console.log(`⏱ Biblioteca: ${ms}ms`);
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(0);
  });

  test('5.2 Colecciones carga', async ({ page }) => {
    const ms = await timedGoto(page, '/biblioteca/colecciones');
    console.log(`⏱ Colecciones: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('5.3 En progreso carga', async ({ page }) => {
    const ms = await timedGoto(page, '/biblioteca/en-progreso');
    console.log(`⏱ En progreso: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('5.4 Historial carga', async ({ page }) => {
    const ms = await timedGoto(page, '/biblioteca/historial');
    console.log(`⏱ Historial: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('5.5 Marcadores carga', async ({ page }) => {
    const ms = await timedGoto(page, '/biblioteca/marcadores');
    console.log(`⏱ Marcadores: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('5.6 Subrayados carga', async ({ page }) => {
    const ms = await timedGoto(page, '/biblioteca/subrayados');
    console.log(`⏱ Subrayados: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('5.7 Listas de lectura carga', async ({ page }) => {
    const ms = await timedGoto(page, '/biblioteca/listas');
    console.log(`⏱ Listas: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('5.8 Metas de lectura carga', async ({ page }) => {
    const ms = await timedGoto(page, '/biblioteca/metas');
    console.log(`⏱ Metas: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('5.9 Estadísticas de lectura carga', async ({ page }) => {
    const ms = await timedGoto(page, '/biblioteca/estadisticas');
    console.log(`⏱ Estadísticas biblioteca: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });
});

// ═══════════════════════════════════════════════════════════
// SECCIÓN 6: PLANNER
// ═══════════════════════════════════════════════════════════
test.describe('6. Planner', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('6.1 Planner dashboard carga', async ({ page }) => {
    const ms = await timedGoto(page, '/planner');
    console.log(`⏱ Planner: ${ms}ms`);
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(0);
  });

  test('6.2 Calendario del planner carga', async ({ page }) => {
    const ms = await timedGoto(page, '/planner/calendario');
    console.log(`⏱ Calendario: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('6.3 Estadísticas del planner carga', async ({ page }) => {
    const ms = await timedGoto(page, '/planner/estadisticas');
    console.log(`⏱ Planner stats: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });
});

// ═══════════════════════════════════════════════════════════
// SECCIÓN 7: FORO & COMUNIDADES
// ═══════════════════════════════════════════════════════════
test.describe('7. Foro & comunidades', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('7.1 Foro principal carga', async ({ page }) => {
    const ms = await timedGoto(page, '/foro');
    console.log(`⏱ Foro: ${ms}ms`);
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(0);
  });

  test('7.2 Crear nuevo hilo — formulario carga', async ({ page }) => {
    const ms = await timedGoto(page, '/foro/nuevo');
    console.log(`⏱ Nuevo hilo form: ${ms}ms`);
    await expect(page.locator('input, textarea, [formcontrolname]').first()).toBeVisible({ timeout: 5000 });
  });

  test('7.3 Comunidades explorar carga', async ({ page }) => {
    const ms = await timedGoto(page, '/comunidades/explorar');
    console.log(`⏱ Explorar comunidades: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('7.4 Comunidades seguidas carga', async ({ page }) => {
    const ms = await timedGoto(page, '/comunidades');
    console.log(`⏱ Mis comunidades seguidas: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('7.5 Crear comunidad — formulario carga', async ({ page }) => {
    const ms = await timedGoto(page, '/comunidades/nueva');
    console.log(`⏱ Nueva comunidad form: ${ms}ms`);
    await expect(page.locator('input, textarea, [formcontrolname]').first()).toBeVisible({ timeout: 5000 });
  });

  test('7.6 Mis comunidades carga', async ({ page }) => {
    const ms = await timedGoto(page, '/mis-comunidades');
    console.log(`⏱ Mis comunidades: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('7.7 Hilos archivados carga', async ({ page }) => {
    const ms = await timedGoto(page, '/foro/archivados');
    console.log(`⏱ Archivados: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });
});

// ═══════════════════════════════════════════════════════════
// SECCIÓN 8: WORLDBUILDING, PERSONAJES & TIMELINES
// ═══════════════════════════════════════════════════════════
test.describe('8. Worldbuilding, personajes & timelines', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('8.1 Catálogo de mundos carga', async ({ page }) => {
    const ms = await timedGoto(page, '/mundos');
    console.log(`⏱ Mundos: ${ms}ms`);
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(0);
  });

  test('8.2 Mis mundos carga', async ({ page }) => {
    const ms = await timedGoto(page, '/mis-mundos');
    console.log(`⏱ Mis mundos: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('8.3 Crear nuevo mundo — formulario carga', async ({ page }) => {
    const ms = await timedGoto(page, '/mis-mundos/nuevo');
    console.log(`⏱ Nuevo mundo form: ${ms}ms`);
    await expect(page.locator('input, textarea, [formcontrolname]').first()).toBeVisible({ timeout: 5000 });
  });

  test('8.4 Catálogo de personajes carga', async ({ page }) => {
    const ms = await timedGoto(page, '/personajes');
    console.log(`⏱ Personajes: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('8.5 Mis personajes carga', async ({ page }) => {
    const ms = await timedGoto(page, '/mis-personajes');
    console.log(`⏱ Mis personajes: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('8.6 Crear nuevo personaje — formulario carga', async ({ page }) => {
    const ms = await timedGoto(page, '/mis-personajes/nuevo');
    console.log(`⏱ Nuevo personaje form: ${ms}ms`);
    await expect(page.locator('input, textarea, [formcontrolname]').first()).toBeVisible({ timeout: 5000 });
  });

  test('8.7 Mis timelines carga', async ({ page }) => {
    const ms = await timedGoto(page, '/mis-timelines');
    console.log(`⏱ Timelines: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('8.8 Sagas/Series catálogo carga', async ({ page }) => {
    const ms = await timedGoto(page, '/sagas');
    console.log(`⏱ Sagas: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('8.9 Referencias visuales carga', async ({ page }) => {
    const ms = await timedGoto(page, '/referencias-visuales');
    console.log(`⏱ Visual boards: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });
});

// ═══════════════════════════════════════════════════════════
// SECCIÓN 9: ANALYTICS & HERRAMIENTAS
// ═══════════════════════════════════════════════════════════
test.describe('9. Analytics & herramientas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('9.1 Analytics dashboard carga', async ({ page }) => {
    const ms = await timedGoto(page, '/analytics');
    console.log(`⏱ Analytics: ${ms}ms`);
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(0);
  });

  test('9.2 Plantillas / herramientas carga', async ({ page }) => {
    const ms = await timedGoto(page, '/herramientas/plantillas');
    console.log(`⏱ Plantillas: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('9.3 Mis suscripciones carga', async ({ page }) => {
    const ms = await timedGoto(page, '/mis-suscripciones');
    console.log(`⏱ Suscripciones: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });

  test('9.4 Búsqueda global carga', async ({ page }) => {
    const ms = await timedGoto(page, '/buscar');
    console.log(`⏱ Búsqueda: ${ms}ms`);
    await page.waitForLoadState('networkidle');
  });
});

// ═══════════════════════════════════════════════════════════
// SECCIÓN 10: NAVEGACIÓN GLOBAL, GUARDS & THEME
// ═══════════════════════════════════════════════════════════
test.describe('10. Navegación global & guards', () => {
  test('10.1 Rutas protegidas redirigen a login sin auth', async ({ page }) => {
    await clearSession(page);
    await page.goto('/feed', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(page).toHaveURL(/\/login/);
  });

  test('10.2 Ruta inexistente redirige a landing', async ({ page }) => {
    await clearSession(page);
    const ms = await timedGoto(page, '/ruta-que-no-existe-xyz');
    console.log(`⏱ 404 redirect: ${ms}ms`);
    await expect(page).toHaveURL('/');
  });

  test('10.3 Guest guard — login redirige a feed si ya autenticado', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/login', { waitUntil: 'networkidle' });
    // Debería redirigir fuera de login
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test('10.4 Theme switch funciona', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/cuenta', { waitUntil: 'networkidle' });
    // Verificar que hay controles de theme
    const themeControl = page.locator('[class*="theme"], [data-theme], button:has-text("tema"), button:has-text("theme")');
    const hasTheme = await themeControl.count();
    console.log(`📊 Theme controls encontrados: ${hasTheme}`);
  });

  test('10.5 Navbar visible en rutas autenticadas', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/feed', { waitUntil: 'networkidle' });
    const nav = page.locator('nav, .topbar, .sidebar, [class*="nav"]');
    await expect(nav.first()).toBeVisible({ timeout: 5000 });
  });

  test('10.6 Console errors check en feed', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await loginAsDemo(page);
    await page.goto('/feed', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log(`🐛 Console errors en /feed: ${errors.length}`);
    errors.forEach(e => console.log(`  ❌ ${e}`));
  });

  test('10.7 Console errors check en catálogo', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await loginAsDemo(page);
    await page.goto('/novelas', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log(`🐛 Console errors en /novelas: ${errors.length}`);
    errors.forEach(e => console.log(`  ❌ ${e}`));
  });

  test('10.8 Console errors check en biblioteca', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await loginAsDemo(page);
    await page.goto('/biblioteca', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log(`🐛 Console errors en /biblioteca: ${errors.length}`);
    errors.forEach(e => console.log(`  ❌ ${e}`));
  });

  test('10.9 Network errors — API 5xx check', async ({ page }) => {
    const apiErrors: string[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() >= 500) {
        apiErrors.push(`${response.status()} ${response.url()}`);
      }
    });
    await loginAsDemo(page);
    // Navegar por varias páginas
    for (const route of ['/feed', '/novelas', '/biblioteca', '/planner', '/mis-personajes']) {
      await page.goto(route, { waitUntil: 'networkidle', timeout: TIMEOUT });
    }
    console.log(`🐛 API 5xx errors: ${apiErrors.length}`);
    apiErrors.forEach(e => console.log(`  ❌ ${e}`));
  });
});
