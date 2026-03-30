/**
 * Script de seed – Crea datos de ejemplo para desarrollo.
 *
 * Uso: npm run db:seed
 */

require('dotenv').config();

const { sequelize } = require('./database');
const Client = require('../modules/clients/client.model');
const Strategy = require('../modules/strategy/strategy.model');
const logger = require('./logger');

async function seed() {
  try {
    await sequelize.authenticate();

    // Cliente de ejemplo: Básico
    const clientBasico = await Client.create({
      name: 'Café Aroma',
      slug: 'cafe-aroma',
      packageType: 'basico',
      industry: 'Gastronomía / Cafeterías',
      targetAudience: 'Jóvenes profesionales de 25-40 años que buscan experiencias de café premium',
      brandIdentity: {
        tone: 'Cálido, cercano y aspiracional',
        personality: 'Como un barista experto que te cuenta secretos del café',
        emojisAllowed: true,
        forbiddenWords: ['barato', 'económico', 'descuento', 'gratis'],
        baseHashtags: ['#CaféAroma', '#CaféDe Especialidad', '#CoffeeLover'],
      },
    });

    // Cliente de ejemplo: Premium
    const clientPremium = await Client.create({
      name: 'TechFlow Solutions',
      slug: 'techflow-solutions',
      packageType: 'premium',
      industry: 'Tecnología / SaaS B2B',
      targetAudience: 'CTOs, líderes de IT y tomadores de decisión en empresas medianas de LATAM',
      brandIdentity: {
        tone: 'Profesional, innovador y con autoridad técnica',
        personality: 'El consultor tech que simplifica lo complejo',
        emojisAllowed: false,
        forbiddenWords: ['hackers', 'virus', 'complicado', 'difícil'],
        baseHashtags: ['#TechFlow', '#TransformaciónDigital', '#SaaS'],
      },
    });

    // Estrategia anual para cliente premium
    await Strategy.create({
      clientId: clientPremium.id,
      periodType: 'annual',
      year: 2026,
      strategyData: {
        vision: 'Posicionar a TechFlow como referente de transformación digital en LATAM',
        pillars: [
          'Liderazgo de pensamiento en IA',
          'Casos de éxito verificables',
          'Comunidad tech activa',
        ],
        kpis: ['Leads MQL +40%', 'Engagement rate >4%', 'Brand mentions +60%'],
      },
    });

    // Estrategia trimestral Q1 con conversión activa
    await Strategy.create({
      clientId: clientPremium.id,
      periodType: 'quarterly',
      year: 2026,
      quarter: 1,
      conversionActive: true,
      strategyData: {
        focus: 'Lanzamiento de producto: TechFlow AI Assistant',
        objectives: ['Generar 200 leads calificados', 'Lograr 50 demos agendadas'],
        themes: ['IA en el workplace', 'Productividad con automatización', 'ROI de herramientas AI'],
      },
    });

    logger.info('Seed completado: 2 clientes + 2 estrategias creados');
    process.exit(0);
  } catch (error) {
    logger.error(`Error en seed: ${error.message}`);
    process.exit(1);
  }
}

seed();
