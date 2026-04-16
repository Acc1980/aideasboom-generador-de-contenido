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

async function approveContent(req, res, next) {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });
    if (content.format !== 'reel') return res.status(400).json({ error: 'Solo se pueden aprobar reels para generación de video' });
    await content.update({ approvalStatus: 'aprobado' });
    res.json({ ok: true, id: content.id, approvalStatus: 'aprobado' });
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

// Aprueba el diseño del video y lo encola para publicación
async function approveVideo(req, res, next) {
  try {
    const Planning = require('../planning/planning.model');
    const Client = require('../clients/client.model');
    const { sequelize } = require('../../config/database');

    const content = await Content.findByPk(req.params.id, {
      include: [{ model: Planning, as: 'planning', include: [{ model: Client, as: 'client' }] }],
    });
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });
    if (content.format !== 'reel') return res.status(400).json({ error: 'Solo aplica para reels' });
    if (!content.videoUrl) return res.status(400).json({ error: 'El reel aún no tiene video generado' });
    if (content.status === 'approved' || content.status === 'published') {
      return res.status(400).json({ error: 'Este reel ya fue aprobado para publicación' });
    }

    const chatId = content.planning?.client?.brandIdentity?.telegramChatId || null;

    await sequelize.query(
      `INSERT INTO content_queue (content_id, format, chat_id, status, approved_at, created_at, updated_at)
       VALUES (:contentId, :format, :chatId, 'pending', NOW(), NOW(), NOW())
       ON CONFLICT (content_id) DO NOTHING`,
      { replacements: { contentId: content.id, format: content.format, chatId } },
    );

    await content.update({ status: 'approved' });
    logger.info(`Diseño aprobado y encolado para publicación: ${content.id}`);
    res.json({ ok: true, id: content.id, status: 'approved' });
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

    await content.update({ videoUrl, status: 'reviewed' });
    logger.info(`Video URL guardada en contenido ${content.id} — pendiente aprobación de diseño`);
    res.json({ ok: true, id: content.id, videoUrl: content.videoUrl });
  } catch (error) {
    next(error);
  }
}

// Envía un reel aprobado a fal.ai para generar el video
async function generateVideo(req, res, next) {
  try {
    const { submitVideo } = require('../../services/fal.service');
    const content = await Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });
    if (content.format !== 'reel') return res.status(400).json({ error: 'Solo aplica para reels' });
    if (content.approvalStatus !== 'aprobado') return res.status(400).json({ error: 'El reel debe estar aprobado primero' });

    const prompt = content.script?.prompt || content.visualDirection || content.title;
    const requestId = await submitVideo(prompt, content.script?.duration || 5);
    await content.update({ falRequestId: requestId });

    logger.info(`Video enviado a fal.ai para "${content.title}" → ${requestId}`);
    res.json({ ok: true, requestId });
  } catch (error) {
    next(error);
  }
}

// Regenera una pieza: nueva idea si está en no_va, o con feedback si está en cambios
async function regenerateContent(req, res, next) {
  try {
    const { regenerateContentPiece, generateNewPieceForSlot } = require('../../services/planningGenerator.service');
    const content = await Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ error: 'Contenido no encontrado' });

    let updated;
    if (content.approvalStatus === 'no_va') {
      updated = await generateNewPieceForSlot(req.params.id);
    } else {
      const feedback = req.body.feedback || content.clientComments;
      if (!feedback) return res.status(400).json({ error: 'Se requiere feedback para regenerar' });
      updated = await regenerateContentPiece(req.params.id, feedback);
    }

    logger.info(`Contenido ${content.id} regenerado (modo: ${content.approvalStatus === 'no_va' ? 'nueva pieza' : 'con feedback'})`);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getContentsByPlanning,
  getContentById,
  updateContent,
  updateContentStatus,
  approveContent,
  approveVideo,
  getPendingVideo,
  updateVideoUrl,
  generateVideo,
  regenerateContent,
};
