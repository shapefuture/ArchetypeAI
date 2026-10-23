// E10 play with meaningful consequences (ArchetypeAI-waw, step 05 UI). A hypothetical rehearsal of the authored
// everyday scene. Every response is labelled hypothetical. Nothing is saved unless the person saves a move, and the
// canonical record is never touched. Node rules are empty for now, so no branch is blocked. Educated guess: a short
// authored scene with no role gates is enough for a first rehearsal.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { DEFAULT_SCENE_ID, localizeDefaultScene } from '../../core/replay-scenes.ts';
import { optionsAt, respond, startRehearsal } from '../../elevation/e10-scene-response.ts';

export const REHEARSAL_KEY = 'INNERVERSE_REHEARSAL_V1';

const COPY = {
  en: {
    kicker: 'Rehearse a scene',
    ask: 'A hypothetical rehearsal. Nothing here changes your real record.',
    optIn: 'I want to rehearse this scene',
    start: 'Start rehearsal',
    hypothetical: 'Hypothetical',
    saveMove: 'Save these steps as my move',
    refused: 'That step could not be taken.',
    reset: 'Start over',
    needOptIn: 'Tick the box first.',
  },
  ru: {
    kicker: 'Порепетировать сцену',
    ask: 'Гипотетическая репетиция. Ничего здесь не меняет вашу настоящую запись.',
    optIn: 'Я хочу порепетировать эту сцену',
    start: 'Начать репетицию',
    hypothetical: 'Гипотетически',
    saveMove: 'Сохранить эти шаги как мой ход',
    refused: 'Этот шаг нельзя сделать.',
    reset: 'Начать заново',
    needOptIn: 'Сначала отметьте поле.',
  },
};

function load() {
  const raw = store.load(REHEARSAL_KEY, null);
  if (!raw || typeof raw !== 'object' || typeof raw.nodeId !== 'string' || typeof raw.sceneId !== 'string') return null;
  return raw;
}

export function RehearsalPanel() {
  const { lang } = useApp() ?? {};
  const lk = lang === 'ru' ? 'ru' : 'en';
  const copy = COPY[lk];
  const localized = localizeDefaultScene(lk);
  const rehearsalScene = { id: DEFAULT_SCENE_ID, scene: localized.scene, rules: {} };
  const [rehearsal, setRehearsal] = useState(load);
  const [optIn, setOptIn] = useState(false);
  const [message, setMessage] = useState('');
  const [last, setLast] = useState(null);

  const persist = (next) => {
    setRehearsal(next);
    if (next) store.save(REHEARSAL_KEY, next);
    else store.remove(REHEARSAL_KEY);
  };

  const start = () => {
    if (!optIn) { setMessage(copy.needOptIn); return; }
    const started = startRehearsal(rehearsalScene, [], true);
    if (started.ok === false) { setMessage(copy.refused); return; }
    setLast(null);
    persist(started.rehearsal);
  };

  const choose = (targetId) => {
    if (!rehearsal) return;
    const result = respond(rehearsal, { kind: 'choose', targetId }, rehearsalScene);
    setLast(result.response);
    persist(result.rehearsal);
  };

  const saveMove = () => {
    if (!rehearsal) return;
    const result = respond(rehearsal, { kind: 'save-move' }, rehearsalScene);
    setLast(result.response);
    persist(result.rehearsal);
  };

  if (!rehearsal) {
    return (
      <section className="card flat mt16" aria-labelledby="e10-title">
        <div className="kicker" id="e10-title">{copy.kicker}</div>
        <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
        <label className="row mt8" style={{ gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
          <span style={{ fontSize: 13 }}>{copy.optIn}</span>
        </label>
        <button className="btn small primary block mt8" onClick={start}>{copy.start}</button>
        {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}
      </section>
    );
  }

  const options = optionsAt(rehearsal, rehearsalScene).filter((option) => option.possible);

  return (
    <section className="card flat mt16" aria-labelledby="e10-title">
      <div className="kicker" id="e10-title">{copy.kicker} · {copy.hypothetical}</div>
      <p className="mt8" style={{ fontSize: 14 }}>{last?.text ?? localized.scene.nodes.find((n) => n.id === rehearsal.nodeId)?.text}</p>
      {last?.textAlternative && <p className="faint mt4" style={{ fontSize: 12 }}>{last.textAlternative}</p>}
      <div className="row wrap mt8" style={{ gap: 6 }} role="group" aria-label={copy.kicker}>
        {options.map((option) => (
          <button key={option.targetId} className="chip" onClick={() => choose(option.targetId)}>
            {localized.choiceLabels[option.targetId] ?? option.targetId}
          </button>
        ))}
      </div>
      {rehearsal.steps.length > 0 && (
        <button className="btn small ghost block mt8" onClick={saveMove}>{copy.saveMove}</button>
      )}
      <button className="btn small ghost block mt6" onClick={() => persist(null)}>{copy.reset}</button>
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}
    </section>
  );
}
