'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CameraViewfinder } from '@/components/mobile/CameraViewfinder';
import { ReceiptValidationForm } from '@/components/mobile/ReceiptValidationForm';
import { OcrExtractionResult } from '@/types/ocr';
import { CheckCircle2, ArrowLeft, RefreshCw, Sparkles, FileText, Plus, ShieldCheck } from 'lucide-react';

type CaptureState = 'camera' | 'processing' | 'validating' | 'success';

async function ensureJsonResponse(response: Response, endpoint: string) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json') || contentType.includes('+json')) return;

  const responseBody = await response.text();
  const responseFormat = responseBody.trimStart().startsWith('<') ? 'HTML' : 'contenido no JSON';
  console.error(`La API ${endpoint} devolvió ${responseFormat}:`, responseBody.slice(0, 300));
  throw new Error(
    `La API ${endpoint} respondió con ${responseFormat} (HTTP ${response.status}) en lugar de JSON. Revisa que la ruta esté desplegada y los logs del servidor.`
  );
}

export default function MobileCapturePage() {
  const [state, setState] = useState<CaptureState>('camera');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrExtractionResult | null>(null);
  const [imageHash, setImageHash] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registro exitoso
  const [confirmedReceipt, setConfirmedReceipt] = useState<{
    id: string;
    dni: string;
    name: string;
    createdAt: string;
  } | null>(null);

  const handleCapture = async (file: File) => {
    setCapturedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setState('processing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ocr/process', {
        method: 'POST',
        body: formData,
      });
      await ensureJsonResponse(res, '/api/ocr/process');

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al procesar el reconocimiento OCR');
      }

      const json = await res.json();
      setOcrResult(json.data);
      setImageHash(json.data.imageHash);
      setState('validating');
    } catch (err: any) {
      console.error('Error en captura:', err);
      setError(err.message || 'Error en el procesamiento OCR');
      setState('camera');
    }
  };

  const handleConfirmAndSave = async (confirmedData: {
    recipientDni: string;
    recipientName: string;
    manualCorrection: boolean;
  }) => {
    if (!capturedFile || !ocrResult) return;
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', capturedFile);
      formData.append('recipientDni', confirmedData.recipientDni);
      formData.append('recipientName', confirmedData.recipientName);
      formData.append('ocrConfidence', ocrResult.confidence.toString());
      formData.append('ocrProvider', ocrResult.provider);
      formData.append('ocrDetectedDni', ocrResult.recipientDni || '');
      formData.append('ocrDetectedName', ocrResult.recipientName || '');
      formData.append('manualCorrection', confirmedData.manualCorrection.toString());
      formData.append('imageHash', imageHash);

      const res = await fetch('/api/receipts', {
        method: 'POST',
        body: formData,
      });
      await ensureJsonResponse(res, '/api/receipts');

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al guardar el comprobante');
      }

      const json = await res.json();
      setConfirmedReceipt({
        id: json.data.id,
        dni: confirmedData.recipientDni,
        name: confirmedData.recipientName,
        createdAt: new Date().toISOString(),
      });
      setState('success');
    } catch (err: any) {
      console.error('Error al guardar comprobante:', err);
      setError(err.message || 'No se pudo guardar el comprobante');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForAnother = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    setConfirmedReceipt(null);
    setError(null);
    setState('camera');
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        {/* Barra Superior con botón Volver */}
        <div className="flex items-center justify-between">
          <Link
            href="/mobile"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Inicio Operador</span>
          </Link>
          <span className="text-[11px] font-mono text-muted-foreground">
            {state === 'camera' && 'Paso 1: Captura'}
            {state === 'processing' && 'Paso 2: Procesamiento'}
            {state === 'validating' && 'Paso 3: Validación'}
            {state === 'success' && 'Paso 4: Completado'}
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        {/* Estado 1: Captura con Cámara */}
        {state === 'camera' && (
          <CameraViewfinder onCapture={handleCapture} isProcessing={false} />
        )}

        {/* Estado 2: Procesando OCR */}
        {state === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-card rounded-3xl border border-border shadow-xl space-y-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center text-primary">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Procesando OCR</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Localizando bloque «DATOS DEL DESTINATARIO» y extrayendo DNI...
              </p>
            </div>
          </div>
        )}

        {/* Estado 3: Pantalla de Validación y Confirmación */}
        {state === 'validating' && capturedFile && previewUrl && ocrResult && (
          <ReceiptValidationForm
            imageFile={capturedFile}
            previewUrl={previewUrl}
            ocrResult={ocrResult}
            onConfirm={handleConfirmAndSave}
            onRetake={handleResetForAnother}
            isSaving={isSaving}
          />
        )}

        {/* Estado 4: Pantalla de Confirmación de Éxito */}
        {state === 'success' && confirmedReceipt && (
          <div className="flex flex-col items-center text-center p-8 bg-card rounded-3xl border border-border shadow-xl space-y-6">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">¡Comprobante Registrado!</h2>
              <p className="text-xs text-muted-foreground mt-1">
                La fotografía se guardó en el bucket seguro y los metadatos fueron enlazados.
              </p>
            </div>

            <div className="w-full p-4 rounded-2xl bg-secondary/40 border border-border text-left space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground font-medium">DNI Asociado:</span>
                <span className="font-mono font-bold text-foreground text-sm">{confirmedReceipt.dni}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Destinatario:</span>
                <span className="font-semibold text-foreground truncate max-w-[170px]">
                  {confirmedReceipt.name}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground font-medium">ID Registro:</span>
                <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">
                  {confirmedReceipt.id}
                </span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={handleResetForAnother}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-white text-sm font-semibold shadow hover:bg-primary/90 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Digitalizar Otro Comprobante</span>
              </button>

              <Link
                href="/mobile"
                className="w-full flex items-center justify-center h-11 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-secondary transition-colors"
              >
                Volver al Menú Principal
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
