/**
 * Definición canónica de los paquetes de contenido.
 *
 * Cada paquete especifica las cantidades exactas por formato.
 * Esta es la fuente de verdad que usa packageCalculator.service.js
 * para derivar las distribuciones por embudo.
 */

const PACKAGES = {
  basico: {
    label: 'Básico',
    reels: 2,
    posts: 2,
    carruseles: 2,
    total: 6,
  },
  premium: {
    label: 'Premium',
    reels: 3,
    posts: 4,
    carruseles: 4,
    total: 11,
  },
  personalizado_7: {
    label: 'Personalizado (7)',
    reels: 2,
    posts: 2,
    carruseles: 3,
    total: 7,
  },
  reels_5: {
    label: '5 Reels por semana',
    reels: 5,
    posts: 1,
    carruseles: 2,
    total: 8,
  },
};

// Distribución estándar del embudo de marketing
const FUNNEL_DISTRIBUTION = {
  default: { tofu: 0.40, mofu: 0.40, bofu: 0.20 },
  // Cuando hay objetivo de conversión activo, BOFU sube a 30%
  withConversion: { tofu: 0.35, mofu: 0.35, bofu: 0.30 },
};

module.exports = { PACKAGES, FUNNEL_DISTRIBUTION };
