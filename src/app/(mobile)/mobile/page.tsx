'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, FileText, CheckCircle2, Clock, Wifi, WifiOff, ArrowRight, ShieldCheck, User } from 'lucide-react';

export default function MobileHomePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [todayCount, setTodayCount] = useState(14);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 p-4 sm:p-6 max-w-lg mx-auto flex flex-col justify-between">
      <div className="space-y-6">
        {/* Cabecera del Operador y Estado */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base">
              CO
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Carlos Operador</h2>
              <p className="text-xs text-muted-foreground">Sede San Ignacio / Lima</p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
            }`}
          >
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span>{isOnline ? 'En línea' : 'Sin conexión'}</span>
          </div>
        </div>

        {/* Tarjetas de Métricas del Turno */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Procesados Hoy
            </span>
            <span className="text-2xl font-bold font-mono text-foreground mt-2">{todayCount}</span>
            <span className="text-[10px] text-muted-foreground mt-1">Comprobantes sincronizados</span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" /> Pendientes
            </span>
            <span className="text-2xl font-bold font-mono text-foreground mt-2">{pendingCount}</span>
            <span className="text-[10px] text-muted-foreground mt-1">En cola local</span>
          </div>
        </div>

        {/* Botón Principal Gigante: Digitalizar Comprobante */}
        <Link
          href="/mobile/capture"
          className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/95 transition-all active:scale-[0.98]"
        >
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
            <Camera className="h-8 w-8" />
          </div>
          <span className="text-lg font-bold">Digitalizar Comprobante</span>
          <span className="text-xs text-primary-foreground/80 mt-1">
            Captura con cámara y OCR automático
          </span>
        </Link>

        {/* Historial Reciente */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Comprobantes Recientes
            </h3>
            <span className="text-xs text-primary font-medium">Ver todos</span>
          </div>

          <div className="space-y-2">
            {[
              { dni: '47037422', name: 'RODRIGUEZ GARCIA SANDRA YASET', time: 'Hace 5 min', status: 'OK' },
              { dni: '41316372', name: 'VILLANUEVA TACUCHI SARITA', time: 'Hace 24 min', status: 'OK' },
              { dni: '72819034', name: 'MENDOZA QUISPE JORGE LUIS', time: 'Hace 1 hora', status: 'OK' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-foreground font-mono text-xs font-bold">
                    DNI
                  </div>
                  <div>
                    <span className="font-mono font-bold text-foreground text-xs block">{item.dni}</span>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[170px] block">
                      {item.name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">{item.time}</span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Sincronizado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enlace rápido a la búsqueda pública */}
      <div className="pt-6 text-center">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors"
        >
          <span>Ir al Buscador Público por DNI</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
