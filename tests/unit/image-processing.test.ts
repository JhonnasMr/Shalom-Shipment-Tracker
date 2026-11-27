import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { ImagePreprocessor } from '@/lib/ocr/preprocessor';

describe('ImagePreprocessor Unit Tests', () => {
  const imagePath = path.resolve('./test-fixtures/sample_shalom_receipt.png');

  it('should successfully preprocess an image and return SHA-256 hash and metadata', async () => {
    const rawBuffer = fs.readFileSync(imagePath);
    const result = await ImagePreprocessor.preprocess(rawBuffer, 'image/png');

    expect(result.buffer).toBeDefined();
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256
    expect(result.width).toBe(431);
    expect(result.height).toBe(771);
    expect(result.mimeType).toBe('image/png');
  });

  it('should reject empty image buffers', async () => {
    await expect(
      ImagePreprocessor.preprocess(Buffer.alloc(0), 'image/png')
    ).rejects.toThrow('El archivo de imagen está vacío');
  });

  it('should downscale large images before OCR', async () => {
    const rawBuffer = await sharp({
      create: {
        width: 3000,
        height: 2000,
        channels: 3,
        background: '#ffffff',
      },
    }).png().toBuffer();

    const result = await ImagePreprocessor.preprocess(rawBuffer, 'image/png');
    const processedMetadata = await sharp(result.buffer).metadata();

    expect(Math.max(processedMetadata.width || 0, processedMetadata.height || 0)).toBeLessThanOrEqual(2400);
  });
});
