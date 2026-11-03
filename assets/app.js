/* ============================================================
   WE ARE ONE — DIGITAL NEWS : main script
   Video feed, search, filters, menu, forms
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- mobile nav ---------- */
  var burger = $('#burger'), navl = $('#navLinks');
  if (burger && navl) {
    burger.addEventListener('click', function () {
      navl.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(navl.classList.contains('open')));
    });
    document.addEventListener('click', function (e) {
      if (navl.classList.contains('open') && !navl.contains(e.target) && !burger.contains(e.target)) {
        navl.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- back to top ---------- */
  var btt = $('#backTop');
  if (btt) {
    window.addEventListener('scroll', function () {
      btt.classList.toggle('show', window.scrollY > 700);
    }, { passive: true });
    btt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---------- current date line ---------- */
  var nowEl = $('#nowDate');
  if (nowEl) {
    try {
      var d = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      nowEl.textContent = d;
    } catch (e) { /* keep static */ }
  }

  /* ---------- data + feed ---------- */
  var metas = {
    war: { label: 'War Report', cls: 'chip-war', icon: '✸' },
    news: { label: 'NewsBlast', cls: 'chip-news', icon: '◉' },
    short: { label: 'Short', cls: 'chip-short', icon: '⤢' },
    other: { label: 'Dispatch', cls: 'chip-other', icon: '▸' }
  };
  var byId = {};
  var videos = [];
  window.WAR_VIDEOS = videos;

  function th(v) { return v.thumb || ('https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg'); }

  function fill(dest, cb) {
    fetch('/WEAREONE-GuardianDaniel_R/data/feed.json')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        videos.length = 0;
        data.videos.forEach(function (v, i) { v.i = i; byId[v.id] = v; videos.push(v); });
        if (data.lastBuilt) window.WAR_BUILT = data.lastBuilt;
        cb(data);
      })
      .catch(function (e) {
        if (dest) dest.innerHTML = '<div class="empty">Feed unavailable — check connection (network error).</div>';
        console.error('feed', e);
      });
  }

  function cardHTML(v) {
    var m = metas[v.sec] || metas.other;
    var op = v.op ? ' <span class="ep">' + v.op + '</span>' : '';
    var extra = v.dateRaw ? '<span class="date">' + v.dateRaw + '</span>' : '';
    return '' +
      '<article class="video-card" data-sec="' + v.sec + '" data-views="' + (v.views || 0) + '">' +
      '  <a class="thumb" href="' + (v.url || ('https://www.youtube.com/watch?v=' + v.id)) + '" target="_blank" rel="noopener">' +
      '    <img src="' + th(v) + '" alt="' + esc(v.title) + '" loading="lazy">' +
      '    <span class="play"><i>▶</i></span>' +
      '    <span class="dur">' + (v.duration || '') + '</span>' +
      '  </a>' +
      '  <div class="vc-body">' +
      '    <span class="chip ' + m.cls + '">' + m.icon + ' ' + m.label + '</span>' + op +
      '    <h3 class="vc-title">' + esc(v.title) + '</h3>' +
      '    <div class="vc-meta"><span class="views">' + (v.views ? fmtNum(v.views) + ' views' : '') + '</span>' + extra + '</div>' +
      '  </div>' +
      '</article>';
  }

  function rowHTML(v) {
    var m = metas[v.sec] || metas.other;
    return '' +
      '<article class="row-video" data-sec="' + v.sec + '">' +
      '  <a class="thumb" href="' + (v.url || ('https://www.youtube.com/watch?v=' + v.id)) + '" target="_blank" rel="noopener">' +
      '    <img src="' + th(v) + '" alt="' + esc(v.title) + '" loading="lazy">' +
      '    <span class="dur">' + (v.duration || '') + '</span>' +
      '  </a>' +
      '  <div class="rv-body">' +
      '    <span class="date-tag">' + (v.dateRaw || '') + '</span>' +
      '    <span class="chip ' + m.cls + '">' + m.icon + ' ' + m.label + '</span>' +
      '    <h3 class="vc-title">' + esc(v.title) + '</h3>' +
      '    <div class="vc-meta"><span class="views">' + (v.views ? fmtNum(v.views) + ' views' : '') + '</span></div>' +
      '  </div>' +
      '</article>';
  }

  function fmtNum(n) {
    n = Number(n) || 0;
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- archive page: search + filters ---------- */
  var gridEl = $('#feedGrid'), countEl = $('#resultCount');
  if (gridEl) {
    var state = { q: '', sec: 'all', sort: 'new' };
    var qEl = $('#q'), chipsEl = $('#chips'), sortEl = $('#sort');

    function apply() {
      var q = state.q.trim().toLowerCase();
      var list = videos.filter(function (v) {
        if (state.sec !== 'all' && v.sec !== state.sec) return false;
        if (!q) return true;
        var hay = (v.title + ' ' + (v.op || '') + ' ' + (v.dateRaw || '')).toLowerCase();
        return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
      });
      if (state.sort === 'views') list = list.slice().sort(function (a, b) { return (b.views || 0) - (a.views || 0); });
      if (state.sort === 'az') list = list.slice().sort(function (a, b) { return a.title.localeCompare(b.title); });
      if (countEl) countEl.textContent = list.length + (list.length === 1 ? ' dispatch' : ' dispatches');
      if (!list.length) { gridEl.innerHTML = '<div class="empty">No dispatches match. Try another keyword.</div>'; return; }
      gridEl.innerHTML = list.map(rowHTML).join('');
    }

    if (qEl) qEl.addEventListener('input', function () { state.q = qEl.value; apply(); });
    if (sortEl) sortEl.addEventListener('change', function () { state.sort = sortEl.value; apply(); });
    if (chipsEl) chipsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.chip-btn'); if (!b) return;
      $$('.chip-btn', chipsEl).forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      state.sec = b.getAttribute('data-sec');
      apply();
    });
    fill(gridEl, function () { apply(); });
  }

  /* ---------- home page feed ---------- */
  var homeGrid = $('#homeFeed');
  if (homeGrid) {
    fill(homeGrid, function (data) {
      var war = videos.filter(function (v) { return v.sec === 'war'; });
      var news = videos.filter(function (v) { return v.sec === 'news'; });
      var shorts = videos.filter(function (v) { return v.sec === 'short'; });
      homeGrid.innerHTML = war.slice(0, 6).map(cardHTML).join('');
      var n2 = $('#newsHome'); if (n2) n2.innerHTML = news.slice(0, 6).map(cardHTML).join('');
      var s2 = $('#shortsHome'); if (s2) s2.innerHTML = shorts.slice(0, 4).map(cardHTML).join('');
      var f = $('#featured'); if (f && data.videos[0]) f.innerHTML = '<a class="thumb" href="' + (data.videos[0].url || '#') + '" target="_blank" rel="noopener"><img src="' + th(data.videos[0]) + '" alt="' + esc(data.videos[0].title) + '"><span class="play"><i>▶</i></span><span class="dur">' + (data.videos[0].duration || '') + '</span></a>';
    });
  }

  /* ---------- war reports page ---------- */
  var warGrid = $('#warGrid');
  if (warGrid) {
    fill(warGrid, function () {
      warGrid.innerHTML = videos.filter(function (v) { return v.sec === 'war'; }).map(cardHTML).join('');
    });
  }

  /* ---------- newsblast page ---------- */
  var newsGrid = $('#newsGrid');
  if (newsGrid) {
    fill(newsGrid, function () {
      newsGrid.innerHTML = videos.filter(function (v) { return v.sec === 'news'; }).map(cardHTML).join('');
    });
  }

  /* ---------- shorts page ---------- */
  var shortGrid = $('#shortGrid');
  if (shortGrid) {
    fill(shortGrid, function () {
      shortGrid.innerHTML = videos.filter(function (v) { return v.sec === 'short'; }).map(cardHTML).join('');
    });
  }

  /* ---------- watch page: related dispatches only (player is server-rendered) ---------- */
  var relList = $('#relatedList');
  if (relList) {
    var relVid = decodeURIComponent((location.pathname.match(/\/watch\/([^/]+)/) || [])[1] || '');
    fill(null, function () {
      relList.innerHTML = videos.filter(function (x) { return x.id !== relVid; })
        .slice(0, 5).map(rowHTML).join('');
    });
  }

  /* ---------- forms: posted straight to the static-form endpoint ----------
     Works on GitHub Pages (no backend needed). Set WAR_FORMS.endpoint below. */
  var WAR_FORMS = {
    endpoint: '',                     // e.g. https://formspree.io/f/abcdwxyz
    okMsg: 'You\'re on the list, Guardian. The next dispatch is on its way.',
    contactOk: 'Message received \u2014 the ops desk will reply by email.',
    badEmail: 'That email address doesn\'t look right \u2014 check it and try again.',
    noEndpoint: 'Submissions are not connected yet \u2014 please try again shortly.',
    fail: 'Something went wrong. Please try again.'
  };

  function isEmail(v) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test((v || '').trim());
  }

  function bindForm(sel, okMessage, requireMessage) {
    var f = $(sel); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('#formStatus');
      function say(text, good) {
        if (!msg) return;
        msg.textContent = text;
        msg.className = 'form-msg ' + (good ? 'ok' : 'err');
      }
      var data = new FormData(f);
      var email = (data.get('email') || '').trim();
      if (!isEmail(email)) { say(WAR_FORMS.badEmail, false); return; }
      if (requireMessage && (data.get('message') || '').trim().length < 5) {
        say('Please add a message of at least a few words.', false); return;
      }
      if (!WAR_FORMS.endpoint) { say(WAR_FORMS.noEndpoint, false); return; }

      var btn = f.querySelector('button[type=submit]');
      var old = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending\u2026'; }
      say('', true);

      data.append('_subject', sel === '#contactForm' ? 'WE ARE ONE \u2014 contact message' : 'WE ARE ONE \u2014 new subscriber');
      fetch(WAR_FORMS.endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      })
        .then(function (r) {
          if (r.ok) return r;
          return r.json().catch(function () { return {}; }).then(function (j) {
            var err = (j && j.errors && j.errors[0] && j.errors[0].message) || WAR_FORMS.fail;
            throw new Error(err);
          });
        })
        .then(function () { say(okMessage, true); f.reset(); })
        .catch(function (err) { say(err.message || WAR_FORMS.fail, false); })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = old; } });
    });
  }
  bindForm('#subForm', WAR_FORMS.okMsg, false);
  bindForm('#contactForm', WAR_FORMS.contactOk, true);
})();
