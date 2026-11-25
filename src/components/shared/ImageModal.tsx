'use client';

import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Calendar, User, FileText, Check } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  recipientName: string;
  recipientDni: string;
  capturedAt: string;
  originalFilename?: string;
  confidence?: number;
}

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  recipientName,
  recipientDni,
  capturedAt,
  originalFilename,
  confidence,
}: ImageModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `comprobante_${recipientDni}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error al descargar comprobante:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col md:flex-row h-full max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-card border border-border shadow-2xl">
        {/* Contenedor de la Imagen con Zoom */}
        <div className="relative flex-1 bg-black/95 flex items-center justify-center overflow-auto p-4 select-none">
          <div
            className="transition-transform duration-200 ease-out origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`Comprobante DNI ${recipientDni}`}
              className="max-h-[78vh] w-auto object-contain rounded shadow-lg"
            />
          </div>

          {/* Barra Flotante de Zoom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur border border-border/60 shadow-lg text-foreground">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-full hover:bg-secondary transition-colors"
              title="Reducir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono font-medium px-2">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-full hover:bg-secondary transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="h-3.5 w-px bg-border mx-1" />
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-full hover:bg-secondary transition-colors"
              title="Restablecer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Panel Lateral de Metadatos */}
        <div className="w-full md:w-80 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border bg-card p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Detalle del Comprobante</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  DNI del Destinatario
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold tracking-tight text-primary">
                    {recipientDni}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Nombre Completo
                </label>
                <p className="mt-1 font-semibold text-foreground text-sm leading-snug">
                  {recipientName}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Fecha de Registro
                </label>
                <p className="mt-1 text-muted-foreground text-xs">
                  {new Date(capturedAt).toLocaleString('es-PE', {
                    dateStyle: 'long',
                    timeStyle: 'medium',
                  })}
                </p>
              </div>

              {originalFilename && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Archivo Original
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground truncate font-mono">
                    {originalFilename}
                  </p>
                </div>
              )}

              {confidence !== undefined && (
                <div className="pt-2">
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/80">
                    <span className="text-xs text-muted-foreground block">Confianza OCR</span>
                    <span className="text-sm font-semibold text-foreground">
                      {Math.round(confidence * 100)}% de coincidencia automática
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Descargar Fotografía</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
