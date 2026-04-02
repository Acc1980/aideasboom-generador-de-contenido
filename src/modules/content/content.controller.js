/**
 * Controller de Contenido.
 * Gestiona las piezas de contenido generadas dentro de una planeación.
 */

const Content = require('./content.model');
const logger = require('../../config/logger');

async function getContentsByPlanning(req, res, next) {
  try {
    const contents = await Content.findAll({
      where: { planning_id: req.params.planningId },
      order: [['order', 'ASC']],
    });
    res.json(contents);
  } catch (error) {
    next(error);
  }
}

async function getContentById(req, res, next) {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });
    res.json(content);
  } catch (error) {
    next(error);
  }
}

async function updateContent(req, res, next) {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });

    await content.update(req.body);
    logger.info(`Contenido ${content.id} actualizado (${content.format})`);
    res.json(content);
  } catch (error) {
    next(error);
  }
}

async function updateContentStatus(req, res, next) {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });

    await content.update({ status: req.body.status });
    res.json(content);
  } catch (error) {
    next(error);
  }
}

// Devuelve reels aprobados sin video generado aún (para n8n/Veo 3.1)
async function getPendingVideo(_req, res, next) {
  try {
    const { Op } = require('sequelize');
    const contents = await Content.findAll({
      where: {
        format: 'reel',
        approvalStatus: 'aprobado',
        videoUrl: { [Op.is]: null },
      },
      order: [['order', 'ASC']],
    });
    res.json(contents);
  } catch (error) {
    next(error);
  }
}

// Actualiza la URL del video generado por Veo 3.1
async function updateVideoUrl(req, res, next) {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });

    const { videoUrl } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'videoUrl es requerido' });

    await content.update({ videoUrl, status: 'approved' });
    logger.info(`Video URL guardada en contenido ${content.id}`);
    res.json({ ok: true, id: content.id, videoUrl: content.videoUrl });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getContentsByPlanning,
  getContentById,
  updateContent,
  updateContentStatus,
  getPendingVideo,
  updateVideoUrl,
};
