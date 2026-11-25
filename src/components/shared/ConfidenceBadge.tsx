import { OcrConfidenceLevel } from '@/types/ocr';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  level: OcrConfidenceLevel;
  confidence: number;
  showScore?: boolean;
}

export function ConfidenceBadge({ level, confidence, showScore = true }: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);

  if (level === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Confianza Alta</span>
        {showScore && <span className="opacity-75">({percentage}%)</span>}
      </span>
    );
  }

  if (level === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Verificación Sugerida</span>
        {showScore && <span className="opacity-75">({percentage}%)</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
      <AlertCircle className="h-3.5 w-3.5" />
      <span>Baja Confianza</span>
      {showScore && <span className="opacity-75">({percentage}%)</span>}
    </span>
  );
}
