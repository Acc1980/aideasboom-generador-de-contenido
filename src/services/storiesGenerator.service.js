/**
 * Stories Generator Service
 *
 * Genera stories diarias de Instagram a partir del contenido
 * aprobado de una planeación semanal. Lee las piezas con
 * approvalStatus='aprobado', compila la estrategia y pide
 * a OpenAI que genere 5 stories por día × 6 días (Lunes-Sábado, sin Domingo).
 */

const strategyCompiler = require('./strategyCompiler.service');
const { getActiveEventContexts, weekReferenceDate } = require('./eventContext.service');
const { buildStoriesSystemPrompt, buildStoriesPrompt } = require('./promptBuilder.service');
const openaiService = require('./openai.service');
const Planning = require('../modules/planning/planning.model');
const Content = require('../modules/content/content.model');
const Client = require('../modules/clients/client.model');
const Story = require('../modules/stories/story.model');
const logger = require('../config/logger');

const DAY_LABELS = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
  5: 'Viernes', 6: 'Sábado',
};

/**
 * Calcula la fecha real (YYYY-MM-DD) de una story dado el año, mes,
 * semana del mes (1-4) y día de la semana (1=Lunes … 6=Sábado).
 */
function getStoryScheduledDate(year, month, week, dayOfWeek) {
  // Primer día del bloque semanal: 1, 8, 15 o 22
  const refDay = 1 + (Math.max(1, Math.min(4, week)) - 1) * 7;
  const ref = new Date(year, month - 1, refDay);
  // Retroceder hasta el Lunes de esa semana (JS: 0=Dom, 1=Lun … 6=Sáb)
  const jsDay = ref.getDay();
  const daysToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + daysToMonday);
  // Avanzar al día exacto de la story
  const result = new Date(monday);
  result.setDate(monday.getDate() + (dayOfWeek - 1));
  return result.toISOString().slice(0, 10);
}

const ACTIVE_DAYS = 6; // Lunes a Sábado (sin Domingo)

/**
 * Genera las stories de la semana para una planeación.
 *
 * @param {string} planningId - UUID del Planning
 * @param {object} opts
 * @param {boolean} opts.replace - Si true, elimina stories anteriores antes de generar
 * @param {number} opts.storiesPerDay - Stories por día (default 5)
 */
async function generateStories(planningId, { replace = false, storiesPerDay = 3 } = {}) {
  const planning = await Planning.findByPk(planningId, {
    include: [
      { model: Client, as: 'client' },
      { model: Content, as: 'contents', order: [['order', 'ASC']] },
    ],
  });
  if (!planning) throw new Error('Planeación no encontrada');

  const client = planning.client;

  // Filtrar contenido aprobado
  const approvedContent = planning.contents.filter(c => c.approvalStatus === 'aprobado');

  logger.info(
    `Generando stories para planning ${planningId} — ${approvedContent.length} piezas aprobadas, ${storiesPerDay} stories/día`,
  );

  // Si replace, eliminar stories anteriores
  if (replace) {
    const deleted = await Story.destroy({ where: { planningId } });
    if (deleted > 0) logger.info(`${deleted} stories anteriores eliminadas`);
  }

  // Compilar estrategia
  const quarter = Math.ceil(planning.month / 3);
  const compiledStrategy = await strategyCompiler.compile(client.id, {
    year: planning.year,
    quarter,
    month: planning.month,
  });

  // Recalcular eventContexts con referencia exacta de la semana
  const refDate = weekReferenceDate(planning.year, planning.month, planning.week);
  compiledStrategy.eventContexts = await getActiveEventContexts(client.id, refDate);

  // Construir prompts
  const systemPrompt = buildStoriesSystemPrompt(client.brandIdentity || {});
  const userPrompt = buildStoriesPrompt(approvedContent, compiledStrategy, planning.week, storiesPerDay);

  // Llamar a OpenAI — stories para 6 días (Lunes-Sábado)
  const aiResponse = await openaiService.generateJSON(systemPrompt, userPrompt, {
    temperature: 0.8,
    maxTokens: 8192,
  });

  const stories = aiResponse.stories;
  if (!Array.isArray(stories) || stories.length === 0) {
    throw new Error('OpenAI no devolvió stories');
  }

  // Construir mapa de títulos → contentId para vincular relatedContentId
  const titleToContentId = {};
  for (const piece of planning.contents) {
    if (piece.title) titleToContentId[piece.title.toLowerCase().trim()] = piece.id;
  }

  // Filtrar stories del Domingo (por si la IA lo incluyó) y preparar registros
  const filteredStories = stories.filter(s => s.dayOfWeek >= 1 && s.dayOfWeek <= 6);
  if (filteredStories.length < stories.length) {
    logger.warn(`Se descartaron ${stories.length - filteredStories.length} stories de Domingo`);
  }

  const storyRecords = filteredStories.map(s => {
    const relatedTitle = (s.relatedContentTitle || '').toLowerCase().trim();
    return {
      planningId,
      relatedContentId: titleToContentId[relatedTitle] || null,
      dayOfWeek: s.dayOfWeek,
      dayLabel: s.dayLabel || DAY_LABELS[s.dayOfWeek] || `Día ${s.dayOfWeek}`,
      order: s.order,
      storyType: s.storyType,
      isRecorded: false,
      script: s.script || null,
      textContent: s.textContent || null,
      visualDirection: s.visualDirection || null,
      cta: s.cta || null,
      stickerSuggestion: s.stickerSuggestion || null,
      scheduledDate: getStoryScheduledDate(planning.year, planning.month, planning.week, s.dayOfWeek),
      status: 'generated',
      approvalStatus: 'pendiente',
    };
  });

  await Story.bulkCreate(storyRecords);
  logger.info(`${storyRecords.length} stories generadas para planning ${planningId}`);

  return { generated: storyRecords.length, days: ACTIVE_DAYS, perDay: storiesPerDay };
}

module.exports = { generateStories };
