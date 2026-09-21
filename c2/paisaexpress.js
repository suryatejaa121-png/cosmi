/* ================================================================
   PaisaExpress: one thread, no interfaces.

   Motion here is scroll, never a timer, so nothing can be scrolled past before it
   has happened. This file only turns position into two numbers and lets the CSS do
   the rest:

     --q  on anything that arrives: 0 while it is below the fold, 1 once it has risen
          a fifth of the screen.
     --p  on a mechanism ([data-pe-track]): how far that block has travelled up the
          screen. It draws the threads, sweeps the dial, fills the bars.

   Each frame reads every rectangle first and writes afterwards, and only for
   scenes near the screen, so the main thread stays with the scroll on a phone.

   With reduced motion, or without IntersectionObserver, none of this runs and the
   page is left complete and still.
   ================================================================ */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function list(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function smooth(t) { t = clamp01(t); return t * t * (3 - 2 * t); }

  // the lead stops at agents one, two and three, and goes straight through four
  var ORBIT = [[0, 0], [0.2, 0], [0.36, 90], [0.52, 90], [0.68, 180], [0.82, 180], [1, 360]];
  function orbitAt(p) {
    for (var i = 1; i < ORBIT.length; i++) {
      if (p <= ORBIT[i][0]) {
        var a = ORBIT[i - 1], b = ORBIT[i];
        return a[1] + (b[1] - a[1]) * smooth((p - a[0]) / (b[0] - a[0] || 1));
      }
    }
    return 360;
  }

  ready(function () {
    var page = document.querySelector(".pe-page");
    if (!page) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return;

    page.classList.add("pe-js");
    var scenes = list(page, "[data-pe-scene]");

    scenes.forEach(function (s) {
      s._seq = list(s, ".pe-seq, [data-pe-in]");
      s._tracks = list(s, "[data-pe-track]");
      s._lights = list(s, "[data-pe-lights]");
      s._said = list(s, ".pe-said");
      s._after = s.querySelector(".pe-after .pe-seq, .pe-then .pe-seq");
      s._clock = s.querySelector("[data-pe-clock]");
      s._ring = s.querySelector(".pe-ring-wrap");
    });

    // write a custom property only when it has actually changed
    function put(el, name, v) {
      var k = "_pe" + name;
      if (el[k] === v) return;
      el[k] = v;
      el.style.setProperty(name, v);
    }

    // the figures count up once, the first time they are seen
    function count(scene) {
      list(scene, "[data-pe-count]").forEach(function (el, i) {
        var to = parseInt(el.getAttribute("data-pe-count"), 10);
        if (!to) return;
        var t0 = null;
        var span = 900 + i * 120;
        function tick(now) {
          if (t0 === null) t0 = now;
          var p = Math.min(1, (now - t0) / span);
          el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }

    function clockText(el, p) {
      var end = el.getAttribute("data-pe-clock").split(":");
      var mins = Math.round(clamp01(p * 1.4) * (parseInt(end[0], 10) * 60 + parseInt(end[1], 10)));
      var hh = Math.floor(mins / 60), mm = mins % 60;
      var txt = (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
      if (el._peTxt !== txt) { el._peTxt = txt; el.textContent = txt; }
    }

    var queued = false;
    function frame() {
      queued = false;
      var vh = window.innerHeight;
      var writes = [];

      /* ---- read ---- */
      scenes.forEach(function (s) {
        if (!s._near) return;
        var r = s.getBoundingClientRect();
        s._sp = clamp01((vh * 0.9 - r.top) / (r.height + vh * 0.1));
        writes.push([s, "--sp", s._sp]);
        s._seq.forEach(function (el) {
          var top = el.getBoundingClientRect().top;
          var q = clamp01((vh * 0.94 - top) / (vh * 0.2));
          el._q = q;
          writes.push([el, "--q", q]);
        });
        s._tracks.forEach(function (el) {
          var b = el.getBoundingClientRect();
          var p = clamp01((vh * 0.9 - b.top) / (b.height + vh * 0.1));
          el._p = p;
          writes.push([el, "--p", p]);
        });
      });

      /* ---- write ---- */
      writes.forEach(function (w) { put(w[0], w[1], w[2].toFixed(3)); });
      scenes.forEach(function (s) {
        if (!s._near) return;
        s._lights.forEach(function (el) {
          s.classList.toggle("has-" + el.getAttribute("data-pe-lights"), el._q >= 0.6);
        });
        // one voice at a time: the last one to have arrived, until the call is over
        if (s._said.length) {
          var talking = -1;
          s._said.forEach(function (el, i) { if (el._q >= 0.5) talking = i; });
          if (s._after && s._after._q >= 0.5) talking = -1;
          s._said.forEach(function (el, i) { el.classList.toggle("is-talking", i === talking); });
        }
        if (!s._counted && s._sp > 0.25) { s._counted = true; count(s); }
        if (s._clock) clockText(s._clock, s._clock.parentNode._p || 0);
        if (s._ring) put(s._ring, "--orbit", orbitAt(s._ring._p || 0).toFixed(1) + "deg");
      });
    }
    function request() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(frame);
    }

    // scenes near the screen are read and kept alive; the rest cost nothing
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          var s = e.target;
          s._near = e.isIntersecting;
          s.classList.toggle("is-live", e.isIntersecting);
          if (e.isIntersecting) s.classList.add("was-live");
        });
        request();
      },
      { rootMargin: "30% 0px 30% 0px" }
    );
    scenes.forEach(function (s) { io.observe(s); });

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    if (window.lenis && typeof window.lenis.on === "function") window.lenis.on("scroll", request);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(request);
    request();
  });
})();
