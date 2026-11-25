import { test, expect } from '@playwright/test';

test.describe('E2E: Flujo Móvil PWA del Operador', () => {
  test('debe permitir navegar a la app móvil y ver el estado del turno', async ({ page }) => {
    await page.goto('/mobile');
    await expect(page.locator('text=Carlos Operador')).toBeVisible();
    await expect(page.locator('text=Digitalizar Comprobante')).toBeVisible();
    await expect(page.locator('text=Procesados Hoy')).toBeVisible();
  });

  test('debe abrir la pantalla de captura con la guía de encuadre', async ({ page }) => {
    await page.goto('/mobile/capture');
    await expect(page.locator('text=Paso 1: Captura')).toBeVisible();
    await expect(page.locator('text=ZONA: DATOS DEL DESTINATARIO')).toBeVisible();
  });
});
