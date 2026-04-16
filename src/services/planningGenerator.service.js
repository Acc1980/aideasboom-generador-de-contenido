/**
 * Planning Generator Service
 *
 * Divide la generación en dos fases:
 *  1. createPlanning  – crea el registro Planning (sin contenido)
 *  2. generateFormat  – genera piezas para UN formato y las persiste
 *
 * El controller llama a createPlanning una vez y luego a generateFormat
 * tres veces (post → carrusel → reel), permitiendo mostrar progreso
 * en el panel y optimizar el uso de tokens por llamada a OpenAI.
 */

const strategyCompiler = require('./strategyCompiler.service');
const { calculatePackageDistribution, calculateWithCustomFunnel } = require('./packageCalculator.service');
const { buildSystemPrompt, buildFormatPrompt } = require('./promptBuilder.service');
const { getActiveEventContexts, getFunnelDistributionForStage, dominantStage, weekReferenceDate } = require('./eventContext.service');
const openaiService = require('./openai.service');
const Planning = require('../modules/planning/planning.model');
const Content = require('../modules/content/content.model');
const Client = require('../modules/clients/client.model');
const logger = require('../config/logger');

const FORMAT_KEY = { post: 'posts', carrusel: 'carruseles', reel: 'reels' };

/**
 * Calcula el lunes de la semana N del mes.
 * Semana 1 = primer lunes del mes, semana 2 = segundo lunes, etc.
 */
function getWeekMonday(year, month, week) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const dow = firstDay.getUTCDay(); // 0=Dom, 1=Lun ... 6=Sab
  const daysToMonday = dow === 0 ? 1 : dow === 1 ? 0 : (8 - dow);
  const monday = new Date(Date.UTC(year, month - 1, 1 + daysToMonday + (week - 1) * 7));
  return monday;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Asigna fechas de publicación a todas las piezas del planning.
 * Calendario fijo:
 *   Lunes    → Reel 1
 *   Martes   → Reel 2 + Carrusel 1
 *   Miércoles → Reel 3 + Post 1
 *   Jueves   → Reel 4 + Carrusel 2
 *   Viernes  → Reel 5
 */
async function assignScheduledDates(planningId) {
  const planning = await Planning.findByPk(planningId);
  if (!planning) return;

  const monday = getWeekMonday(planning.year, planning.month, planning.week);

  // Días de la semana por formato (offset desde el lunes)
  const reelDays   = [0, 1, 2, 3, 4]; // Lun, Mar, Mié, Jue, Vie
  const carruselDays = [1, 3];         // Mar, Jue
  const postDays   = [2];              // Mié

  const pieces = await Content.findAll({
    where: { planningId },
    order: [['order', 'ASC']],
  });

  const byFormat = { reel: [], carrusel: [], post: [] };
  for (const p of pieces) {
    if (byFormat[p.format]) byFormat[p.format].push(p);
  }

  const updates = [];
  for (const [i, p] of byFormat.reel.entries()) {
    const day = reelDays[i];
    if (day !== undefined) updates.push(p.update({ scheduledDate: addDays(monday, day) }));
  }
  for (const [i, p] of byFormat.carrusel.entries()) {
    const day = carruselDays[i];
    if (day !== undefined) updates.push(p.update({ scheduledDate: addDays(monday, day) }));
  }
  for (const [i, p] of byFormat.post.entries()) {
    const day = postDays[i];
    if (day !== undefined) updates.push(p.update({ scheduledDate: addDays(monday, day) }));
  }

  await Promise.all(updates);
  logger.info(`Fechas asignadas para planning ${planningId} (semana del ${addDays(monday, 0)})`);
}

/**
 * Crea el registro Planning con su distribución calculada.
 * No genera contenido — solo inicializa la planeación.
 */
async function createPlanning(client, year, month, week = 1) {
  const quarter = Math.ceil(month / 3);

  const compiledStrategy = await strategyCompiler.compile(client.id, { year, quarter, month });

  // Calcular distribución según eventos activos (si existen)
  const refDate = weekReferenceDate(year, month, week);
  const eventContexts = await getActiveEventContexts(client.id, refDate);
  const stage = dominantStage(eventContexts);

  let distribution;
  if (stage) {
    const funnelPcts = getFunnelDistributionForStage(stage);
    distribution = calculateWithCustomFunnel(client.packageType, funnelPcts);
    logger.info(`Distribución ajustada por evento (stage=${stage}): TOFU=${distribution.tofu} MOFU=${distribution.mofu} BOFU=${distribution.bofu}`);
  } else {
    distribution = calculatePackageDistribution(client.packageType, compiledStrategy.conversionActive);
  }

  // Aplicar weeklyDistribution personalizada si está definida en la identidad de marca
  const wd = client.brandIdentity && client.brandIdentity.weeklyDistribution;
  if (wd) {
    distribution.reels = wd.reels ?? distribution.reels;
    distribution.posts = wd.posts ?? distribution.posts;
    distribution.carruseles = wd.carruseles ?? distribution.carruseles;
    distribution.total = distribution.reels + distribution.posts + distribution.carruseles;
    logger.info(`Distribución sobreescrita por weeklyDistribution: reels=${distribution.reels} posts=${distribution.posts} carruseles=${distribution.carruseles}`);
  }

  const planning = await Planning.create({
    clientId: client.id,
    year,
    month,
    week,
    packageType: client.packageType,
    distribution,
    pieces: [],
    status: 'draft',
    generatedPrompt: null,
  });

  logger.info(`Planning creado: S${week} ${month}/${year} para ${client.name} (${distribution.total} piezas)`);
  return planning;
}

/**
 * Genera piezas para UN formato (post | carrusel | reel) y las persiste.
 * Puede llamarse tres veces consecutivas sobre el mismo planningId.
 *
 * @param {string} planningId - UUID del Planning existente
 * @param {string} format     - 'post' | 'carrusel' | 'reel'
 */
async function generateFormat(planningId, format, { replace = false } = {}) {
  if (!FORMAT_KEY[format]) throw new Error(`Formato inválido: ${format}`);

  const planning = await Planning.findByPk(planningId, {
    include: [{ model: Client, as: 'client' }],
  });
  if (!planning) throw new Error('Planeación no encontrada');

  const client = planning.client;
  const distribution = planning.distribution;
  const count = distribution[FORMAT_KEY[format]];

  if (!count || count === 0) {
    logger.info(`Sin piezas de tipo "${format}" en este paquete — saltando`);
    return { generated: 0, format };
  }

  // Si replace=true, eliminar las piezas existentes de ese formato
  if (replace) {
    const deleted = await Content.destroy({ where: { planningId, format } });
    logger.info(`Regenerando: ${deleted} ${format}(s) anteriores eliminados`);
  }

  // Offset para numerar las piezas en continuación
  const existingCount = await Content.count({ where: { planningId } });

  // Re-compilar estrategia (rápido, solo consultas a BD)
  const quarter = Math.ceil(planning.month / 3);
  const compiledStrategy = await strategyCompiler.compile(client.id, {
    year: planning.year,
    quarter,
    month: planning.month,
  });

  // Recalcular eventContexts con referencia exacta de la semana del planning
  const refDate = weekReferenceDate(planning.year, planning.month, planning.week);
  compiledStrategy.eventContexts = await getActiveEventContexts(client.id, refDate);

  const systemPrompt = buildSystemPrompt(client.brandIdentity || {});
  const userPrompt = buildFormatPrompt(
    format, count, existingCount, distribution, compiledStrategy, planning.week,
  );

  logger.info(`Generando ${count} ${format}(s) para planning ${planningId}...`);

  const aiResponse = await openaiService.generateJSON(systemPrompt, userPrompt, {
    temperature: 0.75,
    maxTokens: 4096,
  });

  const pieces = aiResponse.pieces;
  if (!Array.isArray(pieces) || pieces.length === 0) {
    throw new Error(`OpenAI no devolvió piezas para el formato "${format}"`);
  }

  const contentRecords = pieces.map((piece, i) => ({
    planningId,
    format: piece.format || format,
    funnelStage: piece.funnelStage,
    title: piece.title,
    hook: piece.hook || null,
    copy: piece.copy,
    cta: piece.cta,
    hashtags: piece.hashtags || [],
    script: piece.script || null,
    carouselSlides: piece.carouselSlides || null,
    visualDirection: piece.visualDirection || null,
    order: existingCount + i + 1,
    status: 'generated',
  }));

  await Content.bulkCreate(contentRecords);
  logger.info(`${contentRecords.length} ${format}(s) guardados para planning ${planningId}`);

  await assignScheduledDates(planningId);

  return { generated: contentRecords.length, format };
}

/**
 * Regenera una pieza de contenido individual incorporando el feedback del cliente.
 * Mantiene el mismo formato, etapa de embudo y voz de marca.
 *
 * @param {string} contentId - UUID del Content a regenerar
 * @param {string} feedback  - Comentario del cliente con las modificaciones solicitadas
 */
async function regenerateContentPiece(contentId, feedback) {
  const content = await Content.findByPk(contentId, {
    include: [{
      model: Planning,
      as: 'planning',
      include: [{ model: Client, as: 'client' }],
    }],
  });
  if (!content) throw new Error(`Contenido no encontrado: ${contentId}`);

  const client = content.planning.client;
  const systemPrompt = buildSystemPrompt(client.brandIdentity || {});

  const userPrompt = [
    'Tienes esta pieza de contenido que el cliente quiere modificar:',
    '',
    `FORMATO: ${content.format}`,
    `ETAPA EMBUDO: ${content.funnelStage}`,
    `TÍTULO ACTUAL: ${content.title}`,
    `HOOK ACTUAL: ${content.hook || 'N/A'}`,
    `COPY ACTUAL:\n${content.copy}`,
    `CTA ACTUAL: ${content.cta}`,
    `HASHTAGS ACTUALES: ${(content.hashtags || []).join(' ')}`,
    content.carouselSlides ? `SLIDES ACTUALES: ${JSON.stringify(content.carouselSlides)}` : '',
    '',
    `FEEDBACK DEL CLIENTE: ${feedback}`,
    '',
    'Regenera la pieza incorporando exactamente el feedback. Mantén el mismo formato, etapa de embudo y voz de marca.',
    'Devuelve ÚNICAMENTE JSON válido con esta estructura:',
    '{"pieces":[{"format":"string","funnelStage":"string","title":"string","hook":"string|null","copy":"string","cta":"string","hashtags":["array"],"script":null,"carouselSlides":null,"visualDirection":"string|null"}]}',
  ].join('\n');

  const aiResponse = await openaiService.generateJSON(systemPrompt, userPrompt, {
    temperature: 0.7,
    maxTokens: 2048,
  });

  const piece = aiResponse.pieces?.[0];
  if (!piece) throw new Error('OpenAI no devolvió contenido regenerado');

  await content.update({
    title:          piece.title          || content.title,
    hook:           piece.hook           ?? content.hook,
    copy:           piece.copy           || content.copy,
    cta:            piece.cta            || content.cta,
    hashtags:       piece.hashtags       || content.hashtags,
    script:         piece.script         ?? content.script,
    carouselSlides: piece.carouselSlides ?? content.carouselSlides,
    visualDirection:piece.visualDirection ?? content.visualDirection,
    approvalStatus: 'pendiente',
    clientComments: null,
    status:         'generated',
  });

  logger.info(`Pieza regenerada con feedback: ${content.title} → ${piece.title}`);
  return content.reload();
}

module.exports = { createPlanning, generateFormat, regenerateContentPiece };
