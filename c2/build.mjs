#!/usr/bin/env node
/**
 * Cosmiron 2.0 — builds the additions on top of the existing Webflow export.
 *
 *   node c2/build.mjs
 *
 * 1. Adds a "Work" link right after "Our approach" in the desktop nav, mobile nav
 *    and footer of the five existing pages. Runs once per page (links are marked
 *    data-c2="work-link"); nothing else in those pages is touched.
 * 2. Renders /work/index.html and /work/<slug>/index.html from c2/content/work/*.json.
 *    New pages use the About page as their shell, so the nav, page curtain, modals,
 *    footer and scripts are the site's own.
 *
 * To add a collaboration: drop <slug>.json into c2/content/work and its images into
 * c2/media/work/<slug>/, then run this script. Never edit the generated pages by hand.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = "cdn.prod.website-files.com/6720dd1ab6df0da205830ab1/";
const EXISTING_PAGES = [
  "index.html",
  "whatwedo-cosmiron/pages/what-we-do/index.html",
  "ourapproach/pages/our-approach/index.html",
  "aboutus-cosmiron/pages/about-us/index.html",
  "contact-cosmiron/pages/contact-us/index.html",
];
const SHELL_PAGE = "aboutus-cosmiron/pages/about-us/index.html";
const SHELL_ASSET_DIR = "aboutus-cosmiron/";
const CONTACT_PAGE = "contact-cosmiron/pages/contact-us/index.html";
const REQUIRED = ["slug", "project", "title", "headline", "summary", "industry", "status", "client", "capabilities", "context", "deliverables", "features", "craft", "stack", "outcome", "hero", "screens"];

/* ---------------- helpers ---------------- */

const read = (file) => readFileSync(join(ROOT, file), "utf8");
function write(file, html) {
  mkdirSync(dirname(join(ROOT, file)), { recursive: true });
  writeFileSync(join(ROOT, file), html);
}
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const textOf = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;|​|‍/g, " ").replace(/\s+/g, " ").trim();
function rootPrefix(file) {
  const depth = file.split("/").length - 1;
  return depth === 0 ? "./" : "../".repeat(depth);
}

/* ---------------- 1. Work link on existing pages ---------------- */

function ensureWorkLinks() {
  for (const file of EXISTING_PAGES) {
    let html = read(file);
    if (html.includes('data-c2="work-link"')) {
      console.log(`  work link   already present  ${file}`);
      continue;
    }
    const href = `${rootPrefix(file)}work/index.html`;
    let added = 0;
    html = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (anchor, attrs, inner) => {
      if (!/\b(nav-link|footer_link)\b/.test(attrs)) return anchor;
      if (textOf(inner).toLowerCase() !== "our approach") return anchor;
      const workAttrs = attrs
        .replace(/\shref="[^"]*"/, ` href="${href}"`)
        .replace(/\saria-current="page"/, "")
        .replace(/\sw--current\b/, "");
      added += 1;
      return `${anchor}<a${workAttrs} data-c2="work-link">${inner.replace(/our\s+approach/i, "Work")}</a>`;
    });
    if (added !== 3) throw new Error(`${file}: expected 3 "Our approach" links (desktop, mobile, footer), found ${added}`);
    write(file, html);
    console.log(`  work link   added x${added}        ${file}`);
  }
}

/* ---------------- 2. page shell ---------------- */

function setMeta(html, key, value) {
  return html.replace(/<meta\b[^>]*>/g, (tag) => {
    const named = new RegExp(`(?:name|property)="${key}"`).test(tag);
    return named ? tag.replace(/content="[^"]*"/, `content="${esc(value)}"`) : tag;
  });
}

function shell({ file, title, description, body, jsonLd }) {
  const R = rootPrefix(file);
  let html = read(SHELL_PAGE);

  // The About page links to itself as "index.html"; point those at its real path first.
  html = html.replace(/href="index\.html"/g, 'href="../../../aboutus-cosmiron/pages/about-us/index.html"');
  // ../../../ = site root, ../../ = the About page's own asset copy.
  html = html
    .split("../../../").join("@@ROOT@@")
    .split("../../").join("@@SHELL@@")
    .split("@@ROOT@@").join(R)
    .split("@@SHELL@@").join(R + SHELL_ASSET_DIR);

  // Current-page state belongs to Work, not About.
  html = html.replace(/\saria-current="page"/g, "").replace(/\sw--current\b/g, "");
  html = html.replace(/<a\b([^>]*data-c2="work-link"[^>]*)>/g, (tag, attrs) =>
    /class="nav-link desktop/.test(attrs)
      ? `<a${attrs.replace(/class="nav-link desktop w-inline-block"/, 'class="nav-link desktop w-inline-block w--current"')} aria-current="page">`
      : tag,
  );

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  for (const key of ["description", "og:description", "twitter:description"]) html = setMeta(html, key, description);
  for (const key of ["og:title", "twitter:title"]) html = setMeta(html, key, title);

  const head = [
    `<link href="${R}c2/cosmiron-2.css" rel="stylesheet" type="text/css">`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : "",
  ].join("\n  ");
  html = html.replace("</head>", `  ${head}\n</head>`);

  const start = html.indexOf('<div class="page_wrapper">');
  const footer = html.indexOf('<section class="footer_wrapper">');
  if (start < 0 || footer < start) throw new Error(`${SHELL_PAGE}: page_wrapper / footer_wrapper markers not found`);
  html = `${html.slice(0, start)}<div class="page_wrapper">\n<!-- Generated by c2/build.mjs. Edit c2/content, not this file. -->\n${body}\n    ${html.slice(footer)}`;

  // Drop About-only scripts (founder shuffle, Unicorn Studio scene loader, form inputs).
  html = html.replace(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g, (tag, code) =>
    /UnicornStudio|div-block-214|input-custom/.test(code) ? "" : tag,
  );
  html = html.replace("</body>", `  <script src="${R}c2/cosmiron-2.js"></script>\n</body>`);
  return html;
}

/* ---------------- components ---------------- */

const RING_ICON =
  '<div class="caption-icon w-embed"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8ZM13.6 8C13.6 11.0928 11.0928 13.6 8 13.6C4.90721 13.6 2.4 11.0928 2.4 8C2.4 4.90721 4.90721 2.4 8 2.4C11.0928 2.4 13.6 4.90721 13.6 8Z" fill="#C86FFF"></path></svg></div>';
const BUTTON_STYLE =
  '<div class="css-button__style w-embed"><style>@media (min-width: 992px) { .button { background-size: 300%; } .button:hover, .button:focus { background-position: right; } } @media (min-width: 1px) { .button { background-size: 300%; background-position: left; } }</style></div>';

const caption = (label, variant = "dark") => `<div class="caption${variant ? ` ${variant}` : ""}">${RING_ICON}<div>${esc(label)}</div></div>`;
const ctaButton = (href, label) => `<a href="${href}" class="button main-cta w-inline-block"><div class="btn-padding"><div class="label">${esc(label)}</div></div>${BUTTON_STYLE}</a>`;
const outlineButton = (href, label) => `<a href="${href}" class="button-gradient w-inline-block"><div class="label margins">${esc(label)}</div></a>`;
const frame = (src, alt, extra = "") =>
  `<div class="c2-frame${extra}"><div class="c2-frame-bar" aria-hidden="true"><i></i><i></i><i></i></div><img src="${src}" alt="${esc(alt)}" loading="lazy"></div>`;
// Content listed in a project's "draft" array (placeholder copy) is left out of the
// generated pages until it is replaced and removed from that list.
const isDraft = (p, key) => (p.draft || []).includes(key);
const media = (R, p, fileName) => `${R}c2/media/work/${p.slug}/${fileName}`;

function closingSection(R, { label, lineA, lineB, primary, secondary, inner = "" }) {
  return `
  <section class="section light-grey last c2-close">
    ${inner}
    <div class="div-block-410">
      <div class="div-block-173">
        <div class="caption"><img src="${R}${ASSETS}6851b74d06e22e8841057b16_logo.png" loading="lazy" alt="" class="caption-icon"><div>${esc(label)}</div></div>
        <h2><span class="c2-line2"><span class="text-gradient c2-clone">${esc(lineA)}</span></span><span class="c2-line2">${esc(lineB)}</span></h2>
        <div class="div-block-411 c2-actions">${ctaButton(primary.href, primary.label)}${secondary ? outlineButton(secondary.href, secondary.label) : ""}</div>
      </div>
    </div>
  </section>`;
}

/* ---------------- Work index ---------------- */

function exhibitCard(p, R, href) {
  const tags = [p.industry, ...p.capabilities.map((c) => c.name)];
  return `
        <article class="c2-exhibit" data-c2-work data-tags="${esc(tags.join("|"))}" style="--c2-tint:${esc(p.client.brand)}">
          <a class="c2-exhibit-link" data-c2-transition href="${href}">
            <div class="c2-exhibit-copy">
              <div class="c2-exhibit-meta">${caption(p.industry)}<span class="c2-status">${esc(p.status)}</span></div>
              <div class="c2-exhibit-client"><span class="c2-logo-chip"><img src="${media(R, p, p.client.logo)}" alt="" loading="lazy"></span>${esc(p.client.name)}</div>
              <h2 class="c2-exhibit-title">${esc(p.project)}</h2>
              <p class="c2-exhibit-headline c2-spectrum">${esc(p.headline)}</p>
              ${p.partners && p.partners.featured ? `<p class="c2-exhibit-partners">${esc(p.client.name)}'s partners include <b>${p.partners.featured.map(esc).join(" · ")}</b></p>` : ""}
              <div class="tags_wrap">${p.capabilities.map((c) => `<div class="tag-solutions"><div>${esc(c.name)}</div></div>`).join("")}</div>
              <span class="c2-exhibit-cta">View case study <span aria-hidden="true">→</span></span>
            </div>
            <div class="c2-exhibit-stage">${frame(media(R, p, p.hero.src), p.hero.alt)}</div>
          </a>
        </article>`;
}

function workIndexBody(projects, R) {
  const industries = [...new Set(projects.map((p) => p.industry))];
  const filters =
    industries.length > 1
      ? `<div class="c2-filters" data-c2-filters role="group" aria-label="Filter by industry"><button type="button" data-filter="all" aria-pressed="true">All work</button>${industries
          .map((i) => `<button type="button" data-filter="${esc(i)}" aria-pressed="false">${esc(i)}</button>`)
          .join("")}</div>`
      : "";
  return `
<div class="c2 c2-work">
  <section class="c2-hero c2-hero--work">
    <div class="c2-hero-bloom" aria-hidden="true"></div>
    <div class="c2-hero-inner">
      <div class="title_2_20 gradient" data-c2-reveal>Selected Work</div>
      <h1 class="c2-h1" data-c2-reveal><span class="c2-line2">Built with our partners.</span><span class="c2-line2"><span class="c2-spectrum c2-clone">Proven in the field.</span></span></h1>
      <p class="body_16 text-grey-light c2-lede" data-c2-reveal>Platforms, products and AI systems Cosmiron has designed, engineered and shipped with the companies behind them.</p>
    </div>
  </section>

  <section class="c2-work-list" aria-label="Collaborations">
    <div class="c2-container">
      ${filters}
      <div class="c2-exhibits" data-c2-stagger>${projects.map((p) => exhibitCard(p, R, `${p.slug}/index.html`)).join("")}
      </div>
    </div>
  </section>
${closingSection(R, {
  label: "Start a collaboration",
  lineA: "Your product could be next.",
  lineB: "Let's build it together.",
  primary: { href: `${R}${CONTACT_PAGE}`, label: "Let's talk" },
})}
</div>`;
}

/* ---------------- Case study ---------------- */

// The client's own partners, attributed to the client. Logos scroll as a marquee (a
// duplicate, aria-hidden copy makes the loop seamless) above an industry breakdown.
function partnersSection(p, R) {
  const P = p.partners;
  if (!P || !P.list || !P.list.length) return "";
  const item = (x, duplicate) =>
    `<li class="c2-marquee-item"${duplicate ? ' aria-hidden="true"' : ""}><img src="${media(R, p, x.logo)}" alt="${duplicate ? "" : esc(x.name)}" loading="lazy"></li>`;
  const groups = Object.values(
    P.list.reduce((acc, x) => {
      (acc[x.industry] = acc[x.industry] || { name: x.industry, names: [] }).names.push(x.name);
      return acc;
    }, {}),
  );
  return `
  <section class="section white c2-section c2-partners">
    <div class="c2-container">
      <div class="c2-head" data-c2-reveal>
        ${caption("Who it serves", "light-grey")}
        <h2 class="c2-h3"><span class="c2-line2">${esc(P.title[0])}</span><span class="c2-line2"><span class="text-gradient c2-clone">${esc(P.title[1])}</span></span></h2>
        <p class="body_16 text-grey-light">${esc(P.body)}</p>
      </div>
    </div>
    <div class="c2-marquee" role="region" aria-label="${esc(p.client.name)} partners">
      <ul class="c2-marquee-track" role="list">${P.list.map((x) => item(x, false)).join("")}${P.list.map((x) => item(x, true)).join("")}</ul>
    </div>
    <div class="c2-container">
      <dl class="c2-industries" data-c2-stagger>${groups.map((g) => `<div><dt>${esc(g.name)}</dt><dd>${esc(g.names.join(", "))}</dd></div>`).join("")}</dl>
      ${P.source ? `<p class="c2-source">${esc(P.source)}</p>` : ""}
    </div>
  </section>`;
}

function caseStudyBody(p, R) {
  const check = `${R}${ASSETS}686cc068490683bbb3377d04_bullet-list.svg`;
  const cross = `${R}${ASSETS}686cc0f520a992816d8b15dc_bullet-list-cross.svg`;
  const hoverImage = `${R}${ASSETS}682c7cb62b8800a7594c5abd_hover_card_img.png`;
  const host = p.client.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const logo = media(R, p, p.client.logo);

  const capabilityCard = (c) => `
        <div class="case-card">
          <div class="card-initial">
            <div class="c2-card-top">${caption(c.name)}${c.phase ? `<span class="c2-card-phase">${esc(c.phase)}</span>` : ""}</div>
            <div class="div-block-593">
              <div class="div-block-495 gap-16">
                <div class="title_24 white">${esc(c.title)}</div>
                ${c.summary ? `<p class="c2-card-summary">${esc(c.summary)}</p>` : ""}
                ${c.tags && c.tags.length ? `<div class="c2-card-module"><span class="c2-card-label">${esc(c.tagsLabel || "Highlights")}</span><div class="c2-card-tags">${c.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div></div>` : ""}
                <ul role="list" class="list body_14 gap-10 text-grey-light-home">${c.roles.map((r) => `<li class="list-card"><div>${esc(r)}</div></li>`).join("")}</ul>
              </div>
              ${c.output ? `<div class="c2-card-output"><span class="c2-card-label">Delivered</span><span class="c2-card-output-value">${esc(c.output)}</span></div>` : ""}
            </div>
          </div>
          <img src="${hoverImage}" loading="lazy" alt="" class="image-140">
        </div>`;

  const quote =
    p.quote && !isDraft(p, "quote")
      ? `<figure class="c2-quote" data-c2-reveal><blockquote>${esc(p.quote.text)}</blockquote><figcaption>${esc(p.quote.by)}</figcaption></figure>`
      : "";

  return `
<div class="c2 c2-case" style="--c2-tint:${esc(p.client.brand)}">
  <section class="c2-hero c2-hero--case">
    <div class="c2-hero-bloom" aria-hidden="true"></div>
    <div class="c2-hero-inner">
      <a class="c2-back" data-c2-transition href="../index.html"><span aria-hidden="true">←</span> All work</a>
      <div class="title_2_20 gradient" data-c2-reveal>Case study · ${esc(p.industry)}</div>
      <h1 class="c2-h1" data-c2-reveal><span class="c2-line2">${esc(p.title[0])}</span><span class="c2-line2"><span class="c2-spectrum c2-clone">${esc(p.title[1])}</span></span></h1>
      <p class="body_16 text-grey-light c2-lede" data-c2-reveal>${esc(p.summary)}</p>
      <dl class="c2-facts" data-c2-reveal>
        <div><dt>Client</dt><dd><span class="c2-logo-chip"><img src="${logo}" alt="" loading="lazy"></span>${esc(p.client.name)}</dd></div>
        <div><dt>Industry</dt><dd>${esc(p.industry)}</dd></div>
        <div><dt>Region</dt><dd>${esc(p.client.region)}</dd></div>
        <div><dt>Since</dt><dd>${esc(p.since)}</dd></div>
        <div><dt>Status</dt><dd><span class="c2-status">${esc(p.status)}</span></dd></div>
        <div><dt>Website</dt><dd><a href="${esc(p.client.url)}" target="_blank" rel="noopener">${esc(host)}<span aria-hidden="true"> ↗</span></a></dd></div>
      </dl>
    </div>
    <div class="c2-hero-stage" data-c2-parallax="40">${frame(media(R, p, p.hero.src), p.hero.alt, " c2-frame--hero")}</div>
  </section>
  <div class="c2-bridge" aria-hidden="true"></div>
${partnersSection(p, R)}
  <section class="section white c2-section c2-challenge">
    <div class="c2-container">
      <div class="c2-head" data-c2-reveal>
        ${caption("The challenge", "light-grey")}
        <h2 class="c2-h3">${esc(p.context.title[0])}<br><span class="text-gradient">${esc(p.context.title[1])}</span></h2>
        <p class="body_16 text-grey-light">${esc(p.context.body)}</p>
      </div>
      <div class="c2-compare">
        <div class="c2-compare-col">
          <p class="c2-compare-label">Before</p>
          <div class="c2-cards" data-c2-stagger>${p.context.before.map((t) => `<div class="div-block-594"><img src="${cross}" loading="lazy" alt="" class="bullet-icon"><div>${esc(t)}</div></div>`).join("")}</div>
        </div>
        <div class="c2-mark" aria-hidden="true"><img src="${logo}" alt="" loading="lazy"></div>
        <div class="c2-compare-col">
          <p class="c2-compare-label">With Cosmiron</p>
          <div class="c2-cards" data-c2-stagger>${p.context.after.map((t) => `<div class="div-block-594"><img src="${check}" loading="lazy" alt="" class="bullet-icon"><div class="text-main">${esc(t)}</div></div>`).join("")}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="c2-owned">
    <div class="c2-container">
      ${
        p.why && !isDraft(p, "why")
          ? `<div class="c2-head" data-c2-reveal>
        ${caption("Why Cosmiron")}
        <p class="c2-statement">${esc(p.why)}</p>
      </div>`
          : ""
      }
      <div class="c2-head c2-head--flush" data-c2-reveal>
        <h2 class="c2-h3 white">One partner,<br><span class="text-gradient">from first workshop to production.</span></h2>
      </div>
    </div>
    <div class="crads-container c2-capabilities">
      <div class="div-block-439">${p.capabilities.map(capabilityCard).join("")}
      </div>
    </div>
  </section>

  <section class="c2-inside">
    <div class="c2-container c2-deliver">
      <div class="c2-deliver-head" data-c2-reveal>${caption("What we delivered")}</div>
      <ul role="list" class="c2-deliver-list" data-c2-stagger>${p.deliverables.map((d) => `<li><img src="${check}" alt="" class="bullet-icon" loading="lazy"><span>${esc(d)}</span></li>`).join("")}</ul>
    </div>
    <div class="c2-container c2-inside-grid">
      <div class="c2-inside-copy">
        <div data-c2-reveal>${caption("Inside the platform")}</div>
        <h2 class="c2-h3 white" data-c2-reveal>${esc(p.craft.title[0])}<br><span class="text-gradient">${esc(p.craft.title[1])}</span></h2>
        <p class="body_16 text-grey-light" data-c2-reveal>${esc(p.craft.body)}</p>
        <ul role="list" class="list body_14 gap-10 text-grey-light-home c2-features" data-c2-stagger>${p.features.map((f) => `<li class="list-card"><div>${esc(f)}</div></li>`).join("")}</ul>
      </div>
      <div class="c2-screens">${p.screens
        .map(
          (s) => `
        <figure class="c2-screen">${frame(media(R, p, s.src), s.alt)}<figcaption class="c2-screen-copy"><span class="title_24 white">${esc(s.title)}</span><span class="body_15 text-grey-light">${esc(s.caption)}</span></figcaption></figure>`,
        )
        .join("")}
      </div>
    </div>
  </section>

  <section class="c2-stack">
    <div class="c2-container">
      <div class="c2-head" data-c2-reveal>
        ${caption("Built with")}
        <h2 class="c2-h3 white">Modern, proven tools,<br><span class="text-gradient">chosen to last.</span></h2>
      </div>
      <div class="tags_wrap c2-tags" data-c2-stagger>${p.stack.map((t) => `<div class="tag-solutions"><div>${esc(t)}</div></div>`).join("")}</div>
      ${p.ai ? `<p class="body_15 text-grey-light c2-ai-note">Plus ${esc(p.ai)}.</p>` : ""}
    </div>
  </section>
${closingSection(R, {
  label: "Start a collaboration",
  lineA: "Have an operation like this?",
  lineB: "Let's build it together.",
  primary: { href: `${R}${CONTACT_PAGE}`, label: "Let's talk" },
  secondary: { href: "../index.html", label: "All work" },
  inner: `
    <div class="c2-container">
      <div class="c2-head c2-head--flush" data-c2-reveal>${caption("What changed", "")}</div>
      <p class="c2-outcome" data-c2-linefill>${esc(p.outcome)}</p>
      ${quote}
    </div>`,
})}
</div>`;
}

/* ---------------- additions inside existing pages ---------------- */

// Each addition lives between <!-- c2:name:start --> and <!-- c2:name:end --> markers,
// inserted immediately before a unique anchor. Re-running replaces only what is between
// the markers, so nothing else in the existing page is ever rewritten.
function inject(html, name, anchor, content) {
  const start = `<!-- c2:${name}:start -->`;
  const end = `<!-- c2:${name}:end -->`;
  const block = `${start}\n${content}\n${end}`;
  const at = html.indexOf(start);
  if (at >= 0) {
    const close = html.indexOf(end, at);
    if (close < 0) throw new Error(`c2:${name}: start marker without end marker`);
    return html.slice(0, at) + block + html.slice(close + end.length);
  }
  const count = html.split(anchor).length - 1;
  if (count !== 1) throw new Error(`c2:${name}: expected anchor ${anchor} exactly once, found ${count}`);
  return html.replace(anchor, `${block}\n${anchor}`);
}

function injectInto(file, blocks) {
  const before = read(file);
  let html = before;
  for (const [name, anchor, content] of blocks) html = inject(html, name, anchor, content);
  if (html !== before) write(file, html);
  console.log(`  additions   ${html !== before ? "updated  " : "unchanged"}        ${file}`);
}

function selectedWorkSection(projects, R) {
  if (!projects.length) return "";
  const lead = projects[0];
  const quote =
    lead.quote && !isDraft(lead, "quote")
      ? `<figure class="c2-quote" data-c2-reveal><blockquote>${esc(lead.quote.text)}</blockquote><figcaption>${esc(lead.quote.by)}</figcaption></figure>`
      : "";
  return `<div class="c2 c2-home-work">
  <section class="c2-section c2-selected" aria-label="Selected work">
    <div class="c2-container">
      <div class="c2-head" data-c2-reveal>
        ${caption("Selected work", "")}
        <h2 class="c2-h3"><span class="c2-line2">Real products.</span><span class="c2-line2"><span class="text-gradient c2-clone">Real partners.</span></span></h2>
        <p class="body_16 text-grey-light">A look at what Cosmiron has designed, engineered and shipped with the companies behind it.</p>
      </div>
      <div class="c2-exhibits" data-c2-stagger>${projects.map((p) => exhibitCard(p, R, `${R}work/${p.slug}/index.html`)).join("")}
      </div>
      ${quote}
      <div class="c2-selected-more">${outlineButton(`${R}work/index.html`, "See all work")}</div>
    </div>
  </section>
</div>`;
}

// tone matches the page's own section colour (e.g. "plum" on What we do).
function proofRow(projects, R, label, tone = "") {
  if (!projects.length) return "";
  return `<div class="c2 c2-proof-wrap">
  <section class="c2-proof${tone ? ` c2-proof--${tone}` : ""}" aria-label="${esc(label)}">
    <div class="c2-container">
      <div class="c2-proof-head" data-c2-reveal>${caption(label)}<p class="c2-proof-lede">See it working for a real partner.</p></div>
      <div class="c2-proof-list" data-c2-stagger>${projects
        .map(
          (p) => `
        <a class="c2-proof-item" data-c2-transition href="${R}work/${p.slug}/index.html" style="--c2-tint:${esc(p.client.brand)}">
          <span class="c2-logo-chip"><img src="${media(R, p, p.client.logo)}" alt="" loading="lazy"></span>
          <span class="c2-proof-copy"><span class="c2-proof-name">${esc(p.project)}</span><span class="c2-proof-line">${esc(p.headline)}</span></span>
          <span class="c2-proof-tags">${p.capabilities.map((c) => `<span>${esc(c.name)}</span>`).join("")}</span>
          <span class="c2-exhibit-cta">View case study <span aria-hidden="true">→</span></span>
        </a>`,
        )
        .join("")}
      </div>
    </div>
  </section>
</div>`;
}

function injectAdditions(projects) {
  const featured = projects.filter((p) => p.featured);
  const assets = (R) => [
    ["c2-styles", "</head>", `<link href="${R}c2/cosmiron-2.css" rel="stylesheet" type="text/css">`],
    ["c2-script", "</body>", `<script src="${R}c2/cosmiron-2.js"></script>`],
  ];
  const home = "index.html";
  injectInto(home, [...assets("./"), ["selected-work", '<section class="section light-grey last">', selectedWorkSection(featured, "./")]]);
  const what = "whatwedo-cosmiron/pages/what-we-do/index.html";
  injectInto(what, [...assets(rootPrefix(what)), ["built-with", '<section class="section custom_bg">', proofRow(featured, rootPrefix(what), "Built with these services", "plum")]]);
  const approach = "ourapproach/pages/our-approach/index.html";
  injectInto(approach, [...assets(rootPrefix(approach)), ["built-with", '<section class="section light-grey last">', proofRow(featured, rootPrefix(approach), "Built with this approach")]]);
}

/* ---------------- run ---------------- */

function loadProjects() {
  const dir = "c2/content/work";
  return readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const p = JSON.parse(read(`${dir}/${f}`));
      const missing = REQUIRED.filter((k) => p[k] === undefined || p[k] === "");
      if (missing.length) throw new Error(`${dir}/${f}: missing ${missing.join(", ")}`);
      return p;
    })
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
}

console.log("Cosmiron 2.0 build");
ensureWorkLinks();

const projects = loadProjects();
const workFile = "work/index.html";
write(
  workFile,
  shell({
    file: workFile,
    title: "Work | Cosmiron AI - Selected Collaborations and Products",
    description: "Platforms, products and AI systems Cosmiron AI has designed, engineered and shipped with its partners.",
    body: workIndexBody(projects, rootPrefix(workFile)),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Cosmiron AI: Selected Work",
      hasPart: projects.map((p) => ({ "@type": "CreativeWork", name: p.project })),
    },
  }),
);
console.log(`  page        written          ${workFile}`);

for (const p of projects) {
  const file = `work/${p.slug}/index.html`;
  write(
    file,
    shell({
      file,
      title: `${p.project} | Cosmiron AI Case Study`,
      description: p.summary,
      body: caseStudyBody(p, rootPrefix(file)),
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: p.project,
        description: p.summary,
        creator: { "@type": "Organization", name: "Cosmiron AI" },
        about: { "@type": "Organization", name: p.client.name, legalName: p.client.legal, url: p.client.url },
      },
    }),
  );
  console.log(`  page        written          ${file}`);
  if ((p.draft || []).length) console.log(`  draft       left out         ${p.slug}: ${p.draft.join(", ")}`);
}

injectAdditions(projects);
