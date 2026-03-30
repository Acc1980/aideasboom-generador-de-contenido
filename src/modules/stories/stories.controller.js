const Planning = require('../planning/planning.model');
const Story = require('./story.model');
const Content = require('../content/content.model');
const { generateStories } = require('../../services/storiesGenerator.service');
const logger = require('../../config/logger');

/**
 * POST /api/stories/generate/:planningId
 * Genera stories diarias para la semana a partir del contenido aprobado.
 * Body: { replace?: boolean, storiesPerDay?: number }
 */
async function generate(req, res, next) {
  try {
    const { planningId } = req.params;
    const { replace = false, storiesPerDay = 5 } = req.body || {};

    const planning = await Planning.findByPk(planningId);
    if (!planning) return res.status(404).json({ error: 'Planeación no encontrada' });

    const result = await generateStories(planningId, { replace, storiesPerDay });
    res.status(201).json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/stories/planning/:planningId
 * Lista todas las stories de una planeación, agrupadas por día.
 */
async function getByPlanning(req, res, next) {
  try {
    const stories = await Story.findAll({
      where: { planning_id: req.params.planningId },
      include: [{ model: Content, as: 'relatedContent', attributes: ['id', 'title', 'format'] }],
      order: [['day_of_week', 'ASC'], ['order', 'ASC']],
    });

    // Agrupar por día
    const grouped = {};
    for (const story of stories) {
      const day = story.dayOfWeek;
      if (!grouped[day]) {
        grouped[day] = { dayOfWeek: day, dayLabel: story.dayLabel, stories: [] };
      }
      grouped[day].stories.push(story);
    }

    res.json({
      total: stories.length,
      days: Object.values(grouped),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/stories/planning/:planningId/day/:dayOfWeek
 * Stories de un día específico (1-7).
 */
async function getByDay(req, res, next) {
  try {
    const { planningId, dayOfWeek } = req.params;
    const stories = await Story.findAll({
      where: { planning_id: planningId, day_of_week: dayOfWeek },
      include: [{ model: Content, as: 'relatedContent', attributes: ['id', 'title', 'format'] }],
      order: [['order', 'ASC']],
    });
    res.json(stories);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/stories/:id
 * Actualizar una story individual.
 */
async function updateStory(req, res, next) {
  try {
    const story = await Story.findByPk(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story no encontrada' });
    await story.update(req.body);
    res.json(story);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/stories/:planningId/generate-images
 * Genera imágenes PNG para stories no grabadas y las sube a Drive.
 */
async function generateImages(req, res, next) {
  try {
    const { planningId } = req.params;
    const uploadToDrive = req.body?.uploadToDrive !== false;

    const { generateStoryImages } = require('../../services/imageGenerator.service');
    logger.info(`Generando imágenes de stories para planning ${planningId}...`);
    const { generatedFiles } = await generateStoryImages(planningId);

    let folderUrl = null;
    if (uploadToDrive && generatedFiles.length > 0) {
      try {
        const { exportImagesToDrive } = require('../../services/googleDrive.service');
        const driveResult = await exportImagesToDrive(planningId, generatedFiles);
        folderUrl = driveResult.folderUrl;

        for (const file of generatedFiles) {
          const driveUrl = driveResult.fileUrlMap?.[file.filePath];
          if (driveUrl && file.id) {
            await Story.update({ imageUrl: driveUrl }, { where: { id: file.id } });
          }
        }
      } catch (driveErr) {
        logger.warn('Drive upload de stories falló (imágenes locales OK): ' + driveErr.message);
      }
    }

    res.json({ ok: true, count: generatedFiles.length, folderUrl });
  } catch (error) {
    next(error);
  }
}

module.exports = { generate, getByPlanning, getByDay, updateStory, generateImages };
