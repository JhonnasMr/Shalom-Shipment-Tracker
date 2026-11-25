# MOTOR OCR Y PROCESAMIENTO INTELIGENTE DE IMÁGENES
## DocuDNI - Guía Técnica de Reconocimiento y Extracción

### 1. Desafío de los Comprobantes Térmicos Peruanos
Los tickets de encomiendas y agencias de transporte (como **SHALOM**, Olva, Marvisur) presentan características particulares:
1. Impresión térmica propensa a degradación, manchas o bajo contraste.
2. Presencia de múltiples bloques numéricos:
   - Número de Orden (9 dígitos: ej. `104792291`).
   - Código de entrega (ej. `CDN7`).
   - RUC de la empresa (11 dígitos).
   - Bloque `DATOS DEL REMITENTE` con DNI (8 dígitos: ej. `41316372`) y teléfono (9 dígitos: ej. `926938449`).
   - Bloque `DATOS DEL DESTINATARIO` con Nombre, DNI (ej. `47037422`) y teléfono (ej. `913561135`).
3. El riesgo principal es extraer el DNI del remitente o el teléfono en lugar del DNI del destinatario.

---

### 2. Pipeline de Preprocesamiento de Imágenes (`ImagePreprocessor`)
Antes de invocar el motor OCR, cada imagen es sometida a un pipeline con `sharp`:
1. **Auto-orientación EXIF (`rotate()`):** Corrige automáticamente imágenes tomadas en orientación vertical u horizontal desde smartphones.
2. **Conversión a Escala de Grises (`grayscale()`):** Elimina el ruido cromático de fondos de color o papeles envejecidos.
3. **Normalización Dinámica de Contraste (`normalize()`):** Expande el rango dinámico del histograma para destacar los caracteres de tinta térmica sobre el fondo blanco/grisáceo.
4. **Agudizamiento de Caracteres (`sharpen()`):** Aplica una máscara de desenfoque no lineal para restaurar los bordes de caracteres borrosos o ligeramente fuera de foco.
5. **Cálculo de Hash SHA-256:** Para control de duplicidad e integridad.

---

### 3. Algoritmo de Extracción Contextual (`ContextualDniExtractor`)
El extractor no utiliza coordenadas fijas en píxeles. En su lugar, opera mediante un análisis contextual de regiones y anclas:
1. **Detección de Secciones:**
   - Detecta el inicio de `DATOS DEL REMITENTE` y almacena sus líneas por separado.
   - Extrae el DNI del remitente y lo coloca en una lista de **descarte estricto**.
   - Detecta el inicio de `DATOS DEL DESTINATARIO` (o variantes: `DESTINATARIO`, `CONSIGNATARIO`, `ENTREGAR A`).
2. **Extracción en la Zona del Destinatario:**
   - **Nombre:** Expresión regular que busca etiquetas como `Nombre:`, `Mombre:`, `Destinatario:` seguida de nombres en mayúsculas.
   - **DNI:** Expresión regular que busca etiquetas como `DNI:`, `DN:`, `TIM:`, `DOC:` o secuencias de 8 dígitos numéricos.
3. **Reglas de Descarte y Corrección de Confusión OCR:**
   - Si un número tiene 9 dígitos y comienza con `9`, es identificado y descartado como teléfono celular peruano.
   - Si se detectan caracteres típicos de confusión OCR en posiciones numéricas (e.g. `O` por `0`, `I`/`l` por `1`), se normalizan de forma segura solo si la secuencia completa valida como DNI.
   - El DNI del remitente queda explícitamente vetado para la asignación del destinatario.

---

### 4. Sistema de Evaluación de Confianza (Confidence Scoring)
El sistema calcula un puntaje entre 0.00 y 1.00:
- **Confianza Alta (≥ 0.88):** Bloque `DATOS DEL DESTINATARIO` localizado + DNI válido de 8 dígitos + Nombre del destinatario extraído sin ambigüedad. Permite confirmación rápida.
- **Confianza Intermedia (0.65 - 0.87):** DNI de 8 dígitos localizado, pero requirió normalización OCR o el nombre está incompleto. El sistema alerta al operador para que revise la fotografía.
- **Baja Confianza (< 0.65):** No se detectó un DNI válido o existe ambigüedad. El sistema exige edición manual obligatoria o repetición de la captura.
