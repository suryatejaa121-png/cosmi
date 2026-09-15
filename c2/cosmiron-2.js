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

  // Product UI is the product's own HTML at its own width (data-w, 390 px for phones).
  // Zoom each screen to its view so text stays sharp and the layout stays exact.
  function productUi() {
    var views = Array.prototype.slice.call(document.querySelectorAll(".c2-ui-view"));
    if (!views.length) return;
    function fit(view) {
      var ui = view.querySelector(".c2-ui");
      var base = ui && parseFloat(ui.getAttribute("data-w"));
      if (!base || !view.clientWidth) return;
      view.style.setProperty("--c2-ui-zoom", (view.clientWidth / base).toFixed(4));
    }
    views.forEach(function (view) {
      fit(view);
      // Hand-scrolled screens (reduced motion) keep the wheel away from smooth scroll.
      if (reduceMotion && view.hasAttribute("data-c2-scroll")) view.setAttribute("data-lenis-prevent", "");
    });
    if (!window.ResizeObserver) return;
    var queued = false;
    var observer = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) { fit(entry.target); });
      if (!window.ScrollTrigger || queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        ScrollTrigger.refresh();
      });
    });
    views.forEach(function (view) { observer.observe(view); });
  }

  // Tall screens scroll inside their phone as the page scrolls past, the way someone
  // would thumb through the app. The hero's starts once the reader begins scrolling.
  function uiScroll() {
    gsap.utils.toArray(".c2-ui-view[data-c2-scroll]").forEach(function (view) {
      var track = view.querySelector(".c2-ui-scroll");
      if (!track) return;
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
