import React from 'react';
import { useApp } from '../app.jsx';
import { COLORS, EYES, FACES, HEADS, MOUTHS, SHAPES } from '../pal/traits.ts';
import { EyesIcon, FaceIcon, HeadIcon, MouthIcon, ShapeIcon } from '../pal/Character.tsx';

/* Names of the shapes, eyes and mouths the customizer offers, for tooltips and screen readers, in the active language. */
const TRAIT_NAMES = {
  en: {
    shape: { cloud: 'Cloud', frog: 'Frog', triangle: 'Triangle', heart: 'Heart', bean: 'Bean', drop: 'Drop', crescent: 'Crescent', square: 'Square', flower: 'Flower', mochi: 'Mochi', pentagon: 'Pentagon', pill: 'Pill', egg: 'Egg' },
    eyes: { ovals: 'Oval eyes', googly: 'Googly eyes', closed: 'Closed eyes', wink: 'Wink', tiny: 'Tiny eyes' },
    mouth: { none: 'No mouth', smile: 'Smile', o: 'Open mouth', flat: 'Flat mouth', grin: 'Grin' },
  },
  ru: {
    shape: { cloud: 'Облако', frog: 'Лягушка', triangle: 'Треугольник', heart: 'Сердце', bean: 'Фасолина', drop: 'Капля', crescent: 'Полумесяц', square: 'Квадрат', flower: 'Цветок', mochi: 'Моти', pentagon: 'Пятиугольник', pill: 'Таблетка', egg: 'Яйцо' },
    eyes: { ovals: 'Овальные глаза', googly: 'Глаза навыкате', closed: 'Закрытые глаза', wink: 'Подмигивание', tiny: 'Маленькие глаза' },
    mouth: { none: 'Без рта', smile: 'Улыбка', o: 'Открытый рот', flat: 'Ровный рот', grin: 'Широкая улыбка' },
  },
};

/* Cute chunky option buttons — style DNA from cutebuttons Customizer */
const BTN = {
  width: 46, height: 46, borderRadius: 16,
  display: 'grid', placeItems: 'center',
  background: 'var(--surface2)', border: '1.5px solid var(--line)',
  boxShadow: '0 5px 0 rgba(0,0,0,.4), inset 0 1.5px 0 rgba(255,255,255,.1)',
  transition: 'transform .1s, box-shadow .1s',
  color: 'var(--text)',
};
const ON = {
  ...BTN,
  background: '#FFD000', color: '#16161c', borderColor: '#e6bc00',
  transform: 'translateY(-2px)', boxShadow: '0 7px 0 #8a6d00',
};

function Section({ title, kicker, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ fontFamily: 'var(--font-round)', fontSize: 13.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>{title}</h3>
        <span className="faint" style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.18em', textTransform: 'uppercase' }}>{kicker}</span>
      </div>
      <div className="row wrap" style={{ gap: 9 }}>{children}</div>
    </div>
  );
}

export function CustomizerLike({ traits, onChange, disabled }) {
  const { t, lang } = useApp();
  const headLabels = lang === 'ru' ? { none: 'Без украшения', beret: 'Лунный гребень', halo: 'Кольцо Сатурна', horns: 'Планета', party: 'Звёздный росток' } : { none: 'No topper', beret: 'Moon crest', halo: 'Saturn ring', horns: 'Planet stalk', party: 'Star sprout' };
  const names = TRAIT_NAMES[lang === 'ru' ? 'ru' : 'en'];
  const b = (on) => (on ? ON : BTN);
  return (
    <div>
      <Section title={t('edSil')} kicker={t('edAnat')}>
        {SHAPES.map((s) => (
          <button key={s} title={names.shape[s]} aria-label={names.shape[s]} aria-pressed={traits.shape === s} disabled={disabled} style={b(traits.shape === s)} onClick={() => onChange({ shape: s })}>
            <ShapeIcon shape={s} className="" />
          </button>
        ))}
      </Section>

      <Section title={t('edFleece')} kicker={t('edDye')}>
        {COLORS.map((c) => (
          <button key={c.value} title={c.name} aria-label={c.name} aria-pressed={traits.color === c.value} disabled={disabled}
            style={{
              width: 40, height: 40, borderRadius: '50%', background: c.value,
              border: '2px solid rgba(0,0,0,.35)',
              boxShadow: '0 4px 0 rgba(0,0,0,.4), inset 0 2px 0 rgba(255,255,255,.35)',
              transform: traits.color === c.value ? 'scale(1.12)' : 'none',
              outline: traits.color === c.value ? '3px solid #FFD000' : 'none',
              outlineOffset: 2,
            }}
            onClick={() => onChange({ color: c.value })} />
        ))}
      </Section>

      <Section title={t('edGaze')} kicker={t('edWindows')}>
        {EYES.map((e) => (
          <button key={e} title={names.eyes[e]} aria-label={names.eyes[e]} aria-pressed={traits.eyes === e} disabled={disabled} style={b(traits.eyes === e)} onClick={() => onChange({ eyes: e })}>
            <EyesIcon style={e} />
          </button>
        ))}
      </Section>

      <Section title={t('edMug')} kicker={t('edOpt')}>
        {MOUTHS.map((m) => (
          <button key={m} title={names.mouth[m]} aria-label={names.mouth[m]} aria-pressed={traits.mouth === m} disabled={disabled} style={b(traits.mouth === m)} onClick={() => onChange({ mouth: m })}>
            <MouthIcon style={m} />
          </button>
        ))}
      </Section>

      <div className="row" style={{ gap: 20, alignItems: 'flex-start' }}>
        <div className="grow">
          <Section title={t('edLid')} kicker={t('edHead')}>
            {HEADS.map((h) => (
              <button key={h} title={headLabels[h]} aria-label={headLabels[h]} aria-pressed={traits.head === h} disabled={disabled} style={b(traits.head === h)} onClick={() => onChange({ head: h })}>
                <HeadIcon style={h} />
              </button>
            ))}
          </Section>
        </div>
        <div className="grow">
          <Section title={t('edFace')} kicker={t('edOptic')}>
            {FACES.map((f) => (
              <button key={f} title={f} aria-label={f} aria-pressed={traits.face === f} disabled={disabled} style={b(traits.face === f)} onClick={() => onChange({ face: f })}>
                <FaceIcon style={f} />
              </button>
            ))}
          </Section>
        </div>
      </div>

      <Section title={t('edExtras')} kicker={t('edDrama')}>
        <button disabled={disabled} style={{ ...b(traits.bow), width: 'auto', padding: '0 16px', fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-round)' }}
          onClick={() => onChange({ bow: !traits.bow })}>
          {t('edBow')} {traits.bow ? t('onT') : t('offT')}
        </button>
        <button disabled={disabled} style={{ ...b(traits.cheeks), width: 'auto', padding: '0 16px', fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-round)' }}
          onClick={() => onChange({ cheeks: !traits.cheeks })}>
          {t('edBlush')} {traits.cheeks ? t('onT') : t('offT')}
        </button>
      </Section>
    </div>
  );
}
