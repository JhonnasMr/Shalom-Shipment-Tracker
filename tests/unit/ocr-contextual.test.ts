import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ContextualDniExtractor } from '@/lib/ocr/contextual-extractor';
import { DniValidator } from '@/lib/validations/dni-validator';

describe('DniValidator Unit Tests', () => {
  it('should validate exact 8-digit Peruvian DNI', () => {
    const valid = DniValidator.validate('47037422');
    expect(valid.isValid).toBe(true);
    expect(valid.type).toBe('DNI');
    expect(valid.normalizedNumber).toBe('47037422');
  });

  it('should reject repetitive trivial DNIs', () => {
    const invalid = DniValidator.validate('00000000');
    expect(invalid.isValid).toBe(false);
  });

  it('should reject phone numbers (9 digits starting with 9)', () => {
    const phone = DniValidator.validate('913561135');
    expect(phone.isValid).toBe(false);
    expect(phone.error).toContain('teléfono celular');
  });

  it('should validate Carnet de Extranjeria (CE) of 9-10 chars', () => {
    const ce = DniValidator.validate('001234567');
    expect(ce.isValid).toBe(true);
    expect(ce.type).toBe('CE');
  });
});

describe('ContextualDniExtractor on Real Shalom Receipt Text', () => {
  const shalomSampleText = `
    DATOS TICKET SHALOM
    SAN IGNACIO - SAN IGNACIO
    SAN IGNACIO
    DATOS
    NRO. ORDEN: 104792291 CODIGO: CDN7
    Fecha Emisión: 2026-11-21 11:05:12
    
    DATOS DEL REMITENTE
    Nombre: VILLANUEVA TACUCHI SARITA OLINDA
    DNI: 41316372 - Telefono: 926938449
    GRR:
    
    DATOS DEL DESTINATARIO
    Nombre: RODRIGUEZ GARCIA SANDRA YASET
    DNI: 47037422 - Telefono: 913561135
    
    ENTREGA
    Direccion: ENTREGAR EN AGENCIA
    FORMA DE PAGO: Pendiente de Pago
  `;

  it('should correctly select recipient DNI (47037422) and not sender DNI (41316372)', () => {
    const result = ContextualDniExtractor.extract(shalomSampleText, 'tesseract');

    expect(result.recipientDni).toBe('47037422');
    expect(result.recipientName).toContain('RODRIGUEZ GARCIA SANDRA YASET');
    expect(result.senderDni).toBe('41316372');
    expect(result.senderName).toContain('VILLANUEVA TACUCHI SARITA OLINDA');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    expect(result.confidenceLevel).toBe('high');
    expect(result.needsReview).toBe(false);
  });

  it('should handle OCR character confusion (e.g. TIM instead of DNI or Mombre instead of Nombre)', () => {
    const noisyShalomText = `
      DATOS DEL REMITENTE
      Nombre: VILLANUEVA TACUCHI SARITA OLINDA
      DN: 41318372 - Telefono: 926938449
      
      DATOS DEL DESTINATARIO
      Mombre: RODRIGUEZ GARCIA SANDRA YASET
      TIM: 47037422 - Telefono: 013561135
      Direccion ENTREGAR EN AGENCIA
    `;

    const result = ContextualDniExtractor.extract(noisyShalomText, 'tesseract');
    expect(result.recipientDni).toBe('47037422');
    expect(result.recipientName).toContain('RODRIGUEZ GARCIA SANDRA YASET');
    expect(result.confidenceLevel).toBe('high');
  });
});
