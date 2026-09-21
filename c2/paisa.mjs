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

// The thread: a soft haze, the line, and a signal that keeps travelling along it.
function thread(id, cls, box, d, grad) {
  return `
    <svg class="pe-thread ${cls}" viewBox="0 0 ${box}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" ${grad}>${SPECTRUM_STOPS}
      </linearGradient></defs>
      <path class="pe-thread-haze" pathLength="100" stroke="url(#${id})" d="${d}"></path>
      <path class="pe-thread-line" pathLength="100" stroke="url(#${id})" d="${d}"></path>
      <path class="pe-thread-sig" pathLength="100" d="${d}"></path>
    </svg>`;
}

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

  /* ---------- the opening ---------- */
  const open = `
  <section class="pe-scene pe-open" data-pe-scene>
    <span class="pe-glow pe-glow--open" aria-hidden="true"></span>${thread(
      "pe-g-open-d", "pe-thread--d", "1440 900",
      "M1500,70 C1160,120 1290,430 1010,520 C800,590 1060,760 1060,920", 'x1="1440" y1="60" x2="1060" y2="900"'
    )}${thread(
      "pe-g-open-m", "pe-thread--m", "390 844",
      "M400,560 C310,575 345,655 262,696 C186,734 330,800 320,860", 'x1="400" y1="560" x2="300" y2="860"'
    )}
    <div class="pe-wrap">
      <img class="pe-mark" src="${peLogo}" alt="${h.esc(d.client)}" width="720" height="159" data-pe-in>
      ${h.caption(d.open.pill, "dark")}${statement(d.open.lines, "h1", "pe-h1")}
      <p class="pe-p pe-lede" data-pe-in>${h.esc(d.open.lede)}</p>
      <div class="pe-ais">${d.open.ais
        .map((a, i) => `
        <div class="pe-ai pe-ai--${i ? "warm" : "cool"}" data-pe-in><span class="pe-ai-bar" aria-hidden="true"></span><div><strong>${h.esc(a.name)}</strong><span>${h.esc(a.say)}</span></div></div>`)
        .join("")}
      </div>
      <div class="pe-legend" aria-hidden="true"><span><i></i>${h.esc(d.open.legend[0])}</span><span><i class="is-sys"></i>${h.esc(d.open.legend[1])}</span></div>
    </div>
  </section>`;

  /* ---------- who the client is ---------- */
  const doorAt = [[40, 72], [340, 52], [152, 192], [436, 212], [30, 332], [376, 352]];
  const doorEnd = [[85, 116], [415, 96], [225, 236], [495, 256], [108, 376], [425, 396]];
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
          <path class="pe-funnel-out pe-funnel-haze" pathLength="100" stroke="url(#pe-g-who-d)" d="M300,580 L300,780"></path>
          <path class="pe-funnel-out" pathLength="100" stroke="url(#pe-g-who-d)" d="M300,580 L300,780"></path>
          <circle cx="300" cy="580" r="7"></circle>
        </svg>
        ${d.who.doors.map((t, i) => `<span class="pe-door" style="--x:${doorAt[i][0]};--y:${doorAt[i][1]};--b:${i % 2 ? 9 : 7}s">${h.esc(t)}</span>`).join("\n        ")}
        <svg class="pe-funnel pe-funnel--m" viewBox="0 0 342 260" aria-hidden="true" focusable="false">
          <defs><linearGradient id="pe-g-who-m" gradientUnits="userSpaceOnUse" x1="171" y1="120" x2="171" y2="260"><stop offset="0" stop-color="#1b4dfe"></stop><stop offset="0.5" stop-color="#ac24ff"></stop><stop offset="1" stop-color="#e59dfa"></stop></linearGradient></defs>
          ${[20, 80, 140, 202, 262, 322].map((x) => `<path class="pe-funnel-in" pathLength="100" d="M${x},0 C${x},80 171,60 171,120"></path>`).join("\n          ")}
          <path class="pe-funnel-out pe-funnel-haze" pathLength="100" stroke="url(#pe-g-who-m)" d="M171,120 L171,260"></path>
          <path class="pe-funnel-out" pathLength="100" stroke="url(#pe-g-who-m)" d="M171,120 L171,260"></path>
          <circle cx="171" cy="120" r="6"></circle>
        </svg>
        <div class="pe-join pe-seq"${seq(2.4)}><strong>${h.esc(d.who.join[0])}</strong><span>${h.esc(d.who.join[1])}</span></div>
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
