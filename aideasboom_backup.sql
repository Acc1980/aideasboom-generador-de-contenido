--
-- PostgreSQL database dump
--

\restrict kAJcwxPmqcmb3Vg5MoSsT7kWalaXRyJW753S0RN2GsOjpQqdv2fAqv0tvPCxXKr

-- Dumped from database version 17.9 (Debian 17.9-1.pgdg13+1)
-- Dumped by pg_dump version 17.9 (Debian 17.9-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_client_events_event_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_client_events_event_type AS ENUM (
    'entrenamiento',
    'taller',
    'masterclass',
    'lanzamiento',
    'retiro',
    'otro'
);


ALTER TYPE public.enum_client_events_event_type OWNER TO postgres;

--
-- Name: enum_clients_package_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_clients_package_type AS ENUM (
    'basico',
    'premium',
    'personalizado_7',
    'reels_5'
);


ALTER TYPE public.enum_clients_package_type OWNER TO postgres;

--
-- Name: enum_contents_approval_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_contents_approval_status AS ENUM (
    'pendiente',
    'aprobado',
    'cambios',
    'no_va'
);


ALTER TYPE public.enum_contents_approval_status OWNER TO postgres;

--
-- Name: enum_contents_format; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_contents_format AS ENUM (
    'reel',
    'post',
    'carrusel'
);


ALTER TYPE public.enum_contents_format OWNER TO postgres;

--
-- Name: enum_contents_funnel_stage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_contents_funnel_stage AS ENUM (
    'tofu',
    'mofu',
    'bofu'
);


ALTER TYPE public.enum_contents_funnel_stage OWNER TO postgres;

--
-- Name: enum_contents_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_contents_status AS ENUM (
    'generated',
    'reviewed',
    'approved',
    'published'
);


ALTER TYPE public.enum_contents_status OWNER TO postgres;

--
-- Name: enum_plannings_package_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_plannings_package_type AS ENUM (
    'basico',
    'premium',
    'personalizado_7',
    'reels_5'
);


ALTER TYPE public.enum_plannings_package_type OWNER TO postgres;

--
-- Name: enum_plannings_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_plannings_status AS ENUM (
    'draft',
    'approved',
    'in_production',
    'completed'
);


ALTER TYPE public.enum_plannings_status OWNER TO postgres;

--
-- Name: enum_stories_approval_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_stories_approval_status AS ENUM (
    'pendiente',
    'aprobado',
    'cambios',
    'no_va'
);


ALTER TYPE public.enum_stories_approval_status OWNER TO postgres;

--
-- Name: enum_stories_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_stories_status AS ENUM (
    'generated',
    'reviewed',
    'approved',
    'published'
);


ALTER TYPE public.enum_stories_status OWNER TO postgres;

--
-- Name: enum_strategies_period_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_strategies_period_type AS ENUM (
    'annual',
    'quarterly',
    'monthly'
);


ALTER TYPE public.enum_strategies_period_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ab_content_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ab_content_approvals (
    id integer NOT NULL,
    content_id integer NOT NULL,
    drive_url text,
    status character varying(50) DEFAULT 'pendiente'::character varying,
    feedback text,
    telegram_chat_id character varying(50),
    telegram_message_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ab_content_approvals OWNER TO postgres;

--
-- Name: ab_content_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ab_content_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ab_content_approvals_id_seq OWNER TO postgres;

--
-- Name: ab_content_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ab_content_approvals_id_seq OWNED BY public.ab_content_approvals.id;


--
-- Name: ab_ig_conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ab_ig_conversations (
    id integer NOT NULL,
    instagram_user_id character varying(100) NOT NULL,
    instagram_username character varying(100),
    conversation_step character varying(50) DEFAULT 'saludo'::character varying,
    messages_count integer DEFAULT 0,
    first_message_at timestamp without time zone DEFAULT now(),
    last_message_at timestamp without time zone DEFAULT now(),
    trigger_source character varying(50),
    diagnostic_mentioned boolean DEFAULT false,
    conversation_summary text,
    user_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ab_ig_conversations OWNER TO postgres;

--
-- Name: ab_ig_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ab_ig_conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ab_ig_conversations_id_seq OWNER TO postgres;

--
-- Name: ab_ig_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ab_ig_conversations_id_seq OWNED BY public.ab_ig_conversations.id;


--
-- Name: ab_ig_message_dedup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ab_ig_message_dedup (
    message_id character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ab_ig_message_dedup OWNER TO postgres;

--
-- Name: ab_ig_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ab_ig_messages (
    id integer NOT NULL,
    conversation_id integer,
    instagram_user_id character varying(100) NOT NULL,
    direction character varying(10) NOT NULL,
    message_text text NOT NULL,
    message_type character varying(20) DEFAULT 'text'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT ab_ig_messages_direction_check CHECK (((direction)::text = ANY ((ARRAY['inbound'::character varying, 'outbound'::character varying])::text[])))
);


ALTER TABLE public.ab_ig_messages OWNER TO postgres;

--
-- Name: ab_ig_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ab_ig_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ab_ig_messages_id_seq OWNER TO postgres;

--
-- Name: ab_ig_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ab_ig_messages_id_seq OWNED BY public.ab_ig_messages.id;


--
-- Name: client_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_events (
    id uuid NOT NULL,
    client_id uuid,
    name character varying(255) NOT NULL,
    description text,
    event_type public.enum_client_events_event_type NOT NULL,
    start_date date NOT NULL,
    end_date date,
    schedule character varying(255),
    registration_url character varying(255),
    key_benefits jsonb DEFAULT '[]'::jsonb,
    target_price character varying(255),
    active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.client_events OWNER TO postgres;

--
-- Name: COLUMN client_events.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.client_events.name IS 'Nombre del evento (ej: "Reconociendo mi poder")';


--
-- Name: COLUMN client_events.description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.client_events.description IS 'Descripción para contexto de IA';


--
-- Name: COLUMN client_events.end_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.client_events.end_date IS 'Fecha fin (null si es de un solo día)';


--
-- Name: COLUMN client_events.schedule; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.client_events.schedule IS 'Horario: "6:30 pm a 9:30 pm"';


--
-- Name: COLUMN client_events.key_benefits; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.client_events.key_benefits IS 'Array de beneficios clave para prompts';


--
-- Name: COLUMN client_events.target_price; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.client_events.target_price IS 'Precio o rango para CTAs de conversión';


--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    package_type public.enum_clients_package_type NOT NULL,
    brand_identity jsonb DEFAULT '{"tone": "", "personality": "", "baseHashtags": [], "emojisAllowed": false, "forbiddenWords": []}'::jsonb,
    industry character varying(255),
    target_audience text,
    logo_url character varying(255),
    active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: COLUMN clients.brand_identity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clients.brand_identity IS 'Identidad de marca: tono, personalidad, colores, emojis permitidos, palabras prohibidas, hashtags base';


--
-- Name: COLUMN clients.logo_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clients.logo_url IS 'Ruta relativa del logo del cliente (ej: /logos/slug.png)';


--
-- Name: content_queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content_queue (
    id integer NOT NULL,
    content_id integer NOT NULL,
    format character varying(20) DEFAULT 'reel'::character varying NOT NULL,
    chat_id bigint,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    approved_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    instagram_url text,
    error_message text
);


ALTER TABLE public.content_queue OWNER TO postgres;

--
-- Name: content_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.content_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_queue_id_seq OWNER TO postgres;

--
-- Name: content_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.content_queue_id_seq OWNED BY public.content_queue.id;


--
-- Name: contents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contents (
    id uuid NOT NULL,
    planning_id uuid,
    format public.enum_contents_format NOT NULL,
    funnel_stage public.enum_contents_funnel_stage NOT NULL,
    title character varying(255) NOT NULL,
    hook text,
    copy text NOT NULL,
    cta character varying(255) NOT NULL,
    hashtags character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    script jsonb,
    carousel_slides jsonb,
    visual_direction text,
    status public.enum_contents_status DEFAULT 'generated'::public.enum_contents_status,
    client_comments text,
    approval_status public.enum_contents_approval_status DEFAULT 'pendiente'::public.enum_contents_approval_status,
    "order" integer DEFAULT 0 NOT NULL,
    image_url character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    video_url character varying(255)
);


ALTER TABLE public.contents OWNER TO postgres;

--
-- Name: COLUMN contents.hook; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contents.hook IS 'Gancho inicial para captar atención';


--
-- Name: COLUMN contents.cta; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contents.cta IS 'Call to action alineado con la etapa del embudo';


--
-- Name: COLUMN contents.script; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contents.script IS 'Guion por escenas (solo para reels)';


--
-- Name: COLUMN contents.carousel_slides; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contents.carousel_slides IS 'Slides del carrusel con texto e indicación visual';


--
-- Name: COLUMN contents.visual_direction; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contents.visual_direction IS 'Dirección visual / indicaciones para diseño';


--
-- Name: COLUMN contents.client_comments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contents.client_comments IS 'Comentarios del cliente desde el sheet de aprobación';


--
-- Name: COLUMN contents."order"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contents."order" IS 'Orden de publicación dentro del mes';


--
-- Name: COLUMN contents.image_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contents.image_url IS 'URL de la imagen generada (cover para carruseles)';


--
-- Name: plannings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plannings (
    id uuid NOT NULL,
    client_id uuid,
    year integer NOT NULL,
    month integer NOT NULL,
    week integer DEFAULT 1 NOT NULL,
    package_type public.enum_plannings_package_type NOT NULL,
    distribution jsonb NOT NULL,
    pieces jsonb DEFAULT '[]'::jsonb NOT NULL,
    status public.enum_plannings_status DEFAULT 'draft'::public.enum_plannings_status,
    generated_prompt text,
    approval_sheet_url text,
    stories_sheet_url text,
    drive_folder_url text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.plannings OWNER TO postgres;

--
-- Name: COLUMN plannings.week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.plannings.week IS 'Semana del mes (1-4)';


--
-- Name: COLUMN plannings.distribution; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.plannings.distribution IS 'Distribución calculada: { total, reels, posts, carruseles, tofu, mofu, bofu }';


--
-- Name: COLUMN plannings.pieces; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.plannings.pieces IS 'Arreglo de piezas planificadas con formato, embudo, tema, copy, CTA, hashtags';


--
-- Name: COLUMN plannings.generated_prompt; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.plannings.generated_prompt IS 'Prompt enviado a OpenAI para trazabilidad';


--
-- Name: COLUMN plannings.approval_sheet_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.plannings.approval_sheet_url IS 'URL del Google Sheet de aprobación compartido con el cliente';


--
-- Name: COLUMN plannings.stories_sheet_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.plannings.stories_sheet_url IS 'URL del Google Sheet de aprobación de stories';


--
-- Name: COLUMN plannings.drive_folder_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.plannings.drive_folder_url IS 'URL de la carpeta de Drive con las imágenes generadas';


--
-- Name: stories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stories (
    id uuid NOT NULL,
    planning_id uuid,
    related_content_id uuid,
    day_of_week integer NOT NULL,
    day_label character varying(255) NOT NULL,
    "order" integer NOT NULL,
    story_type character varying(255) NOT NULL,
    is_recorded boolean DEFAULT false,
    script text,
    text_content text,
    visual_direction text,
    cta character varying(255),
    sticker_suggestion character varying(255),
    image_url character varying(255),
    status public.enum_stories_status DEFAULT 'generated'::public.enum_stories_status,
    approval_status public.enum_stories_approval_status DEFAULT 'pendiente'::public.enum_stories_approval_status,
    client_comments text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.stories OWNER TO postgres;

--
-- Name: COLUMN stories.day_of_week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories.day_of_week IS '1=Lunes … 7=Domingo';


--
-- Name: COLUMN stories.day_label; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories.day_label IS 'Nombre del día: Lunes, Martes, etc.';


--
-- Name: COLUMN stories."order"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories."order" IS 'Posición dentro del día (1-5)';


--
-- Name: COLUMN stories.story_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories.story_type IS 'Tipo decidido por la IA: teaser, encuesta, tip_experto, grabada_coach, pregunta, behind_the_scenes, dato_curioso, reflexion, cta_directa, etc.';


--
-- Name: COLUMN stories.is_recorded; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories.is_recorded IS 'true si la coach debe grabarla en cámara';


--
-- Name: COLUMN stories.script; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories.script IS 'Guion palabra por palabra (para stories grabadas)';


--
-- Name: COLUMN stories.text_content; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories.text_content IS 'Texto para story de imagen/texto';


--
-- Name: COLUMN stories.visual_direction; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories.visual_direction IS 'Indicaciones de diseño o escenario para grabación';


--
-- Name: COLUMN stories.cta; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories.cta IS 'Call to action (si aplica)';


--
-- Name: COLUMN stories.sticker_suggestion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories.sticker_suggestion IS 'Sugerencia de sticker interactivo: encuesta, pregunta, slider, quiz';


--
-- Name: COLUMN stories.image_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories.image_url IS 'URL de la imagen generada (null para stories grabadas)';


--
-- Name: COLUMN stories.client_comments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.stories.client_comments IS 'Comentarios del cliente desde el sheet de aprobación';


--
-- Name: strategies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.strategies (
    id uuid NOT NULL,
    client_id uuid,
    period_type public.enum_strategies_period_type NOT NULL,
    year integer NOT NULL,
    quarter integer,
    month integer,
    strategy_data jsonb NOT NULL,
    conversion_active boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.strategies OWNER TO postgres;

--
-- Name: COLUMN strategies.strategy_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.strategies.strategy_data IS 'Contenido estratégico: objetivos, temas clave, pilares, mensajes, etc.';


--
-- Name: COLUMN strategies.conversion_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.strategies.conversion_active IS 'Si true, la distribución BOFU sube de 20% a 30%';


--
-- Name: ab_content_approvals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ab_content_approvals ALTER COLUMN id SET DEFAULT nextval('public.ab_content_approvals_id_seq'::regclass);


--
-- Name: ab_ig_conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ab_ig_conversations ALTER COLUMN id SET DEFAULT nextval('public.ab_ig_conversations_id_seq'::regclass);


--
-- Name: ab_ig_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ab_ig_messages ALTER COLUMN id SET DEFAULT nextval('public.ab_ig_messages_id_seq'::regclass);


--
-- Name: content_queue id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_queue ALTER COLUMN id SET DEFAULT nextval('public.content_queue_id_seq'::regclass);


--
-- Data for Name: ab_content_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ab_content_approvals (id, content_id, drive_url, status, feedback, telegram_chat_id, telegram_message_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ab_ig_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ab_ig_conversations (id, instagram_user_id, instagram_username, conversation_step, messages_count, first_message_at, last_message_at, trigger_source, diagnostic_mentioned, conversation_summary, user_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ab_ig_message_dedup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ab_ig_message_dedup (message_id, created_at) FROM stdin;
\.


--
-- Data for Name: ab_ig_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ab_ig_messages (id, conversation_id, instagram_user_id, direction, message_text, message_type, created_at) FROM stdin;
\.


--
-- Data for Name: client_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_events (id, client_id, name, description, event_type, start_date, end_date, schedule, registration_url, key_benefits, target_price, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, name, slug, package_type, brand_identity, industry, target_audience, logo_url, active, created_at, updated_at) FROM stdin;
d16a972b-0d8f-4b4b-89da-979b123eda22	Moni Grizales	moni-grizales	premium	{"tone": "", "personality": "", "baseHashtags": [], "emojisAllowed": false, "forbiddenWords": []}	\N	\N	\N	t	2026-03-31 00:48:30.192+00	2026-03-31 00:48:30.192+00
d3bf9fe8-c61b-4a5c-a63e-d89d6b38ab7f	AIdeasBoom	aideasboom	reels_5	{"tone": "directo, conversacional, orientado a resultados concretos con nÃ¯Â¿Â½meros, accesible sin jerga tÃ¯Â¿Â½cnica, empoderador", "colors": {"accent": "#f48a81", "primary": "#0e2440", "gradient": "135deg, #0e2440, #16385d, #1e4a7a", "textMain": "#1a1a2e", "textMuted": "#6b7280", "accentDark": "#e06b61", "background": "#ffffff", "primaryMid": "#16385d", "accentLight": "#f7a49d", "description": "Azul oscuro profundo como base (#0e2440), coral vibrante como acento (#f48a81). Fondos blancos o gris muy claro. Texto oscuro sobre fondo claro o blanco sobre azul.", "primaryLight": "#1e4a7a", "backgroundAlt": "#f5f7fa"}, "slogans": ["Sin plantillas. Sin robots. Con IA real.", "Tu negocio trabajando 24/7 con inteligencia artificial", "Automatiza. Escala. Crece.", "Tu negocio nunca cierra", "El 78% compra con quien responde primero"], "services": [{"name": "Chatbots con IA", "plans": [{"name": "Ignite", "price": "$497 USD"}, {"name": "Boost", "price": "$997 USD"}, {"name": "Scale", "price": "$2,497 USD"}], "description": "Chatbots para Instagram y WhatsApp que entienden contexto, recuerdan conversaciones y venden por ti."}, {"name": "Estrategia Digital", "plans": [{"name": "Starter", "price": "$197 USD/mes"}, {"name": "Growth", "price": "$397 USD/mes"}, {"name": "Authority", "price": "$697 USD/mes"}], "description": "Posicionamiento de marca, plan de contenido, embudos de venta, captions, hashtags y publicaciÃ¯Â¿Â½n incluida."}, {"name": "PÃ¯Â¿Â½ginas Web", "description": "DiseÃ¯Â¿Â½o y desarrollo de pÃ¯Â¿Â½ginas web profesionales optimizadas para conversiÃ¯Â¿Â½n."}, {"name": "Planes de Lanzamiento", "description": "Estrategia completa para lanzar productos o servicios: estrategia, automatizaciÃ¯Â¿Â½n y ejecuciÃ¯Â¿Â½n."}, {"name": "Integraciones y AutomatizaciÃ¯Â¿Â½n", "description": "Conectamos tus herramientas: calendario, CRM, email, pagos. Todo en piloto automÃ¯Â¿Â½tico."}, {"name": "Manejo de Comunidad por WhatsApp", "description": "GestiÃ¯Â¿Â½n de comunidades en WhatsApp con automatizaciones y seguimiento de leads."}], "textColor": "#0e2440", "lightColor": "#ffffff", "accentColor": "#f48a81", "keyMessages": ["Cada mensaje sin respuesta es un cliente que se fue con tu competencia", "Respuesta en 3 segundos, 24/7, sin intervenciÃ¯Â¿Â½n humana", "90% de consultas resueltas automÃ¯Â¿Â½ticamente", "IA real (misma tecnologÃ¯Â¿Â½a de ChatGPT), no plantillas rÃ¯Â¿Â½gidas", "DiagnÃ¯Â¿Â½stico gratis de 20 minutos", "Desde $497 USD para tener tu negocio automatizado"], "personality": "Somos la agencia que convierte tu negocio en una mÃ¯Â¿Â½quina que trabaja sola. Usamos IA real (la misma tecnologÃ¯Â¿Â½a de ChatGPT), no plantillas, no robots genÃ¯Â¿Â½ricos. Hablamos de resultados: 90% de consultas resueltas, respuesta en 3 segundos, ventas mientras duermes. PrÃ¯Â¿Â½cticos, cercanos, ejecutamos todo nosotros.", "baseHashtags": ["#AutomatizacionIA", "#ChatbotIA", "#WhatsAppBusiness", "#InstagramMarketing", "#AIdeasBoom", "#IA", "#PymesDigitales", "#VentasAutomaticas", "#EstrategiaDigital", "#NegocioAutomatico"], "primaryColor": "#0e2440", "emojisAllowed": true, "contentPillars": ["EducaciÃ¯Â¿Â½n sobre automatizaciÃ¯Â¿Â½n con IA (cÃ¯Â¿Â½mo funciona, casos de uso reales)", "Resultados y casos de Ã¯Â¿Â½xito de clientes (coaches, tiendas, servicios)", "Errores que cometen los negocios al no automatizar", "DetrÃ¯Â¿Â½s de cÃ¯Â¿Â½mara: cÃ¯Â¿Â½mo construimos los chatbots y automatizaciones", "PromociÃ¯Â¿Â½n directa de servicios con precios y beneficios concretos"], "forbiddenWords": ["plantillas", "robots genÃ¯Â¿Â½ricos", "complicado", "difÃ¯Â¿Â½cil", "costoso"], "weeklyDistribution": {"posts": 2, "reels": 5, "carruseles": 2}}	Agencia de automatizaci�n con IA para pymes	Due�os de peque�as y medianas empresas (coaches, tiendas, servicios profesionales, consultores) que quieren automatizar su negocio con IA: atenci�n al cliente 24/7, ventas autom�ticas, manejo de redes sociales y operaciones en piloto autom�tico. Est�n cansados de responder las mismas preguntas, perder clientes por no responder r�pido y no tener tiempo para escalar.	/logos/d3bf9fe8-c61b-4a5c-a63e-d89d6b38ab7f.png	t	2026-04-06 23:19:38.982+00	2026-04-07 00:43:25.309+00
\.


--
-- Data for Name: content_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.content_queue (id, content_id, format, chat_id, status, approved_at, published_at, instagram_url, error_message) FROM stdin;
\.


--
-- Data for Name: contents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contents (id, planning_id, format, funnel_stage, title, hook, copy, cta, hashtags, script, carousel_slides, visual_direction, status, client_comments, approval_status, "order", image_url, created_at, updated_at, video_url) FROM stdin;
48746a1b-3c50-4b1f-aeea-5dd7f6f5ab54	fe3ac721-b0b8-4fb9-89f2-058582428f63	reel	tofu	El cuerpo guarda lo que la emoción no pudo decir	El cuerpo no miente.	El cuerpo no miente.\nNo todo el cansancio viene del hacer.\nA veces viene de cargar emociones que no tuvieron espacio.\nDe sostener lo que nunca se pudo decir.\nCuando una mujer aprende a callar,\nsu cuerpo aprende a guardar.\nY llega un momento en que el cuerpo habla\nporque el alma ya no puede más.\nEl síntoma no es debilidad.\nEs información.\nSi algo de esto te resonó,\nescríbeme "sí".	¿Tu cuerpo te está diciendo algo que todavía no escuchaste?	{#SanacionInterior,#CuerpoEmocional,#MujerConsciente,#MujeresQueSanan,#TrabajoInterior,#ProcesoConsciente}	{"scenes": [{"text": "El cuerpo no miente.", "scene": 1, "duration": "4s", "description": "Mirada directa, pausa breve antes de hablar"}, {"text": "No todo el cansancio viene del hacer. A veces viene de cargar emociones que no tuvieron espacio. De sostener lo que nunca se pudo decir.", "scene": 2, "duration": "12s", "description": "Tono íntimo, pausado"}, {"text": "Cuando una mujer aprende a callar, su cuerpo aprende a guardar. Y llega un momento en que el cuerpo habla porque el alma ya no puede más.", "scene": 3, "duration": "12s", "description": "Pausa, voz más suave"}, {"text": "El síntoma no es debilidad. Es información. ¿Tu cuerpo te está diciendo algo que todavía no escuchaste? Escríbeme \\"sí\\".", "scene": 4, "duration": "8s", "description": "Cierre, mirada directa, tono empático"}]}	\N	Mónica hablando a cámara, plano medio, luz cálida, tono íntimo y contenedor	reviewed	\N	pendiente	1	\N	2026-03-31 00:51:56.977+00	2026-03-31 00:51:56.977+00	\N
3f7f26d8-4189-4664-8c6a-0bc030a1e1cf	fe3ac721-b0b8-4fb9-89f2-058582428f63	reel	tofu	Lo que el cuerpo dice cuando el alma ya no puede más	Hay cansancios que no desaparecen durmiendo.	Hay cansancios que no desaparecen durmiendo.\nNo porque algo esté roto,\nsino porque el origen no está en el cuerpo.\nEstá en lo que cargas.\nEn lo que guardaste.\nEn lo que no pudiste decir.\nCuando el cuerpo habla con síntomas,\nno es para que sigas aguantando.\nEs para que escuches.\nSi esto te hace sentido,\nescríbeme "sí".	Si tu cuerpo te está hablando, escríbeme "sí".	{#SanacionInterior,#CuerpoEmocional,#MujerConsciente,#MujeresQueSanan,#TrabajoInterior,#ProcesoConsciente}	{"scenes": [{"text": "Hay cansancios que no desaparecen durmiendo.", "scene": 1, "duration": "4s", "description": "Plano medio, pausa antes del hook"}, {"text": "No porque algo esté roto, sino porque el origen no está en el cuerpo. Está en lo que cargas. En lo que guardaste. En lo que no pudiste decir.", "scene": 2, "duration": "14s", "description": "Desarrollo pausado, voz cálida"}, {"text": "Cuando el cuerpo habla con síntomas, no es para que sigas aguantando. Es para que escuches. Si esto te hace sentido, escríbeme \\"sí\\".", "scene": 3, "duration": "10s", "description": "Cierre íntimo, mirada directa"}]}	\N	Tono sereno, plano cercano, luz difusa. Habla despacio como si le hablara a una sola persona.	reviewed	\N	pendiente	2	\N	2026-03-31 00:51:56.982+00	2026-03-31 00:51:56.982+00	\N
4a1eaefc-c0d3-496c-a1d6-4ee5ef613960	fe3ac721-b0b8-4fb9-89f2-058582428f63	carrusel	tofu	Lo que tu cuerpo intenta decirte (y no siempre escuchamos)	Tu cuerpo intenta decirte algo...	Hay síntomas que no se entienden desde la medicina.\nHay cansancios que no desaparecen con descanso.\nHay ansiedades que no tienen causa "lógica".\nY no es que algo esté mal contigo.\nEs que tu cuerpo está guardando lo que la emoción no pudo expresar.\nEl nudo en la garganta cuando dices "sí" sin querer.\nLa tensión en los hombros cuando sostienes demasiado.\nLa fatiga profunda después de dar todo de ti.\nEstos no son señales de debilidad.\nSon señales de que algo necesita espacio.\nTu cuerpo no traiciona. Informa.\nEscucharlo también es una forma de sanarte.\nSi mientras leías sentiste algo, escríbeme "sí".	Escríbeme "sí".	{#SanacionInterior,#CuerpoEmocional,#MujerConsciente,#MujeresQueSanan,#TrabajoInterior,#ProcesoConsciente}	\N	{"slides": [{"text": "(y no siempre escuchamos)", "slide": 1, "title": "Lo que tu cuerpo intenta decirte…", "visualNote": "Portada con fondo malva suave, título grande en Cormorant"}, {"text": "Cuando descansas y sigues cansada, el mensaje no viene del cuerpo. Viene de lo que cargas.", "slide": 2, "title": "El cansancio que no desaparece durmiendo", "visualNote": "Fondo arena, texto oscuro"}, {"text": "Esa sensación de alerta constante sin saber por qué. El cuerpo está guardando algo que no pudo ser dicho.", "slide": 3, "title": "La ansiedad que no tiene nombre", "visualNote": ""}, {"text": "Aparece cuando dices \\"sí\\" sin querer. Cuando callas lo que sientes. El cuerpo lo registra todo.", "slide": 4, "title": "El nudo en la garganta", "visualNote": ""}, {"text": "El lugar donde muchas mujeres cargan lo que sostienen. Lo que le corresponde a otros. Lo que no se puede soltar.", "slide": 5, "title": "La tensión en los hombros", "visualNote": ""}, {"text": "Cuando das demasiado, el cuerpo se desconecta para protegerte. No es frialdad. Es supervivencia.", "slide": 6, "title": "La desconexión que llega", "visualNote": ""}, {"text": "Cuando sabes lo que quieres pero algo te frena. Hay una historia que todavía pide ser mirada.", "slide": 7, "title": "El bloqueo cada vez que intentas avanzar", "visualNote": ""}, {"text": "Escucharlo también es sanar.\\nSi esto te resonó, escríbeme \\"sí\\".", "slide": 8, "title": "El cuerpo no falla. Informa.", "visualNote": "Fondo malva suave, texto claro, CTA visible"}]}	Fondo arena clara, tipografía Cormorant Garamond para títulos, Montserrat para cuerpo. Paleta malva/ciruela/arena.	reviewed	\N	pendiente	3	\N	2026-03-31 00:51:56.985+00	2026-03-31 00:51:56.985+00	\N
c867621a-bb43-4567-9eea-78d55bae25f4	fe3ac721-b0b8-4fb9-89f2-058582428f63	carrusel	mofu	La historia que tu cuerpo guarda sin que lo sepas	El cuerpo recuerda lo que la mente prefiere olvidar.	El cuerpo no guarda solo lo que pasó en el presente.\nGuarda la historia.\nLos mandatos aprendidos.\nLas emociones que no tuvieron espacio.\nLos límites que no se pudieron poner.\nCada tensión tiene una raíz.\nCada síntoma tiene un mensaje.\nCuando empiezas a mirar la historia,\nel cuerpo empieza a soltar.\nSi esto te resonó, escríbeme "sí".	Escríbeme "sí".	{#SanacionInterior,#CuerpoEmocional,#MujerConsciente,#MujeresQueSanan,#TrabajoInterior,#ProcesoConsciente,#SistemaFamiliar}	\N	{"slides": [{"text": "sin que siempre lo sepas", "slide": 1, "title": "La historia que tu cuerpo guarda", "visualNote": "Portada fondo ciruela apagado, texto arena"}, {"text": "→ se quedó en los hombros.\\nEsa tensión que no desaparece tiene una historia detrás.", "slide": 2, "title": "El mandato que no pudiste decir", "visualNote": ""}, {"text": "→ se quedó en el estómago.\\nCada vez que dijiste \\"sí\\" sin querer, el cuerpo lo registró.", "slide": 3, "title": "El límite que no pusiste", "visualNote": ""}, {"text": "→ se quedó en el pecho.\\nLo que no se expresa no desaparece. Se transforma en síntoma.", "slide": 4, "title": "La emoción que callaste", "visualNote": ""}, {"text": "A veces cargamos dolores que no vivimos pero que el sistema nos pasó.\\nEl cuerpo también guarda eso.", "slide": 5, "title": "La historia familiar que heredaste", "visualNote": ""}, {"text": "Es historia no procesada.\\nEl síntoma no miente. Pide ser escuchado.", "slide": 6, "title": "No es hipocondría", "visualNote": ""}, {"text": "el cuerpo empieza a soltar.\\nNo de golpe. Pero empieza.", "slide": 7, "title": "Cuando empiezas a mirar la historia", "visualNote": ""}, {"text": "Aprender a escucharlo cambia todo.\\nSi esto te tocó, escríbeme \\"sí\\".", "slide": 8, "title": "El cuerpo habla el lenguaje de la historia.", "visualNote": "Fondo ciruela, texto arena, CTA"}]}	Slides en alternancia fondo arena/fondo malva. Línea de acento ciruela en cada slide.	reviewed	\N	pendiente	4	\N	2026-03-31 00:51:56.988+00	2026-03-31 00:51:56.988+00	\N
28fffd87-aa24-4ea5-bd32-e9046622a340	fe3ac721-b0b8-4fb9-89f2-058582428f63	carrusel	mofu	¿Cómo reconocer el cansancio emocional?	El cansancio emocional no siempre se ve. Pero siempre se siente.	El cansancio emocional no llega siempre como llanto.\nA veces llega disfrazado de normalidad.\nDe "puedo con todo".\nDe "no es para tanto".\nPero el cuerpo lo sabe.\nY en algún momento, lo dice.\nSi mientras leías algún slide dijiste "esto soy yo"…\nes que algo en ti ya sabe que necesita otro orden.\nEscríbeme "sí".	Escríbeme "sí".	{#SanacionInterior,#CuerpoEmocional,#MujerConsciente,#MujeresQueSanan,#TrabajoInterior,#ProcesoConsciente}	\N	{"slides": [{"text": "No siempre se ve. Pero siempre se siente.", "slide": 1, "title": "¿Cómo reconocer el cansancio emocional?", "visualNote": "Portada fondo malva, texto claro"}, {"text": "A veces llega como una desconexión suave.\\nComo estar presente pero no estar.", "slide": 2, "title": "No siempre llega como derrumbe", "visualNote": ""}, {"text": "De hacer cosas que antes te gustaban.\\nEl alma pide un descanso que el cuerpo no puede darse.", "slide": 3, "title": "Como falta de deseo", "visualNote": ""}, {"text": "No de nada dramático.\\nSolo necesitar que el mundo pare un momento.", "slide": 4, "title": "Como ganas de desaparecer un rato", "visualNote": ""}, {"text": "Cuando afuera todo \\"está bien\\"\\ny adentro algo lleva mucho tiempo sin estarlo.", "slide": 5, "title": "Como la sonrisa que no siempre es real", "visualNote": ""}, {"text": "Aunque hayas dormido las horas.\\nPorque el cansancio no es físico.", "slide": 6, "title": "Como el cuerpo que no quiere levantarse", "visualNote": ""}, {"text": "Cuando te molestas por cosas pequeñas\\nporque el sistema ya está saturado.", "slide": 7, "title": "Como la irritabilidad sin causa", "visualNote": ""}, {"text": "Escucharla es el primer paso.\\nSi algo de esto te resonó, escríbeme \\"sí\\".", "slide": 8, "title": "No es debilidad. Es una señal.", "visualNote": "Cierre fondo ciruela, texto arena"}]}	Paleta suave, tipografía elegante. Slides de diagnóstico emocional sin dramatismo.	reviewed	\N	pendiente	5	\N	2026-03-31 00:51:56.99+00	2026-03-31 00:51:56.99+00	\N
fca0165a-b341-4747-ab84-18087b6d66a0	fe3ac721-b0b8-4fb9-89f2-058582428f63	post	tofu	A veces lo que sientes en el cuerpo es lo que no pudiste decir con palabras	A veces lo que sientes en el cuerpo es lo que no pudiste decir con palabras.	A veces lo que sientes en el cuerpo\nes lo que no pudiste decir con palabras.\nLa tensión en el cuello.\nEl peso en el pecho.\nEl cansancio sin causa visible.\nNo siempre es casualidad.\nMuchas mujeres aprendieron muy temprano\nque sus emociones eran demasiado.\nQue era mejor aguantar, callar, sostenerse.\nY el cuerpo lo aprendió también.\nEscucharte\nno es dramatizar.\nEs empezar a sanar desde adentro.\nSi esto te tocó,\nescríbeme "sí".	Escríbeme "sí".	{#SanacionInterior,#CuerpoEmocional,#MujerConsciente,#MujeresQueSanan,#TrabajoInterior,#ProcesoConsciente}	\N	\N	Post fondo arena clara. Hook en recuadro malva suave. Línea separadora ciruela. Cormorant Garamond para el hook.	reviewed	\N	pendiente	6	\N	2026-03-31 00:51:56.994+00	2026-03-31 00:51:56.994+00	\N
12987bfc-cc3d-4b9d-a0e4-3eaeddbbfbfb	fe3ac721-b0b8-4fb9-89f2-058582428f63	post	mofu	No todo síntoma físico empieza en el cuerpo	No todo síntoma físico empieza en el cuerpo.	No todo síntoma físico empieza en el cuerpo.\nAlgunos empiezan en la historia.\nEn las palabras que no se dijeron.\nEn las emociones que no tuvieron espacio.\nEn los roles que se asumieron\nsin que nadie te preguntara si podías cargarlos.\nEl cuerpo es territorio.\nY como todo territorio,\nguarda lo que pasó por él.\nEscucharlo con curiosidad,\nno con miedo,\ncambia todo.\nSi este mensaje llegó a ti,\nescríbeme "sí".	Escríbeme "sí".	{#SanacionInterior,#CuerpoEmocional,#MujerConsciente,#MujeresQueSanan,#TrabajoInterior,#ProcesoConsciente,#SistemaFamiliar}	\N	\N	Post fondo arena. Hook en recuadro malva. Botón CTA ciruela apagado.	reviewed	\N	pendiente	7	\N	2026-03-31 00:51:56.997+00	2026-03-31 00:51:56.997+00	\N
402feaaf-b45f-4df3-b3b9-1017f8fa3bbe	ff436e16-482d-4321-ac07-fb3863222808	reel	mofu	Una mujer que no puede regularse, no elige: reacciona	Una mujer que no puede regularse, no elige: reacciona.	"Una mujer que no puede regularse, no elige: reacciona."\nNo es falta de voluntad.\nNo es debilidad.\nEs un sistema nervioso que aprendió a sobrevivir\nantes de aprender a elegir.\nRegularse no es callarse.\nEs hacer una pausa\nentre lo que sientes\ny lo que decides.\nEsa pausa lo cambia todo.\nSi este mensaje tocó algo en ti,\nescríbeme "sí".	¿Estás reaccionando o estás eligiendo? Escríbeme "sí".	{#OrdenInterno,#RegulaciónEmocional,#MujerConsciente,#EleccionConsciente,#MujeresQueSeEligen,#TrabajoInterior}	{"scenes": [{"text": "Una mujer que no puede regularse…", "scene": 1, "duration": "4s", "description": "Pausa larga, mirada firme, silencio antes de hablar"}, {"text": "…no elige. Reacciona. Reacciona ante lo que le duele. Ante lo que le falta. Ante lo que le recuerda algo que aún no está ordenado. No porque quiera. Sino porque su sistema nervioso aprendió a sobrevivir así.", "scene": 2, "duration": "18s", "description": "Continuación directa"}, {"text": "Regularse no es callarse. No es aguantar más. Es aprender a hacer una pausa entre lo que sientes y lo que decides hacer. Esa pausa es el poder.", "scene": 3, "duration": "12s", "description": "Cambio de ritmo, más suave"}, {"text": "¿Estás reaccionando o estás eligiendo? Si esto te hace pensar, escríbeme \\"sí\\".", "scene": 4, "duration": "8s", "description": "Cierre directo, mirada empática"}]}	\N	Cámara frontal, plano medio, tono directo y sereno. Pausa larga antes del hook. Voz firme pero sin dureza.	reviewed	\N	pendiente	1	\N	2026-03-31 00:51:57.004+00	2026-03-31 00:51:57.004+00	\N
92efd345-45eb-4056-b928-2ad7265da1e6	ff436e16-482d-4321-ac07-fb3863222808	reel	mofu	La pausa que lo cambia todo	¿Y si el cambio no es hacer más, sino parar un segundo?	¿Y si el cambio no es hacer más, sino pausar un segundo?\nHay una fracción de tiempo\nentre lo que sientes\ny lo que haces.\nEsa fracción es donde vives tú.\nO donde vive el mandato.\nCuando empiezas a hacer una pausa,\nempiezas a elegir.\nNo lo que el miedo pide.\nNo lo que el sistema espera.\nLo que tú, desde tu centro, decides.\nSi esto te resonó, escríbeme "sí".	Escríbeme "sí".	{#OrdenInterno,#RegulaciónEmocional,#MujerConsciente,#EleccionConsciente,#MujeresQueSeEligen,#TrabajoInterior}	{"scenes": [{"text": "¿Y si el cambio no es hacer más, sino parar un segundo?", "scene": 1, "duration": "5s", "description": "Tono reflexivo, pausa al inicio"}, {"text": "Hay una fracción de tiempo entre lo que sientes y lo que haces. Esa fracción es donde vives tú. O donde vive el mandato.", "scene": 2, "duration": "12s", "description": "Desarrollo pausado"}, {"text": "Cuando empiezas a hacer una pausa, empiezas a elegir. No lo que el miedo pide. Lo que tú, desde tu centro, decides.", "scene": 3, "duration": "12s", "description": "Suave pero firme"}, {"text": "Esa pausa lo cambia todo. Si esto te resonó, escríbeme \\"sí\\".", "scene": 4, "duration": "5s", "description": "Cierre"}]}	\N	Selfie cercano, luz natural. Habla como si le hablara a una amiga. Sin guion rígido, fluido.	reviewed	\N	pendiente	2	\N	2026-03-31 00:51:57.007+00	2026-03-31 00:51:57.007+00	\N
b3ee053c-437e-4da1-bf30-509ca40ed04d	ff436e16-482d-4321-ac07-fb3863222808	carrusel	mofu	De la reacción a la elección: lo que cambia cuando te regulas	Antes y después de la regulación.	La diferencia entre reaccionar y elegir\nno está en la fuerza de voluntad.\nEstá en la regulación.\nUna mujer regulada no es una mujer que no siente.\nEs una mujer que puede hacer una pausa\nentre lo que siente y lo que hace.\nEsa pausa es lo que cambia el patrón.\nEsa pausa es lo que permite elegir.\nNo lo que el miedo pide.\nNo lo que el mandato indica.\nLo que tú, desde tu centro, decides.\nSi mientras leías algo se movió en ti,\nescríbeme "sí".	Escríbeme "sí".	{#OrdenInterno,#RegulaciónEmocional,#MujerConsciente,#EleccionConsciente,#MujeresQueSeEligen,#TrabajoInterior}	\N	{"slides": [{"text": "Lo que cambia cuando te regulas", "slide": 1, "title": "De la reacción a la elección", "visualNote": "Portada fondo ciruela apagado, letras claras"}, {"text": "Después: respondes desde el centro.", "slide": 2, "title": "Antes: reaccionas desde la herida.", "visualNote": "Fondo arena, dos líneas en contraste"}, {"text": "Después: dices \\"sí\\" porque lo eliges.", "slide": 3, "title": "Antes: dices \\"sí\\" por miedo al conflicto.", "visualNote": ""}, {"text": "Después: el cuerpo habla y tú escuchas.", "slide": 4, "title": "Antes: el cuerpo se tensa y actúas desde ahí.", "visualNote": ""}, {"text": "Después: pides lo que necesitas.", "slide": 5, "title": "Antes: cargas sola y en silencio.", "visualNote": ""}, {"text": "Después: te reconoces por lo que eres.", "slide": 6, "title": "Antes: te defines por lo que das.", "visualNote": ""}, {"text": "Después: tú decides.", "slide": 7, "title": "Antes: el mandato decide.", "visualNote": ""}, {"text": "Es recuperar tu capacidad de elegir.\\nSi esto te resonó, escríbeme \\"sí\\".", "slide": 8, "title": "Regularte no es controlarte.", "visualNote": "Cierre fondo malva, texto claro"}]}	Slides en contraste: un lado "antes" (fondo más oscuro/ciruela), otro lado "después" (fondo arena). Visual limpio.	reviewed	\N	pendiente	3	\N	2026-03-31 00:51:57.009+00	2026-03-31 00:51:57.009+00	\N
bb955e7c-3276-443b-b9dd-9261600ab2de	ff436e16-482d-4321-ac07-fb3863222808	carrusel	tofu	Señales de que tu sistema nervioso necesita regulación	Tu sistema nervioso habla. ¿Estás escuchando?	Muchas mujeres viven en estado de alerta\nsin saber que su sistema nervioso está saturado.\nNo es drama. No es exageración.\nEs el resultado de años sosteniendo\nlo que era demasiado para una sola persona.\nSi te reconoces en algo de lo que vas a leer,\nno es que estés rota.\nEs que tu sistema aprendió a sobrevivir.\nY puede aprender otra cosa.\nEscríbeme "sí" si esto te hace sentido.	Escríbeme "sí".	{#OrdenInterno,#RegulaciónEmocional,#MujerConsciente,#EleccionConsciente,#MujeresQueSeEligen,#TrabajoInterior}	\N	{"slides": [{"text": "", "slide": 1, "title": "Señales de que tu sistema nervioso necesita regulación", "visualNote": "Portada fondo malva, texto claro"}, {"text": "No es que seas difícil. El sistema está saturado.", "slide": 2, "title": "Te irritas fácilmente sin saber por qué", "visualNote": ""}, {"text": "Congelar también es una respuesta de supervivencia. No es cobardía.", "slide": 3, "title": "Te quedas paralizada cuando hay conflicto", "visualNote": ""}, {"text": "Para evitar tensión, para no incomodar, para que todo esté bien. El cuerpo paga el precio.", "slide": 4, "title": "Dices \\"sí\\" cuando quieres decir \\"no\\"", "visualNote": ""}, {"text": "Como si necesitaras justificarte para merecer decir \\"no\\".", "slide": 5, "title": "Te explicas de más cuando pones un límite", "visualNote": ""}, {"text": "Hipervigilancia. El sistema nervioso en modo protección permanente.", "slide": 6, "title": "Sientes que todo depende de ti", "visualNote": ""}, {"text": "Porque el cansancio no es físico. Es del sistema.", "slide": 7, "title": "El descanso nunca alcanza", "visualNote": ""}, {"text": "Tu sistema aprendió a sobrevivir.\\nY puede aprender otra cosa.\\nEscríbeme \\"sí\\" si esto te resuena.", "slide": 8, "title": "No estás rota.", "visualNote": "Cierre fondo ciruela, mensaje esperanzador"}]}	Slides de diagnóstico suave. Tipografía clara, sin alarmar. Tono compasivo.	reviewed	\N	pendiente	4	\N	2026-03-31 00:51:57.011+00	2026-03-31 00:51:57.011+00	\N
c43a9cd0-f50b-49f7-be4a-75ccf6ea4dac	ff436e16-482d-4321-ac07-fb3863222808	carrusel	mofu	Qué significa regularse de verdad	Regularse no es callarse. Es algo completamente diferente.	Hay mucha confusión sobre lo que significa regularse.\nNo es aguantar más en silencio.\nNo es reprimir lo que sientes.\nNo es forzar la calma.\nEs otra cosa.\nEs aprender a hacer una pausa,\na conectar con el cuerpo,\na reconocer el patrón antes de repetirlo.\nEsa es la regulación real.\nY esa regulación cambia cómo vives.\nSi esto te resuena, escríbeme "sí".	Escríbeme "sí".	{#OrdenInterno,#RegulaciónEmocional,#MujerConsciente,#EleccionConsciente,#MujeresQueSeEligen,#TrabajoInterior}	\N	{"slides": [{"text": "(y qué NO significa)", "slide": 1, "title": "Qué significa regularse de verdad", "visualNote": "Portada fondo arena, tipografía Cormorant"}, {"text": "Aguantar en silencio no es regulación. Es represión. Y tiene costo.", "slide": 2, "title": "No es callarse ni aguantar más", "visualNote": ""}, {"text": "Las emociones suprimidas no desaparecen. Se guardan en el cuerpo.", "slide": 3, "title": "No es suprimir lo que sientes", "visualNote": ""}, {"text": "El control forzado agota. La regulación real no agota: libera.", "slide": 4, "title": "No es controlarse a la fuerza", "visualNote": ""}, {"text": "Entre el estímulo y la respuesta. Esa pausa es donde vives tú.", "slide": 5, "title": "Regularse SÍ es hacer una pausa", "visualNote": "Separador visual aquí"}, {"text": "Sentir antes de actuar. Escuchar antes de responder.", "slide": 6, "title": "Regularse SÍ es conectar con el cuerpo", "visualNote": ""}, {"text": "Ver el patrón antes de repetirlo. Eso es conciencia. Eso es poder.", "slide": 7, "title": "Regularse SÍ es reconocer el patrón", "visualNote": ""}, {"text": "Eso es poder real.\\nSi esto te resonó, escríbeme \\"sí\\".", "slide": 8, "title": "Regularte es recuperar tu capacidad de elegir.", "visualNote": "Cierre fondo malva"}]}	Slides educativos, tipografía limpia. Contraste entre lo que NO es y lo que SÍ es regularse.	reviewed	\N	pendiente	5	\N	2026-03-31 00:51:57.013+00	2026-03-31 00:51:57.013+00	\N
57788058-9e34-4874-a70b-3d3fdf0cbc77	ff436e16-482d-4321-ac07-fb3863222808	post	mofu	Regularte no es callarte. Es aprender a elegir desde otro lugar.	Regularte no es callarte. Es aprender a elegir desde otro lugar.	Regularte no es aguantar más.\nNo es callarte para no generar conflicto.\nNo es volverte insensible.\nEs aprender a hacer una pausa\nentre lo que sientes\ny cómo respondes.\nMuchas mujeres creen que reaccionar fuerte\nes ser auténtica.\nY a veces sí.\nPero otras veces\nes el patrón hablando,\nno tú.\nCuando empiezas a regularte,\nno te vacías.\nTe recuperas.\nSi este mensaje llegó a ti,\nescríbeme "sí".	Escríbeme "sí".	{#OrdenInterno,#RegulaciónEmocional,#MujerConsciente,#EleccionConsciente,#MujeresQueSeEligen,#TrabajoInterior}	\N	\N	Post fondo arena. Hook en recuadro malva. Diseño limpio, tipografía elegante.	reviewed	\N	pendiente	6	\N	2026-03-31 00:51:57.015+00	2026-03-31 00:51:57.015+00	\N
3f64d03c-fd15-4d82-ae2f-6682a3af5e76	ff436e16-482d-4321-ac07-fb3863222808	post	tofu	El poder no es control. Es presencia.	El poder no es control. Es presencia.	El poder no es controlar tus emociones.\nNo es demostrar que puedes con todo.\nNo es estar siempre firme.\nEl poder es presencia.\nEs estar en ti,\nen tu cuerpo,\nen tu historia,\nincluso cuando duele.\nUna mujer presente\nno reacciona desde la herida.\nResponde desde su centro.\nEso no se aprende de un día para otro.\nPero se aprende.\nSi esto te tocó,\nescríbeme "sí".	Escríbeme "sí".	{#OrdenInterno,#RegulaciónEmocional,#MujerConsciente,#EleccionConsciente,#MujeresQueSeEligen,#TrabajoInterior,#OrdenInterno}	\N	\N	Post fondo arena. Hook con recuadro malva. Línea ciruela. Botón CTA ciruela apagado.	reviewed	\N	pendiente	7	\N	2026-03-31 00:51:57.018+00	2026-03-31 00:51:57.018+00	\N
1a9b45f4-d8e5-423b-aa32-b54449e0ccc5	29d5a531-52f7-4013-8e26-f4c667d37ed5	reel	bofu	Hay un momento en que seguir igual ya no es opción	Hay un momento en que seguir igual ya no es opción.	Hay un momento en que seguir igual ya no es opción.\nNo porque todo esté mal,\nsino porque tú ya no eres la misma.\nLlevas semanas mirando tus mandatos,\ntus cargas heredadas,\ntu cuerpo, tu lugar.\nEso no es casualidad.\nPor eso creé Reconociendo mi poder.\nUn espacio para mujeres\nque están listas para dejar el deber\ny empezar la elección.\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nSi sientes que este espacio es para ti,\nescríbeme PODER.	Escríbeme PODER.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	{"scenes": [{"text": "Hay un momento en que seguir igual ya no es opción.", "scene": 1, "duration": "5s", "description": "Pausa, mirada directa a cámara"}, {"text": "No porque todo esté mal, sino porque tú ya no eres la misma. Llevas semanas mirando tus mandatos, tus cargas heredadas, tu cuerpo, tu lugar.", "scene": 2, "duration": "12s", "description": "Desarrollo pausado"}, {"text": "Eso no es casualidad. Por eso creé Reconociendo mi poder. Un espacio para mujeres que están listas para dejar el deber y empezar la elección.", "scene": 3, "duration": "14s", "description": "Puente al entrenamiento, tono cálido y directo"}, {"text": "El 17 y 18 de marzo, de 6:30 a 9:30 pm. Si sientes que este espacio es para ti, escríbeme PODER y te cuento todo.", "scene": 4, "duration": "10s", "description": "Cierre claro con fechas"}]}	\N	Selfie cercano, luz cálida. Tono íntimo pero con convicción. Pausa larga antes del hook.	reviewed	\N	pendiente	1	\N	2026-03-31 00:51:57.024+00	2026-03-31 00:51:57.024+00	\N
6dac750d-3b62-400c-8d59-bb7dff4333d7	29d5a531-52f7-4013-8e26-f4c667d37ed5	reel	bofu	¿Estás lista para dejar el deber y empezar la elección?	¿Cuántos años llevas viviendo para cumplir?	¿Cuántos años llevas viviendo para cumplir?\nPara sostener.\nPara no incomodar.\nPara ser la fuerte.\nHay mujeres que hacen eso durante décadas\nsin preguntarse una vez:\n¿qué quiero yo?\nReconociendo mi poder es un espacio para esa pregunta.\nPara empezar a responderla.\nCon honestidad, con acompañamiento, con orden.\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER y lo vemos juntas.	Escríbeme PODER.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	{"scenes": [{"text": "¿Cuántos años llevas viviendo para cumplir?", "scene": 1, "duration": "4s", "description": "Hook directo"}, {"text": "Para sostener. Para no incomodar. Para ser la fuerte. Hay mujeres que hacen eso durante décadas sin preguntarse una vez: ¿qué quiero yo?", "scene": 2, "duration": "15s", "description": "Lista de roles"}, {"text": "Reconociendo mi poder es un espacio para esa pregunta. Para empezar a responderla con honestidad, con acompañamiento, con orden.", "scene": 3, "duration": "12s", "description": "Presentación del espacio"}, {"text": "17 y 18 de marzo, 6:30 a 9:30 pm. Escríbeme PODER y lo vemos juntas.", "scene": 4, "duration": "8s", "description": "Cierre con fecha y CTA"}]}	\N	Tono cálido y cercano. Hablar como si le hablara directamente a la mujer que siente esto. Sin distancia.	reviewed	\N	pendiente	2	\N	2026-03-31 00:51:57.026+00	2026-03-31 00:51:57.026+00	\N
dd57a6fd-a2bc-4a2d-b50d-f75ccc2ccd71	29d5a531-52f7-4013-8e26-f4c667d37ed5	carrusel	bofu	Reconocer tu poder no es imponerte	Reconocer tu poder no es imponerte.	Reconocer tu poder no es imponerte,\nni volverte dura, ni dejar de amar.\nEs dejar de abandonarte.\nEs regular tu emoción y elegir desde tu centro.\nEs ocupar tu lugar sin culpa.\nTodo lo que hablamos estas semanas tiene un hilo.\nY ese hilo es Reconociendo mi poder.\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER y te cuento todo.	Escríbeme PODER.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	\N	{"slides": [{"text": "", "slide": 1, "title": "Reconocer tu poder no es imponerte", "visualNote": "Portada fondo ciruela apagado, tipografía Cormorant grande"}, {"text": "", "slide": 2, "title": "No es levantar la voz para que te escuchen.", "visualNote": "Fondo arena, texto ciruela"}, {"text": "", "slide": 3, "title": "No es endurecerte para sobrevivir.", "visualNote": ""}, {"text": "", "slide": 4, "title": "No es dejar de amar para protegerte.", "visualNote": ""}, {"text": "", "slide": 5, "title": "Reconocer tu poder es dejar de abandonarte.", "visualNote": "Fondo malva, slide de transición"}, {"text": "", "slide": 6, "title": "Es regular la emoción y elegir desde el centro.", "visualNote": ""}, {"text": "", "slide": 7, "title": "Es ocupar tu lugar sin culpa.", "visualNote": ""}, {"text": "", "slide": 8, "title": "Es honrar tu historia sin repetirla.", "visualNote": ""}, {"text": "", "slide": 9, "title": "El poder real no empuja. Se sostiene.", "visualNote": ""}, {"text": "📅 17 y 18 de marzo · 6:30 – 9:30 pm\\nEscríbeme PODER si sientes que este proceso es para ti.", "slide": 10, "title": "✨ Reconociendo mi poder", "visualNote": "Cierre fondo ciruela, texto arena, CTA grande"}]}	Carrusel elegante, paleta completa de marca. Slide final con fechas y CTA destacado.	reviewed	\N	pendiente	3	\N	2026-03-31 00:51:57.029+00	2026-03-31 00:51:57.029+00	\N
61bc1d59-3107-47a3-9e32-43a9eb6cfbd8	29d5a531-52f7-4013-8e26-f4c667d37ed5	carrusel	bofu	¿Para quién es Reconociendo mi poder?	¿Para quién es Reconociendo mi poder?	Reconociendo mi poder no es para todas.\nNo porque unas merezcan más que otras.\nSino porque requiere una disposición particular.\nLa disposición de mirarse.\nDe hacer preguntas incómodas.\nDe estar presente incluso cuando duele.\nSi al leer esto sientes un "sí" interno,\nese sí sabe.\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER.	Escríbeme PODER.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	\N	{"slides": [{"text": "", "slide": 1, "title": "¿Para quién es Reconociendo mi poder?", "visualNote": "Portada fondo malva"}, {"text": "Que pone las necesidades de todos antes que las propias y ya no puede más.", "slide": 2, "title": "Para la mujer que se cansó de dar siempre al final", "visualNote": ""}, {"text": "Y quiere volver a sí. Sin saber exactamente cómo, pero con ganas de empezar.", "slide": 3, "title": "Para quien siente que algo se apagó", "visualNote": ""}, {"text": "\\"Ser fuerte\\". \\"No pedir\\". \\"No incomodar\\". Esos mandatos tienen nombre.", "slide": 4, "title": "Para quien lleva años sosteniendo mandatos que no eligió", "visualNote": ""}, {"text": "Que ve el patrón pero todavía no sabe cómo salir de él.", "slide": 5, "title": "Para quien sabe que reacciona y quiere aprender a elegir", "visualNote": ""}, {"text": "No para imponerse. Para dejar de desaparecer.", "slide": 6, "title": "Para quien está lista para tomar su lugar", "visualNote": ""}, {"text": "Es para quien está lista para mirarse con honestidad.", "slide": 7, "title": "No es para quien busca fórmulas.", "visualNote": ""}, {"text": "Si algo dentro de ti dice \\"esto soy yo\\", escríbeme PODER.", "slide": 8, "title": "📅 17 y 18 de marzo · 6:30 – 9:30 pm", "visualNote": "Cierre fondo ciruela, CTA destacado"}]}	Slides de identificación. La mujer se reconoce en cada descripción.	reviewed	\N	pendiente	4	\N	2026-03-31 00:51:57.031+00	2026-03-31 00:51:57.031+00	\N
a4b073e6-10db-4765-8405-30dba07ecb16	29d5a531-52f7-4013-8e26-f4c667d37ed5	carrusel	bofu	Lo que trabajamos en Reconociendo mi poder	Lo que trabajamos en Reconociendo mi poder.	Reconociendo mi poder no es motivación.\nNo es teoría.\nEs un proceso que trabaja desde la historia,\ndesde el cuerpo,\ndesde el sistema familiar.\nNo se trata de cambiarte.\nSe trata de reconocerte.\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER y te cuento cómo participar.	Escríbeme PODER.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	\N	{"slides": [{"text": "", "slide": 1, "title": "Lo que trabajamos en Reconociendo mi poder", "visualNote": "Portada fondo ciruela, Cormorant bold"}, {"text": "Los \\"deberías\\" que aprendiste y que todavía guían sin que lo elijas.", "slide": 2, "title": "Tu historia personal y los mandatos heredados", "visualNote": ""}, {"text": "Lo que cargas por amor al sistema familiar. Lo que no es tuyo pero que asumiste.", "slide": 3, "title": "Las lealtades invisibles", "visualNote": ""}, {"text": "Lo que guarda. Lo que dice. Cómo empezar a escucharlo.", "slide": 4, "title": "Tu cuerpo como territorio", "visualNote": ""}, {"text": "La pausa. La regulación. El acceso al poder real.", "slide": 5, "title": "La diferencia entre reaccionar y elegir", "visualNote": ""}, {"text": "En el sistema. En tus vínculos. En tu propia vida.", "slide": 6, "title": "Tomar el lugar que te corresponde", "visualNote": ""}, {"text": "Acompañado, respetuoso, profundo. A tu ritmo.", "slide": 7, "title": "No es teoría. Es proceso.", "visualNote": ""}, {"text": "Solo para mujeres.\\nEscríbeme PODER y te cuento todo.", "slide": 8, "title": "📅 17 y 18 de marzo · 6:30 – 9:30 pm", "visualNote": "Cierre fondo malva, CTA ciruela"}]}	Carrusel informativo, estructurado, paleta completa de marca.	reviewed	\N	pendiente	5	\N	2026-03-31 00:51:57.032+00	2026-03-31 00:51:57.032+00	\N
e0dadbc4-8849-4ff9-9ca9-66514f49e05d	29d5a531-52f7-4013-8e26-f4c667d37ed5	post	bofu	Presentación oficial de Reconociendo mi poder	Quiero presentarte Reconociendo mi poder.	Durante estas semanas hemos hablado de mandatos femeninos,\nde cargas heredadas,\ndel cuerpo como territorio,\nde la diferencia entre reaccionar y elegir,\nde tomar el lugar que te corresponde.\nTodo eso tiene un hilo.\nPor eso quiero presentarte formalmente\nReconociendo mi poder.\nNo es motivación. No es teoría.\nEs un espacio de acompañamiento profundo\npara mujeres que sienten\nque ya no quieren seguir viviendo en automático.\nAquí trabajamos:\n— Historia personal y mandatos\n— Lealtades invisibles y cargas heredadas\n— Regulación emocional\n— Tomar el lugar en el sistema\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\n💛 Solo para mujeres\nSi sientes que este espacio es para ti,\nescríbeme PODER\ny te envío la información completa.	Escríbeme PODER.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	\N	\N	Post fondo arena. Hook con recuadro malva. Info estructurada con Montserrat. CTA botón ciruela.	reviewed	\N	pendiente	6	\N	2026-03-31 00:51:57.036+00	2026-03-31 00:51:57.036+00	\N
1c4f2ab8-ef2b-4e79-b880-d353427e7257	29d5a531-52f7-4013-8e26-f4c667d37ed5	post	bofu	Este espacio no es para todas. Es para quien ya está lista.	Este espacio no es para todas. Es para quien ya está lista.	Este espacio no es para todas.\nNo es para quien quiere un cambio rápido.\nNi para quien busca una fórmula.\nEs para quien ya se cansó de sostener lo que no le corresponde.\nPara quien siente que algo se apagó\ny quiere volver a sí.\nPara la mujer que ya reconoce sus mandatos\ny quiere empezar a soltar.\nPara quien sabe que reacciona\ny quiere aprender a elegir.\nPara quien está lista para tomar su lugar.\nSi al leer esto sentiste un "sí" interno,\neste espacio es para ti.\n✨ Reconociendo mi poder\n📅 17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER y lo vemos juntas.	Escríbeme PODER.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	\N	\N	Post fondo arena. Hook en recuadro ciruela apagado (más oscuro). Diseño contenedor y elegante.	reviewed	\N	pendiente	7	\N	2026-03-31 00:51:57.038+00	2026-03-31 00:51:57.038+00	\N
bbba9e42-395c-4720-91d5-f77afefdc54a	b811f6bb-9901-4e1d-a4fc-a2898adabb8d	reel	bofu	Mañana empieza — previo al entrenamiento	Mañana empieza.	Mañana empieza.\nReconociendo mi poder.\nPara las mujeres que dijeron "sí"\ncuando algo dentro de ellas lo pedía.\nPara las que llegaron cansadas de sostener.\nPara las que quieren volver a sí.\nEstoy lista para sostener este proceso con ustedes.\nNos vemos mañana, 6:30 pm.\nSi todavía quieres participar,\nescríbeme PODER ahora.	Escríbeme PODER ahora.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	{"scenes": [{"text": "Mañana empieza.", "scene": 1, "duration": "4s", "description": "Emoción contenida, pausa"}, {"text": "Reconociendo mi poder. Para las mujeres que dijeron \\"sí\\" cuando algo dentro de ellas lo pedía. Para las que llegaron cansadas de sostener.", "scene": 2, "duration": "12s", "description": "Para las mujeres que vienen"}, {"text": "Estoy lista para sostener este proceso con ustedes. Si todavía quieres participar, escríbeme PODER ahora. Nos vemos mañana, 6:30 pm.", "scene": 3, "duration": "10s", "description": "Cierre con invitación de último momento"}]}	\N	Publicar el 16 de marzo. Tono emocional, agradecido. Mónica hablando desde el corazón.	reviewed	\N	pendiente	1	\N	2026-03-31 00:51:57.043+00	2026-03-31 00:51:57.043+00	\N
d41470f5-d528-4571-8542-cf8e7ecdb628	b811f6bb-9901-4e1d-a4fc-a2898adabb8d	reel	bofu	Algo se movió — post entrenamiento	Hace 48 horas algo se movió.	Hace 48 horas algo se movió.\nEn cada mujer que llegó con sus cargas.\nEn cada historia que encontró un orden.\nEn cada momento en que alguien se reconoció.\nReconociendo mi poder no es una promesa.\nEs un proceso.\nY estas mujeres dieron el primer paso.\nSi te quedaste con ganas,\nescríbeme "lista"\npara saber cuándo es la próxima edición.	Escríbeme "lista" para la próxima edición.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	{"scenes": [{"text": "Hace 48 horas algo se movió.", "scene": 1, "duration": "5s", "description": "Pausa, voz cargada de emoción contenida"}, {"text": "En cada mujer que llegó con sus cargas. En cada historia que encontró un orden. En cada momento en que alguien se reconoció.", "scene": 2, "duration": "12s", "description": "Desarrollo"}, {"text": "Reconociendo mi poder no es una promesa. Es un proceso. Si te quedaste con ganas, escríbeme \\"lista\\" para saber cuándo es la próxima edición.", "scene": 3, "duration": "12s", "description": "Cierre y apertura a próxima edición"}]}	\N	Publicar el 19 o 20 de marzo. Tono de gratitud y reflexión. Emoción genuina, sin guion rígido.	reviewed	\N	pendiente	2	\N	2026-03-31 00:51:57.044+00	2026-03-31 00:51:57.044+00	\N
669d0441-57aa-4d69-902a-b364c3e4f71d	b811f6bb-9901-4e1d-a4fc-a2898adabb8d	carrusel	bofu	¿Por qué elegir Reconociendo mi poder?	¿Por qué elegir este proceso?	No es motivación. Es acompañamiento real.\nTrabaja desde la historia, no desde el esfuerzo.\nConecta cuerpo, emoción y sistema.\nRespeta tu ritmo y tu historia.\nNo te exige ser otra.\nTe ayuda a volverte tú.\n📅 Última oportunidad.\n17 y 18 de marzo · 6:30 – 9:30 pm\nEscríbeme PODER.	Escríbeme PODER. Última oportunidad.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	\N	{"slides": [{"text": "Última oportunidad · 17 y 18 de marzo", "slide": 1, "title": "¿Por qué elegir Reconociendo mi poder?", "visualNote": "Portada fondo ciruela, texto arena, urgencia suave"}, {"text": "Es acompañamiento real desde la historia.", "slide": 2, "title": "Porque no es motivación.", "visualNote": ""}, {"text": "No desde el esfuerzo. Desde lo que está en la historia y en el cuerpo.", "slide": 3, "title": "Porque trabaja desde la raíz", "visualNote": ""}, {"text": "No es solo hablar. Es sentir, ordenar, reconocerse.", "slide": 4, "title": "Porque conecta cuerpo, emoción y sistema", "visualNote": ""}, {"text": "No hay comparación. No hay presión. Cada mujer avanza desde donde está.", "slide": 5, "title": "Porque respeta tu ritmo", "visualNote": ""}, {"text": "Te ayuda a volverte tú. Desde adentro.", "slide": 6, "title": "Porque no te exige ser otra", "visualNote": ""}, {"text": "6:30 – 9:30 pm\\nÚltima oportunidad.", "slide": 7, "title": "📅 17 y 18 de marzo", "visualNote": ""}, {"text": "y lo vemos juntas. 🤍", "slide": 8, "title": "Escríbeme PODER", "visualNote": "Cierre fondo malva, CTA grande"}]}	Publicar 16 de marzo. Urgencia suave, no agresiva. Paleta completa de marca.	reviewed	\N	pendiente	3	\N	2026-03-31 00:51:57.046+00	2026-03-31 00:51:57.046+00	\N
e6d60195-16a4-4629-bca9-3d2d2a46a8e0	b811f6bb-9901-4e1d-a4fc-a2898adabb8d	carrusel	bofu	Lo que cambió en ellas — post entrenamiento	Lo que cambió en ellas.	No siempre el cambio se ve de inmediato.\nPero algo se ordenó.\nAlgo se reconoció.\nAlgo empezó.\nEso es Reconociendo mi poder.\nSi quieres saber de la próxima edición,\nescríbeme "lista".	Escríbeme "lista" para la próxima edición.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	\N	{"slides": [{"text": "(después de Reconociendo mi poder)", "slide": 1, "title": "Lo que cambió en ellas", "visualNote": "Portada fondo malva, emoción en la imagen"}, {"text": "Salieron con más claridad sobre qué es suyo y qué no.", "slide": 2, "title": "Llegaron cargando historias que no eran suyas", "visualNote": ""}, {"text": "Salieron con una pausa nueva entre el estímulo y la respuesta.", "slide": 3, "title": "Llegaron reaccionando desde la herida", "visualNote": ""}, {"text": "Salieron recordando cuál es su lugar.", "slide": 4, "title": "Llegaron fuera de su lugar", "visualNote": ""}, {"text": "Salieron con más conciencia para empezar a responderlas.", "slide": 5, "title": "Llegaron con preguntas", "visualNote": ""}, {"text": "La semilla está puesta. El orden continúa.", "slide": 6, "title": "El proceso no termina aquí.", "visualNote": ""}, {"text": "Elegirte es el primer paso. Siempre.", "slide": 7, "title": "Gracias a cada mujer que eligió estar.", "visualNote": ""}, {"text": "Escríbeme \\"lista\\" para saber cuándo es la próxima edición 🤍", "slide": 8, "title": "¿Te quedaste con ganas?", "visualNote": "Cierre arena, apertura a próxima edición"}]}	Publicar 19-20 de marzo. Tono de celebración suave y esperanza.	reviewed	\N	pendiente	4	\N	2026-03-31 00:51:57.05+00	2026-03-31 00:51:57.05+00	\N
648954cc-cc86-4598-84ba-9c364f3c5376	b811f6bb-9901-4e1d-a4fc-a2898adabb8d	carrusel	mofu	Gracias por elegirte — cierre del proceso	Elegirte también es un acto de amor.	Elegirte no es egoísmo.\nEs responsabilidad contigo.\nEs decirle a tu sistema:\n"yo también importo".\nCada mujer que se elige\ncambia algo en su historia.\nGracias por estar.	Escríbeme "lista" para la próxima edición.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente,#MujeresQueSeEligen}	\N	{"slides": [{"text": "", "slide": 1, "title": "Gracias por elegirte", "visualNote": "Portada fondo ciruela apagado, letras claras, cálido"}, {"text": "", "slide": 2, "title": "Elegirte fue el primer paso.", "visualNote": ""}, {"text": "Mostrar tu historia requiere una valentía que muchos no ven.", "slide": 3, "title": "Aparecer fue valiente.", "visualNote": ""}, {"text": "que puedes hacer por ti misma.", "slide": 4, "title": "Mirar con honestidad es el acto más amoroso", "visualNote": ""}, {"text": "Lo que se movió en estos dos días no se detiene.", "slide": 5, "title": "El proceso continúa.", "visualNote": ""}, {"text": "Sigue escuchándote. Sigue eligiéndote.", "slide": 6, "title": "Solo está comenzando.", "visualNote": ""}, {"text": "Fue un honor sostener este espacio.", "slide": 7, "title": "Gracias por confiarme tu historia.", "visualNote": ""}, {"text": "Escríbeme \\"lista\\" y te aviso cuando abra inscripciones 🤍", "slide": 8, "title": "¿Quieres estar en la próxima edición?", "visualNote": "Cierre fondo arena, CTA suave"}]}	Publicar 20-21 de marzo. Carrusel de cierre, tono agradecido y esperanzador.	reviewed	\N	pendiente	5	\N	2026-03-31 00:51:57.053+00	2026-03-31 00:51:57.053+00	\N
60b6b449-11f8-4842-90c2-8267b2eafe01	b811f6bb-9901-4e1d-a4fc-a2898adabb8d	post	bofu	Mañana empieza	Mañana empieza.	Mañana empieza Reconociendo mi poder.\nPara las mujeres que dijeron "sí"\ncuando algo dentro de ellas lo pedía.\nPara las que llegaron cansadas de sostener.\nPara las que quieren volver a sí.\nEstoy lista para sostener este proceso con ustedes.\nGracias por elegirse.\nNos vemos mañana, 6:30 pm. 🤍\nSi todavía quieres participar,\nescríbeme PODER ahora.	Escríbeme PODER ahora.	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	\N	\N	Publicar 16 de marzo. Post de víspera. Fondo arena, hook en recuadro malva. Diseño cálido.	reviewed	\N	pendiente	6	\N	2026-03-31 00:51:57.055+00	2026-03-31 00:51:57.055+00	\N
94d38c09-ecf7-483c-b680-dd004fa8bcf4	b811f6bb-9901-4e1d-a4fc-a2898adabb8d	post	bofu	Algo se movió — post entrenamiento	Algo se movió.	El entrenamiento terminó.\nY algo se movió.\nEn cada mujer que llegó con sus cargas.\nEn cada historia que encontró un orden.\nEn cada momento en que alguien se reconoció.\nReconociendo mi poder no es una promesa.\nEs un proceso.\nY estas mujeres dieron el primer paso.\nSi te quedaste con ganas de estar en la próxima edición,\nescríbeme "lista"\ny te aviso cuando abra inscripciones.	Escríbeme "lista".	{#ReconociendoMiPoder,#MujerConsciente,#MujeresQueSeEligen,#EspacioSeguro,#AcompanamientoFemenino,#CoachingParaMujeres,#EntrenamientoConsciente}	\N	\N	Publicar 19-20 de marzo. Fondo arena. Hook en recuadro ciruela. Tono de gratitud y apertura.	reviewed	\N	pendiente	7	\N	2026-03-31 00:51:57.057+00	2026-03-31 00:51:57.057+00	\N
93622aa7-7439-45ec-b87b-b82b23829b0e	33c86778-d9a0-4b96-bb33-2a0ec645794c	reel	bofu	El Paso Final Hacia la Automatización Total	¿Listo para que tu negocio trabaje por ti?	La automatización total está al alcance de tu mano. Da el último paso con nosotros. #IA	Escríbeme para empezar hoy mismo.	{#IA,#EstrategiaDigital}	{"scenes": [{"text": "¿Listo para que tu negocio trabaje por ti?", "scene": 1, "duration": "5s", "description": "Presentador en un café, rodeado de tecnología"}, {"text": "La automatización total no es un sueño. Con nuestra tecnología, es una realidad que puedes alcanzar.", "scene": 2, "duration": "15s", "description": "Presentador muestra su laptop"}, {"text": "Imagina cada aspecto de tu negocio funcionando sin intervención constante. Así es como se ve el éxito automático.", "scene": 3, "duration": "20s", "description": "Presentador observa la pantalla, gesticulando con entusiasmo"}, {"text": "Escríbeme para empezar hoy mismo.", "scene": 4, "duration": "15s", "description": "Presentador cierra la laptop y sonríe a la cámara"}]}	\N	Presentador en un café, con laptop abierta, logo al cierre del reel.	generated	\N	pendiente	9	\N	2026-04-07 00:47:45.516+00	2026-04-07 00:47:45.516+00	\N
dcc0f1c8-a8c9-4dae-89f8-8260c45e96ff	33c86778-d9a0-4b96-bb33-2a0ec645794c	post	tofu	La importancia de soltar el control en tu negocio	¿Cuánto tiempo pierdes tratando de controlar cada detalle de tu negocio?	¿Cuánto tiempo pierdes tratando de controlar cada detalle de tu negocio? La verdad es que, en un intento por mantener todo bajo control, puedes estar sacrificando el crecimiento y la eficiencia que tanto deseas. ¿Te has detenido a pensar en cuántas oportunidades se han escapado mientras te ocupas de tareas repetitivas?\n\nImagina por un momento todo el tiempo que podrías liberar si no tuvieras que responder las mismas preguntas una y otra vez. Sin embargo, esta necesidad de tener el control absoluto a menudo impide que veas el potencial de la automatización. Al mantenerte atrapado en minucias, dejas de lado el enfoque en lo que realmente importa: hacer crecer tu negocio.\n\nPero, ¿qué pasa si decides soltar un poco el control y permites que la Inteligencia Artificial maneje esas tareas por ti? Puedes lograr que tu negocio funcione en piloto automático, mientras tú enfocas tu energía en estrategias que generen verdadero impacto.\n\nEs hora de replantear cómo gestionas tus recursos. Tal vez, soltar el control sea el primer paso hacia un negocio más eficiente y exitoso.\n\n¿Qué pasaría si te dieras la oportunidad de confiar más? Piénsalo.	¿Te resuena? Cuéntanos cómo gestionas tu tiempo.	{#AutomatizacionIA,#ChatbotIA,#WhatsAppBusiness,#InstagramMarketing,#AIdeasBoom,#IA,#PymesDigitales,#VentasAutomaticas,#EstrategiaDigital,#NegocioAutomatico}	\N	\N	Imagen de un empresario relajado, disfrutando de su tiempo libre. Logo en la esquina inferior derecha.	generated	\N	pendiente	8	/images/33c86778-d9a0-4b96-bb33-2a0ec645794c/post_8.png	2026-04-07 00:47:08.935+00	2026-04-07 00:49:18.529+00	\N
b51d6d8a-0146-404d-8c9a-670db89c026c	33c86778-d9a0-4b96-bb33-2a0ec645794c	carrusel	mofu	Transforma tu negocio con IA	¿Tu negocio podría funcionar sin ti?	Imagina un negocio que trabaja para ti, incluso cuando duermes. La inteligencia artificial te ofrece esa posibilidad. Conoce cómo la IA puede transformar tu negocio en una máquina autónoma y eficiente. #VentasAutomaticas #EstrategiaDigital	¿Sientes que es momento? Envíame un mensaje.	{#VentasAutomaticas,#EstrategiaDigital,#AIdeasBoom,#NegocioAutomatico}	\N	{"slides": [{"text": "", "slide": 1, "title": "¿Tu negocio podría funcionar sin ti?", "visualNote": "Imagen de una oficina vacía pero activa."}, {"text": "Un negocio que opera eficientemente sin tu intervención constante. La IA lo hace posible, liberándote de tareas repetitivas.", "slide": 2, "title": "El sueño de muchos", "visualNote": "Imagen de un empresario relajado en un sillón."}, {"text": "Con la IA, tu negocio nunca duerme. Atender clientes, procesar pedidos y manejar redes sociales, todo en piloto automático.", "slide": 3, "title": "Automatización 24/7", "visualNote": "Imagen de un reloj digital marcando las 3 AM."}, {"text": "Esta tecnología aprende y se adapta a las necesidades de tu negocio, optimizando procesos y mejorando la experiencia del cliente.", "slide": 4, "title": "La clave: Inteligencia Artificial", "visualNote": "Imagen de un panel tecnológico con gráficos ascendentes."}, {"text": "Delegando en la IA, puedes enfocarte en la estrategia y el crecimiento, en lugar de las operaciones diarias.", "slide": 5, "title": "Más tiempo para lo importante", "visualNote": "Imagen de una persona planificando en una pizarra."}, {"text": "Imagina tener la libertad de enfocarte en tu visión, sabiendo que tu negocio sigue funcionando perfectamente.", "slide": 6, "title": "La tranquilidad de un negocio autónomo", "visualNote": "Imagen de una persona mirando por una ventana con satisfacción."}, {"text": "Transformar tu negocio en una máquina autónoma es posible. ¿Listo para dar el paso?", "slide": 7, "title": "Hazlo realidad", "visualNote": "Imagen de un camino despejado hacia el horizonte."}]}	Colores neutros y profesionales, tipografía clara. Logo como marca de agua sutil en cada slide.	generated	\N	pendiente	9	/images/33c86778-d9a0-4b96-bb33-2a0ec645794c/carousel_9_s1.png	2026-04-07 00:47:24.113+00	2026-04-07 00:49:20.481+00	\N
57b4797e-3ad7-4b33-bb1f-480b688234e6	33c86778-d9a0-4b96-bb33-2a0ec645794c	post	mofu	Beneficios de automatizar tu atención al cliente	Imagina un negocio que responde a tus clientes incluso mientras duermes.	Imagina un negocio que responde a tus clientes incluso mientras duermes. La atención al cliente 24/7 ya no es un sueño lejano gracias a la Inteligencia Artificial. Pero, ¿por qué aún no lo has implementado? Tal vez pienses que es algo complicado, pero en realidad es más accesible de lo que crees.\n\nCuando tus clientes reciben respuestas rápidas y efectivas, su satisfacción aumenta, y con ello, también tus oportunidades de venta. Ignorar el potencial de la automatización podría estar costándote más de lo que imaginas en términos de fidelización y ventas perdidas.\n\nLa IA no solo mejora la experiencia de tus clientes, sino que también te permite liberar tiempo valioso que puedes dedicar a innovar y expandir tus horizontes. A medida que automatizas, comienzas a notar cómo tu negocio se transforma en una máquina eficiente, capaz de operar sin tu intervención constante.\n\nEs hora de dar un paso hacia un futuro más automatizado. ¿Estás listo para verlo en acción? Escríbeme PODER y te cuento cómo.	¿Quieres profundizar? Escríbeme PODER.	{#AutomatizacionIA,#ChatbotIA,#WhatsAppBusiness,#InstagramMarketing,#AIdeasBoom,#IA,#PymesDigitales,#VentasAutomaticas,#EstrategiaDigital,#NegocioAutomatico}	\N	\N	Imagen de un chatbot en un teléfono móvil, interactuando con un cliente. Logo en la esquina inferior derecha.	generated	\N	pendiente	9	/images/33c86778-d9a0-4b96-bb33-2a0ec645794c/post_9.png	2026-04-07 00:47:08.935+00	2026-04-07 00:49:18.659+00	\N
5c7485ac-5710-4105-ba76-d1e945b7cd20	33c86778-d9a0-4b96-bb33-2a0ec645794c	carrusel	tofu	Soltar el control y ganar libertad	Nadie te enseñó a soltar sin sentir que pierdes.	¿Cuántas veces sientes que el control es la única vía para el éxito? Sin embargo, soltar puede ser el primer paso hacia una verdadera libertad. Desliza y descubre cómo dejar ir puede ser tu mejor estrategia de crecimiento. #AutomatizacionIA #ChatbotIA	¿Te resuena? Compártelo y cuéntanos cómo te hizo sentir.	{#AutomatizacionIA,#ChatbotIA,#IAdeasBoom,#SoltarElControl}	\N	{"slides": [{"text": "", "slide": 1, "title": "Nadie te enseñó a soltar sin sentir que pierdes.", "visualNote": "Imagen de un ave volando libre."}, {"text": "Nos han enseñado que el control es sinónimo de éxito. Pero, ¿qué pasaría si soltar el control fuera la verdadera clave para crecer?", "slide": 2, "title": "El mito del control", "visualNote": "Imagen de una persona soltando un papel al viento."}, {"text": "Mantener el control puede ser agotador. Esa constante vigilancia drena tus energías y limita tus posibilidades de expansión.", "slide": 3, "title": "El peso invisible", "visualNote": "Imagen de una persona llevando una carga pesada."}, {"text": "Al soltar, abres espacio para nuevas oportunidades. Es en el vacío donde la creatividad y la innovación encuentran su hogar.", "slide": 4, "title": "La paradoja de soltar", "visualNote": "Imagen de un espacio vacío lleno de luz."}, {"text": "La automatización con IA es la herramienta que te permite soltar el control operativo, mientras tu negocio sigue creciendo.", "slide": 5, "title": "Automatización inteligente", "visualNote": "Imagen de un panel de control moderno y estilizado."}, {"text": "Al delegar tareas a la IA, recuperas tiempo para lo realmente importante: innovar y cuidar de ti mismo.", "slide": 6, "title": "Tu tiempo, tus reglas", "visualNote": "Imagen de una persona relajándose y leyendo."}, {"text": "Soltar el control no es perder, es ganar en libertad y eficiencia. ¿Te atreves a intentarlo?", "slide": 7, "title": "Libertad en la automatización", "visualNote": "Imagen de un empresario mirando hacia un horizonte despejado."}]}	Colores cálidos y calmantes, tipografía moderna. Logo en la esquina inferior derecha de cada slide.	generated	\N	pendiente	8	/images/33c86778-d9a0-4b96-bb33-2a0ec645794c/carousel_8_s1.png	2026-04-07 00:47:24.113+00	2026-04-07 00:49:19.579+00	\N
ad21713e-8447-4348-bc6b-7d59d2d7f257	33c86778-d9a0-4b96-bb33-2a0ec645794c	reel	mofu	Transformación Digital con IA	¿Te imaginas tu negocio funcionando solo, incluso mientras duermes?	La automatización no es el futuro, es el presente. Haz que tu empresa trabaje por ti, incluso cuando no estás. #NegocioAutomatico	Escríbeme si estás listo para dar el paso.	{#NegocioAutomatico,#EstrategiaDigital}	{"scenes": [{"text": "¿Te imaginas tu negocio funcionando solo, incluso mientras duermes?", "scene": 1, "duration": "5s", "description": "Presentador camina en un parque"}, {"text": "La automatización con IA hace esto posible. Tus ventas, atención al cliente y operaciones fluyen sin ti.", "scene": 2, "duration": "15s", "description": "Presentador se detiene y da un giro"}, {"text": "Con la IA, tu negocio se convierte en una máquina eficiente. Tú defines qué y cómo, nosotros lo hacemos realidad.", "scene": 3, "duration": "20s", "description": "Presentador muestra ejemplos en un teléfono"}, {"text": "Escríbeme si estás listo para dar el paso.", "scene": 4, "duration": "15s", "description": "Presentador cierra con un gesto de confianza"}]}	\N	Presentador caminando en un parque, logo al final del reel.	generated	\N	pendiente	7	\N	2026-04-07 00:47:45.516+00	2026-04-07 00:47:45.516+00	\N
1705c0a5-8e5e-4175-a148-e32a7142ca33	33c86778-d9a0-4b96-bb33-2a0ec645794c	reel	mofu	Cómo Escalar Sin Agobiarte	¿Sientes que no puedes escalar porque te falta tiempo?	Escalar tu negocio no tiene que ser agotador. Con IA, puedes expandir sin perder la cabeza. #PymesDigitales	Hablemos si quieres cambiar eso.	{#PymesDigitales,#AIdeasBoom}	{"scenes": [{"text": "¿Sientes que no puedes escalar porque te falta tiempo?", "scene": 1, "duration": "5s", "description": "Presentador sentado en un escritorio"}, {"text": "La IA es la clave para escalar sin agobios. Automatiza tareas y libera tu agenda.", "scene": 2, "duration": "15s", "description": "Presentador se inclina hacia la cámara"}, {"text": "Imagina manejar más clientes, más ventas y más proyectos sin estrés. La tecnología lo hace posible.", "scene": 3, "duration": "20s", "description": "Presentador señala una pizarra con gráficos"}, {"text": "Hablemos si quieres cambiar eso.", "scene": 4, "duration": "15s", "description": "Presentador asiente y sonríe"}]}	\N	Hablando a cámara desde un escritorio, logo en la esquina inferior derecha.	generated	\N	pendiente	8	\N	2026-04-07 00:47:45.516+00	2026-04-07 00:47:45.516+00	\N
a6c406c0-1f2b-4752-9fdf-2409b45e5e36	33c86778-d9a0-4b96-bb33-2a0ec645794c	reel	tofu	Las Preguntas Repetitivas y Cómo Solucionarlas	¿Cansado de responder las mismas preguntas siempre?	¿Cuántas veces al día te preguntan lo mismo tus clientes? Descubre cómo liberarte de esas repeticiones eternas con IA. #AutomatizacionIA	¿Quieres saber más? Escríbeme 'PODER'.	{#AutomatizacionIA,#ChatbotIA}	{"scenes": [{"text": "¿Cansado de responder las mismas preguntas siempre?", "scene": 1, "duration": "5s", "description": "Close-up del presentador"}, {"text": "Imagina poder automatizar esas respuestas y liberar tu tiempo para lo que realmente importa.", "scene": 2, "duration": "15s", "description": "Presentador gesticulando, mostrando frustración"}, {"text": "Con nuestra tecnología de IA, puedes hacerlo. Respuestas rápidas, clientes felices y más tiempo para crecer.", "scene": 3, "duration": "20s", "description": "Cambio de ángulo, presentador sonriendo"}, {"text": "¿Quieres saber más? Escríbeme 'PODER'.", "scene": 4, "duration": "15s", "description": "Presentador cierra con gesto de invitación"}]}	\N	Hablando a cámara, luz natural, logo en la esquina inferior derecha.	generated	\N	aprobado	5	\N	2026-04-07 00:47:45.516+00	2026-04-07 20:49:49.354+00	\N
a5db5273-47f0-46eb-b31f-a23cdd6c55fa	33c86778-d9a0-4b96-bb33-2a0ec645794c	reel	tofu	Ventajas de la Atención en Tiempo Real	¿Cuántos clientes pierdes por no responder a tiempo?	La velocidad de respuesta puede ser la diferencia entre cerrar una venta o perder un cliente. Con IA, la respuesta es inmediata. #VentasAutomaticas	Si te interesa, hablemos más.	{#VentasAutomaticas,#WhatsAppBusiness}	{"scenes": [{"text": "¿Cuántos clientes pierdes por no responder a tiempo?", "scene": 1, "duration": "5s", "description": "Primer plano del presentador con ceño fruncido"}, {"text": "La velocidad de respuesta es crucial. La IA permite que nunca más tengas que preocuparte por eso.", "scene": 2, "duration": "15s", "description": "Presentador moviéndose en la pantalla"}, {"text": "Atención al cliente 24/7 significa que tus clientes siempre son atendidos. Sin esperas, sin pérdidas.", "scene": 3, "duration": "20s", "description": "Presentador sonríe, mostrando seguridad"}, {"text": "Si te interesa, hablemos más.", "scene": 4, "duration": "15s", "description": "Cierre con gesto de apertura"}]}	\N	Hablando a cámara, enfoque en el rostro, logo como marca de agua sutil.	generated	\N	aprobado	6	\N	2026-04-07 00:47:45.516+00	2026-04-07 02:21:31.076+00	\N
\.


--
-- Data for Name: plannings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plannings (id, client_id, year, month, week, package_type, distribution, pieces, status, generated_prompt, approval_sheet_url, stories_sheet_url, drive_folder_url, created_at, updated_at) FROM stdin;
fe3ac721-b0b8-4fb9-89f2-058582428f63	d16a972b-0d8f-4b4b-89da-979b123eda22	2026	2	4	premium	{"bofu": 1, "mofu": 3, "tofu": 3, "posts": 2, "reels": 2, "total": 7, "carruseles": 3}	[]	approved	\N	\N	\N	\N	2026-03-31 00:51:56.954+00	2026-03-31 00:51:56.954+00
ff436e16-482d-4321-ac07-fb3863222808	d16a972b-0d8f-4b4b-89da-979b123eda22	2026	3	1	premium	{"bofu": 2, "mofu": 3, "tofu": 2, "posts": 2, "reels": 2, "total": 7, "carruseles": 3}	[]	approved	\N	\N	\N	\N	2026-03-31 00:51:57.001+00	2026-03-31 00:51:57.001+00
29d5a531-52f7-4013-8e26-f4c667d37ed5	d16a972b-0d8f-4b4b-89da-979b123eda22	2026	3	2	premium	{"bofu": 4, "mofu": 2, "tofu": 1, "posts": 2, "reels": 2, "total": 7, "carruseles": 3}	[]	approved	\N	\N	\N	\N	2026-03-31 00:51:57.022+00	2026-03-31 00:51:57.022+00
b811f6bb-9901-4e1d-a4fc-a2898adabb8d	d16a972b-0d8f-4b4b-89da-979b123eda22	2026	3	3	premium	{"bofu": 6, "mofu": 1, "tofu": 0, "posts": 2, "reels": 2, "total": 7, "carruseles": 3}	[]	approved	\N	\N	\N	\N	2026-03-31 00:51:57.041+00	2026-03-31 00:51:57.041+00
33c86778-d9a0-4b96-bb33-2a0ec645794c	d3bf9fe8-c61b-4a5c-a63e-d89d6b38ab7f	2026	4	1	reels_5	{"bofu": 2, "mofu": 3, "tofu": 4, "posts": 2, "reels": 5, "total": 9, "carruseles": 2}	[]	draft	\N	\N	\N	\N	2026-04-06 23:49:58.26+00	2026-04-06 23:49:58.26+00
\.


--
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stories (id, planning_id, related_content_id, day_of_week, day_label, "order", story_type, is_recorded, script, text_content, visual_direction, cta, sticker_suggestion, image_url, status, approval_status, client_comments, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: strategies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.strategies (id, client_id, period_type, year, quarter, month, strategy_data, conversion_active, created_at, updated_at) FROM stdin;
\.


--
-- Name: ab_content_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ab_content_approvals_id_seq', 1, false);


--
-- Name: ab_ig_conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ab_ig_conversations_id_seq', 1, false);


--
-- Name: ab_ig_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ab_ig_messages_id_seq', 1, false);


--
-- Name: content_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.content_queue_id_seq', 1, false);


--
-- Name: ab_content_approvals ab_content_approvals_content_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ab_content_approvals
    ADD CONSTRAINT ab_content_approvals_content_id_key UNIQUE (content_id);


--
-- Name: ab_content_approvals ab_content_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ab_content_approvals
    ADD CONSTRAINT ab_content_approvals_pkey PRIMARY KEY (id);


--
-- Name: ab_ig_conversations ab_ig_conversations_instagram_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ab_ig_conversations
    ADD CONSTRAINT ab_ig_conversations_instagram_user_id_key UNIQUE (instagram_user_id);


--
-- Name: ab_ig_conversations ab_ig_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ab_ig_conversations
    ADD CONSTRAINT ab_ig_conversations_pkey PRIMARY KEY (id);


--
-- Name: ab_ig_message_dedup ab_ig_message_dedup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ab_ig_message_dedup
    ADD CONSTRAINT ab_ig_message_dedup_pkey PRIMARY KEY (message_id);


--
-- Name: ab_ig_messages ab_ig_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ab_ig_messages
    ADD CONSTRAINT ab_ig_messages_pkey PRIMARY KEY (id);


--
-- Name: client_events client_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_events
    ADD CONSTRAINT client_events_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: clients clients_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_slug_key UNIQUE (slug);


--
-- Name: content_queue content_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_queue
    ADD CONSTRAINT content_queue_pkey PRIMARY KEY (id);


--
-- Name: contents contents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contents
    ADD CONSTRAINT contents_pkey PRIMARY KEY (id);


--
-- Name: plannings plannings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plannings
    ADD CONSTRAINT plannings_pkey PRIMARY KEY (id);


--
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- Name: strategies strategies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT strategies_pkey PRIMARY KEY (id);


--
-- Name: idx_ab_approvals_content; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ab_approvals_content ON public.ab_content_approvals USING btree (content_id);


--
-- Name: idx_ab_approvals_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ab_approvals_status ON public.ab_content_approvals USING btree (status);


--
-- Name: idx_content_queue_status_format; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_content_queue_status_format ON public.content_queue USING btree (status, format);


--
-- Name: plannings_client_id_year_month_week; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX plannings_client_id_year_month_week ON public.plannings USING btree (client_id, year, month, week);


--
-- Name: ab_ig_messages ab_ig_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ab_ig_messages
    ADD CONSTRAINT ab_ig_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ab_ig_conversations(id) ON DELETE CASCADE;


--
-- Name: client_events client_events_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_events
    ADD CONSTRAINT client_events_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contents contents_planning_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contents
    ADD CONSTRAINT contents_planning_id_fkey FOREIGN KEY (planning_id) REFERENCES public.plannings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: plannings plannings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plannings
    ADD CONSTRAINT plannings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stories stories_planning_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_planning_id_fkey FOREIGN KEY (planning_id) REFERENCES public.plannings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stories stories_related_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_related_content_id_fkey FOREIGN KEY (related_content_id) REFERENCES public.contents(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: strategies strategies_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT strategies_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict kAJcwxPmqcmb3Vg5MoSsT7kWalaXRyJW753S0RN2GsOjpQqdv2fAqv0tvPCxXKr

