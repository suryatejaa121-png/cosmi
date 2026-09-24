/**
 * PaisaExpress: one thread, no interfaces.
 *
 * The Cosmiron site never shows a product. It says what it does with light, type and
 * motion, so this page does too, and gives the story one grammar: white is a person,
 * spectrum is the system acting. The two AIs lead (one for the customer, one for the
 * owner), then the three things the system does unasked, then what is counted, then
 * the voice chapter built on CosmiVoice.
 *
 * Every scene is a demonstration rather than a description: the exchange types itself,
 * the pipeline lights the files the answer is about, the call plays as two voices.
 * All of it is driven by scroll, never by a timer: c2/paisaexpress.js turns each
 * element's place on screen into --q and each mechanism's into --p, so nothing can be
 * scrolled past before it has happened, on a phone as on a desktop. Light bleeds from
 * one scene into the next so the story reads as one piece.
 *
 * Whose colours: Cosmiron's spectrum is the system that was built. PaisaExpress's own
 * blue, teal and gold (from its codebase) mark what is theirs: their name on every
 * message and call, their loans, their sign-off. Their logo and tagline are real.
 *
 * Content: c2/content/stories/paisaexpress.json.
 */

const FULL = ["#1b4dfe", "#ac24ff", "#e59dfa", "#ffd600", "#fe881b"];
const COOL = ["#1b4dfe", "#7a3cff", "#ac24ff", "#e59dfa"];
const WARM = ["#e59dfa", "#ffd600", "#ffb020", "#fe881b"];
const WHITE = ["#f9f9f9", "#f9f9f9"];

// Seeded, so a rebuild with no content change writes the same bytes.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mix(stops, t) {
  const seg = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
  const i = Math.min(Math.floor(seg), stops.length - 2);
  const f = seg - i;
  const ch = [1, 3, 5].map((k) => {
    const a = parseInt(stops[i].slice(k, k + 2), 16);
    const b = parseInt(stops[i + 1].slice(k, k + 2), 16);
    return Math.round(a + (b - a) * f).toString(16).padStart(2, "0");
  });
  return `#${ch.join("")}`;
}

// A voice: bars that never stop moving, under an envelope that only stands up while
// that voice is talking (--s is when, --len is how long, on the scene's clock).
// Bars outside the middle `phone` are dropped on a phone so the shape stays centred.
function wave({ n, phone = n, stops, seed, cls = "", talk }) {
  const r = rng(seed);
  const edge = Math.floor((n - phone) / 2);
  let bars = "";
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0;
    const shape = 0.35 + 0.65 * (1 - Math.abs(2 * t - 1) ** 1.6);
    const hgt = Math.max(0.12, shape * (0.45 + r() * 0.55)).toFixed(2);
    const x = i < edge || i >= n - edge ? ' class="x"' : "";
    bars += `<i${x} style="--h:${hgt};--d:${(0.55 + r() * 0.8).toFixed(2)}s;--t:-${(r() * 1.3).toFixed(2)}s;--c:${mix(stops, t)}"></i>`;
  }
  const clock = talk ? ` style="--s:${talk[0]};--len:${talk[1]}"` : "";
  return `<div class="pe-wave${talk ? " pe-wave--talk" : ""}${cls ? ` ${cls}` : ""}"${clock} aria-hidden="true">${bars}</div>`;
}

// Inbound rings fall into a point, outbound rings leave one.
const rings = (kind) => `<span class="pe-rings pe-rings--${kind}" aria-hidden="true"><i></i><i></i><i></i><b></b></span>`;

const SPECTRUM_STOPS = `
            <stop offset="0" stop-color="#1b4dfe"></stop>
            <stop offset="0.26" stop-color="#ac24ff"></stop>
            <stop offset="0.52" stop-color="#e59dfa"></stop>
            <stop offset="0.78" stop-color="#ffd600"></stop>
            <stop offset="1" stop-color="#fe881b"></stop>`;

const STAGE_NAMES = ["Enquiry", "Assigned", "Documents", "Review", "Sanctioned", "Disbursed"];

export function paisaPage(d, R, h) {
  const seq = () => "";
  const voicePage = `${R}products/cosmivoice/index.html`;
  const cvLogo = `${R}c2/media/products/cosmivoice/voice-profile-640.webp`;
  const logoImg = (cls, alt = "") => `<img class="pe-cvlogo ${cls}" src="${cvLogo}" alt="${h.esc(alt)}" width="640" height="640" loading="lazy">`;
  const lockup = `<span class="pe-lockup">${logoImg("pe-cvlogo--mark")}${h.esc(d.voice.name)}</span>`;
  const devTag = (t) => `<span class="pe-dev">${h.esc(t)}</span>`;

  const statement = (lines, tag = "h2", cls = "pe-h2", grad = "c2-spectrum c2-clone") => `
        <${tag} class="${cls}" data-pe-in>
          <span class="c2-line2">${h.esc(lines[0])}</span>
          <span class="c2-line2"><span class="${grad}">${h.esc(lines[1])}</span></span>
        </${tag}>`;

  // Whose voice this is: the client's monogram and name over every message and call.
  const peLogo = `${R}c2/media/work/${d.slug}/${d.logo}`;
  const from = (rest, cls = "") => `<div class="pe-from${cls ? ` ${cls}` : ""}"><span class="pe-mono" aria-hidden="true"></span><strong>${h.esc(d.brand.name)}</strong><span>${h.esc(rest)}</span></div>`;

  const act = (s, grad = "") => `
        <span class="pe-num" data-pe-in>${h.esc(s.num)}</span>
        <h2 class="pe-verb pe-g${grad ? ` pe-g--${grad}` : ""}" data-pe-in>${h.esc(s.verb)}</h2>${s.sub ? `
        <p class="pe-sub" data-pe-in>${h.esc(s.sub)}</p>` : ""}`;

  // An exchange is type, never a chat window: white lines are people, spectrum lines
  // are the AI, and the thread beside them says whose turn it is.
  const exchange = (lines, at, handed) => {
    const rows = lines
      .map((l, i) => {
        const lights = l.lights ? ` data-pe-lights="${l.lights}"` : "";
        const line = `<p class="pe-line${l.who === "ai" ? " pe-line--ai pe-g" : ""}"${lights}>${h.esc(l.text)}</p>`;
        return l.src
          ? `<div class="pe-seq"${seq(at[i])}><span class="pe-src">${h.esc(l.src)}</span>${line}</div>`
          : line.replace('class="pe-line', 'class="pe-seq pe-line');
      })
      .join("\n            ");
    const tail = handed
      ? `
          <div class="pe-ex-run pe-ex-run--person pe-seq"${seq(at[lines.length])}>
            <span class="pe-ex-thread"></span>
            <div class="pe-ex-lines"><span class="pe-cap">${h.esc(handed.cap)}</span><p class="pe-line">${h.esc(handed.text)}</p></div>
          </div>`
      : "";
    return `
        <div class="pe-ex" data-pe-track>
          <div class="pe-ex-run">
            <span class="pe-ex-thread pe-ex-thread--grow"></span>
            <div class="pe-ex-lines">
            ${rows}
            </div>
          </div>${tail}
        </div>`;
  };

  /* ---------- the opening: light, type and motion, the way the site sets its own heroes ---------- */
  // The copy sits centred over the night. Under it the agentic CRM is drawn once, in
  // the site's own materials: a burst of spectrum light behind a mandala ring (the
  // site's own motif) with the client's monogram at its heart, and five agents,
  // each drawn as its work, on the ring round it. Nothing boxed, nothing
  // overlapping; every label is a capability traced to the client's code. The orbit
  // turns a little with the scroll. The phone draws the same and lists the agents
  // under it.
  const AGENTS = [
    { id: "intake", name: "Intake Agent", does: "Dedupes · Assigns · Briefs", hue: "#2ba7ff", deg: 270, at: "top" },
    { id: "messaging", name: "Messaging Agent", does: "Requests · Confirms · Tells", hue: "#e59dfa", deg: 342, at: "right" },
    { id: "owner", name: "Owner's Agent", does: "Reads the pipeline · Briefs · Answers", hue: "#fe881b", deg: 54, at: "right" },
    { id: "followup", name: "Follow-up Agent", does: "Sweeps · Nudges · Resets", hue: "#ffd600", deg: 126, at: "left" },
    { id: "customer", name: "Customer Agent", does: "Reads · Answers · Hands over", hue: "#ac24ff", deg: 198, at: "left" },
  ];
  // a circular field, the way the site draws its radar: the agents on the outer ring, a
  // second ring inside, the core at the centre. Desktop on a 1440 x 640 block, phone on
  // a 342 x 300 block, in --u
  const D = { w: 1440, h: 640, cx: 720, cy: 320, r: 280, r2: 206 };
  const M = { w: 342, h: 300, cx: 171, cy: 150, r: 118, r2: 88 };
  const pos = (deg, g) => {
    const t = (deg * Math.PI) / 180;
    return [g.cx + g.r * Math.cos(t), g.cy + g.r * Math.sin(t)];
  };
  // each agent's work as a thin line drawing, in the site's stroke, inside a hairline ring
  const ICON = {
    intake: '<path d="M4 13l2.2-7h11.6L20 13v5.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"></path><path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20"></path>',
    messaging: '<path d="M5.5 5h13A1.5 1.5 0 0 1 20 6.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5v-8A1.5 1.5 0 0 1 5.5 5z"></path><path d="M8 9.5h8M8 12.5h5"></path>',
    customer: '<circle cx="12" cy="8.5" r="3.5"></circle><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"></path>',
    followup: '<circle cx="12" cy="12" r="8"></circle><path d="M12 7.5V12l3.2 2"></path>',
    owner: '<path d="M4 19h16"></path><path d="M7 16v-5M12 16V6M17 16v-8"></path>',
  };
  const node = (a, i) => {
    const [x, y] = pos(a.deg, D), [mx, my] = pos(a.deg, M);
    return `
        <div class="pe-orb-agent pe-orb-agent--${a.at}" style="--hue:${a.hue};--i:${i};--deg:${a.deg};--x:${x.toFixed(0)};--y:${y.toFixed(0)};--mx:${mx.toFixed(0)};--my:${my.toFixed(0)}"><span class="pe-orb-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false">${ICON[a.id]}</svg></span><span class="pe-orb-label"><strong>${h.esc(a.name)}</strong><span>${h.esc(a.does)}</span></span></div>`;
  };
  const orbitSvg = (cls, g) => `
        <svg class="pe-orb-svg pe-orb-svg--${cls}" viewBox="0 0 ${g.w} ${g.h}" aria-hidden="true" focusable="false">
          <circle class="pe-orb-ring pe-orb-ring--in" cx="${g.cx}" cy="${g.cy}" r="${g.r2}"></circle>
          <circle class="pe-orb-ring" cx="${g.cx}" cy="${g.cy}" r="${g.r}"></circle>
          <circle class="pe-orb-run" cx="${g.cx}" cy="${g.cy}" r="${g.r}" pathLength="100"></circle>
        </svg>`;
  // the mandala: the site's own motif, a rosette of thin circles inside a spectrum ring
  const rosette = [];
  for (let k = 0; k < 16; k++) {
    const t = (k * Math.PI) / 8;
    rosette.push(`<circle cx="${(180 + 62 * Math.cos(t)).toFixed(1)}" cy="${(180 + 62 * Math.sin(t)).toFixed(1)}" r="96"></circle>`);
  }
  const mandala = `
        <svg class="pe-mandala" viewBox="0 0 360 360" aria-hidden="true" focusable="false">
          <defs><linearGradient id="pe-g-mandala" gradientUnits="userSpaceOnUse" x1="8" y1="180" x2="352" y2="180">${SPECTRUM_STOPS}
          </linearGradient></defs>
          <g class="pe-mandala-web">${rosette.join("")}<circle cx="180" cy="180" r="62"></circle><circle cx="180" cy="180" r="124"></circle></g>
          <circle class="pe-mandala-ring pe-mandala-ring--haze" cx="180" cy="180" r="172" stroke="url(#pe-g-mandala)"></circle>
          <circle class="pe-mandala-ring" cx="180" cy="180" r="172" stroke="url(#pe-g-mandala)"></circle>
        </svg>`;
  // a sparse, seeded star field, so a rebuild with no change writes the same sky
  const rs = rng(23);
  let stars = "";
  for (let n = 0; n < 48; n++) {
    const x = (rs() * 1440).toFixed(0), y = (rs() * 900).toFixed(0), r = (0.6 + rs() * 1.1).toFixed(1), o = (0.08 + rs() * 0.28).toFixed(2);
    stars += `<circle cx="${x}" cy="${y}" r="${r}" opacity="${o}"${n % 6 === 0 ? ` class="pe-star-tw" style="--d:${(3 + rs() * 4).toFixed(1)}s"` : ""}></circle>`;
  }

  const open = `
  <section class="pe-scene pe-open" data-pe-scene>
    <div class="pe-scene-sky" aria-hidden="true">
      <svg class="pe-stars" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">${stars}</svg>
    </div>
    <div class="pe-open-copy">
      <img class="pe-mark" src="${peLogo}" alt="${h.esc(d.client)}" width="720" height="159" data-pe-in>
      ${h.caption(d.open.pill, "dark")}${statement(d.open.lines, "h1", "pe-h1")}
      <p class="pe-p pe-lede" data-pe-in>${h.esc(d.open.lede)}</p>
    </div>
    <div class="pe-orb" data-pe-in aria-label="The agentic CRM: an intake agent, a messaging agent, the owner's agent, a follow-up agent and a customer agent, working round one core">
      <span class="pe-rays" aria-hidden="true"></span>
      <span class="pe-sweep" aria-hidden="true"></span>
      ${orbitSvg("d", D)}${orbitSvg("m", M)}
      <div class="pe-core" aria-hidden="true">${mandala}<span class="pe-core-disc"><span class="pe-mono pe-mono--core"></span></span></div>
      <span class="pe-orb-cap" aria-hidden="true">Agentic CRM</span>
      ${AGENTS.map(node).join("")}
    </div>
    <ul class="pe-orb-key" aria-hidden="true">${AGENTS.map((a) => `<li style="--hue:${a.hue}"><strong>${h.esc(a.name)}</strong><span>${h.esc(a.does)}</span></li>`).join("")}</ul>
    <span class="pe-corner pe-corner--tr" aria-hidden="true">Built by Cosmiron AI</span>
  </section>`;

  /* ---------- who the client is ---------- */
  const doorAt = [[40, 72], [340, 52], [152, 192], [436, 212], [30, 332], [376, 352]];
  const doorEnd = [[85, 116], [415, 96], [225, 236], [495, 256], [108, 376], [425, 396]];
  // where the one lead goes: the client's monogram in a ring of spectrum, at the end of the line
  const leadIn = (id, cx, cy, r) => `
          <defs><linearGradient id="pe-g-lead-${id}" gradientUnits="userSpaceOnUse" x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}">${SPECTRUM_STOPS}
          </linearGradient></defs>
          <g class="pe-lead-in">
            <circle class="pe-lead-in-halo" cx="${cx}" cy="${cy}" r="${r + 14}"></circle>
            <circle class="pe-lead-in-ring" cx="${cx}" cy="${cy}" r="${r}" stroke="url(#pe-g-lead-${id})"></circle>
            <text class="pe-lead-in-cap" x="${cx + r + 14}" y="${cy + 5}">Into the CRM</text>
          </g>`;
  const who = `
  <section class="pe-scene pe-who" data-pe-scene>
    <span class="pe-glow pe-glow--who pe-glow--brand" aria-hidden="true"></span>
    <div class="pe-wrap pe-who-grid">
      <div class="pe-col">
        <img class="pe-who-logo" src="${peLogo}" alt="${h.esc(d.client)}" width="720" height="159" loading="lazy" data-pe-in>${statement(d.who.lines, "h2", "pe-h2", "pe-g pe-g--brand")}
        <p class="pe-p" data-pe-in>${h.esc(d.who.say)}</p>
        <ul class="pe-products" data-pe-in>${d.who.products.map((p) => `<li>${h.esc(p)}</li>`).join("")}</ul>
      </div>
      <div class="pe-doors" data-pe-track>
        <svg class="pe-funnel pe-funnel--d" viewBox="0 0 560 780" aria-hidden="true" focusable="false">
          <defs><linearGradient id="pe-g-who-d" gradientUnits="userSpaceOnUse" x1="300" y1="580" x2="300" y2="780"><stop offset="0" stop-color="#1b4dfe"></stop><stop offset="0.5" stop-color="#ac24ff"></stop><stop offset="1" stop-color="#e59dfa"></stop></linearGradient></defs>
          ${doorEnd.map(([x, y]) => `<path class="pe-funnel-in" pathLength="100" d="M${x},${y} C${x},${Math.round((y + 580) / 2 + 60)} 300,${Math.round((y + 580) / 2)} 300,580"></path>`).join("\n          ")}
          <path class="pe-funnel-out pe-funnel-haze" pathLength="100" stroke="url(#pe-g-who-d)" d="M300,580 L300,724"></path>
          <path class="pe-funnel-out" pathLength="100" stroke="url(#pe-g-who-d)" d="M300,580 L300,724"></path>
          <circle cx="300" cy="580" r="7"></circle>${leadIn("d", 300, 752, 26)}
        </svg>
        ${d.who.doors.map((t, i) => `<span class="pe-door" style="--x:${doorAt[i][0]};--y:${doorAt[i][1]};--b:${i % 2 ? 9 : 7}s">${h.esc(t)}</span>`).join("\n        ")}
        <svg class="pe-funnel pe-funnel--m" viewBox="0 0 342 260" aria-hidden="true" focusable="false">
          <defs><linearGradient id="pe-g-who-m" gradientUnits="userSpaceOnUse" x1="171" y1="120" x2="171" y2="260"><stop offset="0" stop-color="#1b4dfe"></stop><stop offset="0.5" stop-color="#ac24ff"></stop><stop offset="1" stop-color="#e59dfa"></stop></linearGradient></defs>
          ${[20, 80, 140, 202, 262, 322].map((x) => `<path class="pe-funnel-in" pathLength="100" d="M${x},0 C${x},80 171,60 171,120"></path>`).join("\n          ")}
          <path class="pe-funnel-out pe-funnel-haze" pathLength="100" stroke="url(#pe-g-who-m)" d="M171,120 L171,212"></path>
          <path class="pe-funnel-out" pathLength="100" stroke="url(#pe-g-who-m)" d="M171,120 L171,212"></path>
          <circle cx="171" cy="120" r="6"></circle>${leadIn("m", 171, 236, 20)}
        </svg>
        <div class="pe-join pe-seq"${seq(2.4)}><strong>${h.esc(d.who.join[0])}</strong><span>${h.esc(d.who.join[1])}</span></div>
        <span class="pe-mono pe-lead-mono" aria-hidden="true"></span>
      </div>
    </div>
  </section>`;

  /* ---------- 01: AI for the customer ---------- */
  const c = d.customer;
  const customer = `
  <section class="pe-scene pe-customer" data-pe-scene>
    <span class="pe-glow pe-glow--cool" aria-hidden="true"></span>
    <div class="pe-wrap pe-duo">
      <div class="pe-col">${act(c)}
        <p class="pe-p" data-pe-in>${h.esc(c.say)}</p>
        <ul class="pe-knows" data-pe-in>${c.knows.map((k) => `<li>${h.esc(k)}</li>`).join("")}</ul>
        <div class="pe-when" data-pe-in>
          <strong>${h.esc(c.handover.title)}</strong>
          <ul>${c.handover.when.map((w) => `<li>${h.esc(w)}</li>`).join("")}</ul>
        </div>
      </div>
      <div class="pe-demo">
        ${from(c.cap, "pe-from--ex")}${exchange(c.exchange, [0.4, 2, 4.2, 5.8, 8, 9.6], c.handed)}
      </div>
    </div>
  </section>`;

  /* ---------- 02: AI for the owner ---------- */
  const o = d.owner;
  const STALE = new Set([3, 9, 17, 22, 30, 38, 44]);
  const A3 = new Set([1, 5, 8, 12, 15, 19, 24, 27, 31, 34, 37, 40, 42, 46]);
  const ownerAt = [0.4, 2, 4.4, 5.8, 8, 9.4];
  let ticks = "";
  for (let i = 0; i < 48; i++) ticks += `<i${STALE.has(i) ? ' class="is-stale"' : A3.has(i) ? ' class="is-agent"' : ""}></i>`;
  ticks += `<b></b>${"<i class=\"is-lead\"></i>".repeat(9)}`;
  const owner = `
  <section class="pe-scene pe-owner" data-pe-scene>
    <span class="pe-glow pe-glow--warm" aria-hidden="true"></span>
    <div class="pe-wrap pe-duo">
      <div class="pe-col">${act(o, "warm")}
        <p class="pe-p" data-pe-in>${h.esc(o.say)}</p>
        <div class="pe-asks" data-pe-in>
          <strong>${h.esc(o.askTitle)}</strong>
          <ul>${o.asks.map((a) => `<li>${h.esc(a)}</li>`).join("")}</ul>
        </div>
        <div class="pe-notes" data-pe-in>${o.notes.map((n) => `<p>${h.esc(n)}</p>`).join("")}</div>
      </div>
      <div class="pe-demo pe-demo--warm">
        ${from(o.cap, "pe-from--ex")}${exchange(o.exchange, ownerAt)}
        <div class="pe-pipe-box" style="--stale:${ownerAt[1]};--lead:${ownerAt[3]};--agent:${ownerAt[5]}">
          <strong>${h.esc(o.pipeline.title)}</strong>
          <div class="pe-pipe" aria-hidden="true">${ticks}</div>
          <p class="pe-pipe-key"><span>${h.esc(o.pipeline.base)}</span><span class="is-stale">${h.esc(o.pipeline.stale)}</span><span class="is-lead">${h.esc(o.pipeline.lead)}</span><span class="is-agent">${h.esc(o.pipeline.agent)}</span></p>
        </div>
      </div>
    </div>
  </section>`;

  /* ---------- 03: it assigns ---------- */
  const a = d.assigns;
  const side = ["t", "r", "b", "l"];
  const assigns = `
  <section class="pe-scene pe-assigns" data-pe-scene>
    <span class="pe-glow pe-glow--ring" aria-hidden="true"></span>
    <div class="pe-wrap pe-duo pe-duo--ring">
      <div class="pe-col">${act(a)}
        <p class="pe-p" data-pe-in>${h.esc(a.say)}</p>
        <p class="pe-p pe-p--small" data-pe-in>${h.esc(a.ways)}</p>
      </div>
      <div class="pe-ring-wrap" data-pe-track>
        <div class="pe-ring">
          <span class="pe-ring-line" aria-hidden="true"></span>
          ${a.agents.map((g, i) => `<span class="pe-node pe-node--${side[i]}${g.skipped ? " is-skip" : ""}" aria-hidden="true"></span>`).join("")}
          <div class="pe-orbit" aria-hidden="true"><i class="pe-orbit-pulse"></i><i class="pe-orbit-dot"></i></div>
          ${a.agents.map((g, i) => `<div class="pe-agent pe-agent--${side[i]}${g.skipped ? " is-skip" : ""}"><span>${h.esc(g.name)}</span>${g.skipped ? `<small>${h.esc(g.skipped)}</small>` : ""}</div>`).join("\n          ")}
          <span class="pe-ring-center">${h.esc(a.center)}</span>
        </div>
      </div>
      <div class="pe-none" data-pe-in><strong>${h.esc(a.none[0])}</strong><span>${h.esc(a.none[1])}</span></div>
    </div>
  </section>`;

  /* ---------- 04: it tells ---------- */
  const t = d.tells;
  const stopAt = [0.6, 2.2, 3.8, 5.4, 7, 8.6];
  const tells = `
  <section class="pe-scene pe-tells" data-pe-scene>
    <span class="pe-glow pe-glow--path" aria-hidden="true"></span>
    <div class="pe-wrap pe-duo pe-duo--path">
      <div class="pe-col">${act(t)}
        <p class="pe-p" data-pe-in>${h.esc(t.say)}</p>
        <p class="pe-p pe-p--small" data-pe-in>${h.esc(t.note)}</p>
        ${from(t.cap, "pe-from--col")}
      </div>
      <ol class="pe-stops pe-demo" data-pe-track>
        <svg class="pe-path" viewBox="0 0 80 802" aria-hidden="true" focusable="false">
          <defs><linearGradient id="pe-g-tells" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="40" y2="802">${SPECTRUM_STOPS}
          </linearGradient></defs>
          <path class="pe-path-base" d="M40,0 Q0,55 40,110 T40,228 T40,346 T40,464 T40,582 T40,700 T40,802"></path>
          <path class="pe-path-haze" pathLength="100" stroke="url(#pe-g-tells)" d="M40,0 Q0,55 40,110 T40,228 T40,346 T40,464 T40,582 T40,700"></path>
          <path class="pe-path-lit" pathLength="100" stroke="url(#pe-g-tells)" d="M40,0 Q0,55 40,110 T40,228 T40,346 T40,464 T40,582 T40,700"></path>
        </svg>
        <span class="pe-rail" aria-hidden="true"></span>
        ${t.stops
          .map((s, i) => `<li class="pe-stop pe-seq${s.was ? " pe-stop--renamed" : ""}"${seq(stopAt[i])}><span class="pe-stop-k">${s.was ? `<s>${h.esc(s.was)}</s> <span class="pe-g">${h.esc(s.k)}</span>` : h.esc(s.k)}</span><span class="pe-stop-v">${h.esc(s.v)}</span></li>`)
          .join("\n        ")}
      </ol>
    </div>
  </section>`;

  /* ---------- 05: it chases ---------- */
  const ch = d.chases;
  const chases = `
  <section class="pe-scene pe-chases" data-pe-scene>
    <span class="pe-glow pe-glow--dawn" aria-hidden="true"></span>
    <div class="pe-wrap">
      <div class="pe-chase-head">
        <div>${act(ch)}
        </div>
        <p class="pe-p" data-pe-in>${h.esc(ch.say)}</p>
      </div>
      <div class="pe-chase-mid pe-demo" data-pe-track>
        <span class="pe-clock pe-g pe-g--dawn" aria-hidden="true" data-pe-clock="${h.esc(ch.clock)}">${h.esc(ch.clock)}</span>
        <div class="pe-digest-box">
          ${from(ch.cap)}
          <p class="pe-digest">${ch.digest.map((l, i) => `<span class="pe-seq"${seq([0.5, 2.5, 4.5][i])}>${h.esc(l)}${i === ch.digest.length - 1 ? '<i class="pe-caret" aria-hidden="true"></i>' : ""}</span>`).join(" ")}</p>
        </div>
      </div>
      <div class="pe-ladder pe-demo">
        ${ch.ladder.map((r, i) => `<div class="pe-rung pe-seq"${seq([6.5, 7.3, 8.1][i])}><small>${h.esc(r[0])}</small><strong>${h.esc(r[1])}</strong></div>`).join("\n        ")}
        <div class="pe-rung pe-rung--again pe-seq"${seq(9.2)}><small>${h.esc(ch.again[0])}</small><span>${h.esc(ch.again[1])}</span></div>
      </div>
    </div>
  </section>`;

  /* ---------- counted ---------- */
  const tz = d.count.teaser;
  const counted = `
  <section class="pe-scene pe-count" data-pe-scene>
    <span class="pe-glow pe-glow--count" aria-hidden="true"></span>
    <div class="pe-wrap">
      ${h.caption(d.count.pill, "dark")}${statement(d.count.lines)}
      <div class="pe-figs">
        ${d.figures.map((f, i) => `<div class="pe-fig pe-seq"><span class="pe-fig-bar" aria-hidden="true"></span><div><span class="pe-fig-n" data-pe-count="${h.esc(f.value)}">${h.esc(f.value)}</span><span class="pe-fig-l">${h.esc(f.label)}</span></div></div>`).join("\n        ")}
      </div>
      <a class="pe-teaser" href="#pe-voice" data-pe-in>
        <div>${devTag(tz.tag)}<span class="pe-teaser-line">${h.esc(tz.lines[0])} <span class="pe-g">${h.esc(tz.lines[1])}</span></span><span class="pe-teaser-say">${h.esc(tz.say)}</span></div>
        ${wave({ n: 64, phone: 44, stops: FULL, seed: 21, cls: "pe-wave--breath pe-wave--lg" })}
      </a>
    </div>
  </section>`;

  /* ---------- next, it speaks: CosmiVoice ---------- */
  const v = d.voice;
  const voice = `
  <section class="pe-scene pe-voice" id="pe-voice" data-pe-scene>
    <span class="pe-glow pe-glow--voice" aria-hidden="true"></span>
    <div class="pe-voice-stage">
      <div class="pe-voice-tag">${devTag(v.tag)}<strong>${h.esc(v.name)}</strong><span>${h.esc(v.by)}</span></div>
      <h2 class="pe-voice-h"><span class="pe-voice-l1" data-pe-in>${h.esc(v.lines[0])}</span> <span class="pe-voice-l2" data-pe-in><span class="pe-g">${h.esc(v.lines[1])}</span></span></h2>
      <div class="pe-voice-orb">
        ${wave({ n: 160, stops: FULL, seed: 7, cls: "pe-ribbon pe-ribbon--d pe-wave--breath" })}
        ${wave({ n: 58, stops: FULL, seed: 9, cls: "pe-ribbon pe-ribbon--m pe-wave--breath" })}
        <span class="pe-voice-ring" aria-hidden="true"></span>
        ${logoImg("pe-cvlogo--orb", v.logoAlt)}
      </div>
      ${v.idents
        .map((it) => `<div class="pe-ident pe-ident--${it.kind}" data-pe-in>${rings(it.kind)}<strong class="pe-g pe-g--${it.kind === "in" ? "cool" : "warm"}">${h.esc(it.name)}</strong><span class="pe-ident-does">${h.esc(it.does)}</span><span class="pe-ident-why">${h.esc(it.problem)}</span></div>`)
        .join("\n      ")}
      <p class="pe-p pe-voice-lede" data-pe-in>${h.esc(v.lede)}</p>
      <div class="pe-voice-cta" data-pe-in>${h.ctaButton(voicePage, v.cta)}</div>
    </div>
  </section>`;

  /* ---------- in development: AI Receptionist ---------- */
  const rc = d.receptionist;
  const built = (s) => `<div class="pe-built" data-pe-in>${devTag(s.tag)}<span>${h.esc(s.built)}</span>${lockup}</div>`;
  const receptionist = `
  <section class="pe-scene pe-recept" data-pe-scene>
    <span class="pe-glow pe-glow--cool" aria-hidden="true"></span>
    <div class="pe-wrap pe-duo pe-duo--call">
      <div class="pe-col">${built(rc)}
        <h2 class="pe-verb pe-verb--call pe-g pe-g--cool" data-pe-in>${h.esc(rc.verb)}</h2>
        <p class="pe-sub" data-pe-in>${h.esc(rc.sub)}</p>
        <p class="pe-p" data-pe-in>${h.esc(rc.say)}</p>
        <p class="pe-speaks" data-pe-in><span>${h.esc(rc.speaks[0])}</span>${rc.speaks[1].map((l, i) => `<b style="--k:${i}">${h.esc(l)}</b>`).join("")}<span>${h.esc(rc.speaks[2])}</span></p>
        <a class="pe-link" href="${voicePage}" data-pe-in>${h.esc(rc.link)}</a>
      </div>
      <div class="pe-demo pe-call">
        <div class="pe-ringrow pe-seq"${seq(0.3)}>${rings("in")}<span class="pe-time">${h.esc(rc.time)}</span><span class="pe-ringsay">${h.esc(rc.ring)}</span></div>
        <div class="pe-said pe-seq"${seq(1.6)}><span class="pe-cap">${h.esc(rc.caller[0])}</span>${wave({ n: 74, phone: 46, stops: WHITE, seed: 3, cls: "pe-wave--person", talk: [1.6, 2.6] })}<p class="pe-line pe-line--call">${h.esc(rc.caller[1])}</p></div>
        <div class="pe-said pe-seq"${seq(4.6)}><span class="pe-cap">${h.esc(rc.ai[0])}</span><div class="pe-voicesrc">${logoImg("pe-cvlogo--src")}${wave({ n: 64, phone: 38, stops: COOL, seed: 5, talk: [4.6, 2.8] })}</div><p class="pe-line pe-line--call pe-g pe-g--cool">${h.esc(rc.ai[1])}</p></div>
        <div class="pe-after">
          <div class="pe-seq"${seq(7.8)}><strong>${h.esc(rc.understands.title)}</strong>
            ${rc.understands.items.map(([k, w], i) => `<div class="pe-intent${i ? "" : " is-top"}"><span>${h.esc(k)}</span><span class="pe-intent-track"><i style="--w:${w}"></i></span></div>`).join("\n            ")}
          </div>
          <div><strong class="pe-seq"${seq(9.4)}>${h.esc(rc.acts.title)}</strong>
            ${rc.acts.items.map((x, i) => `<span class="pe-did pe-seq"${seq([9.8, 11, 12.2][i])}>${h.esc(x)}</span>`).join("\n            ")}
          </div>
        </div>
        <span class="pe-cap pe-cap--end">${h.esc(rc.cap)}</span>
      </div>
    </div>
  </section>`;

  /* ---------- in development: AI Calling ---------- */
  const cl = d.calling;
  let dialTicks = "";
  for (let i = 0; i < 12; i++) dialTicks += `<span class="pe-tick" style="--a:${i * 30}deg;--at:${(i / 12).toFixed(3)}"><i></i></span>`;
  const calling = `
  <section class="pe-scene pe-calling" data-pe-scene>
    <span class="pe-glow pe-glow--warm" aria-hidden="true"></span>
    <div class="pe-wrap pe-duo pe-duo--call">
      <div class="pe-col">${built(cl)}
        <h2 class="pe-verb pe-verb--call pe-g pe-g--warm" data-pe-in>${h.esc(cl.verb)}</h2>
        <p class="pe-sub" data-pe-in>${h.esc(cl.sub)}</p>
        <p class="pe-p" data-pe-in>${h.esc(cl.say)}</p>
        <p class="pe-p pe-p--small" data-pe-in>${h.esc(cl.note)}</p>
        <a class="pe-link" href="${voicePage}" data-pe-in>${h.esc(cl.link)}</a>
      </div>
      <div class="pe-demo pe-call pe-call--out" data-pe-track>
        <div class="pe-dialrow">
          <div class="pe-dialbox"><div class="pe-dial" aria-hidden="true"><span class="pe-dial-ring"></span>${dialTicks}<span class="pe-hand"></span>${rings("out")}</div><span class="pe-dialsay">${h.esc(cl.dial)}</span></div>
          <div class="pe-dialtalk">
            <div class="pe-said pe-seq"${seq(1.2)}><span class="pe-cap">${h.esc(cl.ai[0])}</span><div class="pe-voicesrc">${logoImg("pe-cvlogo--src")}${wave({ n: 22, stops: WARM, seed: 11, talk: [1.2, 3.4] })}</div><p class="pe-line pe-line--call pe-line--tight pe-g pe-g--warm">${h.esc(cl.ai[1])}</p></div>
            <div class="pe-said pe-seq"${seq(5)}><span class="pe-cap">${h.esc(cl.caller[0])}</span>${wave({ n: 30, stops: WHITE, seed: 13, cls: "pe-wave--person", talk: [5, 2] })}<p class="pe-line pe-line--call pe-line--tight">${h.esc(cl.caller[1])}</p></div>
          </div>
        </div>
        <div class="pe-then">
          <strong class="pe-seq"${seq(7.6)}>${h.esc(cl.acts.title)}</strong>
          <div class="pe-then-row" data-pe-track><span class="pe-then-base" aria-hidden="true"></span><span class="pe-then-line" aria-hidden="true"></span>
            ${cl.acts.items.map((x, i) => `<div class="pe-then-node pe-seq"${seq([8.6, 9.8, 11, 12.2][i])}><i aria-hidden="true"></i><span>${h.esc(x)}</span></div>`).join("\n            ")}
          </div>
        </div>
        <span class="pe-cap pe-cap--end">${h.esc(cl.cap)}</span>
      </div>
    </div>
  </section>`;

  return `
<div class="c2 cv pe pe-page" style="--c2-tint:${h.esc(d.tint)}">
<div class="pe-story">
${open}
${who}
${customer}
${owner}
${assigns}
${tells}
${chases}
${counted}
${voice}
${receptionist}
${calling}
  <section class="pe-scene pe-signoff" data-pe-scene>
    <span class="pe-glow pe-glow--signoff pe-glow--brand" aria-hidden="true"></span>
    <div class="pe-signoff-in">
      <!-- the site's own "intelligence in action" scene: a cloud of light pours into one point on the line and becomes the core, the same ring the hero opens with -->
      <div class="pe-signoff-scene" aria-hidden="true" data-pe-in>
        <video class="pe-signoff-video" muted playsinline loop preload="none" poster="${R}c2/media/work/${d.slug}/video/intelligence-poster.jpg" data-c2-lazy>
          <source data-src="${R}c2/media/work/${d.slug}/video/intelligence.webm" type="video/webm">
          <source data-src="${R}c2/media/work/${d.slug}/video/intelligence.mp4" type="video/mp4">
        </video>
      </div>
      <span class="pe-signoff-rule" aria-hidden="true" data-pe-in></span>
      <img class="pe-signoff-logo" src="${peLogo}" alt="${h.esc(d.client)}" width="720" height="159" loading="lazy" data-pe-in>
      <p class="pe-signoff-line" data-pe-in>${h.esc(d.signoff.line)}</p>
      <a class="pe-signoff-link" href="${h.esc(d.url)}" target="_blank" rel="noopener" data-pe-in>${h.esc(d.signoff.link)} <span>${h.esc(d.url.replace(/^https?:\/\//, ""))}</span> <span aria-hidden="true">↗</span></a>
      <p class="pe-signoff-by" data-pe-in>${h.esc(d.signoff.by)}</p>
    </div>
  </section>
</div>
${h.closingSection(R, {
  label: d.close.label,
  lineA: d.close.title[0],
  lineB: d.close.title[1],
  primary: { href: h.contact(R), label: d.close.primary },
  secondary: { href: `${R}work/index.html`, label: d.close.secondary },
  inner: `
    <div class="c2-container">
      <p class="cv-close-body" data-c2-reveal>${h.esc(d.close.body)}</p>
    </div>`,
})}
</div>`;
}
