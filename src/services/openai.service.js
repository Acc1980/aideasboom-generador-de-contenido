/**
 * OpenAI Service – Capa de abstracción sobre la API de OpenAI.
 *
 * Centraliza la configuración del cliente y expone un método genérico
 * para completions con JSON mode, que es lo que usan todos los servicios
 * de generación de contenido.
 */

const OpenAI = require('openai');
const logger = require('../config/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 2 minutos máximo por request
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

/**
 * Genera una respuesta estructurada en JSON a partir de un prompt.
 *
 * @param {string} systemPrompt - Instrucciones del sistema (rol, reglas).
 * @param {string} userPrompt - El prompt específico del usuario/servicio.
 * @param {object} options - Opciones adicionales (model, temperature, maxTokens).
 * @returns {object} JSON parseado de la respuesta.
 */
async function generateJSON(systemPrompt, userPrompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 4096,
  } = options;

  logger.debug(`OpenAI request → model: ${model}, temperature: ${temperature}`);

  const response = await openai.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.choices[0].message.content;

  logger.debug(`OpenAI tokens usados: ${response.usage.total_tokens}`);

  return JSON.parse(content);
}

/**
 * Genera texto libre (sin JSON mode).
 * Útil para generar copys individuales o descripciones.
 */
async function generateText(systemPrompt, userPrompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.8,
    maxTokens = 2048,
  } = options;

  const response = await openai.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  return response.choices[0].message.content;
}

module.exports = { generateJSON, generateText };
