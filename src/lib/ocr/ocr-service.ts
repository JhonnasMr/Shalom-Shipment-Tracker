import { IOcrProvider } from '@/lib/ocr/interfaces';
import { TesseractProvider } from '@/lib/ocr/providers/tesseract-provider';
import { GoogleVisionProvider } from '@/lib/ocr/providers/google-vision-provider';
import { AzureDocIntelligenceProvider } from '@/lib/ocr/providers/azure-doc-intelligence-provider';
import { ImagePreprocessor } from '@/lib/ocr/preprocessor';
import { ContextualDniExtractor } from '@/lib/ocr/contextual-extractor';
import { ImagePreprocessResult, OcrExtractionResult } from '@/types/ocr';

export interface ProcessReceiptResult {
  extraction: OcrExtractionResult;
  preprocessed: ImagePreprocessResult;
}

export class OcrService {
  private static providerInstance: IOcrProvider | null = null;

  /**
   * Obtiene la instancia del proveedor OCR configurado en variables de entorno
   */
  static getProvider(): IOcrProvider {
    if (this.providerInstance) {
      return this.providerInstance;
    }

    const providerType = (process.env.OCR_PROVIDER || 'tesseract').toLowerCase();

    switch (providerType) {
      case 'google_vision':
        this.providerInstance = new GoogleVisionProvider();
        break;
      case 'azure_document_intelligence':
        this.providerInstance = new AzureDocIntelligenceProvider();
        break;
      case 'tesseract':
      default:
        this.providerInstance = new TesseractProvider();
        break;
    }

    return this.providerInstance;
  }

  /**
   * Pipeline integral de procesamiento:
   * 1. Validación de imagen y pre-procesamiento Sharp (orientación, contraste)
   * 2. Cálculo de SHA-256
   * 3. Reconocimiento OCR mediante el proveedor activo
   * 4. Extracción contextual del bloque DATOS DEL DESTINATARIO
   * 5. Evaluación de confianza y validación de 8 dígitos de DNI
   */
  static async processReceipt(
    imageBuffer: Buffer,
    mimeType: string = 'image/png'
  ): Promise<ProcessReceiptResult> {
    // Paso 1 y 2: Preprocesamiento y hash
    const preprocessed = await ImagePreprocessor.preprocess(imageBuffer, mimeType);

    // Paso 3: OCR
    const provider = this.getProvider();
    const rawOutput = await provider.recognize(preprocessed.buffer, preprocessed.mimeType);

    // Paso 4 y 5: Extracción contextual de DNI y Nombre del Destinatario
    const extraction = ContextualDniExtractor.extract(rawOutput.text, provider.name);

    return {
      extraction,
      preprocessed,
    };
  }
}
