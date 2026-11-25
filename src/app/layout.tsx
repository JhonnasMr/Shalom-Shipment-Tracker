import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/shared/Navbar';

export const metadata: Metadata = {
  title: 'DocuDNI - Digitalización y Búsqueda de Comprobantes por DNI',
  description: 'Sistema profesional para digitalizar comprobantes físicos mediante OCR y consultar fotografías por número de DNI',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
