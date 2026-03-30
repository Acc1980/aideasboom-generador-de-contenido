/**
 * Package Calculator Service
 *
 * Calcula la distribución exacta de contenido por formato y por embudo
 * según el paquete contratado por el cliente.
 *
 * Reglas:
 *  - El total de piezas lo define el paquete (basico=6, premium=11).
 *  - Las cantidades por formato son fijas por paquete.
 *  - La distribución por embudo es 40/40/20 por defecto.
 *  - Si hay conversión activa en el trimestre, cambia a 35/35/30.
 *  - Los decimales se resuelven con un algoritmo de reparto que
 *    garantiza que la suma de piezas por embudo sea exactamente el total.
 */

const { PACKAGES, FUNNEL_DISTRIBUTION } = require('../config/packages');
const logger = require('../config/logger');

/**
 * Distribuye N elementos según porcentajes, resolviendo residuos.
 * Usa el método del mayor residuo (Hare-Niemeyer) para que la suma sea exacta.
 *
 * @param {number} total - Total de elementos a distribuir.
 * @param {object} percentages - { key: porcentaje } donde los porcentajes suman 1.
 * @returns {object} - { key: cantidad_entera }
 */
function distributeByPercentage(total, percentages) {
  const keys = Object.keys(percentages);
  const raw = {};
  const floors = {};
  let floorSum = 0;

  // Calcular valores exactos y sus pisos
  keys.forEach((key) => {
    raw[key] = total * percentages[key];
    floors[key] = Math.floor(raw[key]);
    floorSum += floors[key];
  });

  // Distribuir el residuo a las fracciones más grandes
  let remainder = total - floorSum;
  const sorted = keys.sort((a, b) => (raw[b] - floors[b]) - (raw[a] - floors[a]));

  sorted.forEach((key) => {
    if (remainder > 0) {
      floors[key] += 1;
      remainder -= 1;
    }
  });

  return floors;
}

/**
 * Calcula la distribución completa para un paquete.
 *
 * @param {string} packageType - 'basico' | 'premium'
 * @param {boolean} conversionActiva - Si hay objetivo de conversión activo.
 * @returns {object} Distribución completa:
 *   { total, reels, posts, carruseles, tofu, mofu, bofu }
 */
function calculatePackageDistribution(packageType, conversionActiva = false) {
  const pkg = PACKAGES[packageType];
  if (!pkg) {
    throw new Error(`Paquete desconocido: "${packageType}". Opciones: ${Object.keys(PACKAGES).join(', ')}`);
  }

  const funnelPercentages = conversionActiva
    ? FUNNEL_DISTRIBUTION.withConversion
    : FUNNEL_DISTRIBUTION.default;

  const funnelCounts = distributeByPercentage(pkg.total, funnelPercentages);

  const distribution = {
    total: pkg.total,
    reels: pkg.reels,
    posts: pkg.posts,
    carruseles: pkg.carruseles,
    tofu: funnelCounts.tofu,
    mofu: funnelCounts.mofu,
    bofu: funnelCounts.bofu,
  };

  logger.debug(`Distribución calculada para ${pkg.label}: ${JSON.stringify(distribution)}`);

  return distribution;
}

/**
 * Calcula distribución con porcentajes de embudo personalizados.
 * Usado por el sistema de eventos para ajustar TOFU/MOFU/BOFU
 * según la etapa promocional.
 *
 * @param {string} packageType
 * @param {object} funnelPercentages - { tofu: 0.30, mofu: 0.30, bofu: 0.40 }
 * @returns {object} Distribución completa
 */
function calculateWithCustomFunnel(packageType, funnelPercentages) {
  const pkg = PACKAGES[packageType];
  if (!pkg) {
    throw new Error(`Paquete desconocido: "${packageType}". Opciones: ${Object.keys(PACKAGES).join(', ')}`);
  }

  const funnelCounts = distributeByPercentage(pkg.total, funnelPercentages);

  return {
    total: pkg.total,
    reels: pkg.reels,
    posts: pkg.posts,
    carruseles: pkg.carruseles,
    tofu: funnelCounts.tofu,
    mofu: funnelCounts.mofu,
    bofu: funnelCounts.bofu,
  };
}

module.exports = { calculatePackageDistribution, calculateWithCustomFunnel, distributeByPercentage };
