/**
 * Strategy Compiler Service
 *
 * Compila las estrategias de un cliente (anual + trimestral + mensual)
 * en un único JSON estratégico unificado que sirve como contexto
 * completo para la generación de contenido.
 *
 * La jerarquía es:
 *  1. Identidad de marca (del modelo Client)
 *  2. Estrategia anual → visión general, pilares anuales
 *  3. Estrategia trimestral → foco del trimestre, objetivos
 *  4. Estrategia mensual → temas específicos del mes
 */

const Client = require('../modules/clients/client.model');
const Strategy = require('../modules/strategy/strategy.model');
const { getActiveEventContexts } = require('./eventContext.service');
const logger = require('../config/logger');

/**
 * Compila el contexto estratégico completo de un cliente para un período.
 *
 * @param {string} clientId - UUID del cliente.
 * @param {object} period - { year, quarter?, month? }
 * @returns {object} JSON estratégico unificado.
 */
async function compile(clientId, { year, quarter, month }) {
  const client = await Client.findByPk(clientId);
  if (!client) throw new Error(`Cliente ${clientId} no encontrado`);

  // Buscar las tres capas de estrategia
  const [annual, quarterly, monthly] = await Promise.all([
    Strategy.findOne({
      where: { client_id: clientId, period_type: 'annual', year },
    }),
    quarter
      ? Strategy.findOne({
          where: { client_id: clientId, period_type: 'quarterly', year, quarter },
        })
      : null,
    month
      ? Strategy.findOne({
          where: { client_id: clientId, period_type: 'monthly', year, month },
        })
      : null,
  ]);

  // Determinar si hay conversión activa (viene de la estrategia trimestral)
  const conversionActive = quarterly?.conversionActive || false;

  const compiled = {
    client: {
      id: client.id,
      name: client.name,
      packageType: client.packageType,
      industry: client.industry,
      targetAudience: client.targetAudience,
      logoUrl: client.logoUrl || null,
    },
    brandIdentity: client.brandIdentity || {},
    period: { year, quarter, month },
    conversionActive,
    strategies: {
      annual: annual?.strategyData || null,
      quarterly: quarterly?.strategyData || null,
      monthly: monthly?.strategyData || null,
    },
  };

  // Enriquecer con contexto de eventos (usa día 1 del mes como referencia default)
  const referenceDate = new Date(year, (month || 1) - 1, 1);
  compiled.eventContexts = await getActiveEventContexts(clientId, referenceDate);

  logger.info(
    `Estrategia compilada para ${client.name} – ${year}/${quarter || '-'}/${month || '-'} | conversión: ${conversionActive}${compiled.eventContexts.length > 0 ? ` | eventos: ${compiled.eventContexts.length}` : ''}`,
  );

  return compiled;
}

module.exports = { compile };
