/**
 * Controller de Estrategia.
 *
 * Permite registrar estrategias por período (anual, trimestral, mensual)
 * y compilarlas en un JSON unificado vía strategyCompiler.
 */

const Strategy = require('./strategy.model');
const Client = require('../clients/client.model');
const strategyCompiler = require('../../services/strategyCompiler.service');
const logger = require('../../config/logger');

async function createStrategy(req, res, next) {
  try {
    const { clientId } = req.params;

    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    const strategy = await Strategy.create({ ...req.body, clientId });
    logger.info(`Estrategia ${strategy.periodType} creada para ${client.name}`);
    res.status(201).json(strategy);
  } catch (error) {
    next(error);
  }
}

async function getStrategiesByClient(req, res, next) {
  try {
    const strategies = await Strategy.findAll({
      where: { client_id: req.params.clientId },
      order: [['year', 'DESC'], ['quarter', 'DESC'], ['month', 'DESC']],
    });
    res.json(strategies);
  } catch (error) {
    next(error);
  }
}

/**
 * Compila todas las estrategias de un cliente en un JSON unificado.
 * Este JSON será la entrada principal para la generación de planeación.
 */
async function compileStrategy(req, res, next) {
  try {
    const { clientId } = req.params;
    const { year, quarter, month } = req.query;

    const compiled = await strategyCompiler.compile(clientId, {
      year: parseInt(year, 10),
      quarter: quarter ? parseInt(quarter, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
    });

    res.json(compiled);
  } catch (error) {
    next(error);
  }
}

async function updateStrategy(req, res, next) {
  try {
    const strategy = await Strategy.findByPk(req.params.id);
    if (!strategy) return res.status(404).json({ error: 'Estrategia no encontrada' });

    await strategy.update(req.body);
    res.json(strategy);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createStrategy,
  getStrategiesByClient,
  compileStrategy,
  updateStrategy,
};
