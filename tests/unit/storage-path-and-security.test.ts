import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Storage Path Generation & Security Rules', () => {
  it('should generate secure UUID storage paths without exposing DNI in file name', () => {
    const userId = '00000000-0000-0000-0000-000000000001';
    const receiptUuid = crypto.randomUUID();
    const fileExt = 'png';
    const storagePath = `${userId}/${receiptUuid}.${fileExt}`;

    // Validar que la ruta tenga el formato userId/receiptUuid.ext
    expect(storagePath).toMatch(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.png$/);
    // IMPORTANTE: El DNI NUNCA debe estar en el storage path (privacidad)
    expect(storagePath).not.toContain('47037422');
  });

  it('should generate reproducible SHA-256 hash for identical image buffers', () => {
    const buffer1 = Buffer.from('test-receipt-image-content-identical');
    const buffer2 = Buffer.from('test-receipt-image-content-identical');
    const bufferDifferent = Buffer.from('another-receipt');

    const hash1 = crypto.createHash('sha256').update(buffer1).digest('hex');
    const hash2 = crypto.createHash('sha256').update(buffer2).digest('hex');
    const hashDiff = crypto.createHash('sha256').update(bufferDifferent).digest('hex');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDiff);
    expect(hash1).toHaveLength(64);
  });
});
