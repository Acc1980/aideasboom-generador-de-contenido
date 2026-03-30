"""
importStoriesFromHTML.py
Lee los archivos HTML de stories de Monigrizales y los importa a la BD de AIdeasBoom.
"""
import os, re, uuid, html, subprocess
from html.parser import HTMLParser

# ── Mapeo archivo → planning_id y día ────────────────────────────────
PLANNING_SEMANA1 = 'be624f7a-8571-4919-a9a3-ce9c00bdfc6c'  # week 3, marzo
PLANNING_SEMANA2 = '9411e015-ab5d-45e2-abce-6ce9e9682df7'  # week 4, marzo
PLANNING_SEMANA3_MAR = '9411e015-ab5d-45e2-abce-6ce9e9682df7'  # lun30/mar31 → week 4 marzo
PLANNING_SEMANA3_ABR = '0eaec31d-476c-447e-afb1-a58597acac78'  # mie1-sab4 → week 1 abril

FILE_MAPPING = {
    # semana1
    'semana1/lun16-stories.html':    (PLANNING_SEMANA1, 1, 'Lunes'),
    'semana1/mar17-stories.html':    (PLANNING_SEMANA1, 2, 'Martes'),
    'semana1/mie18-stories.html':    (PLANNING_SEMANA1, 3, 'Miércoles'),
    'semana1/jue19-stories.html':    (PLANNING_SEMANA1, 4, 'Jueves'),
    'semana1/vie20-stories.html':    (PLANNING_SEMANA1, 5, 'Viernes'),
    'semana1/sab21-stories.html':    (PLANNING_SEMANA1, 6, 'Sábado'),
    # semana2
    'semana2/lun23-stories.html':    (PLANNING_SEMANA2, 1, 'Lunes'),
    'semana2/mar24-stories-am.html': (PLANNING_SEMANA2, 2, 'Martes'),
    'semana2/mar24-stories-pm.html': (PLANNING_SEMANA2, 2, 'Martes'),
    'semana2/mie25-stories.html':    (PLANNING_SEMANA2, 3, 'Miércoles'),
    'semana2/jue26-stories.html':    (PLANNING_SEMANA2, 4, 'Jueves'),
    'semana2/vie27-stories.html':    (PLANNING_SEMANA2, 5, 'Viernes'),
    'semana2/sab28-stories.html':    (PLANNING_SEMANA2, 6, 'Sábado'),
    # semana3 — toda va a week 1 abril
    'semana3/lun30-stories.html':    (PLANNING_SEMANA3_ABR, 1, 'Lunes'),
    'semana3/mar31-stories.html':    (PLANNING_SEMANA3_ABR, 2, 'Martes'),
    'semana3/mie1-stories.html':     (PLANNING_SEMANA3_ABR, 3, 'Miércoles'),
    'semana3/jue2-stories.html':     (PLANNING_SEMANA3_ABR, 4, 'Jueves'),
    'semana3/vie3-stories.html':     (PLANNING_SEMANA3_ABR, 5, 'Viernes'),
    'semana3/sab4-stories.html':     (PLANNING_SEMANA3_ABR, 6, 'Sábado'),
}

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'Monigrizales', 'contenido')

# ── Tipos de story desde el label ────────────────────────────────────
def parse_story_type(label: str) -> str:
    label_up = label.upper()
    if 'ENCUESTA' in label_up:   return 'encuesta'
    if 'TESTIMONIO' in label_up: return 'testimonio'
    if 'CTA' in label_up:        return 'cta_directa'
    if 'QUIZ' in label_up:       return 'quiz'
    if 'FAQ' in label_up:        return 'faq'
    if 'FINAL' in label_up:      return 'cierre'
    if 'TÍTULO' in label_up or 'TITULO' in label_up: return 'teaser'
    return 'reflexion'

def parse_sticker(label: str, text: str) -> str:
    label_up = label.upper()
    text_up  = text.upper()
    if 'ENCUESTA' in label_up: return 'encuesta'
    if 'SLIDER'   in text_up:  return 'slider'
    if 'PREGUNTA' in label_up: return 'pregunta_abierta'
    if 'QUIZ'     in label_up: return 'quiz'
    return ''

# ── Parser HTML simple ────────────────────────────────────────────────
class StoryParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stories = []      # [(label, text_lines)]
        self._in_label  = False
        self._in_story  = False
        self._depth     = 0
        self._cur_label = ''
        self._cur_texts = []
        self._skip_tags = {'script','style'}
        self._in_skip   = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get('class','')
        if tag in self._skip_tags:
            self._in_skip = True
            return
        if tag == 'p' and 'label' in cls:
            self._in_label = True
            return
        if tag == 'div' and 'story' in cls:
            # guardar anterior si había
            if self._in_story and self._cur_texts:
                self.stories.append((self._cur_label, ' '.join(self._cur_texts)))
            self._in_story = True
            self._depth    = 1
            self._cur_texts = []
            return
        if self._in_story:
            self._depth += 1

    def handle_endtag(self, tag):
        if tag in self._skip_tags:
            self._in_skip = False
            return
        if self._in_story:
            self._depth -= 1
            if self._depth <= 0:
                self.stories.append((self._cur_label, ' '.join(self._cur_texts)))
                self._in_story = False
                self._depth    = 0
                self._cur_texts = []
        if tag == 'p' and self._in_label:
            self._in_label = False

    def handle_data(self, data):
        if self._in_skip:
            return
        text = data.strip()
        if not text:
            return
        if self._in_label:
            self._cur_label = text
        elif self._in_story:
            # Ignorar marcas de agua y decorativos
            if text in ('✦', '↓', '—') or 'MÓNICA GRIZALES' in text:
                return
            self._cur_texts.append(text)


def escape_sql(s: str) -> str:
    return s.replace("'", "''")


def parse_html_file(filepath: str):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    parser = StoryParser()
    parser.feed(content)
    return parser.stories


def generate_inserts():
    inserts = []
    # Rastrear orden_offset para mar24 (am/pm en mismo día)
    day_counters = {}  # (planning_id, day_of_week) → orden actual

    for rel_path, (planning_id, day_of_week, day_label) in FILE_MAPPING.items():
        filepath = os.path.normpath(os.path.join(BASE_DIR, rel_path))
        if not os.path.exists(filepath):
            print(f'  [SKIP] No encontrado: {filepath}')
            continue

        stories = parse_html_file(filepath)
        key = (planning_id, day_of_week)
        if key not in day_counters:
            day_counters[key] = 0

        for label, text in stories:
            # Saltar filas vacías o puramente decorativas
            if not text.strip():
                continue

            day_counters[key] += 1
            order = day_counters[key]
            story_type = parse_story_type(label)
            sticker    = parse_sticker(label, text)
            is_cta     = story_type == 'cta_directa'

            cta_val    = ''
            if is_cta:
                # Buscar texto de CTA en el texto
                cta_match = re.search(r'(Inscríbete|Regístrate|Haz el quiz|Link aquí|Reserva)', text)
                cta_val   = cta_match.group(0) if cta_match else ''

            sid   = str(uuid.uuid4())
            txt   = escape_sql(text[:2000])
            lbl   = escape_sql(day_label)
            stype = escape_sql(story_type)
            cta_e = escape_sql(cta_val)
            stkr  = escape_sql(sticker)

            sql = (
                f"INSERT INTO stories "
                f"(id, planning_id, day_of_week, day_label, \"order\", story_type, "
                f"is_recorded, text_content, visual_direction, cta, sticker_suggestion, "
                f"status, approval_status, created_at, updated_at) VALUES ("
                f"'{sid}', '{planning_id}', {day_of_week}, '{lbl}', {order}, '{stype}', "
                f"false, '{txt}', '', '{cta_e}', '{stkr}', "
                f"'generated', 'pendiente', NOW(), NOW());"
            )
            inserts.append(sql)

    return inserts


if __name__ == '__main__':
    print('Generando inserts...')
    inserts = generate_inserts()
    print(f'Total: {len(inserts)} stories')

    sql_path = os.path.join(os.path.dirname(__file__), 'stories_import.sql')
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(inserts))
    print(f'SQL guardado en: {sql_path}')

    # Ejecutar en PostgreSQL
    psql = r'C:\Program Files\PostgreSQL\17\bin\psql.exe'
    env = {**os.environ, 'PGPASSWORD': 'admin123'}
    result = subprocess.run(
        [psql, '-h', 'localhost', '-U', 'postgres', '-d', 'aideasboom', '-f', sql_path],
        capture_output=True, text=True, env=env
    )
    if result.returncode == 0:
        print('Importacion exitosa.')
        print(result.stdout[:500] if result.stdout else '')
    else:
        print('ERROR:', result.stderr[:1000])
