// E13 universal interaction grammar (ArchetypeAI-k936, step 05 UI). A read-only map of what can be saved, undone, paused,
// inspected or returned to in each core area. It is generated from the pure E13 registry, so it cannot drift from it.
import React from 'react';
import { useApp } from '../../app.jsx';
import { assessmentFree, predict } from '../../elevation/e13-grammar.ts';

const PATHS = ['assessment', 'map', 'coach', 'booking'];
const PRIMITIVES = ['save', 'undo', 'pause', 'inspect', 'return'];

const COPY = {
  en: {
    kicker: 'What you can save or undo',
    ask: 'The same controls work the same way in each area. This is a plain map of where each one is available.',
    paths: { assessment: 'Assessment', map: 'Your map', coach: 'Coach', booking: 'Booking' },
    primitives: { save: 'Save', undo: 'Undo', pause: 'Pause', inspect: 'Look at what is saved', return: 'Go back' },
    yes: 'Yes',
    no: 'Not here',
    free: 'Support without an assessment',
  },
  ru: {
    kicker: 'Что можно сохранить или отменить',
    ask: 'Одни и те же действия работают одинаково в каждом разделе. Здесь показано, где что доступно.',
    paths: { assessment: 'Опросник', map: 'Ваша карта', coach: 'Наставник', booking: 'Запись' },
    primitives: { save: 'Сохранить', undo: 'Отменить', pause: 'Пауза', inspect: 'Посмотреть сохранённое', return: 'Вернуться' },
    yes: 'Да',
    no: 'Недоступно',
    free: 'Поддержка без опросника',
  },
};

export function GrammarPanel() {
  const { lang } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  return (
    <section className="card flat mt16" aria-labelledby="e13-title">
      <div className="kicker" id="e13-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      <table className="mt8" style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th scope="col" style={{ textAlign: 'left' }}> </th>
            {PRIMITIVES.map((primitive) => <th key={primitive} scope="col">{copy.primitives[primitive]}</th>)}
          </tr>
        </thead>
        <tbody>
          {PATHS.map((path) => (
            <tr key={path}>
              <th scope="row" style={{ textAlign: 'left' }}>{copy.paths[path]}</th>
              {PRIMITIVES.map((primitive) => (
                <td key={primitive} style={{ textAlign: 'center' }}>{predict(path, primitive).supported ? copy.yes : copy.no}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="faint mt8" style={{ fontSize: 12 }}>
        {copy.free}: {PATHS.filter((path) => assessmentFree(path)).map((path) => copy.paths[path]).join(', ')}
      </p>
    </section>
  );
}
