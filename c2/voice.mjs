/**
 * CosmiVoice: markup for the flagship product page, the homepage band and the
 * products page. Content lives in c2/content/products/cosmivoice.json; styles in
 * c2/cosmivoice.css and motion/interaction in c2/cosmivoice.js.
 *
 * Every demo here is a simulation (CosmiVoice is in development) and says so on the page.
 * Charts are drawn from the JSON at build time, so they read without JavaScript.
 */

/* ---------------- small helpers ---------------- */

const json = (data) => JSON.stringify(data).replace(/</g, "\\u003c");
const pct = (value, max) => Math.max(0, Math.min(100, (value / max) * 100));
const fmt = (n) => n.toLocaleString("en-IN");

/* ---------------- charts (static SVG, enhanced by JS) ---------------- */

function lineChart(a, h) {
  const W = 640, H = 250, L = 44, R = 78, T = 14, B = 30;
  const max = Math.ceil(Math.max(...a.inbound, ...a.outbound) / 200) * 200;
  const x = (i) => L + (i * (W - L - R)) / (a.days.length - 1);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const path = (s) => s.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = (s) => `${path(s)} L${x(s.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const grid = [];
  for (let v = 0; v <= max; v += max / 4) {
    grid.push(`<line class="cv-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"></line><text class="cv-tick" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`);
  }
  const ticks = a.days.map((d, i) => (i % 3 === 0 || i === a.days.length - 1 ? `<text class="cv-tick" x="${x(i)}" y="${H - 8}" text-anchor="middle">${h.esc(d)}</text>` : "")).join("");
  const last = a.days.length - 1;
  const points = a.days.map((d, i) => ({ d, i: a.inbound[i], o: a.outbound[i], x: +x(i).toFixed(1) }));
  return `
          <svg class="cv-line" viewBox="0 0 ${W} ${H}" role="img" aria-label="Calls per day for 14 days, inbound and outbound" data-cv-line='${json({ points, top: T, bottom: H - B, left: L, right: W - R })}'>
            ${grid.join("")}${ticks}
            <path class="cv-area cv-s1-fill" d="${area(a.inbound)}"></path>
            <path class="cv-stroke cv-s1" d="${path(a.inbound)}" pathLength="1"></path>
            <path class="cv-stroke cv-s2" d="${path(a.outbound)}" pathLength="1"></path>
            <circle class="cv-end cv-s1-dot" cx="${x(last)}" cy="${y(a.inbound[last])}" r="4.5"></circle>
            <circle class="cv-end cv-s2-dot" cx="${x(last)}" cy="${y(a.outbound[last])}" r="4.5"></circle>
            <text class="cv-direct" x="${x(last) + 10}" y="${y(a.inbound[last]) + 4}">Inbound</text>
            <text class="cv-direct" x="${x(last) + 10}" y="${y(a.outbound[last]) + 4}">Outbound</text>
            <line class="cv-cross" x1="0" x2="0" y1="${T}" y2="${H - B}"></line>
          </svg>`;
}

function stackBar(items, h) {
  const total = items.reduce((s, [, v]) => s + v, 0);
  return `
          <div class="cv-stack" role="img" aria-label="${h.esc(items.map(([n, v]) => `${n} ${fmt(v)}`).join(", "))}">${items
            .map(([n, v], i) => `<span class="cv-seg cv-c${i + 1}" style="flex-grow:${v}" data-tip="${h.esc(`${n} · ${fmt(v)} calls · ${((v / total) * 100).toFixed(1)}%`)}"></span>`)
            .join("")}</div>
          <ul class="cv-legend" role="list">${items
            .map(([n, v], i) => `<li><i class="cv-c${i + 1}"></i><span>${h.esc(n)}</span><b>${fmt(v)}</b></li>`)
            .join("")}</ul>`;
}

function sentimentBar(items, h) {
  const byName = Object.fromEntries(items);
  const order = [["Negative", "neg"], ["Neutral", "neu"], ["Positive", "pos"]];
  return `
          <div class="cv-sent" role="img" aria-label="${h.esc(items.map(([n, v]) => `${n} ${v}%`).join(", "))}">${order
            .map(([n, k]) => `<span class="cv-sent-${k}" style="flex-grow:${byName[n]}" data-tip="${h.esc(`${n} · ${byName[n]}% of calls`)}"></span>`)
            .join("")}</div>
          <div class="cv-sent-scale">${order.map(([n]) => `<span><b>${byName[n]}%</b> ${h.esc(n.toLowerCase())}</span>`).join("")}</div>`;
}

/* ---------------- shared pieces ---------------- */

function head(h, { label, title, body, note, dark = true, id, center = false }) {
  return `
    <div class="cv-head${center ? " cv-head--center" : ""}"${id ? ` id="${id}"` : ""} data-c2-reveal>
      ${h.caption(label, dark ? "dark" : "light-grey")}
      <h2 class="cv-h2"><span class="c2-line2">${h.esc(title[0])}</span><span class="c2-line2"><span class="c2-spectrum c2-clone">${h.esc(title[1])}</span></span></h2>
      ${body ? `<p class="cv-lede">${h.esc(body)}</p>` : ""}
      ${note ? `<p class="cv-note">${h.esc(note)}</p>` : ""}
    </div>`;
}

const statusChip = (h, status) => `<span class="cv-status${/live/i.test(status) ? " is-live" : ""}">${h.esc(status)}</span>`;

function wave(label = "") {
  return `<canvas class="cv-wave" data-cv-wave${label ? ` aria-label="${label}"` : ' aria-hidden="true"'}></canvas>`;
}

/* ---------------- the voice stage: hero and homepage band ---------------- */

// A centred composition instead of text beside an image: the headline wraps above and
// below the glowing voice, a waveform runs through it edge to edge, and live exchanges in
// different languages appear either side. The first exchange is rendered here so the
// stage reads without JavaScript; cosmivoice.js cycles through the rest.
function stageBubble(ex, line, h) {
  return `
          <div class="cv-bub cv-bub--${line.who}" data-cv-bub="${line.who}">
            <span class="cv-bub-who">${line.who === "ai" ? `${h.esc(ex.agent)} · AI` : "Caller"}</span>
            <p class="cv-bub-text" lang="${h.esc(ex.code)}">${h.esc(line.text)}</p>
          </div>`;
}

function voiceStage(v, R, h, { tag = "h1", id, eyebrow, title, lede, actions, compact = false }) {
  const ex = v.hero.exchanges;
  const first = ex[0];
  const line = (who) => first.lines.find((l) => l.who === who);
  const img = `${R}c2/media/products/cosmivoice/`;
  const face = compact
    ? `<img src="${img}${v.image.small}" alt="" width="640" height="640" loading="lazy">`
    : `<img src="${img}${v.image.src}" alt="" width="1254" height="1254" fetchpriority="high">`;
  return `
    <div class="cv-vstage${compact ? " cv-vstage--compact" : ""}" data-cv-stage>
      <script type="application/json" data-cv-stage-data>${json(ex)}</script>
      <div class="cv-eyebrow" data-c2-reveal><span class="cv-pulse" aria-hidden="true"></span>${h.esc(eyebrow)}</div>
      <div class="cv-vstage-head">
        <${tag} id="${id}" class="cv-vstage-title" data-c2-kinetic><span class="c2-line2 cv-vstage-a">${h.esc(title[0])}</span><span class="c2-line2 cv-vstage-b"><span class="c2-spectrum c2-clone">${h.esc(title[1])}</span></span></${tag}>
        <div class="cv-vstage-scene" aria-hidden="true">
          <div class="cv-ribbon" data-cv-speaking="idle">${wave()}</div>
          <figure class="cv-face">${face}<span class="cv-rings"><i></i><i></i><i></i></span></figure>
        </div>
        <p class="cv-lede cv-vstage-lede" data-c2-reveal>${h.esc(lede)}</p>
        <div class="cv-actions cv-vstage-actions" data-c2-reveal>${actions}</div>
        <div class="cv-bubs" aria-hidden="true">${stageBubble(first, line("caller"), h)}${stageBubble(first, line("ai"), h)}
          <div class="cv-vstage-sig"><span class="cv-chip"><i>Detected</i><b data-sig="lang">${h.esc(first.lang)}</b></span><span class="cv-chip cv-chip--done"><i>Done</i><b data-sig="action">${h.esc(first.action)}</b></span></div>
        </div>
      </div>
      <p class="cv-sr">Example calls in ${ex.map((e) => h.esc(e.lang)).join(", ")}.</p>
    </div>`;
}

function heroSection(v, R, h) {
  return `
  <section class="cv-hero cv-hero--stage" aria-labelledby="cv-title">
    <canvas class="cv-field" data-cv-field aria-hidden="true"></canvas>
    ${voiceStage(v, R, h, {
      tag: "h1",
      id: "cv-title",
      eyebrow: v.hero.eyebrow,
      title: v.hero.title,
      lede: v.hero.lede,
      actions: `${h.ctaButton(h.contact(R), v.hero.primary)}<a class="cv-link" href="#cv-demo">${h.esc(v.hero.secondary)} <span aria-hidden="true">→</span></a>`,
    })}
    <ol class="cv-flow c2-container" role="list" aria-label="How a call travels">${v.hero.flow
      .map((f, i) => `<li${i === 2 ? ' class="is-core"' : ""}><span>${h.esc(f)}</span></li>`)
      .join("")}</ol>
    <p class="cv-note cv-note--hero c2-container">${h.esc(v.hero.note)}</p>
  </section>`;
}

/* ---------------- languages ---------------- */

function languagesSection(v, h) {
  const L = v.languages;
  const row = (words) => words.map((w) => `<span>${h.esc(w)}</span>`).join("");
  const sw = L.switch;
  return `
  <section class="cv-lang" id="cv-languages">
    <div class="cv-wall" aria-hidden="true">${L.wall
      .map((w, i) => `<div class="cv-wall-row${i % 2 ? " is-rev" : ""}"><div class="cv-wall-track">${row(w)}${row(w)}</div></div>`)
      .join("")}</div>
    <div class="c2-container cv-lang-inner">
      ${head(h, { ...L, center: true })}
      <div class="cv-lang-rig" data-cv-lang>
        <div class="cv-lang-tabs" role="tablist" aria-label="Languages">${L.items
          .map(
            (l, i) =>
              `<button type="button" role="tab" id="cv-lang-tab-${l.id}" data-name="${h.esc(l.name)}" aria-controls="cv-lang-${l.id}" aria-selected="${i ? "false" : "true"}" tabindex="${i ? "-1" : "0"}"><b lang="${h.esc(l.code)}">${h.esc(l.native)}</b>${l.mix ? `<span>${h.esc(l.mix)}</span>` : l.native !== l.name ? `<span>${h.esc(l.name)}</span>` : ""}</button>`,
          )
          .join("")}</div>
        <div class="cv-lang-call">
          <div class="cv-console-bar"><span class="cv-rec" aria-hidden="true"></span><span>Maya · AI receptionist</span><span class="cv-console-biz">SmileCare</span><span class="cv-lang-now" data-cv-lang-now>${h.esc(L.items[0].name)}</span></div>
          <div class="cv-lang-panels">${L.items
            .map(
              (l, i) => `
            <div class="cv-lang-panel" role="tabpanel" id="cv-lang-${l.id}" aria-labelledby="cv-lang-tab-${l.id}"${i ? " hidden" : ""}>
              <div class="cv-lang-line cv-lang-line--caller"><span class="cv-who">Caller</span><p lang="${h.esc(l.code)}">${h.esc(l.caller)}</p></div>
              <div class="cv-lang-line cv-lang-line--ai"><span class="cv-who">Maya · AI</span><p lang="${h.esc(l.code)}">${h.esc(l.ai)}</p></div>
            </div>`,
            )
            .join("")}
          </div>
        </div>
      </div>
      <div class="cv-switchcall" data-c2-reveal>
        <span class="cv-sys">${h.esc(sw.label)}</span>
        <p class="cv-switch-line"><span class="cv-who">Caller</span>${sw.caller
          .map((c, i) => `<span lang="${h.esc(c.code)}"${i ? ' class="is-switch"' : ""}>${h.esc(c.text)}</span>`)
          .join(" ")}</p>
        <span class="cv-detect"><i aria-hidden="true"></i>Detected ${h.esc(sw.from)} → ${h.esc(sw.to)} · answering in ${h.esc(sw.to)}</span>
        <p class="cv-switch-line cv-switch-line--ai"><span class="cv-who">Maya · AI</span><span lang="${h.esc(sw.ai.code)}">${h.esc(sw.ai.text)}</span></p>
        <p class="cv-lang-gloss">${h.esc(sw.gloss)}</p>
      </div>
      <p class="cv-note cv-lang-note">${h.esc(L.note)}</p>
    </div>
  </section>`;
}

/* ---------------- story: one call, five scenes on a reel ---------------- */

function storyPanel(step, h) {
  const c = step.console;
  switch (c.kind) {
    case "ring":
      return `<div class="cv-ring"><span class="cv-ring-icon" aria-hidden="true"><span class="cv-ring-waves"><i></i><i></i><i></i></span><svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"></path></svg></span><b>${h.esc(c.caller)}</b><span class="cv-mono">${h.esc(c.number)} · ${h.esc(c.time)}</span><span class="cv-done">${h.esc(c.tag)}</span></div>`;
    case "understand":
      return `<div class="cv-understand"><p class="cv-quote">${c.transcript
        .split(" ")
        .map((w) => `<span>${h.esc(w)}</span>`)
        .join(" ")}</p><ul class="cv-meters" role="list">${c.meters
        .map(([k, val, n]) => `<li><span class="cv-meter-k">${h.esc(k)}</span><span class="cv-meter-v">${h.esc(val)}</span><span class="cv-meter"><i style="--w:${n}%"></i></span></li>`)
        .join("")}</ul></div>`;
    case "think":
      return `<div class="cv-think">${c.cards.map(([k, t]) => `<div class="cv-ctx"><span class="cv-sys">${h.esc(k)}</span><p>${h.esc(t)}</p></div>`).join("")}</div>`;
    case "act":
      return `<ul class="cv-acts" role="list">${c.items.map(([k, t]) => `<li><span class="cv-sys">${h.esc(k)}</span><span class="cv-done">${h.esc(t)}</span></li>`).join("")}</ul>`;
    case "follow":
      return `<div class="cv-follow"><div class="cv-summary"><span class="cv-sys">Call summary</span><p>${h.esc(c.summary)}</p></div><div class="cv-wa"><span class="cv-wa-head">WhatsApp</span><p>${h.esc(c.message)}</p><span class="cv-wa-meta">Sent · just now</span></div></div>`;
    default:
      return "";
  }
}

function storySection(v, h) {
  const s = v.story;
  const stamps = ["00:01", "00:05", "00:08", "00:12", "Ended · 00:47"];
  return `
  <section class="cv-story" id="cv-how">
    <div class="c2-container">${head(h, s)}</div>
    <div class="cv-reel" data-cv-reel>
      <div class="cv-reel-track">${s.steps
        .map(
          (st, i) => `
        <article class="cv-scene${i ? "" : " is-active"}" data-step="${i}">
          <div class="cv-scene-copy"><span class="cv-step-n">${h.esc(st.n)}</span><h3>${h.esc(st.title)}</h3><p>${h.esc(st.body)}</p></div>
          <div class="cv-scene-card"><div class="cv-console-bar"><span class="cv-rec" aria-hidden="true"></span><span>${i === s.steps.length - 1 ? "After the call" : "Call in progress"}</span><span class="cv-console-biz">SmileCare Dental</span><span class="cv-timer">${stamps[i] || ""}</span></div><div class="cv-scene-body">${storyPanel(st, h)}</div></div>
        </article>`,
        )
        .join("")}
      </div>
    </div>
  </section>`;
}

/* ---------------- inbound / outbound ---------------- */

function modesSection(v, h) {
  const m = v.modes;
  return `
  <section class="cv-modes">
    <div class="c2-container">
      ${head(h, m)}
      <div class="cv-switch" role="tablist" aria-label="Call direction" data-cv-modes>${m.items
        .map((it, i) => `<button type="button" role="tab" id="cv-tab-${it.id}" aria-controls="cv-mode-${it.id}" aria-selected="${i ? "false" : "true"}" tabindex="${i ? "-1" : "0"}">${h.esc(it.name)}</button>`)
        .join("")}<span class="cv-switch-thumb" aria-hidden="true"></span></div>
      ${m.items
        .map(
          (it, i) => `
      <div class="cv-mode" role="tabpanel" id="cv-mode-${it.id}" aria-labelledby="cv-tab-${it.id}" data-mode="${it.id}"${i ? " hidden" : ""}>
        <div class="cv-mode-copy"><h3 class="cv-h3">${h.esc(it.title)}</h3><p>${h.esc(it.body)}</p></div>
        <ol class="cv-track" role="list">${it.flow.map((f, n) => `<li style="--n:${n}"><span class="cv-node" aria-hidden="true"></span><span>${h.esc(f)}</span></li>`).join("")}<span class="cv-track-pulse" aria-hidden="true"></span></ol>
        <ul class="cv-queue" role="list">${it.queue
          .map(([who, why, out], n) => `<li style="--n:${n}"><span class="cv-q-who">${h.esc(who)}</span><span class="cv-q-why">${h.esc(why)}</span><span class="cv-q-out">${h.esc(out)}</span></li>`)
          .join("")}</ul>
      </div>`,
        )
        .join("")}
    </div>
  </section>`;
}

/* ---------------- AI employees: one voice at a time ---------------- */

// A single ring of sound bars with the employee's name at its centre, one line of how
// they sound beneath, and a slim row of names to switch between them. The ring takes
// the employee's colour; cosmivoice.js draws it and moves through the team.
function teamSection(v, R, h) {
  const e = v.employees;
  const on = (i) => (i ? "" : " is-on");
  return `
  <section class="cv-team">
    <div class="c2-container">
      ${head(h, { ...e, center: true })}
      <div class="cv-crew" data-cv-crew>
        <script type="application/json" data-cv-crew-hues>${json(e.items.map((p) => p.hue))}</script>
        <div class="cv-crew-orb">
          <canvas data-cv-orb aria-hidden="true"></canvas>
          <div class="cv-crew-ids">${e.items
            .map((p, i) => `<div class="cv-crew-id${on(i)}" data-i="${i}" style="--hue:${h.esc(p.hue)}"><span>${h.esc(p.role)}</span><b>${h.esc(p.name)}</b></div>`)
            .join("")}</div>
        </div>
        <div class="cv-crew-lines" aria-live="polite">${e.items
          .map((p, i) => `<p class="cv-crew-line${on(i)}" data-i="${i}">“${h.esc(p.line)}”</p>`)
          .join("")}</div>
        <div class="cv-crew-pick" role="group" aria-label="AI employees">${e.items
          .map((p, i) => `<button type="button" data-i="${i}" aria-pressed="${i ? "false" : "true"}" style="--hue:${h.esc(p.hue)}"><i aria-hidden="true"></i>${h.esc(p.name)}</button>`)
          .join("")}<a class="cv-crew-add" href="${h.contact(R)}"><i aria-hidden="true">+</i>${h.esc(e.hire.title)}</a></div>
      </div>
      <p class="cv-note cv-crew-note">${h.esc(e.status)} · CosmiVoice is in development.</p>
    </div>
  </section>`;
}

/* ---------------- industries ---------------- */

function industriesSection(v, h) {
  const d = v.industries;
  return `
  <section class="cv-ind">
    <div class="c2-container">
      ${head(h, d)}
      <div class="cv-ind-rig" data-cv-industries>
        <div class="cv-ind-tabs" role="tablist" aria-label="Industries">${d.items
          .map((it, i) => `<button type="button" role="tab" id="cv-ind-tab-${it.id}" aria-controls="cv-ind-${it.id}" aria-selected="${i ? "false" : "true"}" tabindex="${i ? "-1" : "0"}" data-hue="${i}">${h.esc(it.name)}</button>`)
          .join("")}</div>
        <div class="cv-ind-stage">
          <div class="cv-ind-word" aria-hidden="true" data-cv-word>${h.esc(d.items[0].name)}</div>
          ${d.items
            .map(
              (it, i) => `
          <div class="cv-ind-panel" role="tabpanel" id="cv-ind-${it.id}" aria-labelledby="cv-ind-tab-${it.id}"${i ? " hidden" : ""}>
            <div class="cv-ind-agent" data-cv-speaking="ai"><span class="cv-sys">${h.esc(it.agent)}</span>${wave()}</div>
            <p class="cv-ind-greet">“${h.esc(it.greeting)}”</p>
            <ul role="list" class="cv-chips">${it.systems.map((t) => `<li>${h.esc(t)}</li>`).join("")}</ul>
            <p class="cv-ind-out"><span class="cv-done">${h.esc(it.outcome)}</span></p>
          </div>`,
            )
            .join("")}
        </div>
      </div>
    </div>
  </section>`;
}

/* ---------------- the pipeline ---------------- */

// Each stage gets its own small instrument. Hidden-until-active states only apply inside
// the sticky panel on wide screens, so the inline (phone) copies read at rest.
function readout(st, h) {
  const tick = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
  switch (st.readout) {
    case "wave":
      return `<div class="cv-ro-voice" data-cv-speaking="caller">${wave()}<div class="cv-ro-voice-meta"><span class="cv-rec" aria-hidden="true"></span><span>${h.esc(st.detail)}</span><b>00:03.2</b></div></div>`;
    case "text": {
      const words = st.detail.replace(/^"|"$/g, "").split(" ");
      const cls = st.name === "AI response" ? "cv-ro-say cv-ro-say--ai" : "cv-ro-say";
      const extra = st.name === "AI response" ? `<div class="cv-ro-reply" data-cv-speaking="ai">${wave()}</div>` : "";
      return `<p class="${cls}">${words.map((w, i) => `<span class="cv-rw" style="--i:${i}">${h.esc(w)}</span>`).join(" ")}</p>${extra}`;
    }
    case "bars": {
      const [top, ...rest] = st.bars;
      return `<div class="cv-ro-intent"><span class="cv-ro-big">${h.esc(top[0])}</span><b class="cv-ro-pct">${top[1]}<small>%</small></b></div><ul class="cv-ro-gauges" role="list">${st.bars
        .map(([k, n], i) => `<li style="--w:${n}%;--i:${i}"><span>${h.esc(k)}</span><i></i><b>${n}%</b></li>`)
        .join("")}</ul>`;
    }
    case "list":
      return `<div class="cv-ro-cards">${st.items.map((t, i) => `<div class="cv-ro-card" style="--i:${i}"><span class="cv-sys">${["Caller", "Knowledge", "Calendar"][i] || "Context"}</span><p>${h.esc(t)}</p></div>`).join("")}</div>`;
    case "checks":
      return `<p class="cv-ro-k">${h.esc(st.detail)}</p><ul class="cv-ro-checks" role="list">${st.items
        .map((t, i) => `<li style="--i:${i}"><span class="cv-ro-tick">${tick}</span>${h.esc(t)}</li>`)
        .join("")}</ul>`;
    case "code":
      return `<div class="cv-ro-term"><div class="cv-ro-term-bar"><i></i><i></i><i></i><span>actions</span></div><pre><code><span class="cv-ro-req">→ ${h.esc(st.detail)}</span>
<span class="cv-ro-res">← 200 OK · slot held · 70 ms</span><span class="cv-ro-caret"></span></code></pre></div>`;
    case "outcome":
      return `<div class="cv-ro-done"><svg class="cv-ro-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" pathLength="1"></circle><path d="M40 61l14 14 27-28" pathLength="1"></path></svg><div><span class="cv-ro-big">Booked</span><div class="cv-ro-chips"><span>Sentiment positive</span><span>No human needed</span></div></div></div>`;
    default:
      return "";
  }
}

// The systems stage shows three tiles lighting up instead of a list.
function systemsReadout(st, h) {
  const icons = [
    '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 10h18M8 3v4M16 3v4"></path>',
    '<circle cx="12" cy="8" r="4"></circle><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"></path>',
    '<path d="M4 20l1.5-4.5A8 8 0 1 1 8.5 19z"></path>',
  ];
  return `<div class="cv-ro-sys">${st.items
    .map((t, i) => {
      const [name, what] = t.split(": ");
      return `<div class="cv-ro-tile" style="--i:${i}"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[i] || icons[0]}</svg><b>${h.esc(name)}</b><span>${h.esc(what || "")}</span></div>`;
    })
    .join("")}</div>`;
}

const stageView = (st, h) => (st.name.startsWith("CRM") ? systemsReadout(st, h) : readout(st, h));

function pipelineSection(v, h) {
  const p = v.pipeline;
  return `
  <section class="cv-pipe">
    <div class="c2-container">${head(h, p)}</div>
    <div class="cv-pipe-pin" data-cv-pipe>
      <div class="c2-container cv-pipe-inner">
        <ol class="cv-spine" role="list">${p.stages
          .map((st, i) => `<li class="cv-stage${i ? "" : " is-active"}" data-stage="${i}"><span class="cv-stage-n">${String(i + 1).padStart(2, "0")}</span><span class="cv-stage-name">${h.esc(st.name)}</span><div class="cv-readout-inline">${stageView(st, h)}</div></li>`)
          .join("")}<span class="cv-spine-pulse" aria-hidden="true"></span></ol>
        <div class="cv-readouts" data-cv-ms='${json(p.stages.map((st) => st.ms))}'>
          <div class="cv-ro-top"><span class="cv-ro-count"><b data-cv-ro-n>01</b> / ${String(p.stages.length).padStart(2, "0")}</span><span class="cv-ro-segs" aria-hidden="true">${p.stages.map((_, i) => `<i${i ? "" : ' class="is-lit"'}></i>`).join("")}</span><span class="cv-ro-ms">+<b data-cv-ro-ms>0</b> ms</span></div>
          <div class="cv-ro-stage">${p.stages
            .map((st, i) => `<div class="cv-readout${i ? "" : " is-active"}" data-stage="${i}"><span class="cv-ro-label">${h.esc(st.name)}</span>${stageView(st, h)}</div>`)
            .join("")}</div>
          <div class="cv-ro-foot"><span>Time to answer</span><b><span data-cv-ro-total>0</span> ms</b></div>
        </div>
      </div>
    </div>
  </section>`;
}

/* ---------------- live demo ---------------- */

function demoSection(v, h) {
  const d = v.demo;
  return `
  <section class="cv-demo" id="cv-demo">
    <div class="c2-container">
      ${head(h, d)}
      <div class="cv-rig" data-cv-demo>
        <script type="application/json" data-cv-demo-script>${json(d)}</script>
        <div class="cv-rig-call">
          <div class="cv-console-bar"><span class="cv-rec" aria-hidden="true"></span><span>Maya · AI receptionist</span><span class="cv-console-biz">${h.esc(d.business)}</span><span class="cv-timer" data-cv-demo-timer>00:00</span></div>
          ${wave()}
          <ol class="cv-transcript cv-transcript--demo" role="log" aria-live="polite" aria-label="Demo call transcript" data-cv-demo-log>
            <li class="cv-t cv-t--hint">Press start to hear how Maya handles Sarah's call.</li>
          </ol>
          <div class="cv-slots" data-cv-demo-slots hidden><span class="cv-sys">Pick a slot for Sarah</span><div role="group" aria-label="Available slots">${d.slots
            .map((s) => `<button type="button" data-slot="${h.esc(s)}">${h.esc(s)}</button>`)
            .join("")}</div></div>
          <div class="cv-rig-controls"><button type="button" class="cv-start" data-cv-demo-start><span class="cv-start-dot" aria-hidden="true"></span><span data-cv-demo-label>Start the call</span></button></div>
        </div>
        <aside class="cv-rig-brain" aria-label="What CosmiVoice sees">
          <span class="cv-sys">What CosmiVoice sees</span>
          <dl class="cv-signal-list">${d.signals
            .map(([k, val]) => `<div data-signal="${h.esc(k)}"><dt>${h.esc(k)}</dt><dd data-value="${h.esc(val)}">Listening…</dd></div>`)
            .join("")}</dl>
          <div class="cv-cal" data-cv-demo-cal><span class="cv-sys">Calendar</span><p data-cv-demo-cal-text>Waiting for a request</p><ul role="list" class="cv-cal-slots">${d.slots.map((s) => `<li data-slot="${h.esc(s)}">${h.esc(s)}</li>`).join("")}</ul></div>
          <ul class="cv-rig-acts" role="list" data-cv-demo-acts>${d.actions.map((a) => `<li>${h.esc(a)}</li>`).join("")}</ul>
          <div class="cv-wa" data-cv-demo-wa hidden><span class="cv-wa-head">WhatsApp</span><p data-cv-demo-wa-text></p><span class="cv-wa-meta">Sent · just now</span></div>
        </aside>
      </div>
    </div>
  </section>`;
}

/* ---------------- architecture ---------------- */

function architectureSection(v, R, h) {
  const a = v.architecture;
  return `
  <section class="cv-arch">
    <div class="c2-container">
      ${head(h, a)}
      <div class="cv-map" data-cv-arch>
        <svg class="cv-wires" aria-hidden="true"><defs><linearGradient id="cv-wire-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0"><stop offset="0" stop-color="#2BA7FF"></stop><stop offset="0.5" stop-color="#CA45FF"></stop><stop offset="1" stop-color="#FE881B"></stop></linearGradient></defs><g data-cv-wires></g></svg>
        <ul class="cv-map-in" role="list">${a.inputs.map((t) => `<li class="cv-port" data-port="in">${h.esc(t)}</li>`).join("")}</ul>
        <div class="cv-core" data-port="core"><img src="${R}c2/media/products/cosmivoice/${v.image.small}" alt="" width="640" height="640" loading="lazy"><span class="cv-core-name">${h.esc(a.core)}</span><span class="cv-rings" aria-hidden="true"><i></i><i></i></span></div>
        <ul class="cv-map-out" role="list">${a.outputs
          .map((o) => `<li class="cv-port" data-port="out" tabindex="0" title="${h.esc(o.detail)}"><b>${h.esc(o.name)}</b></li>`)
          .join("")}</ul>
      </div>
    </div>
  </section>`;
}

/* ---------------- analytics ---------------- */

function analyticsSection(v, h) {
  const a = v.analytics;
  return `
  <section class="cv-analytics">
    <div class="c2-container">
      ${head(h, a)}
      <div class="cv-dash" data-cv-dash role="group" aria-label="Illustrative CosmiVoice analytics dashboard">
        <div class="cv-dash-bar"><span class="cv-dash-title">Workforce overview</span><span class="cv-dash-range">Last 14 days · sample data</span><span class="cv-live-dot"><i aria-hidden="true"></i>Live</span></div>
        <dl class="cv-kpis">${a.kpis.map(([k, val]) => `<div class="cv-kpi"><dt>${h.esc(k)}</dt><dd data-cv-count="${h.esc(val)}">${h.esc(val)}</dd></div>`).join("")}</dl>
        <div class="cv-dash-grid">
          <figure class="cv-panel-chart cv-panel-chart--line">
            <figcaption><span>Calls per day</span><ul class="cv-legend cv-legend--inline" role="list"><li><i class="cv-c1"></i>Inbound</li><li><i class="cv-c2"></i>Outbound</li></ul></figcaption>
            <div class="cv-plot">${lineChart(a, h)}<div class="cv-tip" data-cv-tip hidden></div></div>
          </figure>
          <figure class="cv-panel-chart">
            <figcaption><span>Call outcomes</span></figcaption>
            ${stackBar(a.outcomes, h)}
          </figure>
          <figure class="cv-panel-chart">
            <figcaption><span>Customer sentiment</span></figcaption>
            ${sentimentBar(a.sentiment, h)}
          </figure>
          <div class="cv-panel-chart cv-livecalls" data-cv-livecalls>
            <span class="cv-live-title">Calls right now</span>
            <ul role="list">
              <li><span>Maya</span><span>Booking a cleaning</span><em>0:42</em></li>
              <li><span>Arjun</span><span>Qualifying a loan lead</span><em>1:58</em></li>
              <li><span>Dev</span><span>Payment reminder</span><em>0:19</em></li>
              <li><span>Zara</span><span>Order support</span><em>2:31</em></li>
            </ul>
          </div>
        </div>
        <table class="cv-sr">
          <caption>Calls per day (sample data)</caption>
          <thead><tr><th scope="col">Day</th><th scope="col">Inbound</th><th scope="col">Outbound</th></tr></thead>
          <tbody>${a.days.map((d, i) => `<tr><th scope="row">${h.esc(d)}</th><td>${a.inbound[i]}</td><td>${a.outbound[i]}</td></tr>`).join("")}</tbody>
        </table>
        <div class="cv-tip cv-tip--float" data-cv-float-tip hidden></div>
      </div>
      <p class="cv-note">${h.esc(a.note)}</p>
    </div>
  </section>`;
}

/* ---------------- ecosystem ---------------- */

const GLYPHS = {
  voice: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"></path>',
  fin: '<path d="M3 17l5-5 4 3 8-8"></path><path d="M15 7h5v5"></path>',
  dent: '<path d="M7 3C4.5 3 3 5 3 7.5c0 3 1.5 5 2 8S6 21 7.5 21 9 17 12 17s3.5 4 5 4 2-2.5 2.5-5.5 2-5 2-8C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"></path>',
  ops: '<circle cx="5" cy="6" r="2"></circle><circle cx="19" cy="6" r="2"></circle><circle cx="12" cy="18" r="2"></circle><path d="M7 6h10M6 8l5 8M18 8l-5 8"></path>',
  mails: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path>',
};

// The product family as a star map: Cosmiron at the centre, each product on a curved
// signal line in its own colour. Pointing at a product (or letting it cycle) lights its
// line and tells its story at the centre.
export function ecosystem(v, R, h, { heading = true } = {}) {
  const e = v.ecosystem;
  const W = 1000, H = 520, cx = 500, cy = 260;
  const flagship = e.products.find((p) => p.flagship);
  const ordered = [flagship, ...e.products.filter((p) => !p.flagship)].filter(Boolean);
  const nodes = ordered.map((p, i) => {
    const a = ((-90 + i * (360 / ordered.length)) * Math.PI) / 180;
    const x = cx + Math.cos(a) * 390, y = cy + Math.sin(a) * (i ? 205 : 190);
    const mx = (cx + x) / 2, my = (cy + y) / 2;
    const qx = mx + (y - cy) * 0.18, qy = my - (x - cx) * 0.18;
    return { p, x, y, d: `M${cx} ${cy} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}` };
  });
  const img = `${R}c2/media/products/cosmivoice/${v.image.small}`;
  const node = ({ p, x, y }, i) => {
    const badge = p.flagship
      ? `<span class="cv-np-badge cv-np-badge--img"><img src="${img}" alt="" width="640" height="640" loading="lazy"></span>`
      : p.logo
        ? `<span class="cv-np-badge cv-np-badge--logo"><img src="${R}c2/media/products/${p.logo}" alt="" width="256" height="256" loading="lazy"></span>`
        : `<span class="cv-np-badge"><svg viewBox="0 0 24 24" aria-hidden="true">${GLYPHS[p.glyph] || ""}</svg></span>`;
    const inner = `${badge}<span class="cv-np-name">${h.esc(p.name)}</span><span class="cv-np-role">${h.esc(p.role)}</span>${statusChip(h, p.status)}`;
    const attrs = `class="cv-np${p.flagship ? " is-flagship" : ""}" data-i="${i}" data-name="${h.esc(p.name)}" data-role="${h.esc(p.role)}" data-status="${h.esc(p.status)}"`;
    return `<li class="cv-star" style="left:${((x / W) * 100).toFixed(2)}%;top:${((y / H) * 100).toFixed(2)}%;--hue:${h.esc(p.hue)}">${
      p.href ? `<a ${attrs} href="${R}${p.href}" data-c2-transition>${inner}</a>` : `<div ${attrs} tabindex="0">${inner}</div>`
    }</li>`;
  };
  return `
  <section class="cv-eco">
    <div class="c2-container">
      ${heading ? head(h, { ...e, center: true }) : ""}
      <div class="cv-galaxy" data-cv-eco>
        <svg class="cv-galaxy-lines" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <ellipse cx="${cx}" cy="${cy}" rx="390" ry="205" class="cv-gl-orbit"></ellipse>
          <ellipse cx="${cx}" cy="${cy}" rx="200" ry="105" class="cv-gl-orbit cv-gl-orbit--in"></ellipse>
          ${nodes
            .map(
              ({ p, d }, i) =>
                `<path d="${d}" class="cv-gl" data-i="${i}" style="--hue:${h.esc(p.hue)}" vector-effect="non-scaling-stroke"></path><path d="${d}" class="cv-gl-pulse" data-i="${i}" pathLength="1000" style="--hue:${h.esc(p.hue)};--d:${(i * 0.7).toFixed(1)}s" vector-effect="non-scaling-stroke"></path>`,
            )
            .join("")}
        </svg>
        <div class="cv-galaxy-core">
          <img src="${R}c2/media/products/${e.core || "logos/cosmiron.webp"}" alt="" width="256" height="256" loading="lazy">
          <div class="cv-galaxy-say" aria-live="polite"><b data-cv-eco-name>Cosmiron</b><span data-cv-eco-role>${h.esc(e.tagline || "")}</span></div>
        </div>
        <ul class="cv-stars" role="list">${nodes.map(node).join("")}</ul>
      </div>
    </div>
  </section>`;
}

/* ---------------- pages ---------------- */

export function voicePage(v, R, h) {
  return `
<div class="c2 cv cv-page" style="--c2-tint:#CA45FF">
  ${heroSection(v, R, h)}
  ${languagesSection(v, h)}
  ${storySection(v, h)}
  ${modesSection(v, h)}
  ${teamSection(v, R, h)}
  ${industriesSection(v, h)}
  ${pipelineSection(v, h)}
  ${demoSection(v, h)}
  ${architectureSection(v, R, h)}
  ${analyticsSection(v, h)}
  ${ecosystem(v, R, h)}
${h.closingSection(R, {
  label: v.close.label,
  lineA: v.close.title[0],
  lineB: v.close.title[1],
  primary: { href: h.contact(R), label: v.close.primary },
  secondary: { href: `${R}products/index.html`, label: v.close.secondary },
  inner: `
    <div class="c2-container">
      <p class="cv-close-body" data-c2-reveal>${h.esc(v.close.body)}</p>
    </div>`,
})}
</div>`;
}

// The homepage's flagship band, directly under the hero: the same voice stage, compact.
export function voiceBand(v, R, h) {
  const b = v.band;
  return `<div class="c2 cv cv-band-wrap">
  <section class="cv-band" aria-labelledby="cv-band-title">
    <canvas class="cv-field" data-cv-field aria-hidden="true"></canvas>
    ${voiceStage(v, R, h, {
      tag: "h2",
      id: "cv-band-title",
      eyebrow: `${b.eyebrow} · ${v.status}`,
      title: b.title,
      lede: b.lede,
      actions: h.ctaButton(`${R}products/cosmivoice/index.html`, b.cta),
      compact: true,
    })}
  </section>
</div>`;
}

// The products page: the ecosystem, CosmiVoice first.
export function productsPage(v, R, h) {
  const img = `${R}c2/media/products/cosmivoice/`;
  const rows = v.ecosystem.products
    .map((p) => {
      const link = p.href ? `<a class="cv-link" href="${R}${p.href}" data-c2-transition>${p.flagship ? "Explore CosmiVoice" : `See ${h.esc(p.name)}`} <span aria-hidden="true">→</span></a>` : "";
      return `
        <li class="cv-prod${p.flagship ? " is-flagship" : ""}">
          ${p.flagship ? `<img class="cv-prod-img" src="${img}${v.image.small}" alt="" width="640" height="640" loading="lazy">` : ""}
          <div class="cv-prod-copy"><div class="cv-prod-top"><h2>${h.esc(p.name)}</h2>${statusChip(h, p.status)}</div><p>${h.esc(p.flagship ? v.summary : p.role)}</p>${link}</div>
        </li>`;
    })
    .join("");
  return `
<div class="c2 cv cv-page cv-products" style="--c2-tint:#CA45FF">
  <section class="cv-hero cv-hero--products" aria-labelledby="cv-products-title">
    <canvas class="cv-field" data-cv-field aria-hidden="true"></canvas>
    <div class="c2-container cv-products-head">
      <div class="cv-eyebrow" data-c2-reveal><span class="cv-pulse" aria-hidden="true"></span>Cosmiron products</div>
      <h1 id="cv-products-title" class="cv-h1" data-c2-kinetic><span class="c2-line2">AI employees</span><span class="c2-line2"><span class="c2-spectrum c2-clone">for real business operations.</span></span></h1>
      <p class="cv-lede cv-lede--hero" data-c2-reveal>${h.esc(v.ecosystem.body)}</p>
    </div>
  </section>
  ${ecosystem(v, R, h, { heading: false })}
  <section class="cv-prods">
    <div class="c2-container"><ul class="cv-prod-list" role="list" data-c2-stagger>${rows}
    </ul></div>
  </section>
${h.closingSection(R, {
  label: v.close.label,
  lineA: "Building AI employees",
  lineB: "alongside real businesses.",
  primary: { href: h.contact(R), label: "Talk to Cosmiron" },
  secondary: { href: `${R}products/cosmivoice/index.html`, label: "Explore CosmiVoice" },
})}
</div>`;
}
