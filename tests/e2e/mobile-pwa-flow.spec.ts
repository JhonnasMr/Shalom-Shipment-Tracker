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

  test('debe mantener activa la cámara sin reiniciarla en cada renderizado', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          enumerateDevices: async () => [{ kind: 'videoinput' }],
          getUserMedia: async () => {
            const requests = Number(localStorage.getItem('cameraRequests') || '0') + 1;
            localStorage.setItem('cameraRequests', requests.toString());
            return new MediaStream();
          },
        },
      });
      HTMLMediaElement.prototype.play = () => Promise.resolve();
    });

    await page.goto('/mobile/capture');
    await expect(page.locator('text=ZONA: DATOS DEL DESTINATARIO')).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('cameraRequests'))).toBe('1');
    await page.waitForTimeout(100);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('cameraRequests'))).toBe('1');
  });
});
