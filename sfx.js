/* Love Live TCG — LLSIFAS sound effects (assets/sfx/*.wav) */
(function () {
  'use strict';

  var SFX_KEY = 'tcg_sfx_enabled';
  var BASE = './assets/sfx/';
  var manifest = null;
  var pool = Object.create(null);
  var lastPlay = Object.create(null);
  var MIN_GAP_MS = 45;

  function enabled() {
    try { return localStorage.getItem(SFX_KEY) !== '0'; } catch (e) { return true; }
  }

  function setEnabled(on) {
    try { localStorage.setItem(SFX_KEY, on ? '1' : '0'); } catch (e2) { /* ignore */ }
  }

  function loadManifest() {
    if (manifest) return Promise.resolve(manifest);
    return fetch('./sfx_manifest.web.json?v=1', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('sfx manifest HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        manifest = data && typeof data === 'object' ? data : { events: {} };
        return manifest;
      })
      .catch(function () {
        manifest = { events: {} };
        return manifest;
      });
  }

  function metaFor(id) {
    return manifest && manifest.events && manifest.events[id];
  }

  function warm(id) {
    var meta = metaFor(id);
    if (!meta || !meta.file) return;
    if (!pool[meta.file]) {
      var a = new Audio(BASE + meta.file);
      a.preload = 'auto';
      pool[meta.file] = a;
    }
  }

  function play(id, opts) {
    if (!enabled()) return;
    var meta = metaFor(id);
    if (!meta || !meta.file) return;
    var now = Date.now();
    if (lastPlay[id] && now - lastPlay[id] < MIN_GAP_MS) return;
    lastPlay[id] = now;
    var vol = opts && opts.volume != null ? Number(opts.volume) : 1;
    if (!Number.isFinite(vol)) vol = 1;
    vol = Math.max(0, Math.min(1, vol));
    try {
      warm(id);
      var node = pool[meta.file].cloneNode();
      node.volume = vol;
      void node.play();
    } catch (e) { /* autoplay / missing file */ }
  }

  function init() {
    return loadManifest().then(function (m) {
      ['menu_tap', 'menu_confirm', 'match_found', 'card_play'].forEach(warm);
      return m;
    });
  }

  window.LLTCG_SFX = {
    SFX_KEY: SFX_KEY,
    enabled: enabled,
    setEnabled: setEnabled,
    loadManifest: loadManifest,
    play: play,
    warm: warm,
    init: init,
  };
})();
