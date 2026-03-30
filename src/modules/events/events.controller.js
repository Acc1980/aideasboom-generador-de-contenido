const Event = require('./event.model');
const Client = require('../clients/client.model');
const { getActiveEventContexts } = require('../../services/eventContext.service');
const logger = require('../../config/logger');

/**
 * POST /api/events
 * Crear un evento para un cliente.
 */
async function createEvent(req, res, next) {
  try {
    const { clientId, name, description, eventType, startDate, endDate,
            schedule, registrationUrl, keyBenefits, targetPrice } = req.body;

    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    const event = await Event.create({
      clientId, name, description, eventType, startDate, endDate,
      schedule, registrationUrl, keyBenefits, targetPrice,
    });

    logger.info(`Evento creado: "${name}" para ${client.name} (${startDate})`);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/client/:clientId
 * Listar eventos activos de un cliente.
 */
async function getEventsByClient(req, res, next) {
  try {
    const events = await Event.findAll({
      where: { clientId: req.params.clientId, active: true },
      order: [['startDate', 'ASC']],
    });
    res.json(events);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/client/:clientId/with-stage
 * Listar eventos activos con su etapa promocional calculada.
 */
async function getActiveEventsWithStage(req, res, next) {
  try {
    const contexts = await getActiveEventContexts(req.params.clientId, new Date());
    res.json(contexts);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/:id
 */
async function getEventById(req, res, next) {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(event);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/events/:id
 */
async function updateEvent(req, res, next) {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    await event.update(req.body);
    res.json(event);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/events/:id
 * Soft delete.
 */
async function deleteEvent(req, res, next) {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    await event.update({ active: false });
    res.json({ ok: true, message: 'Evento desactivado' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent, getEventsByClient, getActiveEventsWithStage,
  getEventById, updateEvent, deleteEvent,
};
