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
    fetch('/we-are-one-news/data/feed.json')
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

  /* ---------- watch page ---------- */
  var wTitle = $('#watchTitle');
  if (wTitle) {
    var vid = decodeURIComponent((location.pathname.match(/\/watch\/([^/]+)/) || [])[1] || '');
    fill(null, function () {
      var v = byId[vid];
      if (!v) { $('#watchMain').innerHTML = '<div class="empty">Dispatch not found.</div>'; return; }
      document.title = v.title + ' — WE ARE ONE Digital News';
      var m = metas[v.sec] || metas.other;
      $('#watchMain').innerHTML = '' +
        '<div class="embed-16-9 frame-bronze"><iframe src="https://www.youtube-nocookie.com/embed/' + v.id +
        '?rel=0&modestbranding=1" title="' + esc(v.title) + '" allowfullscreen loading="lazy"></iframe></div>' +
        '<div style="display:flex;align-items:center;gap:.7rem;margin-top:1.4rem"><span class="chip ' + m.cls + '">' + m.label + '</span>' +
        (v.op ? '<span class="ep">' + esc(v.op) + '</span>' : '') + '</div>' +
        '<h1 class="watch-title">' + esc(v.title) + '</h1>' +
        '<div class="watch-meta"><span>' + (v.dateRaw || '') + '</span><span>' + (v.views ? fmtNum(v.views) + ' views' : '') + '</span></div>' +
        '<a class="btn btn-ghost" href="https://www.youtube.com/watch?v=' + v.id + '" target="_blank" rel="noopener">Open on YouTube ▸</a>';
      var rel = $('#relatedList');
      if (rel) rel.innerHTML = videos.filter(function (x) { return x.id !== v.id; }).slice(0, 5).map(rowHTML).join('');
      wTitle.textContent = v.title;
    });
  }

  /* ---------- forms ---------- */
  function bindForm(id, url, cb) {
    var f = $(id); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('#formStatus');
      if (msg) { msg.textContent = ''; msg.className = 'form-msg'; }
      var btn = f.querySelector('button[type=submit]');
      var old = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      var body = new URLSearchParams(new FormData(f));
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'fetch' }, body: body.toString() })
        .then(function (r) { return r.json().catch(function () { throw new Error('bad response'); }).then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || 'Request failed'); return j; }); })
        .then(function (j) {
          if (msg) { msg.textContent = j.message || 'Done — thank you.'; msg.classList.add('ok'); }
          f.reset();
        })
        .catch(function (err) {
          if (msg) { msg.textContent = err.message || 'Something went wrong. Please try again.'; msg.classList.add('err'); }
        })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = old; } });
    });
  }
  bindForm('#subForm', '/api/subscribe');
  bindForm('#contactForm', '/api/contact');
})();
