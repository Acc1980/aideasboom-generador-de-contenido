# AIdeasBoom

Sistema interno para automatizar la generación estratégica de contenido para múltiples clientes de agencia digital.

## Stack

- Node.js + Express
- PostgreSQL (Sequelize ORM)
- OpenAI API (gpt-4o)
- BullMQ + Redis (jobs asíncronos)
- Winston (logging)

## Estructura

```
src/
├── server.js                          # Entry point
├── config/
│   ├── database.js                    # Sequelize + PostgreSQL
│   ├── logger.js                      # Winston logger
│   ├── packages.js                    # Definición de paquetes (basico/premium)
│   ├── redis.js                       # Conexión Redis para BullMQ
│   ├── migrate.js                     # npm run db:migrate
│   └── seed.js                        # npm run db:seed
├── modules/
│   ├── clients/                       # CRUD de clientes
│   ├── strategy/                      # Estrategias por período
│   ├── planning/                      # Planeación mensual
│   └── content/                       # Piezas de contenido
├── services/
│   ├── openai.service.js              # Capa de abstracción OpenAI
│   ├── packageCalculator.service.js   # Distribución por paquete y embudo
│   ├── strategyCompiler.service.js    # Compilador de estrategia unificada
│   ├── promptBuilder.service.js       # Constructor de prompts dinámicos
│   └── planningGenerator.service.js   # Orquestador de generación
└── jobs/
    └── generateContent.job.js         # Worker BullMQ
```

## Paquetes de contenido

- **Básico**: 2 reels + 2 posts + 2 carruseles = 6 piezas/mes
- **Premium**: 3 reels + 4 posts + 4 carruseles = 11 piezas/mes

## Distribución de embudo

- Default: 40% TOFU / 40% MOFU / 20% BOFU
- Con conversión activa: 35% TOFU / 35% MOFU / 30% BOFU

## Comandos

```bash
npm install          # Instalar dependencias
npm run dev          # Desarrollo con nodemon
npm start            # Producción
npm run db:migrate   # Sincronizar modelos con PostgreSQL
npm run db:seed      # Insertar datos de ejemplo
```

## API Endpoints

- `POST /api/clients` – Crear cliente
- `GET /api/clients` – Listar clientes activos
- `POST /api/strategy/client/:clientId` – Crear estrategia
- `GET /api/strategy/client/:clientId/compile` – Compilar estrategia unificada
- `POST /api/planning/generate` – Generar planeación mensual (body: clientId, year, month)
- `GET /api/content/planning/:planningId` – Obtener contenidos de una planeación
