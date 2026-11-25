# DocuDNI - Sistema Profesional de Digitalización y Búsqueda de Comprobantes por DNI

Plataforma de digitalización de comprobantes físicos y tickets de encomienda (como Shalom, Olva Courier, etc.) mediante fotografía asistida por visión y OCR, diseñada con arquitectura desacoplada, backend en Next.js App Router, almacenamiento privado en Supabase Storage, base de datos PostgreSQL con RLS y Progressive Web App (PWA) para operadores.

---

## Características Principales

### 📱 Aplicación Móvil (PWA Operativa)
- **Captura rápida con cámara:** Integración directa mediante `navigator.mediaDevices.getUserMedia` con guía de encuadre en pantalla que resalta la zona crítica de **«DATOS DEL DESTINATARIO»**.
- **Alternativa de Galería:** Selector de archivos nativo con soporte `input capture="environment"`.
- **Motor OCR Contextual:** Identifica con precisión el bloque de destinatario, extrayendo el DNI y nombre, **descartando de manera estricta los datos del remitente y números telefónicos**.
- **Evaluación de Confianza (Confidence Scoring):** Indicador visual en 3 estados (Alta, Verificación Sugerida, Baja Confianza).
- **Corrección manual:** Permite corregir o verificar el DNI y nombre antes de confirmar.
- **Soporte Offline & Cola de Pendientes:** Diseñado para conexiones inestables en almacén o agencia.

### 💻 Aplicación Web (Búsqueda Pública & Dashboard Administrativo)
- **Búsqueda Exacta por DNI:** Acceso libre sin necesidad de inicio de sesión para consultar comprobantes por número de DNI (8 dígitos) o CE (9-10 caracteres).
- **Soporte de Múltiples Comprobantes:** Visualización cronológica de todos los envíos asociados a un mismo DNI.
- **Visor Lightbox en Alta Resolución:** Controles interactivos de zoom (hasta 300%), paneo y descarga autorizada.
- **Dashboard Administrativo:** Métricas en tiempo real (total comprobantes, DNIs únicos, volumen del día, tendencia de 7 días y registro de auditoría).

### 🔒 Seguridad y Cumplimiento Normativo (Ley N.° 29733)
- **Storage Privado:** Bucket `receipts` 100% privado. El acceso a imágenes se realiza únicamente mediante **URLs firmadas temporales (15 minutos)** generadas en servidor.
- **Rutas Anónimas (UUID):** El DNI nunca se expone en nombres de archivo ni rutas de almacenamiento.
- **Transacciones Atómicas y Compensación:** Si la inserción en base de datos falla tras subir la foto, el sistema elimina automáticamente el archivo en Storage para evitar blobs huérfanos.
- **Trazabilidad de Auditoría:** Registro de cada consulta y registro en la tabla `audit_logs`.

---

## 🛠️ Stack Tecnológico
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript estricto, Tailwind CSS, shadcn/ui patterns, Lucide React.
- **PWA:** Web App Manifest, Service Worker ready, soporte mobile-first.
- **Backend:** Next.js Route Handlers, validación con Zod, Supabase PostgreSQL, Supabase Storage.
- **OCR:** Arquitectura desacoplada (`IOcrProvider`):
  - Local / Zero-Cost: **Tesseract.js** con preprocesamiento de imagen mediante **Sharp** (rotación EXIF, escala de grises, realce de contraste térmico).
  - Proveedores Cloud: Adaptadores listos para **Google Cloud Vision** y **Azure AI Document Intelligence**.
- **Testing:** **Vitest** (Unitarias e Integración) y **Playwright** (End-to-End).

---

## 🚀 Instalación y Puesta en Marcha Local

### 1. Clonar e Instalar Dependencias
```bash
git clone <url-del-repositorio>
cd docu-dni-scanner
npm install
```

### 2. Configurar Variables de Entorno
Cree un archivo `.env.local` basado en `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role

# Proveedor OCR: 'tesseract' (predeterminado local) | 'google_vision' | 'azure_document_intelligence'
OCR_PROVIDER=tesseract

NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_UPLOAD_SIZE_MB=15
SIGNED_URL_EXPIRY_SECONDS=900
```

### 3. Aplicar Migraciones en Supabase
Ejecute en el SQL Editor de su panel de Supabase:
- `supabase/migrations/20261125000001_create_receipts_schema.sql`
- `supabase/migrations/20261125000002_create_storage_bucket.sql`
- *(Opcional)* `supabase/seed.sql` para cargar datos de prueba.

### 4. Iniciar en Modo Desarrollo
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) en su navegador.

---

## 🧪 Pruebas Automatizadas

```bash
# Ejecutar todas las pruebas unitarias y de integración
npm test

# Ejecutar pruebas E2E con Playwright
npm run test:e2e

# Cobertura de código
npm run test:coverage
```

---

## 📁 Documentación Detallada
- [Arquitectura del Sistema](docs/ARCHITECTURE.md)
- [Esquema de Base de Datos y RLS](docs/DATABASE.md)
- [Protocolo de Seguridad y Ley N.° 29733](docs/SECURITY.md)
- [Motor OCR y Procesamiento de Imágenes](docs/OCR.md)
- [Guía de Despliegue en Producción](docs/DEPLOYMENT.md)
- [Estrategia y Resultados de Pruebas](docs/TESTING.md)
