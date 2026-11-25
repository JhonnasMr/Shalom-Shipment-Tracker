import { OcrExtractionResult, OcrWordBox } from '@/types/ocr';

export interface RawOcrOutput {
  text: string;
  confidence?: number;
  wordBoxes?: OcrWordBox[];
}

export interface IOcrProvider {
  readonly name: string;
  recognize(imageBuffer: Buffer, mimeType?: string): Promise<RawOcrOutput>;
}
