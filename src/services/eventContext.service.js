/**
 * Event Context Service
 *
 * Calcula la etapa promocional de eventos del cliente
 * y genera instrucciones para los prompts de OpenAI.
 *
 * Etapas (basadas en semanas antes del evento):
 *  - 4+ semanas → "siembra"    (curiosidad, no nombrar evento)
 *  - 2-3 semanas → "anuncio"   (nombrar evento, beneficios)
 *  - 0-1 semanas → "urgencia"  (últimos cupos, CTA directo)
 *  - durante     → "activo"    (FOMO, behind the scenes)
 *  - hasta 2 sem después → "post" (reflexiones, testimonios)
 */

const { Op } = require('sequelize');
const Event = require('../modules/events/event.model');
const logger = require('../config/logger');

const MESES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// ── Distribuciones de embudo por etapa ────────────────────────────────
const STAGE_DISTRIBUTIONS = {
  siembra:  { tofu: 0.40, mofu: 0.40, bofu: 0.20 },
  anuncio:  { tofu: 0.35, mofu: 0.35, bofu: 0.30 },
  urgencia: { tofu: 0.30, mofu: 0.30, bofu: 0.40 },
  activo:   { tofu: 0.40, mofu: 0.40, bofu: 0.20 },
  post:     { tofu: 0.40, mofu: 0.40, bofu: 0.20 },
};

// Prioridad de stages (mayor = más agresivo)
const STAGE_PRIORITY = { post: 1, activo: 2, siembra: 3, anuncio: 4, urgencia: 5 };

/**
 * Calcula la fecha de referencia para una semana del mes.
 * Semana 1 = día 1, Semana 2 = día 8, Semana 3 = día 15, Semana 4 = día 22.
 */
function weekReferenceDate(year, month, week) {
  const day = 1 + (Math.max(1, Math.min(4, week)) - 1) * 7;
  return new Date(year, month - 1, day);
}

/**
 * Calcula la etapa promocional de un evento respecto a una fecha.
 * @returns {{ stage: string, weeksUntilStart: number }} | null
 */
function calculateStage(event, referenceDate) {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : start;
  const ref = new Date(referenceDate);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilStart = Math.ceil((start - ref) / msPerDay);
  const daysUntilEnd = Math.ceil((end - ref) / msPerDay);
  const weeksUntilStart = Math.ceil(daysUntilStart / 7);

  // Ya pasó el evento
  if (daysUntilEnd < 0) {
    const daysSinceEnd = Math.abs(daysUntilEnd);
    if (daysSinceEnd <= 14) {
      return { stage: 'post', weeksUntilStart: 0, daysUntilStart };
    }
    return null; // más de 2 semanas después — no relevante
  }

  // Durante el evento
  if (daysUntilStart <= 0 && daysUntilEnd >= 0) {
    return { stage: 'activo', weeksUntilStart: 0, daysUntilStart };
  }

  // Antes del evento
  if (weeksUntilStart >= 6) {
    return { stage: 'siembra', weeksUntilStart, daysUntilStart };
  }
  if (weeksUntilStart >= 2) {
    return { stage: 'anuncio', weeksUntilStart, daysUntilStart };
  }
  // 0-1 semanas
  return { stage: 'urgencia', weeksUntilStart, daysUntilStart };
}

/**
 * Obtiene el contexto de todos los eventos activos de un cliente.
 * @param {string} clientId
 * @param {Date} referenceDate
 * @returns {Array} Contextos con stage calculado (solo eventos relevantes)
 */
async function getActiveEventContexts(clientId, referenceDate) {
  // Buscar eventos activos: desde 2 semanas después de hoy hasta cualquier fecha futura
  const events = await Event.findAll({
    where: { clientId, active: true },
    order: [['start_date', 'ASC']],
  });

  const contexts = [];
  for (const event of events) {
    const stageInfo = calculateStage(event, referenceDate);
    if (!stageInfo) continue; // evento pasado, no relevante

    const startMonth = new Date(event.startDate).getMonth() + 1;
    const startDay = new Date(event.startDate).getDate();
    const endDay = event.endDate ? new Date(event.endDate).getDate() : null;

    contexts.push({
      eventId: event.id,
      name: event.name,
      description: event.description,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      schedule: event.schedule,
      registrationUrl: event.registrationUrl,
      keyBenefits: event.keyBenefits || [],
      targetPrice: event.targetPrice,
      stage: stageInfo.stage,
      weeksUntilStart: stageInfo.weeksUntilStart,
      daysUntilStart: stageInfo.daysUntilStart,
      dateLabel: endDay
        ? `${startDay} y ${endDay} de ${MESES[startMonth]}`
        : `${startDay} de ${MESES[startMonth]}`,
    });
  }

  if (contexts.length > 0) {
    logger.info(`Eventos activos para cliente: ${contexts.map(c => `"${c.name}" (${c.stage}, ${c.weeksUntilStart} sem)`).join(', ')}`);
  }

  return contexts;
}

/**
 * Retorna la distribución de embudo para un stage dado.
 */
function getFunnelDistributionForStage(stage) {
  return STAGE_DISTRIBUTIONS[stage] || STAGE_DISTRIBUTIONS.siembra;
}

/**
 * Determina el stage dominante entre múltiples eventos (el más agresivo).
 */
function dominantStage(eventContexts) {
  if (!eventContexts || eventContexts.length === 0) return null;
  return eventContexts.reduce((best, ctx) => {
    return (STAGE_PRIORITY[ctx.stage] || 0) > (STAGE_PRIORITY[best.stage] || 0) ? ctx : best;
  }).stage;
}

// ── Instrucciones para prompts de publicaciones ───────────────────────

const STAGE_INSTRUCTIONS = {
  siembra: (ctx) => `ETAPA PROMOCIONAL: SIEMBRA (faltan ${ctx.weeksUntilStart} semanas)

INSTRUCCIONES PARA ESTA ETAPA:
- NO nombrar el evento "${ctx.name}" directamente. Generar curiosidad y necesidad.
- Hablar de los TEMAS que el evento aborda sin revelar que hay un evento.
- Las piezas TOFU y MOFU tratan los temas del período normalmente.
- Las piezas BOFU deben insinuar que "algo especial viene pronto", "se abre un espacio en ${MESES[new Date(ctx.startDate).getMonth() + 1]}..."
- CTAs de reflexión y conexión. No vender. Solo despertar interés.
- Generar preguntas que el evento responde: "¿Qué pasaría si pudieras...?"`,

  anuncio: (ctx) => `ETAPA PROMOCIONAL: ANUNCIO (faltan ${ctx.weeksUntilStart} semanas)

INSTRUCCIONES PARA ESTA ETAPA:
- NOMBRAR el evento "${ctx.name}" explícitamente en al menos 2 piezas BOFU.
- Fecha: ${ctx.dateLabel}${ctx.schedule ? ` · Horario: ${ctx.schedule}` : ''}
- Destacar BENEFICIOS concretos y la transformación que ofrece.${ctx.keyBenefits.length > 0 ? `\n- Beneficios clave: ${ctx.keyBenefits.join(', ')}` : ''}
- Las piezas TOFU y MOFU hablan del tema del evento aportando valor.
- Las piezas BOFU incluyen CTA suave hacia inscripción: "Si sientes que es tu momento...", "Este espacio es para quien está lista..."${ctx.registrationUrl ? `\n- URL de inscripción para CTAs: ${ctx.registrationUrl}` : ''}
- En carruseles BOFU: dedicar al menos 1-2 slides a beneficios del evento.
- En reels BOFU: la coach menciona el evento naturalmente en el guion.`,

  urgencia: (ctx) => `ETAPA PROMOCIONAL: URGENCIA (faltan ${ctx.daysUntilStart} días)

INSTRUCCIONES PARA ESTA ETAPA — MÁXIMA PRIORIDAD:
- TODAS las piezas BOFU deben ser sobre el evento "${ctx.name}".
- Fecha: ${ctx.dateLabel}${ctx.schedule ? ` · Horario: ${ctx.schedule}` : ''}${ctx.targetPrice ? `\n- Precio: ${ctx.targetPrice}` : ''}${ctx.registrationUrl ? `\n- URL de inscripción: ${ctx.registrationUrl}` : ''}
- CTAs DIRECTOS a inscripción. Sin rodeos. "Las inscripciones están abiertas", "Últimos cupos".
- Generar sentido de urgencia sin ser desesperado: "Esta semana cierran inscripciones", "Quedan pocos lugares".
- Las piezas TOFU/MOFU siguen aportando valor pero conectan temáticamente con lo que se trabajará en el evento.${ctx.keyBenefits.length > 0 ? `\n- Beneficios clave: ${ctx.keyBenefits.join(', ')}` : ''}
- En reels: la coach habla directamente sobre el evento, invita personalmente.
- En carruseles: estructura tipo "Lo que vas a transformar en ${ctx.name}".`,

  activo: (ctx) => `ETAPA PROMOCIONAL: ACTIVO (el evento "${ctx.name}" está en curso)

INSTRUCCIONES:
- Compartir momentos del evento (si aplica).
- Generar FOMO para quienes no se inscribieron.
- Testimonios en tiempo real, reflexiones de participantes.
- Mantener engagement de la comunidad general con contenido de valor.`,

  post: (ctx) => `ETAPA PROMOCIONAL: POST-EVENTO ("${ctx.name}" acaba de terminar)

INSTRUCCIONES:
- Reflexiones y aprendizajes del evento.
- Transformaciones de las participantes.
- Preparar para el siguiente paso (programa, comunidad, follow-up).
- CTA de "lista de espera" para la próxima edición si aplica.`,
};

/**
 * Genera el bloque de instrucciones de evento para prompts de publicaciones.
 */
function buildEventPromptInstructions(eventContexts) {
  if (!eventContexts || eventContexts.length === 0) return '';

  // Máximo 2 eventos más relevantes
  const sorted = [...eventContexts].sort((a, b) =>
    (STAGE_PRIORITY[b.stage] || 0) - (STAGE_PRIORITY[a.stage] || 0),
  );
  const top = sorted.slice(0, 2);

  let text = '';
  for (const ctx of top) {
    const instrFn = STAGE_INSTRUCTIONS[ctx.stage];
    if (!instrFn) continue;

    text += `\n\n═══ EVENTO ACTIVO: ${ctx.name.toUpperCase()} ═══
TIPO: ${ctx.eventType.toUpperCase()}
FECHA: ${ctx.dateLabel}${ctx.schedule ? ` · ${ctx.schedule}` : ''}
${ctx.description ? `DESCRIPCIÓN: ${ctx.description}\n` : ''}
${instrFn(ctx)}`;
  }

  return text;
}

// ── Instrucciones para prompts de stories ──────────────────────────────

const STORIES_STAGE_INSTRUCTIONS = {
  siembra: (ctx) => `- Stories tipo "countdown" anticipando algo que viene, sin nombrar el evento.
- Stories grabadas donde la coach habla del TEMA (no del evento): "He estado reflexionando sobre..."
- Stickers de encuesta/pregunta sobre los temas del evento: "¿Te ha pasado que...?"
- NO mencionar nombre, fecha ni detalles del evento. Solo curiosidad.`,

  anuncio: (ctx) => `- Stories grabadas donde la coach HABLA DEL EVENTO: "Quiero contarte sobre algo que estoy preparando..."
- Nombrar "${ctx.name}" en al menos 3-4 stories de la semana.
- Stickers de encuesta: "¿Te gustaría participar?" / "¿Esto te resuena?"
- Countdown con fecha del evento (${ctx.dateLabel}).
- Stories de texto con beneficios clave del evento.
- CTA a DM: "Escríbeme para más información".${ctx.registrationUrl ? `\n- Link de inscripción: ${ctx.registrationUrl}` : ''}`,

  urgencia: (ctx) => `- MÁXIMA PRIORIDAD: ${ctx.name} está a ${ctx.daysUntilStart} días.
- Stories grabadas con URGENCIA (no desesperación): "Quedan pocos días", "Esta es tu última oportunidad".
- Countdown activo con sticker de countdown real.
- CTA DIRECTO en cada story grabada: link de inscripción, DM, etc.${ctx.targetPrice ? `\n- Mencionar precio: ${ctx.targetPrice}` : ''}
- Testimonios de ediciones anteriores si existen.
- Mínimo 3 stories diarias sobre el evento (grabadas + texto).`,

  activo: (ctx) => `- Behind the scenes del evento "${ctx.name}".
- Stories grabadas desde el evento (si es posible).
- Generar FOMO: "Mira lo que está pasando en ${ctx.name}".
- Mantener engagement general con stories complementarias.`,

  post: (ctx) => `- Reflexiones post-evento "${ctx.name}".
- Slider emocional: "¿Cómo te sentiste con lo que compartimos?"
- Stories grabadas con agradecimiento y aprendizajes.
- CTA de lista de espera para próxima edición.`,
};

/**
 * Genera instrucciones de evento para prompts de stories.
 */
function buildEventStoriesInstructions(eventContexts) {
  if (!eventContexts || eventContexts.length === 0) return '';

  const sorted = [...eventContexts].sort((a, b) =>
    (STAGE_PRIORITY[b.stage] || 0) - (STAGE_PRIORITY[a.stage] || 0),
  );
  const top = sorted.slice(0, 2);

  let text = '';
  for (const ctx of top) {
    const instrFn = STORIES_STAGE_INSTRUCTIONS[ctx.stage];
    if (!instrFn) continue;

    text += `\n\n═══ EVENTO ACTIVO PARA STORIES: ${ctx.name.toUpperCase()} ═══
ETAPA: ${ctx.stage.toUpperCase()} (${ctx.weeksUntilStart > 0 ? `faltan ${ctx.weeksUntilStart} semanas` : ctx.stage === 'activo' ? 'en curso' : 'recién terminó'})
FECHA: ${ctx.dateLabel}${ctx.schedule ? ` · ${ctx.schedule}` : ''}

INSTRUCCIONES DE STORIES PARA ESTA ETAPA:
${instrFn(ctx)}`;
  }

  return text;
}

module.exports = {
  calculateStage,
  getActiveEventContexts,
  getFunnelDistributionForStage,
  dominantStage,
  weekReferenceDate,
  buildEventPromptInstructions,
  buildEventStoriesInstructions,
};
