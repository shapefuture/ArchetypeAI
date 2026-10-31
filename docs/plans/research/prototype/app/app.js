/* The user's side: onboarding, the three depths of the test, the 2D sky, the cabinet, the part, Узелки, the check-in,
   the practices, the guided SOS, reminders, memory, the settings and the feature map. The therapist's side is therapist.js. */
(function () {
  'use strict';
  var D = window.INNER_DATA;
  var C = window.INNER_COPY;
  var STORE = 'innerverse.proto.v7';

  var SHADOW = ['inner_critic', 'controller', 'pleaser', 'taskmaster', 'analyst', 'hermit', 'bypasser', 'numb', 'rebel', 'charmer', 'abandoned', 'ashamed', 'frightened', 'unseen'];
  var RES = ['sage', 'warrior', 'caregiver', 'explorer'];
  var ALL = SHADOW.concat(RES);
  var TIER_RANK = { dormant: 0, present: 1, prominent: 2, dominant: 3 };
  var TIER_WORD = { dormant: 'дремлет', present: 'присутствует', prominent: 'заметна', dominant: 'часто солирует' };
  var REL_WORD = { dormant: 'ниже обычного', present: 'около обычного', prominent: 'выше обычного', dominant: 'заметно выше обычного' };
  var AXES = [['AGENCY', 'Инициативность'], ['TEMPERATURE', 'Эмоциональность'], ['FOCUS', 'Фокус внимания'], ['ATTACHMENT', 'Близость и дистанция']];

  /* Plush keepsakes (3D, rendered by the app's own feltThumbnail) and the owner's object stickers (content icons only). */
  var PLUSH = {
    inner_critic: '{{P:inner_critic}}', controller: '{{P:controller}}', pleaser: '{{P:pleaser}}', taskmaster: '{{P:taskmaster}}', analyst: '{{P:analyst}}',
    hermit: '{{P:hermit}}', bypasser: '{{P:bypasser}}', numb: '{{P:numb}}', rebel: '{{P:rebel}}', charmer: '{{P:charmer}}', abandoned: '{{P:abandoned}}',
    ashamed: '{{P:ashamed}}', frightened: '{{P:frightened}}', unseen: '{{P:unseen}}', sage: '{{P:sage}}', warrior: '{{P:warrior}}', caregiver: '{{P:caregiver}}',
    explorer: '{{P:explorer}}', luna: '{{P:luna}}'
  };
  var ICON = {
    scenes: '{{S:04}}', scan: '{{S:09}}', deep: '{{S:35}}', luna: '{{S:32}}', knots: '{{S:27}}', sos: '{{S:40}}', rest: '{{S:30}}', practice: '{{S:12}}',
    reminders: '{{S:23}}', memory: '{{S:15}}', share: '{{S:11}}', paywall: '{{S:13}}', login: '{{S:07}}', sensory: '{{S:10}}', therapist: '{{S:25}}',
    editor: '{{S:06}}', night: '{{S:33}}', booking: '{{S:42}}', help: '{{S:01}}', install: '{{S:29}}', protector: '{{S:31}}', sealed: '{{S:39}}'
  };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dd(id, cls) { return '<svg class="dd ' + (cls || '') + '" viewBox="0 0 100 100" aria-hidden="true"><use href="#d-' + id + '"/></svg>'; }
  function mood(id, cls) { return '<svg class="dd ' + (cls || '') + '" viewBox="0 0 100 100" aria-hidden="true"><use href="#d-' + id + '"/></svg>'; }
  function ico(name, cls) { return ICON[name] ? '<img class="sticker ' + (cls || '') + '" src="' + ICON[name] + '" alt="" aria-hidden="true">' : ''; }
  function plush(id, cls) { return '<img class="' + (cls || '') + '" src="' + PLUSH[id] + '" alt="" aria-hidden="true">'; }
  function nameOf(id) { return id === 'self' ? C.self.name : (C.parts[id] ? C.parts[id].name : id); }
  function tierOfT(T) { return T < 45 ? 'dormant' : T < 60 ? 'present' : T < 70 ? 'prominent' : 'dominant'; }
  function tierFromLevel(id, level) { var row = D.levelTable[id]; return row[Math.max(0, Math.min(4, level - 1))]; }
  function rankOf(id) { return S.result && S.result.tiers[id] ? TIER_RANK[S.result.tiers[id]] : -1; }
  function baseline(id) { return D.baselines[id].ax; }
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function load() {
    try { var raw = localStorage.getItem(STORE); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ result: S.result, deep: S.deep, pinned: S.pinned, histories: S.histories, nego: S.nego, journal: S.journal, checks: S.checks, reminders: S.reminders, memory: S.memory, sensory: S.sensory, rests: S.rests, onboarded: S.onboarded, research: S.research })); } catch (e) { /* storage may be blocked; the prototype still works */ }
  }

  /* ---------- state ---------- */
  var saved = load() || {};
  var S = {
    screen: 'welcome', params: {}, back: [],
    test: { i: 0, picks: [] }, scan: { i: 0, ans: {} },
    deep: saved.deep || { ans: [], i: 0 },
    result: saved.result || null,
    pinned: saved.pinned || { luna: true },
    histories: saved.histories || {},
    nego: saved.nego || [],
    journal: saved.journal || [
      { kind: 'trigger', what: 'Письмо от начальника пришло в пятницу вечером.', where: 'Работа', part: 'controller', sealed: false, at: '2026-10-24' },
      { kind: 'body', what: 'Плечи подняты до ушей. Вспомнил про дыхание, стало чуть лучше.', where: 'Дом', part: 'numb', sealed: false, at: '2026-10-26' }
    ],
    checks: saved.checks || [],
    reminders: saved.reminders || { daily: { on: true, time: '20:30' }, weekly: { on: false, day: 0, time: '19:00' }, monthly: { on: false, time: '10:00' }, quiet: { from: '22:00', to: '08:00' }, privacy: true, channel: 'device', pause: false, gentle: false },
    memory: saved.memory || [
      { t: 'Любишь короткие шаги', src: 'Записано тобой', on: true },
      { t: 'Чаще всего громче Завхоз', src: 'Из сцен', on: true },
      { t: 'Вечером тяжелее', src: 'Вывод Луны', on: false }
    ],
    sensory: saved.sensory || { preset: 'gentle', motion: true, sound: false, texture: true, density: 'open' },
    rests: saved.rests || 0,
    research: saved.research || { code: '', day: 7, plus: null, note: '' },
    drafts: {},
    onboarded: saved.onboarded || false,
    mode: 'light', calm: false,
    sos: { step: 0, round: 0, checks: 0, part: null, move: null, unsafe: false },
    practice: { id: null, step: 0 },
    chk: { feel: null, event: null, driver: null },
    jform: false, cabTool: 'talk', partTool: 'talk', chemWith: null, deepShow: false
  };
  var timers = [];
  function clearTimers() { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = []; }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  /* ---------- routing ---------- */
  var TAB_OF = { home: 'home', checkin: 'home', sos: 'home', sky: 'home', raw: 'home', cabinet: 'cabinet', part: 'cabinet', 'part-tool': 'cabinet', editor: 'cabinet', summon: 'cabinet', chem: 'cabinet',
    knots: 'knots', practice: 'practice', profile: 'profile', paywall: 'profile', map: 'profile', reminders: 'profile', sensory: 'profile', memory: 'profile', backup: 'profile', share: 'profile', login: 'profile', booking: 'profile', install: 'profile', help: 'profile', therapist: 'profile', 'history-map': 'profile', research: 'profile' };
  var NO_TABS = ['welcome', 'how', 'gate', 'scenes', 'scan', 'deep', 'reveal', 'sos', 'editor', 'summon', 'chem', 'client', 'report', 'therapist', 'legacy64'];

  function go(name, params, opts) {
    clearTimers();
    if (name === 'part-tool') params = Object.assign({ id: 'inner_critic', tool: 'talk' }, params || {});
    if (name === 'part' || name === 'chem') params = Object.assign({ id: 'inner_critic' }, params || {});
    if (!(opts && opts.replace) && S.screen !== name) S.back.push({ screen: S.screen, params: S.params });
    if (name === 'sos' && S.screen !== 'sos') S.sos = { step: 0, round: 0, checks: 0, part: null, move: null, unsafe: false };
    S.screen = name; S.params = params || {};
    if (name === 'home' || name === 'sky' || name === 'knots' || name === 'profile') S.back = [];
    render();
    window.scrollTo(0, 0);
  }
  function back() {
    clearTimers();
    var prev = S.back.pop();
    if (!prev) return go('home', {}, { replace: true });
    S.screen = prev.screen; S.params = prev.params; render();
  }

  var DRAFT_IDS = ['jWhat', 'memNew', 'summonName', 'loginMail', 'therapistMail'];
  function render() {
    DRAFT_IDS.forEach(function (id) { var el = document.getElementById(id); if (el) S.drafts[id] = el.value; });
    var view = document.getElementById('view');
    var build = VIEWS[S.screen] || VIEWS.home;
    view.innerHTML = build(S.params);
    view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
    document.body.dataset.screen = S.screen;
    var tabs = document.getElementById('tabs');
    var show = NO_TABS.indexOf(S.screen) < 0 && S.onboarded;
    tabs.hidden = !show;
    if (show) {
      var on = TAB_OF[S.screen] || 'home';
      tabs.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-current', b.dataset.tab === on ? 'page' : 'false'); });
    }
    if (S.screen !== 'client' && window.InnerverseTherapist) window.InnerverseTherapist.leave();
    if (typeof afterRender[S.screen] === 'function') afterRender[S.screen]();
    save();
  }

  /* ---------- sky (2D doodles on a flat field) ---------- */
  /* Parts sit where the reference puts them (agency across, temperature up), spread over the field and pushed apart
     so no two doodles sit on each other. Deterministic: the same map always looks the same. */
  var SKY_POS = null;
  function skyLayout() {
    if (SKY_POS) return SKY_POS;
    var pts = ALL.map(function (id) { var ax = baseline(id); return { id: id, x: ax.ag, y: 100 - ax.te }; });
    var minX = Math.min.apply(null, pts.map(function (p) { return p.x; })), maxX = Math.max.apply(null, pts.map(function (p) { return p.x; }));
    var minY = Math.min.apply(null, pts.map(function (p) { return p.y; })), maxY = Math.max.apply(null, pts.map(function (p) { return p.y; }));
    pts.forEach(function (p) { p.x = 17 + (p.x - minX) / ((maxX - minX) || 1) * 74; p.y = 17 + (p.y - minY) / ((maxY - minY) || 1) * 64; });
    for (var it = 0; it < 150; it += 1) {
      for (var i = 0; i < pts.length; i += 1) {
        for (var j = i + 1; j < pts.length; j += 1) {
          var a = pts[i], b = pts[j];
          var dx = b.x - a.x, dy = (b.y - a.y) * 0.8, dist = Math.sqrt(dx * dx + dy * dy) || 0.01, min = 21;
          if (dist < min) {
            var push = (min - dist) / 2, ux = dx / dist, uy = dy / dist;
            a.x -= ux * push; a.y -= uy * push / 0.8; b.x += ux * push; b.y += uy * push / 0.8;
          }
        }
      }
      pts.forEach(function (p) { p.x = Math.max(17, Math.min(91, p.x)); p.y = Math.max(16, Math.min(84, p.y)); });
    }
    SKY_POS = {};
    pts.forEach(function (p) { SKY_POS[p.id] = { x: p.x, y: p.y }; });
    return SKY_POS;
  }
  function skyPlace(id) { return skyLayout()[id]; }
  function skyHTML(opts) {
    opts = opts || {};
    var res = S.result;
    var ids = ALL.slice();
    if (res) {
      ids = ids.filter(function (id) {
        var t = res.tiers[id];
        if (opts.filter === 'loud') return TIER_RANK[t] >= 2;
        if (opts.filter === 'quiet') return TIER_RANK[t] < 2;
        return true;
      });
    }
    var quipIds = res ? ALL.slice().sort(function (a, b) { return rankOf(b) - rankOf(a); }).slice(0, 2) : [];
    var html = '<div class="sky2" id="sky" data-testid="sky">';
    html += '<svg class="deco" viewBox="0 0 300 330" preserveAspectRatio="none" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".6"><path d="M250 40l4 6M254 40l-4 6"/><path d="M40 270l3 4M43 270l-3 4"/><path d="M270 240l4 5"/><path d="M28 118l3 3M31 118l-3 3"/></g>' +
      '<g fill="var(--sky-ink)" opacity=".5"><circle cx="210" cy="28" r="2"/><circle cx="90" cy="300" r="2"/><circle cx="278" cy="170" r="1.6"/></g></svg>';
    html += '<button class="sun" data-act="self" aria-label="' + esc(C.self.name) + '">' + selfSun() + '</button>';
    ids.forEach(function (id, k) {
      var p = skyPlace(id);
      var t = res ? res.tiers[id] : 'dormant';
      var size = res ? 13 + TIER_RANK[t] * 2.7 : 13;
      var cls = res && TIER_RANK[t] < 2 ? 'quiet' : 'loud';
      html += '<button class="pt ' + cls + '" data-act="part" data-id="' + id + '" style="left:' + p.x.toFixed(1) + '%;top:' + p.y.toFixed(1) + '%;width:' + size + '%" aria-label="' + esc(nameOf(id)) + '">' +
        dd(id) + '<span class="nm">' + esc(nameOf(id)) + '</span></button>';
    });
    quipIds.forEach(function (id) {
      var p = skyPlace(id);
      var low = p.y < 30;
      html += '<div class="qb' + (low ? ' below' : '') + '" style="left:' + p.x.toFixed(1) + '%;top:' + (low ? p.y + 9 : p.y - 9).toFixed(1) + '%">' + esc(C.parts[id].quip) + '</div>';
    });
    html += '<span class="axis x">как действуешь: тихо → напористо</span><span class="axis y">как чувствуешь: холодно → тепло</span>';
    html += '</div>';
    return html;
  }
  function selfSun() {
    return '<svg viewBox="0 0 120 120" aria-hidden="true"><g fill="#FFB547" stroke="#1C1830" stroke-width="2.2" stroke-linejoin="round">' +
      '<path d="M60 8l6 14 8-10 2 15 13-6-4 14 14 1-10 9 11 7-14 4 6 13-13-2 1 15-11-9-7 13-5-14-14 5 3-14-15-1 10-10-12-6 13-4-5-13 14 3 0-15 10 10z"/></g>' +
      '<circle cx="60" cy="60" r="24" fill="#FFD43B" stroke="#1C1830" stroke-width="2.2"/>' +
      '<path d="M50 58q3 3 6 0M64 58q3 3 6 0" stroke="#1C1830" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M54 67q6 4 12 0" stroke="#1C1830" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
  }

  /* ---------- scoring the three depths into one result ---------- */
  function resultFromLevels(levels, source) {
    var tiers = {}, T = {};
    ALL.forEach(function (id) {
      var lv = levels[id] || 1;
      var row = tierFromLevel(id, lv);
      tiers[id] = row.tier; T[id] = row.T;
    });
    return { source: source, tiers: tiers, T: T };
  }
  function scenePoints() {
    var pts = {};
    S.test.picks.forEach(function (pick) { Object.keys(pick).forEach(function (k) { pts[k] = (pts[k] || 0) + pick[k]; }); });
    return pts;
  }
  function finishScenes() {
    var pts = scenePoints();
    var levels = {};
    ALL.forEach(function (id) { levels[id] = Math.min(5, 1 + (pts[id] || 0)); });
    S.result = resultFromLevels(levels, 'scenes');
    S.result.self = Math.min(5, pts.self || 0);
    S.onboarded = true;
    go('reveal', { after: 'scenes' });
  }
  function finishScan() {
    var levels = {};
    ALL.forEach(function (id) { levels[id] = S.result && S.result.T && S.result.tiers[id] ? levelFromT(S.result.T[id]) : 1; });
    SHADOW.forEach(function (id) { levels[id] = S.scan.ans[id] || 1; });
    S.result = resultFromLevels(levels, 'scan');
    go('reveal', { after: 'scan' });
  }
  function levelFromT(T) { return T < 33 ? 1 : T < 44 ? 2 : T < 56 ? 3 : T < 68 ? 4 : 5; }
  function quickTop() {
    var best = null;
    SHADOW.forEach(function (id) { var v = S.scan.ans[id] || 0; if (!best || v > best.v) best = { id: id, v: v }; });
    return best && best.v >= 4 ? best.id : null;
  }

  /* The deep map: 147 answers, scored by the app's own code (bridge.js), loaded on demand. */
  var bridgePromise = null;
  function loadBridge() {
    if (!bridgePromise) bridgePromise = import('./bridge/bridge.js').then(function (m) { return m.Bridge || window.InnerverseBridge; });
    return bridgePromise;
  }
  function finishDeep() {
    loadBridge().then(function (B) {
      var scored = B.score(S.deep.ans);
      var tiers = {}, T = {};
      ALL.forEach(function (id) {
        var row = (scored.raw.parts[id] || scored.raw.resources[id] || {});
        T[id] = Math.round(row.T); tiers[id] = row.tier || tierOfT(row.T);
      });
      S.result = { source: 'deep', tiers: tiers, T: T, self: null };
      go('reveal', { after: 'deep' });
    }).catch(function () {
      toast('Карту не удалось посчитать: нужен браузер с поддержкой модулей.');
    });
  }
  /* Demo answers in the shape the app expects: a plausible profile, for showing the flow in the prototype. */
  function demoAnswers() {
    var lv = { inner_critic: 4, controller: 3, pleaser: 3, taskmaster: 4, analyst: 3, hermit: 2, bypasser: 2, numb: 2, rebel: 2, charmer: 2, abandoned: 3, ashamed: 3, frightened: 2, unseen: 2, sage: 4, warrior: 3, caregiver: 4, explorer: 3, self: 3 };
    return D.items.map(function (it) {
      if (it.k === 's') { var l = lv[it.p] || 2; return it.i >= 6 ? 6 - l : l; }
      if (it.k === 'r') return lv[it.p] || 3;
      if (it.k === 'f') return lv.self;
      return it.w === 'attention' ? 3 : 1;
    });
  }

  /* ---------- views ---------- */
  var VIEWS = {};
  var afterRender = {};

  VIEWS.welcome = function () {
    var L = C.luna;
    return '<section class="stack" style="padding-top:6px">' +
      '<div class="top"><span></span><span></span><span></span></div>' +
      '<h1 class="mega">Innerverse</h1>' +
      '<p class="lede">' + esc(C.tagline) + '</p>' +
      '<div class="luna-chat" id="lunaChat">' + lunaAvatar() +
      '<div class="lc-body" id="lunaBody">' + L.welcome.map(function (m, i) { return '<div class="bubble" data-i="' + i + '">' + esc(m) + '</div>'; }).join('') + '</div></div>' +
      '<div class="stack" id="welcomeActions" hidden>' +
      '<button class="btn" data-act="go" data-to="how">Ок, знакомь</button>' +
      '<button class="btn ghost small" data-act="go" data-to="restore" style="justify-self:start">Уже знакомы? Восстановить карту</button></div>' +
      '</section>';
  };
  afterRender.welcome = function () {
    var bubbles = document.querySelectorAll('#lunaBody .bubble');
    var acts = document.getElementById('welcomeActions');
    var i = 0;
    function step() {
      if (i >= bubbles.length) { acts.hidden = false; return; }
      var b = bubbles[i]; b.classList.add('typing'); b.style.minHeight = '2.4em';
      later(function () { b.classList.remove('typing'); b.style.minHeight = ''; i += 1; later(step, 350); }, 900);
    }
    bubbles.forEach(function (b) { b.classList.add('typing'); });
    later(step, 200);
  };
  function lunaAvatar() { return '<div class="luna-av" aria-hidden="true">' + plush('luna', '') + '</div>'; }

  VIEWS.how = function () {
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Как знакомимся</h1><div class="sub">Три присеста, одна карта</div></div><span></span></div>' +
      '<ol class="steps-how" style="padding:0;margin:0">' +
      '<li><div><b>Сцены: 7 минут</b><span class="muted">Восемь коротких историй. Грубо, зато быстро: кто сейчас громче всех.</span></div></li>' +
      '<li><div><b>Уточнить небо: 14 вопросов</b><span class="muted">По одному на каждую часть. Ответы от «Совсем не про меня» до «Точно про меня».</span></div></li>' +
      '<li><div><b>Погружение: 147 вопросов</b><span class="muted">Полная карта в три присеста по 49. Её можно показать терапевту.</span></div></li>' +
      '</ol>' +
      '<div class="card lilac"><p class="kicker">Про приватность</p><p style="margin-top:6px">Всё хранится на этом устройстве. Ничего не уходит наружу без твоего «да».</p></div>' +
      '<button class="btn" data-act="go" data-to="scenes">Начать сцены</button>' +
      '<button class="btn ghost" data-act="go" data-to="gate">Шлюз карты: зачем это всё?</button>' +
      '</section>';
  };

  VIEWS.gate = function () {
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Шлюз карты</h1></div><span></span></div>' +
      '<div class="card yellow"><p class="h3">Карта станет богаче после первого теста.</p><p class="muted" style="margin-top:6px">Пройти сейчас или посмотреть сырое небо? Сырое небо пустое, зато без вопросов.</p></div>' +
      '<button class="btn" data-act="go" data-to="scenes">Пройти сцены</button>' +
      '<button class="btn ghost" data-act="raw-sky">Посмотреть небо как есть</button>' +
      '</section>';
  };

  VIEWS.scenes = function () {
    var i = S.test.i, sc = C.scenes[i];
    var pct = Math.round((i / C.scenes.length) * 100);
    return '<section class="stack">' +
      '<div class="top"><span></span><div><div class="kicker">Сцена ' + (i + 1) + ' из ' + C.scenes.length + '</div></div><button class="btn exit" data-act="exit">Выйти</button></div>' +
      '<div class="prog" aria-hidden="true"><i style="width:' + pct + '%"></i></div>' +
      '<div class="card"><div class="row" style="gap:12px;align-items:flex-start;flex-wrap:nowrap">' + ico('scenes', '') + '<p class="scene">' + esc(sc.t) + '</p></div></div>' +
      '<div class="answers" role="group" aria-label="Варианты ответа">' +
      sc.o.map(function (o, k) { return '<button class="ans" data-act="scene" data-k="' + k + '">' + esc(o[0]) + '</button>'; }).join('') +
      '</div>' +
      '<p class="faint">Выбирай первое, что приходит в голову. Ни один ответ не правильный.</p>' +
      '</section>';
  };

  VIEWS.scan = function () {
    var ids = SHADOW, i = S.scan.i, id = ids[i];
    var pct = Math.round((i / ids.length) * 100);
    var val = S.scan.ans[id];
    return '<section class="stack">' +
      '<div class="top"><span></span><div><div class="kicker">Уточнить небо · ' + (i + 1) + ' из ' + ids.length + '</div></div><button class="btn exit" data-act="exit">Выйти</button></div>' +
      '<div class="prog" aria-hidden="true"><i style="width:' + pct + '%"></i></div>' +
      '<div class="card ' + 'lilac' + '" style="display:grid;gap:10px;justify-items:start">' + dd(id, '').replace('class="dd ', 'style="width:74px;height:74px" class="dd ') + '<p class="item">' + esc(C.quick[id]) + '</p></div>' +
      '<div class="likert" role="group" aria-label="Насколько это про тебя">' +
      D.likert.map(function (l, k) { return '<button data-act="scan" data-v="' + (k + 1) + '" aria-pressed="' + (val === k + 1) + '"><b>' + (k + 1) + '</b>' + esc(l) + '</button>'; }).join('') +
      '</div>' +
      '<div class="row" style="justify-content:space-between">' +
      '<button class="btn ghost small" data-act="scan-prev"' + (i === 0 ? ' disabled' : '') + '>Назад</button>' +
      '<button class="btn small" data-act="scan-next"' + (val ? '' : ' disabled') + '>' + (i === ids.length - 1 ? 'Готово' : 'Дальше') + '</button></div>' +
      '</section>';
  };

  VIEWS.deep = function () {
    var ans = S.deep.ans, done = ans.filter(function (v) { return v != null; }).length;
    if (S.deep.i === undefined) S.deep.i = 0;
    var i = Math.min(S.deep.i, D.items.length - 1);
    var sit = Math.floor(i / 49) + 1;
    var it = D.items[i];
    if (!S.deepShow) {
      return '<section class="stack">' +
        '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Погружение</h1><div class="sub">147 вопросов, три присеста</div></div><span></span></div>' +
        '<div class="card mint"><p class="h3">Как отвечать</p><p class="muted" style="margin-top:6px">Думай о последних двух-трёх неделях, а не об идеальном себе. Первый ответ обычно самый честный.</p></div>' +
        '<div class="sit">' + [1, 2, 3].map(function (n) { return '<span class="' + (done >= (n - 1) * 49 + 49 ? 'done' : '') + '">Присед ' + n + '<br>49</span>'; }).join('') + '</div>' +
        '<p class="faint">Ответов: ' + done + ' из ' + D.items.length + '. Можно остановиться и вернуться в любой момент.</p>' +
        '<button class="btn" data-act="deep-start">' + (done ? 'Продолжить' : 'Начать первый присед') + '</button>' +
        '<button class="btn ghost small" data-act="deep-demo" style="justify-self:start">Заполнить как пример (для показа)</button>' +
        '<div class="card dash"><p class="kicker">Карта связей (64)</p><p class="muted" style="margin-top:6px">Старая карта на четыре оси без проверочных вопросов. Сохранена для тех, кто её начал. Сравнивать с 147 можно только грубо.</p><button class="btn ghost small" data-act="legacy64" style="margin-top:10px">Открыть 64</button></div>' +
        '</section>';
    }
    return '<section class="stack">' +
      '<div class="top"><span></span><div><div class="kicker">Присед ' + sit + ' из 3 · ' + (i + 1) + ' из 147</div></div><button class="btn exit" data-act="exit">Выйти</button></div>' +
      '<div class="prog" aria-hidden="true"><i style="width:' + Math.round((done / 147) * 100) + '%"></i></div>' +
      '<div class="sit">' + [1, 2, 3].map(function (n) { return '<span class="' + (sit === n ? 'on' : '') + '">' + n + '</span>'; }).join('') + '</div>' +
      '<div class="card"><p class="item">' + esc(it.t) + '</p></div>' +
      '<div class="likert" role="group" aria-label="Насколько это про тебя">' +
      D.likert.map(function (l, k) { return '<button data-act="deep-ans" data-v="' + (k + 1) + '" aria-pressed="' + (ans[i] === k + 1) + '"><b>' + (k + 1) + '</b>' + esc(l) + '</button>'; }).join('') +
      '</div>' +
      '<div class="row" style="justify-content:space-between">' +
      '<button class="btn ghost small" data-act="deep-prev"' + (i === 0 ? ' disabled' : '') + '>Назад</button>' +
      '<button class="btn ghost small" data-act="deep-pause">Пауза</button>' +
      '<button class="btn small" data-act="deep-next"' + (ans[i] ? '' : ' disabled') + '>' + (i === D.items.length - 1 ? 'Готово' : 'Дальше') + '</button></div>' +
      '</section>';
  };

  VIEWS.reveal = function (p) {
    var res = S.result;
    if (!res) return VIEWS.home();
    var top = ALL.slice().sort(function (a, b) { return rankOf(b) - rankOf(a) || res.T[b] - res.T[a]; }).slice(0, 3);
    var line = C.luna[p.after === 'scenes' ? 'afterScenes' : p.after === 'scan' ? 'afterScan' : 'afterDeep'];
    var note = res.source === 'scenes' ? 'Это по сценам: предварительно. Уточнить можно за 14 вопросов.' :
      res.source === 'scan' ? 'Это по быстрому скану. Полная карта даст точнее.' : 'Это полная карта. Её можно показать терапевту.';
    return '<section class="stack">' +
      '<div class="top"><span></span><div><div class="kicker">Небо</div></div><button class="btn exit" data-act="go" data-to="home">Выйти</button></div>' +
      '<div class="luna-chat">' + lunaAvatar() + '<div class="lc-body"><div class="bubble">' + esc(line) + '</div></div></div>' +
      '<div class="reveal">' + skyHTML() + '</div>' +
      '<div class="card"><p class="kicker">Громче всех сейчас</p><div class="plist" style="margin-top:8px">' +
      top.map(function (id) { return '<button class="pr" data-act="part" data-id="' + id + '">' + dd(id) + '<span><b>' + esc(nameOf(id)) + '</b><small>' + esc(C.parts[id].quip) + '</small></span><span class="stage ' + res.tiers[id] + '">' + TIER_WORD[res.tiers[id]] + '</span></button>'; }).join('') +
      '</div><p class="faint" style="margin-top:10px">' + esc(note) + '</p></div>' +
      '<div class="stack">' +
      (res.source === 'scenes' ? '<button class="btn" data-act="scan-start">Уточнить небо: 14 вопросов</button>' : '') +
      (res.source !== 'deep' ? '<button class="btn ' + (res.source === 'scenes' ? 'ghost' : '') + '" data-act="go" data-to="deep">Погружение: полная карта</button>' : '') +
      '<button class="btn ' + (res.source === 'deep' ? '' : 'ghost') + '" data-act="go" data-to="home">' + (res.source === 'deep' ? 'В базу' : 'Посмотреть небо') + '</button>' +
      '</div></section>';
  };

  VIEWS.home = function () {
    var res = S.result;
    var last = S.checks[S.checks.length - 1];
    var top = res ? ALL.slice().sort(function (a, b) { return rankOf(b) - rankOf(a); })[0] : null;
    return '<section class="stack">' +
      '<div class="top"><div class="brand">' + '<svg viewBox="0 0 120 120" aria-hidden="true"><use href="#sym-sun"/></svg>База</div>' +
      '<button class="sosbtn" data-act="go" data-to="sos">Меня накрыло</button></div>' +
      '<div class="luna-chat">' + lunaAvatar() + '<div class="lc-body"><div class="bubble">' + esc(res ? C.luna.home : 'Пока пусто. Начнём с сцен — это семь минут.') + '</div></div></div>' +
      '<div class="card">' +
      '<p class="kicker">Как ты сейчас?</p>' +
      '<div class="chips" style="margin-top:10px">' + C.feelings.map(function (f) { return '<button class="chip feel" data-act="feel" data-id="' + f[0] + '" aria-pressed="' + (last && last.feel === f[0]) + '">' + mood(f[0]) + esc(f[1]) + '</button>'; }).join('') + '</div>' +
      (last ? '<p class="faint" style="margin-top:8px">Записано. Можно поменять в любой момент.</p>' : '') +
      '<div class="row" style="margin-top:10px"><button class="btn small" data-act="go" data-to="checkin">Полный чек-ин</button></div>' +
      '</div>' +
      '<button class="btn ghost small" data-act="go" data-to="sky" style="justify-self:start">Открыть небо</button>' +
      (top ? '<button class="card ico" data-act="part" data-id="' + top + '">' + '<span><p class="kicker">Сегодня громче всех</p><b class="h3" style="display:block;margin-top:4px">' + esc(nameOf(top)) + '</b><span class="muted" style="font-size:14px">' + esc(C.parts[top].quip) + '</span></span>' + dd(top, '') + '</button>' : '') +
      '<div class="tiles">' +
      '<button class="tile t1" data-act="go" data-to="cabinet">' + ico('protector') + '<b>Шкаф частей</b><small>Все, кто живёт внутри</small></button>' +
      '<button class="tile t2" data-act="go" data-to="practice">' + ico('practice') + '<b>Практики</b><small>Четыре, с шагами</small></button>' +
      '<button class="tile t3" data-act="go" data-to="knots">' + ico('knots') + '<b>Узелки</b><small>Записи про день</small></button>' +
      '<button class="tile t4" data-act="go" data-to="sos">' + ico('sos') + '<b>Меня накрыло</b><small>Шаги, по одному</small></button>' +
      '</div>' +
      (res ? '' : '<button class="btn" data-act="go" data-to="how">Познакомиться с коллективом</button>') +
      '</section>';
  };
  afterRender.home = function () { /* the feeling chips update in place */ };

  VIEWS.sky = function () {
    var f = S.params.filter || 'all';
    return '<section class="stack">' +
      '<div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap"><div class="grow"><h1 class="h1" style="font-size:26px">Небо</h1><div class="sub muted" style="font-size:13px">Тихо — не значит «нет». Тапни часть.</div></div>' +
      '<button class="sosbtn" data-act="go" data-to="sos">Меня накрыло</button></div>' +
      (S.result ? '' : '<div class="card dash"><p class="h3">Пока пусто</p><p class="muted" style="margin-top:6px">Небо появится после сцен. Сейчас тут только Луна.</p><button class="btn small" data-act="go" data-to="how" style="margin-top:10px">Начать сцены</button></div>') +
      '<div class="skychips" role="group" aria-label="Фильтр">' +
      [['all', 'Все'], ['loud', 'Заметные'], ['quiet', 'Тихие']].map(function (x) { return '<button data-act="sky-filter" data-f="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + '</button>'; }).join('') +
      '</div>' +
      skyHTML({ filter: f }) +
      '<div class="row" style="justify-content:space-between"><button class="btn small ghost" data-act="go" data-to="cabinet">Шкаф частей</button><button class="btn small ghost" data-act="go" data-to="how">Уточнить небо</button></div>' +
      '<p class="faint">Здесь всё плоское, как рисунок. Объём и светящиеся сферы — только в кабинете терапевта.</p>' +
      '</section>';
  };
  afterRender.sky = function () { /* taps are delegated */ };

  VIEWS.cabinet = function () {
    var ids = ALL.slice().sort(function (a, b) { return (S.pinned[b] ? 1 : 0) - (S.pinned[a] ? 1 : 0) || rankOf(b) - rankOf(a); });
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Шкаф частей</h1><div class="sub">Звезда — закрепить · часть — открыть</div></div><span></span></div>' +
      '<div class="plist">' + ids.map(function (id) {
        var t = S.result ? S.result.tiers[id] : 'dormant';
        return '<div class="pr" style="grid-template-columns:56px minmax(0,1fr) auto auto">' + dd(id) +
          '<button data-act="part" data-id="' + id + '" style="text-align:left;min-width:0"><b>' + esc(nameOf(id)) + '</b><small>' + esc(C.parts[id].kind) + '</small></button>' +
          '<span class="stage ' + t + '">' + TIER_WORD[t] + '</span>' +
          '<button class="iconbtn" data-act="pin" data-id="' + id + '" aria-label="Закрепить" aria-pressed="' + !!S.pinned[id] + '" style="width:36px;height:36px">' + (S.pinned[id] ? '★' : '☆') + '</button></div>';
      }).join('') + '</div>' +
      '<div class="card dash"><p class="kicker">Призвать часть по имени</p><div class="row" style="margin-top:8px"><input type="text" id="summonName" value="' + esc(S.drafts.summonName || '') + '" placeholder="Призвать часть по имени…" style="flex:1 1 180px"><button class="btn small" data-act="summon">Призвать</button></div><p class="faint" style="margin-top:8px">В приложении призыв создаёт новую часть из имени. В прототипе — только так, как это выглядит.</p></div>' +
      '<button class="btn ghost small" data-act="go" data-to="editor">Мастерская: изменить облик</button>' +
      '</section>';
  };

  VIEWS.part = function (p) {
    var id = p.id || 'inner_critic', c = C.parts[id];
    var t = S.result ? S.result.tiers[id] : 'dormant';
    var idx = TIER_RANK[t];
    var bars = [0, 1, 2, 3].map(function (k) { return '<i class="' + (k <= idx ? 'on' : '') + '"></i>'; }).join('');
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><div class="kicker">' + esc(c.kind) + '</div><h1>' + esc(c.name) + '</h1></div><button class="iconbtn" data-act="pin" data-id="' + id + '" aria-label="Закрепить">' + (S.pinned[id] ? '★' : '☆') + '</button></div>' +
      '<div class="hero" id="heroBox">' + plush(id, 'idle') + '<div class="says">' + esc(c.quip) + '</div></div>' +
      '<div class="card"><div class="between"><span class="stage ' + t + '">' + TIER_WORD[t] + '</span><span class="faint">' + (S.result ? 'Относительно обычного: ' + REL_WORD[t] : 'Сначала нужны сцены') + '</span></div>' +
      '<div class="arc" style="margin-top:10px">' + bars + '</div><div class="arc-l"><span>дремлет</span><span>присутствует</span><span>заметна</span><span>солирует</span></div></div>' +
      '<div class="card"><div class="stack">' +
      '<div class="sec"><b>Что делает</b><p>' + esc(c.face) + '</p></div>' +
      '<div class="sec"><b>Что ей нужно</b><p>' + esc(c.need) + '</p></div>' +
      '<div class="sec"><b>Чего боится</b><p>' + esc(c.fear) + '</p></div>' +
      '<div class="sec"><b>Что даёт</b><p>' + esc(c.gift) + '</p></div>' +
      '</div></div>' +
      '<div class="tiles">' +
      '<button class="tile t1" data-act="tool" data-tool="talk" data-id="' + id + '">' + ico('protector') + '<b>Поговорить</b><small>Спросить, что ей нужно</small></button>' +
      '<button class="tile t2" data-act="tool" data-tool="nego" data-id="' + id + '">' + ico('practice') + '<b>Переговоры</b><small>Согласиться, отказаться или оставить открытым</small></button>' +
      '<button class="tile t4" data-act="tool" data-tool="rest" data-id="' + id + '">' + ico('rest') + '<b>Отдохнуть</b><small>Тихий режим, ничего не теряется</small></button>' +
      '<button class="tile t3" data-act="tool" data-tool="replay" data-id="' + id + '">' + ico('scenes') + '<b>Реплей</b><small>Воображаемая версия момента</small></button>' +
      '<button class="tile t2" data-act="tool" data-tool="history" data-id="' + id + '">' + ico('knots') + '<b>История</b><small>Прежние версии текста</small></button>' +
      '<button class="tile t1" data-act="tool" data-tool="coords" data-id="' + id + '">' + ico('scan') + '<b>Координаты</b><small>Четыре оси и источник каждой</small></button>' +
      '</div>' +
      '<div class="stack"><button class="btn ghost small" data-act="chem-open" data-id="' + id + '">Химия: с кем эта часть ходит по кругу?</button>' +
      '<button class="btn ghost small" data-act="go" data-to="editor" data-id="' + id + '">Мастерская: изменить облик</button></div>' +
      '<div class="card dash"><p class="kicker">Небольшие шаги для неё</p><div class="moves" style="margin-top:8px">' +
      c.moves.map(function (m) { return '<div class="mv" style="cursor:default">' + esc(m) + '</div>'; }).join('') + '</div></div>' +
      '<button class="btn ghost small" data-act="go" data-to="cabinet">Назад в шкаф</button>' +
      '</section>';
  };
  afterRender.part = function () {
    var hero = document.querySelector('#heroBox img');
    if (hero) hero.addEventListener('click', function () { hero.classList.remove('poked'); void hero.offsetWidth; hero.classList.add('poked'); });
  };

  VIEWS['part-tool'] = function (p) {
    var id = p.id, tool = p.tool || 'talk', c = C.parts[id];
    var tabs = [['talk', 'Поговорить'], ['nego', 'Переговоры'], ['rest', 'Отдых'], ['replay', 'Реплей'], ['history', 'История'], ['coords', 'Координаты']];
    var body = '';
    if (tool === 'talk') {
      body = '<div class="luna-chat">' + '<div class="luna-av" aria-hidden="true">' + plush(id, '') + '</div><div class="lc-body"><div class="bubble" id="talkLine">' + esc(c.lines[0]) + '</div>' +
        '<div class="replies"><button data-act="talk" data-i="0">Что тебе нужно?</button><button data-act="talk" data-i="1">Спасибо, что бережёшь</button><button data-act="talk" data-i="2">Давай дадим тебе выходной</button></div></div></div>' +
        '<div class="card mint"><p class="kicker">Что она ответит на главное</p><p style="margin-top:6px">' + esc(c.need) + '</p></div>';
    } else if (tool === 'nego') {
      body = '<div class="card yellow"><p class="kicker">Предложение</p><p class="h3" style="margin-top:6px">«' + esc(c.ask) + '»</p></div>' +
        '<div class="row"><button class="btn small" data-act="nego" data-v="yes">Договорились</button><button class="btn small ghost" data-act="nego" data-v="no">Не сейчас</button><button class="btn small ghost" data-act="nego" data-v="open">Оставим открытым</button></div>' +
        '<div class="stack">' + (S.nego.filter(function (n) { return n.part === id; }).map(function (n) { return '<div class="kn"><b>' + ({ yes: 'Договорились', no: 'Не сейчас', open: 'Оставили открытым' })[n.v] + '</b><p>' + esc(n.text) + '</p></div>'; }).join('') || '<p class="faint">Пока никто ничего не предлагал.</p>') + '</div>';
    } else if (tool === 'rest') {
      body = '<div class="card mint"><p class="h3">Отдыхать здесь можно</p><p class="muted" style="margin-top:6px">Отдых ничего не меняет: ни твоё место, ни пройденные сцены.</p></div>' +
        '<button class="btn" data-act="rest">Отдохнуть здесь</button><p class="faint">Отдыхов: ' + S.rests + '. Ничего не потеряно.</p>';
    } else if (tool === 'replay') {
      body = '<div class="card"><p class="kicker">Обычный вторник</p><p class="item" style="margin-top:6px">Ты открываешь холодильник. Там пусто, кроме одного йогурта.</p></div>' +
        '<div class="answers">' + ['Беру йогурт и ем стоя', 'Закрываю холодильник и иду гулять', 'Звоню тому, кто готовит лучше меня'].map(function (t, k) { return '<button class="ans" data-act="replay" data-k="' + k + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
        '<p class="faint">Реплей — твоя воображаемая версия обычного момента. Это не запись и не предсказание.</p>';
    } else if (tool === 'history') {
      var hist = S.histories[id] || [{ text: c.face, at: 'первая версия' }];
      body = '<div class="stack">' + hist.map(function (h, k) { return '<div class="kn"><span class="t">Версия ' + (k + 1) + ' · ' + esc(h.at) + '</span><p>' + esc(h.text) + '</p>' + (k < hist.length - 1 ? '<button class="btn ghost small" data-act="hist-restore" data-k="' + k + '" data-id="' + id + '" style="justify-self:start">Восстановить</button>' : '') + '</div>'; }).join('') + '</div>' +
        '<button class="btn" data-act="hist-save" data-id="' + id + '">Сохранить текущий текст как версию</button><p class="faint">Прежние версии не меняются. Восстановление добавляет новую версию со старым текстом.</p>';
    } else if (tool === 'coords') {
      var ax = baseline(id);
      var src = S.result ? (S.result.source === 'deep' ? 'Из карты' : 'Из сцен') : 'Не известно';
      body = '<div class="card"><p class="muted">Четыре координаты этой части и откуда взято каждое значение. Что не измерено, остаётся неизвестным.</p></div>' +
        [['Инициативность', ax.ag], ['Эмоциональность', ax.te], ['Фокус внимания', ax.fo], ['Близость и дистанция', ax.at]].map(function (a) {
          return '<div class="card"><div class="between"><b class="h3">' + a[0] + '</b><span class="tag">' + (S.result ? src : 'Не известно') + '</span></div><div class="rel" style="margin-top:10px"><div class="rel-track"><span class="rel-mark" style="left:' + a[1] + '%"></span></div><div class="rel-scale"><span>тихо</span><span>середина</span><span>сильно</span></div></div></div>';
        }).join('');
    }
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="go" data-to="part" data-id="' + id + '" aria-label="Назад">←</button><div><div class="kicker">' + esc(c.name) + '</div><h1>' + (tabs.filter(function (t) { return t[0] === tool; })[0] || tabs[0])[1] + '</h1></div><span></span></div>' +
      '<div class="seg" role="group" aria-label="Инструменты">' + tabs.map(function (t) { return '<button data-act="tool" data-tool="' + t[0] + '" data-id="' + id + '" aria-pressed="' + (t[0] === tool) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      body + '</section>';
  };
  afterRender['part-tool'] = function () { /* replies are delegated */ };

  VIEWS.chem = function (p) {
    var from = p.id, others = ALL.filter(function (x) { return x !== from; });
    var with_ = S.chemWith;
    var pair = with_ ? D.polarizations.filter(function (q) { return (q[0] === from && q[1] === with_) || (q[0] === with_ && q[1] === from); })[0] : null;
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="go" data-to="part" data-id="' + from + '" aria-label="Назад">←</button><div><div class="kicker">Химия</div><h1>' + esc(nameOf(from)) + '</h1></div><span></span></div>' +
      '<p class="muted">Выбери вторую часть. Химия покажет, ходят ли они по кругу.</p>' +
      '<div class="chips">' + others.map(function (x) { return '<button class="chip" data-act="chem-pick" data-id="' + x + '" aria-pressed="' + (x === with_) + '">' + dd(x) + esc(nameOf(x)) + '</button>'; }).join('') + '</div>' +
      (with_ ? '<div class="card ' + (pair ? 'pink' : 'mint') + '">' + (pair ? '<p class="kicker">Цикл</p><p class="h2" style="margin-top:6px">' + esc(pair[2]) + '</p><p style="margin-top:8px">Когда обе заметны, они тянут в разные стороны. Помогает, когда каждой дают своё время и слово.</p>' : '<p class="kicker">Пока без сюжета</p><p style="margin-top:6px">Эти двое не спорят друг с другом. Можно просто познакомить их на одной сессии.</p>') + '</div>' : '') +
      '</section>';
  };

  VIEWS.checkin = function () {
    var c = S.chk;
    var step = !c.feel ? 0 : !c.event ? 1 : !c.driver ? 2 : 3;
    var head = ['Как ты сейчас?', 'Что произошло?', 'Кто сейчас за рулём?', 'Записано'][step];
    var body = '';
    if (step === 0) body = '<div class="chips">' + C.feelings.map(function (f) { return '<button class="chip feel" data-act="chk" data-k="feel" data-v="' + f[0] + '">' + mood(f[0]) + esc(f[1]) + '</button>'; }).join('') + '</div>';
    if (step === 1) body = '<div class="pills">' + C.events.map(function (e) { return '<button data-act="chk" data-k="event" data-v="' + esc(e) + '">' + esc(e) + '</button>'; }).join('') + '</div>';
    if (step === 2) body = '<div class="chips">' + C.drivers.map(function (d) { return '<button class="chip" data-act="chk" data-k="driver" data-v="' + d[0] + '">' + mood(d[0]) + esc(d[1]) + '</button>'; }).join('') + '</div><p class="faint" style="margin-top:8px">Угадывать не обязательно. Можно выбрать «Всё норм».</p>';
    if (step === 3) body = '<div class="card lilac"><p class="kicker">Сохранено</p><p class="h3" style="margin-top:6px">Угадала или нет, потом посмотрим вместе.</p><p class="muted" style="margin-top:6px">Предсказание сравним с тем, что окажется правдой. Без оценок.</p></div><button class="btn" data-act="chk-done">В базу</button>';
    return '<section class="stack">' +
      '<div class="top"><span></span><div><div class="kicker">Чек-ин · ' + Math.min(step + 1, 3) + ' из 3</div></div><button class="btn exit" data-act="go" data-to="home">Выйти</button></div>' +
      '<div class="prog" aria-hidden="true"><i style="width:' + Math.round((step / 3) * 100) + '%"></i></div>' +
      '<h1 class="h2">' + head + '</h1>' + body + '</section>';
  };

  VIEWS.practice = function () {
    var tab = S.params.tab || 'practices';
    var list = '';
    if (tab === 'practices' || tab === 'check') {
      var p = C.practices.filter(function (x) { return x.id === S.practice.id; })[0];
      if (p) {
        var k = S.practice.step;
        list = '<div class="card mint"><div class="between"><b class="h3">' + esc(p.t) + '</b><span class="faint">шаг ' + (k + 1) + ' из ' + p.s.length + '</span></div><p class="item" style="margin-top:10px">' + esc(p.s[k]) + '</p>' +
          (p.stop && k === p.s.length - 1 ? '<p class="faint" style="margin-top:10px">Правило остановки: ' + esc(p.stop) + '</p>' : '') + '</div>' +
          '<div class="row" style="justify-content:space-between"><button class="btn ghost small" data-act="prac-prev"' + (k === 0 ? ' disabled' : '') + '>Назад</button>' +
          (k < p.s.length - 1 ? '<button class="btn small" data-act="prac-next">Дальше</button>' : '<button class="btn small" data-act="prac-done">Готово, записать</button>') + '</div>' +
          '<button class="btn ghost small" data-act="prac-stop">Остановиться здесь</button>';
      } else {
        list = (tab === 'check' ? '<div class="card dash"><p class="kicker">Сверка с практикой</p><p class="muted" style="margin-top:6px">Выбери одну практику и иди в своём темпе. Полный путь — каждый шаг по одному. Тихий — один шаг, чтобы путь оставался маленьким. Ничего не оценивается.</p><div class="seg" style="margin-top:10px"><button aria-pressed="true">Полный</button><button aria-pressed="false">Тихий</button></div></div>' : '') +
          '<div class="plist">' + C.practices.map(function (x) { return '<button class="pr" data-act="prac-open" data-id="' + x.id + '">' + ico('practice') + '<span><b>' + esc(x.t) + '</b><small>' + esc(x.d) + '</small></span><span class="chev">›</span></button>'; }).join('') + '</div>';
      }
    } else {
      list = '<div class="stack">' + [['Опыты', 'Две карточки: что попробовать на этой неделе.'], ['Повторение', 'Что помогало на прошлой неделе, без оценок.'], ['Артефакты', 'Письма от частей: короткие, их можно перечитать.'], ['Сезон', 'Шесть недель про тишину. Идёт без спешки.']].map(function (x) { return '<div class="card"><b class="h3">' + x[0] + '</b><p class="muted" style="margin-top:4px">' + x[1] + '</p></div>'; }).join('') + '</div>';
    }
    return '<section class="stack">' +
      '<div class="top"><div><h1>Практика</h1><div class="sub">Небольшие шаги. Любой можно не закончить.</div></div><span></span></div>' +
      '<div class="seg" role="group" aria-label="Раздел">' + [['practices', 'Практики'], ['kit', 'Набор'], ['check', 'Сверка']].map(function (t) { return '<button data-act="go" data-to="practice" data-tab="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      list + '</section>';
  };

  VIEWS.knots = function () {
    var entries = S.journal.slice().reverse();
    return '<section class="stack">' +
      '<div class="top"><div><h1>Узелки</h1><div class="sub">Короткие входы в части. Один в день — уже хорошо.</div></div><span></span></div>' +
      '<button class="btn" data-act="jform">' + (S.jform ? 'Свернуть' : 'Новый узелок') + '</button>' +
      (S.jform ? '<div class="card lilac stack"><div class="pills">' + C.kinds.map(function (k) { return '<button data-act="jkind" data-v="' + k[0] + '" aria-pressed="' + (S.jk === k[0]) + '">' + k[2] + ' ' + k[1] + '</button>'; }).join('') + '</div>' +
        '<textarea id="jWhat" placeholder="Что произошло, в одном-двух предложениях">' + esc(S.drafts.jWhat || '') + '</textarea>' +
        '<div class="field"><span>Где</span><select id="jWhere"><option>Работа</option><option>Дом</option><option>Отношения</option><option>Телефон</option><option>Другое</option></select></div>' +
        '<div class="field"><span>Какая часть громче</span><select id="jPart"><option value="">Не знаю</option>' + ALL.map(function (x) { return '<option value="' + x + '">' + esc(nameOf(x)) + '</option>'; }).join('') + '</select></div>' +
        '<div class="toggle"><span>Запечатать на три дня</span><button class="sw" role="switch" aria-checked="' + !!S.jsealed + '" data-act="jsealed" aria-label="Запечатать на три дня"></button></div>' +
        '<button class="btn small" data-act="jsave">Сохранить узелок</button></div>' : '') +
      '<div class="thread">' + entries.map(function (e) {
        if (e.sealed) return '<div class="kn sealed"><span class="t">Запечатано · откроется через три дня</span><p>Заметка спрятана до среды. Так бывает: что-то лучше разобрать позже.</p></div>';
        var kind = C.kinds.filter(function (k) { return k[0] === e.kind; })[0] || C.kinds[0];
        return '<div class="kn"><span class="t">' + kind[2] + ' ' + kind[1] + ' · ' + esc(e.at) + ' · ' + esc(e.where || '') + '</span><b>' + esc(e.what) + '</b>' + (e.part ? '<p>Громче всех: ' + esc(nameOf(e.part)) + '</p>' : '') + '</div>';
      }).join('') + '</div>' +
      '</section>';
  };

  VIEWS.sos = function () {
    var s = S.sos;
    var steps = ['Проверка', 'Дыхание', 'Опора', 'Имя', 'Шаг', 'Готово'];
    var head = '<div class="top"><span></span><div><div class="kicker">Меня накрыло</div></div><button class="btn exit" data-act="sos-exit">Выйти</button></div>';
    var stepsRow = '<div class="steps" aria-label="Шаги">' + steps.map(function (t, k) { return '<span class="' + (k === s.step ? 'on' : k < s.step ? 'done' : '') + '">' + (k + 1) + ' ' + t + '</span>'; }).join('') + '</div>';
    var body = '';
    if (s.unsafe) {
      body = '<div class="sosbox"><p class="say">Давай сначала о безопасности.</p><p>' + esc(C.sos.crisis) + '</p><p class="h3">112</p><p class="faint">Номер можно набрать с любого телефона. Если он не отвечает, позвони тому, кто рядом.</p></div>' +
        '<button class="btn" data-act="sos-exit">Выйти в базу</button>';
    } else if (s.step === 0) {
      body = '<div class="sosbox"><p class="say">' + esc(C.sos.safety) + '</p><div class="stack"><button class="btn" data-act="sos-next">' + esc(C.sos.safetyYes) + '</button><button class="btn ghost" data-act="sos-unsafe">' + esc(C.sos.safetyNo) + '</button></div></div>' +
        '<p class="muted">' + esc(C.luna.sosStart) + '</p>';
    } else if (s.step === 1) {
      body = '<div class="sosbox"><p class="say">' + esc(C.sos.breathe) + '</p><div class="breath"><div class="orb" id="orb">' + esc(C.sos.breatheIn) + '</div></div><div class="count" id="breathCount">Вдох 4 · выдох 6</div><div class="rounds" aria-label="Круги">' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<i class="' + (k < s.round ? 'on' : '') + '"></i>'; }).join('') + '</div><p>' + esc(C.sos.breatheStop) + '</p></div>' +
        '<div class="row" style="justify-content:space-between"><button class="btn ghost small" data-act="sos-back">Назад</button><button class="btn small" data-act="sos-next" id="breathNext"' + (s.round >= 6 ? '' : ' disabled') + '>Дальше</button></div>';
    } else if (s.step === 2) {
      var five = ['Окно', 'Стол', 'Пол', 'Рука', 'Звук'];
      body = '<div class="sosbox"><p class="say">' + esc(C.sos.ground) + '</p><div class="checks">' + five.map(function (t, k) { return '<button data-act="sos-check" data-k="' + k + '" aria-pressed="' + (k < s.checks) + '">' + esc(t) + '</button>'; }).join('') + '</div><p class="faint">' + esc(C.sos.groundCount) + ': ' + s.checks + ' из 5</p></div>' +
        '<div class="row" style="justify-content:space-between"><button class="btn ghost small" data-act="sos-back">Назад</button><button class="btn small" data-act="sos-next"' + (s.checks >= 5 ? '' : ' disabled') + '>Дальше</button></div>';
    } else if (s.step === 3) {
      body = '<div class="sosbox"><p class="say">' + esc(C.sos.name) + '</p><div class="chips">' + ALL.slice(0, 14).map(function (x) { return '<button class="chip" data-act="sos-part" data-id="' + x + '" aria-pressed="' + (s.part === x) + '">' + dd(x) + esc(nameOf(x)) + '</button>'; }).join('') + '</div>' +
        '<button class="btn ghost small" data-act="sos-part" data-id="" aria-pressed="' + (s.part === '') + '">' + esc(C.sos.nameUnknown) + '</button></div>' +
        (s.part ? '<div class="card"><p class="muted">' + esc(C.sos.nameSay) + '</p><p style="margin-top:8px"><b>' + esc(C.sos.nameFear) + ':</b> ' + esc(C.parts[s.part].fear) + '</p><p style="margin-top:6px"><b>' + esc(C.sos.nameNeed) + ':</b> ' + esc(C.parts[s.part].need) + '</p></div>' : '') +
        '<div class="row" style="justify-content:space-between"><button class="btn ghost small" data-act="sos-back">Назад</button><button class="btn small" data-act="sos-next"' + (s.part !== null ? '' : ' disabled') + '>Дальше</button></div>';
    } else if (s.step === 4) {
      var moves = s.part ? C.parts[s.part].moves : ['Выпить воды', 'Встать и пройтись до окна', 'Написать одному человеку одно слово'];
      body = '<div class="sosbox"><p class="say">' + esc(C.sos.step) + '</p><div class="moves">' + moves.map(function (m, k) { return '<button class="mv" data-act="sos-move" data-k="' + k + '" aria-pressed="' + (s.move === k) + '">' + esc(m) + '</button>'; }).join('') + '</div></div>' +
        '<div class="row" style="justify-content:space-between"><button class="btn ghost small" data-act="sos-back">Назад</button><button class="btn small" data-act="sos-next"' + (s.move !== null ? '' : ' disabled') + '>' + esc(C.sos.stepDo) + '</button></div>';
    } else {
      body = '<div class="sosbox"><p class="say">' + esc(C.sos.done) + '</p><p>Сделал один шаг. Остальное можно отложить.</p></div>' +
        '<div class="stack"><button class="btn" data-act="sos-save">' + esc(C.sos.doneSave) + '</button><button class="btn ghost" data-act="sos-follow">' + esc(C.sos.doneFollow) + '</button><button class="btn ghost" data-act="sos-exit">' + esc(C.sos.exit) + '</button></div>';
    }
    return '<section class="stack">' + head + stepsRow + body + '</section>';
  };
  afterRender.sos = function () {
    if (S.sos.step !== 1 || S.sos.unsafe) return;
    var orb = document.getElementById('orb'), count = document.getElementById('breathCount');
    if (!orb) return;
    var phase = 0;
    function beat() {
      if (S.sos.round >= 6) { clearTimers(); return; }
      if (phase % 2 === 0) { orb.className = 'orb in'; orb.textContent = C.sos.breatheIn; count.textContent = 'Вдох, 4 секунды'; later(beat2, 4000); }
      else { orb.className = 'orb out'; orb.textContent = C.sos.breatheOut; count.textContent = 'Выдох, 6 секунд'; later(beat2, 6000); }
    }
    function beat2() { phase += 1; if (phase % 2 === 0) { S.sos.round += 1; save(); document.querySelectorAll('.rounds i').forEach(function (r, k) { r.classList.toggle('on', k < S.sos.round); }); if (S.sos.round >= 6) { orb.className = 'orb'; orb.textContent = 'Готово'; count.textContent = 'Шесть кругов. Можно дальше.'; var nb = document.getElementById('breathNext'); if (nb) nb.disabled = false; return; } } beat(); }
    beat();
  };

  VIEWS.memory = function () {
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><div class="kicker">Память</div><h1>Что Луна помнит</h1></div><span></span></div>' +
      '<p class="muted">' + esc(C.luna.memoryNote) + '</p>' +
      '<div class="stack">' + S.memory.map(function (m, k) {
        return '<div class="setrow" style="grid-template-columns:minmax(0,1fr) auto auto"><span><b>' + esc(m.t) + '</b><small>' + esc(m.src) + ' · ' + (m.on ? 'используется в разговоре' : 'не используется') + '</small></span>' +
          '<button class="sw" role="switch" aria-checked="' + !!m.on + '" data-act="mem-toggle" data-k="' + k + '" aria-label="Использовать в разговоре"></button>' +
          '<button class="btn ghost small" data-act="mem-forget" data-k="' + k + '">Забыть</button></div>';
      }).join('') + '</div>' +
      '<div class="card dash"><p class="kicker">Добавить вручную</p><div class="row" style="margin-top:8px"><input type="text" id="memNew" value="' + esc(S.drafts.memNew || '') + '" placeholder="Что Луне стоит помнить?" style="flex:1 1 180px"><button class="btn small" data-act="mem-add">Добавить</button></div></div>' +
      '</section>';
  };

  VIEWS.profile = function () {
    var rows = [
      ['map', 'Моя карта', 'Сцены, быстрый скан, полная карта', 'scan'],
      ['cabinet', 'Шкаф частей', 'Все части, звёзды, призыв', 'protector'],
      ['memory', 'Память Луны', 'Что сохранено и откуда', 'memory'],
      ['reminders', 'Напоминания', 'Каждый день, неделя и месяц', 'reminders'],
      ['sensory', 'Комфорт и ощущения', 'Тихо, мягко или живо', 'sensory'],
      ['backup', 'Копия и восстановление', 'Файл или облачная история', 'login'],
      ['login', 'Вход и сохранение', 'Почта, чтобы карта не терялась', 'login'],
      ['paywall', 'Коуч Луна и подписка', 'ИИ-коуч, полный доступ, восстановить покупку', 'paywall'],
      ['share', 'Поделиться', 'Без имён частей, если не хочешь', 'share'],
      ['therapist', 'Терапевт', 'Запись и кабинет специалиста', 'therapist'],
      ['install', 'Установить на домой', 'Открывается как приложение', 'install'],
      ['research', 'Отчёт для исследования', 'Для участников опроса: только числа и выборы', 'help'],
      ['help', 'Помощь', 'Как устроено небо', 'help'],
      ['map-feat', 'Карта прототипа', 'Все функции приложения и где они здесь', 'editor']
    ];
    return '<section class="stack">' +
      '<div class="top"><div><h1>Ты</h1><div class="sub">Всё, что про тебя и про устройство</div></div><span></span></div>' +
      '<div class="stack">' + rows.map(function (r) {
        var to = r[0] === 'map-feat' ? 'map' : r[0];
        return '<button class="setrow" data-act="go" data-to="' + to + '">' + ico(r[3]) + '<span><b>' + esc(r[1]) + '</b><small>' + esc(r[2]) + '</small></span><span class="chev">›</span></button>';
      }).join('') + '</div>' +
      '<div class="card lilac"><div class="toggle"><span><b class="h3">Небо ночью</b><br><span class="faint">Тёмная тема, как в приложении</span></span><button class="sw" role="switch" aria-checked="' + (S.mode === 'sky') + '" data-act="mode" aria-label="Небо ночью"></button></div></div>' +
      '<div class="card dash"><p class="faint">Прототип хранит всё в этом браузере. Сброс удалит карту отсюда.</p><button class="btn ghost small" data-act="reset" style="margin-top:8px;justify-self:start">' + (S.resetArmed ? 'Точно сбросить' : 'Сбросить прототип') + '</button></div>' +
      '</section>';
  };

  VIEWS['history-map'] = function () {
    var r = S.result;
    var rows = r ? [[r.source === 'deep' ? 'Погружение, 147 вопросов' : r.source === 'scan' ? 'Быстрый скан, 14 вопросов' : 'Сцены, восемь историй', 'Сейчас на экране. Предварительно, пока не уточнено.']] : [];
    return '<section class="stack"><div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>История оценок</h1><div class="sub">Прежние снимки никогда не меняются.</div></div><span></span></div>' +
      (rows.length ? rows.map(function (x) { return '<div class="card"><b class="h3">' + esc(x[0]) + '</b><p class="muted" style="margin-top:4px">' + esc(x[1]) + '</p></div>'; }).join('') : '<div class="card dash"><p class="muted">Оценок пока нет. Первая появится после сцен.</p></div>') +
      '<p class="faint">Сравнивать снимки можно по словам: громче, тише, без изменений. Числа не показываются.</p></section>';
  };

  VIEWS.map = function () {
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Карта прототипа</h1><div class="sub">Каждая функция приложения и где она здесь</div></div><span></span></div>' +
      '<p class="faint">Полностью — работает. Упрощённо — есть, но без всех деталей. План — описано, но не сделано.</p>' +
      '<div class="feat-wrap"><table class="feat"><thead><tr><th>Группа</th><th>Функция</th><th>Где</th><th>Статус</th></tr></thead><tbody>' +
      C.features.map(function (f) {
        return '<tr><td>' + esc(f[0]) + '</td><td>' + esc(f[1]) + '</td><td><button class="link" data-act="go" data-to="' + f[2] + '" style="font-size:13px">' + esc(f[2]) + '</button></td><td><span class="st ' + f[3] + '">' + ({ full: 'полностью', simple: 'упрощённо', plan: 'план' })[f[3]] + '</span></td></tr>';
      }).join('') + '</tbody></table></div></section>';
  };

  VIEWS.reminders = function () {
    var r = S.reminders;
    function row(key, title, sub, extra) {
      return '<div class="card"><div class="toggle"><span><b class="h3">' + title + '</b><br><span class="faint">' + sub + '</span></span><button class="sw" role="switch" aria-checked="' + !!r[key].on + '" data-act="rem-on" data-k="' + key + '" aria-label="' + title + '"></button></div>' + (extra || '') + '</div>';
    }
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Напоминания</h1><div class="sub">Тихо, без спама. Не больше одного в день.</div></div><span></span></div>' +
      row('daily', 'Каждый день', 'Одно мягкое напоминание, не больше одного в день', '<div class="row" style="margin-top:10px"><input type="time" value="' + r.daily.time + '" data-act="rem-time" data-k="daily" aria-label="Время ежедневного напоминания" style="min-height:42px;width:auto"></div>') +
      row('weekly', 'Раз в неделю', 'Итоги недели в небе', '<div class="row" style="margin-top:10px"><select data-act="rem-day" aria-label="День недели" style="width:auto"><option value="0"' + (r.weekly.day === 0 ? ' selected' : '') + '>Воскресенье</option><option value="5"' + (r.weekly.day === 5 ? ' selected' : '') + '>Пятница</option></select><input type="time" value="' + r.weekly.time + '" data-act="rem-time" data-k="weekly" aria-label="Время еженедельного напоминания" style="min-height:42px;width:auto"></div>') +
      row('monthly', 'Раз в месяц', 'Месяц позади: как коллектив?', '<div class="row" style="margin-top:10px"><span class="faint">1-го числа в</span><input type="time" value="' + r.monthly.time + '" data-act="rem-time" data-k="monthly" aria-label="Время ежемесячного напоминания" style="min-height:42px;width:auto"></div>') +
      '<div class="card"><div class="toggle"><span><b class="h3">Бережные напоминания</b><br><span class="faint">' + esc(C.push.gentle.when) + '</span></span><button class="sw" role="switch" aria-checked="' + !!r.gentle + '" data-act="rem-gentle" aria-label="Бережные напоминания"></button></div></div>' +
      '<div class="card"><p class="kicker">Как приходит</p><div class="seg tight" style="margin-top:8px" role="group"><button data-act="rem-channel" data-v="device" aria-pressed="' + (r.channel === 'device') + '">На устройство</button><button data-act="rem-channel" data-v="inapp" aria-pressed="' + (r.channel === 'inapp') + '">В приложении</button></div>' +
      '<div class="toggle" style="margin-top:12px"><span><b>Без подробностей на экране блокировки</b><br><span class="faint">Имена частей не показываются, пока телефон заблокирован.</span></span><button class="sw" role="switch" aria-checked="' + !!r.privacy + '" data-act="rem-privacy" aria-label="Без подробностей"></button></div>' +
      '<div class="toggle" style="margin-top:12px"><span><b>Тихие часы</b><br><span class="faint">' + r.quiet.from + ' – ' + r.quiet.to + '</span></span><span class="faint">ночью тихо</span></div></div>' +
      '<div class="card dash"><p class="kicker">Пауза</p><div class="row" style="margin-top:8px"><button class="btn small ghost" data-act="rem-skip">Пропустить сегодня</button><button class="btn small ghost" data-act="rem-pause">' + (r.pause ? 'Снять паузу' : 'Пауза на две недели') + '</button></div></div>' +
      '<p class="kicker">Как это выглядит</p><div class="stack">' +
      [C.push.daily, C.push.weekly, C.push.monthly].map(function (p, k) {
        return '<div class="push"><span class="app-ico">' + plush(['luna', 'sage', 'controller'][k], '') + '</span><span><b>Innerverse · ' + (r.privacy ? esc(p.lock) : esc(p.lock)) + '</b><small>' + (r.privacy ? 'Текст на экране блокировки: без подробностей. Внутри приложения: ' : '') + esc(p.inApp) + '</small></span></div>';
      }).join('') + '</div>' +
      '<p class="faint">В прототипе уведомления не отправляются. Отправку по расписанию нужно включить на сервере (см. план, раздел про напоминания).</p>' +
      '</section>';
  };

  VIEWS.sensory = function () {
    var s = S.sensory;
    var presets = [['still', 'Тихо'], ['gentle', 'Мягко'], ['lively', 'Живо']];
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Комфорт и ощущения</h1><div class="sub">Выбери общий стиль, потом настрой каждую часть.</div></div><span></span></div>' +
      '<div class="seg" role="group">' + presets.map(function (p) { return '<button data-act="sens-preset" data-v="' + p[0] + '" aria-pressed="' + (s.preset === p[0]) + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<div class="card"><div class="toggle"><span><b>Движение</b><br><span class="faint">Покачивание и подпрыгивание</span></span><button class="sw" role="switch" aria-checked="' + s.motion + '" data-act="sens" data-k="motion" aria-label="Движение"></button></div></div>' +
      '<div class="card"><div class="toggle"><span><b>Мягкие звуки</b><br><span class="faint">Выключены, пока ты не включишь</span></span><button class="sw" role="switch" aria-checked="' + s.sound + '" data-act="sens" data-k="sound" aria-label="Мягкие звуки"></button></div></div>' +
      '<div class="card"><div class="toggle"><span><b>Фактура войлока</b><br><span class="faint">Декоративный узор на фоне</span></span><button class="sw" role="switch" aria-checked="' + s.texture + '" data-act="sens" data-k="texture" aria-label="Фактура"></button></div></div>' +
      '<div class="card"><p class="kicker">Плотность</p><div class="seg" style="margin-top:8px" role="group"><button data-act="sens-density" data-v="open" aria-pressed="' + (s.density === 'open') + '">Свободно</button><button data-act="sens-density" data-v="compact" aria-pressed="' + (s.density === 'compact') + '">Плотно</button></div></div>' +
      '</section>';
  };

  VIEWS.backup = function () {
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Копия и восстановление</h1><div class="sub">Всё в одном файле или в буфере обмена.</div></div><span></span></div>' +
      '<button class="btn" data-act="backup-save">Сохранить копию</button>' +
      '<div class="card dash"><p class="kicker">Восстановить из копии</p><input type="text" placeholder="Вставь текст копии или выбери файл" style="margin-top:8px"><button class="btn small ghost" data-act="backup-read" style="margin-top:10px">Прочитать копию</button></div>' +
      '<div class="card"><p class="kicker">Облачная история</p><div class="stack" style="margin-top:8px">' +
      [['Вчера, 21:14', 'Карта из 147, 14 частей'], ['3 дня назад', 'Сцены и быстрый скан']].map(function (x, k) { return '<div class="setrow" style="grid-template-columns:minmax(0,1fr) auto"><span><b>' + esc(x[0]) + '</b><small>' + esc(x[1]) + '</small></span><button class="btn small ghost" data-act="cloud-restore" data-k="' + k + '">Восстановить</button></div>'; }).join('') +
      '</div></div>' +
      '<p class="faint">Восстановление заменит карту на этом устройстве. Перед этим спросим ещё раз.</p>' +
      '</section>';
  };

  VIEWS.share = function () {
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Поделиться картой</h1><div class="sub">Ты выбираешь, что показать.</div></div><span></span></div>' +
      '<div class="card lilac" style="display:grid;gap:10px;justify-items:center">' +
      '<div class="row" style="justify-content:center;gap:6px">' + dd('warrior', '') + dd('sage', '') + dd('inner_critic', '') + '</div>' +
      '<p class="h3">Мини-небо: 3 части</p></div>' +
      '<div class="toggle card"><span><b>Показать имена частей</b><br><span class="faint">Выключено по умолчанию</span></span><button class="sw" role="switch" aria-checked="' + !!S.shareNames + '" data-act="share-names" aria-label="Показать имена"></button></div>' +
      '<div class="card dash"><p class="kicker">Код карты</p><p class="h3" style="margin-top:6px;letter-spacing:.06em">IV-7K2-QM</p></div>' +
      '<button class="btn" data-act="share-copy">Скопировать код</button>' +
      '</section>';
  };

  VIEWS.paywall = function () {
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Коуч Луна</h1><div class="sub">ИИ-коуч, полный доступ</div></div><span></span></div>' +
      '<div class="card yellow"><p class="kicker">С подпиской</p><ul class="muted" style="margin:8px 0 0;padding-left:18px;display:grid;gap:4px"><li>Коуч объясняет любую часть простым языком</li><li>Практики без лимита</li><li>Полный отчёт и сравнение</li></ul></div>' +
      '<div class="card"><p class="kicker">Без подписки</p><p style="margin-top:6px">Пять замеров в неделю. Этого хватит, чтобы разобраться в небе.</p></div>' +
      '<button class="btn" data-act="pay-plans">Смотреть тарифы</button>' +
      '<button class="btn ghost small" data-act="pay-restore" style="justify-self:start">Восстановить покупку</button>' +
      '<div class="card dash"><p class="kicker">Пример разговора</p><div class="luna-chat" style="margin-top:8px"><div class="luna-av" aria-hidden="true">' + plush('explorer', '') + '</div><div class="lc-body"><div class="bubble">Что будет, если Завхоз сегодня отдохнёт?</div><div class="bubble me">Наверное, мир рухнет.</div><div class="bubble">Проверим? Одна маленькая задача и сорок минут без списка.</div></div></div></div>' +
      '</section>';
  };

  VIEWS.login = function () {
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Сохрани карту надёжно</h1><div class="sub">Чтобы не потерять её при смене телефона.</div></div><span></span></div>' +
      '<div class="card"><label class="field"><span>Почта</span><input type="email" id="loginMail" value="' + esc(S.drafts.loginMail || '') + '" placeholder="ты@почта.ру"></label><button class="btn small" data-act="login-send" style="margin-top:10px">Прислать ссылку</button></div>' +
      '<button class="btn ghost" data-act="login-skip">Пропустить и скачать копию</button>' +
      '<p class="faint">В прототипе письма не уходят. Ссылка входа работает только в приложении.</p>' +
      '</section>';
  };

  VIEWS.booking = function () {
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Запись к терапевту</h1><div class="sub">Сначала найди по почте.</div></div><span></span></div>' +
      '<div class="card"><label class="field"><span>Почта терапевта</span><input type="email" id="therapistMail" value="' + esc(S.drafts.therapistMail || '') + '" placeholder="терапевт@почта.ру"></label><button class="btn small" data-act="book-find" style="margin-top:10px">Найти терапевта</button></div>' +
      (S.bookFound ? '<div class="card mint"><b class="h3">Демо-терапевт</b><p class="muted" style="margin-top:4px">Работает с частями. Ведёт сессии онлайн.</p><p class="kicker" style="margin-top:10px">Свободные дни</p><div class="chips" style="margin-top:8px">' + ['Вт, 3 ноя', 'Ср, 4 ноя', 'Пт, 6 ноя'].map(function (d, k) { return '<button class="tag" data-act="book-day" data-k="' + k + '" aria-pressed="' + (S.bookDay === k) + '">' + d + '</button>'; }).join('') + '</div>' +
        (S.bookDay !== undefined ? '<p class="kicker" style="margin-top:10px">Время</p><div class="chips" style="margin-top:8px">' + ['11:00', '14:30', '17:00'].map(function (t, k) { return '<button class="tag" data-act="book-time" data-k="' + k + '" aria-pressed="' + (S.bookTime === k) + '">' + t + '</button>'; }).join('') + '</div>' : '') +
        '<label class="toggle" style="margin-top:12px"><span>Я разрешаю терапевту читать профиль и историю, которые я сохранил в аккаунте, пока запись в силе.</span><button class="sw" role="switch" aria-checked="' + !!S.bookConsent + '" data-act="book-consent" aria-label="Согласие на чтение"></button></label>' +
        '<button class="btn" data-act="book-send" style="margin-top:12px"' + (S.bookConsent && S.bookTime !== undefined ? '' : ' disabled') + '>Отправить запрос</button></div>' : '') +
      '</section>';
  };

  VIEWS.install = function () {
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Установить</h1><div class="sub">Полный экран, работает без сети, открывается как приложение.</div></div><span></span></div>' +
      '<div class="card"><p class="kicker">iPhone (Safari)</p><ol class="muted" style="margin:8px 0 0;padding-left:20px;display:grid;gap:4px"><li>Нажми «Поделиться».</li><li>Выбери «На экран «Домой»».</li></ol></div>' +
      '<div class="card"><p class="kicker">Android (Chrome)</p><ol class="muted" style="margin:8px 0 0;padding-left:20px;display:grid;gap:4px"><li>Открой меню «⋮».</li><li>Выбери «Установить приложение».</li></ol></div>' +
      '<button class="btn ghost" data-act="back">Понятно</button>' +
      '</section>';
  };

  VIEWS.research = function () {
    var r = S.research;
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Отчёт для исследования</h1><div class="sub">Числа и выборы. Тексты остаются на устройстве.</div></div><span></span></div>' +
      '<div class="card"><label class="field"><span>Код участника</span><input type="text" id="rCode" value="' + esc(r.code) + '" placeholder="например, P-07"></label></div>' +
      '<div class="seg" role="group" aria-label="День">' + [7, 14].map(function (d) { return '<button data-act="research-day" data-v="' + d + '" aria-pressed="' + (r.day === d) + '">День ' + d + '</button>'; }).join('') + '</div>' +
      '<div class="card"><p class="kicker">Подписка за 299 ₽ в месяц: интересно?</p><div class="pills" style="margin-top:8px">' + [['yes', 'Да'], ['no', 'Нет'], ['maybe', 'Не знаю']].map(function (x) { return '<button data-act="research-plus" data-v="' + x[0] + '" aria-pressed="' + (r.plus === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="card dash"><p class="kicker">Что запомнилось за неделю</p><textarea id="rNote" placeholder="Остаётся только здесь">' + esc(r.note || '') + '</textarea></div>' +
      '<button class="btn" data-act="research-copy">Скопировать отчёт</button>' +
      '<p class="faint">В отчёт попадают: сколько раз сделан чек-ин, сколько узелков, сколько раз открывали «Меня накрыло», сколько практик, и ответ про подписку. Тексты узелков и заметка не попадают.</p>' +
      '</section>';
  };

  VIEWS.help = function () {
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Как устроено небо</h1><div class="sub">Коротко, без инструкций на сорок страниц.</div></div><span></span></div>' +
      C.help.map(function (h, k) { return '<div class="card"><b class="h3">' + (k + 1) + '. ' + esc(h[0]) + '</b><p class="muted" style="margin-top:4px">' + esc(h[1]) + '</p></div>'; }).join('') +
      '</section>';
  };

  VIEWS.editor = function (p) {
    var id = p.id || 'controller';
    return '<section class="stack">' +
      '<div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><div class="kicker">Мастерская</div><h1>' + esc(nameOf(id)) + '</h1></div><span></span></div>' +
      '<p class="muted">Облик собирается из одной записи: 2D-дудл в небе и 3D-плюш в карточке. Здесь показан рисунок; живой редактор грузит движок.</p>' +
      '<div class="card lilac" style="display:grid;place-items:center;gap:10px">' + dd(id, '').replace('class="dd ', 'style="width:160px;height:160px" class="dd ') + '<div id="editorLive" class="faint">Движок для живого редактора: загрузка…</div></div>' +
      '<div class="pills">' + ALL.map(function (x) { return '<button data-act="editor-pick" data-id="' + x + '" aria-pressed="' + (x === id) + '">' + esc(nameOf(x)) + '</button>'; }).join('') + '</div>' +
      '<button class="btn" data-act="editor-save">Сохранить в шкаф</button>' +
      '</section>';
  };
  afterRender.editor = function () {
    var box = document.getElementById('editorLive');
    if (!box) return;
    var id = S.params.id || 'controller';
    loadBridge().then(function (B) {
      box.innerHTML = B.doodle(D.traits[id]) + '<span class="faint">Живой рисунок из движка приложения.</span>';
    }).catch(function () { box.innerHTML = '<span class="faint">Живой редактор не загрузился. Рисунок выше — статичный.</span>'; });
  };

  VIEWS.therapist = function () { return window.InnerverseTherapist ? window.InnerverseTherapist.cabinet() : '<section class="stack"><p>Кабинет терапевта загружается…</p></section>'; };
  VIEWS.client = function (p) { return window.InnerverseTherapist ? window.InnerverseTherapist.client(p) : '<section class="stack"><p>Клиент загружается…</p></section>'; };
  VIEWS.report = function (p) { return window.InnerverseTherapist ? window.InnerverseTherapist.report(p) : '<section class="stack"><p>Отчёт загружается…</p></section>'; };
  VIEWS.legacy64 = function () {
    return '<section class="stack"><div class="top"><button class="iconbtn" data-act="back" aria-label="Назад">←</button><div><h1>Карта связей (64)</h1><div class="sub">Старая карта. Сохранена для тех, кто её начал.</div></div><span></span></div>' +
      '<div class="card dash"><p class="muted">Полный набор 64 пунктов и расчёт работают через движок приложения. В прототипе — только описание: 64 вопроса, четыре оси и архетипы, без проверочных вопросов.</p></div></section>';
  };

  afterRender.client = function () { if (window.InnerverseTherapist) window.InnerverseTherapist.afterClient(); };
  window.InnerverseApp = { go: go, state: S, toast: toast };

  /* ---------- actions (one delegated listener) ---------- */
  var ACT = {};
  ACT.go = function (el) { go(el.dataset.to, { tab: el.dataset.tab, id: el.dataset.id, filter: el.dataset.f }); };
  ACT.back = function () { back(); };
  ACT.exit = function () { S.test = { i: 0, picks: [] }; S.scan = { i: 0, ans: {} }; go('home', {}, { replace: true }); };
  ACT['raw-sky'] = function () { go('sky'); };
  ACT.scene = function (el) {
    var k = +el.dataset.k, sc = C.scenes[S.test.i];
    var picked = el.parentNode.querySelectorAll('.ans');
    picked.forEach(function (b, j) { b.classList.toggle('picked', j === k); });
    S.test.picks.push(sc.o[k][1]);
    later(function () {
      S.test.i += 1;
      if (S.test.i >= C.scenes.length) { finishScenes(); return; }
      render();
    }, 320);
  };
  ACT['scan-start'] = function () { S.scan = { i: 0, ans: {} }; go('scan'); };
  ACT.scan = function (el) { S.scan.ans[SHADOW[S.scan.i]] = +el.dataset.v; render(); };
  ACT['scan-prev'] = function () { S.scan.i = Math.max(0, S.scan.i - 1); render(); };
  ACT['scan-next'] = function () {
    if (S.scan.i < SHADOW.length - 1) { S.scan.i += 1; render(); return; }
    finishScan();
  };
  ACT['deep-start'] = function () { S.deepShow = true; S.deep.i = S.deep.i || 0; render(); };
  ACT['deep-demo'] = function () { S.deep.ans = demoAnswers(); S.deep.i = 0; S.deepShow = true; render(); toast('Пример заполнен. Теперь можно дойти до конца.'); };
  ACT['deep-ans'] = function (el) { S.deep.ans[S.deep.i] = +el.dataset.v; render(); };
  ACT['deep-prev'] = function () { S.deep.i = Math.max(0, S.deep.i - 1); render(); };
  ACT['deep-pause'] = function () { S.deepShow = false; S.deep.i = S.deep.i || 0; go('home'); toast('Продолжим в любой момент.'); };
  ACT['deep-next'] = function () {
    if (S.deep.i < D.items.length - 1) { S.deep.i += 1; render(); return; }
    finishDeep();
  };
  ACT.legacy64 = function () { go('legacy64'); };
  ACT.feel = function (el) { S.checks.push({ feel: el.dataset.id, at: new Date().toISOString() }); render(); toast('Записано. ' + (C.luna.homeQuiet)); };
  ACT.part = function (el) { go('part', { id: el.dataset.id }); };
  ACT.self = function () { toast(C.self.line); };
  ACT.pin = function (el) { var id = el.dataset.id; S.pinned[id] = !S.pinned[id]; render(); };
  ACT.tool = function (el) { go('part-tool', { id: el.dataset.id, tool: el.dataset.tool }); };
  ACT['chem-open'] = function (el) { S.chemWith = null; go('chem', { id: el.dataset.id }); };
  ACT['chem-pick'] = function (el) { S.chemWith = el.dataset.id; render(); };
  ACT.talk = function (el) {
    var id = S.params.id, c = C.parts[id], i = +el.dataset.i;
    var line = document.getElementById('talkLine');
    if (line) { line.textContent = c.lines[i % c.lines.length]; line.classList.remove('typing'); }
    var reply = ['Что тебе нужно? Говори как есть, без вступления.', 'Спасибо. Кажется, это помогло и мне.', 'Выходной? Правда? Засекаю десять минут.'][i];
    toast(reply);
  };
  ACT.nego = function (el) {
    var id = S.params.id;
    S.nego.push({ part: id, v: el.dataset.v, text: C.parts[id].ask });
    render(); toast('Записано в переговоры.');
  };
  ACT.rest = function () { S.rests += 1; render(); toast('Отдых. Ничего не изменилось.'); };
  ACT.replay = function (el) { el.parentNode.querySelectorAll('.ans').forEach(function (b) { b.classList.toggle('picked', b === el); }); toast('Сцена продолжается. Отмечать завершённой не обязательно.'); };
  ACT['hist-save'] = function (el) {
    var id = el.dataset.id, list = S.histories[id] || [{ text: C.parts[id].face, at: 'первая версия' }];
    list.push({ text: C.parts[id].face, at: 'версия ' + (list.length + 1) });
    S.histories[id] = list; render(); toast('Сохранено как версия ' + list.length + '.');
  };
  ACT['hist-restore'] = function (el) {
    var id = el.dataset.id, list = S.histories[id] || [];
    var old = list[+el.dataset.k];
    if (!old) return;
    list.push({ text: old.text, at: 'восстановлено' }); S.histories[id] = list; render(); toast('Восстановлено как новая версия.');
  };
  ACT['chk'] = function (el) {
    S.chk[el.dataset.k] = el.dataset.v;
    if (!S.chk.feel) return render();
    render();
  };
  ACT['chk-done'] = function () {
    S.journal.push({ kind: 'thought', what: 'Чек-ин: ' + ((C.feelings.filter(function (f) { return f[0] === S.chk.feel; })[0] || [0, ''])[1]) + '. ' + (S.chk.event || '') + '.', where: '', part: S.chk.driver && ALL.indexOf(S.chk.driver) >= 0 ? S.chk.driver : null, sealed: false, at: 'сегодня' });
    S.chk = { feel: null, event: null, driver: null };
    go('home', {}, { replace: true }); toast('Записано в базу.');
  };
  ACT.practice = function () { go('practice'); };
  ACT['prac-open'] = function (el) { S.practice = { id: el.dataset.id, step: 0 }; render(); };
  ACT['prac-next'] = function () { var p = C.practices.filter(function (x) { return x.id === S.practice.id; })[0]; S.practice.step = Math.min(p.s.length - 1, S.practice.step + 1); render(); };
  ACT['prac-prev'] = function () { S.practice.step = Math.max(0, S.practice.step - 1); render(); };
  ACT['prac-stop'] = function () { S.practice = { id: null, step: 0 }; render(); toast('Остановились. Это тоже шаг.'); };
  ACT['prac-done'] = function () { var p = C.practices.filter(function (x) { return x.id === S.practice.id; })[0]; S.journal.push({ kind: 'body', what: 'Практика «' + p.t + '» — сделано.', where: '', part: null, sealed: false, at: 'сегодня' }); S.practice = { id: null, step: 0 }; render(); toast('Записано в узелки.'); };
  ACT.jform = function () { S.jform = !S.jform; S.jk = S.jk || 'trigger'; render(); };
  ACT.jkind = function (el) { S.jk = el.dataset.v; render(); };
  ACT.jsealed = function () { S.jsealed = !S.jsealed; render(); };
  ACT.jsave = function () {
    var what = (document.getElementById('jWhat') || {}).value || '';
    if (!what.trim()) { toast('Напиши хотя бы одно предложение.'); return; }
    S.journal.push({ kind: S.jk || 'trigger', what: what.trim(), where: (document.getElementById('jWhere') || {}).value || '', part: (document.getElementById('jPart') || {}).value || null, sealed: !!S.jsealed, at: 'сегодня' });
    S.jform = false; S.jsealed = false; S.drafts.jWhat = ''; render(); toast(S.journal[S.journal.length - 1].sealed ? 'Запечатано. Откроется через три дня.' : 'Записано.');
  };
  ACT['sos-exit'] = function () { clearTimers(); S.sos = { step: 0, round: 0, checks: 0, part: null, move: null, unsafe: false }; go('home', {}, { replace: true }); };
  ACT['sos-unsafe'] = function () { S.sos.unsafe = true; render(); };
  ACT['sos-next'] = function () {
    clearTimers();
    S.sos.step = Math.min(5, S.sos.step + 1);
    if (S.sos.step === 1) S.sos.round = 0;
    render();
  };
  ACT['sos-back'] = function () { clearTimers(); S.sos.step = Math.max(0, S.sos.step - 1); render(); };
  ACT['sos-check'] = function (el) { var k = +el.dataset.k; S.sos.checks = k < S.sos.checks ? k : k + 1; render(); };
  ACT['sos-part'] = function (el) { S.sos.part = el.dataset.id || ''; if (S.sos.part === '') S.sos.part = null; render(); };
  ACT['sos-move'] = function (el) { S.sos.move = +el.dataset.k; render(); };
  ACT['sos-save'] = function () {
    var name = S.sos.part ? nameOf(S.sos.part) : 'пока не ясно';
    var move = S.sos.move != null && S.sos.part ? C.parts[S.sos.part].moves[S.sos.move] : 'пауза и вода';
    S.journal.push({ kind: 'body', what: 'Меня накрыло. Громче всех: ' + name + '. Один шаг: ' + move + '.', where: '', part: S.sos.part, sealed: false, at: 'сегодня' });
    toast('Записано в узелки.');
  };
  ACT['sos-follow'] = function () { S.reminders.gentle = true; render(); toast('Завтра спросим, как ты. Можно не отвечать.'); };
  ACT['sky-filter'] = function (el) { S.params = { filter: el.dataset.f }; render(); };
  ACT.mode = function () { S.mode = S.mode === 'sky' ? 'light' : 'sky'; applyMode(); render(); };
  ACT['mem-toggle'] = function (el) { var m = S.memory[+el.dataset.k]; m.on = !m.on; render(); };
  ACT['mem-forget'] = function (el) { S.memory.splice(+el.dataset.k, 1); render(); toast('Забыто. Луна больше не будет на это опираться.'); };
  ACT['mem-add'] = function () { var v = (document.getElementById('memNew') || {}).value || ''; if (!v.trim()) return; S.memory.push({ t: v.trim(), src: 'Записано тобой', on: true }); render(); };
  ACT['rem-on'] = function (el) { var k = el.dataset.k; if (k === 'daily') S.reminders.daily.on = !S.reminders.daily.on; else S.reminders[k].on = !S.reminders[k].on; render(); };
  ACT['rem-gentle'] = function () { S.reminders.gentle = !S.reminders.gentle; render(); };
  ACT['rem-privacy'] = function () { S.reminders.privacy = !S.reminders.privacy; render(); };
  ACT['rem-channel'] = function (el) { S.reminders.channel = el.dataset.v; render(); };
  ACT['rem-skip'] = function () { toast('Сегодня без напоминаний. Завтра снова.'); };
  ACT['rem-pause'] = function () { S.reminders.pause = !S.reminders.pause; render(); toast(S.reminders.pause ? 'Пауза на две недели.' : 'Пауза снята.'); };
  ACT['sens-preset'] = function (el) {
    var v = el.dataset.v; S.sensory.preset = v;
    S.sensory.motion = v !== 'still'; S.sensory.sound = false; S.sensory.texture = v !== 'still';
    applySensory(); render();
  };
  ACT.sens = function (el) { var k = el.dataset.k; S.sensory[k] = !S.sensory[k]; applySensory(); render(); };
  ACT['sens-density'] = function (el) { S.sensory.density = el.dataset.v; render(); };
  ACT['backup-save'] = function () { toast('Копия готова. В прототипе файл не скачивается.'); };
  ACT['backup-read'] = function () { toast('Копия прочитана. В прототипе она не применяется.'); };
  ACT['cloud-restore'] = function () { toast('В приложении это спросит ещё раз. Здесь — только показ.'); };
  ACT['share-names'] = function () { S.shareNames = !S.shareNames; render(); };
  ACT['share-copy'] = function () {
    var code = 'IV-7K2-QM';
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { toast('Код скопирован.'); }, function () { toast('Код: ' + code); });
    else toast('Код: ' + code);
  };
  ACT['pay-plans'] = function () { toast('Тарифы и оплата открываются в приложении (Stripe).'); };
  ACT['pay-restore'] = function () { toast('На этом устройстве покупка не найдена.'); };
  ACT['login-send'] = function () { toast('В прототипе письма не уходят.'); };
  ACT['login-skip'] = function () { toast('Копия готова. В прототипе файл не скачивается.'); };
  ACT['book-find'] = function () { S.bookFound = true; render(); };
  ACT['book-day'] = function (el) { S.bookDay = +el.dataset.k; render(); };
  ACT['book-time'] = function (el) { S.bookTime = +el.dataset.k; render(); };
  ACT['book-consent'] = function () { S.bookConsent = !S.bookConsent; render(); };
  ACT['book-send'] = function () { toast('Запрос отправлен (демо). В приложении он уйдёт терапевту.'); };
  ACT.summon = function () { var v = (document.getElementById('summonName') || {}).value || ''; toast(v.trim() ? '«' + v.trim() + '» появится в небе после призыва. В прототипе — только так.' : 'Напиши имя части.'); };
  ACT['editor-pick'] = function (el) { S.params = { id: el.dataset.id }; render(); };
  ACT['editor-save'] = function () { toast('Облик сохранён в шкаф.'); };
  function keepResearchFields() {
    var c = document.getElementById('rCode'), n = document.getElementById('rNote');
    if (c) S.research.code = c.value;
    if (n) S.research.note = n.value;
  }
  ACT['research-day'] = function (el) { keepResearchFields(); S.research.day = +el.dataset.v; render(); };
  ACT['research-plus'] = function (el) { keepResearchFields(); S.research.plus = el.dataset.v; render(); };
  ACT['research-copy'] = function () {
    var code = (document.getElementById('rCode') || {}).value || '';
    var note = (document.getElementById('rNote') || {}).value || '';
    S.research.code = code; S.research.note = note; save();
    var sos = S.journal.filter(function (e) { return /Меня накрыло/.test(e.what); }).length;
    var practices = S.journal.filter(function (e) { return /Практика/.test(e.what); }).length;
    var sealed = S.journal.filter(function (e) { return e.sealed; }).length;
    var plus = { yes: 'да', no: 'нет', maybe: 'не знаю' }[S.research.plus] || 'не ответил(а)';
    var text = 'Innerverse · отчёт · участник ' + (code.trim() || '—') + ' · день ' + S.research.day + '\n' +
      'Чек-ины: ' + S.checks.length + '\nУзелки: ' + S.journal.length + '\nМеня накрыло: ' + sos + '\nПрактики: ' + practices + '\nЗапечатано: ' + sealed + '\nПодписка (299 ₽): ' + plus;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast('Отчёт скопирован.'); }, function () { toast('Отчёт: ' + text.split('\n').join(' · ')); });
    else toast('Отчёт: ' + text.split('\n').join(' · '));
  };
  ACT.reset = function () {
    if (!S.resetArmed) { S.resetArmed = true; render(); later(function () { S.resetArmed = false; }, 4000); return; }
    try { localStorage.removeItem(STORE); } catch (e) { /* nothing to remove */ }
    location.hash = ''; location.reload();
  };

  function applyMode() { document.documentElement.setAttribute('data-mode', S.mode === 'sky' ? 'sky' : 'light'); }
  function applySensory() {
    var s = S.sensory;
    document.documentElement.toggleAttribute('data-calm', !s.motion);
    document.documentElement.dataset.density = s.density;
    document.documentElement.dataset.texture = s.texture ? 'on' : 'off';
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    var act = el.dataset.act;
    var fn = ACT[act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.act === 'rem-time') { S.reminders[el.dataset.k].time = el.value; save(); toast('Время сохранено.'); }
    if (el.dataset && el.dataset.act === 'rem-day') { S.reminders.weekly.day = +el.value; save(); }
  });
  document.getElementById('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-tab]');
    if (b) go(b.dataset.tab);
  });

  /* ---------- start ---------- */
  applyMode(); applySensory();
  var tabsEl = document.getElementById('tabs');
  if (tabsEl) tabsEl.querySelector('.in');
  if (!S.onboarded && !S.result) { S.screen = 'welcome'; } else { S.screen = 'home'; }
  render();
  if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) { /* motion follows the sensory settings */ }
  document.addEventListener('visibilitychange', function () { /* the universe sleeps in therapist.js */ });
  window.addEventListener('hashchange', function () {
    var h = location.hash.replace('#', '');
    if (h === 'checkin') go('checkin'); if (h === 'sos-follow') go('sos'); if (h === 'weekly' || h === 'monthly') go('home');
  });
  if (!S.result && !S.onboarded) { /* first visit: Луна talks first */ }
})();
