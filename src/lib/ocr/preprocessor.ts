import sharp from 'sharp';
import crypto from 'crypto';
import { ImagePreprocessResult } from '@/types/ocr';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export class ImagePreprocessor {
  /**
   * Valida y pre-procesa el buffer de una fotografía para optimizar el OCR
   */
  static async preprocess(inputBuffer: Buffer, mimeType: string): Promise<ImagePreprocessResult> {
    if (!inputBuffer || inputBuffer.length === 0) {
      throw new Error('El archivo de imagen está vacío');
    }

    if (inputBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`El archivo excede el tamaño máximo permitido de 15MB (${(inputBuffer.length / (1024 * 1024)).toFixed(2)}MB)`);
    }

    // Calcula SHA-256 para integridad y deduplicación
    const hash = crypto.createHash('sha256').update(inputBuffer).digest('hex');

    // Carga la imagen en Sharp
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('No se pudo determinar las dimensiones de la imagen');
    }

    // Corrección de orientación, conversión a escala de grises y normalización de contraste
    // para maximizar el contraste de caracteres impresos en tickets térmicos
    const processedBuffer = await sharp(inputBuffer)
      .rotate() // auto-rotar según EXIF
      .grayscale()
      .normalize()
      .sharpen({
        sigma: 1.2,
        m1: 0.5,
        m2: 2.5,
        x1: 2,
        y2: 10,
        y3: 20
      })
      .png({ quality: 100 })
      .toBuffer();

    return {
      buffer: processedBuffer,
      mimeType: 'image/png',
      width: metadata.width,
      height: metadata.height,
      hash,
    };
  }

  /**
   * Recorta una región específica (Bounding Box) si se localiza el bloque de interés
   */
  static async cropRegion(
    imageBuffer: Buffer,
    region: { left: number; top: number; width: number; height: number }
  ): Promise<Buffer> {
    return sharp(imageBuffer)
      .extract(region)
      .toBuffer();
  }
}
