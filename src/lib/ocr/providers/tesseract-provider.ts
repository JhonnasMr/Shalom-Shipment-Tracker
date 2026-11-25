import { createWorker } from 'tesseract.js';
import { IOcrProvider, RawOcrOutput } from '@/lib/ocr/interfaces';

export class TesseractProvider implements IOcrProvider {
  readonly name = 'tesseract';

  async recognize(imageBuffer: Buffer, mimeType?: string): Promise<RawOcrOutput> {
    const worker = await createWorker('spa');
    try {
      const result = await worker.recognize(imageBuffer);
      const text = result.data.text || '';
      const confidence = result.data.confidence ? result.data.confidence / 100 : 0.85;

      const wordBoxes = (result.data.words || []).map(w => ({
        text: w.text,
        confidence: w.confidence / 100,
        bbox: {
          x: w.bbox.x0,
          y: w.bbox.y0,
          width: w.bbox.x1 - w.bbox.x0,
          height: w.bbox.y1 - w.bbox.y0,
        },
      }));

      return {
        text,
        confidence,
        wordBoxes,
      };
    } finally {
      await worker.terminate();
    }
  }
}
