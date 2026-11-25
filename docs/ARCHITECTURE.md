# ARQUITECTURA DEL SISTEMA
## DocuDNI - Digitalización y Búsqueda de Comprobantes por DNI

### 1. Visión General y Principios de Diseño
DocuDNI es una plataforma de software comercial orientada a la captura ágil, extracción OCR asistida por visión y consulta masiva de comprobantes de encomiendas y entrega (tales como Shalom, Olva Courier, etc.) indexados por el Documento Nacional de Identidad (DNI) o Carnet de Extranjería (CE) del **destinatario**.

Principios rectores:
1. **Desacoplamiento del Motor OCR (Adapter Pattern):** El núcleo de la aplicación interactúa con la interfaz `IOcrProvider`. La implementación predeterminada utiliza `TesseractProvider` (ejecución local sin costo de API externa), y permite alternar a `GoogleVisionProvider` o `AzureDocIntelligenceProvider` mediante variables de entorno (`OCR_PROVIDER`).
2. **Validación Contextual Guiada:** Los tickets térmicos peruanos contienen múltiples bloques con números que inducen a falsos positivos (Nro. de orden, RUC, DNI y teléfono del remitente, teléfono del destinatario). El motor utiliza un reconocedor contextual que aísla el bloque `DATOS DEL DESTINATARIO` y aplica reglas de exclusión estricta.
3. **Persistencia Atómica con Mecanismo de Compensación:** Al confirmar una digitalización, la subida al bucket privado de Supabase Storage y la inserción en PostgreSQL se orquestan transaccionalmente. Si la base de datos rechaza la inserción, se ejecuta un rollback en Storage eliminando el archivo para evitar blobs huérfanos.
4. **Seguridad y Privacidad (Ley N.° 29733 de Protección de Datos Personales):** Bucket de Storage 100% privado, rutas ofuscadas por UUID (el DNI nunca se expone en la URL ni en el nombre de archivo), URLs firmadas con caducidad corta (15 min) y registro estricto en `audit_logs`.

---

### 2. Diagrama de Capas

```
┌────────────────────────────────────────────────────────┐
│                      CAPA CLIENTE                      │
│  - App Móvil PWA (Camera API, IndexedDB, Haptics)      │
│  - App Web Consulta Pública (Buscador exacto DNI)      │
│  - Dashboard Administrativo (Métricas, Control, Audit) │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST / FormData
┌───────────────────────────▼────────────────────────────┐
│                  NEXT.JS APP ROUTER                    │
│  - Route Handlers (/api/ocr/process, /api/receipts)    │
│  - Server-Side Validation (Zod, DniValidator)          │
│  - Rate Limiting & Input Sanitization                  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    CAPA DE SERVICIOS                   │
│  - OcrService & ImagePreprocessor (Sharp)              │
│  - ContextualDniExtractor (Anclas y Descarte Remitente)│
│  - ReceiptsService (Compensación Atómica & Audit)      │
└───────────────────────────┬────────────────────────────┘
                            │ Supabase SDK
┌───────────────────────────▼────────────────────────────┐
│                  INFRAESTRUCTURA SUPABASE              │
│  - PostgreSQL 15 (profiles, receipts, audit_logs)      │
│  - Row Level Security (RLS) & Security Definer TVFs    │
│  - Supabase Storage (Bucket privado 'receipts')        │
└────────────────────────────────────────────────────────┘
```

---

### 3. Componentes del Dominio
- **`DniValidator`**: Validador estricto de números peruanos (8 dígitos DNI, 9-10 dígitos CE, rechazo de teléfonos celulares de 9 dígitos que inician con 9).
- **`ImagePreprocessor`**: Normalización con Sharp (rotación EXIF, escala de grises, realce de contraste térmico, cálculo SHA-256).
- **`ContextualDniExtractor`**: Detector del bloque de interés, extracción de `recipient_name` y `recipient_dni`, y cálculo determinístico de confianza (High / Medium / Low).
