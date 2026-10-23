import React, { useState } from 'react';
import { useApp } from '../app.jsx';
import { refreshEmailVerification, sendVerificationEmail } from '../core/auth.service';

const COPY = {
  en: {
    title: 'Verify your email so clients can find you',
    body: (email) => `Clients look therapists up by email. ${email} is not verified yet, so it does not appear in lookups. This stops someone else from claiming your address.`,
    send: 'Send verification email',
    sent: 'Sent. Open the link in that email, then check again here.',
    check: 'I have verified it — check again',
    still: 'Not verified yet. Open the link in the email, then try again.',
    done: 'Verified. Clients can now find you by email.',
    failed: 'That did not work. Check your connection and try again.',
  },
  ru: {
    title: 'Подтвердите email, чтобы клиенты могли вас найти',
    body: (email) => `Клиенты ищут специалиста по email. Адрес ${email} ещё не подтверждён, поэтому его не находят в поиске. Это не даёт другим присвоить ваш адрес.`,
    send: 'Отправить письмо для подтверждения',
    sent: 'Письмо отправлено. Откройте ссылку в нём, затем проверьте снова здесь.',
    check: 'Адрес подтверждён — проверить снова',
    still: 'Адрес пока не подтверждён. Откройте ссылку в письме и попробуйте снова.',
    done: 'Адрес подтверждён. Теперь клиенты могут найти вас по email.',
    failed: 'Не получилось. Проверьте подключение и попробуйте снова.',
  },
};

/** Shown to a signed-in email account whose address is not yet verified. */
export function EmailVerifyNotice() {
  const { lang, user, setUser } = useApp();
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  if (!user?.linked || !user.email || user.emailVerified) return status === 'done' ? <p className="sub mt12" role="status">{copy.done}</p> : null;

  const run = async (action) => {
    setBusy(true);
    try { setStatus(await action()); } catch { setStatus('failed'); } finally { setBusy(false); }
  };
  const send = () => run(async () => { await sendVerificationEmail(); return 'sent'; });
  const check = () => run(async () => {
    const next = await refreshEmailVerification();
    setUser(next);
    return next.emailVerified ? 'done' : 'still';
  });

  return (
    <div className="card flat mt12" role="region" aria-label={copy.title}>
      <div className="kicker" style={{ color: 'var(--accent-text)' }}>{copy.title}</div>
      <p className="sub mt8">{copy.body(user.email)}</p>
      <button className="btn primary block mt12" disabled={busy} onClick={send}>{copy.send}</button>
      <button className="btn block mt8" disabled={busy} onClick={check}>{copy.check}</button>
      {status && <p className="sub mt8" role="status">{copy[status]}</p>}
    </div>
  );
}
