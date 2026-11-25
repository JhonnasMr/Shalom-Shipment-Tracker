import { NextRequest, NextResponse } from 'next/server';
import { ReceiptsService } from '@/lib/receipts/receipts-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dni = searchParams.get('dni');

    if (!dni) {
      return NextResponse.json(
        { error: 'Debe ingresar el número de DNI o Carnet de Extranjería a consultar' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    const results = await ReceiptsService.searchByDni(dni, ipAddress, userAgent);

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error('Error en GET /api/receipts/search:', error);
    return NextResponse.json(
      { error: error.message || 'Error al buscar comprobantes' },
      { status: 400 }
    );
  }
}
