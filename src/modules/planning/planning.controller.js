const Client = require('../clients/client.model');
const Planning = require('./planning.model');
const planningGenerator = require('../../services/planningGenerator.service');
const { generateImages: genImages } = require('../../services/imageGenerator.service');
const { exportImagesToDrive } = require('../../services/googleDrive.service');
const logger = require('../../config/logger');

/**
 * POST /api/planning/generate
 * Crea el registro Planning (sin contenido aún).
 * El frontend llama después a generate-format por cada formato.
 * Body: { clientId, year, month, week }
 */
async function generatePlanning(req, res, next) {
  try {
    const { clientId, year, month, week = 1 } = req.body;

    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (!client.active) return res.status(400).json({ error: 'Cliente inactivo' });
    if (week < 1 || week > 4) return res.status(400).json({ error: 'La semana debe ser 1, 2, 3 o 4' });

    const existing = await Planning.findOne({
      where: { client_id: clientId, year, month, week },
    });
    if (existing) {
      return res.status(409).json({
        error: `Ya existe una planeación para la semana ${week} de ese mes`,
        planningId: existing.id,
      });
    }

    logger.info(`Creando planeación S${week} · ${month}/${year} para ${client.name}...`);
    const planning = await planningGenerator.createPlanning(client, year, month, week);

    res.status(201).json({
      planningId: planning.id,
      distribution: planning.distribution,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/planning/:id/generate-format
 * Genera piezas para UN formato y las agrega (o reemplaza) en el planning.
 * Body: { format: 'post' | 'carrusel' | 'reel', replace?: boolean }
 * replace=true elimina las piezas existentes de ese formato antes de generar.
 */
async function generateFormat(req, res, next) {
  try {
    const { id } = req.params;
    const { format, replace = false } = req.body;

    if (!['post', 'carrusel', 'reel'].includes(format)) {
      return res.status(400).json({ error: 'Formato inválido. Opciones: post, carrusel, reel' });
    }

    const result = await planningGenerator.generateFormat(id, format, { replace });
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getPlanningsByClient(req, res, next) {
  try {
    const plannings = await Planning.findAll({
      where: { client_id: req.params.clientId },
      order: [['year', 'DESC'], ['month', 'DESC'], ['week', 'ASC']],
    });
    res.json(plannings);
  } catch (error) {
    next(error);
  }
}

async function getPlanningById(req, res, next) {
  try {
    const planning = await Planning.findByPk(req.params.id, {
      include: [{ association: 'client' }],
    });
    if (!planning) return res.status(404).json({ error: 'Planeación no encontrada' });
    res.json(planning);
  } catch (error) {
    next(error);
  }
}

async function updatePlanningStatus(req, res, next) {
  try {
    const planning = await Planning.findByPk(req.params.id);
    if (!planning) return res.status(404).json({ error: 'Planeación no encontrada' });
    await planning.update({ status: req.body.status });
    res.json(planning);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/planning/:id/generate-images
 * Genera imágenes PNG de todas las piezas de la planeación y las sube a Drive.
 * Body: { uploadToDrive?: boolean }  (default true)
 */
async function generateImages(req, res, next) {
  try {
    const { id } = req.params;
    const uploadToDrive = req.body?.uploadToDrive !== false;

    logger.info(`Generando imágenes para planning ${id}...`);
    const { generatedFiles } = await genImages(id);

    let folderUrl = null;
    if (uploadToDrive && generatedFiles.length > 0) {
      try {
        const driveResult = await exportImagesToDrive(id, generatedFiles);
        folderUrl = driveResult.folderUrl;
        const Content = require('../content/content.model');

        // Agrupar slides de carrusel por content ID
        const carouselGroups = {};
        for (const file of generatedFiles) {
          if (!file.id || file.format === 'reel') continue;
          const driveUrl = driveResult.fileUrlMap?.[file.filePath];
          if (!driveUrl) continue;

          if (file.format === 'post') {
            await Content.update({ imageUrl: driveUrl }, { where: { id: file.id } });
          } else if (file.format === 'carrusel') {
            if (!carouselGroups[file.id]) carouselGroups[file.id] = {};
            carouselGroups[file.id][file.slideIndex] = driveUrl;
          }
        }

        // Guardar driveUrl en cada slide del JSON carouselSlides
        for (const [contentId, slideUrls] of Object.entries(carouselGroups)) {
          const content = await Content.findByPk(contentId);
          if (!content) continue;
          if (slideUrls[1]) await content.update({ imageUrl: slideUrls[1] });
          if (content.carouselSlides?.slides) {
            const updated = { ...content.carouselSlides };
            updated.slides = updated.slides.map(s => ({
              ...s,
              driveUrl: slideUrls[s.slide] || s.driveUrl || null,
            }));
            await content.update({ carouselSlides: updated });
          }
        }
      } catch (driveErr) {
        logger.warn('Drive upload falló (imágenes locales OK): ' + driveErr.message);
      }
    }

    res.json({
      ok: true,
      count: generatedFiles.length,
      folderUrl,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/planning/:id/produce-all
 * Verifica que todo esté aprobado y lanza producción:
 * - Posts/carruseles: genera imágenes
 * - Reels: envía a fal.ai para video
 * Responde inmediatamente; la producción corre en background.
 */
async function produceAll(req, res, next) {
  try {
    const { id } = req.params;
    const Content = require('../content/content.model');
    const { submitVideo } = require('../../services/fal.service');
    const { Op } = require('sequelize');

    const pieces = await Content.findAll({ where: { planningId: id }, order: [['order', 'ASC']] });

    const notApproved = pieces.filter(p => p.approvalStatus !== 'aprobado');
    if (notApproved.length > 0) {
      return res.status(400).json({
        error: `Quedan ${notApproved.length} piezas sin aprobar. Aprueba todo antes de producir.`,
        pending: notApproved.map(p => ({ id: p.id, format: p.format, title: p.title })),
      });
    }

    // Imágenes: lanzar en background
    genImages(id).catch(e => logger.warn('Error generando imágenes: ' + e.message));

    // Videos: enviar reels a fal.ai
    const reels = pieces.filter(p => p.format === 'reel' && !p.videoUrl && !p.falRequestId);
    let videosSent = 0;
    for (const reel of reels) {
      try {
        const prompt = reel.script?.prompt || reel.visualDirection || reel.title;
        const requestId = await submitVideo(prompt, reel.script?.duration || 5);
        await reel.update({ falRequestId: requestId });
        videosSent++;
      } catch (e) {
        logger.warn(`No se pudo enviar reel "${reel.title}" a fal.ai: ${e.message}`);
      }
    }

    logger.info(`Producción iniciada para planning ${id}: imágenes en background, ${videosSent} reels a fal.ai`);
    res.json({ ok: true, videosSent, message: 'Producción iniciada. Los videos estarán listos en ~2-3 minutos.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generatePlanning,
  generateFormat,
  generateImages,
  getPlanningsByClient,
  getPlanningById,
  updatePlanningStatus,
  produceAll,
};
