/**
 * Seed: Planeación Moni Grizales S5–S8 (Feb 23 – Mar 21, 2026)
 * Distribución por semana: 2 reels + 3 carruseles + 2 posts = 7 piezas
 *
 * Narrativa:
 *   S5 (Feb 23–28) — EL CUERPO TAMBIÉN HABLA            → Momento 2
 *   S6 (Mar  2–7)  — DE LA REACCIÓN A LA ELECCIÓN       → Momento 2
 *   S7 (Mar  9–14) — RECONOCIENDO MI PODER (anuncio)    → Momento 3
 *   S8 (Mar 16–21) — SEMANA DEL ENTRENAMIENTO (17–18)   → Momento 3 cierre
 */

require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Client   = require('../src/modules/clients/client.model');
const Planning = require('../src/modules/planning/planning.model');
const Content  = require('../src/modules/content/content.model');

// ─── DATOS ───────────────────────────────────────────────────────────────────

const HASHTAGS_CUERPO   = ['#SanacionInterior','#CuerpoEmocional','#MujerConsciente','#MujeresQueSanan','#TrabajoInterior','#ProcesoConsciente'];
const HASHTAGS_REGULACION = ['#OrdenInterno','#RegulaciónEmocional','#MujerConsciente','#EleccionConsciente','#MujeresQueSeEligen','#TrabajoInterior'];
const HASHTAGS_LANZAMIENTO = ['#ReconociendoMiPoder','#MujerConsciente','#MujeresQueSeEligen','#EspacioSeguro','#AcompanamientoFemenino','#CoachingParaMujeres','#EntrenamientoConsciente'];
const HASHTAGS_SISTEMA  = ['#SistemaFamiliar','#LealtadesInvisibles','#TomarTuLugar','#OrdenInterno','#MujerConsciente','#SanarDesdeRaiz'];

const WEEKS = [

  // ─────────────────────────────────────────────────────────────────────────
  // S5 — EL CUERPO TAMBIÉN HABLA  (Feb 23–28, 2026)
  // ─────────────────────────────────────────────────────────────────────────
  {
    year: 2026, month: 2, week: 4,
    label: 'S5 — El cuerpo también habla',
    distribution: { reels: 2, posts: 2, carruseles: 3, total: 7, tofu: 3, mofu: 3, bofu: 1 },
    pieces: [

      // REEL 1
      {
        format: 'reel', funnelStage: 'tofu', order: 1,
        title: 'El cuerpo guarda lo que la emoción no pudo decir',
        hook: 'El cuerpo no miente.',
        copy: 'El cuerpo no miente.\nNo todo el cansancio viene del hacer.\nA veces viene de cargar emociones que no tuvieron espacio.\nDe sostener lo que nunca se pudo decir.\nCuando una mujer aprende a callar,\nsu cuerpo aprende a guardar.\nY llega un momento en que el cuerpo habla\nporque el alma ya no puede más.\nEl síntoma no es debilidad.\nEs información.\nSi algo de esto te resonó,\nescríbeme "sí".',
        cta: '¿Tu cuerpo te está diciendo algo que todavía no escuchaste?',
        hashtags: HASHTAGS_CUERPO,
        visualDirection: 'Mónica hablando a cámara, plano medio, luz cálida, tono íntimo y contenedor',
        script: {
          scenes: [
            { scene: 1, description: 'Mirada directa, pausa breve antes de hablar', text: 'El cuerpo no miente.', duration: '4s' },
            { scene: 2, description: 'Tono íntimo, pausado', text: 'No todo el cansancio viene del hacer. A veces viene de cargar emociones que no tuvieron espacio. De sostener lo que nunca se pudo decir.', duration: '12s' },
            { scene: 3, description: 'Pausa, voz más suave', text: 'Cuando una mujer aprende a callar, su cuerpo aprende a guardar. Y llega un momento en que el cuerpo habla porque el alma ya no puede más.', duration: '12s' },
            { scene: 4, description: 'Cierre, mirada directa, tono empático', text: 'El síntoma no es debilidad. Es información. ¿Tu cuerpo te está diciendo algo que todavía no escuchaste? Escríbeme "sí".', duration: '8s' },
          ],
        },
      },

      // REEL 2
      {
        format: 'reel', funnelStage: 'tofu', order: 2,
        title: 'Lo que el cuerpo dice cuando el alma ya no puede más',
        hook: 'Hay cansancios que no desaparecen durmiendo.',
        copy: 'Hay cansancios que no desaparecen durmiendo.\nNo porque algo esté roto,\nsino porque el origen no está en el cuerpo.\nEstá en lo que cargas.\nEn lo que guardaste.\nEn lo que no pudiste decir.\nCuando el cuerpo habla con síntomas,\nno es para que sigas aguantando.\nEs para que escuches.\nSi esto te hace sentido,\nescríbeme "sí".',
        cta: 'Si tu cuerpo te está hablando, escríbeme "sí".',
        hashtags: HASHTAGS_CUERPO,
        visualDirection: 'Tono sereno, plano cercano, luz difusa. Habla despacio como si le hablara a una sola persona.',
        script: {
          scenes: [
            { scene: 1, description: 'Plano medio, pausa antes del hook', text: 'Hay cansancios que no desaparecen durmiendo.', duration: '4s' },
            { scene: 2, description: 'Desarrollo pausado, voz cálida', text: 'No porque algo esté roto, sino porque el origen no está en el cuerpo. Está en lo que cargas. En lo que guardaste. En lo que no pudiste decir.', duration: '14s' },
            { scene: 3, description: 'Cierre íntimo, mirada directa', text: 'Cuando el cuerpo habla con síntomas, no es para que sigas aguantando. Es para que escuches. Si esto te hace sentido, escríbeme "sí".', duration: '10s' },
          ],
        },
      },

      // CARRUSEL 1
      {
        format: 'carrusel', funnelStage: 'tofu', order: 3,
        title: 'Lo que tu cuerpo intenta decirte (y no siempre escuchamos)',
        hook: 'Tu cuerpo intenta decirte algo...',
        copy: 'Hay síntomas que no se entienden desde la medicina.\nHay cansancios que no desaparecen con descanso.\nHay ansiedades que no tienen causa "lógica".\nY no es que algo esté mal contigo.\nEs que tu cuerpo está guardando lo que la emoción no pudo expresar.\nEl nudo en la garganta cuando dices "sí" sin querer.\nLa tensión en los hombros cuando sostienes demasiado.\nLa fatiga profunda después de dar todo de ti.\nEstos no son señales de debilidad.\nSon señales de que algo necesita espacio.\nTu cuerpo no traiciona. Informa.\nEscucharlo también es una forma de sanarte.\nSi mientras leías sentiste algo, escríbeme "sí".',
        cta: 'Escríbeme "sí".',
        hashtags: HASHTAGS_CUERPO,
        visualDirection: 'Fondo arena clara, tipografía Cormorant Garamond para títulos, Montserrat para cuerpo. Paleta malva/ciruela/arena.',
        carouselSlides: {
          slides: [
            { slide: 1, title: 'Lo que tu cuerpo intenta decirte…', text: '(y no siempre escuchamos)', visualNote: 'Portada con fondo malva suave, título grande en Cormorant' },
            { slide: 2, title: 'El cansancio que no desaparece durmiendo', text: 'Cuando descansas y sigues cansada, el mensaje no viene del cuerpo. Viene de lo que cargas.', visualNote: 'Fondo arena, texto oscuro' },
            { slide: 3, title: 'La ansiedad que no tiene nombre', text: 'Esa sensación de alerta constante sin saber por qué. El cuerpo está guardando algo que no pudo ser dicho.', visualNote: '' },
            { slide: 4, title: 'El nudo en la garganta', text: 'Aparece cuando dices "sí" sin querer. Cuando callas lo que sientes. El cuerpo lo registra todo.', visualNote: '' },
            { slide: 5, title: 'La tensión en los hombros', text: 'El lugar donde muchas mujeres cargan lo que sostienen. Lo que le corresponde a otros. Lo que no se puede soltar.', visualNote: '' },
            { slide: 6, title: 'La desconexión que llega', text: 'Cuando das demasiado, el cuerpo se desconecta para protegerte. No es frialdad. Es supervivencia.', visualNote: '' },
            { slide: 7, title: 'El bloqueo cada vez que intentas avanzar', text: 'Cuando sabes lo que quieres pero algo te frena. Hay una historia que todavía pide ser mirada.', visualNote: '' },
            { slide: 8, title: 'El cuerpo no falla. Informa.', text: 'Escucharlo también es sanar.\nSi esto te resonó, escríbeme "sí".', visualNote: 'Fondo malva suave, texto claro, CTA visible' },
          ],
        },
      },

      // CARRUSEL 2
      {
        format: 'carrusel', funnelStage: 'mofu', order: 4,
        title: 'La historia que tu cuerpo guarda sin que lo sepas',
        hook: 'El cuerpo recuerda lo que la mente prefiere olvidar.',
        copy: 'El cuerpo no guarda solo lo que pasó en el presente.\nGuarda la historia.\nLos mandatos aprendidos.\nLas emociones que no tuvieron espacio.\nLos límites que no se pudieron poner.\nCada tensión tiene una raíz.\nCada síntoma tiene un mensaje.\nCuando empiezas a mirar la historia,\nel cuerpo empieza a soltar.\nSi esto te resonó, escríbeme "sí".',
        cta: 'Escríbeme "sí".',
        hashtags: [...HASHTAGS_CUERPO, '#SistemaFamiliar'],
        visualDirection: 'Slides en alternancia fondo arena/fondo malva. Línea de acento ciruela en cada slide.',
        carouselSlides: {
          slides: [
            { slide: 1, title: 'La historia que tu cuerpo guarda', text: 'sin que siempre lo sepas', visualNote: 'Portada fondo ciruela apagado, texto arena' },
            { slide: 2, title: 'El mandato que no pudiste decir', text: '→ se quedó en los hombros.\nEsa tensión que no desaparece tiene una historia detrás.', visualNote: '' },
            { slide: 3, title: 'El límite que no pusiste', text: '→ se quedó en el estómago.\nCada vez que dijiste "sí" sin querer, el cuerpo lo registró.', visualNote: '' },
            { slide: 4, title: 'La emoción que callaste', text: '→ se quedó en el pecho.\nLo que no se expresa no desaparece. Se transforma en síntoma.', visualNote: '' },
            { slide: 5, title: 'La historia familiar que heredaste', text: 'A veces cargamos dolores que no vivimos pero que el sistema nos pasó.\nEl cuerpo también guarda eso.', visualNote: '' },
            { slide: 6, title: 'No es hipocondría', text: 'Es historia no procesada.\nEl síntoma no miente. Pide ser escuchado.', visualNote: '' },
            { slide: 7, title: 'Cuando empiezas a mirar la historia', text: 'el cuerpo empieza a soltar.\nNo de golpe. Pero empieza.', visualNote: '' },
            { slide: 8, title: 'El cuerpo habla el lenguaje de la historia.', text: 'Aprender a escucharlo cambia todo.\nSi esto te tocó, escríbeme "sí".', visualNote: 'Fondo ciruela, texto arena, CTA' },
          ],
        },
      },

      // CARRUSEL 3
      {
        format: 'carrusel', funnelStage: 'mofu', order: 5,
        title: '¿Cómo reconocer el cansancio emocional?',
        hook: 'El cansancio emocional no siempre se ve. Pero siempre se siente.',
        copy: 'El cansancio emocional no llega siempre como llanto.\nA veces llega disfrazado de normalidad.\nDe "puedo con todo".\nDe "no es para tanto".\nPero el cuerpo lo sabe.\nY en algún momento, lo dice.\nSi mientras leías algún slide dijiste "esto soy yo"…\nes que algo en ti ya sabe que necesita otro orden.\nEscríbeme "sí".',
        cta: 'Escríbeme "sí".',
        hashtags: HASHTAGS_CUERPO,
        visualDirection: 'Paleta suave, tipografía elegante. Slides de diagnóstico emocional sin dramatismo.',
        carouselSlides: {
          slides: [
            { slide: 1, title: '¿Cómo reconocer el cansancio emocional?', text: 'No siempre se ve. Pero siempre se siente.', visualNote: 'Portada fondo malva, texto claro' },
            { slide: 2, title: 'No siempre llega como derrumbe', text: 'A veces llega como una desconexión suave.\nComo estar presente pero no estar.', visualNote: '' },
            { slide: 3, title: 'Como falta de deseo', text: 'De hacer cosas que antes te gustaban.\nEl alma pide un descanso que el cuerpo no puede darse.', visualNote: '' },
            { slide: 4, title: 'Como ganas de desaparecer un rato', text: 'No de nada dramático.\nSolo necesitar que el mundo pare un momento.', visualNote: '' },
            { slide: 5, title: 'Como la sonrisa que no siempre es real', text: 'Cuando afuera todo "está bien"\ny adentro algo lleva mucho tiempo sin estarlo.', visualNote: '' },
            { slide: 6, title: 'Como el cuerpo que no quiere levantarse', text: 'Aunque hayas dormido las horas.\nPorque el cansancio no es físico.', visualNote: '' },
            { slide: 7, title: 'Como la irritabilidad sin causa', text: 'Cuando te molestas por cosas pequeñas\nporque el sistema ya está saturado.', visualNote: '' },
            { slide: 8, title: 'No es debilidad. Es una señal.', text: 'Escucharla es el primer paso.\nSi algo de esto te resonó, escríbeme "sí".', visualNote: 'Cierre fondo ciruela, texto arena' },
          ],
        },
      },

      // POST 1
      {
        format: 'post', funnelStage: 'tofu', order: 6,
        title: 'A veces lo que sientes en el cuerpo es lo que no pudiste decir con palabras',
        hook: 'A veces lo que sientes en el cuerpo es lo que no pudiste decir con palabras.',
        copy: 'A veces lo que sientes en el cuerpo\nes lo que no pudiste decir con palabras.\nLa tensión en el cuello.\nEl peso en el pecho.\nEl cansancio sin causa visible.\nNo siempre es casualidad.\nMuchas mujeres aprendieron muy temprano\nque sus emociones eran demasiado.\nQue era mejor aguantar, callar, sostenerse.\nY el cuerpo lo aprendió también.\nEscucharte\nno es dramatizar.\nEs empezar a sanar desde adentro.\nSi esto te tocó,\nescríbeme "sí".',
        cta: 'Escríbeme "sí".',
        hashtags: HASHTAGS_CUERPO,
        visualDirection: 'Post fondo arena clara. Hook en recuadro malva suave. Línea separadora ciruela. Cormorant Garamond para el hook.',
      },

      // POST 2
      {
        format: 'post', funnelStage: 'mofu', order: 7,
        title: 'No todo síntoma físico empieza en el cuerpo',
        hook: 'No todo síntoma físico empieza en el cuerpo.',
        copy: 'No todo síntoma físico empieza en el cuerpo.\nAlgunos empiezan en la historia.\nEn las palabras que no se dijeron.\nEn las emociones que no tuvieron espacio.\nEn los roles que se asumieron\nsin que nadie te preguntara si podías cargarlos.\nEl cuerpo es territorio.\nY como todo territorio,\nguarda lo que pasó por él.\nEscucharlo con curiosidad,\nno con miedo,\ncambia todo.\nSi este mensaje llegó a ti,\nescríbeme "sí".',
        cta: 'Escríbeme "sí".',
        hashtags: [...HASHTAGS_CUERPO, '#SistemaFamiliar'],
        visualDirection: 'Post fondo arena. Hook en recuadro malva. Botón CTA ciruela apagado.',
      },

    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // S6 — DE LA REACCIÓN A LA ELECCIÓN  (Mar 2–7, 2026)
  // ─────────────────────────────────────────────────────────────────────────
  {
    year: 2026, month: 3, week: 1,
    label: 'S6 — De la reacción a la elección',
    distribution: { reels: 2, posts: 2, carruseles: 3, total: 7, tofu: 2, mofu: 3, bofu: 2 },
    pieces: [

      // REEL 1
      {
        format: 'reel', funnelStage: 'mofu', order: 1,
        title: 'Una mujer que no puede regularse, no elige: reacciona',
        hook: 'Una mujer que no puede regularse, no elige: reacciona.',
        copy: '"Una mujer que no puede regularse, no elige: reacciona."\nNo es falta de voluntad.\nNo es debilidad.\nEs un sistema nervioso que aprendió a sobrevivir\nantes de aprender a elegir.\nRegularse no es callarse.\nEs hacer una pausa\nentre lo que sientes\ny lo que decides.\nEsa pausa lo cambia todo.\nSi este mensaje tocó algo en ti,\nescríbeme "sí".',
        cta: '¿Estás reaccionando o estás eligiendo? Escríbeme "sí".',
        hashtags: HASHTAGS_REGULACION,
        visualDirection: 'Cámara frontal, plano medio, tono directo y sereno. Pausa larga antes del hook. Voz firme pero sin dureza.',
        script: {
          scenes: [
            { scene: 1, description: 'Pausa larga, mirada firme, silencio antes de hablar', text: 'Una mujer que no puede regularse…', duration: '4s' },
            { scene: 2, description: 'Continuación directa', text: '…no elige. Reacciona. Reacciona ante lo que le duele. Ante lo que le falta. Ante lo que le recuerda algo que aún no está ordenado. No porque quiera. Sino porque su sistema nervioso aprendió a sobrevivir así.', duration: '18s' },
            { scene: 3, description: 'Cambio de ritmo, más suave', text: 'Regularse no es callarse. No es aguantar más. Es aprender a hacer una pausa entre lo que sientes y lo que decides hacer. Esa pausa es el poder.', duration: '12s' },
            { scene: 4, description: 'Cierre directo, mirada empática', text: '¿Estás reaccionando o estás eligiendo? Si esto te hace pensar, escríbeme "sí".', duration: '8s' },
          ],
        },
      },

      // REEL 2
      {
        format: 'reel', funnelStage: 'mofu', order: 2,
        title: 'La pausa que lo cambia todo',
        hook: '¿Y si el cambio no es hacer más, sino parar un segundo?',
        copy: '¿Y si el cambio no es hacer más, sino pausar un segundo?\nHay una fracción de tiempo\nentre lo que sientes\ny lo que haces.\nEsa fracción es donde vives tú.\nO donde vive el mandato.\nCuando empiezas a hacer una pausa,\nempiezas a elegir.\nNo lo que el miedo pide.\nNo lo que el sistema espera.\nLo que tú, desde tu centro, decides.\nSi esto te resonó, escríbeme "sí".',
        cta: 'Escríbeme "sí".',
        hashtags: HASHTAGS_REGULACION,
        visualDirection: 'Selfie cercano, luz natural. Habla como si le hablara a una amiga. Sin guion rígido, fluido.',
        script: {
          scenes: [
            { scene: 1, description: 'Tono reflexivo, pausa al inicio', text: '¿Y si el cambio no es hacer más, sino parar un segundo?', duration: '5s' },
            { scene: 2, description: 'Desarrollo pausado', text: 'Hay una fracción de tiempo entre lo que sientes y lo que haces. Esa fracción es donde vives tú. O donde vive el mandato.', duration: '12s' },
            { scene: 3, description: 'Suave pero firme', text: 'Cuando empiezas a hacer una pausa, empiezas a elegir. No lo que el miedo pide. Lo que tú, desde tu centro, decides.', duration: '12s' },
            { scene: 4, description: 'Cierre', text: 'Esa pausa lo cambia todo. Si esto te resonó, escríbeme "sí".', duration: '5s' },
          ],
        },
      },

      // CARRUSEL 1
      {
        format: 'carrusel', funnelStage: 'mofu', order: 3,
        title: 'De la reacción a la elección: lo que cambia cuando te regulas',
        hook: 'Antes y después de la regulación.',
        copy: 'La diferencia entre reaccionar y elegir\nno está en la fuerza de voluntad.\nEstá en la regulación.\nUna mujer regulada no es una mujer que no siente.\nEs una mujer que puede hacer una pausa\nentre lo que siente y lo que hace.\nEsa pausa es lo que cambia el patrón.\nEsa pausa es lo que permite elegir.\nNo lo que el miedo pide.\nNo lo que el mandato indica.\nLo que tú, desde tu centro, decides.\nSi mientras leías algo se movió en ti,\nescríbeme "sí".',
        cta: 'Escríbeme "sí".',
        hashtags: HASHTAGS_REGULACION,
        visualDirection: 'Slides en contraste: un lado "antes" (fondo más oscuro/ciruela), otro lado "después" (fondo arena). Visual limpio.',
        carouselSlides: {
          slides: [
            { slide: 1, title: 'De la reacción a la elección', text: 'Lo que cambia cuando te regulas', visualNote: 'Portada fondo ciruela apagado, letras claras' },
            { slide: 2, title: 'Antes: reaccionas desde la herida.', text: 'Después: respondes desde el centro.', visualNote: 'Fondo arena, dos líneas en contraste' },
            { slide: 3, title: 'Antes: dices "sí" por miedo al conflicto.', text: 'Después: dices "sí" porque lo eliges.', visualNote: '' },
            { slide: 4, title: 'Antes: el cuerpo se tensa y actúas desde ahí.', text: 'Después: el cuerpo habla y tú escuchas.', visualNote: '' },
            { slide: 5, title: 'Antes: cargas sola y en silencio.', text: 'Después: pides lo que necesitas.', visualNote: '' },
            { slide: 6, title: 'Antes: te defines por lo que das.', text: 'Después: te reconoces por lo que eres.', visualNote: '' },
            { slide: 7, title: 'Antes: el mandato decide.', text: 'Después: tú decides.', visualNote: '' },
            { slide: 8, title: 'Regularte no es controlarte.', text: 'Es recuperar tu capacidad de elegir.\nSi esto te resonó, escríbeme "sí".', visualNote: 'Cierre fondo malva, texto claro' },
          ],
        },
      },

      // CARRUSEL 2
      {
        format: 'carrusel', funnelStage: 'tofu', order: 4,
        title: 'Señales de que tu sistema nervioso necesita regulación',
        hook: 'Tu sistema nervioso habla. ¿Estás escuchando?',
        copy: 'Muchas mujeres viven en estado de alerta\nsin saber que su sistema nervioso está saturado.\nNo es drama. No es exageración.\nEs el resultado de años sosteniendo\nlo que era demasiado para una sola persona.\nSi te reconoces en algo de lo que vas a leer,\nno es que estés rota.\nEs que tu sistema aprendió a sobrevivir.\nY puede aprender otra cosa.\nEscríbeme "sí" si esto te hace sentido.',
        cta: 'Escríbeme "sí".',
        hashtags: HASHTAGS_REGULACION,
        visualDirection: 'Slides de diagnóstico suave. Tipografía clara, sin alarmar. Tono compasivo.',
        carouselSlides: {
          slides: [
            { slide: 1, title: 'Señales de que tu sistema nervioso necesita regulación', text: '', visualNote: 'Portada fondo malva, texto claro' },
            { slide: 2, title: 'Te irritas fácilmente sin saber por qué', text: 'No es que seas difícil. El sistema está saturado.', visualNote: '' },
            { slide: 3, title: 'Te quedas paralizada cuando hay conflicto', text: 'Congelar también es una respuesta de supervivencia. No es cobardía.', visualNote: '' },
            { slide: 4, title: 'Dices "sí" cuando quieres decir "no"', text: 'Para evitar tensión, para no incomodar, para que todo esté bien. El cuerpo paga el precio.', visualNote: '' },
            { slide: 5, title: 'Te explicas de más cuando pones un límite', text: 'Como si necesitaras justificarte para merecer decir "no".', visualNote: '' },
            { slide: 6, title: 'Sientes que todo depende de ti', text: 'Hipervigilancia. El sistema nervioso en modo protección permanente.', visualNote: '' },
            { slide: 7, title: 'El descanso nunca alcanza', text: 'Porque el cansancio no es físico. Es del sistema.', visualNote: '' },
            { slide: 8, title: 'No estás rota.', text: 'Tu sistema aprendió a sobrevivir.\nY puede aprender otra cosa.\nEscríbeme "sí" si esto te resuena.', visualNote: 'Cierre fondo ciruela, mensaje esperanzador' },
          ],
        },
      },

      // CARRUSEL 3
      {
        format: 'carrusel', funnelStage: 'mofu', order: 5,
        title: 'Qué significa regularse de verdad',
        hook: 'Regularse no es callarse. Es algo completamente diferente.',
        copy: 'Hay mucha confusión sobre lo que significa regularse.\nNo es aguantar más en silencio.\nNo es reprimir lo que sientes.\nNo es forzar la calma.\nEs otra cosa.\nEs aprender a hacer una pausa,\na conectar con el cuerpo,\na reconocer el patrón antes de repetirlo.\nEsa es la regulación real.\nY esa regulación cambia cómo vives.\nSi esto te resuena, escríbeme "sí".',
        cta: 'Escríbeme "sí".',
        hashtags: HASHTAGS_REGULACION,
        visualDirection: 'Slides educativos, tipografía limpia. Contraste entre lo que NO es y lo que SÍ es regularse.',
        carouselSlides: {
          slides: [
            { slide: 1, title: 'Qué significa regularse de verdad', text: '(y qué NO significa)', visualNote: 'Portada fondo arena, tipografía Cormorant' },
            { slide: 2, title: 'No es callarse ni aguantar más', text: 'Aguantar en silencio no es regulación. Es represión. Y tiene costo.', visualNote: '' },
            { slide: 3, title: 'No es suprimir lo que sientes', text: 'Las emociones suprimidas no desaparecen. Se guardan en el cuerpo.', visualNote: '' },
            { slide: 4, title: 'No es controlarse a la fuerza', text: 'El control forzado agota. La regulación real no agota: libera.', visualNote: '' },
            { slide: 5, title: 'Regularse SÍ es hacer una pausa', text: 'Entre el estímulo y la respuesta. Esa pausa es donde vives tú.', visualNote: 'Separador visual aquí' },
            { slide: 6, title: 'Regularse SÍ es conectar con el cuerpo', text: 'Sentir antes de actuar. Escuchar antes de responder.', visualNote: '' },
            { slide: 7, title: 'Regularse SÍ es reconocer el patrón', text: 'Ver el patrón antes de repetirlo. Eso es conciencia. Eso es poder.', visualNote: '' },
            { slide: 8, title: 'Regularte es recuperar tu capacidad de elegir.', text: 'Eso es poder real.\nSi esto te resonó, escríbeme "sí".', visualNote: 'Cierre fondo malva' },
          ],
        },
      },

      // POST 1
      {
        format: 'post', funnelStage: 'mofu', order: 6,
        title: 'Regularte no es callarte. Es aprender a elegir desde otro lugar.',
        hook: 'Regularte no es callarte. Es aprender a elegir desde otro lugar.',
        copy: 'Regularte no es aguantar más.\nNo es callarte para no generar conflicto.\nNo es volverte insensible.\nEs aprender a hacer una pausa\nentre lo que sientes\ny cómo respondes.\nMuchas mujeres creen que reaccionar fuerte\nes ser auténtica.\nY a veces sí.\nPero otras veces\nes el patrón hablando,\nno tú.\nCuando empiezas a regularte,\nno te vacías.\nTe recuperas.\nSi este mensaje llegó a ti,\nescríbeme "sí".',
        cta: 'Escríbeme "sí".',
        hashtags: HASHTAGS_REGULACION,
        visualDirection: 'Post fondo arena. Hook en recuadro malva. Diseño limpio, tipografía elegante.',
      },

      // POST 2
      {
        format: 'post', funnelStage: 'tofu', order: 7,
        title: 'El poder no es control. Es presencia.',
        hook: 'El poder no es control. Es presencia.',
        copy: 'El poder no es controlar tus emociones.\nNo es demostrar que puedes con todo.\nNo es estar siempre firme.\nEl poder es presencia.\nEs estar en ti,\nen tu cuerpo,\nen tu historia,\nincluso cuando duele.\nUna mujer presente\nno reacciona desde la herida.\nResponde desde su centro.\nEso no se aprende de un día para otro.\nPero se aprende.\nSi esto te tocó,\nescríbeme "sí".',
        cta: 'Escríbeme "sí".',
        hashtags: [...HASHTAGS_REGULACION, '#OrdenInterno'],
        visualDirection: 'Post fondo arena. Hook con recuadro malva. Línea ciruela. Botón CTA ciruela apagado.',
      },

    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // S7 — RECONOCIENDO MI PODER — ANUNCIO OFICIAL  (Mar 9–14, 2026)
  // ─────────────────────────────────────────────────────────────────────────
  {
    year: 2026, month: 3, week: 2,
    label: 'S7 — Reconociendo mi poder (anuncio)',
    distribution: { reels: 2, posts: 2, carruseles: 3, total: 7, tofu: 1, mofu: 2, bofu: 4 },
    pieces: [

      // REEL 1
      {
        format: 'reel', funnelStage: 'bofu', order: 1,
        title: 'Hay un momento en que seguir igual ya no es opción',
        hook: 'Hay un momento en que seguir igual ya no es opción.',
        copy: 'Hay un momento en que seguir igual ya no es opción.\nNo porque todo esté mal,\nsino porque tú ya no eres la misma.\nLlevas semanas mirando tus mandatos,\ntus cargas heredadas,\ntu cuerpo, tu lugar.\nEso no es casualidad.\nPor eso creé Reconociendo mi poder.\nUn espacio para mujeres\nque están listas para dejar el deber\ny empezar la elección.\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nSi sientes que este espacio es para ti,\nescríbeme PODER.',
        cta: 'Escríbeme PODER.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Selfie cercano, luz cálida. Tono íntimo pero con convicción. Pausa larga antes del hook.',
        script: {
          scenes: [
            { scene: 1, description: 'Pausa, mirada directa a cámara', text: 'Hay un momento en que seguir igual ya no es opción.', duration: '5s' },
            { scene: 2, description: 'Desarrollo pausado', text: 'No porque todo esté mal, sino porque tú ya no eres la misma. Llevas semanas mirando tus mandatos, tus cargas heredadas, tu cuerpo, tu lugar.', duration: '12s' },
            { scene: 3, description: 'Puente al entrenamiento, tono cálido y directo', text: 'Eso no es casualidad. Por eso creé Reconociendo mi poder. Un espacio para mujeres que están listas para dejar el deber y empezar la elección.', duration: '14s' },
            { scene: 4, description: 'Cierre claro con fechas', text: 'El 17 y 18 de marzo, de 6:30 a 9:30 pm. Si sientes que este espacio es para ti, escríbeme PODER y te cuento todo.', duration: '10s' },
          ],
        },
      },

      // REEL 2
      {
        format: 'reel', funnelStage: 'bofu', order: 2,
        title: '¿Estás lista para dejar el deber y empezar la elección?',
        hook: '¿Cuántos años llevas viviendo para cumplir?',
        copy: '¿Cuántos años llevas viviendo para cumplir?\nPara sostener.\nPara no incomodar.\nPara ser la fuerte.\nHay mujeres que hacen eso durante décadas\nsin preguntarse una vez:\n¿qué quiero yo?\nReconociendo mi poder es un espacio para esa pregunta.\nPara empezar a responderla.\nCon honestidad, con acompañamiento, con orden.\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER y lo vemos juntas.',
        cta: 'Escríbeme PODER.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Tono cálido y cercano. Hablar como si le hablara directamente a la mujer que siente esto. Sin distancia.',
        script: {
          scenes: [
            { scene: 1, description: 'Hook directo', text: '¿Cuántos años llevas viviendo para cumplir?', duration: '4s' },
            { scene: 2, description: 'Lista de roles', text: 'Para sostener. Para no incomodar. Para ser la fuerte. Hay mujeres que hacen eso durante décadas sin preguntarse una vez: ¿qué quiero yo?', duration: '15s' },
            { scene: 3, description: 'Presentación del espacio', text: 'Reconociendo mi poder es un espacio para esa pregunta. Para empezar a responderla con honestidad, con acompañamiento, con orden.', duration: '12s' },
            { scene: 4, description: 'Cierre con fecha y CTA', text: '17 y 18 de marzo, 6:30 a 9:30 pm. Escríbeme PODER y lo vemos juntas.', duration: '8s' },
          ],
        },
      },

      // CARRUSEL 1
      {
        format: 'carrusel', funnelStage: 'bofu', order: 3,
        title: 'Reconocer tu poder no es imponerte',
        hook: 'Reconocer tu poder no es imponerte.',
        copy: 'Reconocer tu poder no es imponerte,\nni volverte dura, ni dejar de amar.\nEs dejar de abandonarte.\nEs regular tu emoción y elegir desde tu centro.\nEs ocupar tu lugar sin culpa.\nTodo lo que hablamos estas semanas tiene un hilo.\nY ese hilo es Reconociendo mi poder.\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER y te cuento todo.',
        cta: 'Escríbeme PODER.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Carrusel elegante, paleta completa de marca. Slide final con fechas y CTA destacado.',
        carouselSlides: {
          slides: [
            { slide: 1, title: 'Reconocer tu poder no es imponerte', text: '', visualNote: 'Portada fondo ciruela apagado, tipografía Cormorant grande' },
            { slide: 2, title: 'No es levantar la voz para que te escuchen.', text: '', visualNote: 'Fondo arena, texto ciruela' },
            { slide: 3, title: 'No es endurecerte para sobrevivir.', text: '', visualNote: '' },
            { slide: 4, title: 'No es dejar de amar para protegerte.', text: '', visualNote: '' },
            { slide: 5, title: 'Reconocer tu poder es dejar de abandonarte.', text: '', visualNote: 'Fondo malva, slide de transición' },
            { slide: 6, title: 'Es regular la emoción y elegir desde el centro.', text: '', visualNote: '' },
            { slide: 7, title: 'Es ocupar tu lugar sin culpa.', text: '', visualNote: '' },
            { slide: 8, title: 'Es honrar tu historia sin repetirla.', text: '', visualNote: '' },
            { slide: 9, title: 'El poder real no empuja. Se sostiene.', text: '', visualNote: '' },
            { slide: 10, title: '✨ Reconociendo mi poder', text: '📅 17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER si sientes que este proceso es para ti.', visualNote: 'Cierre fondo ciruela, texto arena, CTA grande' },
          ],
        },
      },

      // CARRUSEL 2
      {
        format: 'carrusel', funnelStage: 'bofu', order: 4,
        title: '¿Para quién es Reconociendo mi poder?',
        hook: '¿Para quién es Reconociendo mi poder?',
        copy: 'Reconociendo mi poder no es para todas.\nNo porque unas merezcan más que otras.\nSino porque requiere una disposición particular.\nLa disposición de mirarse.\nDe hacer preguntas incómodas.\nDe estar presente incluso cuando duele.\nSi al leer esto sientes un "sí" interno,\nese sí sabe.\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER.',
        cta: 'Escríbeme PODER.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Slides de identificación. La mujer se reconoce en cada descripción.',
        carouselSlides: {
          slides: [
            { slide: 1, title: '¿Para quién es Reconociendo mi poder?', text: '', visualNote: 'Portada fondo malva' },
            { slide: 2, title: 'Para la mujer que se cansó de dar siempre al final', text: 'Que pone las necesidades de todos antes que las propias y ya no puede más.', visualNote: '' },
            { slide: 3, title: 'Para quien siente que algo se apagó', text: 'Y quiere volver a sí. Sin saber exactamente cómo, pero con ganas de empezar.', visualNote: '' },
            { slide: 4, title: 'Para quien lleva años sosteniendo mandatos que no eligió', text: '"Ser fuerte". "No pedir". "No incomodar". Esos mandatos tienen nombre.', visualNote: '' },
            { slide: 5, title: 'Para quien sabe que reacciona y quiere aprender a elegir', text: 'Que ve el patrón pero todavía no sabe cómo salir de él.', visualNote: '' },
            { slide: 6, title: 'Para quien está lista para tomar su lugar', text: 'No para imponerse. Para dejar de desaparecer.', visualNote: '' },
            { slide: 7, title: 'No es para quien busca fórmulas.', text: 'Es para quien está lista para mirarse con honestidad.', visualNote: '' },
            { slide: 8, title: '📅 17 y 18 de marzo · 6:30 – 9:30 pm', text: 'Si algo dentro de ti dice "esto soy yo", escríbeme PODER.', visualNote: 'Cierre fondo ciruela, CTA destacado' },
          ],
        },
      },

      // CARRUSEL 3
      {
        format: 'carrusel', funnelStage: 'bofu', order: 5,
        title: 'Lo que trabajamos en Reconociendo mi poder',
        hook: 'Lo que trabajamos en Reconociendo mi poder.',
        copy: 'Reconociendo mi poder no es motivación.\nNo es teoría.\nEs un proceso que trabaja desde la historia,\ndesde el cuerpo,\ndesde el sistema familiar.\nNo se trata de cambiarte.\nSe trata de reconocerte.\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER y te cuento cómo participar.',
        cta: 'Escríbeme PODER.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Carrusel informativo, estructurado, paleta completa de marca.',
        carouselSlides: {
          slides: [
            { slide: 1, title: 'Lo que trabajamos en Reconociendo mi poder', text: '', visualNote: 'Portada fondo ciruela, Cormorant bold' },
            { slide: 2, title: 'Tu historia personal y los mandatos heredados', text: 'Los "deberías" que aprendiste y que todavía guían sin que lo elijas.', visualNote: '' },
            { slide: 3, title: 'Las lealtades invisibles', text: 'Lo que cargas por amor al sistema familiar. Lo que no es tuyo pero que asumiste.', visualNote: '' },
            { slide: 4, title: 'Tu cuerpo como territorio', text: 'Lo que guarda. Lo que dice. Cómo empezar a escucharlo.', visualNote: '' },
            { slide: 5, title: 'La diferencia entre reaccionar y elegir', text: 'La pausa. La regulación. El acceso al poder real.', visualNote: '' },
            { slide: 6, title: 'Tomar el lugar que te corresponde', text: 'En el sistema. En tus vínculos. En tu propia vida.', visualNote: '' },
            { slide: 7, title: 'No es teoría. Es proceso.', text: 'Acompañado, respetuoso, profundo. A tu ritmo.', visualNote: '' },
            { slide: 8, title: '📅 17 y 18 de marzo · 6:30 – 9:30 pm', text: 'Solo para mujeres.\nEscríbeme PODER y te cuento todo.', visualNote: 'Cierre fondo malva, CTA ciruela' },
          ],
        },
      },

      // POST 1 — INFORMATIVO
      {
        format: 'post', funnelStage: 'bofu', order: 6,
        title: 'Presentación oficial de Reconociendo mi poder',
        hook: 'Quiero presentarte Reconociendo mi poder.',
        copy: 'Durante estas semanas hemos hablado de mandatos femeninos,\nde cargas heredadas,\ndel cuerpo como territorio,\nde la diferencia entre reaccionar y elegir,\nde tomar el lugar que te corresponde.\nTodo eso tiene un hilo.\nPor eso quiero presentarte formalmente\nReconociendo mi poder.\nNo es motivación. No es teoría.\nEs un espacio de acompañamiento profundo\npara mujeres que sienten\nque ya no quieren seguir viviendo en automático.\nAquí trabajamos:\n— Historia personal y mandatos\n— Lealtades invisibles y cargas heredadas\n— Regulación emocional\n— Tomar el lugar en el sistema\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\n💛 Solo para mujeres\nSi sientes que este espacio es para ti,\nescríbeme PODER\ny te envío la información completa.',
        cta: 'Escríbeme PODER.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Post fondo arena. Hook con recuadro malva. Info estructurada con Montserrat. CTA botón ciruela.',
      },

      // POST 2 — EMOCIONAL
      {
        format: 'post', funnelStage: 'bofu', order: 7,
        title: 'Este espacio no es para todas. Es para quien ya está lista.',
        hook: 'Este espacio no es para todas. Es para quien ya está lista.',
        copy: 'Este espacio no es para todas.\nNo es para quien quiere un cambio rápido.\nNi para quien busca una fórmula.\nEs para quien ya se cansó de sostener lo que no le corresponde.\nPara quien siente que algo se apagó\ny quiere volver a sí.\nPara la mujer que ya reconoce sus mandatos\ny quiere empezar a soltar.\nPara quien sabe que reacciona\ny quiere aprender a elegir.\nPara quien está lista para tomar su lugar.\nSi al leer esto sentiste un "sí" interno,\neste espacio es para ti.\n✨ Reconociendo mi poder\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER y lo vemos juntas.',
        cta: 'Escríbeme PODER.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Post fondo arena. Hook en recuadro ciruela apagado (más oscuro). Diseño contenedor y elegante.',
      },

    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // S8 — SEMANA DEL ENTRENAMIENTO  (Mar 16–21, 2026)
  // ─────────────────────────────────────────────────────────────────────────
  {
    year: 2026, month: 3, week: 3,
    label: 'S8 — Semana del entrenamiento (17–18 mar)',
    distribution: { reels: 2, posts: 2, carruseles: 3, total: 7, tofu: 0, mofu: 1, bofu: 6 },
    pieces: [

      // REEL 1 — PRE-ENTRENAMIENTO
      {
        format: 'reel', funnelStage: 'bofu', order: 1,
        title: 'Mañana empieza — previo al entrenamiento',
        hook: 'Mañana empieza.',
        copy: 'Mañana empieza.\nReconociendo mi poder.\nPara las mujeres que dijeron "sí"\ncuando algo dentro de ellas lo pedía.\nPara las que llegaron cansadas de sostener.\nPara las que quieren volver a sí.\nEstoy lista para sostener este proceso con ustedes.\nNos vemos mañana, 6:30 pm.\nSi todavía quieres participar,\nescríbeme PODER ahora.',
        cta: 'Escríbeme PODER ahora.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Publicar el 16 de marzo. Tono emocional, agradecido. Mónica hablando desde el corazón.',
        script: {
          scenes: [
            { scene: 1, description: 'Emoción contenida, pausa', text: 'Mañana empieza.', duration: '4s' },
            { scene: 2, description: 'Para las mujeres que vienen', text: 'Reconociendo mi poder. Para las mujeres que dijeron "sí" cuando algo dentro de ellas lo pedía. Para las que llegaron cansadas de sostener.', duration: '12s' },
            { scene: 3, description: 'Cierre con invitación de último momento', text: 'Estoy lista para sostener este proceso con ustedes. Si todavía quieres participar, escríbeme PODER ahora. Nos vemos mañana, 6:30 pm.', duration: '10s' },
          ],
        },
      },

      // REEL 2 — POST-ENTRENAMIENTO
      {
        format: 'reel', funnelStage: 'bofu', order: 2,
        title: 'Algo se movió — post entrenamiento',
        hook: 'Hace 48 horas algo se movió.',
        copy: 'Hace 48 horas algo se movió.\nEn cada mujer que llegó con sus cargas.\nEn cada historia que encontró un orden.\nEn cada momento en que alguien se reconoció.\nReconociendo mi poder no es una promesa.\nEs un proceso.\nY estas mujeres dieron el primer paso.\nSi te quedaste con ganas,\nescríbeme "lista"\npara saber cuándo es la próxima edición.',
        cta: 'Escríbeme "lista" para la próxima edición.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Publicar el 19 o 20 de marzo. Tono de gratitud y reflexión. Emoción genuina, sin guion rígido.',
        script: {
          scenes: [
            { scene: 1, description: 'Pausa, voz cargada de emoción contenida', text: 'Hace 48 horas algo se movió.', duration: '5s' },
            { scene: 2, description: 'Desarrollo', text: 'En cada mujer que llegó con sus cargas. En cada historia que encontró un orden. En cada momento en que alguien se reconoció.', duration: '12s' },
            { scene: 3, description: 'Cierre y apertura a próxima edición', text: 'Reconociendo mi poder no es una promesa. Es un proceso. Si te quedaste con ganas, escríbeme "lista" para saber cuándo es la próxima edición.', duration: '12s' },
          ],
        },
      },

      // CARRUSEL 1 — ÚLTIMA OPORTUNIDAD (publicar 16 mar)
      {
        format: 'carrusel', funnelStage: 'bofu', order: 3,
        title: '¿Por qué elegir Reconociendo mi poder?',
        hook: '¿Por qué elegir este proceso?',
        copy: 'No es motivación. Es acompañamiento real.\nTrabaja desde la historia, no desde el esfuerzo.\nConecta cuerpo, emoción y sistema.\nRespeta tu ritmo y tu historia.\nNo te exige ser otra.\nTe ayuda a volverte tú.\n📅 Última oportunidad.\n17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER.',
        cta: 'Escríbeme PODER. Última oportunidad.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Publicar 16 de marzo. Urgencia suave, no agresiva. Paleta completa de marca.',
        carouselSlides: {
          slides: [
            { slide: 1, title: '¿Por qué elegir Reconociendo mi poder?', text: 'Última oportunidad · 17 y 18 de marzo', visualNote: 'Portada fondo ciruela, texto arena, urgencia suave' },
            { slide: 2, title: 'Porque no es motivación.', text: 'Es acompañamiento real desde la historia.', visualNote: '' },
            { slide: 3, title: 'Porque trabaja desde la raíz', text: 'No desde el esfuerzo. Desde lo que está en la historia y en el cuerpo.', visualNote: '' },
            { slide: 4, title: 'Porque conecta cuerpo, emoción y sistema', text: 'No es solo hablar. Es sentir, ordenar, reconocerse.', visualNote: '' },
            { slide: 5, title: 'Porque respeta tu ritmo', text: 'No hay comparación. No hay presión. Cada mujer avanza desde donde está.', visualNote: '' },
            { slide: 6, title: 'Porque no te exige ser otra', text: 'Te ayuda a volverte tú. Desde adentro.', visualNote: '' },
            { slide: 7, title: '📅 17 y 18 de marzo', text: '6:30 – 9:30 pm\nÚltima oportunidad.', visualNote: '' },
            { slide: 8, title: 'Escríbeme PODER', text: 'y lo vemos juntas. 🤍', visualNote: 'Cierre fondo malva, CTA grande' },
          ],
        },
      },

      // CARRUSEL 2 — POST-ENTRENAMIENTO
      {
        format: 'carrusel', funnelStage: 'bofu', order: 4,
        title: 'Lo que cambió en ellas — post entrenamiento',
        hook: 'Lo que cambió en ellas.',
        copy: 'No siempre el cambio se ve de inmediato.\nPero algo se ordenó.\nAlgo se reconoció.\nAlgo empezó.\nEso es Reconociendo mi poder.\nSi quieres saber de la próxima edición,\nescríbeme "lista".',
        cta: 'Escríbeme "lista" para la próxima edición.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Publicar 19-20 de marzo. Tono de celebración suave y esperanza.',
        carouselSlides: {
          slides: [
            { slide: 1, title: 'Lo que cambió en ellas', text: '(después de Reconociendo mi poder)', visualNote: 'Portada fondo malva, emoción en la imagen' },
            { slide: 2, title: 'Llegaron cargando historias que no eran suyas', text: 'Salieron con más claridad sobre qué es suyo y qué no.', visualNote: '' },
            { slide: 3, title: 'Llegaron reaccionando desde la herida', text: 'Salieron con una pausa nueva entre el estímulo y la respuesta.', visualNote: '' },
            { slide: 4, title: 'Llegaron fuera de su lugar', text: 'Salieron recordando cuál es su lugar.', visualNote: '' },
            { slide: 5, title: 'Llegaron con preguntas', text: 'Salieron con más conciencia para empezar a responderlas.', visualNote: '' },
            { slide: 6, title: 'El proceso no termina aquí.', text: 'La semilla está puesta. El orden continúa.', visualNote: '' },
            { slide: 7, title: 'Gracias a cada mujer que eligió estar.', text: 'Elegirte es el primer paso. Siempre.', visualNote: '' },
            { slide: 8, title: '¿Te quedaste con ganas?', text: 'Escríbeme "lista" para saber cuándo es la próxima edición 🤍', visualNote: 'Cierre arena, apertura a próxima edición' },
          ],
        },
      },

      // CARRUSEL 3 — REFLEXIÓN POST-ENTRENAMIENTO
      {
        format: 'carrusel', funnelStage: 'mofu', order: 5,
        title: 'Gracias por elegirte — cierre del proceso',
        hook: 'Elegirte también es un acto de amor.',
        copy: 'Elegirte no es egoísmo.\nEs responsabilidad contigo.\nEs decirle a tu sistema:\n"yo también importo".\nCada mujer que se elige\ncambia algo en su historia.\nGracias por estar.',
        cta: 'Escríbeme "lista" para la próxima edición.',
        hashtags: [...HASHTAGS_LANZAMIENTO, '#MujeresQueSeEligen'],
        visualDirection: 'Publicar 20-21 de marzo. Carrusel de cierre, tono agradecido y esperanzador.',
        carouselSlides: {
          slides: [
            { slide: 1, title: 'Gracias por elegirte', text: '', visualNote: 'Portada fondo ciruela apagado, letras claras, cálido' },
            { slide: 2, title: 'Elegirte fue el primer paso.', text: '', visualNote: '' },
            { slide: 3, title: 'Aparecer fue valiente.', text: 'Mostrar tu historia requiere una valentía que muchos no ven.', visualNote: '' },
            { slide: 4, title: 'Mirar con honestidad es el acto más amoroso', text: 'que puedes hacer por ti misma.', visualNote: '' },
            { slide: 5, title: 'El proceso continúa.', text: 'Lo que se movió en estos dos días no se detiene.', visualNote: '' },
            { slide: 6, title: 'Solo está comenzando.', text: 'Sigue escuchándote. Sigue eligiéndote.', visualNote: '' },
            { slide: 7, title: 'Gracias por confiarme tu historia.', text: 'Fue un honor sostener este espacio.', visualNote: '' },
            { slide: 8, title: '¿Quieres estar en la próxima edición?', text: 'Escríbeme "lista" y te aviso cuando abra inscripciones 🤍', visualNote: 'Cierre fondo arena, CTA suave' },
          ],
        },
      },

      // POST 1 — PREVIO (publicar 16 mar)
      {
        format: 'post', funnelStage: 'bofu', order: 6,
        title: 'Mañana empieza',
        hook: 'Mañana empieza.',
        copy: 'Mañana empieza Reconociendo mi poder.\nPara las mujeres que dijeron "sí"\ncuando algo dentro de ellas lo pedía.\nPara las que llegaron cansadas de sostener.\nPara las que quieren volver a sí.\nEstoy lista para sostener este proceso con ustedes.\nGracias por elegirse.\nNos vemos mañana, 6:30 pm. 🤍\nSi todavía quieres participar,\nescríbeme PODER ahora.',
        cta: 'Escríbeme PODER ahora.',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Publicar 16 de marzo. Post de víspera. Fondo arena, hook en recuadro malva. Diseño cálido.',
      },

      // POST 2 — POST-ENTRENAMIENTO (publicar 19-20 mar)
      {
        format: 'post', funnelStage: 'bofu', order: 7,
        title: 'Algo se movió — post entrenamiento',
        hook: 'Algo se movió.',
        copy: 'El entrenamiento terminó.\nY algo se movió.\nEn cada mujer que llegó con sus cargas.\nEn cada historia que encontró un orden.\nEn cada momento en que alguien se reconoció.\nReconociendo mi poder no es una promesa.\nEs un proceso.\nY estas mujeres dieron el primer paso.\nSi te quedaste con ganas de estar en la próxima edición,\nescríbeme "lista"\ny te aviso cuando abra inscripciones.',
        cta: 'Escríbeme "lista".',
        hashtags: HASHTAGS_LANZAMIENTO,
        visualDirection: 'Publicar 19-20 de marzo. Fondo arena. Hook en recuadro ciruela. Tono de gratitud y apertura.',
      },

    ],
  },

];

// ─── SCRIPT PRINCIPAL ────────────────────────────────────────────────────────

(async () => {
  await sequelize.authenticate();

  // Obtener el cliente
  const client = await Client.findOne({ where: { name: 'Moni Grizales' } });
  if (!client) { console.error('No se encontró a Moni Grizales'); process.exit(1); }

  console.log(`\nCliente: ${client.name} (${client.id})\n`);

  let totalPlannings = 0;
  let totalPieces    = 0;

  for (const week of WEEKS) {
    // Verificar si ya existe esta planeación
    const existing = await Planning.findOne({
      where: { clientId: client.id, year: week.year, month: week.month, week: week.week },
    });

    let planning;
    if (existing) {
      // Ya existe: borrar contenidos anteriores y reusar la planeación
      const deleted = await Content.destroy({ where: { planningId: existing.id } });
      planning = existing;
      console.log(`↻ ${week.label} → actualizando (${deleted} contenidos borrados, id: ${existing.id})`);
    } else {
      // Crear nueva planeación
      planning = await Planning.create({
        clientId:    client.id,
        year:        week.year,
        month:       week.month,
        week:        week.week,
        packageType: 'premium',
        distribution: week.distribution,
        status:      'approved',
      });
      totalPlannings++;
      console.log(`✓ Planning creado: ${week.label} → ${planning.id}`);
    }

    // Crear Content records
    for (const piece of week.pieces) {
      await Content.create({
        planningId:      planning.id,
        format:          piece.format,
        funnelStage:     piece.funnelStage,
        title:           piece.title,
        hook:            piece.hook || null,
        copy:            piece.copy,
        cta:             piece.cta,
        hashtags:        piece.hashtags || [],
        script:          piece.script || null,
        carouselSlides:  piece.carouselSlides || null,
        visualDirection: piece.visualDirection || null,
        order:           piece.order,
        status:          'reviewed',
      });
      totalPieces++;
      console.log(`   ✓ [${piece.format.padEnd(8)}] ${piece.title.slice(0, 60)}`);
    }
    console.log('');
  }

  console.log(`\n✅ Seed completo: ${totalPlannings} planeaciones, ${totalPieces} piezas\n`);
  await sequelize.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
