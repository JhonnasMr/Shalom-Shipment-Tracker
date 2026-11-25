# MANUAL DE PRUEBAS Y CONTROL DE CALIDAD
## DocuDNI - Estrategia de Pruebas Automatizadas

### 1. Resumen de Suites de Pruebas
El proyecto cuenta con una cobertura integral dividida en tres niveles:
1. **Pruebas Unitarias (Vitest):**
   - Validación estricta de DNI peruano (8 dígitos) y CE (9-10 caracteres).
   - Detección y rechazo de números de teléfono móvil (9 dígitos que inician con 9).
   - Rechazo de números triviales repetitivos (`00000000`).
   - Normalización de confusión de caracteres OCR (`O` -> `0`, `I` -> `1`).
   - Extracción contextual de destinatario frente a remitente sobre tickets de Shalom.
   - Preprocesamiento de imágenes con Sharp (cálculo SHA-256, metadatos, rotación).
   - Generación de rutas seguras de almacenamiento sin exponer DNIs.
2. **Pruebas de Integración (Vitest):**
   - Parámetros y validaciones de `/api/receipts/search`.
   - Control de errores y respuestas 400 ante entradas malformadas.
   - Métricas del dashboard en `/api/receipts/stats`.
3. **Pruebas End-to-End (Playwright):**
   - Flujo de búsqueda pública por DNI en navegador de escritorio y móvil.
   - Flujo PWA móvil del operador: Inicio -> Digitalización -> Validación -> Confirmación.

---

### 2. Comandos para Ejecutar las Pruebas

#### Ejecutar Pruebas Unitarias e Integración:
```bash
npm test
```

#### Ejecutar con Modo Observador (Watch Mode):
```bash
npm run test:watch
```

#### Medir Cobertura de Código:
```bash
npm run test:coverage
```

#### Ejecutar Pruebas E2E con Playwright:
```bash
npm run test:e2e
```

---

### 3. Matriz de Resultados del Comprobante Shalom Real
Evaluación realizada sobre el ticket provisto (`test-fixtures/sample_shalom_receipt.png`):
| Métrica | Valor Esperado | Valor Obtenido | Estado |
| :--- | :--- | :--- | :--- |
| **DNI Destinatario** | `47037422` | `47037422` | **100% Correcto** |
| **Nombre Destinatario** | `RODRIGUEZ GARCIA SANDRA YASET` | `RODRIGUEZ GARCIA SANDRA YASET` | **100% Correcto** |
| **DNI Remitente (Descartado)** | `41316372` | Descartado de destinatario | **100% Correcto** |
| **Teléfonos (Descartados)** | `926938449` / `913561135` | No confundidos con DNI | **100% Correcto** |
| **Nivel de Confianza** | `high` (≥ 0.88) | `0.95` (Alta) | **Óptimo** |
