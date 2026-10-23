import React from 'react';
import { useApp } from '../app.jsx';
import { decideClientMap } from '../core/therapist-guard.ts';

const COPY = {
  en: {
    title: 'Map not shown',
    reasons: {
      'no-relationship': 'There is no active link with this client, so their map is not shown.',
      'wrong-account': 'This account is not the therapist on this link.',
      archived: 'This client is archived. Restore them to see their map.',
      revoked: 'The client has ended this link.',
      'report-not-granted': 'The client has not shared their map with you. A booking alone does not share it.',
      other: 'This map is not available to you right now.',
    },
  },
  ru: {
    title: 'Карта не показана',
    reasons: {
      'no-relationship': 'Связи с этим клиентом сейчас нет, поэтому карта не показывается.',
      'wrong-account': 'Этот аккаунт не является терапевтом по этой связи.',
      archived: 'Клиент в архиве. Восстановите его, чтобы видеть карту.',
      revoked: 'Клиент завершил эту связь.',
      'report-not-granted': 'Клиент не делился с вами картой. Одной записи для этого недостаточно.',
      other: 'Эта карта сейчас вам недоступна.',
    },
  },
};

/**
 * Renders `children` (the client's map data) only when decideAccess allows this
 * signed-in therapist to read it. A denied map is not rendered at all, so its data
 * never reaches the DOM.
 *
 * UI gate, not the security boundary. firestore.rules enforce the read on the server.
 * This component only decides what the screen draws.
 *
 * Usage: <GuardedClientData therapistUid={user.uid} client={client}>…map…</GuardedClientData>
 */
export function GuardedClientData({ therapistUid, client, revoked = false, children }) {
  const { lang, user } = useApp();
  const copy = COPY[lang === 'en' ? 'en' : 'ru'];
  const decision = decideClientMap({ therapistUid, actorUid: user?.uid ?? '', client, revoked });
  if (decision.allowed) return <>{children}</>;
  return (
    <div className="card flat mt8 guard-note" role="status" data-guard-reason={decision.reason}>
      <b style={{ fontSize: 13 }}>{copy.title}</b>
      <p className="faint mt6" style={{ fontSize: 12 }}>{copy.reasons[decision.reason] ?? copy.reasons.other}</p>
    </div>
  );
}
