export type OcrConfidenceLevel = 'high' | 'medium' | 'low';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrWordBox {
  text: string;
  confidence: number;
  bbox?: BoundingBox;
}

export interface OcrExtractionResult {
  recipientName: string | null;
  recipientDni: string | null;
  confidence: number; // 0.00 a 1.00
  confidenceLevel: OcrConfidenceLevel;
  needsReview: boolean;
  senderName?: string | null;
  senderDni?: string | null;
  rawText: string;
  detectedRoiBox?: BoundingBox | null;
  provider: string;
  extractedAt: string;
  warnings: string[];
}

export interface ImagePreprocessResult {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  hash: string;
  cropRoiBuffer?: Buffer | null;
}
