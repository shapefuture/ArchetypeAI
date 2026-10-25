// E11 recognisable Felt roles (ArchetypeAI-b1kx, step 05 UI). The person may give one of their parts a role. The role is
// their authored choice, never generated, and it can be cleared. The module allows one authored role at a time, so the
// panel offers one. Expressions are not drawn here: the character renderer is not wired to this module yet.
import React, { useState } from 'react';
import { localizeParts } from '../../pal/seed-copy.ts';
import { useApp } from '../../app.jsx';
import { store, KEYS } from '../../core/local-store';
import { FELT_ROLES, authorRole, normalizeAuthoredRole } from '../../elevation/e11-felt-expression.ts';

export const FELT_ROLE_KEY = 'INNERVERSE_FELT_ROLE_V1';

const ROLE_LABELS = {
  en: { steward: 'Steward', guardian: 'Guardian', tender: 'Tender', companion: 'Companion' },
  ru: { steward: 'Попечитель', guardian: 'Страж', tender: 'Заботливый', companion: 'Спутник' },
};

const COPY = {
  en: {
    kicker: 'Roles',
    ask: 'Give one of your parts a role, if that helps you recognise it. You can clear it at any time.',
    pick: 'Choose a part',
    none: 'No parts saved yet.',
    clear: 'No role',
    current: 'Current role',
    unset: 'Not set',
    refused: 'That role could not be saved.',
  },
  ru: {
    kicker: 'Роли',
    ask: 'Если это помогает узнать одну из ваших частей, дайте ей роль. Её можно убрать в любой момент.',
    pick: 'Выберите часть',
    none: 'Частей пока нет.',
    clear: 'Без роли',
    current: 'Текущая роль',
    unset: 'Не задана',
    refused: 'Роль не удалось сохранить.',
  },
};

const partLabel = (part, lang) => (lang === 'ru' ? part.nameRu ?? part.name : part.nameEn ?? part.name) ?? part.id;

export function FeltRolesPanel() {
  const { lang } = useApp() ?? {};
  const lk = lang === 'ru' ? 'ru' : 'en';
  const copy = COPY[lk];
  const parts = localizeParts((Array.isArray(store.load(KEYS.parts, [])) ? store.load(KEYS.parts, []) : []).filter((part) => part && typeof part === 'object' && typeof part.id === 'string'), lang);
  const [authored, setAuthored] = useState(() => normalizeAuthoredRole(store.load(FELT_ROLE_KEY, null)));
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');

  const base = { arrival: 'ready', arrivalGreeted: true, selectedPart: null, authoredRole: authored, bookmark: 'none', request: 'none', scoredItemActive: false };

  const choose = (partId, role) => {
    const next = authorRole(base, partId, role);
    if (role !== null && next.authoredRole === null) { setMessage(copy.refused); return; }
    setAuthored(next.authoredRole);
    if (next.authoredRole) store.save(FELT_ROLE_KEY, next.authoredRole);
    else store.remove(FELT_ROLE_KEY);
    setMessage('');
  };

  const selectedRole = authored && selected && authored.partId === selected ? authored.role : null;

  return (
    <section className="card flat mt16" aria-labelledby="e11-title">
      <div className="kicker" id="e11-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      {parts.length === 0 && <p className="faint mt6" style={{ fontSize: 12 }}>{copy.none}</p>}
      {parts.length > 0 && (
        <div className="row wrap mt8" style={{ gap: 6 }} role="group" aria-label={copy.pick}>
          {parts.map((part) => (
            <button key={part.id} className="chip" aria-pressed={selected === part.id} onClick={() => setSelected(part.id)}>{partLabel(part, lk)}</button>
          ))}
        </div>
      )}
      {selected && (
        <div className="mt8">
          <p className="faint" style={{ fontSize: 12 }}>
            {copy.current}: {selectedRole ? ROLE_LABELS[lk][selectedRole] : copy.unset}
          </p>
          <div className="row wrap mt6" style={{ gap: 6 }} role="group" aria-label={copy.current}>
            {FELT_ROLES.map((role) => (
              <button key={role} className="chip" aria-pressed={selectedRole === role} onClick={() => choose(selected, role)}>{ROLE_LABELS[lk][role]}</button>
            ))}
            <button className="chip" onClick={() => choose(selected, null)}>{copy.clear}</button>
          </div>
        </div>
      )}
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}
    </section>
  );
}
