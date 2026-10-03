import React, { useCallback, useEffect, useState } from 'react';
import { SpecialistReport } from './specialist-report.jsx';
import { useApp } from '../app.jsx';
import { lookupByEmail, lookupByUid } from '../core/user-directory.ts';
import {
  addAdminClient,
  addAdminEmail,
  checkAdminAccess,
  listAdminAllowlist,
  listAdminClients,
  loadAdminClientHistory,
  removeAdminClient,
  removeAdminEmail,
  saveAdminClientNotes,
} from '../core/admin.ts';

function formatTimestamp(value, lang) {
  if (!value) return '—';
  const date = typeof value === 'number' ? new Date(value) : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US');
}

function fileSlug(value) {
  return String(value || 'client').replace(/[^a-z0-9._-]+/gi, '-').slice(0, 80) || 'client';
}

function downloadSnapshot(snapshot, name) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileSlug(name)}-assessment.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function assessmentLabel(data, t) {
  return data?.profile?.headlineConstellation
    || data?.results?.analysis
    || data?.headline
    || t('assessmentSnapshot');
}

/** Verified-admin-only client management; Firestore rules enforce every operation. */
export function AdminDashboard() {
  const { t, lang, user, setOverlay, toast } = useApp();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState([]);
  const [clients, setClients] = useState([]);
  const [historyErrors, setHistoryErrors] = useState({});
  const [historyByClient, setHistoryByClient] = useState({});
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [clientUid, setClientUid] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');
  const [notesDrafts, setNotesDrafts] = useState({});
  const [notesBusy, setNotesBusy] = useState('');

  const refresh = useCallback(async () => {
    if (!user?.linked || !user.uid || !user.emailVerified) {
      setAuthorized(false);
      setChecking(false);
      return;
    }
    setChecking(true);
    setError('');
    try {
      const allowed = await checkAdminAccess(user);
      setAuthorized(allowed);
      if (!allowed) return;
      const [adminRows, clientRows] = await Promise.all([
        listAdminAllowlist(),
        listAdminClients(user.uid),
      ]);
      setAdmins(adminRows);
      setClients(clientRows);
      const failedHistories = {};
      const historyEntries = await Promise.all(clientRows.map(async (client) => {
        try { return [client.clientUid, await loadAdminClientHistory(client.clientUid)]; }
        catch (loadError) {
          console.warn('Admin client history could not be loaded', client.clientUid, loadError);
          failedHistories[client.clientUid] = t('adminLoadFailed');
          return [client.clientUid, []];
        }
      }));
      setHistoryErrors(failedHistories);
      setHistoryByClient(Object.fromEntries(historyEntries));
      setNotesDrafts(Object.fromEntries(clientRows.map((client) => [client.clientUid, client.notes || ''])));
    } catch (loadError) {
      console.error('Admin dashboard load failed', loadError);
      setAuthorized(false);
      setError(t('adminLoadFailed'));
    } finally {
      setChecking(false);
    }
  }, [user?.uid, user?.linked, user?.email, user?.emailVerified, t]);

  useEffect(() => { void refresh(); }, [refresh]);

  const currentUserId = user?.uid || '';

  const addAdmin = async () => {
    if (!currentUserId || busy) return;
    setBusy(true);
    setError('');
    try {
      await addAdminEmail(adminEmail, currentUserId);
      setAdminEmail('');
      await refresh();
      toast('✓ ' + t('adminAdded'));
    } catch (writeError) {
      console.error('Admin allowlist create failed', writeError);
      setError(t('adminWriteFailed'));
    } finally { setBusy(false); }
  };

  const deleteAdmin = async (email) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await removeAdminEmail(email);
      await refresh();
      toast('✓ ' + t('adminRemoved'));
    } catch (writeError) {
      console.error('Admin allowlist delete failed', writeError);
      setError(t('adminWriteFailed'));
    } finally { setBusy(false); }
  };

  const resolveClient = async () => {
    if (busy) return;
    setBusy(true);
    setLookupMessage('');
    setError('');
    let uid = clientUid.trim();
    let email = clientEmail.trim();
    try {
      if (!uid && email) {
        const found = await lookupByEmail(email);
        if (!found) throw new Error('not-found');
        uid = found.uid;
        email = found.email || email;
      } else if (uid && !email) {
        const found = await lookupByUid(uid);
        if (found?.email) email = found.email;
      }
      if (!uid) {
        setLookupMessage(t('adminClientNeedsId'));
        return;
      }
      if (uid === currentUserId) {
        setLookupMessage(t('adminSelfLinkDenied'));
        return;
      }
      await addAdminClient(currentUserId, uid, email || null);
      setClientUid('');
      setClientEmail('');
      setLookupMessage('');
      await refresh();
      toast('✓ ' + t('adminClientAdded'));
    } catch (lookupError) {
      console.error('Admin client link failed', lookupError);
      setLookupMessage(lookupError?.message === 'not-found' ? t('adminClientNotFound') : t('adminClientLookupFailed'));
    } finally { setBusy(false); }
  };

  const saveNotes = async (client) => {
    if (notesBusy) return;
    setNotesBusy(client.clientUid);
    setError('');
    try {
      const notes = notesDrafts[client.clientUid] ?? '';
      await saveAdminClientNotes(currentUserId, client.clientUid, notes);
      setClients((rows) => rows.map((row) => row.clientUid === client.clientUid ? { ...row, notes } : row));
      toast('✓ ' + t('adminNotesSaved'));
    } catch (writeError) {
      console.error('Admin client notes save failed', writeError);
      setError(t('adminWriteFailed'));
    } finally { setNotesBusy(''); }
  };

  const deleteClient = async (client) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await removeAdminClient(currentUserId, client.clientUid);
      await refresh();
      toast('✓ ' + t('adminClientRemoved'));
    } catch (writeError) {
      console.error('Admin client removal failed', writeError);
      setError(t('adminWriteFailed'));
    } finally { setBusy(false); }
  };

  if (checking) {
    return <div className="overlay"><div className="ov-head"><span className="grow">🛡️ {t('adminTools')}</span><button className="ibtn" onClick={() => setOverlay(null)}>✕</button></div><div className="ov-body"><p className="sub center" role="status">⏳ …</p></div></div>;
  }

  return (
    <div className="overlay">
      <div className="ov-head">
        <span className="grow">🛡️ {t('adminTools')}</span>
        <button className="ibtn" onClick={() => setOverlay(null)} aria-label={t('close')}>✕</button>
      </div>
      <div className="ov-body">
        {!authorized ? (
          <div className="card center">
            <div style={{ fontSize: 36 }}>🔒</div>
            <p className="sub mt8">{error || t('adminUnauthorized')}</p>
          </div>
        ) : (
          <>
            {error && <p className="faint" role="alert" style={{ color: 'var(--danger, #b54a4a)' }}>{error}</p>}
            {selectedSnapshot && (
              <div className="card mt12" role="region" aria-label={t('adminViewSnapshot')}>
                <div className="row">
                  <div className="grow">
                    <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('adminViewSnapshot')}</div>
                    <b>{assessmentLabel(selectedSnapshot.entry, t)}</b>
                    <div className="faint mt4" style={{ fontSize: 11 }}>{selectedSnapshot.client.clientEmail || selectedSnapshot.client.clientUid} · {formatTimestamp(selectedSnapshot.entry.createdAt || selectedSnapshot.entry.updatedAt, lang)}</div>
                  </div>
                  <button className="ibtn" onClick={() => setSelectedSnapshot(null)} aria-label={t('close')}>✕</button>
                </div>
                <SpecialistReport snapshot={selectedSnapshot.entry} clientLabel={selectedSnapshot.client.clientEmail || selectedSnapshot.client.clientUid} onBack={() => setSelectedSnapshot(null)} />
                <button className="btn block mt12" onClick={() => downloadSnapshot(selectedSnapshot.entry, selectedSnapshot.client.clientEmail || selectedSnapshot.client.clientUid)}>{t('download')}</button>
              </div>
            )}
            <div className="card">
              <div className="kicker" style={{ color: 'var(--accent-text)' }}>🛡️ {t('adminAllowlistTitle')}</div>
              <p className="sub mt8" style={{ fontSize: 12 }}>{t('adminAllowlistSub')}</p>
              <div className="field mt12"><input type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder={t('adminEmailPlaceholder')} /></div>
              <button className="btn primary block mt10" disabled={busy || !adminEmail.trim()} onClick={addAdmin}>{busy ? '⏳ …' : t('adminAddButton')}</button>
              {admins.map((entry) => (
                <div key={entry.email} className="card flat mt10">
                  <div className="row">
                    <div className="grow"><b>{entry.email}</b><div className="faint mt4" style={{ fontSize: 11 }}>{formatTimestamp(entry.createdAt, lang)}</div></div>
                    <button className="btn ghost small" disabled={busy || entry.email.toLowerCase() === 'admin@example.com'} onClick={() => deleteAdmin(entry.email)}>{t('remove')}</button>
                  </div>
                </div>
              ))}
              {!admins.length && <p className="faint mt10" style={{ fontSize: 12 }}>{t('adminAllowlistEmpty')}</p>}
            </div>

            <div className="card mt16">
              <div className="kicker" style={{ color: 'var(--accent-text)' }}>👥 {t('adminClientsTitle')}</div>
              <p className="sub mt8" style={{ fontSize: 12 }}>{t('adminClientsSub')}</p>
              <div className="field mt12"><input value={clientUid} onChange={(event) => setClientUid(event.target.value)} placeholder={t('clientUidPlaceholder')} /></div>
              <div className="field mt8"><input type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder={t('clientEmailPlaceholder')} /></div>
              <button className="btn primary block mt10" disabled={busy || (!clientUid.trim() && !clientEmail.trim())} onClick={resolveClient}>{t('adminAddClientButton')}</button>
              {lookupMessage && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{lookupMessage}</p>}
              {clients.map((client) => {
                const history = historyByClient[client.clientUid] || [];
                const latest = history[0];
                const currentDraft = notesDrafts[client.clientUid] ?? client.notes ?? '';
                return (
                  <div key={client.clientUid} className="card flat mt12">
                    <div className="row">
                      <div className="grow">
                        <b>{client.clientEmail || t('emailNone')}</b>
                        <div className="faint mt4" style={{ fontSize: 11, overflowWrap: 'anywhere' }}>{client.clientUid}</div>
                        <div className="faint mt4" style={{ fontSize: 11 }}>{t('clientLastAssessment')} {latest ? formatTimestamp(latest.createdAt || latest.updatedAt, lang) : historyErrors[client.clientUid] || t('noAssessmentYet')}</div>
                      </div>
                      <button className="btn ghost small" disabled={busy} onClick={() => deleteClient(client)}>{t('remove')}</button>
                    </div>
                    <div className="field mt10"><textarea rows={3} maxLength={4000} value={currentDraft} onChange={(event) => setNotesDrafts((drafts) => ({ ...drafts, [client.clientUid]: event.target.value }))} placeholder={t('adminPrivateNotesPlaceholder')} /></div>
                    <button className="btn small" disabled={notesBusy === client.clientUid || currentDraft === (client.notes || '')} onClick={() => saveNotes(client)}>{notesBusy === client.clientUid ? '⏳ …' : t('adminSaveNotes')}</button>
                    {historyErrors[client.clientUid] ? <p role="alert" className="sub mt10">{historyErrors[client.clientUid]}</p> : history.length === 0 ? <p className="faint mt10" style={{ fontSize: 12 }}>{t('noAssessmentYet')}</p> : history.map((entry, index) => (
                      <div key={entry.id || entry.createdAt || index} className="card flat mt10">
                        <div className="row">
                          <div className="grow">
                            <b style={{ fontSize: 12 }}>{assessmentLabel(entry, t)}</b>
                            <div className="faint mt4" style={{ fontSize: 11 }}>{formatTimestamp(entry.createdAt || entry.updatedAt, lang)}</div>
                          </div>
                          <div className="row" style={{ gap: 6 }}>
                            <button className="btn small" onClick={() => setSelectedSnapshot({ client, entry })}>{t('adminViewSnapshot')}</button>
                            <button className="btn small" onClick={() => downloadSnapshot(entry, client.clientEmail || client.clientUid)}>{t('download')}</button>
                          </div>
                        </div>
                        {entry.profile?.parts && <p className="faint mt8" style={{ fontSize: 11 }}>{entry.profile.parts.length} · {t('parts')}</p>}
                        {Array.isArray(entry.responses) && <p className="faint mt8" style={{ fontSize: 11 }}>{entry.responses.length} {t('assessmentResponsesLabel')}</p>}
                      </div>
                    ))}
                  </div>
                );
              })}
              {!clients.length && <p className="faint mt12" style={{ fontSize: 12 }}>{t('adminClientsEmpty')}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
