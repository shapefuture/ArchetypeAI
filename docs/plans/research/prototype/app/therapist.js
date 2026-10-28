/* The therapist's side. The sky is the app's own 3+1D universe (bridge.js, loaded on demand). Parts are shown against
   their reference baselines in words, never in numbers. Clients are invented for the prototype. */
(function () {
  'use strict';
  var D = window.INNER_DATA;
  var C = window.INNER_COPY;
  var SHADOW = ['inner_critic', 'controller', 'pleaser', 'taskmaster', 'analyst', 'hermit', 'bypasser', 'numb', 'rebel', 'charmer', 'abandoned', 'ashamed', 'frightened', 'unseen'];
  var RES = ['sage', 'warrior', 'caregiver', 'explorer'];
  var ALL = SHADOW.concat(RES);
  var RANK = { dormant: 0, present: 1, prominent: 2, dominant: 3 };
  var WORD = { dormant: 'дремлет', present: 'присутствует', prominent: 'заметна', dominant: 'часто солирует' };
  var REL = { dormant: 'ниже обычного', present: 'около обычного', prominent: 'выше обычного', dominant: 'заметно выше обычного' };
  var AXES = [['AGENCY', 'Инициативность'], ['TEMPERATURE', 'Эмоциональность'], ['FOCUS', 'Фокус внимания'], ['ATTACHMENT', 'Близость и дистанция']];
  var AXIS_SHORT = { AGENCY: 'Инициатива', TEMPERATURE: 'Эмоции', FOCUS: 'Фокус', ATTACHMENT: 'Близость' };
  var CLIENTS = [
    { id: 'a', name: 'Клиент А', sessions: 3, note: 'Работаем с критиком и защитниками. Три сессии.' },
    { id: 'b', name: 'Клиент Б', sessions: 1, note: 'Первая сессия. Карта пока из сцен.' }
  ];
  var TH = { bridge: null, universe: null, host: null, sessions: null, client: 'a', session: 3, tab: 'sky', axes: ['AGENCY', 'TEMPERATURE', 'ATTACHMENT'], iso: null, sel: null, err: null };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dd(id, cls) { return '<svg class="dd ' + (cls || '') + '" viewBox="0 0 100 100" aria-hidden="true"><use href="#d-' + id + '"/></svg>'; }
  function nameOf(id) { return C.parts[id] ? C.parts[id].name : id; }
  function tierOf(id, session) { var row = session.raw.parts[id] || session.raw.resources[id] || {}; return row.tier || 'dormant'; }
  function tOf(id, session) { var row = session.raw.parts[id] || session.raw.resources[id] || {}; return row.T || 20; }
  function rankOf(id, session) { return RANK[tierOf(id, session)]; }
  function toast(msg) { if (window.InnerverseApp && window.InnerverseApp.toast) window.InnerverseApp.toast(msg); else { var t = document.getElementById('toast'); if (t) { t.textContent = msg; t.hidden = false; setTimeout(function () { t.hidden = true; }, 2600); } } }

  function loadBridge() {
    if (!TH.bridge) TH.bridge = import('./bridge/bridge.js').then(function (m) { return m.Bridge || window.InnerverseBridge; });
    return TH.bridge;
  }
  function sessionsOf(clientId) {
    return loadBridge().then(function (B) {
      if (!TH.sessions) TH.sessions = B.clientSessions();
      return clientId === 'a' ? TH.sessions : TH.sessions.slice(0, 1);
    });
  }
  function ensureHost() {
    if (!TH.host) { TH.host = document.createElement('div'); TH.host.className = 'uni-host'; TH.host.style.cssText = 'position:absolute;inset:0;'; }
    return TH.host;
  }
  function pushUniverse() {
    if (!TH.universe || !TH.sessions) return;
    var session = TH.sessions[TH.session - 1] || TH.sessions[0];
    TH.universe.setParts(session.parts);
    TH.universe.setView({ axes: TH.axes, isolation: TH.iso, selectedId: TH.sel });
  }
  function initUniverse(slot) {
    var host = ensureHost();
    slot.innerHTML = '';
    slot.appendChild(host);
    return loadBridge().then(function (B) {
      if (!TH.universe) {
        TH.universe = B.initUniverse(host, document.documentElement.getAttribute('data-mode') === 'sky', 'still');
        TH.universe.onPick(function (id) {
          TH.sel = id; pushUniverse();
          window.InnerverseApp.go('client', { id: TH.client, tab: 'sky' }, { replace: true });
        });
      } else {
        TH.universe.resize();
      }
      TH.universe.wake();
      pushUniverse();
      if (!TH.framed) { TH.framed = true; zoom(12); }
      return true;
    });
  }

  /* The app's universe opens wide (the whole room of parts at a distance). Wheel and pinch zoom it in, the same
     controls the app uses; here a few wheel steps frame the parts on a phone-sized card. */
  function zoom(steps) {
    var c = document.querySelector('#uniSlot canvas');
    if (!c) return;
    var r = c.getBoundingClientRect();
    for (var i = 0; i < Math.abs(steps); i += 1) {
      c.dispatchEvent(new WheelEvent('wheel', { deltaY: steps > 0 ? -100 : 100, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true }));
    }
  }

  /* ---------- views ---------- */
  function cabinet() {
    return '<section class="stack">' +
      '<div class="top"><div><div class="kicker">Кабинет терапевта</div><h1>Клиенты</h1></div><button class="btn exit" data-act="t-out">К себе</button></div>' +
      '<p class="muted">Здесь видно части и их место относительно обычного. Чисел нет: только слова и расположение.</p>' +
      '<div class="stack">' + CLIENTS.map(function (c) {
        return '<button class="card ico" data-act="t-open" data-id="' + c.id + '"><span><b class="h3" style="display:block">' + esc(c.name) + '</b><span class="muted" style="font-size:14px">' + esc(c.note) + '</span></span><span class="chev">›</span></button>';
      }).join('') + '</div>' +
      '<div class="card"><p class="kicker">Часы приёма</p><p style="margin-top:6px">Пн–Пт, 10:00–18:00. Часовой пояс — как на устройстве.</p></div>' +
      '<div class="card dash"><p class="kicker">Предложения коуча для проверки</p><p class="muted" style="margin-top:6px">В приложении ответы коуча попадают сюда только для проверки человеком. Ничего не применяется само. (План, в прототипе не показано.)</p></div>' +
      '<p class="faint">Клиенты в прототипе выдуманы.</p>' +
      '</section>';
  }

  function client(p) {
    var id = p.id || TH.client;
    if (TH.client !== id) { TH.client = id; TH.session = 3; TH.sel = null; TH.iso = null; TH.axes = ['AGENCY', 'TEMPERATURE', 'ATTACHMENT']; }
    if (p.tab) TH.tab = p.tab;
    var c = CLIENTS.filter(function (x) { return x.id === id; })[0] || CLIENTS[0];
    var tabs = [['sky', 'Небо'], ['parts', 'Части'], ['links', 'Связи'], ['dyn', 'Ход'], ['report', 'Отчёт']];
    var sessions = TH.sessions ? (id === 'a' ? TH.sessions : TH.sessions.slice(0, 1)) : null;
    var n = sessions ? sessions.length : c.sessions;
    var body = '';
    if (TH.tab === 'sky') {
      body = '<div class="axes-col">' + [0, 1, 2].map(function (i) {
        return '<label><span>Ось ' + 'XYZ'.charAt(i) + '</span><select data-act="t-axis" data-i="' + i + '">' + AXES.map(function (a) { return '<option value="' + a[0] + '"' + (TH.axes[i] === a[0] ? ' selected' : '') + '>' + a[1] + '</option>'; }).join('') + '</select></label>';
      }).join('') + '</div>' +
        '<div class="chips" style="gap:6px" role="group" aria-label="Показать только одну ось">' + AXES.map(function (a) { return '<button class="tag" data-act="t-iso" data-k="' + a[0] + '" aria-pressed="' + (TH.iso === a[0]) + '">' + AXIS_SHORT[a[0]] + '</button>'; }).join('') + '</div>' +
        '<div class="t3d" id="uniSlot" aria-label="Вселенная частей">' + (TH.err ? '<div class="msg">' + esc(TH.err) + '</div>' : '<div class="msg">Загружаю вселенную приложения…</div>') + '</div>' +
        '<div class="row"><button class="btn small ghost" data-act="t-zoom" data-k="in">Приблизить</button><button class="btn small ghost" data-act="t-zoom" data-k="out">Отдалить</button></div>' +
        '<div class="sess" role="group" aria-label="Сессия">' + [1, 2, 3].map(function (k) { return '<button data-act="t-session" data-k="' + k + '" aria-pressed="' + (TH.session === k) + '"' + (k > n ? ' disabled' : '') + '>Сессия ' + k + '</button>'; }).join('') + '</div>' +
        '<p class="faint">Части стоят на справочных местах. Размер — насколько часть заметна относительно обычного. Тяни, крути, тапни часть.</p>' +
        (TH.sel ? '<div class="card"><b class="h3">' + esc(nameOf(TH.sel)) + '</b><p class="muted" style="margin-top:4px">Сейчас: ' + (sessions ? WORD[tierOf(TH.sel, sessions[TH.session - 1] || sessions[0])] : '') + '. Открой «Части и норму», чтобы сравнить с обычным.</p></div>' : '');
    } else if (TH.tab === 'parts') {
      body = '<div class="stack">' + (sessions ? ALL.slice().sort(function (a, b) { return rankOf(b, sessions[TH.session - 1] || sessions[0]) - rankOf(a, sessions[TH.session - 1] || sessions[0]); }).map(function (pid) {
        var s = sessions[TH.session - 1] || sessions[0];
        var t = tierOf(pid, s), pos = Math.max(0, Math.min(100, (tOf(pid, s) - 20) / 60 * 100));
        return '<div class="card"><div class="between"><b class="h3">' + esc(nameOf(pid)) + '</b><span class="stage ' + t + '">' + WORD[t] + '</span></div>' +
          '<div class="rel" style="margin-top:10px"><div class="rel-track"><span class="rel-mark" style="left:' + pos.toFixed(1) + '%"></span></div><div class="rel-scale"><span>ниже обычного</span><span>обычно</span><span>выше обычного</span></div></div>' +
          '<p class="muted" style="margin-top:6px">Относительно обычного: ' + REL[t] + '.</p></div>';
      }).join('') : '<p class="muted">Загружаю карту…</p>') + '</div>';
    } else if (TH.tab === 'links') {
      var s2 = sessions ? sessions[TH.session - 1] || sessions[0] : null;
      var pairs = s2 ? D.polarizations.filter(function (q) { return rankOf(q[0], s2) >= 2 && rankOf(q[1], s2) >= 2; }) : [];
      var quiet = s2 ? D.polarizations.filter(function (q) { return !(rankOf(q[0], s2) >= 2 && rankOf(q[1], s2) >= 2); }) : [];
      body = '<div class="stack">' + (pairs.length ? pairs.map(function (q) { return '<div class="card pink"><p class="kicker">Цикл активен</p><p class="h3" style="margin-top:4px">' + esc(q[2]) + '</p><p style="margin-top:6px">' + esc(nameOf(q[0])) + ' и ' + esc(nameOf(q[1])) + ' заметны одновременно. Они тянут в разные стороны.</p></div>'; }).join('') : '<div class="card mint"><p class="h3">Циклов сейчас нет</p><p class="muted" style="margin-top:6px">Ни одна пара не заметна одновременно.</p></div>') +
        '<div class="card dash"><p class="kicker">Ещё не активны</p><ul class="muted" style="margin:6px 0 0;padding-left:18px">' + quiet.slice(0, 4).map(function (q) { return '<li>' + esc(q[2]) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="card"><p class="kicker">Кто кого охраняет</p><p class="muted" style="margin-top:6px">Защитники чаще всего охраняют тех, кому больно. Связи из карты, без весов.</p><ul style="margin:8px 0 0;padding-left:18px">' + ['controller', 'pleaser', 'numb', 'rebel'].map(function (pid) { var g = D.guards[pid] || {}; var names = Object.keys(g).sort(function (a, b) { return g[b] - g[a]; }).slice(0, 2).map(nameOf); return '<li><b>' + esc(nameOf(pid)) + '</b> — ' + esc(names.join(', ')) + '</li>'; }).join('') + '</ul></div>' +
        '</div>';
    } else if (TH.tab === 'dyn') {
      body = '<div class="stack"><p class="muted">Слова, не числа: как каждая часть менялась от первой сессии к последней.</p>' + (TH.sessions ? ALL.map(function (pid) {
        var seq = (id === 'a' ? TH.sessions : TH.sessions.slice(0, 1)).map(function (s) { return tierOf(pid, s); });
        var first = RANK[seq[0]], last = RANK[seq[seq.length - 1]];
        var verdict = seq.length < 2 ? 'одна сессия' : last > first ? 'громче' : last < first ? 'тише' : 'без изменений';
        return '<div class="card dyn"><div><b>' + esc(nameOf(pid)) + '</b><div class="path">' + seq.map(function (t) { return WORD[t]; }).join(' → ') + '</div></div><span class="tag">' + verdict + '</span></div>';
      }).join('') : '<p class="muted">Загружаю карту…</p>') + '</div>';
    } else if (TH.tab === 'report') {
      body = report({ id: id }).replace(/^<section class="stack">/, '').replace(/<\/section>$/, '');
    }
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="go" data-to="therapist" aria-label="Назад">←</button><div><div class="kicker">' + esc(c.name) + '</div><h1>Вселенная клиента</h1></div><span></span></div>' +
      '<div class="seg tight" role="group" aria-label="Раздел">' + tabs.map(function (t) { return '<button data-act="t-tab" data-k="' + t[0] + '" aria-pressed="' + (TH.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      body + '</section>';
  }

  function report(p) {
    var id = (p && p.id) || TH.client;
    var c = CLIENTS.filter(function (x) { return x.id === id; })[0] || CLIENTS[0];
    var sessions = TH.sessions ? (id === 'a' ? TH.sessions : TH.sessions.slice(0, 1)) : null;
    if (!sessions) return '<section class="stack"><p class="muted">Отчёт собирается из карты. Открой вкладку «Небо 3+1D», чтобы загрузить движок.</p></section>';
    var s = sessions[sessions.length - 1];
    var loud = ALL.filter(function (x) { return rankOf(x, s) >= 2; });
    var near = ALL.filter(function (x) { return rankOf(x, s) === 1; });
    var quiet = ALL.filter(function (x) { return rankOf(x, s) === 0; });
    var pairs = D.polarizations.filter(function (q) { return rankOf(q[0], s) >= 2 && rankOf(q[1], s) >= 2; });
    var ask = loud.slice(0, 2).map(function (x) { return '<li>Спросить ' + esc(nameOf(x)) + ', что ей нужно сейчас. Из карты: «' + esc(C.parts[x].need) + '»</li>'; });
    pairs.slice(0, 1).forEach(function (q) { ask.push('<li>Познакомить ' + esc(nameOf(q[0])) + ' и ' + esc(nameOf(q[1])) + ' на одной сессии: у их цикла «' + esc(q[2]) + '» есть общая цель.</li>'); });
    return '<section class="stack"><div class="card"><div class="report">' +
      '<h3>Коротко</h3><p>Сессий: ' + (sessions.length === 1 ? 'одна' : sessions.length === 2 ? 'две' : 'три') + '. Отчёт описывает состояние на последней сессии и то, что изменилось.</p>' +
      '<h3>Выше обычного</h3><ul>' + (loud.map(function (x) { return '<li><b>' + esc(nameOf(x)) + '</b> — ' + WORD[tierOf(x, s)] + ', ' + REL[tierOf(x, s)] + '</li>'; }).join('') || '<li>Сейчас никто не громче остальных.</li>') + '</ul>' +
      '<h3>Около обычного</h3><p>' + (near.map(nameOf).join(', ') || '—') + '</p>' +
      '<h3>Ниже обычного</h3><p>' + (quiet.map(nameOf).join(', ') || '—') + '</p>' +
      '<h3>Что посмотреть на следующей сессии</h3><ul>' + (ask.join('') || '<li>Начать с общего знакомства: что каждая часть делает.</li>') + '</ul>' +
      '<h3>Что передаётся</h3><p>Клиент выбрал: части, их место относительно обычного и связи. Числовые значения шкал не передаются и в отчёт не попадают.</p>' +
      '</div></div>' +
      '<div class="stack"><button class="btn" data-act="t-share">Передать клиенту</button><button class="btn ghost" data-act="t-download">Скачать отчёт</button></div>' +
      '<p class="faint">' + esc(c.name) + '. Отчёт не диагноз. Это то, что видно по карте.</p></section>';
  }

  function leave() { if (TH.universe) TH.universe.sleep(); }

  /* ---------- actions ---------- */
  var ACT = {};
  ACT['t-open'] = function (el) { TH.client = el.dataset.id; TH.tab = 'sky'; window.InnerverseApp.go('client', { id: el.dataset.id }); };
  ACT['t-tab'] = function (el) { TH.tab = el.dataset.k; window.InnerverseApp.go('client', { id: TH.client, tab: TH.tab }, { replace: true }); };
  ACT['t-session'] = function (el) { TH.session = +el.dataset.k; window.InnerverseApp.go('client', { id: TH.client, tab: TH.tab }, { replace: true }); };
  ACT['t-iso'] = function (el) { var k = el.dataset.k; TH.iso = TH.iso === k ? null : k; window.InnerverseApp.go('client', { id: TH.client, tab: TH.tab }, { replace: true }); };
  ACT['t-out'] = function () { window.InnerverseApp.go('profile'); };
  ACT['t-zoom'] = function (el) { zoom(el.dataset.k === 'in' ? 4 : -4); };
  ACT['t-share'] = function () { toast('Отчёт передан клиенту (демо). Клиент видит только то, что выбрал.'); };
  ACT['t-download'] = function () { toast('В прототипе файл не скачивается.'); };

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el.dataset || el.dataset.act !== 't-axis') return;
    var i = +el.dataset.i, key = el.value, axes = TH.axes.slice();
    var other = axes.indexOf(key);
    if (other >= 0 && other !== i) axes[other] = axes[i];
    axes[i] = key;
    TH.axes = axes;
    pushUniverse();
    window.InnerverseApp.go('client', { id: TH.client, tab: TH.tab }, { replace: true });
  });
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var fn = ACT[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  /* After a client view renders, the universe takes its slot; it is loaded the first time. */
  function afterClient() {
    var slot = document.getElementById('uniSlot');
    if (!slot) return;
    sessionsOf(TH.client).then(function () { return initUniverse(slot); }).then(function () {
      var m = slot.querySelector('.msg'); if (m) m.remove();
    }).catch(function () {
      TH.err = 'Вселенная не загрузилась. Нужен браузер с поддержкой модулей и WebGL.';
      slot.innerHTML = '<div class="msg">' + esc(TH.err) + '</div>';
    });
  }

  window.InnerverseTherapist = { cabinet: cabinet, client: client, report: report, leave: leave, afterClient: afterClient };
})();
