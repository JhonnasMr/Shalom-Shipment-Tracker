import { IOcrProvider, RawOcrOutput } from '@/lib/ocr/interfaces';

export class AzureDocIntelligenceProvider implements IOcrProvider {
  readonly name = 'azure_document_intelligence';
  private endpoint?: string;
  private apiKey?: string;

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = endpoint || process.env.AZURE_DOC_AI_ENDPOINT;
    this.apiKey = apiKey || process.env.OCR_API_KEY;
  }

  async recognize(imageBuffer: Buffer, mimeType: string = 'image/png'): Promise<RawOcrOutput> {
    if (!this.endpoint || !this.apiKey) {
      throw new Error('Azure Document Intelligence no está configurado (AZURE_DOC_AI_ENDPOINT / OCR_API_KEY)');
    }

    const analyzeUrl = `${this.endpoint}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-02-29-preview`;

    const res = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Content-Type': mimeType,
      },
      body: new Uint8Array(imageBuffer),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error invocando Azure Document Intelligence (${res.status}): ${errText}`);
    }

    const operationLocation = res.headers.get('Operation-Location');
    if (!operationLocation) {
      throw new Error('Respuesta inesperada de Azure: falta Operation-Location');
    }

    // Polling del resultado de análisis
    let status = 'running';
    let resultData: any = null;

    for (let attempts = 0; attempts < 15; attempts++) {
      await new Promise(r => setTimeout(r, 1000));
      const pollRes = await fetch(operationLocation, {
        headers: { 'Ocp-Apim-Subscription-Key': this.apiKey },
      });
      if (!pollRes.ok) continue;

      resultData = await pollRes.json();
      status = resultData.status;
      if (status === 'succeeded' || status === 'failed') break;
    }

    if (status !== 'succeeded') {
      throw new Error(`Azure Document Intelligence finalizó con estado: ${status}`);
    }

    const content = resultData.analyzeResult?.content || '';
    return {
      text: content,
      confidence: 0.96,
    };
  }
}
