import React, { useState } from 'react';
import { useApp } from '../app.jsx';
import { store } from '../core/local-store.ts';
import { graduate, leaveOrRest } from '../core/quiet-mode.ts';
import {
  DEFAULT_SCENE_ID, REPLAY_KEY, WORLD_KEY, localizeDefaultScene, normalizeReplayRecord, normalizeWorld, saveVerified,
} from '../core/replay-scenes.ts';
import './replay.css';

const COPY = {
  en: {
    title: 'Quiet mode',
    intro: 'Resting keeps everything as it is. Nothing is lost, and nothing is due.',
    rest: 'Rest here',
    restNote: 'Resting never changes your places or your count of finished scenes.',
    restDone: 'Resting. Nothing changed.',
    placesHeading: 'Finished places',
    noPlaces: 'No scenes finished yet. Nothing is required here.',
    countLabel: (n) => `Scenes finished: ${n}`,
    unknownPlace: 'A finished scene',
    ownReplay: 'Your own Replay',
    graduate: 'Graduate from quiet mode',
    graduateAsk: 'Graduating is your choice. It ends quiet mode for now. Your places and count stay as they are.',
    graduateYes: 'Yes, graduate',
    graduateNo: 'Not now',
    graduated: 'You have graduated from quiet mode. Your places remain.',
    graduatedNotice: 'Graduated. Your places and count are unchanged.',
    notGraduated: 'Not graduated. Nothing changed.',
    notStored: 'This browser would not keep the change. It applies for this visit only.',
  },
  ru: {
    title: 'Тихий режим',
    intro: 'Отдых оставляет всё как есть. Ничего не теряется, и ничего не нужно сделать.',
    rest: 'Отдохнуть здесь',
    restNote: 'Отдых никогда не меняет ваши места и число завершённых сцен.',
    restDone: 'Отдых. Ничего не изменилось.',
    placesHeading: 'Завершённые места',
    noPlaces: 'Пока ни одна сцена не завершена. Здесь ничего не требуется.',
    countLabel: (n) => `Сцен завершено: ${n}`,
    unknownPlace: 'Завершённая сцена',
    ownReplay: 'Ваш собственный Реплей',
    graduate: 'Выйти из тихого режима',
    graduateAsk: 'Выход из тихого режима — ваш выбор. Он временно завершает тихий режим. Ваши места и число сцен останутся прежними.',
    graduateYes: 'Да, выйти',
    graduateNo: 'Не сейчас',
    graduated: 'Вы вышли из тихого режима. Ваши места сохранены.',
    graduatedNotice: 'Выход выполнен. Места и число сцен не изменились.',
    notGraduated: 'Выход не выполнен. Ничего не изменилось.',
    notStored: 'Браузер не сохранил изменение. Оно действует только для этого визита.',
  },
};

const copyFor = (lang) => ({ ...COPY.en, ...COPY[lang === 'ru' ? 'ru' : 'en'] });

/** Titles for finished places: the built-in scene, and the person's own Replay when one is saved. */
function placeTitles(lang, ui) {
  const titles = new Map([[DEFAULT_SCENE_ID, localizeDefaultScene(lang).title]]);
  const own = normalizeReplayRecord(store.load(REPLAY_KEY, null)).scene;
  if (own) titles.set(own.id, own.title || ui.ownReplay);
  return titles;
}

export function RestControl() {
  const app = useApp();
  const lang = app?.lang === 'ru' ? 'ru' : 'en';
  const ui = copyFor(app?.lang);
  const [world, setWorld] = useState(() => normalizeWorld(store.load(WORLD_KEY, null)));
  const [asking, setAsking] = useState(false);
  const [notice, setNotice] = useState('');
  const titles = placeTitles(lang, ui);

  const persist = (next) => {
    if (!saveVerified(WORLD_KEY, next)) { setNotice(ui.notStored); return false; }
    setWorld(next);
    return true;
  };

  const rest = () => {
    // Resting returns the world unchanged, so places and progress can never go down here.
    const next = leaveOrRest(world);
    setAsking(false);
    if (persist(next)) setNotice(ui.restDone);
  };

  // Graduation runs only from the explicit "Yes, graduate" button. Any other path passes false.
  const answer = (personChoseGraduation) => {
    const result = graduate(world, personChoseGraduation);
    setAsking(false);
    if (!persist({ ...result.world, graduated: world.graduated || result.graduated })) return;
    setNotice(personChoseGraduation ? ui.graduatedNotice : ui.notGraduated);
  };

  return (
    <section className="iv-panel" aria-labelledby="rest-control-title">
      <h2 id="rest-control-title">{ui.title}</h2>
      <p className="iv-panel-note">{ui.intro}</p>
      <p className="iv-status">{ui.countLabel(world.progress)}</p>

      <div className="iv-field-group">
        <h3>{ui.placesHeading}</h3>
        {world.places.length === 0
          ? <p className="iv-panel-note">{ui.noPlaces}</p>
          : <ul className="iv-list">{world.places.map((id) => <li key={id}>{titles.get(id) ?? ui.unknownPlace}</li>)}</ul>}
      </div>

      <div className="iv-row"><button type="button" className="btn primary small" onClick={rest}>{ui.rest}</button></div>
      <p className="iv-panel-note">{ui.restNote}</p>

      {world.graduated ? (
        <p className="iv-status">{ui.graduated}</p>
      ) : asking ? (
        <div className="iv-confirm">
          <p className="iv-panel-note">{ui.graduateAsk}</p>
          <div className="iv-row">
            <button type="button" className="btn small" onClick={() => answer(true)}>{ui.graduateYes}</button>
            <button type="button" className="btn ghost small" onClick={() => answer(false)}>{ui.graduateNo}</button>
          </div>
        </div>
      ) : (
        <div className="iv-row"><button type="button" className="btn ghost small" onClick={() => setAsking(true)}>{ui.graduate}</button></div>
      )}

      <p className="iv-status" role="status">{notice}</p>
    </section>
  );
}
