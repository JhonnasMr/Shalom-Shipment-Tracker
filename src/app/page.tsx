'use client';

import { useState } from 'react';
import { Search, X, ShieldCheck, AlertCircle, Calendar, User, Eye, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { DniValidator } from '@/lib/validations/dni-validator';
import { ImageModal } from '@/components/shared/ImageModal';
import { ReceiptDto } from '@/lib/receipts/receipts-service';

export default function SearchPage() {
  const [dniInput, setDniInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<ReceiptDto[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modal de imagen seleccionada
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptDto | null>(null);

  const handleInputChange = (val: string) => {
    const cleaned = val.replace(/\s+/g, '');
    setDniInput(cleaned);
    setApiError(null);

    if (cleaned.length > 0 && cleaned.length < 8) {
      setValidationError('El DNI debe tener 8 dígitos numéricos (o hasta 10 para CE)');
    } else {
      setValidationError(null);
    }
  };

  const handleSearch = async (e?: React.FormEvent, customDni?: string) => {
    if (e) e.preventDefault();
    const queryDni = customDni || dniInput;

    const val = DniValidator.validate(queryDni);
    if (!val.isValid) {
      setValidationError(val.error || 'Ingrese un DNI válido');
      return;
    }

    setValidationError(null);
    setApiError(null);
    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/receipts/search?dni=${encodeURIComponent(val.normalizedNumber)}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Error al buscar comprobantes');
      }

      setResults(json.data || []);
    } catch (err: any) {
      console.error('Error en búsqueda:', err);
      setApiError(err.message || 'No se pudo realizar la búsqueda');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setDniInput('');
    setValidationError(null);
    setHasSearched(false);
    setResults([]);
    setApiError(null);
  };

  const handleDemoSearch = (sampleDni: string) => {
    setDniInput(sampleDni);
    handleSearch(undefined, sampleDni);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12 space-y-10">
      {/* Sección Hero y Buscador Central */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Consulta Pública y Administrativa</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Búsqueda de Comprobantes por DNI
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulte de forma rápida las fotografías y metadatos de los comprobantes registrados
          asociados al documento del destinatario.
        </p>

        {/* Formulario del Buscador */}
        <form onSubmit={e => handleSearch(e)} className="pt-4">
          <div className="relative flex items-center shadow-lg rounded-2xl bg-card border border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <div className="pl-4 text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={dniInput}
              onChange={e => handleInputChange(e.target.value)}
              placeholder="Ingrese el número de DNI (8 dígitos) o CE..."
              className="w-full h-14 px-3.5 bg-transparent text-base sm:text-lg font-mono font-medium focus:outline-none text-foreground placeholder:text-muted-foreground/60"
            />

            {dniInput && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors mr-1"
                title="Limpiar búsqueda"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !dniInput}
              className="h-11 px-6 mr-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Buscar</span>
              )}
            </button>
          </div>

          {validationError && (
            <p className="mt-2 text-xs font-medium text-destructive flex items-center justify-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {validationError}
            </p>
          )}

          {/* DNI de prueba sugeridos */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Ejemplos disponibles:</span>
            <button
              type="button"
              onClick={() => handleDemoSearch('47037422')}
              className="font-mono text-primary font-semibold hover:underline bg-primary/10 px-2 py-0.5 rounded"
            >
              47037422 (Shalom)
            </button>
          </div>
        </form>
      </div>

      {/* Mensaje de Error de API */}
      {apiError && (
        <div className="max-w-lg mx-auto p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-center text-sm font-medium text-destructive">
          {apiError}
        </div>
      )}

      {/* Resultados de la Búsqueda */}
      <div className="space-y-4">
        {hasSearched && (
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Resultados para DNI:</span>
              <span className="font-mono text-primary text-lg">{dniInput}</span>
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              {results.length} comprobante(s) encontrado(s)
            </span>
          </div>
        )}

        {/* Skeleton Loader mientras consulta */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="h-80 rounded-2xl bg-card border border-border animate-pulse p-4 space-y-3"
              >
                <div className="h-48 bg-muted rounded-xl" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Estado Vacío */}
        {!isLoading && hasSearched && results.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-3xl p-8 max-w-md mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">No se encontraron comprobantes</h3>
              <p className="text-xs text-muted-foreground mt-1">
                No existen fotografías registradas con el DNI <span className="font-mono font-bold">{dniInput}</span>.
                Verifique el número ingresado o digitalice el comprobante desde la app móvil.
              </p>
            </div>
          </div>
        )}

        {/* Cuadrícula de Comprobantes Encontrados */}
        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map(receipt => (
              <div
                key={receipt.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
              >
                {/* Miniatura de la Imagen */}
                <div
                  onClick={() => setSelectedReceipt(receipt)}
                  className="relative h-56 w-full bg-black/90 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {receipt.signedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={receipt.signedUrl}
                      alt={`Comprobante DNI ${receipt.recipientDni}`}
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground text-xs">
                      <FileText className="h-8 w-8 mb-1" />
                      <span>Imagen Protegida</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-black text-xs font-semibold shadow">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Ver en Alta Resolución</span>
                    </span>
                  </div>
                </div>

                {/* Metadatos de la Tarjeta */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        DNI {receipt.recipientDni}
                      </span>
                      {receipt.ocrConfidence !== undefined && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {Math.round(receipt.ocrConfidence * 100)}% OCR
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 text-sm font-bold text-foreground leading-snug line-clamp-1">
                      {receipt.recipientName}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(receipt.capturedAt).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedReceipt(receipt)}
                    className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Visualizar Comprobante</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Lightbox de Visualización y Descarga */}
      {selectedReceipt && (
        <ImageModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          imageUrl={selectedReceipt.signedUrl || ''}
          recipientName={selectedReceipt.recipientName}
          recipientDni={selectedReceipt.recipientDni}
          capturedAt={selectedReceipt.capturedAt}
          originalFilename={selectedReceipt.originalFilename}
          confidence={selectedReceipt.ocrConfidence}
        />
      )}
    </div>
  );
}
