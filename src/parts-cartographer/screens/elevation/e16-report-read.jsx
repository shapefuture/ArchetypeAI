// E16 therapist analysis of disagreement (ArchetypeAI-9ejq, step 05 UI). Shows whether this therapist may read a
// client's shared report, using the same decision as the pure E16 module. It is a UI status line only: the side-by-side
// comparison and the 3+1 view are not built yet, and the Firestore rules remain the security boundary.
import React from 'react';
import { useApp } from '../../app.jsx';
import { relationshipFor } from '../../core/therapist-guard.ts';
import { therapistReadDecision } from '../../elevation/e16-disagreement.ts';

const COPY = {
  en: {
    allowed: 'You can read this client\'s shared report.',
    notGranted: 'The client has not shared a report with you.',
    inactive: 'This link is no longer active.',
    none: 'There is no active link with this client.',
    expired: 'The shared report has expired.',
    other: 'Not available right now.',
    note: 'Side-by-side comparison and the 3+1 view are not built yet.',
  },
  ru: {
    allowed: 'Вы можете читать опубликованный клиентом отчёт.',
    notGranted: 'Клиент не делился с вами отчётом.',
    inactive: 'Эта связь больше не активна.',
    none: 'Активной связи с этим клиентом нет.',
    expired: 'Срок действия отчёта истёк.',
    other: 'Сейчас недоступно.',
    note: 'Сравнение рядом и вид 3+1 пока не реализованы.',
  },
};

const reasonKey = {
  'report-not-granted': 'notGranted',
  revoked: 'inactive',
  archived: 'inactive',
  'no-relationship': 'none',
  'grant-expired': 'expired',
};

export function ReportReadStatus({ client }) {
  const { lang, user } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const therapistUid = user?.uid ?? '';
  const decision = therapistReadDecision({
    therapistUid,
    relationship: relationshipFor(therapistUid, client),
    grant: client.summary ? { expiresAt: null } : null,
    now: new Date(),
  });
  return (
    <p className="faint mt8" role="status" style={{ fontSize: 12 }}>
      {decision.allowed ? copy.allowed : copy[reasonKey[decision.reason] ?? 'other']} {copy.note}
    </p>
  );
}
