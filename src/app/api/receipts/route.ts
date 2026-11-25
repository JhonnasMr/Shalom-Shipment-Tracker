import { NextRequest, NextResponse } from 'next/server';
import { ReceiptsService } from '@/lib/receipts/receipts-service';
import { createServerSideClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const recipientName = formData.get('recipientName') as string | null;
    const recipientDni = formData.get('recipientDni') as string | null;
    const ocrDetectedDni = formData.get('ocrDetectedDni') as string | null;
    const ocrDetectedName = formData.get('ocrDetectedName') as string | null;
    const ocrConfidence = parseFloat(formData.get('ocrConfidence') as string || '0.90');
    const ocrProvider = (formData.get('ocrProvider') as string) || 'tesseract';
    const imageHash = formData.get('imageHash') as string || '';
    const manualCorrection = formData.get('manualCorrection') === 'true';

    if (!file || !recipientDni || !recipientName) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: file, recipientDni, recipientName' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Obtener sesión activa si existe
    let sessionUserId: string | null = null;
    try {
      const supabase = await createServerSideClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        sessionUserId = user.id;
      }
    } catch {
      // Si no hay cookies de sesión, continúa como anónimo/operador general
    }

    const result = await ReceiptsService.createReceipt({
      recipientName,
      recipientDni,
      imageBuffer: buffer,
      originalFilename: file.name || 'receipt.png',
      mimeType: file.type || 'image/png',
      imageHash: imageHash || 'unknown-hash',
      ocrProvider,
      ocrConfidence,
      ocrDetectedDni,
      ocrDetectedName,
      manualCorrection,
      userId: sessionUserId,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error en POST /api/receipts:', error);
    return NextResponse.json(
      { error: error.message || 'Error al registrar el comprobante' },
      { status: 500 }
    );
  }
}
