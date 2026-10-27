(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var restart = function (el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* Felt-cut lettering: words stay unbreakable, each letter gets a small seeded tilt. */
  function jitter(root) {
    var n = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'jw';
            Array.from(part).forEach(function (ch) {
              var r = Math.sin(n * 12.9898 + 4.1) * 43758.5453; var f = r - Math.floor(r);
              var l = document.createElement('span'); l.className = 'jl'; l.textContent = ch;
              l.style.transform = 'rotate(' + ((f - 0.5) * 6).toFixed(1) + 'deg) translateY(' + (Math.sin(n * 1.7) * 1.6).toFixed(1) + 'px)';
              w.appendChild(l); n++;
            });
            frag.appendChild(w);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(root);
  }
  $$('.jitter').forEach(jitter);
  $$('h2').forEach(function (h) { h.classList.add('cutf'); });

  /* Plain words: every metaphor label switches to its literal twin. */
  var plainBtn = $('#plainBtn');
  $$('[data-plain]').forEach(function (el) { el.dataset.play = el.textContent; });
  plainBtn.addEventListener('click', function () {
    var on = plainBtn.getAttribute('aria-pressed') !== 'true';
    plainBtn.setAttribute('aria-pressed', String(on));
    $$('[data-plain]').forEach(function (el) { el.textContent = on ? el.dataset.plain : el.dataset.play; });
  });

  /* Day / Night: sets data-theme, which the token blocks already handle both ways. */
  var themeBtn = $('#themeBtn');
  var current = function () {
    var t = document.documentElement.dataset.theme;
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };
  var syncTheme = function () {
    var t = current();
    themeBtn.textContent = t === 'light' ? 'Night' : 'Day';
    themeBtn.setAttribute('aria-pressed', String(t === 'light'));
  };
  themeBtn.addEventListener('click', function () {
    document.documentElement.dataset.theme = current() === 'light' ? 'dark' : 'light';
    syncTheme();
  });
  syncTheme();

  /* Weather window: a radio group of beads on the cord. */
  var STORM = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M16 36a10 10 0 0 1 3-19 13 13 0 0 1 25 3 8 8 0 0 1 2 16z" fill="#6F55C2" stroke="#2B2452" stroke-width="2"/><path d="M34 34l-8 12h7l-4 12 12-16h-7l4-8z" fill="#F6E7B0" stroke="#A87A12" stroke-width="1.5" stroke-linejoin="round"/></svg>');
  var beads = $$('#cord .bead');
  var choose = function (bead, focus) {
    beads.forEach(function (b) { var on = b === bead; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    $('#scene').dataset.s = bead.dataset.v;
    $('#sillT').textContent = bead.getAttribute('aria-label');
    $('#sillP').textContent = bead.dataset.desc;
    $('#sillImg').src = bead.dataset.img === 'storm' ? STORM : bead.dataset.img;
    if (focus) bead.focus();
  };
  beads.forEach(function (b, i) {
    b.addEventListener('click', function () { choose(b); });
    b.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); choose(beads[Math.max(0, i - 1)], true); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); choose(beads[Math.min(beads.length - 1, i + 1)], true); }
    });
  });

  /* Moon-phase scale: identical feedback for every answer. */
  var moons = $$('#moonscale button');
  moons.forEach(function (m) {
    m.addEventListener('click', function () {
      moons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === m)); });
      $('#msNote').textContent = 'Сохранено. Следующее утверждение…';
    });
  });

  /* Knot-tie in the phone, with undo. */
  var fx = $('#knotFx'), toast = $('#knotToast');
  $('#tieBtn').addEventListener('click', function () {
    toast.classList.remove('on');
    if (!reduce) restart(fx, 'play');
    setTimeout(function () { toast.classList.add('on'); fx.classList.remove('play'); }, reduce ? 0 : 1250);
  });
  $('#untieBtn').addEventListener('click', function () { toast.classList.remove('on'); });

  /* Motion lab replays. */
  $$('[data-replay]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.dataset.replay);
      if (el.id === 'rollTrack') el.style.setProperty('--dist', Math.max(80, el.clientWidth - 56) + 'px');
      restart(el, 'run');
    });
  });
  $$('[data-knot]').forEach(function (btn) {
    btn.addEventListener('click', function () { restart(document.getElementById(btn.dataset.knot), 'play'); });
  });

  /* Squish anything soft. */
  $$('.squishy, .d-part').forEach(function (el) {
    el.addEventListener('pointerdown', function () { if (!reduce) restart(el, 'squish'); });
    el.addEventListener('animationend', function (e) { if (e.animationName === 'squish') el.classList.remove('squish'); });
  });

  /* Sketch to stitch. */
  var s2s = $('#s2s'), s2sBtn = $('#s2sBtn');
  var stitched = false;
  var sew = function () {
    if (stitched) { s2s.classList.remove('run', 'done'); void s2s.offsetWidth; stitched = false; s2sBtn.textContent = 'Сшить'; return; }
    if (reduce) s2s.classList.add('done'); else restart(s2s, 'run');
    stitched = true; s2sBtn.textContent = 'Ещё раз';
  };
  s2sBtn.addEventListener('click', sew);
  if ('IntersectionObserver' in window && !reduce) {
    var seen = false;
    var io = new IntersectionObserver(function (entries) {
      if (seen || !entries[0].isIntersecting) return;
      seen = true; io.disconnect();
      setTimeout(function () { if (!stitched) sew(); }, 700);
    }, { threshold: 0.6 });
    io.observe(s2s);
  }

  /* Copy prompts. */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = document.getElementById(btn.dataset.copy);
      var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy prompt'; }, 1600); };
      var fallback = function () {
        var range = document.createRange(); range.selectNodeContents(pre);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        btn.textContent = 'Selected: press copy';
        setTimeout(function () { btn.textContent = 'Copy prompt'; }, 2400);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pre.textContent).then(done, fallback);
        else fallback();
      } catch (e) { fallback(); }
    });
  });
})();
