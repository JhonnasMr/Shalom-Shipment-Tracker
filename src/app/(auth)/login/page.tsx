'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('operador@comprobantes.pe');
  const [password, setPassword] = useState('operador123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulación de sesión o Supabase Auth login
    setTimeout(() => {
      setIsLoading(false);
      router.push('/mobile');
    }, 600);
  };

  const handleQuickDemo = (role: 'operator' | 'admin') => {
    if (role === 'operator') {
      setEmail('operador@comprobantes.pe');
      setPassword('operador123');
    } else {
      setEmail('admin@comprobantes.pe');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">DocuDNI</h1>
          <p className="text-xs text-muted-foreground">Sistema de Digitalización y Reconocimiento de Comprobantes</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operador@comprobantes.pe"
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-white text-sm font-semibold shadow hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-border">
          <p className="text-[11px] text-muted-foreground text-center mb-2">Acceso rápido para evaluación:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('operator')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
            >
              Demo Operador
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
            >
              Demo Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
