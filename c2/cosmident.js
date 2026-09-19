/*
 * Cosmident AI: the "Inside a sitting" stepper. On wide screens the app window beside
 * the steps shows the step in the middle of the screen; on phones each step carries
 * its own screen inline.
 */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  // The hero's app window rises from a tilt to flat as the page starts to scroll.
  function heroTilt() {
    var win = document.querySelector(".cd-window--hero");
    if (!win || !window.gsap || !window.ScrollTrigger) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(win, { rotateX: 16, scale: 0.92, opacity: 0.6 }, {
      rotateX: 0,
      scale: 1,
      opacity: 1,
      ease: "none",
      scrollTrigger: { trigger: win, start: "top bottom", end: "top 30%", scrub: 0.6 },
    });
  }

  // The patient avatar plays only while it's on screen; reduced motion keeps its still frame.
  function avatars() {
    var videos = Array.prototype.slice.call(document.querySelectorAll("video[data-cd-avatar]"));
    if (!videos.length || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.cdVisible = e.isIntersecting;
        syncAvatar(e.target);
      });
    }, { rootMargin: "120px 0px" });
    videos.forEach(function (v) { io.observe(v); });
  }
  // A stepper panel that isn't the current step is on screen but hidden, so it stays paused.
  function syncAvatar(v) {
    var on = v.cdVisible && !v.closest(".cd-sit-panel:not(.is-active)");
    if (on) {
      if (v.preload !== "auto") v.preload = "auto";
      var play = v.play();
      if (play && play.catch) play.catch(function () {});
    } else if (!v.paused) {
      v.pause();
    }
  }

  // The demo loads YouTube's player only when someone presses play. "Watch the demo" in
  // the hero glides down to it and starts it.
  function demo() {
    var poster = document.querySelector("[data-cd-demo]");
    if (!poster) return;
    var frame = poster.parentNode;
    function play() {
      if (!poster.parentNode) return;
      var video = document.createElement("iframe");
      video.src = "https://www.youtube-nocookie.com/embed/" + poster.getAttribute("data-cd-demo") + "?autoplay=1&rel=0&playsinline=1";
      video.title = poster.getAttribute("aria-label");
      video.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      video.allowFullscreen = true;
      frame.replaceChild(video, poster);
      video.focus({ preventScroll: true });
    }
    poster.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
      e.preventDefault();
      play();
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-cd-watch]"), function (link) {
      link.addEventListener("click", function (e) {
        // Webflow smooth-scrolls every #anchor link too; keep it from fighting this glide.
        e.preventDefault();
        e.stopPropagation();
        // Measure where the player rests, without its fade-in offset.
        var r = frame.getBoundingClientRect();
        var shift = window.DOMMatrixReadOnly ? new DOMMatrixReadOnly(getComputedStyle(frame).transform).m42 : 0;
        var y = r.top - shift + window.pageYOffset - Math.max(80, (window.innerHeight - r.height) / 2);
        if (window.lenis) window.lenis.scrollTo(y, { duration: 1.4 });
        else window.scrollTo({ top: y, behavior: "smooth" });
        play();
      });
    });
  }

  ready(function () {
    heroTilt();
    avatars();
    demo();
    var root = document.querySelector("[data-cd-sit]");
    if (!root) return;
    var steps = Array.prototype.slice.call(root.querySelectorAll(".cd-sit-step"));
    var panels = Array.prototype.slice.call(root.querySelectorAll(".cd-sit-panel"));
    var current = -1;
    function activate(i) {
      if (i === current) return;
      current = i;
      steps.forEach(function (s, n) { s.classList.toggle("is-active", n === i); });
      panels.forEach(function (p, n) {
        p.classList.toggle("is-active", n === i);
        Array.prototype.forEach.call(p.querySelectorAll("video[data-cd-avatar]"), syncAvatar);
      });
    }
    activate(0);
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && window.innerWidth >= 768) activate(steps.indexOf(e.target));
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (s) { io.observe(s); });
  });
})();
