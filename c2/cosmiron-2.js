/*
 * Cosmiron 2.0 — motion for the added sections only.
 * Uses the GSAP, ScrollTrigger and CustomEase builds every page already loads;
 * never touches existing sections or their Webflow interactions.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    initFilters();
    pageCurtain();
    productUi();
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // CSS "ease" — the curve the site's Webflow interactions use.
    var ease = "power1.out";
    if (window.CustomEase) {
      gsap.registerPlugin(CustomEase);
      ease = CustomEase.create("c2-ease", "0.25,0.1,0.25,1");
    }

    headingRise(ease);
    staggerIn(ease);
    parallax();
    screens(ease);
    heroKinetic(ease);
    uiSequence(ease);
    aiRail();
    sealDraw();
    cardTilt();
    uiScroll();
    lineFill();

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  });

  // Same values as the site's "Heading Scroll Into view" interaction (a-394):
  // rise 20% over 1 s, fade over 1.2 s.
  function headingRise(ease) {
    gsap.utils.toArray("[data-c2-reveal]").forEach(function (el) {
      gsap.set(el, { yPercent: 20, opacity: 0 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: function () {
          gsap.to(el, { yPercent: 0, duration: 1, ease: ease });
          gsap.to(el, { opacity: 1, duration: 1.2, ease: "none" });
        },
      });
    });
  }

  function staggerIn(ease) {
    gsap.utils.toArray("[data-c2-stagger]").forEach(function (group) {
      var items = group.children;
      if (!items.length) return;
      gsap.set(items, { y: 40, opacity: 0 });
      ScrollTrigger.create({
        trigger: group,
        start: "top 85%",
        once: true,
        onEnter: function () {
          // Keep long groups (e.g. 20 stack tags) under ~1 s of total stagger.
          gsap.to(items, { y: 0, opacity: 1, duration: 0.9, ease: ease, stagger: Math.min(0.12, 0.9 / items.length) });
        },
      });
    });
  }

  function parallax() {
    gsap.utils.toArray("[data-c2-parallax]").forEach(function (el) {
      var amount = parseFloat(el.getAttribute("data-c2-parallax")) || 60;
      gsap.fromTo(el, { y: amount }, {
        y: -amount,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
      });
    });
  }

  // Product screens lift out of their bloom as they arrive.
  function screens(ease) {
    gsap.utils.toArray(".c2-screen").forEach(function (screen) {
      var frame = screen.querySelector(".c2-frame");
      var copy = screen.querySelector(".c2-screen-copy");
      if (frame) gsap.set(frame, { y: 80, scale: 0.96, opacity: 0 });
      if (copy) gsap.set(copy, { y: 24, opacity: 0 });
      ScrollTrigger.create({
        trigger: screen,
        start: "top 85%",
        once: true,
        onEnter: function () {
          if (frame) gsap.to(frame, { y: 0, scale: 1, opacity: 1, duration: 1.1, ease: ease });
          if (copy) gsap.to(copy, { y: 0, opacity: 1, duration: 0.9, delay: 0.25, ease: ease });
        },
      });
    });
    gsap.utils.toArray("[data-c2-rise]").forEach(function (el) {
      gsap.set(el, { y: 80, scale: 0.96, opacity: 0 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          gsap.to(el, { y: 0, scale: 1, opacity: 1, duration: 1.1, ease: ease });
        },
      });
    });
  }

  // Hero headline: each line wipes up into view, and the phone settles in under it.
  function heroKinetic(ease) {
    var head = document.querySelector("[data-c2-kinetic]");
    var lines = head && head.querySelectorAll(".c2-line2");
    if (!lines || !lines.length) return;
    gsap.set(lines, { yPercent: 26, opacity: 0, clipPath: "inset(-15% 0 105% 0)" });
    gsap.to(lines, {
      yPercent: 0,
      opacity: 1,
      clipPath: "inset(-15% 0 -15% 0)",
      duration: 1.25,
      stagger: 0.14,
      delay: 0.2,
      ease: ease,
    });
    var stage = document.querySelector(".c2-hero-stage--device");
    if (stage) gsap.from(stage, { yPercent: 12, scale: 0.94, opacity: 0, duration: 1.5, delay: 0.35, ease: ease });
  }

  // The inside section plays as one phone held in place while its screens run through,
  // with the copy beside it changing as each group arrives. Screens cut instead of
  // cross-fading, which ghosts badly on dense interfaces.
  function uiSequence(ease) {
    var seq = document.querySelector("[data-c2-seq]");
    if (!seq) return;
    var frames = gsap.utils.toArray(".c2-seq-frame", seq);
    var steps = gsap.utils.toArray(".c2-seq-step", seq);
    var rail = gsap.utils.toArray(".c2-seq-rail li", seq);
    var floats = gsap.utils.toArray(".c2-seq-float", seq);
    if (frames.length < 2 || !steps.length) return;
    var stepOf = function (el) { return Number(el.getAttribute("data-step")) || 0; };
    var floatsAt = function (beat) {
      return floats.filter(function (el) { return Number(el.getAttribute("data-beat")) === beat; });
    };

    gsap.set(frames, { autoAlpha: 0 });
    gsap.set(frames[0], { autoAlpha: 1 });
    gsap.set(steps, { autoAlpha: 0, y: 26 });
    gsap.set(steps[0], { autoAlpha: 1, y: 0 });
    gsap.set(floats, { autoAlpha: 0, y: 36, rotate: 1.5 });
    if (rail.length) rail[0].classList.add("is-active");

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: seq,
        start: "top top",
        end: "+=" + frames.length * 90 + "%",
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var at = Math.min(frames.length - 1, Math.floor(self.progress * frames.length));
          var current = stepOf(frames[at]);
          rail.forEach(function (li, i) { li.classList.toggle("is-active", i === current); });
        },
      },
    });

    frames.forEach(function (frame, i) {
      var track = frame.querySelector(".c2-ui-scroll");
      var view = frame.querySelector(".c2-ui-view");
      var prev = frames[i - 1];
      // Each screen sits above the one before, so the new one wipes in over a screen
      // that is still fully drawn: no dim gap between beats, and nothing ghosts.
      frame.style.zIndex = String(i + 1);
      if (prev) {
        var leaving = floatsAt(i - 1);
        if (leaving.length) tl.to(leaving, { autoAlpha: 0, y: -24, duration: 0.12, ease: "none" });
        tl.to(frame, { autoAlpha: 1, duration: 0.16, ease: "none" });
        tl.set(prev, { autoAlpha: 0 });
        if (stepOf(frame) !== stepOf(prev)) {
          tl.to(steps[stepOf(prev)], { autoAlpha: 0, y: -26, duration: 0.2, ease: ease }, "<-0.14");
          tl.to(steps[stepOf(frame)], { autoAlpha: 1, y: 0, duration: 0.24, ease: ease }, "<0.14");
        }
      }
      var arriving = floatsAt(i);
      if (arriving.length) tl.to(arriving, { autoAlpha: 1, y: 0, rotate: 0, duration: 0.3, ease: ease }, "<0.1");
      // Then the screen itself scrolls, the way a thumb would move through it.
      tl.to(track || {}, {
        y: function () {
          if (!track || !view) return 0;
          var inset = parseFloat(getComputedStyle(view).paddingTop) || 0;
          return -Math.max(0, track.offsetHeight - (view.clientHeight - inset));
        },
        duration: 0.7,
        ease: "none",
      });
    });
  }

  // The AI features run sideways under their heading, held in place while they pass.
  // Narrow screens keep the plain stacked column.
  function aiRail() {
    var rail = document.querySelector("[data-c2-rail]");
    var view = rail && rail.parentElement;
    // Pin the wrapper inside the section: pinning a section itself reserves no room,
    // because the page's sections are a flex column.
    var section = rail && (rail.closest(".c2-ai-pin") || rail.closest("section"));
    if (!rail || !view || !section || window.innerWidth < 992) return;
    var travel = function () { return Math.max(0, rail.scrollWidth - view.clientWidth); };
    var items = rail.querySelectorAll(".c2-ai-item").length;
    if (!travel()) return;
    gsap.to(rail, {
      x: function () { return -travel(); },
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: function () { return "+=" + (travel() + window.innerHeight * 0.5); },
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // Settle on a whole feature, so a phone is never left sliced by the edge.
        snap: items > 1 ? { snapTo: 1 / (items - 1), duration: 0.25, delay: 0.04, ease: "power1.inOut" } : false,
      },
    });
  }

  // The signing seal draws itself as the section arrives: rings first, then the tick.
  function sealDraw() {
    var seal = document.querySelector("[data-c2-seal]");
    if (!seal) return;
    var strokes = gsap.utils.toArray("path, circle", seal);
    if (!strokes.length) return;
    strokes.forEach(function (el) {
      var length = el.getTotalLength ? el.getTotalLength() : 0;
      if (!length) return;
      gsap.set(el, { strokeDasharray: length, strokeDashoffset: length });
    });
    gsap.to(strokes, {
      strokeDashoffset: 0,
      ease: "none",
      stagger: 0.15,
      scrollTrigger: { trigger: seal.closest("section"), start: "top 75%", end: "top 15%", scrub: 0.8 },
    });
    gsap.fromTo(seal, { rotate: -12, opacity: 0 }, {
      rotate: 0,
      opacity: 1,
      ease: "none",
      scrollTrigger: { trigger: seal.closest("section"), start: "top 80%", end: "top 30%", scrub: 0.8 },
    });
  }

  // Cards lean a little towards the cursor. Touch and trackpad-less devices skip it.
  function cardTilt() {
    if (window.matchMedia("(hover: none)").matches) return;
    gsap.utils.toArray("[data-c2-tilt]").forEach(function (card) {
      var toY = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3.out" });
      var toX = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3.out" });
      card.addEventListener("pointermove", function (e) {
        var box = card.getBoundingClientRect();
        toY(((e.clientX - box.left) / box.width - 0.5) * 6);
        toX(((e.clientY - box.top) / box.height - 0.5) * -6);
      });
      card.addEventListener("pointerleave", function () {
        toY(0);
        toX(0);
      });
    });
  }

  // Product UI is the product's own HTML at its own width (data-w, 390 px for phones).
  // Scale each screen to its view with a transform (layout stays exact, and iOS Safari
  // doesn't re-inflate the text the way it does under zoom), and give its track the
  // scaled height so it scrolls and centres like a normal box.
  function productUi() {
    var views = Array.prototype.slice.call(document.querySelectorAll(".c2-ui-view"));
    if (!views.length) return;
    function fit(view) {
      var ui = view && view.querySelector(".c2-ui");
      var track = view && view.querySelector(".c2-ui-scroll");
      var base = ui && parseFloat(ui.getAttribute("data-w"));
      if (!base || !track || !view.clientWidth) return;
      var scale = view.clientWidth / base;
      view.style.setProperty("--c2-ui-scale", scale.toFixed(4));
      track.style.height = Math.ceil(ui.offsetHeight * scale) + "px";
    }
    views.forEach(function (view) {
      fit(view);
      // Hand-scrolled screens (reduced motion) keep the wheel away from smooth scroll.
      if (reduceMotion && view.hasAttribute("data-c2-scroll")) view.setAttribute("data-lenis-prevent", "");
    });
    // Web fonts arriving late change a screen's height, so refit then too.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { views.forEach(fit); });
    if (!window.ResizeObserver) return;
    var queued = false;
    var observer = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) { fit(entry.target.closest(".c2-ui-view")); });
      if (!window.ScrollTrigger || queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        ScrollTrigger.refresh();
      });
    });
    views.forEach(function (view) {
      observer.observe(view);
      observer.observe(view.querySelector(".c2-ui"));
    });
  }

  // Tall screens scroll inside their phone as the page scrolls past, the way someone
  // would thumb through the app. The hero's starts once the reader begins scrolling.
  function uiScroll() {
    gsap.utils.toArray(".c2-ui-view[data-c2-scroll]").forEach(function (view) {
      var track = view.querySelector(".c2-ui-scroll");
      // Screens inside the pinned sequence are driven by its own timeline.
      if (!track || view.closest("[data-c2-seq]")) return;
      var hero = view.getAttribute("data-c2-scroll") === "hero";
      gsap.fromTo(track, { y: 0 }, {
        // Stop when the screen's last row reaches the bottom of the view (below its top inset).
        y: function () {
          var inset = parseFloat(getComputedStyle(view).paddingTop) || 0;
          return -Math.max(0, track.offsetHeight - (view.clientHeight - inset));
        },
        ease: "none",
        scrollTrigger: {
          trigger: view,
          start: hero ? "top 45%" : "top 75%",
          end: hero ? "bottom top" : "bottom 25%",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    });
  }

  // Lines fill with ink as they scroll through — the site's "line fill" effect,
  // using its own SplitType build but a separate line class so the two never collide.
  function lineFill() {
    var targets = gsap.utils.toArray("[data-c2-linefill]");
    if (!targets.length || !window.SplitType) return;
    var triggers = [];
    var splits = [];
    var lastWidth = window.innerWidth;

    function build() {
      targets.forEach(function (el) {
        var split = new SplitType(el, { types: "lines", lineClass: "c2-line" });
        splits.push(split);
        split.lines.forEach(function (line) {
          var tween = gsap.fromTo(line, { "--c2-fill": "0%" }, {
            "--c2-fill": "100%",
            ease: "none",
            scrollTrigger: { trigger: line, start: "top 80%", end: "top center", scrub: 1 },
          });
          triggers.push(tween.scrollTrigger);
        });
      });
    }

    build();
    window.addEventListener("resize", function () {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      triggers.forEach(function (t) { t.kill(); });
      splits.forEach(function (s) { s.revert(); });
      triggers = [];
      splits = [];
      build();
    });
  }

  // Same exit as the site's nav links (Webflow "Page Change (out)", a-385): the night
  // curtain drops after 0.5 s over 0.4 s, and the next page loads at the site's usual 1.5 s.
  // Modified clicks, new-tab links and reduced motion navigate normally.
  function pageCurtain() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest("a[data-c2-transition]");
      if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === "_blank") return;
      var curtain = document.querySelector(".transition-out-page");
      if (reduceMotion || !curtain || !window.gsap) return;
      e.preventDefault();
      // Webflow parks the curtain with an inline translate3d(0,-101%,0); GSAP reads that
      // as a pixel y, so reset y and drive the drop purely with yPercent.
      gsap.set(curtain, { display: "block", y: 0 });
      gsap.fromTo(curtain, { yPercent: -101 }, { yPercent: 0, duration: 0.4, delay: 0.5, ease: "power3.out" });
      setTimeout(function () { window.location.href = link.href; }, 1500);
    });
  }

  // Work page filters: buttons carry data-filter, cards carry data-tags ("a|b|c").
  function initFilters() {
    var bar = document.querySelector("[data-c2-filters]");
    if (!bar) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-c2-work]"));
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      var filter = btn.getAttribute("data-filter");
      bar.querySelectorAll("button[data-filter]").forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split("|");
        card.hidden = !(filter === "all" || tags.indexOf(filter) !== -1);
      });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }
})();
