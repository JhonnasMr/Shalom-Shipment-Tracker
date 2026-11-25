import { IOcrProvider, RawOcrOutput } from '@/lib/ocr/interfaces';

export class GoogleVisionProvider implements IOcrProvider {
  readonly name = 'google_vision';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OCR_API_KEY;
  }

  async recognize(imageBuffer: Buffer, mimeType: string = 'image/png'): Promise<RawOcrOutput> {
    if (!this.apiKey) {
      throw new Error('Google Cloud Vision API key no está configurada (OCR_API_KEY)');
    }

    const base64Image = imageBuffer.toString('base64');
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`;

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 1,
            },
          ],
          imageContext: {
            languageHints: ['es'],
          },
        },
      ],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error en Google Cloud Vision API (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const annotation = data.responses?.[0]?.fullTextAnnotation;
    const text = annotation?.text || '';

    return {
      text,
      confidence: 0.95,
    };
  }
}
