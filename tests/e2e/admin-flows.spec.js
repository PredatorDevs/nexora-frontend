import { expect, test } from '@playwright/test';
import {
  adminUser,
  allPermissions,
  failure,
  managedUser,
  pagination,
  success,
} from '../helpers/api-fixtures.js';

async function fulfill(route, response) {
  await route.fulfill({
    status: response.status,
    contentType: 'application/json',
    body: JSON.stringify(response.body),
  });
}

async function installMockApi(
  page,
  { initialSession = false, permissions = allPermissions } = {},
) {
  let sessionAvailable = initialSession;
  let currentUser = managedUser;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const method = request.method();

    if (path === '/auth/refresh' && method === 'POST') {
      return fulfill(
        route,
        sessionAvailable
          ? success({ accessToken: 'refreshed-token' })
          : failure('SESSION_EXPIRED', 401),
      );
    }
    if (path === '/auth/login' && method === 'POST') {
      const credentials = request.postDataJSON();
      if (
        credentials.email !== 'admin@example.test' ||
        credentials.password !== 'a-secure-password'
      ) {
        return fulfill(route, failure('INVALID_CREDENTIALS', 401));
      }
      sessionAvailable = true;
      return fulfill(
        route,
        success({ accessToken: 'access-token', user: adminUser }),
      );
    }
    if (path === '/auth/me' && method === 'GET')
      return fulfill(route, success(adminUser));
    if (path === '/auth/permissions' && method === 'GET')
      return fulfill(route, success({ permissions }));

    if (path === '/users' && method === 'GET')
      return fulfill(
        route,
        success([currentUser], { pagination: pagination(1) }),
      );
    if (path === '/users' && method === 'POST') {
      const body = request.postDataJSON();
      currentUser = {
        ...managedUser,
        email: body.email,
        displayName: body.displayName,
      };
      return fulfill(route, success(currentUser, { status: 201 }));
    }
    if (path === '/users/2' && method === 'GET')
      return fulfill(route, success(currentUser));
    if (path === '/roles' && method === 'GET')
      return fulfill(route, success([], { pagination: pagination(0) }));

    return fulfill(route, failure('NOT_FOUND', 404));
  });
}

test('inicia sesión y crea un usuario administrativo', async ({ page }) => {
  await installMockApi(page);
  await page.goto('/login');

  await page.getByLabel('Correo electrónico').fill('admin@example.test');
  await page.getByLabel('Contraseña').fill('a-secure-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(
    page.getByRole('heading', { name: 'Predator Admin' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Usuarios' }).click();
  await expect(page.getByRole('heading', { name: 'Usuarios' })).toBeVisible();
  await expect(page.getByText('Ada Lovelace')).toBeVisible();

  await page.getByRole('link', { name: 'Nuevo usuario' }).click();
  await expect(
    page.getByRole('heading', { name: 'Nuevo usuario' }),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'Nombre' }).fill('Grace Hopper');
  await page
    .getByRole('textbox', { name: 'Correo electrónico' })
    .fill('grace@example.test');
  await page
    .getByRole('textbox', { name: 'Contraseña temporal' })
    .fill('another-secure-password');
  await page
    .getByRole('textbox', { name: 'Confirmar contraseña' })
    .fill('another-secure-password');
  await page.getByRole('button', { name: 'Crear usuario' }).click();

  await expect(page).toHaveURL(/\/users\/2$/);
  await expect(
    page.getByRole('heading', { name: 'Grace Hopper' }),
  ).toBeVisible();
});

test('redirige a 403 cuando falta el permiso de la ruta', async ({ page }) => {
  await installMockApi(page, {
    initialSession: true,
    permissions: ['roles.read'],
  });
  await page.goto('/users');

  await expect(page).toHaveURL(/\/unauthorized$/);
  await expect(page.getByRole('heading', { name: '403' })).toBeVisible();
  await expect(
    page.getByText('No tienes permiso para acceder a esta página.'),
  ).toBeVisible();
});

test('muestra un error neutro para credenciales inválidas', async ({
  page,
}) => {
  await installMockApi(page);
  await page.goto('/login');

  await page.getByLabel('Correo electrónico').fill('admin@example.test');
  await page.getByLabel('Contraseña').fill('incorrect-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(
    page.getByText('El correo o la contraseña no son válidos.'),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('mantiene visible el menú de usuario al reducir movimiento', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'predator.ui-preferences.v1',
      JSON.stringify({
        themeMode: 'system',
        density: 'comfortable',
        highContrast: false,
        reduceMotion: true,
      }),
    );
  });
  await installMockApi(page, { initialSession: true });
  await page.goto('/');

  await page.getByRole('button', { name: 'Abrir menú de usuario' }).click();

  await expect(page.getByText('Mi perfil')).toBeVisible();
  await expect(page.getByText('Cerrar sesión', { exact: true })).toBeVisible();
});
