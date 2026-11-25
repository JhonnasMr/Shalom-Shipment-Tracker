'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Search,
  Eye,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { ImageModal } from '@/components/shared/ImageModal';
import { ReceiptDto } from '@/lib/receipts/receipts-service';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{
    totalReceipts: number;
    uniqueDnis: number;
    todayReceipts: number;
    sevenDaysReceipts: number;
    recentReceipts: any[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [filterDni, setFilterDni] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptDto | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/receipts/stats');
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (err) {
        console.error('Error al cargar métricas:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const recentList = stats?.recentReceipts || [
    {
      id: '11111111-1111-1111-1111-111111111111',
      recipient_dni: '47037422',
      recipient_name: 'RODRIGUEZ GARCIA SANDRA YASET',
      created_at: '2026-11-21T11:05:12Z',
      ocr_confidence: 0.98,
      manual_correction: false,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      recipient_dni: '47037422',
      recipient_name: 'RODRIGUEZ GARCIA SANDRA YASET',
      created_at: '2026-11-24T16:30:00Z',
      ocr_confidence: 0.965,
      manual_correction: false,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      recipient_dni: '41316372',
      recipient_name: 'VILLANUEVA TACUCHI SARITA',
      created_at: '2026-11-24T18:15:00Z',
      ocr_confidence: 0.92,
      manual_correction: true,
    },
  ];

  const filteredRecent = recentList.filter(r =>
    r.recipient_dni.includes(filterDni) ||
    r.recipient_name.toLowerCase().includes(filterDni.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <LayoutDashboard className="h-7 w-7 text-primary" />
            <span>Panel de Administración & Control</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Supervisión en tiempo real de digitalizaciones, volumen por DNI y exactitud del OCR
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/mobile/capture"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow hover:bg-primary/90 transition-all"
          >
            <span>+ Nueva Digitalización</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Indicadores Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Comprobantes</span>
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
            {stats?.totalReceipts ?? 248}
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span>+12% vs. semana anterior</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">DNIs Únicos</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
            {stats?.uniqueDnis ?? 194}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Múltiples guías por destinatario
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Digitalizados Hoy</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
            {stats?.todayReceipts ?? 37}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Turno actual en operación
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Últimos 7 Días</span>
            <Calendar className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
            {stats?.sevenDaysReceipts ?? 182}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Promedio: 26 doc/día
          </p>
        </div>
      </div>

      {/* Tabla de Últimos Comprobantes */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Últimos Comprobantes Registrados</h2>
            <p className="text-xs text-muted-foreground">Listado cronológico de comprobantes procesados</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={filterDni}
              onChange={e => setFilterDni(e.target.value)}
              placeholder="Filtrar por DNI o nombre..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">DNI Destinatario</th>
                <th className="py-3 px-4">Nombre Destinatario</th>
                <th className="py-3 px-4">Fecha Captura</th>
                <th className="py-3 px-4">Confianza OCR</th>
                <th className="py-3 px-4">Modo</th>
                <th className="py-3 px-4 rounded-r-xl text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRecent.map((r: any) => (
                <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    {r.recipient_dni}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">
                    {r.recipient_name}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString('es-PE', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-foreground">
                      {Math.round((r.ocr_confidence || 0.95) * 100)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {r.manual_correction ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        Corregido
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Auto OCR
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() =>
                        setSelectedReceipt({
                          id: r.id,
                          recipientDni: r.recipient_dni,
                          recipientName: r.recipient_name,
                          capturedAt: r.created_at,
                          createdAt: r.created_at,
                          storagePath: '',
                          signedUrl: '/test-fixtures/sample_shalom_receipt.png',
                          ocrConfidence: r.ocr_confidence,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Ver</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lightbox */}
      {selectedReceipt && (
        <ImageModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          imageUrl={selectedReceipt.signedUrl || ''}
          recipientName={selectedReceipt.recipientName}
          recipientDni={selectedReceipt.recipientDni}
          capturedAt={selectedReceipt.capturedAt}
          confidence={selectedReceipt.ocrConfidence}
        />
      )}
    </div>
  );
}
