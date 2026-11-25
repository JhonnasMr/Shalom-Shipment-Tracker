# GUÍA DE DESPLIEGUE EN PRODUCCIÓN
## DocuDNI - Infraestructura y Configuración

### 1. Requisitos Previos
- Node.js versión 20.x o superior.
- Cuenta o proyecto en **Supabase** (PostgreSQL + Storage + Auth).
- Dominio con certificado SSL (obligatorio para la API de cámara `getUserMedia` y PWA en dispositivos móviles).

---

### 2. Configuración de Variables de Entorno
Copiar `.env.example` a `.env.production` o configurar en el panel de Cloudflare / Vercel:

```env
# Supabase URL y Claves
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Proveedor OCR ('tesseract' para local, 'google_vision' o 'azure_document_intelligence')
OCR_PROVIDER=tesseract
OCR_API_KEY=

# URL Base
NEXT_PUBLIC_APP_URL=https://tudominio.com

# Seguridad
MAX_UPLOAD_SIZE_MB=15
SIGNED_URL_EXPIRY_SECONDS=900
```

---

### 3. Ejecución de Migraciones en Supabase
Ejecutar en la consola SQL del dashboard de Supabase o mediante Supabase CLI:

```bash
# 1. Aplicar esquema de base de datos
supabase db push
# O ejecutar manualmente el contenido de:
# supabase/migrations/20261125000001_create_receipts_schema.sql
# supabase/migrations/20261125000002_create_storage_bucket.sql
```

Verificar que:
1. El bucket `receipts` esté creado y marcado como **PRIVADO**.
2. Las políticas RLS estén activadas.
3. La función `search_receipts_by_dni` tenga permisos para roles `anon` y `authenticated`.

---

### 4. Despliegue en Cloudflare Workers / Pages
La aplicación está diseñada para ser compatible con entornos Edge y Cloudflare:
1. Instalar `@cloudflare/next-on-pages` si se despliega como Cloudflare Pages.
2. Configurar el runtime de Node.js en las variables de Cloudflare:
   `NODE_VERSION = 20.18.0`
3. En caso de usar OCR local en workers sin binarios nativos de C++, configurar `OCR_PROVIDER=google_vision` o ejecutar la API de procesamiento OCR en un contenedor Docker / Cloud Run.

---

### 5. Despliegue con Docker (Opción Recomendada On-Premise)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```
