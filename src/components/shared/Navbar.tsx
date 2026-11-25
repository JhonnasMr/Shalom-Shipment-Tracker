'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, Search, LayoutDashboard, ShieldCheck, Smartphone } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const isMobileApp = pathname?.startsWith('/mobile');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground">DocuDNI</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Comprobantes & DNI</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              pathname === '/'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Buscador</span>
          </Link>

          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              pathname?.startsWith('/admin')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Panel Admin</span>
          </Link>

          <Link
            href="/mobile"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              isMobileApp
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-primary/15 text-primary hover:bg-primary hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>App Móvil (PWA)</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
