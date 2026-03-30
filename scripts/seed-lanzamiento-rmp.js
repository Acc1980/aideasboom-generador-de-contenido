/**
 * seed-lanzamiento-rmp.js
 *
 * Carga el plan de contenido "Reconociendo mi Poder" (16 marzo - 4 abril 2026)
 * en la base de datos de AIdeasBoom y lo exporta al Google Sheet de aprobaciones.
 *
 * Uso: node scripts/seed-lanzamiento-rmp.js
 */

require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Planning = require('../src/modules/planning/planning.model');
const Content = require('../src/modules/content/content.model');
const { exportToSheet } = require('../src/services/approvalSheet.service');

const CLIENT_ID = 'd02ea2e0-87e3-4c58-a340-4969976dc448'; // Moni Grizales

const HASHTAGS_BASE = [
  '#ReconociendoMiPoder', '#MujerConsciente', '#MujerEnProceso',
  '#SanacionInterior', '#CoachingParaMujeres', '#TrabajoInterior',
  '#DesarrolloPersonalFemenino', '#MujeresQueSeEligen',
];

const HASHTAGS_MASTERCLASS = [
  '#MasterclassGratuita', '#ReconociendoMiPoder', '#MujerConsciente',
  '#3Bloqueos', '#CoachingParaMujeres', '#TransformacionFemenina',
];

const HASHTAGS_VENTA = [
  '#ReconociendoMiPoder', '#EntrenamientoConsciente', '#MujeresQueSanan',
  '#ProcesoConsciente', '#AcompanamientoFemenino', '#MujerEnProceso',
];

// ─────────────────────────────────────────────────────────────────────────────
// SEMANA 1 — Despertar Curiosidad (Mar 16-21) · TOFU
// ─────────────────────────────────────────────────────────────────────────────
const SEMANA_1_CONTENIDO = [
  {
    order: 1,
    format: 'reel',
    funnelStage: 'tofu',
    title: '5 señales de que estás funcionando en piloto automático',
    hook: 'Mónica a cámara, lista rápida con texto en pantalla',
    copy: `1. Dices "estoy bien" pero por dentro no sientes nada
2. Cuidas a todos menos a ti
3. Evitas estar sola con tus pensamientos
4. Sientes que los días pasan y tú no los eliges
5. Te da miedo soltar el control

Si te identificaste con al menos 3... necesitas hacer este quiz.`,
    cta: 'Quiz → Link en bio',
    hashtags: [...HASHTAGS_BASE, '#PilotoAutomatico', '#PoderPersonal'],
    visualDirection: 'Mónica a cámara, tono directo. Texto sobre video con cada señal. Duración 20-30 seg.',
    script: {
      scenes: [
        { scene: 1, duration: '0-5s', description: 'Hook directo a cámara', text: '¿Cuántas de estas 5 señales te describen?' },
        { scene: 2, duration: '5-20s', description: 'Lista rápida con texto en pantalla', text: '1. Dices "estoy bien" pero por dentro no sientes nada\n2. Cuidas a todos menos a ti\n3. Evitas estar sola con tus pensamientos\n4. Sientes que los días pasan y tú no los eliges\n5. Te da miedo soltar el control' },
        { scene: 3, duration: '20-30s', description: 'Cierre con CTA', text: 'Si te identificaste con al menos 3... necesitas hacer este quiz. Link en mi bio.' },
      ],
    },
    publishDate: '2026-03-16',
  },
  {
    order: 2,
    format: 'carrusel',
    funnelStage: 'tofu',
    title: '3 bloqueos que te impiden ocupar tu lugar como mujer',
    hook: 'Los veo todos los días en consulta. Son silenciosos y se disfrazan de responsabilidad.',
    copy: `Estos 3 bloqueos los veo todos los días en mi consulta. Son silenciosos, se disfrazan de "responsabilidad" y te mantienen lejos de ti misma.

El 24 de marzo vamos a trabajarlos juntas en una masterclass gratuita. El link de registro está en mi bio.`,
    cta: 'Registro masterclass → Link en bio',
    hashtags: [...HASHTAGS_BASE, '#Bloqueos', '#OcupaTuLugar'],
    visualDirection: 'Fondo verde #8FA394, tipografía serif blanca. 7 slides: portada + 3 bloqueos + pregunta + info masterclass + CTA.',
    carouselSlides: {
      slides: [
        { slide: 1, text: 'PORTADA: 3 bloqueos que te impiden ocupar tu lugar como mujer · Desliza →' },
        { slide: 2, text: 'BLOQUEO 01 — La culpa por priorizarte\nSientes que si piensas en ti, estás fallándole a alguien. Aprendiste que cuidarte es egoísmo.' },
        { slide: 3, text: 'BLOQUEO 02 — El control como escudo\nNecesitas tener todo bajo control porque si sueltas, sientes que todo se cae. Pero ese control no es fortaleza — es miedo disfrazado.' },
        { slide: 4, text: 'BLOQUEO 03 — La desconexión emocional\nPasas los días resolviendo pero sin sentir. Funcionas en piloto automático y cuando alguien te pregunta cómo estás, dices "bien" sin pensarlo.' },
        { slide: 5, text: '¿Quieres trabajar estos bloqueos en vivo conmigo?' },
        { slide: 6, text: 'MASTERCLASS GRATUITA\n"3 bloqueos que te impiden ocupar tu lugar como mujer"\nFecha: 24 de marzo, 2026\nHora: 7:00 PM Colombia\nEn vivo por Zoom · 100% GRATIS' },
        { slide: 7, text: 'Regístrate hoy. Los cupos son limitados. → Link en mi bio' },
      ],
    },
    publishDate: '2026-03-17',
  },
  {
    order: 3,
    format: 'reel',
    funnelStage: 'tofu',
    title: 'No es que no tengas tiempo para ti — es que no te das permiso',
    hook: 'No me digas que no tienes tiempo. Dime la verdad: no te das permiso.',
    copy: `No me digas que no tienes tiempo. Dime la verdad: no te das permiso.

Porque en algún momento aprendiste que tus necesidades van al final de la lista. Que cuidar de ti es egoísmo. Que si no estás produciendo o sirviendo a alguien, estás fallando.

Eso no es fortaleza. Es un bloqueo. Y se puede trabajar.

Haz el quiz del link en mi bio y empieza a entender qué te está pasando.
El 24 de marzo te espero en la masterclass gratuita.`,
    cta: 'Quiz + mención masterclass 24 de marzo',
    hashtags: [...HASHTAGS_BASE, '#Permiso', '#Autocuidado'],
    visualDirection: 'Mónica sentada, tono conversacional, directo a cámara. 30-45 segundos. Fondo neutro.',
    script: {
      scenes: [
        { scene: 1, duration: '0-5s', description: 'Hook directo', text: 'No me digas que no tienes tiempo. Dime la verdad: no te das permiso.' },
        { scene: 2, duration: '5-35s', description: 'Desarrollo', text: 'Porque en algún momento aprendiste que tus necesidades van al final de la lista. Que cuidar de ti es egoísmo. Que si no estás produciendo o sirviendo a alguien, estás fallando.' },
        { scene: 3, duration: '35-45s', description: 'Cierre con CTA', text: 'Eso no es fortaleza. Es un bloqueo. Y se puede trabajar. Haz el quiz del link en mi bio.' },
      ],
    },
    publishDate: '2026-03-18',
  },
  {
    order: 4,
    format: 'carrusel',
    funnelStage: 'tofu',
    title: 'Lo que nadie te dice sobre ser la fuerte del grupo',
    hook: 'Ser la fuerte del grupo tiene un costo. Este carrusel es para ti.',
    copy: `Esto lo viví yo. Durante años fui la que resolvía todo, la que no lloraba, la que podía con todo. Hasta que el cuerpo me cobró la factura.

Si estás ahí, quiero que sepas: no tienes que seguir así.

Link del quiz en mi bio. El 24 de marzo te espero en la masterclass gratuita.`,
    cta: 'Quiz + masterclass',
    hashtags: [...HASHTAGS_BASE, '#LaFuerteDelGrupo', '#VulnerabilidadReal'],
    visualDirection: 'Fondo crema #f5f3ef, texto oscuro. 7 slides con historia personal de Mónica.',
    carouselSlides: {
      slides: [
        { slide: 1, text: 'PORTADA: Ser la fuerte del grupo tiene un costo' },
        { slide: 2, text: 'Todo el mundo te busca, pero tú no buscas a nadie' },
        { slide: 3, text: 'Sostienes a otros y cuando necesitas ayuda, no sabes cómo pedirla' },
        { slide: 4, text: 'Aprendiste que mostrar vulnerabilidad es debilidad' },
        { slide: 5, text: 'Pero la verdadera fortaleza no es aguantar. Es permitirte sentir.' },
        { slide: 6, text: '¿Te reconoces? Haz el Quiz de Poder Personal y descubre qué hay debajo de esa armadura. → Link en bio' },
        { slide: 7, text: 'Y si quieres profundizar, el 24 de marzo te espero en la masterclass gratuita.' },
      ],
    },
    publishDate: '2026-03-19',
  },
  {
    order: 5,
    format: 'reel',
    funnelStage: 'tofu',
    title: 'Lo que vas a aprender en la masterclass del 24 de marzo',
    hook: 'El martes 24 a las 7pm voy a hacer algo que importa mucho.',
    copy: `El martes 24 a las 7pm voy a hacer una masterclass gratuita y quiero contarte qué vamos a trabajar:

→ Vamos a identificar los 3 bloqueos más comunes que te impiden ocupar tu lugar
→ Vas a entender por qué repites patrones aunque ya los hayas identificado
→ Y te voy a dar una herramienta práctica para empezar a desactivar el piloto automático

No es una charla motivacional. Es un espacio de trabajo real.

Link en mi bio para registrarte.`,
    cta: 'Registro masterclass → Link en bio',
    hashtags: [...HASHTAGS_MASTERCLASS],
    visualDirection: 'Mónica a cámara, energía alta pero cálida. 45-60 segundos. Directo y concreto.',
    script: {
      scenes: [
        { scene: 1, duration: '0-8s', description: 'Anuncio directo', text: 'El martes 24 a las 7pm voy a hacer una masterclass gratuita y quiero contarte qué vamos a trabajar.' },
        { scene: 2, duration: '8-40s', description: 'Los 3 puntos del programa', text: '→ Los 3 bloqueos más comunes que te impiden ocupar tu lugar\n→ Por qué repites patrones aunque ya los hayas identificado\n→ Una herramienta práctica para desactivar el piloto automático' },
        { scene: 3, duration: '40-55s', description: 'CTA urgente', text: 'No es una charla motivacional. Es un espacio de trabajo real. Link en mi bio para registrarte. Los cupos son limitados.' },
      ],
    },
    publishDate: '2026-03-20',
  },
  {
    order: 6,
    format: 'post',
    funnelStage: 'tofu',
    title: 'Frase reflexión: No necesitas tener todo resuelto para empezar',
    hook: 'No necesitas tener todo resuelto para empezar. Solo necesitas dejar de postergarte.',
    copy: `"No necesitas tener todo resuelto para empezar. Solo necesitas dejar de postergarte."
— Mónica Grizales

Te dejo esta reflexión para el fin de semana. Si llevas tiempo sintiéndote estancada, este es tu momento. El martes 24 tengo una masterclass gratuita donde vamos a trabajar lo que te está frenando. Regístrate desde mi bio.`,
    cta: 'Esta semana haz algo por ti. Empieza con el quiz → link en bio',
    hashtags: [...HASHTAGS_BASE, '#Reflexion', '#FrasesConscientes'],
    visualDirection: 'Diseño elegante, tipografía serif sobre fondo suave. Foto de Mónica. Estilo lifestyle minimalista.',
    publishDate: '2026-03-21',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEMANA 2 — Masterclass + Apertura de Ventas (Mar 23-28) · MOFU
// ─────────────────────────────────────────────────────────────────────────────
const SEMANA_2_CONTENIDO = [
  {
    order: 1,
    format: 'reel',
    funnelStage: 'mofu',
    title: 'Mañana vamos a hablar de lo que nadie quiere ver',
    hook: 'Mañana a las 7pm voy a hacer algo que me importa mucho.',
    copy: `Mañana a las 7pm voy a hacer algo que me importa mucho. Vamos a hablar de los bloqueos que nos mantienen funcionando en automático. De la culpa, del control, de la desconexión. No para juzgarte — para que los reconozcas y puedas empezar a soltarlos.

Es gratis. Es en vivo. Y es para ti.

Link en mi bio para registrarte. Último día.`,
    cta: 'Último día de registro → Link en bio',
    hashtags: [...HASHTAGS_MASTERCLASS],
    visualDirection: 'Mónica directa a cámara, tono íntimo como si hablara con una amiga. 30-40 segundos.',
    script: {
      scenes: [
        { scene: 1, duration: '0-5s', description: 'Apertura íntima', text: 'Mañana a las 7pm voy a hacer algo que me importa mucho.' },
        { scene: 2, duration: '5-30s', description: 'Descripción del evento', text: 'Vamos a hablar de los bloqueos que nos mantienen funcionando en automático. De la culpa, del control, de la desconexión. No para juzgarte — para que los reconozcas y puedas empezar a soltarlos.' },
        { scene: 3, duration: '30-40s', description: 'CTA urgente', text: 'Es gratis. Es en vivo. Y es para ti. Link en mi bio. Último día de registro.' },
      ],
    },
    publishDate: '2026-03-23',
  },
  {
    order: 2,
    format: 'post',
    funnelStage: 'mofu',
    title: 'HOY 7PM — Masterclass gratuita: 3 bloqueos que te impiden ocupar tu lugar como mujer',
    hook: 'HOY ES EL DÍA.',
    copy: `HOY · 7:00 PM · En vivo por Zoom

"3 bloqueos que te impiden ocupar tu lugar como mujer"

Facilitado por Mónica Grizales · Coach Ontológica · +5,000 mujeres acompañadas
Entrada: 100% GRATIS

Regístrate desde mi bio para recibir el link de Zoom.`,
    cta: 'Registro → Link en bio',
    hashtags: [...HASHTAGS_MASTERCLASS, '#HoyEsElDia'],
    visualDirection: 'Diseño limpio con info del evento. Texto impactante "HOY 7PM". Fondo oscuro elegante con detalles en verde.',
    publishDate: '2026-03-24',
  },
  {
    order: 3,
    format: 'reel',
    funnelStage: 'mofu',
    title: 'Esto fue lo que pasó anoche en la masterclass',
    hook: 'Anoche algo especial pasó.',
    copy: `Anoche algo especial pasó.

Mujeres que se conectaron para trabajar sus bloqueos. En vivo. Con honestidad.

Lo que hicimos anoche fue solo la superficie. Lo profundo es lo que viene.

Reconociendo mi Poder — 15 y 16 de abril. Link en mi bio.

(Precio pronto pago disponible por tiempo limitado para las que estuvieron anoche)`,
    cta: 'Inscripción RMP → precio pronto pago por tiempo limitado',
    hashtags: [...HASHTAGS_VENTA],
    visualDirection: 'Clips cortos de la masterclass (grabación) + texto overlay. Mostrar fragmentos poderosos sin revelar todo. 45-60 seg.',
    script: {
      scenes: [
        { scene: 1, duration: '0-8s', description: 'Apertura emocional', text: 'Anoche algo especial pasó.' },
        { scene: 2, duration: '8-35s', description: 'Clips de la masterclass + narración', text: 'Mujeres conectadas para trabajar sus bloqueos. En vivo. Con honestidad.' },
        { scene: 3, duration: '35-50s', description: 'Transición a la venta', text: 'Esto fue solo la superficie. Lo profundo es lo que viene. Reconociendo mi Poder — 15 y 16 de abril. Link en mi bio.' },
      ],
    },
    publishDate: '2026-03-25',
  },
  {
    order: 4,
    format: 'carrusel',
    funnelStage: 'mofu',
    title: 'Lo que incluye Reconociendo mi Poder',
    hook: 'Esto no es un curso que ves y olvidas. Es un espacio donde te miras de frente.',
    copy: `Esto no es un curso que ves y olvidas. Es un espacio donde te miras de frente, con herramientas, con acompañamiento y con una comunidad.

Precio pronto pago disponible por tiempo limitado. Link en bio.`,
    cta: 'Inscripción RMP (pronto pago por tiempo limitado)',
    hashtags: [...HASHTAGS_VENTA],
    visualDirection: '7 slides mostrando cada elemento del entrenamiento. Diseño elegante en tonos verdes y crema.',
    carouselSlides: {
      slides: [
        { slide: 1, text: 'PORTADA: Esto es Reconociendo mi Poder' },
        { slide: 2, text: '2 noches de entrenamiento intensivo — 15 y 16 de abril, 6:30 a 9:30pm' },
        { slide: 3, text: 'En vivo con Mónica Grizales — grupo reducido para que el trabajo sea profundo' },
        { slide: 4, text: 'Material de trabajo — para que lo que descubras quede contigo' },
        { slide: 5, text: 'Comunidad de WhatsApp — para que sigas el proceso con apoyo' },
        { slide: 6, text: 'Grabación disponible 30 días — para revisitar lo que necesites' },
        { slide: 7, text: 'Precio pronto pago disponible por tiempo limitado — aprovecha ahora → Link en bio' },
      ],
    },
    publishDate: '2026-03-26',
  },
  {
    order: 5,
    format: 'reel',
    funnelStage: 'mofu',
    title: 'Antes y después de reconocer mi poder — historia personal de Mónica',
    hook: 'Antes: decía que sí a todo, me sentía culpable por descansar.',
    copy: `Antes: decía que sí a todo, me sentía culpable por descansar, creía que pedir ayuda era debilidad.

Después: aprendí a poner límites sin culpa, a sentir sin juicio, a elegirme sin explicaciones.

Eso es reconocer tu poder. Y eso es lo que vamos a trabajar juntas el 15 y 16 de abril.

Link en mi bio.`,
    cta: 'Inscripción RMP → Link en bio',
    hashtags: [...HASHTAGS_VENTA, '#HistoriaPersonal'],
    visualDirection: 'Formato storytelling. Mónica a cámara con tono vulnerable y auténtico. 45-60 segundos.',
    script: {
      scenes: [
        { scene: 1, duration: '0-5s', description: 'Inicio vulnerable', text: 'Antes: decía que sí a todo, me sentía culpable por descansar.' },
        { scene: 2, duration: '5-35s', description: 'Contraste antes/después', text: 'Creía que pedir ayuda era debilidad. Que mi valor estaba en lo que hacía por otros.\n\nDespués: aprendí a poner límites sin culpa, a sentir sin juicio, a elegirme sin explicaciones.' },
        { scene: 3, duration: '35-55s', description: 'Invitación', text: 'Eso es reconocer tu poder. Y eso es lo que vamos a trabajar juntas el 15 y 16 de abril. Link en mi bio.' },
      ],
    },
    publishDate: '2026-03-27',
  },
  {
    order: 6,
    format: 'post',
    funnelStage: 'mofu',
    title: 'Frase: El día que dejas de postergarte a ti misma',
    hook: 'El día que dejas de postergarte a ti misma, todo empieza a cambiar.',
    copy: `"El día que dejas de postergarte a ti misma, todo empieza a cambiar."
— Mónica Grizales

Reconociendo mi Poder. 15 y 16 de abril. Si este mensaje resuena contigo, el link está en mi bio.`,
    cta: 'Mención RMP → Link en bio',
    hashtags: [...HASHTAGS_VENTA, '#FrasesConscientes'],
    visualDirection: 'Frase poderosa + foto de Mónica. Diseño elegante. Caption sutil con mención de RMP al final.',
    publishDate: '2026-03-28',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEMANA 3 — Cierre y Conversión (Mar 30 - Abr 4) · BOFU
// ─────────────────────────────────────────────────────────────────────────────
const SEMANA_3_CONTENIDO = [
  {
    order: 1,
    format: 'reel',
    funnelStage: 'bofu',
    title: '3 excusas que te dices para no empezar tu proceso',
    hook: '¿Cuál de estas 3 excusas estás usando para no empezar?',
    copy: `"No tengo tiempo" → Tienes el mismo tiempo que tenías para todo lo demás. Lo que no tienes es prioridad sobre ti misma.

"No es el momento" → El momento perfecto no existe. Existe el momento en que decides que ya es suficiente.

"No sé si es para mí" → Si algo en tu cuerpo resuena con estas palabras, es para ti.

Reconociendo mi Poder. 15 y 16 de abril. Precio pronto pago por tiempo limitado. Link en bio.`,
    cta: 'Inscripción RMP (pronto pago) → Link en bio',
    hashtags: [...HASHTAGS_VENTA, '#Objeciones', '#EsParaTi'],
    visualDirection: 'Mónica a cámara, contundente pero empática. 45-60 segundos. Cada excusa aparece en texto.',
    script: {
      scenes: [
        { scene: 1, duration: '0-5s', description: 'Hook directo', text: '¿Cuál de estas 3 excusas estás usando para no empezar?' },
        { scene: 2, duration: '5-40s', description: 'Las 3 excusas con respuesta', text: '"No tengo tiempo" → Lo que no tienes es prioridad sobre ti misma.\n"No es el momento" → El momento perfecto no existe.\n"No sé si es para mí" → Si algo resuena, es para ti.' },
        { scene: 3, duration: '40-55s', description: 'CTA venta', text: 'Reconociendo mi Poder. 15 y 16 de abril. Precio pronto pago por tiempo limitado. Link en mi bio.' },
      ],
    },
    publishDate: '2026-03-30',
  },
  {
    order: 2,
    format: 'carrusel',
    funnelStage: 'bofu',
    title: 'Ellas ya reconocieron su poder — testimonios reales',
    hook: 'Ellas ya lo vivieron. Tu historia también puede cambiar.',
    copy: `Ellas decidieron. Hicieron el proceso. Y algo se transformó.

Tu historia también puede cambiar. Reconociendo mi Poder — 15 y 16 de abril.

Ya hay X mujeres inscritas de 50 cupos disponibles.

Link de inscripción en mi bio.`,
    cta: 'Inscripción RMP → Link en bio',
    hashtags: [...HASHTAGS_VENTA, '#Testimonios', '#ResultadosReales'],
    visualDirection: '6 slides: portada + testimonios reales de Johana G., Mariana + capturas de chat + CTA final.',
    carouselSlides: {
      slides: [
        { slide: 1, text: 'PORTADA: Ellas ya reconocieron su poder' },
        { slide: 2, text: 'Johana G.: "Lo que más me ayudó fue descubrir que mis emociones no son el problema, sino la guía que necesitaba para conocerme mejor."' },
        { slide: 3, text: 'Mariana: "Aprendí a no abandonarme por sostener a otros. Fue el cambio más profundo que he vivido."' },
        { slide: 4, text: '[Captura real de testimonio de la masterclass]' },
        { slide: 5, text: '[Captura real de DM/testimonio adicional]' },
        { slide: 6, text: 'Tu historia también puede cambiar. Reconociendo mi Poder — 15 y 16 de abril. → Link en bio' },
      ],
    },
    publishDate: '2026-03-31',
  },
  {
    order: 3,
    format: 'reel',
    funnelStage: 'bofu',
    title: 'La diferencia entre entender y transformar',
    hook: 'Puedes leer 100 libros de desarrollo personal. Pero saber no es transformar.',
    copy: `Puedes leer 100 libros de desarrollo personal. Puedes seguir 50 cuentas de coaching. Puedes saber exactamente qué te pasa.

Pero saber no es transformar.

Transformar es cuando lo que sabes pasa de la cabeza al cuerpo. Cuando dejas de repetir el patrón, no porque lo entiendes, sino porque lo has trabajado.

Eso es lo que hacemos en Reconociendo mi Poder. No es teoría. Es práctica. Es tu proceso. Es en vivo.

15 y 16 de abril. Link en mi bio.`,
    cta: 'Inscripción RMP → Link en bio',
    hashtags: [...HASHTAGS_VENTA],
    visualDirection: 'Mónica a cámara, tono reflexivo y profundo. 50-60 segundos.',
    script: {
      scenes: [
        { scene: 1, duration: '0-8s', description: 'Paradoja inicial', text: 'Puedes leer 100 libros de desarrollo personal. Pero saber no es transformar.' },
        { scene: 2, duration: '8-40s', description: 'Desarrollo del concepto', text: 'Transformar es cuando lo que sabes pasa de la cabeza al cuerpo. Cuando dejas de repetir el patrón, no porque lo entiendes, sino porque lo has trabajado.' },
        { scene: 3, duration: '40-55s', description: 'CTA', text: 'Eso es lo que hacemos en Reconociendo mi Poder. No es teoría. Es práctica. 15 y 16 de abril. Link en mi bio.' },
      ],
    },
    publishDate: '2026-04-01',
  },
  {
    order: 4,
    format: 'reel',
    funnelStage: 'bofu',
    title: 'Hoy amanecí pensando en ti',
    hook: 'Hoy amanecí pensando en esa mujer que lleva días viendo mis publicaciones.',
    copy: `Hoy amanecí pensando en esa mujer que lleva días viendo mis publicaciones, que sabe que necesita este espacio, pero que sigue pensando "después".

No te estoy vendiendo algo. Te estoy invitando a algo que puede cambiar cómo te relacionas contigo misma.

Quedan X cupos. 15 y 16 de abril. Link en mi bio.`,
    cta: 'Inscripción RMP → Link en bio',
    hashtags: [...HASHTAGS_VENTA, '#EscasezReal'],
    visualDirection: 'Selfie-style, Mónica natural sin maquillaje perfecto. Tono muy personal y cercano. 40-50 segundos.',
    script: {
      scenes: [
        { scene: 1, duration: '0-8s', description: 'Apertura personal', text: 'Hoy amanecí pensando en esa mujer que lleva días viendo mis publicaciones, que sabe que necesita este espacio, pero que sigue pensando "después".' },
        { scene: 2, duration: '8-35s', description: 'Invitación directa', text: 'No te estoy vendiendo algo. Te estoy invitando a algo que puede cambiar cómo te relacionas contigo misma.' },
        { scene: 3, duration: '35-48s', description: 'CTA con escasez real', text: 'Quedan X cupos. 15 y 16 de abril. Link en mi bio.' },
      ],
    },
    publishDate: '2026-04-02',
  },
  {
    order: 5,
    format: 'carrusel',
    funnelStage: 'bofu',
    title: 'Carta abierta a la mujer que sigue postergándose',
    hook: 'Esta carta es para ti. Sí, para ti.',
    copy: `Si llegaste hasta aquí, algo dentro de ti está listo. No lo ignores.

El precio pronto pago está por acabarse. El link está en mi bio.`,
    cta: 'Inscripción RMP (pronto pago por pocos días) → Link en bio',
    hashtags: [...HASHTAGS_VENTA, '#CartaAbierta'],
    visualDirection: '7 slides en formato carta personal. Fondo crema, tipografía serif. Tono íntimo y directo.',
    carouselSlides: {
      slides: [
        { slide: 1, text: 'PORTADA: Esto es para ti' },
        { slide: 2, text: 'Para la que dice "estoy bien" pero por dentro sabe que no.' },
        { slide: 3, text: 'Para la que cuida a todos y se pone al final de la lista.' },
        { slide: 4, text: 'Para la que tiene miedo de mirarse de frente.' },
        { slide: 5, text: 'Para la que sabe que merece más pero no sabe cómo empezar.' },
        { slide: 6, text: 'Esto es para ti. Y ya es hora.' },
        { slide: 7, text: 'Reconociendo mi Poder. 15 y 16 de abril. El precio pronto pago se acaba pronto. → Link en bio' },
      ],
    },
    publishDate: '2026-04-03',
  },
  {
    order: 6,
    format: 'post',
    funnelStage: 'bofu',
    title: 'Frase cierre: Elegirte no es egoísmo',
    hook: 'Elegirte no es egoísmo. Es el acto más valiente que puedes hacer.',
    copy: `"Elegirte no es egoísmo. Es el acto más valiente que puedes hacer."
— Mónica Grizales

Precio pronto pago por pocos días más. Link en mi bio.`,
    cta: 'Precio pronto pago por pocos días más → Link en bio',
    hashtags: [...HASHTAGS_VENTA, '#Elegirte'],
    visualDirection: 'Frase poderosa + foto de Mónica. Diseño elegante de cierre. Paleta verde y crema.',
    publishDate: '2026-04-04',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EJECUTAR
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await sequelize.authenticate();
    console.log('\n✅ Conectado a PostgreSQL\n');

    const semanas = [
      {
        label: 'Semana 1 — Despertar Curiosidad (Mar 16-21)',
        month: 3, week: 3,
        distribution: { total: 6, reels: 3, posts: 1, carruseles: 2, tofu: 6, mofu: 0, bofu: 0 },
        contenido: SEMANA_1_CONTENIDO,
      },
      {
        label: 'Semana 2 — Masterclass + Apertura Ventas (Mar 23-28)',
        month: 3, week: 4,
        distribution: { total: 6, reels: 3, posts: 2, carruseles: 1, tofu: 0, mofu: 6, bofu: 0 },
        contenido: SEMANA_2_CONTENIDO,
      },
      {
        label: 'Semana 3 — Cierre y Conversión (Mar 30 - Abr 4)',
        month: 4, week: 1,
        distribution: { total: 6, reels: 3, posts: 1, carruseles: 2, tofu: 0, mofu: 0, bofu: 6 },
        contenido: SEMANA_3_CONTENIDO,
      },
    ];

    const planningIds = [];

    for (const semana of semanas) {
      console.log(`\n📅 Procesando: ${semana.label}`);

      // Eliminar planning existente si ya existe (idempotente)
      const existing = await Planning.findOne({
        where: { clientId: CLIENT_ID, year: 2026, month: semana.month, week: semana.week },
      });
      if (existing) {
        await Content.destroy({ where: { planningId: existing.id } });
        await existing.destroy();
        console.log(`   ♻️  Planning anterior eliminado`);
      }

      // Crear planning
      const planning = await Planning.create({
        clientId: CLIENT_ID,
        year: 2026,
        month: semana.month,
        week: semana.week,
        packageType: 'personalizado_7',
        distribution: semana.distribution,
        pieces: [],
        status: 'draft',
        generatedPrompt: `Lanzamiento RMP — ${semana.label}`,
      });
      console.log(`   ✅ Planning creado: ${planning.id}`);

      // Crear piezas de contenido
      for (const pieza of semana.contenido) {
        await Content.create({
          planningId: planning.id,
          format: pieza.format,
          funnelStage: pieza.funnelStage,
          title: pieza.title,
          hook: pieza.hook,
          copy: pieza.copy,
          cta: pieza.cta,
          hashtags: pieza.hashtags,
          visualDirection: pieza.visualDirection || null,
          script: pieza.script || null,
          carouselSlides: pieza.carouselSlides || null,
          order: pieza.order,
          status: 'generated',
          approvalStatus: 'pendiente',
        });
        console.log(`   📝 [${pieza.format.toUpperCase()}] ${pieza.title.substring(0, 50)}...`);
      }

      planningIds.push({ id: planning.id, label: semana.label });
    }

    // Exportar al Google Sheet
    console.log('\n📊 Exportando al Google Sheet de aprobaciones...\n');
    for (const { id, label } of planningIds) {
      try {
        const result = await exportToSheet(id);
        console.log(`   ✅ ${label}`);
        console.log(`      → ${result.sheetUrl}\n`);
      } catch (err) {
        console.error(`   ❌ Error exportando ${label}: ${err.message}`);
      }
    }

    console.log('\n🎉 ¡Listo! El plan de lanzamiento está cargado y en el Google Sheet.\n');
    console.log('IDs de las planeaciones creadas:');
    planningIds.forEach(({ id, label }) => console.log(`  ${label}: ${id}`));
    console.log('');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await sequelize.close();
  }
}

main();
