/**
 * Libreto Service
 *
 * Genera el libreto estructurado por escenas para un reel usando Claude/GPT.
 * El libreto incluye: tono, tipo de música, texto sobrepuesto, voz en off
 * y descripción visual por escena.
 */

const openaiService = require('./claude.service');
const logger = require('../config/logger');

/**
 * Genera el libreto de un reel.
 * @param {object} content - El objeto Content del reel
 * @param {object} client  - El objeto Client con brandIdentity
 * @returns {object} libreto estructurado
 */
async function generateLibreto(content, client) {
  const brand = client.brandIdentity || {};

  const systemPrompt = [
    `Eres un experto en guiones virales para reels de Instagram dirigidos a deportistas jóvenes (16-30 años) que quieren mejorar su rendimiento mental.`,
    ``,
    `MARCA: ${client.name}`,
    `DESCRIPCIÓN: ${brand.description || 'Entrenamiento mental y mentalidad ganadora para deportistas'}`,
    `VOZ: ${brand.voiceTone || 'Directa, cercana, sin tecnicismos — habla como un compañero de equipo, no como un conferencista'}`,
    `PALABRAS PROHIBIDAS: psicología, psicólogo, terapia, diagnóstico, trauma`,
    ``,
    `═══════════════════════════════`,
    `REGLA #1 — EL HOOK (escena 1) ES LO MÁS IMPORTANTE`,
    `═══════════════════════════════`,
    `La primera escena decide si el algoritmo distribuye el video o lo entierra.`,
    `El hook debe lograr que el deportista piense "eso me pasa a mí" en los primeros 2 segundos.`,
    ``,
    `Tipos de hook que funcionan para deportistas jóvenes:`,
    `- Pregunta que duele: "¿Por qué te bloqueas justo cuando más importa?"`,
    `- Situación específica identificable: "Entrenas perfecto toda la semana y el día del partido desapareces"`,
    `- Contradicción que genera curiosidad: "El problema no es tu físico. Es esto."`,
    `- Dato o afirmación que sorprende: "El 80% de los errores en competencia no son técnicos"`,
    ``,
    `PROHIBIDO en el hook:`,
    `- Frases motivacionales genéricas ("tú puedes", "sé el mejor", "trabaja duro")`,
    `- Clichés de coaching ("potencial ilimitado", "supera tus límites")`,
    `- Mencionar el producto, programa o precio`,
    ``,
    `═══════════════════════════════`,
    `REGLA #2 — ESTRUCTURA DE LAS ESCENAS`,
    `═══════════════════════════════`,
    `- Escena 1 (hook): ATRAPA — el deportista se identifica, para de hacer scroll`,
    `- Escena 2-3 (desarrollo): ENGANCHA — explica el problema o la solución de forma nueva`,
    `- Escena final (CTA): INVITA — acción concreta y sin presión`,
    ``,
    `REGLAS ADICIONALES:`,
    `- Voz masculina en off, tono directo y cercano`,
    `- Entre 3 y 4 escenas, cada una de 3 a 5 segundos`,
    `- El texto sobrepuesto es la frase más poderosa de la escena (máximo 5 palabras)`,
    `- La voz en off debe caber exactamente en la duración de la escena:`,
    `  · Escena de 3s = máximo 8 palabras en voz_off`,
    `  · Escena de 4s = máximo 11 palabras en voz_off`,
    `  · Escena de 5s = máximo 13 palabras en voz_off`,
    `- Frases cortas, directas, con pausa natural al final`,
    `- NUNCA menciones URLs en la voz_off. Si necesitas dirigir al público, usa SIEMPRE la frase "link en mi bio" — jamás digas un dominio web.`,
    `- El prompt visual es en inglés, específico para Kling AI.`,
    `- OBLIGATORIO en cada prompt_visual: atletas latinoamericanos/hispanos, piel morena o trigueña, rasgos latinos — NUNCA asiáticos, caucásicos ni europeos.`,
    `- Alterna entre hombres y mujeres deportistas en las escenas — no uses solo hombres. Al menos 1-2 escenas deben mostrar mujeres deportistas latinas.`,
    `- Varía los escenarios deportivos: estadios llenos, canchas bajo reflectores, pistas de atletismo, gimnasios profesionales, vestuarios, entrenamientos al aire libre, momentos previos al partido.`,
    `- SIEMPRE incluir en el prompt_visual: "Latino/Latina athlete, Hispanic, brown skin, Latin American features, realistic, cinematic lighting, sports environment, NOT Asian, NOT European" + descripción específica de la escena.`,
    `- PROHIBIDO en prompt_visual: logos, marcas, textos con nombres de empresa, gráficos corporativos, iconos de marca. El logo de la marca se agrega en post-producción.`,
    `- La escena final (CTA) debe mostrar al atleta en acción o reflexión, NUNCA un logo o texto de marca.`,
    `- Detecta el tono automáticamente: motivacional, reflexivo o narrativo`,
    `- Elige la música según el tono: epica (motivacional), suave (reflexivo), orquestal (narrativo)`,
    ``,
    `Devuelve ÚNICAMENTE JSON válido con esta estructura:`,
    `{`,
    `  "tono": "motivacional|reflexivo|narrativo",`,
    `  "musica": "epica|suave|orquestal",`,
    `  "duracion_total": number,`,
    `  "escenas": [`,
    `    {`,
    `      "numero": 1,`,
    `      "duracion": 4,`,
    `      "texto_sobrepuesto": "Texto corto de impacto",`,
    `      "voz_off": "Texto completo que dice la voz en off en esta escena",`,
    `      "prompt_visual": "Descripción visual en inglés para generar el clip con IA"`,
    `    }`,
    `  ]`,
    `}`,
  ].join('\n');

  const userPrompt = [
    `Genera el libreto para este reel:`,
    ``,
    `TÍTULO: ${content.title}`,
    `HOOK: ${content.hook || ''}`,
    `COPY: ${content.copy}`,
    `CTA: ${content.cta}`,
    `DIRECCIÓN VISUAL: ${content.visualDirection || ''}`,
    `ETAPA DE EMBUDO: ${content.funnelStage}`,
  ].join('\n');

  logger.info(`Generando libreto para reel "${content.title}"...`);

  const result = await openaiService.generateJSON(systemPrompt, userPrompt, {
    temperature: 0.8,
    maxTokens: 2000,
  });

  // Validar estructura mínima
  if (!result.escenas || !Array.isArray(result.escenas) || result.escenas.length === 0) {
    throw new Error('El libreto generado no tiene escenas válidas');
  }

  // Calcular duración total si no viene
  if (!result.duracion_total) {
    result.duracion_total = result.escenas.reduce((sum, e) => sum + (e.duracion || 4), 0);
  }

  logger.info(`Libreto generado: ${result.escenas.length} escenas, ${result.duracion_total}s, tono: ${result.tono}`);
  return result;
}

module.exports = { generateLibreto };
