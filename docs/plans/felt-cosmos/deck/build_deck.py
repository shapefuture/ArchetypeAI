"""Assemble the Felt Cosmos deck: inline images, generate repeated parts, write one HTML file."""
import base64, datetime, math, os, re, sys

deck_dir, assets_dir, thumbs_dir, out_path = sys.argv[1:5]

def data_uri(path, mime):
    with open(path, 'rb') as fh:
        return f'data:{mime};base64,' + base64.b64encode(fh.read()).decode()

sticker_files = {int(f[:2]): os.path.join(assets_dir, f) for f in os.listdir(assets_dir) if f.endswith('.webp')}
S = {n: data_uri(p, 'image/webp') for n, p in sticker_files.items()}
T = {f[:-4]: data_uri(os.path.join(thumbs_dir, f), 'image/jpeg') for f in os.listdir(thumbs_dir) if f.endswith('.jpg')}

def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

audit = [
    ('a1', 'A1 Home', 'Instructions, routes, tools, support and settings stacked on one screen'),
    ('a2', 'A2 Journal', 'A four-field form, «1. 1. Заметьте…», a muddy light-theme blur'),
    ('a3', 'A3 Universe', 'A seven-point manual hides the map on first entry'),
    ('a4', 'A4 Cabinet', 'Character art covers the part names'),
    ('a5', 'A5 Lab forms', 'Device-measurement forms and plan IDs shipped to users'),
    ('a6', 'A6 Check-in', 'Five jargon buttons for the window of tolerance'),
    ('a7', 'A7 Practice', 'Five «Закрыто» rows and no next step'),
    ('a8', 'A8 147 item', 'An ambiguous emoji scale and the instruction twice'),
    ('a9', 'A9 Results', 'Family emoji instead of the felt characters'),
    ('a10', 'A10 Synastry', '«Загрузить JSON партнёра» as a top-level tab'),
]
audit_html = ''.join(
    f'<div class="shot"><img src="{T[k]}" alt="Current app: {esc(lab)}" loading="lazy"><b>{esc(lab)}</b><span>{esc(note)}</span></div>'
    for k, lab, note in audit)

mock = [
    ('m1', 'M1 Night map', 'change', 'Keep the art, rebuild the screen'),
    ('m2', 'M2 Paywall', 'change', 'Becomes «Полная луна»'),
    ('m3', 'M3 Profile', 'change', 'Settings move to «Вы»'),
    ('m4', 'M4 Base', 'change', 'Tiles become feature art'),
    ('m5', 'M5 Узелки', 'change', 'Becomes the knot ritual; «ты» fixed'),
    ('m6', 'M6 Universe', 'keep', 'The best one: becomes the felt diorama'),
    ('m7', 'M7 Self', 'change', 'Becomes the eight-petal Sun'),
    ('m8', 'M8 64 item', 'change', 'Becomes the fitting screen'),
    ('m9', 'M9 147 item', 'drop', 'The emoji scale is retired'),
    ('m10', 'M10 Home', 'change', 'Route cards become spools'),
]
verdict = {'keep': 'Keep', 'change': 'Transform', 'drop': 'Drop'}
mock_html = ''.join(
    f'<div class="shot"><img src="{T[k]}" alt="Proposal mockup {esc(lab)}" loading="lazy"><b>{esc(lab)}</b><span class="chip {v}" style="justify-self:start">{verdict[v]}</span><span>{esc(note)}</span></div>'
    for k, lab, v, note in mock)

roles = {
    1: 'Default avatar', 2: 'Окно −2 · Атлас «Избегающий»', 3: 'Retired with the emoji scale', 4: 'Feeling: holding back',
    5: 'Chapter «Забота»', 6: '«Сшить по описанию»', 7: 'Friendly Plus lock', 8: 'Окно −1 · Атлас «Уставший»',
    9: 'Managers crest · the 64', 10: 'Окно 0 «В окне»', 11: 'Два неба', 12: 'Resources · «Потребность»',
    13: 'Plus', 14: 'Hero art · shading reference', 15: 'Луна · quiet hours', 16: 'Атлас «Утешитель»',
    17: 'Feeling: anger', 18: 'Example cast', 19: 'Firefighters crest', 20: 'Feeling: sad',
    21: 'Chapter «Отношения»', 22: 'Welcome · confident', 23: 'Install', 24: 'Feeling: anxious',
    25: 'First-run hero', 26: 'Sky decoration', 27: '«Ваша карта»', 28: 'Polarization art',
    29: 'Sky decoration', 30: 'Тихий уголок', 31: 'Атлас «Защитник»', 32: 'Луна with thread · logo',
    33: 'Облачко blanket', 34: 'Example cast · Страж', 35: '«Развернуть небо»', 36: 'Exile under the cloud',
    37: 'Окно +1 · Атлас «Тревожный стратег»', 38: '«Полная мерка» art', 39: 'Empty Узелки', 40: '«Земля, приём»',
    41: 'Example cast · Коуч', 42: 'Атлас «Внутренний критик»',
}
asset_html = ''.join(
    f'<div class="a{" unused" if n == 3 else ""}"><img src="{S[n]}" alt="" loading="lazy"><div><b>#{n:02d}</b><span>{esc(roles[n])}</span></div></div>'
    for n in sorted(S))

def moon_path(f, r=10.0, c=12.0):
    if f <= 0.002:
        return ''
    if f >= 0.998:
        return f'M{c},{c - r} A{r},{r} 0 1 1 {c},{c + r} A{r},{r} 0 1 1 {c},{c - r} Z'
    rx = r * abs(1 - 2 * f)
    sweep = 0 if f < 0.5 else 1
    return f'M{c},{c - r} A{r},{r} 0 0 1 {c},{c + r} A{rx:.2f},{r} 0 0 {sweep} {c},{c - r} Z'

def moon_svg(f, waxing, lit, disc, stroke='none', dash='', extra=''):
    flip = '' if waxing else ' transform="matrix(-1 0 0 1 24 0)"'
    d = moon_path(f)
    dash_attr = f' stroke-dasharray="{dash}"' if dash else ''
    lit_path = f'<path d="{d}" fill="{lit}"{flip}/>' if d else ''
    return (f'<svg viewBox="0 0 24 24" aria-hidden="true"{extra}><circle cx="12" cy="12" r="10" fill="{disc}" stroke="{stroke}" stroke-width="1.2"{dash_attr}/>'
            f'{lit_path}</svg>')

scale_labels = ['совсем не про меня', 'скорее не про меня', 'отчасти', 'скорее про меня', 'точно про меня']
moon_scale = ''.join(
    f'<button type="button" aria-pressed="false" aria-label="{i + 1}: {scale_labels[i]}">'
    f'{moon_svg(f, True, "#F6C744", "rgba(244,236,222,.10)", "rgba(244,236,222,.45)", "2 2")}</button>'
    for i, f in enumerate([0.0, 0.25, 0.5, 0.75, 1.0]))

SYNODIC = 29.530588853
REF_NEW = datetime.datetime(2000, 1, 6, 18, 14)
today = datetime.date(2026, 10, 27)

def age_on(day):
    noon = datetime.datetime(day.year, day.month, day.day, 12)
    return ((noon - REF_NEW).total_seconds() / 86400.0) % SYNODIC

def phase_name(age):
    bounds = [(1.84566, 'новолуние'), (5.53699, 'растущий серп'), (9.22831, 'первая четверть'), (12.91963, 'растущая луна'),
              (16.61096, 'полнолуние'), (20.30228, 'убывающая луна'), (23.99361, 'последняя четверть'), (27.68493, 'убывающий серп')]
    for b, name in bounds:
        if age < b:
            return name
    return 'новолуние'

today_age = age_on(today)
start = today - datetime.timedelta(days=int(today_age))
days = []
d = start
while True:
    days.append(d)
    d += datetime.timedelta(days=1)
    if age_on(d) < age_on(d - datetime.timedelta(days=1)):
        break
practiced = {0, 1, 3, 4, 5, 8, 9, 10, 12, 13, 15, 16, 18, 19, 20}

def rhythm(cls_size):
    out = []
    for i, day in enumerate(days):
        age = age_on(day)
        f = (1 - math.cos(2 * math.pi * age / SYNODIC)) / 2
        wax = age < SYNODIC / 2
        label = day.strftime('%d.%m')
        if day < today:
            lit = '#F6C744' if i in practiced else '#8A84A8'
            status = 'практика' if i in practiced else 'тихий день'
            out.append(moon_svg(f, wax, lit, '#2B2452', 'none', '', f' role="img" aria-label="{label}: {status}"'))
        elif day == today:
            out.append(moon_svg(f, wax, '#F6C744', '#2B2452', '#F4ECDE', '', f' role="img" aria-label="{label}: сегодня"'))
        else:
            out.append(moon_svg(f, wax, '#5D5780', '#2B2452', 'none', '', f' role="img" aria-label="{label}: впереди" style="opacity:.45"'))
    return ''.join(out)

rhythm_html = rhythm('s')

values = [0.6, 0.52, 0.62, 0.84, 0.55, 0.32, 0.58, 0.6]
cx = cy = 150.0
r0, r1, prx = 34.0, 104.0, 17.0
petals = []
for i, v in enumerate(values):
    ang = i * 45
    mid = (r0 + r1) / 2
    petals.append(f'<ellipse cx="{cx}" cy="{cy - mid}" rx="{prx}" ry="{(r1 - r0) / 2}" transform="rotate({ang} {cx} {cy})" fill="rgba(255,181,71,.16)" stroke="#B9761A" stroke-width="1.4" stroke-dasharray="{"5 4" if i == 5 else "3 2.5"}"/>')
    rv = r0 + v * (r1 - r0)
    fill = '#FFD25E' if i == 3 else '#FFB547'
    petals.append(f'<ellipse cx="{cx}" cy="{cy - (r0 + rv) / 2}" rx="{prx - 2}" ry="{(rv - r0) / 2}" transform="rotate({ang} {cx} {cy})" fill="{fill}"/>')
petal_sun = (
    '<svg class="petal-sun" viewBox="0 0 300 300" role="img" aria-label="Восемь лепестков Self-энергии: ярче всего Любопытство, тише всего Смелость">'
    '<circle cx="150" cy="150" r="140" fill="url(#g-sunglow)" opacity=".55"/>' + ''.join(petals) +
    '<circle cx="150" cy="150" r="30" fill="#FFC75A" stroke="#B9761A" stroke-width="1.4" stroke-dasharray="3 2.4"/>'
    '<path d="M139 148q3.5 3.5 7 0M154 148q3.5 3.5 7 0" stroke="#5A3A12" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
    '<path d="M145 157q5 4 10 0" stroke="#5A3A12" stroke-width="2" fill="none" stroke-linecap="round"/>'
    '<g font-family="Onest, sans-serif" font-size="13" font-weight="700">'
    '<text x="233" y="252" text-anchor="middle" fill="#FFD25E">Любопытство</text>'
    '<text x="67" y="252" text-anchor="middle" fill="rgba(244,236,222,.75)">Смелость</text></g>'
    '<path d="M246 214 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="#FFD25E"/>'
    '</svg>')

css = open(os.path.join(deck_dir, 'deck.css'), encoding='utf-8').read()
body = open(os.path.join(deck_dir, 'deck.body.html'), encoding='utf-8').read()
js = open(os.path.join(deck_dir, 'deck.js'), encoding='utf-8').read()

body = (body.replace('{{AUDIT_STRIP}}', audit_html).replace('{{MOCKUP_STRIP}}', mock_html)
        .replace('{{ASSET_GRID}}', asset_html).replace('{{MOON_SCALE}}', moon_scale)
        .replace('{{RHYTHM_PHONE}}', rhythm_html).replace('{{RHYTHM_BIG}}', rhythm_html)
        .replace('{{PETAL_SUN}}', petal_sun).replace('{{TODAY_PHASE}}', phase_name(today_age)))
body = re.sub(r'\{\{S(\d\d)\}\}', lambda m: S[int(m.group(1))], body)
left = re.findall(r'\{\{[^}]+\}\}', body)
if left:
    raise SystemExit(f'unreplaced placeholders: {sorted(set(left))}')

head = (
    '<title>Innerverse Felt Cosmos</title>\n'
    '<meta name="claude:viewport-fit-sides" content="cover">\n'
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;700;800;900&family=Onest:wght@400;500;600;700;800&family=Caveat:wght@500;600;700&family=Unbounded:wght@800&display=swap">\n'
)
html = head + '<style>\n' + css + '\n</style>\n' + body + '\n<script>\n' + js + '\n</script>\n'
with open(out_path, 'w', encoding='utf-8') as fh:
    fh.write(html)
print('wrote', out_path, f'{os.path.getsize(out_path) / 1024:.0f} kB', '| today phase:', phase_name(today_age), f'age {today_age:.1f}', '| month days:', len(days))
