import { NextRequest, NextResponse } from 'next/server';
import { OcrService } from '@/lib/ocr/ocr-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Debe proporcionar un archivo de imagen en el campo "file"' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Procesar la imagen con el pipeline OCR
    const result = await OcrService.processReceipt(buffer, file.type || 'image/png');

    return NextResponse.json({
      success: true,
      data: {
        recipientName: result.extraction.recipientName,
        recipientDni: result.extraction.recipientDni,
        confidence: result.extraction.confidence,
        confidenceLevel: result.extraction.confidenceLevel,
        needsReview: result.extraction.needsReview,
        senderName: result.extraction.senderName,
        senderDni: result.extraction.senderDni,
        rawText: result.extraction.rawText,
        warnings: result.extraction.warnings,
        provider: result.extraction.provider,
        imageHash: result.preprocessed.hash,
        width: result.preprocessed.width,
        height: result.preprocessed.height,
      },
    });
  } catch (error: any) {
    console.error('Error en /api/ocr/process:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar el OCR' },
      { status: 500 }
    );
  }
}
