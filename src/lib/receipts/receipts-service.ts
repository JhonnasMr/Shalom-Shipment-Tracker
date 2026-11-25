import { createAdminClient } from '@/lib/supabase/server';
import { DniValidator } from '@/lib/validations/dni-validator';
import crypto from 'crypto';

export interface CreateReceiptParams {
  recipientName: string;
  recipientDni: string;
  imageBuffer: Buffer;
  originalFilename: string;
  mimeType: string;
  imageHash: string;
  ocrProvider: string;
  ocrConfidence: number;
  ocrDetectedDni?: string | null;
  ocrDetectedName?: string | null;
  manualCorrection: boolean;
  ocrRawResult?: any;
  userId?: string | null;
  ipAddress?: string;
  userAgent?: string;
}

export interface ReceiptDto {
  id: string;
  recipientName: string;
  recipientDni: string;
  storagePath: string;
  signedUrl?: string;
  capturedAt: string;
  createdAt: string;
  originalFilename?: string;
  ocrConfidence?: number;
  manualCorrection?: boolean;
}

export class ReceiptsService {
  /**
   * Crea un comprobante garantizando consistencia y compensación ante fallos:
   * 1. Valida estrictamente el DNI/CE
   * 2. Sube la imagen al bucket privado 'receipts'
   * 3. Inserta el registro en PostgreSQL
   * 4. En caso de fallo en BD, elimina el archivo de Storage (Rollback)
   * 5. Registra la auditoría conforme a la Ley N.° 29733
   */
  static async createReceipt(params: CreateReceiptParams): Promise<{ id: string; storagePath: string }> {
    // 1. Validación estricta del DNI/CE
    const validation = DniValidator.validate(params.recipientDni);
    if (!validation.isValid) {
      throw new Error(`DNI/CE inválido: ${validation.error}`);
    }

    const supabase = createAdminClient();
    const receiptId = crypto.randomUUID();

    // 2. Resolver usuario creador válido (evitar violar FK receipts_created_by_fkey si el usuario no existe en profiles)
    let validUserId: string | null = null;
    if (params.userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', params.userId)
        .maybeSingle();

      if (profile?.id) {
        validUserId = profile.id;
      }
    }

    const storageFolder = validUserId || 'general';
    const fileExt = params.originalFilename.split('.').pop() || 'png';
    const storagePath = `${storageFolder}/${receiptId}.${fileExt}`;

    // 3. Subida a Storage privado
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(storagePath, params.imageBuffer, {
        contentType: params.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error al subir la imagen al almacenamiento seguro: ${uploadError.message}`);
    }

    try {
      // 4. Inserción en la base de datos
      const { data, error: dbError } = await supabase
        .from('receipts')
        .insert({
          id: receiptId,
          recipient_name: params.recipientName.trim().toUpperCase(),
          recipient_dni: validation.normalizedNumber,
          storage_path: storagePath,
          original_filename: params.originalFilename,
          mime_type: params.mimeType,
          file_size: params.imageBuffer.length,
          image_hash: params.imageHash,
          ocr_provider: params.ocrProvider,
          ocr_confidence: params.ocrConfidence,
          ocr_raw_result: params.ocrRawResult || {},
          ocr_detected_dni: params.ocrDetectedDni || null,
          ocr_detected_name: params.ocrDetectedName || null,
          manual_correction: params.manualCorrection,
          processing_status: 'confirmed',
          captured_at: new Date().toISOString(),
          created_by: validUserId, // NULL si no hay sesión o perfil registrado
        })
        .select('id')
        .single();

      if (dbError) {
        throw dbError;
      }

      // 5. Registro de auditoría
      await supabase.from('audit_logs').insert({
        user_id: validUserId, // NULL para registros anónimos o sin perfil
        action: 'CREATE_RECEIPT',
        entity_type: 'receipt',
        entity_id: receiptId,
        metadata: {
          recipient_dni: validation.normalizedNumber,
          manual_correction: params.manualCorrection,
          confidence: params.ocrConfidence,
        },
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
      });

      return { id: receiptId, storagePath };
    } catch (dbErr: any) {
      // Mecanismo de compensación: Si falló la BD, borrar la foto del storage para no dejar huérfanos
      console.error('Fallo en BD al guardar comprobante. Ejecutando compensación en Storage...', dbErr);
      await supabase.storage.from('receipts').remove([storagePath]);
      throw new Error(`Error al registrar en base de datos: ${dbErr.message || 'Error desconocido'}`);
    }
  }

  /**
   * Búsqueda por DNI (pública o administrativa) con generación de URLs firmadas temporales
   */
  static async searchByDni(dni: string, ipAddress?: string, userAgent?: string): Promise<ReceiptDto[]> {
    const validation = DniValidator.validate(dni);
    if (!validation.isValid) {
      throw new Error(`Número de documento inválido: ${validation.error}`);
    }

    const supabase = createAdminClient();

    // Consulta de comprobantes asociados al DNI
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('id, recipient_name, recipient_dni, storage_path, captured_at, created_at, original_filename, ocr_confidence, manual_correction')
      .eq('recipient_dni', validation.normalizedNumber)
      .eq('processing_status', 'confirmed')
      .order('captured_at', { ascending: false });

    if (error) {
      throw new Error(`Error al consultar comprobantes: ${error.message}`);
    }

    if (!receipts || receipts.length === 0) {
      // Registrar intento de búsqueda en auditoría
      await supabase.from('audit_logs').insert({
        action: 'SEARCH_DNI_NOT_FOUND',
        entity_type: 'dni_query',
        entity_id: validation.normalizedNumber,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
      return [];
    }

    // Generar URLs firmadas con vencimiento de 15 minutos (900s)
    const results: ReceiptDto[] = [];
    const expirySeconds = Number(process.env.SIGNED_URL_EXPIRY_SECONDS || '900');

    for (const r of receipts) {
      const { data: signedData } = await supabase.storage
        .from('receipts')
        .createSignedUrl(r.storage_path, expirySeconds);

      results.push({
        id: r.id,
        recipientName: r.recipient_name,
        recipientDni: r.recipient_dni,
        storagePath: r.storage_path,
        signedUrl: signedData?.signedUrl || '',
        capturedAt: r.captured_at,
        createdAt: r.created_at,
        originalFilename: r.original_filename,
        ocrConfidence: r.ocr_confidence,
        manualCorrection: r.manual_correction,
      });
    }

    // Registrar auditoría de búsqueda exitosa
    await supabase.from('audit_logs').insert({
      action: 'SEARCH_DNI_FOUND',
      entity_type: 'dni_query',
      entity_id: validation.normalizedNumber,
      metadata: { results_count: results.length },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return results;
  }

  /**
   * Obtiene métricas agregadas para el dashboard administrativo
   */
  static async getDashboardStats() {
    const supabase = createAdminClient();

    const [totalRes, todayRes, sevenDaysRes, recentRes] = await Promise.all([
      supabase.from('receipts').select('id, recipient_dni', { count: 'exact' }),
      supabase.from('receipts').select('id', { count: 'exact' }).gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
      supabase.from('receipts').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()),
      supabase.from('receipts').select('id, recipient_name, recipient_dni, created_at, ocr_confidence, manual_correction').order('created_at', { ascending: false }).limit(6),
    ]);

    // Calcular DNIs únicos
    const uniqueDnis = new Set((totalRes.data || []).map(r => r.recipient_dni)).size;

    return {
      totalReceipts: totalRes.count || (totalRes.data?.length ?? 0),
      uniqueDnis,
      todayReceipts: todayRes.count || (todayRes.data?.length ?? 0),
      sevenDaysReceipts: sevenDaysRes.count || (sevenDaysRes.data?.length ?? 0),
      recentReceipts: recentRes.data || [],
    };
  }
}
