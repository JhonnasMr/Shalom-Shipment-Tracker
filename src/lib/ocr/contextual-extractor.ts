import { OcrConfidenceLevel, OcrExtractionResult } from '@/types/ocr';
import { DniValidator } from '@/lib/validations/dni-validator';

export class ContextualDniExtractor {
  /**
   * Extrae el DNI y Nombre del destinatario desde el texto sin procesar devuelto por el OCR
   */
  static extract(rawText: string, providerName: string = 'tesseract'): OcrExtractionResult {
    const warnings: string[] = [];
    const normalizedText = rawText.replace(/\r\n/g, '\n');
    const lines = normalizedText.split('\n').map(l => l.trim()).filter(Boolean);

    let senderName: string | null = null;
    let senderDni: string | null = null;
    let recipientName: string | null = null;
    let recipientDni: string | null = null;

    // 1. Detección de secciones: Remitente vs Destinatario
    let inSenderSection = false;
    let inRecipientSection = false;
    const recipientLines: string[] = [];
    const senderLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upperLine = line.toUpperCase();

      // Detectar inicio de bloque Remitente
      if (upperLine.includes('REMITENTE')) {
        inSenderSection = true;
        inRecipientSection = false;
        continue;
      }

      // Detectar inicio de bloque Destinatario
      if (upperLine.includes('DESTINATARIO') || upperLine.includes('CONSIGNATARIO')) {
        inRecipientSection = true;
        inSenderSection = false;
        continue;
      }

      // Detectar fin del bloque de datos personales (e.g. "ENTREGA", "FORMA DE PAGO", "DESCRIPCION", "OBSERVACIONES")
      if (
        inRecipientSection &&
        (upperLine.includes('ENTREGA') ||
          upperLine.includes('FORMA DE PAGO') ||
          upperLine.includes('DIRECCION') ||
          upperLine.includes('DESCRIPCION') ||
          upperLine.includes('OBSERVACIONES'))
      ) {
        inRecipientSection = false;
      }

      if (inSenderSection) {
        senderLines.push(line);
      } else if (inRecipientSection) {
        recipientLines.push(line);
      }
    }

    // 2. Extraer datos del Remitente para descarte explícito
    const senderBlockText = senderLines.join('\n');
    const senderDniMatch = senderBlockText.match(/(?:DNI|DN|DOC|DOCUMENTO|NRO)[\s:.-]*([0-9]{8})/i);
    if (senderDniMatch) {
      senderDni = senderDniMatch[1];
    }
    const senderNameMatch = senderBlockText.match(/(?:Nombre|Mombre)[\s:.-]+([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/i);
    if (senderNameMatch) {
      senderName = senderNameMatch[1].trim();
    }

    // 3. Extraer datos del Destinatario (ZONA CRÍTICA)
    const recipientBlockText = recipientLines.length > 0 ? recipientLines.join('\n') : normalizedText;

    // A) Búsqueda del Nombre del Destinatario
    const nameMatch = recipientBlockText.match(/(?:Nombre|Mombre|Destinatario)[\s:.-]+([A-ZÁÉÍÓÚÑ\s]{4,60})/i);
    if (nameMatch) {
      recipientName = nameMatch[1].trim();
      // Limpiar sufijos accidentales como "DNI", "TEL"
      recipientName = recipientName.replace(/\s+(?:DNI|DN|TIM|TEL|TELEFONO).*$/i, '').trim();
    }

    // B) Búsqueda del DNI del Destinatario
    // Patrón 1: Etiqueta explícita DNI / TIM / DN / DOC
    const labeledDniMatch = recipientBlockText.match(/(?:DNI|DN|TIM|DOC|DOCUMENTO|NRO)[\s:.-]*([0-9OoilIsSbB]{8,10})/i);
    
    if (labeledDniMatch) {
      const candidateRaw = labeledDniMatch[1];
      const cleaned = DniValidator.cleanOcrDniCandidates(candidateRaw);
      
      const val = DniValidator.validate(cleaned);
      if (val.isValid && cleaned !== senderDni) {
        recipientDni = val.normalizedNumber;
      }
    }

    // Si aún no se encontró el DNI del destinatario, buscar cualquier secuencia de 8 dígitos en el bloque de destinatario
    if (!recipientDni && recipientLines.length > 0) {
      const allNumbers = recipientBlockText.match(/\b\d{8}\b/g) || [];
      for (const num of allNumbers) {
        // Descartar si es el DNI del remitente
        if (num === senderDni) continue;
        const val = DniValidator.validate(num);
        if (val.isValid) {
          recipientDni = num;
          warnings.push('DNI detectado por patrón numérico de 8 dígitos sin etiqueta explícita');
          break;
        }
      }
    }

    // Fallback general en todo el documento si no se delimitó el bloque pero existe un DNI diferente al remitente
    if (!recipientDni) {
      const globalMatches = normalizedText.match(/(?:DNI|DN|TIM|DOC)[\s:.-]*([0-9]{8})/gi) || [];
      for (const m of globalMatches) {
        const num = m.replace(/[^0-9]/g, '');
        if (num !== senderDni && DniValidator.validate(num).isValid) {
          recipientDni = num;
          warnings.push('DNI extraído de búsqueda global fuera del bloque de destinatario delimitado');
          break;
        }
      }
    }

    // 4. Cálculo del nivel de confianza (Confidence Scoring)
    let score = 0.50; // Base inicial

    if (recipientLines.length > 0) {
      score += 0.20; // Bloque "DATOS DEL DESTINATARIO" correctamente localizado
    }

    if (recipientDni) {
      const val = DniValidator.validate(recipientDni);
      if (val.isValid && val.type === 'DNI') {
        score += 0.20; // DNI de 8 dígitos estrictamente válido
      }
      if (recipientDni !== senderDni) {
        score += 0.05; // No coincide con remitente
      }
    } else {
      score -= 0.30;
      warnings.push('No se pudo identificar un DNI de destinatario válido');
    }

    if (recipientName && recipientName.length >= 5) {
      score += 0.05; // Nombre localizado coherentemente
    }

    // Limitar entre 0.0 y 1.0
    const finalConfidence = Math.max(0.10, Math.min(1.00, Number(score.toFixed(2))));

    let confidenceLevel: OcrConfidenceLevel = 'low';
    let needsReview = true;

    if (finalConfidence >= 0.88 && recipientDni) {
      confidenceLevel = 'high';
      needsReview = false; // Alta confianza, listo para confirmación rápida
    } else if (finalConfidence >= 0.65 && recipientDni) {
      confidenceLevel = 'medium';
      needsReview = true; // Confianza intermedia, requiere verificación visual
    } else {
      confidenceLevel = 'low';
      needsReview = true; // Baja confianza, requiere edición manual obligatoria
    }

    return {
      recipientName,
      recipientDni,
      confidence: finalConfidence,
      confidenceLevel,
      needsReview,
      senderName,
      senderDni,
      rawText,
      provider: providerName,
      extractedAt: new Date().toISOString(),
      warnings,
    };
  }
}
