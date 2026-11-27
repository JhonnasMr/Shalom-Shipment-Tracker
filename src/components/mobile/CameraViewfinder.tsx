'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Image as ImageIcon, AlertCircle, Sparkles, Check } from 'lucide-react';

interface CameraViewfinderProps {
  onCapture: (file: File) => void;
  isProcessing?: boolean;
}

export function CameraViewfinder({ onCapture, isProcessing = false }: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  useEffect(() => {
    let disposed = false;
    let mediaStream: MediaStream | null = null;

    const startCamera = async () => {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('La API de cámara no está disponible en este navegador o entorno no seguro (requiere HTTPS o localhost)');
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        if (disposed) return;
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);

        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (disposed) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        video.srcObject = mediaStream;
        await video.play();
      } catch (err: unknown) {
        if (disposed) return;
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
          if (videoRef.current?.srcObject === mediaStream) {
            videoRef.current.srcObject = null;
          }
        }
        console.warn('No se pudo acceder a la cámara en vivo:', err);
        setCameraError(err instanceof Error ? err.message : 'No se pudo acceder a la cámara');
      }
    };

    void startCamera();

    return () => {
      disposed = true;
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        if (videoRef.current?.srcObject === mediaStream) {
          videoRef.current.srcObject = null;
        }
      }
    };
  }, [facingMode]);

  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `comprobante_cam_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
    }, 'image/jpeg', 0.85);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onCapture(files[0]);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="relative flex flex-col items-center justify-between h-[85vh] max-w-md mx-auto w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-border/20">
      <canvas ref={canvasRef} className="hidden" />

      {/* Visor de Video / Mensaje de Fallback */}
      <div className="relative w-full flex-1 overflow-hidden flex items-center justify-center">
        {cameraError ? (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 text-white">
            <div className="h-12 w-12 rounded-2xl bg-destructive/20 border border-destructive/40 flex items-center justify-center text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-base">Cámara no disponible</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {cameraError}. Puede utilizar la opción de adjuntar o tomar foto desde el selector de archivos nativo.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow hover:bg-primary/90"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Tomar Foto / Galería</span>
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Máscara y Guía Visual de Encuadre */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              {/* Marco General del Comprobante */}
              <div className="relative w-full max-w-[280px] h-[70%] border-2 border-dashed border-white/40 rounded-2xl flex flex-col justify-between p-3">
                <span className="text-[11px] font-medium text-white/70 bg-black/50 px-2 py-0.5 rounded self-center backdrop-blur">
                  Encuadre el comprobante
                </span>

                {/* Zona Crítica: Recuadro Rojo de Datos del Destinatario */}
                <div className="relative w-full h-24 border-2 border-red-500 bg-red-500/10 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="absolute top-1 left-2 flex items-center gap-1 text-[10px] font-bold text-red-400 bg-black/70 px-1.5 py-0.5 rounded">
                    <Sparkles className="h-3 w-3" />
                    <span>ZONA: DATOS DEL DESTINATARIO</span>
                  </div>
                  <div className="w-full h-0.5 bg-red-400/80 animate-scanline" />
                </div>

                <span className="text-[10px] text-center text-white/60 bg-black/50 px-2 py-0.5 rounded backdrop-blur">
                  Evite sombras y mantenga el papel plano
                </span>
              </div>
            </div>
          </>
        )}

        {/* Input file nativo oculto para soporte PWA en móviles */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Controles Inferiores */}
      <div className="w-full bg-black/90 backdrop-blur border-t border-white/10 px-6 py-4 flex items-center justify-between">
        {/* Botón Galería */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
          title="Seleccionar imagen de galería"
        >
          <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
            <ImageIcon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Galería</span>
        </button>

        {/* Botón Disparador Principal */}
        <button
          onClick={handleCaptureSnapshot}
          disabled={isProcessing || !!cameraError}
          className="relative flex items-center justify-center h-18 w-18 rounded-full border-4 border-white/80 p-1 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          title="Capturar comprobante"
        >
          <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center text-black">
            {isProcessing ? (
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Camera className="h-6 w-6 text-primary" />
            )}
          </div>
        </button>

        {/* Botón Rotar Cámara */}
        <button
          onClick={toggleCamera}
          disabled={!hasMultipleCameras || isProcessing}
          className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors disabled:opacity-40"
          title="Cambiar cámara"
        >
          <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
            <RefreshCw className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Girar</span>
        </button>
      </div>
    </div>
  );
}
