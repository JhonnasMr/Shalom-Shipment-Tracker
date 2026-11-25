import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as searchGet } from '@/app/api/receipts/search/route';
import { GET as statsGet } from '@/app/api/receipts/stats/route';
import { ReceiptsService } from '@/lib/receipts/receipts-service';

describe('Receipts API Integration Tests', () => {
  it('should return 400 when searching without DNI param', async () => {
    const req = new NextRequest('http://localhost:3000/api/receipts/search');
    const res = await searchGet(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain('Debe ingresar el número de DNI');
  });

  it('should return 400 when searching with invalid DNI format (e.g. 5 digits)', async () => {
    const req = new NextRequest('http://localhost:3000/api/receipts/search?dni=12345');
    const res = await searchGet(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain('Número de documento inválido');
  });

  it('should return dashboard stats successfully when service responds', async () => {
    // Mock del servicio para evitar timeout en entorno aislado sin red externa
    const mockStats = {
      totalReceipts: 250,
      uniqueDnis: 195,
      todayReceipts: 38,
      sevenDaysReceipts: 184,
      recentReceipts: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          recipient_name: 'RODRIGUEZ GARCIA SANDRA YASET',
          recipient_dni: '47037422',
          created_at: new Date().toISOString(),
          ocr_confidence: 0.98,
          manual_correction: false,
        },
      ],
    };

    vi.spyOn(ReceiptsService, 'getDashboardStats').mockResolvedValueOnce(mockStats);

    const res = await statsGet();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.totalReceipts).toBe(250);
    expect(json.data.uniqueDnis).toBe(195);
  });
});

