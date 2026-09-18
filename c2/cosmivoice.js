/*
 * CosmiVoice: interaction and motion for the product page, the homepage band and the
 * products page. Every conversation here is simulated (CosmiVoice is in development).
 * Nothing runs while it is off screen; with reduced motion the demos still work, they
 * just don't animate.
 */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wide = function () { return window.innerWidth >= 768; };

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  // Run fn(true) when el comes into view and fn(false) when it leaves.
  function whenVisible(el, fn, margin) {
    if (!("IntersectionObserver" in window)) return fn(true);
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { fn(e.isIntersecting); });
    }, { rootMargin: margin || "0px" }).observe(el);
  }

  // Canvas animation holds still while the page is being scrolled and runs at about
  // 30 fps otherwise, so scrolling always gets the main thread first.
  var lastScroll = 0;
  window.addEventListener("scroll", function () { lastScroll = performance.now(); }, { passive: true });
  function calm(now, last) { return now - lastScroll > 160 && now - last > 32; }

  function safely(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.error("[cosmivoice] " + name, err); }
  }

  ready(function () {
    var roots = document.querySelectorAll(".c2.cv");
    if (!roots.length) return;
    roots.forEach(function (r) { r.classList.add("cv-ready"); });
    if (window.lenis && window.ScrollTrigger && !window.__cvLenisSync) {
      window.lenis.on("scroll", window.ScrollTrigger.update);
      window.__cvLenisSync = true;
    }
    safely("waves", waves);
    safely("field", fields);
    safely("stages", stages);
    safely("languages", langs);
    safely("reel", reel);
    safely("ecosystem", eco);
    safely("crew", crew);
    safely("tabs", tabs);
    safely("pipeline", pipeline);
    safely("demo", demo);
    safely("architecture", architecture);
    safely("dashboard", dashboard);
  });

  /* ---------------- voice waveforms ---------------- */
  // Bars move with whoever is speaking: the AI (violet, lively), the caller (blue),
  // or nobody (a quiet idle line). Read from the nearest [data-cv-speaking].
  var waveList = [];
  function waves() {
    var canvases = document.querySelectorAll("canvas.cv-wave");
    canvases.forEach(function (c) {
      var w = { c: c, ctx: c.getContext("2d"), on: false, amp: 0.25, seed: Math.random() * 100 };
      waveList.push(w);
      size(w);
      whenVisible(c, function (v) { w.on = v; if (v) loop(); });
      // A wave inside a hidden panel (industries) measures 0×0 at load; re-measure it
      // whenever it appears or changes size, or its 1-pixel bitmap gets stretched.
      if (window.ResizeObserver) {
        new ResizeObserver(function () {
          size(w);
          if (reduce) draw(w, 1.2);
        }).observe(c);
      }
    });
    window.addEventListener("resize", function () { waveList.forEach(size); if (reduce) waveList.forEach(function (w) { draw(w, 1.2); }); });
    if (reduce) waveList.forEach(function (w) { draw(w, 1.2); });
  }
  function size(w) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = w.c.getBoundingClientRect();
    w.c.width = Math.max(1, Math.round(r.width * dpr));
    w.c.height = Math.max(1, Math.round(r.height * dpr));
    w.dpr = dpr;
  }
  var looping = false;
  function loop() {
    if (looping || reduce) return;
    looping = true;
    var lastDraw = 0;
    (function frame(t) {
      var any = false;
      var go = calm(t, lastDraw);
      if (go) lastDraw = t;
      waveList.forEach(function (w) {
        if (!w.on) return;
        any = true;
        if (!go) return;
        var host = w.c.closest("[data-cv-speaking]");
        var who = host ? host.getAttribute("data-cv-speaking") : "idle";
        var target = who === "ai" ? 1 : who === "caller" ? 0.7 : 0.22;
        w.amp += (target - w.amp) * 0.08;
        w.who = who;
        draw(w, t / 1000);
      });
      if (any) requestAnimationFrame(frame);
      else looping = false;
    })(performance.now());
  }
  function draw(w, t) {
    // Without ResizeObserver, catch a canvas whose bitmap no longer matches its box.
    if (!window.ResizeObserver && Math.abs(w.c.width - w.c.clientWidth * (w.dpr || 1)) > 2) size(w);
    var ctx = w.ctx, W = w.c.width, H = w.c.height;
    if (W < 4 || H < 4) return;
    ctx.clearRect(0, 0, W, H);
    var bars = Math.max(24, Math.min(180, Math.round(W / (7 * w.dpr))));
    var step = W / bars, bw = Math.max(1.5 * w.dpr, step * 0.42);
    var grad = ctx.createLinearGradient(0, 0, W, 0);
    if (w.who === "caller") {
      grad.addColorStop(0, "#2ba7ff"); grad.addColorStop(1, "#7fd0ff");
    } else {
      grad.addColorStop(0, "#2ba7ff"); grad.addColorStop(0.5, "#ca45ff"); grad.addColorStop(1, "#fe881b");
    }
    ctx.fillStyle = grad;
    for (var i = 0; i < bars; i++) {
      var x = i * step + (step - bw) / 2;
      var env = Math.sin((i / (bars - 1)) * Math.PI);
      var n = Math.sin(i * 0.55 + t * 5.1 + w.seed) * 0.5 + Math.sin(i * 1.7 - t * 3.3) * 0.3 + Math.sin(i * 0.21 + t * 1.3) * 0.2;
      var h = Math.max(bw, (0.18 + Math.abs(n) * 0.82) * env * H * 0.92 * (w.amp || 0.25));
      var y = (H - h) / 2, r = bw / 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw, h, r);
      else ctx.rect(x, y, bw, h);
      ctx.fill();
    }
  }

  /* ---------------- starfield behind the hero and band ---------------- */
  function fields() {
    document.querySelectorAll("canvas[data-cv-field]").forEach(function (c) {
      var ctx = c.getContext("2d"), dots = [], on = false, dpr = Math.min(window.devicePixelRatio || 1, 2);
      function resize() {
        var r = c.getBoundingClientRect();
        c.width = Math.round(r.width * dpr);
        c.height = Math.round(r.height * dpr);
        var count = Math.round(Math.min(90, (r.width * r.height) / 16000));
        dots = [];
        for (var i = 0; i < count; i++) {
          dots.push({ x: Math.random() * c.width, y: Math.random() * c.height, vx: (Math.random() - 0.5) * 0.12 * dpr, vy: (Math.random() - 0.5) * 0.12 * dpr, r: (Math.random() * 1.2 + 0.4) * dpr });
        }
        paint();
      }
      function paint() {
        ctx.clearRect(0, 0, c.width, c.height);
        var link = 130 * dpr;
        for (var i = 0; i < dots.length; i++) {
          var a = dots[i];
          for (var j = i + 1; j < dots.length; j++) {
            var b = dots[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
            if (d < link) {
              ctx.strokeStyle = "rgba(169,151,206," + (0.14 * (1 - d / link)).toFixed(3) + ")";
              ctx.lineWidth = dpr * 0.6;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          ctx.fillStyle = "rgba(220,210,255,0.55)";
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      function frame() {
        if (!on) return;
        dots.forEach(function (p) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > c.width) p.vx *= -1;
          if (p.y < 0 || p.y > c.height) p.vy *= -1;
        });
        paint();
        requestAnimationFrame(frame);
      }
      // Drawn once: a still field costs nothing while scrolling.
      resize();
      window.addEventListener("resize", resize);
    });
  }

  /* ---------------- the voice stage: one exchange per language, in turn ---------------- */
  // The first exchange is in the HTML; the stage then plays the rest while it is on screen.
  function stages() {
    document.querySelectorAll("[data-cv-stage]").forEach(function (stage) {
      var data = JSON.parse(stage.querySelector("[data-cv-stage-data]").textContent);
      var bubs = { caller: stage.querySelector('[data-cv-bub="caller"]'), ai: stage.querySelector('[data-cv-bub="ai"]') };
      var sig = stage.querySelector(".cv-vstage-sig");
      var ribbon = stage.querySelector(".cv-ribbon");
      var chips = Array.prototype.slice.call(stage.querySelectorAll(".cv-langs li"));
      var at = 1, visible = false, timers = [];
      function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
      function fill(line, ex) {
        var b = bubs[line.who];
        b.querySelector(".cv-bub-who").textContent = line.who === "ai" ? ex.agent + " · AI" : "Caller";
        var t = b.querySelector(".cv-bub-text");
        t.textContent = line.text;
        t.setAttribute("lang", ex.code);
        return b;
      }
      function mark(ex) {
        chips.forEach(function (li) { li.classList.toggle("is-on", li.getAttribute("data-lang") === ex.lang); });
      }
      function play(ex) {
        bubs.caller.classList.remove("is-shown");
        bubs.ai.classList.remove("is-shown");
        sig.classList.remove("is-shown");
        mark(ex);
        later(650, function () {
          fill(ex.lines[0], ex).classList.add("is-shown");
          ribbon.setAttribute("data-cv-speaking", ex.lines[0].who);
        });
        later(2900, function () {
          if (!ex.lines[1]) return;
          fill(ex.lines[1], ex).classList.add("is-shown");
          ribbon.setAttribute("data-cv-speaking", ex.lines[1].who);
        });
        later(4800, function () {
          stage.querySelector('[data-sig="lang"]').textContent = ex.lang;
          stage.querySelector('[data-sig="action"]').textContent = ex.action;
          sig.classList.add("is-shown");
          ribbon.setAttribute("data-cv-speaking", "idle");
        });
      }
      function cycle() {
        if (!visible) return;
        play(data[at]);
        at = (at + 1) % data.length;
        later(7800, cycle);
      }
      mark(data[0]);
      bubs.caller.classList.add("is-shown");
      bubs.ai.classList.add("is-shown");
      sig.classList.add("is-shown");
      if (reduce) return;
      whenVisible(stage, function (v) {
        if (v === visible) return;
        visible = v;
        timers.forEach(clearTimeout);
        timers = [];
        if (v) later(4200, cycle);
      });
    });
  }

  /* ---------------- languages: one conversation, eight ways ---------------- */
  // Tours the languages on its own until someone picks one.
  function langs() {
    var rig = document.querySelector("[data-cv-lang]");
    if (!rig) return;
    var list = rig.querySelector('[role="tablist"]');
    var now = rig.querySelector("[data-cv-lang-now]");
    var tabsEls = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var touched = false, visible = false, timer = null, at = 0;
    function words(panel) {
      if (reduce) return;
      var n = 0;
      panel.querySelectorAll(".cv-lang-line p").forEach(function (el) {
        if (!el.getAttribute("data-cv-text")) el.setAttribute("data-cv-text", el.textContent);
        var parts = el.getAttribute("data-cv-text").split(" ");
        el.textContent = "";
        parts.forEach(function (w, i) {
          var s = document.createElement("span");
          s.className = "cv-w";
          s.textContent = w;
          s.style.animationDelay = n++ * 55 + "ms";
          el.appendChild(s);
          if (i < parts.length - 1) el.appendChild(document.createTextNode(" "));
        });
      });
    }
    var select = wireTabs(list, function (i, panel) {
      at = i;
      if (now) now.textContent = tabsEls[i].getAttribute("data-name") || "";
      words(panel);
    });
    function stop() { touched = true; clearTimeout(timer); }
    list.addEventListener("click", stop);
    list.addEventListener("keydown", stop);
    function tour() {
      clearTimeout(timer);
      if (touched || !visible || reduce) return;
      timer = setTimeout(function () {
        if (touched || !visible) return;
        select((at + 1) % tabsEls.length, false);
        tour();
      }, 4200);
    }
    whenVisible(rig, function (v) { visible = v; if (v) tour(); else clearTimeout(timer); }, "-15% 0px");
    var section = rig.closest("section");
    if (section) whenVisible(section, function (v) { section.classList.toggle("is-on", v); });
  }



  /* ---------------- the workforce: one voice at a time ---------------- */
  // A ring of sound bars in the current employee's colour, with their name at its centre.
  // It moves through the team on its own until someone picks a name.
  function crew() {
    var root = document.querySelector("[data-cv-crew]");
    if (!root) return;
    var canvas = root.querySelector("[data-cv-orb]");
    var ctx = canvas.getContext("2d");
    var hues = JSON.parse(root.querySelector("[data-cv-crew-hues]").textContent).map(function (hex) {
      var n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    });
    var ids = root.querySelectorAll(".cv-crew-id");
    var lines = root.querySelectorAll(".cv-crew-line");
    var buttons = Array.prototype.slice.call(root.querySelectorAll(".cv-crew-pick button"));
    var section = root.closest("section");
    var at = 0, col = hues[0].slice(), energy = 0, touched = false, visible = false, timer = null, dpr = 1;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      canvas.width = Math.max(4, Math.round(r.width * dpr));
      canvas.height = Math.max(4, Math.round(r.height * dpr));
    }
    function show(i) {
      at = i;
      energy = 1;
      [ids, lines].forEach(function (set) {
        Array.prototype.forEach.call(set, function (el) {
          var on = Number(el.getAttribute("data-i")) === i;
          el.classList.toggle("is-on", on);
          el.setAttribute("aria-hidden", on ? "false" : "true");
        });
      });
      buttons.forEach(function (b, n) { b.setAttribute("aria-pressed", n === i ? "true" : "false"); });
      var c = hues[i];
      if (section) section.style.setProperty("--crew", "rgb(" + c.join(",") + ")");
      if (reduce) { col = c.slice(); draw(0); }
    }
    function draw(t) {
      var W = canvas.width, H = canvas.height;
      if (W < 8) return;
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.33, maxLen = Math.min(W, H) * 0.15;
      var rgb = "rgb(" + col.map(Math.round).join(",") + ")";
      // soft inner disc and a hairline circle
      var g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.05);
      g.addColorStop(0, "rgba(" + col.map(Math.round).join(",") + ",0.16)");
      g.addColorStop(1, "rgba(12,10,20,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(" + col.map(Math.round).join(",") + ",0.28)";
      ctx.lineWidth = dpr;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2); ctx.stroke();
      // bars around the ring
      var n = 120, bw = Math.max(1.5 * dpr, (Math.PI * 2 * R / n) * 0.42);
      ctx.lineCap = "round";
      ctx.lineWidth = bw;
      ctx.strokeStyle = rgb;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 - Math.PI / 2;
        var v = Math.sin(i * 0.33 + t * 2.4) * 0.45 + Math.sin(i * 0.11 - t * 1.7) * 0.35 + Math.sin(i * 0.9 + t * 4.1) * 0.2;
        var len = maxLen * (0.08 + Math.abs(v) * (0.35 + energy * 0.65));
        ctx.globalAlpha = 0.55 + Math.abs(v) * 0.45;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.lineTo(cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    var lastDraw = 0;
    function frame(now) {
      if (!visible) return;
      requestAnimationFrame(frame);
      if (!calm(now, lastDraw)) return;
      lastDraw = now;
      var target = hues[at];
      for (var k = 0; k < 3; k++) col[k] += (target[k] - col[k]) * 0.06;
      energy += (0.45 - energy) * 0.04;
      draw(now / 1000);
    }
    function tour() {
      clearTimeout(timer);
      if (touched || !visible || reduce) return;
      timer = setTimeout(function () { show((at + 1) % hues.length); tour(); }, 5200);
    }
    buttons.forEach(function (b, i) {
      b.addEventListener("click", function () { touched = true; clearTimeout(timer); show(i); });
    });
    size();
    if (window.ResizeObserver) new ResizeObserver(function () { size(); if (reduce) draw(0); }).observe(canvas);
    show(0);
    energy = 0.45;
    if (reduce) { draw(0); return; }
    whenVisible(root, function (v) {
      if (v === visible) return;
      visible = v;
      if (v) { requestAnimationFrame(frame); tour(); } else clearTimeout(timer);
    });
  }

  /* ---------------- the story reel: one call, five scenes ---------------- */
  // On wide screens the reel pins and runs sideways with the scroll; elsewhere the scenes
  // simply stack. No snapping: snapping fights the site's smooth scrolling.
  function reel() {
    var root = document.querySelector("[data-cv-reel]");
    if (!root) return;
    var track = root.querySelector(".cv-reel-track");
    var scenes = Array.prototype.slice.call(root.querySelectorAll(".cv-scene"));
    if (!scenes.length) return;
    var current = -1;
    function activate(i) {
      if (i === current) return;
      current = i;
      scenes.forEach(function (s, n) { s.classList.toggle("is-active", n === i); });
      var words = scenes[i].querySelectorAll(".cv-understand .cv-quote span");
      if (words.length && !reduce) {
        words.forEach(function (w) { w.style.color = "var(--cv-dim)"; });
        words.forEach(function (w, n) { setTimeout(function () { w.style.color = ""; }, 150 + n * 90); });
      }
    }
    if (reduce || !wide() || !window.gsap || !window.ScrollTrigger || scenes.length < 2) {
      scenes.forEach(function (s) { s.classList.add("is-active"); });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add("is-reel");
    activate(0);
    var travel = function () { return Math.max(0, track.scrollWidth - root.clientWidth); };
    gsap.to(track, {
      x: function () { return -travel(); },
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: function () { return "+=" + travel(); },
        pin: true,
        scrub: 0.4,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) { activate(Math.round(self.progress * (scenes.length - 1))); },
      },
    });
  }

  /* ---------------- the ecosystem star map ---------------- */
  // Pointing at a product lights its signal line and tells its story at the centre.
  // While nobody is pointing, it moves through the family on its own.
  function eco() {
    document.querySelectorAll("[data-cv-eco]").forEach(function (map) {
      var stars = Array.prototype.slice.call(map.querySelectorAll(".cv-np"));
      var lines = map.querySelectorAll(".cv-gl");
      var say = map.querySelector(".cv-galaxy-say");
      var nameEl = map.querySelector("[data-cv-eco-name]");
      var roleEl = map.querySelector("[data-cv-eco-role]");
      if (!stars.length || !say) return;
      var at = -1, hovering = false, visible = false, timer = null, swap = null;
      function show(i) {
        if (i === at) return;
        at = i;
        stars.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
        Array.prototype.forEach.call(lines, function (l) { l.classList.toggle("is-on", Number(l.getAttribute("data-i")) === i); });
        var s = stars[i];
        clearTimeout(swap);
        say.classList.add("is-swap");
        swap = setTimeout(function () {
          nameEl.textContent = s.getAttribute("data-name");
          roleEl.textContent = s.getAttribute("data-role") + " · " + s.getAttribute("data-status");
          say.classList.remove("is-swap");
        }, reduce ? 0 : 220);
      }
      function cycle() {
        clearTimeout(timer);
        if (hovering || !visible || reduce) return;
        timer = setTimeout(function () { show((at + 1) % stars.length); cycle(); }, 3000);
      }
      stars.forEach(function (s, i) {
        s.addEventListener("mouseenter", function () { hovering = true; clearTimeout(timer); show(i); });
        s.addEventListener("focus", function () { hovering = true; clearTimeout(timer); show(i); });
        s.addEventListener("mouseleave", function () { hovering = false; cycle(); });
        s.addEventListener("blur", function () { hovering = false; cycle(); });
      });
      show(0);
      whenVisible(map, function (v) {
        visible = v;
        map.classList.toggle("is-live", v);
        if (v) cycle(); else clearTimeout(timer);
      });
    });
  }

  /* ---------------- tabs: inbound / outbound, and industries ---------------- */
  function wireTabs(list, onSelect) {
    var tabsEls = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    function select(i, focus) {
      tabsEls.forEach(function (t, n) {
        var on = n === i;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tabsEls[i].focus();
      onSelect(i, document.getElementById(tabsEls[i].getAttribute("aria-controls")));
    }
    tabsEls.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, false); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % tabsEls.length;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + tabsEls.length) % tabsEls.length;
        if (e.key === "Home") n = 0;
        if (e.key === "End") n = tabsEls.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
    return select;
  }

  function tabs() {
    var modes = document.querySelector("[data-cv-modes]");
    if (modes) {
      var section = modes.closest("section");
      wireTabs(modes, function (i, panel) {
        modes.setAttribute("data-active", String(i));
        section.querySelectorAll(".cv-mode").forEach(function (m) { m.classList.remove("is-on"); });
        requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.add("is-on"); }); });
      });
      var first = section.querySelector(".cv-mode:not([hidden])");
      whenVisible(section, function (v) { if (v && first) first.classList.add("is-on"); }, "-20% 0px");
    }

    var rig = document.querySelector("[data-cv-industries]");
    if (rig) {
      var stage = rig.querySelector(".cv-ind-stage");
      var word = rig.querySelector("[data-cv-word]");
      var list = rig.querySelector('[role="tablist"]');
      wireTabs(list, function (i, panel) {
        stage.style.setProperty("--cv-hue-n", String(i));
        var name = list.querySelectorAll('[role="tab"]')[i].textContent;
        scramble(word, name);
        if (!reduce && window.gsap) gsap.fromTo(panel.children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: "power2.out" });
      });
    }
  }

  // Letters settle into the new word, like a display flipping.
  function scramble(el, to) {
    if (!el) return;
    if (reduce) { el.textContent = to; return; }
    var glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-";
    var from = el.textContent, len = Math.max(from.length, to.length), frame = 0, total = 18;
    clearInterval(el._cvScramble);
    el._cvScramble = setInterval(function () {
      frame++;
      var out = "";
      for (var i = 0; i < len; i++) {
        var settle = (i / len) * total * 0.7 + total * 0.3;
        out += frame >= settle ? to[i] || "" : glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = out;
      if (frame >= total) { clearInterval(el._cvScramble); el.textContent = to; }
    }, 34);
  }

  /* ---------------- the pipeline ---------------- */
  function pipeline() {
    var root = document.querySelector("[data-cv-pipe]");
    if (!root) return;
    var stages = Array.prototype.slice.call(root.querySelectorAll(".cv-stage"));
    var outs = Array.prototype.slice.call(root.querySelectorAll(".cv-readout"));
    var spine = root.querySelector(".cv-spine");
    var pulse = root.querySelector(".cv-spine-pulse");
    var panel = root.querySelector(".cv-readouts");
    var ms = panel ? JSON.parse(panel.getAttribute("data-cv-ms") || "[]") : [];
    var segs = panel ? panel.querySelectorAll(".cv-ro-segs i") : [];
    var nEl = panel && panel.querySelector("[data-cv-ro-n]");
    var msEl = panel && panel.querySelector("[data-cv-ro-ms]");
    var totalEl = panel && panel.querySelector("[data-cv-ro-total]");
    var current = -1;
    function activate(i) {
      if (i === current) return;
      current = i;
      if (nEl) nEl.textContent = String(i + 1).padStart(2, "0");
      Array.prototype.forEach.call(segs, function (s, n) { s.classList.toggle("is-lit", n <= i); });
      if (msEl) msEl.textContent = String(ms[i] || 0);
      if (totalEl) totalEl.textContent = String(ms.slice(0, i + 1).reduce(function (a, b) { return a + b; }, 0));
      stages.forEach(function (s, n) { s.classList.toggle("is-active", n === i); s.classList.toggle("is-past", n < i); });
      outs.forEach(function (o, n) { o.classList.toggle("is-active", n === i); });
      if (!window.gsap || reduce) spine.style.setProperty("--p", ((i + 0.5) / stages.length) * 100 + "%");
    }
    activate(0);
    if (window.gsap && window.ScrollTrigger && !reduce && pulse) {
      gsap.fromTo(pulse, { height: "0%" }, {
        height: "100%",
        ease: "none",
        scrollTrigger: { trigger: spine, start: "top 50%", end: "bottom 50%", scrub: 0.4 },
      });
    }
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && wide()) activate(stages.indexOf(e.target));
      });
    }, { rootMargin: "-48% 0px -48% 0px" });
    stages.forEach(function (s) { io.observe(s); });
  }

  /* ---------------- the live demo with Maya ---------------- */
  function demo() {
    var rig = document.querySelector("[data-cv-demo]");
    if (!rig) return;
    var data = JSON.parse(rig.querySelector("[data-cv-demo-script]").textContent);
    var log = rig.querySelector("[data-cv-demo-log]");
    var btn = rig.querySelector("[data-cv-demo-start]");
    var label = rig.querySelector("[data-cv-demo-label]");
    var slotBox = rig.querySelector("[data-cv-demo-slots]");
    var timerEl = rig.querySelector("[data-cv-demo-timer]");
    var calText = rig.querySelector("[data-cv-demo-cal-text]");
    var calSlots = Array.prototype.slice.call(rig.querySelectorAll(".cv-cal-slots li"));
    var acts = Array.prototype.slice.call(rig.querySelectorAll("[data-cv-demo-acts] li"));
    var wa = rig.querySelector("[data-cv-demo-wa]");
    var waText = rig.querySelector("[data-cv-demo-wa-text]");
    var signals = Array.prototype.slice.call(rig.querySelectorAll(".cv-signal-list dd"));
    var timers = [], clock = null, secs = 0;
    var call = rig.querySelector(".cv-rig-call");

    function later(ms, fn) { timers.push(setTimeout(fn, reduce ? Math.min(ms, 80) : ms)); }
    function speaking(who) { call.setAttribute("data-cv-speaking", who); }
    function clockStart() {
      secs = 0;
      clearInterval(clock);
      clock = setInterval(function () {
        secs++;
        timerEl.textContent = String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0");
      }, 1000);
    }
    function reset() {
      timers.forEach(clearTimeout); timers = [];
      clearInterval(clock);
      timerEl.textContent = "00:00";
      log.innerHTML = "";
      slotBox.hidden = true;
      wa.hidden = true;
      calText.textContent = "Waiting for a request";
      calSlots.forEach(function (s) { s.classList.remove("is-open", "is-booked"); });
      acts.forEach(function (a) { a.classList.remove("is-done"); });
      signals.forEach(function (d) { d.textContent = "Listening…"; d.classList.remove("is-set"); });
      speaking("idle");
    }
    function line(cls, html) {
      var li = document.createElement("li");
      li.className = "cv-t " + cls;
      li.innerHTML = html;
      log.appendChild(li);
      log.scrollTop = log.scrollHeight;
      return li;
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function say(who, text, ms, then) {
      var name = who === "ai" ? "Maya · AI" : data.caller;
      var typing = line("cv-t--" + who, '<span class="cv-who">' + esc(name) + '</span><span class="cv-say"><span class="cv-typing" aria-label="typing"><i></i><i></i><i></i></span></span>');
      speaking(who);
      later(ms, function () {
        typing.remove();
        line("cv-t--" + who, '<span class="cv-who">' + esc(name) + '</span><span class="cv-say">' + esc(text) + "</span>");
        if (then) then();
      });
    }
    function system(text) {
      line("cv-t--system", '<span class="cv-sys">System</span>' + esc(text));
    }

    function start() {
      reset();
      btn.disabled = true;
      label.textContent = "Call in progress";
      clockStart();
      say("ai", data.opening, 1200, function () {
        later(700, function () {
          say("caller", data.ask, 1300, function () {
            speaking("idle");
            signals.forEach(function (d, i) {
              later(350 + i * 550, function () { d.textContent = d.getAttribute("data-value"); d.classList.add("is-set"); });
            });
            later(2100, function () { calText.textContent = "Checking Dr. Rao's availability next week…"; system("Calendar · checking availability"); });
            later(3300, function () {
              calSlots.forEach(function (s) { s.classList.add("is-open"); });
              calText.textContent = data.slots.length + " openings found";
              say("ai", data.offer, 1000, function () {
                speaking("idle");
                slotBox.hidden = false;
                label.textContent = "Pick a slot for Sarah";
              });
            });
          });
        });
      });
    }

    function pick(slot) {
      slotBox.hidden = true;
      label.textContent = "Call in progress";
      line("cv-t--caller", '<span class="cv-who">' + esc(data.caller) + '</span><span class="cv-say">' + esc(data.pick.replace("{slot}", slot)) + "</span>");
      later(700, function () {
        calSlots.forEach(function (s) { if (s.getAttribute("data-slot") === slot) s.classList.add("is-booked"); });
        calText.textContent = "Booked · " + slot;
        say("ai", data.confirm.replace("{slot}", slot), 1100, function () {
          speaking("idle");
          acts.forEach(function (a, i) { later(350 + i * 550, function () { a.classList.add("is-done"); }); });
          later(350 + acts.length * 550, function () {
            waText.textContent = data.message.replace("{slot}", slot);
            wa.hidden = false;
            line("cv-t--action", '<span class="cv-done">Call complete · appointment booked · no human needed</span>');
            clearInterval(clock);
            btn.disabled = false;
            label.textContent = "Replay the call";
          });
        });
      });
    }

    btn.addEventListener("click", start);
    slotBox.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-slot]");
      if (b) pick(b.getAttribute("data-slot"));
    });
    // The call waits politely off screen; leaving mid-call ends it.
    whenVisible(rig, function (v) {
      if (!v && btn.disabled) { reset(); btn.disabled = false; label.textContent = "Start the call"; log.innerHTML = '<li class="cv-t cv-t--hint">Press start to hear how Maya handles Sarah\'s call.</li>'; }
    });
  }

  /* ---------------- architecture wires ---------------- */
  function architecture() {
    var map = document.querySelector("[data-cv-arch]");
    if (!map) return;
    var svg = map.querySelector(".cv-wires");
    var g = map.querySelector("[data-cv-wires]");
    var grad = svg.querySelector("#cv-wire-grad");
    var core = map.querySelector(".cv-core");
    var ins = Array.prototype.slice.call(map.querySelectorAll('[data-port="in"]'));
    var outs = Array.prototype.slice.call(map.querySelectorAll('[data-port="out"]'));
    var NS = "http://www.w3.org/2000/svg";
    function draw() {
      if (!wide()) { g.innerHTML = ""; return; }
      var box = map.getBoundingClientRect();
      svg.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);
      if (grad) grad.setAttribute("x2", String(box.width));
      var c = core.getBoundingClientRect();
      var cx = c.left - box.left, cr = c.right - box.left, cy = c.top - box.top + c.height * 0.42;
      var html = "";
      var curve = function (x1, y1, x2, y2) { var m = (x1 + x2) / 2; return "M" + x1 + " " + y1 + " C" + m + " " + y1 + " " + m + " " + y2 + " " + x2 + " " + y2; };
      ins.forEach(function (p) {
        var r = p.getBoundingClientRect();
        var d = curve(r.right - box.left, r.top - box.top + r.height / 2, cx + c.width * 0.18, cy);
        html += '<path d="' + d + '"></path><path class="cv-flowline" d="' + d + '"></path>';
      });
      outs.forEach(function (p, i) {
        var r = p.getBoundingClientRect();
        var d = curve(cr - c.width * 0.18, cy, r.left - box.left, r.top - box.top + r.height / 2);
        html += '<path d="' + d + '"></path><path class="cv-flowline" data-out="' + i + '" d="' + d + '"></path>';
      });
      g.innerHTML = html;
    }
    draw();
    if (window.ResizeObserver) new ResizeObserver(draw).observe(map);
    else window.addEventListener("resize", draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    outs.forEach(function (p, i) {
      var hot = function (on) { var w = g.querySelector('[data-out="' + i + '"]'); if (w) w.classList.toggle("is-hot", on); };
      p.addEventListener("mouseenter", function () { hot(true); });
      p.addEventListener("mouseleave", function () { hot(false); });
      p.addEventListener("focus", function () { hot(true); });
      p.addEventListener("blur", function () { hot(false); });
    });
  }

  /* ---------------- analytics dashboard ---------------- */
  function dashboard() {
    var dash = document.querySelector("[data-cv-dash]");
    if (!dash) return;
    var drawn = false;
    whenVisible(dash, function (v) {
      if (!v || drawn) return;
      drawn = true;
      dash.classList.add("is-drawn");
      if (!reduce) dash.querySelectorAll("[data-cv-count]").forEach(countUp);
    }, "-15% 0px");

    // Line chart: crosshair and tooltip, by pointer or arrow keys.
    var svg = dash.querySelector("[data-cv-line]");
    var plot = svg && svg.closest(".cv-plot");
    var tip = plot && plot.querySelector("[data-cv-tip]");
    if (svg && tip) {
      var meta = JSON.parse(svg.getAttribute("data-cv-line"));
      var cross = svg.querySelector(".cv-cross");
      var vbW = svg.viewBox.baseVal.width;
      var at = meta.points.length - 1;
      svg.setAttribute("tabindex", "0");
      function show(i) {
        at = Math.max(0, Math.min(meta.points.length - 1, i));
        var p = meta.points[at];
        cross.setAttribute("x1", p.x); cross.setAttribute("x2", p.x);
        plot.classList.add("is-hover");
        tip.innerHTML = "<b>" + p.d + "</b><i style=\"background:var(--cv-c1)\"></i>Inbound " + p.i.toLocaleString("en-IN") + "<br><i style=\"background:var(--cv-c2)\"></i>Outbound " + p.o.toLocaleString("en-IN");
        tip.hidden = false;
        var px = (p.x / vbW) * plot.clientWidth;
        var left = px + 12;
        if (left + tip.offsetWidth > plot.clientWidth) left = px - tip.offsetWidth - 12;
        tip.style.left = left + "px";
        tip.style.top = "8px";
      }
      function hide() { plot.classList.remove("is-hover"); tip.hidden = true; }
      svg.addEventListener("pointermove", function (e) {
        var r = svg.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width) * vbW;
        var best = 0, dist = Infinity;
        meta.points.forEach(function (p, i) { var d = Math.abs(p.x - x); if (d < dist) { dist = d; best = i; } });
        show(best);
      });
      svg.addEventListener("pointerleave", hide);
      svg.addEventListener("focus", function () { show(at); });
      svg.addEventListener("blur", hide);
      svg.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); show(at - 1); }
        if (e.key === "ArrowRight") { e.preventDefault(); show(at + 1); }
      });
    }

    // Other marks: a floating tooltip from their data-tip.
    var float = dash.querySelector("[data-cv-float-tip]");
    dash.querySelectorAll("[data-tip]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var d = dash.getBoundingClientRect();
        float.textContent = el.getAttribute("data-tip");
        float.hidden = false;
        var left = e.clientX - d.left + 14;
        if (left + float.offsetWidth > d.width) left = e.clientX - d.left - float.offsetWidth - 14;
        float.style.left = left + "px";
        float.style.top = e.clientY - d.top + 14 + "px";
      });
      el.addEventListener("pointerleave", function () { float.hidden = true; });
    });

    // "Calls right now": durations tick while the dashboard is on screen.
    var live = dash.querySelector("[data-cv-livecalls]");
    if (live && !reduce) {
      var rows = Array.prototype.slice.call(live.querySelectorAll("li"));
      var tasks = ["Booking a cleaning", "Qualifying a loan lead", "Payment reminder", "Order support", "Confirming tomorrow's visit", "Following up a new lead", "Rescheduling an appointment"];
      var on = false, timer = null;
      function tick() {
        if (!on) return;
        rows.forEach(function (li, n) {
          var em = li.querySelector("em"), parts = em.textContent.split(":"), s = +parts[0] * 60 + +parts[1] + 1;
          if (s > 200 + n * 25) { s = 3; li.children[1].textContent = tasks[(Math.random() * tasks.length) | 0]; }
          em.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
        });
        timer = setTimeout(tick, 1000);
      }
      whenVisible(live, function (v) { on = v; clearTimeout(timer); if (v) tick(); });
    }
  }

  // Numbers count up once, keeping their own format (₹, %, commas, decimals, +).
  function countUp(el) {
    var raw = el.getAttribute("data-cv-count");
    var m = raw.match(/^([₹+]?)([\d,]*\.?\d+)(%?)$/);
    if (!m) return;
    var target = parseFloat(m[2].replace(/,/g, ""));
    var decimals = (m[2].split(".")[1] || "").length;
    var grouped = m[2].indexOf(",") !== -1;
    var t0 = performance.now(), dur = 1400;
    (function frame(now) {
      var k = Math.min(1, (now - t0) / dur);
      var v = target * (1 - Math.pow(1 - k, 3));
      var s = decimals ? v.toFixed(decimals) : String(Math.round(v));
      if (grouped) s = Number(s).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      el.textContent = m[1] + s + m[3];
      if (k < 1) requestAnimationFrame(frame);
      else el.textContent = raw;
    })(t0);
  }
})();
