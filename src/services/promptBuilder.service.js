/**
 * Prompt Builder Service
 *
 * Construye prompts separados por formato (post / carrusel / reel).
 * Cada formato recibe instrucciones de copy específicas que exigen
 * profundidad, reflexión y longitud mínima.
 */

const { buildEventPromptInstructions, buildEventStoriesInstructions } = require('./eventContext.service');

function buildSystemPrompt(brandIdentity) {
  const {
    tone = 'profesional y cercano',
    personality = '',
    emojisAllowed = false,
    forbiddenWords = [],
    baseHashtags = [],
  } = brandIdentity;

  let prompt = `Eres un estratega de contenido digital senior para una agencia de marketing.
Tu trabajo es generar piezas de contenido alineadas con la estrategia de marca del cliente.

IDIOMA Y GRAMÁTICA — REGLAS INQUEBRANTABLES:
- TODO el contenido DEBE estar escrito en español latinoamericano correcto.
- Conjugación verbal impecable: revisa cada verbo. Si usas "tú", conjuga en segunda persona singular (tienes, puedes, sientes — NUNCA "tienes que" seguido de infinitivo mal conjugado).
- Concordancia de género y número en CADA frase (artículos, adjetivos, sustantivos deben coincidir).
- Tiempo verbal consistente dentro de cada pieza: si empiezas en presente, mantén el presente. No saltes entre pasado y presente sin razón narrativa.
- Evita anglicismos innecesarios (no "mindset" si puedes decir "mentalidad", no "awareness" si puedes decir "consciencia").
- Puntuación correcta: signos de apertura (¿ ¡) SIEMPRE. Comas en subordinadas. Punto final en cada párrafo.
- Coherencia lógica: cada frase debe conectar con la anterior. Usa conectores naturales (sin embargo, por eso, porque, además, en cambio).
- ANTES de entregar, relee mentalmente cada pieza completa y verifica que fluya sin tropiezos gramaticales ni frases inconclusas.

REGLAS OBLIGATORIAS:
1. Tono de comunicación: ${tone}`;

  if (personality) {
    prompt += `\n2. Personalidad de marca: ${personality}`;
  }

  prompt += `\n3. Emojis: ${emojisAllowed ? 'PERMITIDOS, usar con moderación' : 'PROHIBIDOS, no usar ninguno'}`;

  if (forbiddenWords.length > 0) {
    prompt += `\n4. PALABRAS PROHIBIDAS (nunca usar): ${forbiddenWords.join(', ')}`;
  }

  if (baseHashtags.length > 0) {
    prompt += `\n5. Hashtags base a incluir siempre: ${baseHashtags.join(' ')}`;
  }

  prompt += `\n6. Hashtags: máximo 5 por pieza (recomendación Instagram 2024). Escoge los más relevantes para cada pieza específica.`;

  prompt += `

DIRECTRICES DE CTA — CATEGORÍAS Y EJEMPLOS:

💛 CTA de conexión (generar conversación y comunidad) — ideal para TOFU y MOFU:
  "¿Te resuena?", "Si esto tocó algo en ti, léelo otra vez.", "¿Te ha pasado? Cuéntanos.",
  "Te leo.", "¿Qué parte fue para ti?", "Si te viste en estas palabras, comenta 💛"

📩 CTA para DM (conversión suave) — ideal para MOFU:
  "¿Quieres profundizar? Escríbeme PODER.", "¿Sientes que es momento? Envíame un mensaje.",
  "Esto habló de ti, podemos mirarlo juntas.", "Escríbeme 'PODER' y te cuento.",
  "Si estás lista para dejar de reaccionar y empezar a elegir, escríbeme.",
  "¿Prefieres un espacio personal? Escríbeme."

✨ CTA para el entrenamiento (conversión directa) — ideal para BOFU:
  "Reconociendo mi poder es para mujeres que están listas.",
  "Si este espacio es para ti, escríbeme.", "Las inscripciones están abiertas.",
  "Este proceso no es para todas. Es para quien está lista."

🧘 CTA de pausa (reflexión) — ideal para TOFU:
  "Quédate un momento con esto.", "Respira y vuelve a leerte.", "No respondas aún. Siente."

REGLAS DE CTA:
- Usa estos ejemplos como INSPIRACIÓN, no los copies textualmente — genera variaciones propias con el mismo tono.
- Cada pieza debe tener UN solo CTA claro, alineado con su etapa de embudo.
- El CTA debe sentirse como una invitación natural, no como una instrucción forzada.
- Varía las categorías entre las piezas para no repetir el mismo tipo de CTA.

FILOSOFÍA DE COPY:
El copy no es un resumen del tema — es una experiencia de lectura que mueve algo en quien la recibe.
- Escribe en segunda persona ("tú") para crear conexión directa con el lector.
- Usa preguntas abiertas que provoquen introspección: "¿Cuándo fue la última vez que...?", "¿Qué pasaría si...?", "¿Desde qué lugar estás tomando esa decisión?"
- Evita afirmaciones vacías y frases de autoayuda genérica. Cada frase debe aportar peso emocional o conceptual.
- Si la personalidad de marca incluye conceptos de transformación, autoconocimiento, coaching o crecimiento personal: el copy debe generar una pequeña crisis de conciencia antes de ofrecer una perspectiva nueva. Primero incomoda, luego ilumina.

FORMATO DE RESPUESTA:
Responde SIEMPRE en JSON válido con la estructura indicada en el prompt del usuario. Sin texto antes ni después del JSON.`;

  return prompt;
}

/**
 * Construye el prompt para UN solo formato (post, carrusel o reel).
 *
 * @param {string} format        - 'post' | 'carrusel' | 'reel'
 * @param {number} count         - Cantidad de piezas a generar
 * @param {number} orderOffset   - Número de piezas ya existentes (para numerar)
 * @param {object} distribution  - { total, reels, posts, carruseles, tofu, mofu, bofu }
 * @param {object} compiledStrategy - Estrategia compilada del cliente
 * @param {number} week          - Semana del mes (1-4)
 */
function buildFormatPrompt(format, count, orderOffset, distribution, compiledStrategy, week) {
  const { client, strategies, period } = compiledStrategy;

  let prompt = `Genera EXACTAMENTE ${count} ${format === 'post' ? 'posts estáticos' : format === 'carrusel' ? 'carruseles' : 'reels'} para ${client.name} (${client.industry || 'sector no especificado'}).

PERÍODO: Semana ${week} de ${period.month}/${period.year}
CONTEXTO DE LA SEMANA: ${distribution.total} piezas totales — ${distribution.posts} posts · ${distribution.carruseles} carruseles · ${distribution.reels} reels
DISTRIBUCIÓN DE EMBUDO: ${distribution.tofu} TOFU · ${distribution.mofu} MOFU · ${distribution.bofu} BOFU

COHERENCIA TEMÁTICA SEMANAL:
- Las piezas de la semana deben seguir un HILO NARRATIVO coherente: elige 1-2 temas centrales y desarrolla las piezas alrededor de ellos.
- NO saltes de tema en tema desconectado. Si una pieza habla de "soltar el control", las siguientes deben complementar esa línea (profundizar, dar otra perspectiva, ofrecer herramienta práctica).
- Piensa en la semana como una mini-serie de contenido donde cada pieza aporta una capa nueva al mismo mensaje central.`;

  if (client.targetAudience) {
    prompt += `\nAUDIENCIA OBJETIVO: ${client.targetAudience}`;
  }

  if (strategies.annual) {
    prompt += `\n\n═══ ESTRATEGIA ANUAL ═══\n${JSON.stringify(strategies.annual, null, 2)}`;
  }
  if (strategies.quarterly) {
    prompt += `\n\n═══ ESTRATEGIA TRIMESTRAL ═══\n${JSON.stringify(strategies.quarterly, null, 2)}`;
  }
  if (strategies.monthly) {
    prompt += `\n\n═══ ESTRATEGIA MENSUAL ═══\n${JSON.stringify(strategies.monthly, null, 2)}`;
  }

  // ── Instrucciones de eventos (si existen) ──────────────────────────
  const eventInstructions = buildEventPromptInstructions(compiledStrategy.eventContexts);
  if (eventInstructions) {
    prompt += `\n${eventInstructions}`;
  }

  // ── Instrucciones específicas por formato ──────────────────────────
  if (format === 'post') {
    prompt += `

═══ INSTRUCCIONES PARA POSTS ESTÁTICOS ═══

El post estático es el formato más íntimo. No hay imagen que salve un copy vacío — el texto ES el contenido.

REGLAS DE COPY OBLIGATORIAS:
1. Extensión mínima del campo "copy": 180 palabras. Sin excepción.
2. IMPORTANTE sobre hook y copy:
   · El campo "hook" es la PRIMERA oración del post — la que detiene el scroll.
   · El campo "copy" es el TEXTO COMPLETO del post, INCLUYENDO el hook al inicio.
   · El "copy" DEBE comenzar con la misma frase del "hook" y luego continuar con el desarrollo.
   · NO repitas el hook como frase suelta Y luego como inicio del copy — el copy ya lo contiene.
3. Estructura interna del copy:
   · Párrafo 1: El hook + desarrollo inmediato de la tensión. Directo al nudo.
   · Párrafo 2-3: Profundiza. ¿Qué pasa cuando no se ve esto? ¿Qué se pierde? Hazlo concreto, no abstracto. Conecta cada párrafo con el anterior usando transiciones naturales.
   · Párrafo 4: El giro — una perspectiva nueva que reencuadra lo anterior.
   · Párrafo 5 (si aplica): Cierre con una invitación a la reflexión. Deja espacio al lector para pensar.
4. Escribe en "tú" directo. Habla a UNA persona concreta, no a una audiencia. Mantén la conjugación en segunda persona singular de forma CONSISTENTE en todo el texto.
5. Cada oración debe justificar su existencia. Sin relleno. Sin frases genéricas de autoayuda.
6. Coherencia narrativa: el post debe leerse como UN solo texto fluido, no como fragmentos pegados. Las transiciones entre párrafos deben sentirse naturales.

Distribuye los ${count} posts entre TOFU, MOFU y BOFU según el contenido generado.

REGLA DE CTA:
- TOFU: el CTA siempre termina con "Guía gratis en el enlace de la bio 👆"
- MOFU/BOFU: el CTA puede variar según el objetivo (guardar el post, comentar, ver el plan, etc.)

═══ ESTRUCTURA JSON ═══
{
  "pieces": [
    {
      "order": ${orderOffset + 1},
      "format": "post",
      "funnelStage": "tofu" | "mofu" | "bofu",
      "title": "Título descriptivo interno (no es el copy)",
      "hook": "Primera oración del post. La que para el scroll.",
      "copy": "Texto completo publicable en redes. MÍNIMO 180 PALABRAS. Párrafos separados con \\n\\n. IMPORTANTE: NO incluyas el CTA al final del copy — el CTA va en su propio campo.",
      "cta": "Call to action alineado con la etapa del embudo (sin URL, sin 'descarga', solo la acción)",
      "hashtags": ["EXACTAMENTE 5 hashtags en español, relevantes para el contenido — PROHIBIDO usar DeportistasHispanos, HispanicAthletes o cualquier variante de hispano/hispana. Sin el símbolo #."],
      "visualDirection": "Descripción de la imagen o composición visual que acompaña el post",
      "script": null,
      "carouselSlides": null
    }
  ]
}`;

  } else if (format === 'carrusel') {
    prompt += `

═══ INSTRUCCIONES PARA CARRUSELES ═══

El carrusel es un viaje conceptual. Cada slide es un paso en la transformación del lector.

REGLAS DE ESTRUCTURA OBLIGATORIAS:
1. Cada carrusel debe tener entre 6 y 8 slides. No menos.
2. Slide 1 (portada): DEBE ser una PREGUNTA PROVOCADORA o un ENUNCIADO EMOCIONAL que cualquier persona común sienta que le habla directamente. NO uses títulos genéricos ni descriptivos del tema (NUNCA "El poder de...", "Cómo lograr...", "La importancia de..."). En su lugar usa:
   · Preguntas que incomoden: "¿Y si lo que llamas fortaleza es solo miedo disfrazado?"
   · Afirmaciones que detengan el scroll: "Nadie te enseñó a soltar sin sentir que pierdes."
   · Frases que generen identificación inmediata: "Esa voz que te dice que no es suficiente... no es tuya."
   La portada debe hacer que alguien que NO te conoce sienta curiosidad o se vea reflejado. El campo "text" de la portada se deja vacío.
3. Slides 2 a N-1 (desarrollo): Cada slide trabaja UNA sola idea.
   · Mínimo 2-3 oraciones por slide en el campo "text". No bullet points de una línea.
   · Cada slide debe poder leerse independientemente y aportar valor por sí solo.
   · Progresión: cada slide profundiza o cambia la perspectiva del anterior.
   · Conecta cada slide con el siguiente — que se sienta como un flujo natural, no ideas sueltas.
4. Slide final: Síntesis que transforma lo aprendido + CTA claro.

REGLAS DE COPY:
- El campo "copy" del JSON es el caption del carrusel para redes sociales (60-100 palabras que presentan y contextualizan el carrusel). Debe ser un texto independiente y coherente que invite a deslizar.
- El contenido de cada slide va en el campo "text" de cada objeto en "carouselSlides.slides[]".
- El campo "title" de cada slide es el encabezado visual que aparece en la imagen del slide.
- Evita listas genéricas del tipo "5 tips para...". Prefiere revelaciones y reencuadres.
- IMPORTANTE: Verifica que el caption ("copy") no repita literalmente el contenido de los slides. Son textos complementarios.

Distribuye los ${count} carruseles entre TOFU, MOFU y BOFU según el contenido generado.

═══ ESTRUCTURA JSON ═══
{
  "pieces": [
    {
      "order": ${orderOffset + 1},
      "format": "carrusel",
      "funnelStage": "tofu" | "mofu" | "bofu",
      "title": "Título descriptivo interno",
      "hook": "Gancho de la portada (slide 1) — lo que hace que alguien deslice",
      "copy": "Caption del carrusel para redes. 60-100 palabras. NO incluyas el CTA al final.",
      "cta": "Call to action del último slide. TOFU: terminar con 'Guía gratis en el enlace de la bio 👆'. MOFU/BOFU: acción relevante al objetivo.",
      "hashtags": ["EXACTAMENTE 5 hashtags en español, relevantes para el contenido — PROHIBIDO usar DeportistasHispanos, HispanicAthletes o cualquier variante de hispano/hispana. Sin el símbolo #."],
      "visualDirection": "Estilo visual general: colores, tipografía, dinámica de los slides",
      "script": null,
      "carouselSlides": {
        "slides": [
          { "slide": 1, "title": "¿Y si lo que llamas fortaleza es solo miedo disfrazado?", "text": "", "visualNote": "Nota visual del slide" },
          { "slide": 2, "title": "Título del slide", "text": "Desarrollo del concepto en 2-3 oraciones mínimo.", "visualNote": "..." },
          { "slide": 7, "title": "Cierre", "text": "Síntesis poderosa + invitación a actuar.", "visualNote": "..." }
        ]
      }
    }
  ]
}`;

  } else if (format === 'reel') {
    prompt += `

═══ INSTRUCCIONES PARA REELS ═══

El reel es una conversación uno a uno. El guión es exactamente lo que el presentador dice en cámara — palabra por palabra.

REGLAS DE GUIÓN OBLIGATORIAS:
1. El texto narrado va en script.scenes[].text. Es EXACTAMENTE lo que se dice en cámara, palabra por palabra.
2. Duración objetivo: 45-60 segundos. Entre 130 y 160 palabras narradas en total.
3. Estructura de escenas:
   · Escena 1 (0-5s, ~15 palabras): Apertura que crea tensión inmediata o hace la pregunta que nadie hace. Sin "hola", sin presentación, sin contexto previo. Arranca en el conflicto.
   · Escenas 2-4 (5-40s, ~80-100 palabras): El desarrollo. Conversacional, directo. Como si le hablaras a una persona que tiene exactamente ese problema. Sin jerga. Sin tecnicismos.
   · Escena final (40-60s, ~30-40 palabras): El reencuadre o insight + CTA hablado con naturalidad.
4. FLUIDEZ — el guión debe sonar NATURAL cuando se lee en voz alta:
   · Usa contracciones naturales del habla ("pa'" en lugar de "para" solo si el tono lo permite).
   · Evita frases largas con muchas subordinadas. Oraciones cortas y directas.
   · Cada escena debe fluir hacia la siguiente sin cortes bruscos — como una conversación real.
   · Conjuga SIEMPRE correctamente. Si hablas de "tú", mantén esa persona gramatical en todo el guión.
   · NO uses lenguaje escrito formal — esto se DICE, no se lee. Que suene como alguien hablando de verdad.
5. El campo "copy" es el caption de Instagram/TikTok: 30-50 palabras que presentan el reel. Debe ser coherente con el guión pero NO repetir literalmente lo que se dice.
6. El campo "hook" es la primera frase que se dice en cámara (debe coincidir con scene 1 text).

Distribuye los ${count} reels entre TOFU, MOFU y BOFU según el contenido generado.

REGLA DE CTA:
- TOFU: el CTA hablado siempre termina invitando a la guía gratis: "La guía está gratis, el link está en la bio."
- MOFU/BOFU: el CTA puede variar (guardar, comentar, ver el plan, etc.)

═══ ESTRUCTURA JSON ═══
{
  "pieces": [
    {
      "order": ${orderOffset + 1},
      "format": "reel",
      "funnelStage": "tofu" | "mofu" | "bofu",
      "title": "Título descriptivo interno del reel",
      "hook": "Primera frase que se dice en cámara — la que crea tensión inmediata",
      "copy": "Caption para redes. 30-50 palabras. NO incluyas el CTA al final.",
      "cta": "CTA hablado al final del reel (sin URL, solo la acción)",
      "hashtags": ["EXACTAMENTE 5 hashtags en español, relevantes para el contenido — PROHIBIDO usar DeportistasHispanos, HispanicAthletes o cualquier variante de hispano/hispana. Sin el símbolo #."],
      "visualDirection": "Indicaciones de producción: ángulo, escenario, dinámica visual, si es hablando a cámara o voice-over",
      "script": {
        "scenes": [
          { "scene": 1, "description": "Lo que se ve en pantalla", "text": "EXACTAMENTE lo que se dice. Narrado completo.", "duration": "5s" },
          { "scene": 2, "description": "...", "text": "Continuación del guión narrado. Fluido, sin cortes bruscos.", "duration": "15s" },
          { "scene": 3, "description": "...", "text": "...", "duration": "20s" },
          { "scene": 4, "description": "Cierre", "text": "Reencuadre final + CTA hablado.", "duration": "15s" }
        ]
      },
      "carouselSlides": null
    }
  ]
}`;
  }

  // Logo de marca
  if (client.logoUrl) {
    prompt += `\n\nLOGO DE MARCA: El cliente tiene logo disponible (${client.logoUrl}). En el campo "visualDirection" de cada pieza, especifica dónde y cómo debe aparecer el logo (esquina inferior derecha, marca de agua sutil, cierre del carrusel, etc.).`;
  }

  prompt += `

IMPORTANTE: Genera EXACTAMENTE ${count} piezas. Numeración: empieza en order ${orderOffset + 1}.
Responde ÚNICAMENTE con el JSON. Sin explicaciones, sin texto antes o después.`;

  return prompt;
}

// ── Stories de Instagram ──────────────────────────────────────────────

/**
 * System prompt especializado para generar stories diarias de Instagram.
 * La IA actúa como experta en engagement de comunidad y stories.
 */
function buildStoriesSystemPrompt(brandIdentity) {
  const {
    tone = 'profesional y cercano',
    personality = '',
    emojisAllowed = false,
    forbiddenWords = [],
  } = brandIdentity;

  let prompt = `Eres una experta senior en Instagram Stories y engagement de comunidad para marcas personales.
Tu especialidad es crear secuencias de stories diarias que generen conexión real, conversación y acerquen a la audiencia a la marca.

IDIOMA Y GRAMÁTICA — REGLAS INQUEBRANTABLES:
- TODO el contenido DEBE estar escrito en español latinoamericano correcto.
- Conjugación verbal impecable. Si usas "tú", conjuga en segunda persona singular.
- Concordancia de género y número en CADA frase.
- Puntuación correcta: signos de apertura (¿ ¡) SIEMPRE.
- Coherencia lógica en cada story.

REGLAS OBLIGATORIAS:
1. Tono de comunicación: ${tone}`;

  if (personality) {
    prompt += `\n2. Personalidad de marca: ${personality}`;
  }

  prompt += `\n3. Emojis: ${emojisAllowed ? 'PERMITIDOS, usar con moderación y estratégicamente' : 'PROHIBIDOS, no usar ninguno'}`;

  if (forbiddenWords.length > 0) {
    prompt += `\n4. PALABRAS PROHIBIDAS (nunca usar): ${forbiddenWords.join(', ')}`;
  }

  prompt += `

FILOSOFÍA DE STORIES — PROFUNDIDAD Y CONFRONTACIÓN:
Las stories NO son versiones mini de los posts. Son el espacio más ÍNTIMO, PROFUNDO y CONFRONTATIVO de la marca.
- Aquí la coach NO da tips superficiales. Aquí CONFRONTA, DESPIERTA y SACUDE a su comunidad.
- Cada story debe hacer que la persona se detenga y SIENTA algo incómodo, revelador o profundamente verdadero.
- El objetivo NO es entretener — es TRANSFORMAR. Cada secuencia diaria de stories debe sentirse como una sesión de coaching condensada.
- La coach habla desde su experiencia real, con vulnerabilidad y autoridad. No habla desde la teoría — habla desde sus propias heridas sanadas.
- Las stories deben hacer preguntas que la audiencia NO se ha hecho. Deben señalar lo que nadie le dice.
- El contenido debe tocar las fibras más profundas: miedo al abandono, necesidad de control, relaciones tóxicas, autoexigencia, vergüenza, culpa heredada, lealtades familiares invisibles.

NIVEL DE PROFUNDIDAD REQUERIDO:
- NUNCA frases genéricas tipo "eres suficiente", "confía en el proceso", "mereces más". Eso es contenido vacío.
- SÍ frases que desafíen: "¿Y si esa relación que defiendes es la que más te lastima?", "¿Cuántas veces dijiste que sí cuando tu cuerpo gritaba que no?", "Esa lealtad a tu mamá te está costando tu propia vida."
- Cada reflexión debe tener ESPECIFICIDAD — nombrar situaciones reales, patrones concretos, dinámicas específicas que la audiencia reconozca de inmediato.
- El contenido debe generar la reacción: "¿Cómo sabe ella exactamente lo que estoy viviendo?"

TIPOS DE STORIES QUE PUEDES USAR:
- **texto_reflexion**: Frase de alto impacto emocional que obligue a detenerse y reflexionar profundamente. No frases bonitas — verdades incómodas. LA MÁS IMPORTANTE.
- **frase_impacto**: Cita o afirmación devastadoramente precisa sobre el dolor de la audiencia. Una sola línea que golpee sin rodeos.
- **cita_visual**: Frase atribuida a la marca o a una referencia externa, con diseño de alto contraste visual.
- **teaser**: Anticipa la publicación del día con una pregunta desafiante que enganche emocionalmente.
- **encuesta**: Pregunta que confronte con dos opciones que revelen un patrón inconsciente.
- **pregunta**: Pregunta abierta profunda que la audiencia probablemente nunca se ha hecho.
- **tip_experto**: Herramienta práctica de transformación personal — no un tip genérico, sino algo que cambie la perspectiva.
- **dato_curioso**: Dato psicológico o de neurociencia que valide la experiencia emocional de la audiencia.
- **cta_directa**: Invitación directa y sin rodeos que conecte con la urgencia de transformarse.
- **slider_emocional**: Pregunta que mida el nivel de dolor, urgencia o deseo de cambio.
- **quiz**: Pregunta que revele un patrón inconsciente con opciones que confronten.
- **countdown**: Generar anticipación emocional profunda (no solo "algo viene", sino "tu vida está a punto de cambiar").

REGLAS DE STORIES DE TEXTO/IMAGEN (todas las stories son de texto/imagen — isRecorded SIEMPRE false):
- El campo "isRecorded" SIEMPRE debe ser false. El campo "script" SIEMPRE debe ser null.
- PROHIBIDO usar storyType "grabada_coach" — no existe, nunca lo uses.
- El texto (campo "textContent") debe ser de ALTO IMPACTO EMOCIONAL. 2-4 líneas que golpeen.
- Cada frase de texto debe funcionar como un "puñetazo emocional" — algo que la persona necesitaba leer hoy.
- NO frases motivacionales genéricas. SÍ verdades específicas que nombren el dolor real.
- El texto debe provocar que la persona haga screenshot o responda a la story.
- Incluir indicaciones visuales claras en "visualDirection": fondo (color, gradiente, imagen de fondo sugerida), tipografía (tamaño, peso, alineación), elementos adicionales (íconos, líneas, capas).
- Variar el diseño visual cada día: fondos oscuros con texto blanco, fondos con textura, fondos de color marca, fondos con foto difuminada.

FORMATO DE RESPUESTA:
Responde SIEMPRE en JSON válido con la estructura indicada en el prompt del usuario. Sin texto antes ni después del JSON.`;

  return prompt;
}

/**
 * Construye el user prompt para generar stories de la semana.
 *
 * @param {Array} approvedContent - Piezas aprobadas de la semana [{format, title, hook, copy, funnelStage}]
 * @param {object} compiledStrategy - Estrategia compilada del cliente
 * @param {number} week - Semana del mes (1-4)
 * @param {number} storiesPerDay - Stories por día (default 5)
 */
function buildStoriesPrompt(approvedContent, compiledStrategy, week, storiesPerDay = 5) {
  const { client, strategies, period } = compiledStrategy;

  let prompt = `Genera stories de Instagram para ${client.name} (${client.industry || 'marca personal / coaching'}).

PERÍODO: Semana ${week} de ${period.month}/${period.year}
STORIES POR DÍA: ${storiesPerDay} stories × 6 días (Lunes a Sábado) = ${storiesPerDay * 6} stories totales
NOTA: Los domingos NO se publican stories. Solo de Lunes a Sábado.

═══ CONTENIDO APROBADO DE LA SEMANA ═══
Estas son las piezas de contenido principal que se publican esta semana. Las stories deben REFORZAR, ANTICIPAR y COMPLEMENTAR estas publicaciones:

`;

  if (approvedContent.length > 0) {
    approvedContent.forEach((piece, i) => {
      prompt += `${i + 1}. [${(piece.format || '').toUpperCase()}] "${piece.title}"
   Hook: ${piece.hook || 'N/A'}
   Etapa: ${(piece.funnelStage || '').toUpperCase()}
   CTA: ${piece.cta || 'N/A'}
   Resumen: ${(piece.copy || '').substring(0, 200)}...
`;
    });
  } else {
    prompt += `No hay piezas aprobadas aún. Genera stories de valor general alineadas con la estrategia.\n`;
  }

  if (client.targetAudience) {
    prompt += `\nAUDIENCIA OBJETIVO: ${client.targetAudience}`;
  }

  if (strategies.annual) {
    prompt += `\n\n═══ ESTRATEGIA ANUAL ═══\n${JSON.stringify(strategies.annual, null, 2)}`;
  }
  if (strategies.quarterly) {
    prompt += `\n\n═══ ESTRATEGIA TRIMESTRAL ═══\n${JSON.stringify(strategies.quarterly, null, 2)}`;
  }
  if (strategies.monthly) {
    prompt += `\n\n═══ ESTRATEGIA MENSUAL ═══\n${JSON.stringify(strategies.monthly, null, 2)}`;
  }

  // ── Instrucciones de eventos para stories (si existen) ─────────────
  const eventStoriesInstructions = buildEventStoriesInstructions(compiledStrategy.eventContexts);
  if (eventStoriesInstructions) {
    prompt += `\n${eventStoriesInstructions}`;
  }

  prompt += `

═══ REGLAS DE DISTRIBUCIÓN DIARIA ═══

1. CADA DÍA (Lunes a Sábado) debe tener EXACTAMENTE ${storiesPerDay} stories, numeradas del 1 al ${storiesPerDay}. NO generar stories para el Domingo (día 7).
2. TODAS las stories son de texto/imagen — isRecorded SIEMPRE false, script SIEMPRE null.
3. Los días que coinciden con una publicación principal:
   - Story 1: TEASER — pregunta desafiante o verdad incómoda que anticipe emocionalmente el tema de la publicación.
   - Story 2: FRASE_IMPACTO o TEXTO_REFLEXION — golpe emocional directo sobre el tema central.
   - Story 3: DATO_CURIOSO o TIP_EXPERTO — dato psicológico o herramienta concreta que amplíe la perspectiva.
   - Story 4: ENCUESTA o PREGUNTA — confronta a la audiencia con un patrón inconsciente relacionado al tema.
   - Story 5: CTA_DIRECTA — invitación potente conectada a la urgencia emocional del día.
4. Los días SIN publicación principal:
   - Profundizar en temáticas de transformación: relaciones, heridas emocionales, patrones familiares, autoexigencia, culpa, vergüenza.
   - Cada día sin publicación es una oportunidad de CONFRONTAR un patrón específico distinto.
   - Mezclar tipos: frase_impacto, cita_visual, encuesta, pregunta, slider_emocional, quiz, countdown.
5. ARCO NARRATIVO DIARIO: La primera story ABRE una herida (pregunta incómoda o verdad perturbadora), las del medio la EXPLORAN con profundidad y confrontación, la última OFRECE un camino de transformación o invita a la acción.
6. VARIEDAD de tipos: no repetir el mismo tipo de story más de 2 días seguidos. Rotar entre texto_reflexion, frase_impacto, cita_visual, encuesta, pregunta, tip_experto, dato_curioso, cta_directa, slider_emocional, quiz, countdown, teaser.
7. DISEÑO VISUAL: Variar el estilo visual cada día en "visualDirection" — fondos oscuros con texto blanco, fondos de color marca, fondos con textura o foto difuminada, tipografía en bloque vs fluida.

═══ VINCULACIÓN CON CONTENIDO ═══
- Si una story refuerza una pieza específica, incluye el título exacto de esa pieza en "relatedContentTitle".
- Si es una story independiente (behind the scenes, tip general, etc.), usa null.

═══ ESTRUCTURA JSON ═══
{
  "stories": [
    {
      "dayOfWeek": 1,
      "dayLabel": "Lunes",
      "order": 1,
      "storyType": "teaser | texto_reflexion | frase_impacto | cita_visual | encuesta | pregunta | tip_experto | dato_curioso | cta_directa | slider_emocional | quiz | countdown",
      "isRecorded": false,
      "script": null,
      "textContent": "Texto de alto impacto emocional de la story. SIEMPRE requerido.",
      "visualDirection": "Indicaciones visuales: fondo, escenario, tipografía, elementos.",
      "cta": "CTA si aplica, null si no.",
      "stickerSuggestion": "Tipo y contenido del sticker: 'encuesta: Opción A / Opción B' o 'pregunta: ¿...?' o null",
      "relatedContentTitle": "Título de la pieza que refuerza, o null"
    }
  ]
}

IMPORTANTE:
- Genera EXACTAMENTE ${storiesPerDay * 6} stories (${storiesPerDay} por día × 6 días, Lunes a Sábado).
- Los días van del 1 (Lunes) al 6 (Sábado). NO incluir día 7 (Domingo).
- Responde ÚNICAMENTE con el JSON. Sin explicaciones, sin texto antes o después.`;

  return prompt;
}

module.exports = { buildSystemPrompt, buildFormatPrompt, buildStoriesSystemPrompt, buildStoriesPrompt };
