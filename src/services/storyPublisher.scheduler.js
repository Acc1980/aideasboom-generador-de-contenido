/**
 * Story Publisher Scheduler
 *
 * Corre en background al arrancar el servidor.
 * Cada día a la hora configurada (STORY_PUBLISH_HOUR, default 9:00 AM UTC)
 * busca stories con scheduledDate = hoy, aprobadas, con imagen y sin publicar,
 * y las publica automáticamente en Instagram Stories.
 *
 * Omite stories isRecorded=true (requieren video grabado por el coach).
 */

const logger = require('../config/logger');

const STORY_PUBLISH_HOUR   = parseInt(process.env.STORY_PUBLISH_HOUR   || '14', 10); // 9am Colombia = 14 UTC
const STORY_PUBLISH_MINUTE = parseInt(process.env.STORY_PUBLISH_MINUTE || '0',  10);

function todayColombia() {
  const colombia = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return colombia.toISOString().slice(0, 10);
}

function msUntilNextStoryPublish() {
  const now  = new Date();
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    STORY_PUBLISH_HOUR,
    STORY_PUBLISH_MINUTE,
    0,
  ));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next - now;
}

async function runDailyStoryPublish() {
  const { Op } = require('sequelize');
  const Story = require('../modules/stories/story.model');
  const { publishStory } = require('./meta.service');

  const today = todayColombia();
  logger.info(`[story-scheduler] Ejecutando publicación de stories del ${today}...`);

  let stories;
  try {
    stories = await Story.findAll({
      where: {
        scheduledDate: today,
        approvalStatus: 'aprobado',
        isRecorded: false,
        imageUrl: { [Op.ne]: null },
        status: { [Op.notIn]: ['published'] },
      },
      order: [['order', 'ASC']],
    });
  } catch (err) {
    logger.error(`[story-scheduler] Error consultando stories: ${err.message}`);
    return;
  }

  if (!stories.length) {
    logger.info(`[story-scheduler] Sin stories programadas para hoy (${today})`);
    return;
  }

  logger.info(`[story-scheduler] ${stories.length} story(ies) a publicar hoy`);

  for (const story of stories) {
    try {
      logger.info(`[story-scheduler] Publicando story "${story.storyType}" (día ${story.dayOfWeek}, orden ${story.order})...`);
      const mediaId = await publishStory(story);
      await story.update({ status: 'published' });
      logger.info(`[story-scheduler] ✓ Story publicada → media_id: ${mediaId}`);

      // Pausa de 3s entre stories para no saturar la API de Meta
      await new Promise((r) => setTimeout(r, 3000));
    } catch (err) {
      logger.error(`[story-scheduler] Error publicando story ${story.id}: ${err.message}`);
    }
  }

  logger.info(`[story-scheduler] Publicación de stories completada`);
}

function startStoryPublisherScheduler() {
  const delay = msUntilNextStoryPublish();
  const hh = String(STORY_PUBLISH_HOUR).padStart(2, '0');
  const mm = String(STORY_PUBLISH_MINUTE).padStart(2, '0');
  logger.info(`[story-scheduler] Próxima publicación de stories: ${new Date(Date.now() + delay).toISOString()} (${hh}:${mm} UTC)`);

  setTimeout(function tick() {
    runDailyStoryPublish().catch((err) => logger.error(`[story-scheduler] Fallo crítico: ${err.message}`));
    setTimeout(tick, 24 * 60 * 60 * 1000);
  }, delay);
}

module.exports = { startStoryPublisherScheduler, runDailyStoryPublish };
