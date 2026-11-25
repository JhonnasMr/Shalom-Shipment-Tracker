'use client';

import { useState } from 'react';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { DniValidator } from '@/lib/validations/dni-validator';
import { OcrExtractionResult } from '@/types/ocr';
import { Check, RotateCcw, AlertTriangle, User, Hash, ShieldAlert } from 'lucide-react';

interface ReceiptValidationFormProps {
  imageFile: File;
  previewUrl: string;
  ocrResult: OcrExtractionResult;
  onConfirm: (confirmedData: {
    recipientDni: string;
    recipientName: string;
    manualCorrection: boolean;
  }) => void;
  onRetake: () => void;
  isSaving: boolean;
}

export function ReceiptValidationForm({
  imageFile,
  previewUrl,
  ocrResult,
  onConfirm,
  onRetake,
  isSaving,
}: ReceiptValidationFormProps) {
  const [recipientDni, setRecipientDni] = useState(ocrResult.recipientDni || '');
  const [recipientName, setRecipientName] = useState(ocrResult.recipientName || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Comprobar si hubo corrección manual sobre lo que detectó el OCR
  const isManuallyCorrected =
    recipientDni !== (ocrResult.recipientDni || '') ||
    recipientName !== (ocrResult.recipientName || '');

  const handleDniChange = (val: string) => {
    const cleaned = val.replace(/\s+/g, '');
    setRecipientDni(cleaned);

    const res = DniValidator.validate(cleaned);
    if (!res.isValid) {
      setValidationError(res.error || 'DNI inválido');
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = DniValidator.validate(recipientDni);
    if (!res.isValid) {
      setValidationError(res.error || 'Debe ingresar un DNI válido de 8 dígitos');
      return;
    }
    if (!recipientName.trim()) {
      setValidationError('Debe ingresar el nombre del destinatario');
      return;
    }

    onConfirm({
      recipientDni: res.normalizedNumber,
      recipientName: recipientName.trim().toUpperCase(),
      manualCorrection: isManuallyCorrected,
    });
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto w-full bg-card rounded-3xl p-5 shadow-xl border border-border space-y-4">
      {/* Encabezado y Nivel de Confianza */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Validar Comprobante</h2>
          <p className="text-xs text-muted-foreground">Confirme los datos antes de guardar</p>
        </div>
        <ConfidenceBadge
          level={ocrResult.confidenceLevel}
          confidence={ocrResult.confidence}
        />
      </div>

      {/* Vista Previa de la Fotografía Capturada */}
      <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Comprobante capturado"
          className="h-full w-full object-contain"
        />
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] text-white/80 font-mono">
          {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
        </div>
      </div>

      {/* Advertencia si la confianza es intermedia o baja */}
      {ocrResult.needsReview && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Verificación visual requerida</span>
            Revise con atención que el DNI corresponda al <strong>Destinatario</strong> y no al Remitente o teléfono.
          </div>
        </div>
      )}

      {/* Formulario de Confirmación y Corrección Manual */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-primary" /> DNI Destinatario (8 dígitos)
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {recipientDni.length}/8
            </span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={recipientDni}
            onChange={e => handleDniChange(e.target.value)}
            placeholder="Ej: 47037422"
            className={`w-full h-11 px-3.5 rounded-xl border bg-background font-mono text-base font-bold transition-all focus:outline-none focus:ring-2 ${
              validationError
                ? 'border-destructive focus:ring-destructive/30 text-destructive'
                : 'border-border focus:ring-primary/20 text-foreground'
            }`}
          />
          {validationError && (
            <p className="mt-1 text-[11px] font-medium text-destructive flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              {validationError}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
            <User className="h-3.5 w-3.5 text-primary" /> Nombre del Destinatario
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={e => setRecipientName(e.target.value)}
            placeholder="Ej: RODRIGUEZ GARCIA SANDRA YASET"
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          />
        </div>

        {isManuallyCorrected && (
          <p className="text-[11px] text-muted-foreground italic">
            * Se registrará una corrección manual respecto a los valores detectados por el OCR.
          </p>
        )}

        {/* Acciones */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onRetake}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Repetir Foto</span>
          </button>

          <button
            type="submit"
            disabled={isSaving || !!validationError || !recipientDni}
            className="flex-1 flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Confirmar y Guardar</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
