import { test, expect } from '@playwright/test';

test.describe('E2E: Búsqueda Pública de Comprobantes por DNI', () => {
  test('debe cargar la página principal con el buscador exacto', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DocuDNI/);
    await expect(page.locator('h1')).toContainText('Búsqueda de Comprobantes por DNI');

    const searchInput = page.locator('input[placeholder*="DNI"]');
    await expect(searchInput).toBeVisible();
  });

  test('debe validar la longitud y formato del DNI', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('input[placeholder*="DNI"]');

    // Escribir un número incompleto (4 dígitos)
    await searchInput.fill('1234');
    await expect(page.locator('text=El DNI debe tener 8 dígitos')).toBeVisible();
  });

  test('debe permitir buscar y visualizar el comprobante de ejemplo (47037422)', async ({ page }) => {
    await page.goto('/');
    
    // Hacer clic en el chip de ejemplo 47037422
    const exampleButton = page.locator('button:has-text("47037422")');
    if (await exampleButton.isVisible()) {
      await exampleButton.click();
    } else {
      const searchInput = page.locator('input[placeholder*="DNI"]');
      await searchInput.fill('47037422');
      await page.keyboard.press('Enter');
    }

    // Esperar resultados
    await expect(page.locator('text=Resultados para DNI')).toBeVisible({ timeout: 10000 });
  });
});
