export interface DniValidationResult {
  isValid: boolean;
  type: 'DNI' | 'CE' | 'INVALID';
  normalizedNumber: string;
  error?: string;
}

export class DniValidator {
  /**
   * Valida un número de documento peruano (DNI de 8 dígitos o CE de 8-10 caracteres)
   */
  static validate(input: string): DniValidationResult {
    if (!input) {
      return { isValid: false, type: 'INVALID', normalizedNumber: '', error: 'El documento no puede estar vacío' };
    }

    // Limpia espacios en blanco iniciales, finales y caracteres de puntuación
    const cleaned = input.trim().replace(/[-. ]/g, '');

    // 1. Verificación de DNI estándar (8 dígitos numéricos exactos)
    if (/^\d{8}$/.test(cleaned)) {
      // Regla de cordura: descartar números repetitivos triviales como 00000000
      if (/^(\d)\1{7}$/.test(cleaned)) {
        return {
          isValid: false,
          type: 'INVALID',
          normalizedNumber: cleaned,
          error: 'El DNI no puede consistir en el mismo dígito repetido',
        };
      }

      return {
        isValid: true,
        type: 'DNI',
        normalizedNumber: cleaned,
      };
    }

    // 2. Descarte estricto de números telefónicos móviles de Perú (9 dígitos que inician con 9)
    if (/^9\d{8}$/.test(cleaned)) {
      return {
        isValid: false,
        type: 'INVALID',
        normalizedNumber: cleaned,
        error: 'El número ingresado corresponde al formato de un teléfono celular (9 dígitos que inician con 9), no a un DNI',
      };
    }

    // 3. Verificación de Carnet de Extranjería (CE: 9 a 10 dígitos o caracteres alfanuméricos)
    if (/^[A-Za-z0-9]{9,10}$/.test(cleaned)) {
      return {
        isValid: true,
        type: 'CE',
        normalizedNumber: cleaned.toUpperCase(),
      };
    }

    return {
      isValid: false,
      type: 'INVALID',
      normalizedNumber: cleaned,
      error: `El documento debe tener 8 dígitos numéricos (DNI) o hasta 10 caracteres (CE). Longitud actual: ${cleaned.length}`,
    };
  }

  /**
   * Intenta normalizar caracteres comunes de confusión OCR en cadenas que parecen DNIs
   */
  static cleanOcrDniCandidates(candidate: string): string {
    return candidate
      .replace(/[oO]/g, '0')
      .replace(/[iIl]/g, '1')
      .replace(/[zZ]/g, '2')
      .replace(/[sS]/g, '5')
      .replace(/[bB]/g, '8')
      .replace(/[^0-9]/g, '');
  }
}
