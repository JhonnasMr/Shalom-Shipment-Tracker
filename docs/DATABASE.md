# ESQUEMA DE BASE DE DATOS Y POLÍTICAS DE ACCESO
## DocuDNI - PostgreSQL en Supabase

### 1. Entidades Principales

#### `public.profiles`
Contiene la información de usuarios del sistema y su control de acceso basado en roles (RBAC).
- `id` (UUID, PK): Referencia a `auth.users(id)` ON DELETE CASCADE.
- `full_name` (TEXT): Nombre completo del operador o administrador.
- `email` (TEXT, UNIQUE): Correo corporativo del usuario.
- `role` (`user_role` ENUM): `'admin'` u `'operator'`.
- `is_active` (BOOLEAN): Estado de cuenta.
- `created_at`, `updated_at` (TIMESTAMPTZ).

#### `public.receipts`
Almacena los metadatos de los comprobantes digitalizados.
- `id` (UUID, PK): Identificador único del comprobante.
- `recipient_name` (TEXT): Nombre del destinatario confirmado.
- `recipient_dni` (VARCHAR(10)): DNI (8 dígitos) o CE del destinatario. **(No UNIQUE, un DNI puede recibir múltiples paquetes)**.
- `storage_path` (TEXT): Ruta privada en Supabase Storage (e.g. `{user_id}/{receipt_id}.png`).
- `original_filename` (TEXT): Nombre de archivo original.
- `mime_type` (VARCHAR(50)): Tipo MIME de la imagen.
- `file_size` (INTEGER): Tamaño del archivo en bytes.
- `image_hash` (VARCHAR(64)): Hash criptográfico SHA-256 para evitar duplicaciones accidentales.
- `ocr_provider` (VARCHAR(50)): Proveedor que realizó la lectura (`tesseract`, `google_vision`, `azure_document_intelligence`).
- `ocr_confidence` (NUMERIC(4,3)): Grado de confianza del OCR (0.000 a 1.000).
- `ocr_raw_result` (JSONB): Payload del resultado del OCR minimizado para privacidad.
- `ocr_detected_dni` (VARCHAR(10)): DNI original detectado antes de confirmación.
- `ocr_detected_name` (TEXT): Nombre original detectado.
- `manual_correction` (BOOLEAN): Indicador de si el operador corrigió manualmente algún dato.
- `processing_status` (`receipt_status` ENUM): `'pending_confirmation'`, `'confirmed'`, `'rejected'`.
- `captured_at` (TIMESTAMPTZ): Momento exacto de la captura.
- `created_by` (UUID, FK `profiles.id`): Operador responsable del registro.
- `created_at`, `updated_at` (TIMESTAMPTZ).

#### `public.audit_logs`
Bitácora de auditoría inmutable para trazabilidad según la Ley N.° 29733.
- `id` (BIGSERIAL, PK).
- `user_id` (UUID, FK `profiles.id`): Usuario que realizó la acción (o NULL para búsquedas públicas anónimas).
- `action` (VARCHAR(60)): Acción realizada (`CREATE_RECEIPT`, `SEARCH_DNI_FOUND`, `SEARCH_DNI_NOT_FOUND`, `DOWNLOAD_IMAGE`, etc.).
- `entity_type` (VARCHAR(50)): Tipo de entidad (`receipt`, `dni_query`, etc.).
- `entity_id` (TEXT): ID de la entidad involucrada.
- `metadata` (JSONB): Datos contextuales minimizados.
- `ip_address` (TEXT): Dirección IP de origen.
- `user_agent` (TEXT): Dispositivo / navegador del cliente.
- `created_at` (TIMESTAMPTZ).

---

### 2. Índices de Rendimiento
Para garantizar tiempos de respuesta inferiores a 50ms en búsquedas concurrentes:
```sql
CREATE INDEX idx_receipts_recipient_dni ON public.receipts (recipient_dni);
CREATE INDEX idx_receipts_created_at ON public.receipts (created_at DESC);
CREATE INDEX idx_receipts_created_by ON public.receipts (created_by);
CREATE INDEX idx_receipts_image_hash ON public.receipts (image_hash);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
```

---

### 3. Seguridad de Acceso (Row Level Security - RLS)
- RLS habilitado en todas las tablas (`profiles`, `receipts`, `audit_logs`).
- Los operadores solo pueden consultar sus propios comprobantes registrados.
- Los administradores tienen acceso global para auditoría y supervisión.
- La búsqueda pública se realiza exclusivamente a través de la función segura `search_receipts_by_dni(p_dni TEXT)` con `SECURITY DEFINER`, evitando exponer consultas arbitrarias sobre la tabla `receipts`.
