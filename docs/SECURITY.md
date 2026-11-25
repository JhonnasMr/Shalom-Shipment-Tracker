# PROTOCOLO DE SEGURIDAD Y PRIVACIDAD DE DATOS
## DocuDNI - Cumplimiento Normativo (Ley N.° 29733)

### 1. Marco Legal y Tratamiento de Datos Personales
Conforme a la **Ley N.° 29733 (Ley de Protección de Datos Personales del Perú)** y su reglamento:
- El DNI y el nombre completo constituyen datos personales de carácter identificativo.
- **Principio de Proporcionalidad y Minimización:** El sistema almacena exclusivamente el DNI y el nombre del destinatario necesarios para el rastreo y entrega del paquete. Los números de teléfono y datos sensibles no se exponen ni indexan en búsquedas públicas.
- **Principio de Seguridad:** Se implementan medidas técnicas, organizativas y legales para evitar la alteración, pérdida o acceso no autorizado.

---

### 2. Arquitectura de Almacenamiento Seguro (Supabase Storage)
- **Bucket Privado Obligatorio:** El bucket `receipts` está marcado explícitamente como `public = false`. Ningún usuario puede acceder a archivos mediante URLs estáticas públicas.
- **Rutas Anónimas basadas en UUID:**
  `receipts/{user_id}/{receipt_uuid}.png`
  El DNI **NUNCA** forma parte de la ruta de almacenamiento ni del nombre del archivo en disco. Esto evita fugas de información a través de logs de servidores web, proxies o historial de navegación.
- **URLs Firmadas de Vencimiento Corto:**
  Para visualizar un comprobante en la web o app móvil, el backend genera una URL firmada criptográficamente con validez temporal de **15 minutos (900 segundos)**:
  ```typescript
  const { data } = await supabase.storage
    .from('receipts')
    .createSignedUrl(storagePath, 900);
  ```
- **Integridad y Deduplicación (SHA-256):**
  Cada imagen procesada se calcula con un hash SHA-256 antes de guardarse. Si se detecta un hash idéntico registrado previamente, se alerta al operador sobre un comprobante duplicado.

---

### 3. Mecanismo de Compensación Transaccional
Para evitar la existencia de archivos huérfanos o inconsistencias entre el Storage y PostgreSQL:
```typescript
try {
  // 1. Subida a Storage
  await uploadToStorage(storagePath, imageBuffer);
  // 2. Registro en Base de Datos
  await insertReceiptRecord(receiptData);
} catch (error) {
  // COMPENSACIÓN INMEDIATA:
  await removeFromStorage(storagePath);
  throw error;
}
```

---

### 4. Protección contra Ataques Comunes
- **Prevención de Inyección SQL:** Todas las consultas en Supabase utilizan queries parametrizadas y funciones almacenadas tipadas.
- **Prevención de Scraping y Fuerza Bruta en Búsqueda por DNI:**
  - El buscador exige coincidencia exacta de 8 dígitos de DNI o 9-10 caracteres de CE.
  - No se permiten comodines (`%`, `*`) ni búsquedas por prefijo.
  - Rate limiting implementado a nivel de cabeceras HTTP.
- **Auditoría Exhaustiva:**
  Cada búsqueda exitosa o fallida queda registrada en `public.audit_logs` con dirección IP, agente de usuario y marca de tiempo.
