import React, { useId, useState } from 'react';
import { useApp } from '../app.jsx';
import { LINK_KINDS, NOTE_MAX, addUserLink, readUserLinks, removeUserLink, saveUserLinks } from '../core/part-links.ts';
import { partName, useMapLinks } from '../core/use-part-links.ts';
import { LINK_COLORS } from '../services/universe-scene';

const hex = (kind) => `#${LINK_COLORS[kind].toString(16).padStart(6, '0')}`;

/**
 * How this part relates to the others: the links the person drew, with their own description, and the links the
 * Parts map 2.0 states. The person can connect the part to another and say, in their words, what happens between them.
 */
export function PartConnections({ part }) {
  const { t, lang, parts, toast } = useApp();
  const { links, complexes } = useMapLinks(parts);
  const [adding, setAdding] = useState(false);
  const [other, setOther] = useState('');
  const [kind, setKind] = useState('protects');
  const [note, setNote] = useState('');
  const formId = useId();
  const byId = new Map(parts.map((p) => [p.id, p]));
  const mine = links.filter((link) => link.from === part.id || link.to === part.id);
  const complex = complexes.find((entry) => entry.members.includes(part.id));
  const others = parts.filter((p) => p.id !== part.id);

  const save = () => {
    if (!other) return;
    const ok = saveUserLinks(addUserLink(readUserLinks(), { from: part.id, to: other, kind, note }));
    toast(ok ? '🔗 ' + t('linkSave') : '⚠ ' + t('storageFull'));
    setAdding(false); setOther(''); setNote(''); setKind('protects');
  };
  const remove = (id) => { saveUserLinks(removeUserLink(readUserLinks(), id)); };

  return (
    <section className="card flat mt16 part-connections" aria-labelledby={`${formId}-title`}>
      <div className="kicker" id={`${formId}-title`}>🔗 {t('links')}</div>
      {complex && (
        <p className="sub" style={{ marginTop: 6 }} title={t('complexHint')}>
          ◌ {t('complexLabel')}: <strong>{partName(byId.get(complex.core), lang)}</strong> · {complex.members.map((id) => partName(byId.get(id), lang)).join(', ')}
        </p>
      )}
      {mine.length === 0 && !adding && <p className="faint" style={{ fontSize: 13, marginTop: 6 }}>{t('linksNone')}</p>}
      <ul className="part-links-list">
        {mine.map((link) => {
          const note = link.source === 'parts-2' && link.kind === 'polarized' ? t(`conflict_${link.note}`) : link.note;
          return (
            <li key={link.id}>
              <i className="part-link-swatch" style={{ background: hex(link.kind) }} aria-hidden="true" />
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 14 }}>
                  {partName(byId.get(link.from), lang)} <span style={{ color: hex(link.kind) }}>{t(`linkKind_${link.kind}`)}</span> {partName(byId.get(link.to), lang)}
                </div>
                {note ? <div className="sub" style={{ fontSize: 13, marginTop: 2 }}>{note}</div> : null}
                {link.source === 'parts-2' ? <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{t('linkFromMap')}</div> : null}
              </div>
              {link.source === 'user' && <button type="button" className="btn ghost small" onClick={() => remove(link.id)}>{t('linkRemove')}</button>}
            </li>
          );
        })}
      </ul>
      {adding ? (
        <div className="part-link-form mt8">
          <label className="faint" htmlFor={`${formId}-other`} style={{ fontSize: 12, fontWeight: 800 }}>{t('connectWith')}</label>
          <div className="field" style={{ marginTop: 4 }}>
            <select id={`${formId}-other`} value={other} onChange={(e) => setOther(e.target.value)}>
              <option value="">—</option>
              {others.map((p) => <option key={p.id} value={p.id}>{partName(p, lang)}</option>)}
            </select>
          </div>
          <div className="faint mt8" style={{ fontSize: 12, fontWeight: 800 }} id={`${formId}-how`}>{t('connectHow')}</div>
          <div className="row mt8" role="radiogroup" aria-labelledby={`${formId}-how`} style={{ gap: 6, flexWrap: 'wrap' }}>
            {LINK_KINDS.map((value) => (
              <button key={value} type="button" role="radio" aria-checked={kind === value} className={`chip${kind === value ? ' on' : ''}`}
                style={{ borderColor: hex(value), background: kind === value ? hex(value) + '33' : undefined }} onClick={() => setKind(value)}>
                {t(`linkKind_${value}`)}
              </button>
            ))}
          </div>
          <div className="field mt8">
            <textarea value={note} maxLength={NOTE_MAX} rows={3} aria-label={t('linkNotePh')} placeholder={t('linkNotePh')} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="row mt8" style={{ gap: 8 }}>
            <button type="button" className="btn ghost grow" onClick={() => setAdding(false)}>{t('back')}</button>
            <button type="button" className="btn primary grow" disabled={!other} onClick={save}>{t('linkSave')}</button>
          </div>
        </div>
      ) : (
        others.length > 0 && <button type="button" className="btn small block mt8" onClick={() => setAdding(true)}>＋ {t('connect')}</button>
      )}
    </section>
  );
}
