# Guía de uso - AIdeasBoom
## Sistema automatizado de generación y aprobación de contenido

---

## Flujo completo del sistema

### 1. Generar planeación mensual (4 semanas de contenido)

```bash
POST /api/planning/generate
```

**Body:**
```json
{
  "clientId": "d02ea2e0-87e3-4c58-a340-4969976dc448",
  "year": 2026,
  "month": 4,
  "conversionLevel": "none"
}
```

**Qué hace:**
- Genera contenido semana por semana (4 llamadas a OpenAI para mejor calidad)
- **Básico**: 2 reels + 2 posts + 2 carruseles × 4 semanas = **24 piezas/mes**
- **Premium**: 3 reels + 4 posts + 4 carruseles × 4 semanas = **44 piezas/mes**
- Distribuye automáticamente por embudo (40% TOFU / 40% MOFU / 20% BOFU)
- **Exporta automáticamente** a Google Sheet "Planeación mensual"

**Respuesta:**
```json
{
  "message": "Planeación generada exitosamente",
  "planning": {
    "id": "...",
    "month": 4,
    "year": 2026,
    "total": 44,
    "status": "draft"
  },
  "sheetUrl": "https://docs.google.com/spreadsheets/d/..."
}
```

---

### 2. Cliente revisa en Google Sheet

El cliente abre la pestaña **"Planeación mensual"** y revisa cada pieza:

**Columnas del sheet:**
- `id_contenido` — ID único (no modificar)
- `mes` — Mes de la planeación
- `semana` — Semana 1-4
- `subtema` — Tema de la pieza
- `formato` — reel, post o carrusel
- `titulo` — Título/tema principal
- `hook` — Hook de entrada
- `embudo` — tofu, mofu o bofu
- `cta_sugerido` — Call to action
- **`estado_aprobacion`** — **Dropdown: Pendiente / Aprobado / Rechazado / Modificar**
- **`comentarios_cliente`** — Comentarios o cambios solicitados

**El cliente marca cada pieza:**
- **Aprobado** → Se procesa para generar imágenes
- **Rechazado** → Se descarta
- **Modificar** → Requiere ajustes (indicar en comentarios)
- **Pendiente** → Aún no revisado

---

### 3. Sincronizar aprobaciones desde Google Sheet

```bash
POST /api/workflow/planning/{planningId}/sync-ideas
```

**Qué hace:**
- Lee el estado de aprobación del Google Sheet "Planeación mensual"
- Actualiza la base de datos con los estados y comentarios
- Cuenta cuántas piezas están aprobadas, rechazadas, pendientes

**Respuesta:**
```json
{
  "message": "Aprobaciones sincronizadas desde \"Planeación mensual\"",
  "total": 44,
  "aprobados": 35,
  "rechazados": 3,
  "modificar": 6,
  "pendientes": 0
}
```

---

### 4. Procesar piezas aprobadas (generar imágenes)

```bash
POST /api/workflow/planning/{planningId}/process-approved
```

**Qué hace:**
- Encuentra todas las piezas con estado "Aprobado"
- Genera imágenes con Puppeteer (1080x1080 PNG)
  - **Posts**: 1 imagen
  - **Carruseles**: 7-8 slides
  - **Reels**: Script (sin imagen)
- Sube las imágenes a **Google Drive** (carpeta `AIdeasBoom/{cliente}/{mes-año}`)
- Obtiene URLs públicas de las imágenes
- Exporta a la pestaña **"Preview contenido"** con links a las imágenes

**Respuesta:**
```json
{
  "message": "Imágenes generadas y exportadas a \"Preview contenido\"",
  "processed": 35,
  "imagesGenerated": 223,
  "sheetUrl": "https://docs.google.com/spreadsheets/d/...#gid=1105936789"
}
```

---

### 5. Cliente revisa preview con imágenes

El cliente abre la pestaña **"Preview contenido"** y revisa las imágenes:

**Columnas del sheet:**
- `id_contenido` — ID único
- `Hook` — Hook de la pieza
- `estructura_carrusel` — Títulos de las slides (si es carrusel)
- `copy_completo` — Texto completo
- `CTA` — Call to action
- **`Link_preview_visual`** — Link a las imágenes en Google Drive
- **`estado_aprobacion`** — **Dropdown: Pendiente / Aprobado / Modificar**
- **`Comentarios_cliente`** — Comentarios finales

**El cliente:**
- Ve las imágenes haciendo clic en los links
- Marca como **Aprobado** si está listo para publicar
- Marca como **Modificar** si necesita ajustes (especifica en comentarios)

---

### 6. Sincronizar aprobación final

```bash
POST /api/workflow/planning/{planningId}/sync-preview
```

**Qué hace:**
- Lee el estado de "Preview contenido"
- Actualiza la base de datos
- Si todas las piezas aprobadas están confirmadas → Planning pasa a `completed`

**Respuesta:**
```json
{
  "message": "Aprobaciones finales sincronizadas",
  "total": 35,
  "aprobados": 32,
  "modificar": 3,
  "pendientes": 0
}
```

---

### 7. Ver estado del workflow en cualquier momento

```bash
GET /api/workflow/planning/{planningId}/status
```

**Qué hace:**
- Muestra un resumen completo del estado de la planeación
- Indica cuál es el siguiente paso (`nextAction`)

**Respuesta:**
```json
{
  "planningId": "...",
  "clientName": "Moni Grizales",
  "month": 4,
  "year": 2026,
  "planningStatus": "draft",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/...",
  "pieces": {
    "total": 44,
    "byApprovalStatus": {
      "Pendiente": 0,
      "Aprobado": 35,
      "Rechazado": 3,
      "Modificar": 6
    },
    "byStatus": {
      "generated": 44,
      "reviewed": 35,
      "approved": 32,
      "published": 0
    },
    "withImages": 35
  },
  "nextAction": "process-approved"
}
```

**Posibles `nextAction`:**
- `sync-ideas` → Cliente debe revisar "Planeación mensual", luego sincronizar
- `process-approved` → Hay piezas aprobadas pendientes de generar imágenes
- `sync-preview` → Cliente debe revisar "Preview contenido", luego sincronizar
- `completed` → Todo completado y aprobado

---

## Paquetes de contenido

### Básico (6 piezas/semana × 4 = 24/mes)
- 2 reels/semana
- 2 posts/semana
- 2 carruseles/semana

### Premium (11 piezas/semana × 4 = 44/mes)
- 3 reels/semana
- 4 posts/semana
- 4 carruseles/semana

---

## Distribución por embudo (default)

- **40% TOFU** (Top of Funnel) — Identificación: "Eso me pasa", "Eso lo siento yo"
- **40% MOFU** (Middle of Funnel) — Comprensión: "Por qué me pasa", nueva perspectiva
- **20% BOFU** (Bottom of Funnel) — Invitación consciente: "Quiero recorrer este camino"

Con `conversionLevel: "active"`:
- **35% TOFU / 35% MOFU / 30% BOFU**

---

## Configuración del cliente

Para que el sistema funcione automáticamente, el cliente debe tener configurado:

```json
{
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/..."
}
```

Esto se hace una vez al crear el cliente:

```bash
POST /api/clients
```

**Body:**
```json
{
  "name": "Cliente Nuevo",
  "slug": "cliente-nuevo",
  "packageType": "premium",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/...",
  "targetAudience": "...",
  "mainTransformation": "...",
  ...
}
```

O se puede actualizar después:

```bash
PATCH /api/clients/{clientId}
```

**Body:**
```json
{
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/..."
}
```

---

## Google Sheet — Estructura esperada

El Google Sheet debe tener estas pestañas con estos headers exactos:

### Pestaña "Planeación mensual" (gid=1950835062)
```
id_contenido | mes | semana | subtema | formato | titulo | hook | embudo | cta_sugerido | estado_aprobacion | comentarios_cliente
```

### Pestaña "Preview contenido" (gid=1105936789)
```
id_contenido | Hook | estructura_carrusel | copy_completo | CTA | Link_preview_visual | estado_aprobacion | Comentarios_cliente
```

El sistema limpia y reescribe estas pestañas cada vez que exporta.

---

## Variables de entorno requeridas

Asegúrate de tener configurado en `.env`:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aideasboom
DB_USER=postgres
DB_PASSWORD=admin123

# OpenAI
OPENAI_API_KEY=sk-...

# Google APIs (Service Account)
GOOGLE_SERVICE_ACCOUNT_PATH=./google-service-account.json

# Servidor
PORT=3000
NODE_ENV=development
```

---

## Testing rápido

### 1. Crear planeación de prueba para Abril 2026:
```bash
curl -X POST http://localhost:3000/api/planning/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "d02ea2e0-87e3-4c58-a340-4969976dc448",
    "year": 2026,
    "month": 4
  }'
```

### 2. Ver estado:
```bash
curl http://localhost:3000/api/workflow/planning/{planningId}/status
```

### 3. Revisar Google Sheet → cambiar algunos a "Aprobado"

### 4. Sincronizar aprobaciones:
```bash
curl -X POST http://localhost:3000/api/workflow/planning/{planningId}/sync-ideas
```

### 5. Generar imágenes:
```bash
curl -X POST http://localhost:3000/api/workflow/planning/{planningId}/process-approved
```

### 6. Revisar "Preview contenido" → marcar como "Aprobado"

### 7. Sincronizar aprobación final:
```bash
curl -X POST http://localhost:3000/api/workflow/planning/{planningId}/sync-preview
```

---

## Notas importantes

- **Regenerar planeación**: Si necesitas regenerar un mes, usa `POST /api/planning/{id}/regenerate`
- **Las imágenes se guardan en Google Drive** en la carpeta `AIdeasBoom/{nombreCliente}/{mesAño}`
- **El sistema genera semana por semana** para mantener mejor calidad y evitar repeticiones
- **Los IDs de contenido son UUIDs** — el cliente no debe modificarlos en el sheet
- **El servidor debe estar corriendo** para que los endpoints funcionen
- **Cada generación mensual cuesta ~$2-4 USD** en OpenAI API (depende del paquete)

---

## Troubleshooting

### Error: "No se proporcionó URL del Google Sheet"
→ Verifica que el cliente tenga `spreadsheetUrl` configurado en la DB

### Error: "Planning not found"
→ Usa el ID correcto del planning (UUID)

### Imágenes no se generan
→ Verifica que las piezas estén marcadas como "Aprobado" en "Planeación mensual"

### Google Sheets no se actualiza
→ Verifica que el Service Account tenga permisos de edición en el sheet

### Server no inicia
→ Verifica que PostgreSQL esté corriendo y las credenciales sean correctas
→ Revisa que el puerto 3000 esté libre

---

## Cliente actual configurado

**Moni Grizales**
- ID: `d02ea2e0-87e3-4c58-a340-4969976dc448`
- Paquete: Premium (44 piezas/mes)
- Sheet: https://docs.google.com/spreadsheets/d/1tmzIrO1C8JhpWK-oEFb1HVMXh8V-ZVmXztaoEntQJhA
- Marzo 2026: Ya generado (Planning ID: `57dd251d-c4ae-4444-8dd5-b148e82b6933`)
