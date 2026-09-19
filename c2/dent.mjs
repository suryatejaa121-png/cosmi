/**
 * Cosmident AI: the product page. Content lives in c2/content/products/cosmident.json;
 * it shares the CosmiVoice design language (c2/cosmivoice.css) plus c2/cosmident.css.
 *
 * Screens are the product's own interface, exported as HTML with demo data by the
 * Cosmident session and embedded through h.screen(); a section whose screen hasn't been
 * exported yet simply renders without it.
 */

function head(h, { label, title, body, center = false, light = false }) {
  return `
    <div class="cv-head${center ? " cv-head--center" : ""}" data-c2-reveal>
      ${h.caption(label, light ? "light-grey" : "dark")}
      <h2 class="cv-h2${light ? " cd-ink" : ""}"><span class="c2-line2">${h.esc(title[0])}</span><span class="c2-line2"><span class="c2-spectrum c2-clone">${h.esc(title[1])}</span></span></h2>
      ${body ? `<p class="cv-lede">${h.esc(body)}</p>` : ""}
    </div>`;
}

// A product screen in a quiet app window. Empty when the screen isn't available.
function windowed(h, spec, cls = "") {
  const inner = spec && h.screen(spec);
  if (!inner) return "";
  return `<figure class="cd-window${cls ? ` ${cls}` : ""}"><div class="cd-window-bar" aria-hidden="true"><i></i><i></i><i></i><span>cosmident.cosmiron.ai</span></div>${inner}</figure>`;
}

// The viva has no screen of its own yet: a dial of its questions on the clock, drawn in
// the site's style so it never passes for the app.
function viva(h, v) {
  const dots = Array.from({ length: v.questions }, (_, i) => {
    const a = ((i / v.questions) * 360 - 90) * (Math.PI / 180);
    return `<circle cx="${(100 + 78 * Math.cos(a)).toFixed(2)}" cy="${(100 + 78 * Math.sin(a)).toFixed(2)}" r="4" style="--i:${i}"/>`;
  }).join("");
  return `<figure class="cd-viva" aria-hidden="true"><div class="cd-viva-dial"><svg viewBox="0 0 200 200" fill="none"><circle class="cd-viva-track" cx="100" cy="100" r="92"/><circle class="cd-viva-arc" cx="100" cy="100" r="92" pathLength="100"/><g class="cd-viva-dots">${dots}</g></svg><div class="cd-viva-read"><b>${h.esc(v.clock)}</b><span>${h.esc(v.questions)} questions</span></div></div><figcaption>${h.esc(v.label)}</figcaption></figure>`;
}

// The product demo: the page's own poster until someone presses play, then YouTube's
// player, so nothing loads from YouTube before that.
function demo(h, d, R) {
  const v = d.demo;
  const watch = `https://www.youtube.com/watch?v=${v.youtube}`;
  return `
  <section class="cd-demo" id="demo">
    <div class="c2-container">
      ${head(h, { ...v, center: true })}
      <div class="cd-demo-frame" data-c2-reveal>
        <a class="cd-demo-poster" href="${watch}" target="_blank" rel="noopener" data-cd-demo="${h.esc(v.youtube)}" aria-label="${h.esc(v.play)}">
          <img src="${R}c2/media/products/cosmident/${v.poster}" alt="" width="1280" height="720" loading="lazy">
          <span class="cd-demo-play" aria-hidden="true"></span>
        </a>
      </div>
      <p class="cd-demo-links"><a class="cv-link" href="${watch}" target="_blank" rel="noopener">${h.esc(v.youtubeLink)} <span aria-hidden="true">↗</span></a><a class="cv-link" href="${h.esc(d.url)}" target="_blank" rel="noopener">${h.esc(v.tryLink)} <span aria-hidden="true">↗</span></a></p>
    </div>
  </section>`;
}

export function dentPage(d, R, h) {
  const mark = `${R}c2/media/products/cosmident/${d.mark.src}`;
  const s = d.screens || {};
  // Until the product's screens are exported, sections lay out as clean text only.
  // Each step's screen appears twice: inline for phones, in the sticky stage for wide
  // screens. Rendered separately, so every copy has its own ids.
  const sitShot = (st, i) => windowed(h, (s.sitting || [])[i], "cd-window--crop") || (st.viva ? viva(h, st.viva) : "");
  const sitShots = d.sitting.steps.map(sitShot);
  const hasSit = sitShots.some((shot) => shot.includes("cd-window"));
  const auditShot = windowed(h, s.audit, "cd-window--tall");
  const humanShot = windowed(h, s.human, "cd-window--tall");
  return `
<div class="c2 cv cd cv-page" style="--c2-tint:#7C3AED">
  <section class="cv-hero cd-hero" aria-labelledby="cd-title">
    <canvas class="cv-field" data-cv-field aria-hidden="true"></canvas>
    <div class="c2-container cd-hero-inner">
      <figure class="cd-mark" aria-hidden="true"><img src="${mark}" alt="" width="485" height="514" fetchpriority="high"><span class="cd-orbit"><i></i></span></figure>
      <div class="cv-eyebrow" data-c2-reveal><span class="cv-pulse cd-pulse" aria-hidden="true"></span>${h.esc(d.hero.eyebrow)}</div>
      <h1 id="cd-title" class="cv-h1 cd-h1" data-c2-kinetic><span class="c2-line2">${h.esc(d.hero.title[0])}</span><span class="c2-line2"><span class="c2-spectrum c2-clone">${h.esc(d.hero.title[1])}</span></span></h1>
      <p class="cv-lede cd-lede" data-c2-reveal>${h.esc(d.hero.lede)}</p>
      <div class="cv-actions cd-actions" data-c2-reveal>${h.ctaButton(h.contact(R), d.hero.primary)}${d.demo ? `<a class="cd-watch" href="#demo" data-cd-watch><span class="cd-watch-icon" aria-hidden="true"></span>${h.esc(d.hero.watch)}</a>` : ""}<a class="cv-link" href="${h.esc(d.url)}" target="_blank" rel="noopener">${h.esc(d.hero.secondary)} <span aria-hidden="true">↗</span></a></div>
    </div>
    ${s.hero ? `<div class="c2-container cd-hero-shot" data-c2-parallax="30">${windowed(h, s.hero, "cd-window--hero")}</div>` : ""}
    <dl class="c2-container cd-facts" data-c2-stagger>${d.facts.map(([n, t]) => `<div><dt>${h.esc(n)}</dt><dd>${h.esc(t)}</dd></div>`).join("")}</dl>
  </section>

  <section class="cd-gap">
    <div class="c2-container">
      ${head(h, { ...d.gap, center: true, light: true })}
      <ol class="cd-gap-cards" role="list" data-c2-stagger>${d.gap.cards
        .map((c, i) => `<li><span class="cd-num">${String(i + 1).padStart(2, "0")}</span><h3>${h.esc(c.title)}</h3><p>${h.esc(c.body)}</p></li>`)
        .join("")}</ol>
    </div>
  </section>

  <section class="cd-sitting">
    <div class="c2-container">${head(h, d.sitting)}</div>
    <div class="c2-container cd-sit${hasSit ? "" : " cd-sit--plain"}"${hasSit ? " data-cd-sit" : ""}>
      <ol class="cd-sit-steps" role="list">${d.sitting.steps
        .map((st, i) => `<li class="cd-sit-step${i ? "" : " is-active"}" data-step="${i}"><span class="cd-num">${String(i + 1).padStart(2, "0")}</span><div><h3>${h.esc(st.title)}</h3><p>${h.esc(st.body)}</p></div>${sitShots[i] ? `<div class="cd-sit-inline">${sitShots[i]}</div>` : ""}</li>`)
        .join("")}</ol>
      ${hasSit ? `<div class="cd-sit-stage" aria-hidden="true">${d.sitting.steps.map((st, i) => `<div class="cd-sit-panel${i ? "" : " is-active"}" data-step="${i}">${sitShot(st, i)}</div>`).join("")}</div>` : ""}
    </div>
  </section>

${d.demo ? demo(h, d, R) : ""}

  <section class="cd-audit">
    <div class="c2-container cd-split${auditShot ? "" : " cd-split--solo"}">
      <div class="cd-split-copy">
        ${head(h, d.audit)}
        <ul class="cd-points" role="list" data-c2-stagger>${d.audit.points.map((t) => `<li><span class="cd-tick" aria-hidden="true"></span>${h.esc(t)}</li>`).join("")}</ul>
      </div>
      ${auditShot ? `<div class="cd-split-shot" data-c2-reveal>${auditShot}</div>` : ""}
    </div>
  </section>

  <section class="cd-human">
    <div class="c2-container cd-split cd-split--flip${humanShot ? "" : " cd-split--solo"}">
      <div class="cd-split-copy">${head(h, d.human)}</div>
      ${humanShot ? `<div class="cd-split-shot" data-c2-reveal>${humanShot}</div>` : ""}
    </div>
  </section>

  <section class="cd-academy">
    <div class="c2-container">
      ${head(h, { ...d.academy, center: true })}
      <ul class="cd-tiles" role="list" data-c2-stagger>${d.academy.items
        .map(([t, b], i) => `<li style="--i:${i}"><span class="cd-tile-n">${String(i + 1).padStart(2, "0")}</span><h3>${h.esc(t)}</h3><p>${h.esc(b)}</p></li>`)
        .join("")}</ul>
    </div>
  </section>

  <section class="cd-how">
    <div class="c2-container">
      ${head(h, { ...d.how, center: true })}
      <ol class="cd-line" role="list" data-c2-stagger>${d.how.steps.map((t, i) => `<li><span class="cd-dot" aria-hidden="true"></span><span class="cd-num">${String(i + 1).padStart(2, "0")}</span><p>${h.esc(t)}</p></li>`).join("")}</ol>
      <p class="cv-note cd-disclaimer">${h.esc(d.disclaimer)}</p>
    </div>
  </section>
${h.closingSection(R, {
  label: d.close.label,
  lineA: d.close.title[0],
  lineB: d.close.title[1],
  primary: { href: h.contact(R), label: d.close.primary },
  secondary: { href: `${R}products/index.html`, label: d.close.secondary },
  inner: `
    <div class="c2-container">
      <p class="cv-close-body" data-c2-reveal>${h.esc(d.close.body)}</p>
    </div>`,
})}
</div>`;
}
