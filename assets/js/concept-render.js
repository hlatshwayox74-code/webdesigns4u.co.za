/* =====================================================================
   CONCEPT RENDERER
   ---------------------------------------------------------------------
   WD4U_RenderConcept.page(concept, opts) -> a complete, standalone HTML
   page of the website template built by the concept engine.

   Used by: the chapter 07 preview (inside an iframe), the full-screen
   viewer (/concept.html) and the email function (HTML attachment).
   Runs in the browser and in Node. All visitor text is escaped.

   opts: { base: "https://site" (for the font), animate: true|false }
   ===================================================================== */
(function (root) {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const ICONS = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    plate: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
    crane: '<path d="M4 21V5h10M4 5l6-2 10 2M14 5v6M12 11h4v3h-4zM2 21h8"/>',
    wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3v6.5M4.5 15l5.3-1.8M19.5 15l-5.3-1.8"/>',
    hanger: '<path d="M12 7a2 2 0 1 1 2-2M12 7v2L3 16h18l-9-7"/>',
    bag: '<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
    spark: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    dumbbell: '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="1"/><path d="M9 7V5h6v2M3 12h18"/>',
    bed: '<path d="M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11.5" r="1.5"/>',
    car: '<path d="M5 16l1.5-5h11L19 16M3 16h18v3H3zM7 19v1M17 19v1"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    wa: '<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>'
  };
  const icon = (k, cls) => `<svg class="${cls || "ic"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.star}</svg>`;
  const ph = (c, label, cls) => `<div class="ph ${cls || ""}" role="img" aria-label="${esc(label)}">${icon(c.icon, "ph__ic")}<span class="ph__cap">${esc(label)}</span></div>`;

  // The research "edge", built into the hero for each niche.
  const HERO_BAR = {
    search: { fields: ["Location", "Property type", "Max price"], go: "Search homes" },
    menu: { fields: ["Date", "Time", "Guests"], go: "Book a table" },
    stay: { fields: ["Check-in", "Check-out", "Guests"], go: "Check availability" },
    service: { fields: ["Your vehicle", "Service", "Date"], go: "Get my price" },
    programmes: { fields: ["Subject", "Grade"], go: "Book a free trial" },
    products: { fields: ["What are you shopping for?", "Budget"], go: "Find it" },
    packages: { fields: ["Package", "Area"], go: "Book first lesson" },
    treatments: { fields: ["Treatment", "Date"], go: "Book now" },
    schedule: { fields: ["Class", "Day"], go: "Book free session" }
  };

  function heroBar(c) {
    const b = HERO_BAR[c.module.type]; if (!b) return "";
    return `<form class="bar" onsubmit="return false" aria-label="${esc(b.go)}">${b.fields.map(f => `<label class="bar__f"><span>${esc(f)}</span><i aria-hidden="true">Select</i></label>`).join("")}<button class="btn btn--acc" type="button">${esc(b.go)}</button></form>`;
  }

  function moduleHTML(c) {
    const m = c.module, it = m.items;
    switch (m.type) {
      case "menu":
        return `<div class="menu">${it.map(x => `<div class="menu__row"><p class="menu__t"><b>${esc(x.t)}</b><span class="menu__dots" aria-hidden="true"></span><b>${esc(x.p)}</b></p><p class="muted">${esc(x.d)}</p></div>`).join("")}</div>`;
      case "packages":
        return `<div class="grid g3">${it.map(x => `<div class="card pkg${x.hot ? " pkg--hot" : ""}">${x.hot ? '<span class="tag">Most popular</span>' : ""}<p class="pkg__t">${esc(x.t)}</p><p class="pkg__p">${esc(x.p)}</p><p class="muted">${esc(x.d)}</p><span class="btn ${x.hot ? "btn--acc" : "btn--line"}">Book this package</span></div>`).join("")}</div>`;
      case "lookbook":
        return `<div class="look">${it.map((x, i) => `<figure class="look__i${i === 0 ? " look__i--big" : ""}">${ph(c, i === 0 ? "Campaign photo" : "Product worn")}<figcaption><b>${esc(x.t)}</b><span>${esc(x.p)}</span><small class="muted">${esc(x.d)}</small></figcaption></figure>`).join("")}</div>`;
      case "products":
        return `<div class="grid g4">${it.map(x => `<div class="card prod">${ph(c, "Product photo", "sq")}<p class="stars" aria-label="Customer rating">★★★★★</p><p><b>${esc(x.t)}</b></p><p class="muted">${esc(x.d)}</p><p class="prod__row"><b>${esc(x.p)}</b><span class="btn btn--acc btn--sm">Add to cart</span></p></div>`).join("")}</div>`;
      case "treatments":
      case "service":
        return `<div class="list">${it.map(x => `<div class="list__row"><div><p><b>${esc(x.t)}</b></p><p class="muted">${esc(x.d)}</p></div><p class="list__p"><b>${esc(x.p)}</b><span class="btn btn--line btn--sm">Book</span></p></div>`).join("")}</div>`;
      case "schedule":
        return `<div class="list">${it.map(x => `<div class="list__row"><p class="sched__t"><b>${esc(x.t)}</b></p><p class="muted grow">${esc(x.d)}</p><span class="btn btn--line btn--sm">${esc(x.p)}</span></div>`).join("")}</div>`;
      default: // search, stay, projects, programmes, expertise, generic
        return `<div class="grid g3">${it.map(x => `<div class="card">${["search", "stay", "projects"].includes(m.type) ? ph(c, m.type === "projects" ? "Project photo" : "Your photo", "wide") : `<span class="card__ic">${icon(c.icon)}</span>`}<p class="card__t"><b>${esc(x.t)}</b></p><p class="muted">${esc(x.d)}</p><p class="card__p">${esc(x.p)}</p></div>`).join("")}</div>`;
    }
  }

  function heroHTML(c) {
    const btns = `<div class="hero__btns"><span class="btn btn--acc btn--lg">${esc(c.cta)}</span><span class="btn btn--line btn--lg">${esc(c.secondaryCta)}</span></div>`;
    const copy = `<h1 class="h1">${esc(c.headline)}</h1><p class="lede">${esc(c.tagline)}</p>${btns}`;
    if (c.layout === "overlay") return `<section class="sec hero hero--overlay" style="--i:1">${ph(c, "Hero photo or video", "hero__bg")}<div class="hero__copy">${copy}</div>${heroBar(c)}</section>`;
    if (c.layout === "stacked") return `<section class="sec hero hero--stacked" style="--i:1"><div class="hero__copy">${copy}</div>${heroBar(c)}${ph(c, "Hero photo or video", "hero__wide")}</section>`;
    return `<section class="sec hero hero--split" style="--i:1"><div class="hero__copy">${copy}${heroBar(c)}</div>${ph(c, "Hero photo or video", "hero__img")}</section>`;
  }

  function css(c, base) {
    const t = c.theme;
    const font = t.serif ? `Georgia, "Times New Roman", serif` : `"Archivo", "Helvetica Neue", Arial, sans-serif`;
    const ff = base && !t.serif ? `@font-face{font-family:"Archivo";src:url("${base}/assets/fonts/archivo-var.woff2") format("woff2");font-weight:100 900;font-stretch:62% 125%;font-display:swap}` : "";
    return `${ff}
:root{--bg:${t.bg};--fg:${t.fg};--acc:${t.accent};--sf:${t.surface};--r:${t.radius};--wd:${t.wdth};--wg:${t.wght};--tr:${t.track};--up:${t.upper ? "uppercase" : "none"};--font:${font};
--line:color-mix(in srgb,var(--fg) 16%,transparent);--mut:color-mix(in srgb,var(--fg) 64%,transparent);--on:${onColor(t.accent)}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font);font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased}
p{margin:0}h1,h2{margin:0}.muted{color:var(--mut);font-size:14px}.grow{flex:1}
.wrap{max-width:1200px;margin:0 auto;padding:0 40px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 20px;border-radius:var(--r);font-weight:700;font-size:15px;white-space:nowrap;cursor:pointer;border:1px solid transparent;font-family:inherit}
.btn--acc{background:var(--acc);color:var(--on)}.btn--line{border-color:var(--line);color:var(--fg)}.btn--lg{min-height:52px;padding:0 26px;font-size:16px}.btn--sm{min-height:36px;padding:0 14px;font-size:13px}
.ic{width:22px;height:22px}
.nav{display:flex;align-items:center;gap:28px;padding:22px 40px;max-width:1280px;margin:0 auto}
.nav__logo{margin-right:auto;font-weight:var(--wg);font-variation-settings:"wdth" var(--wd);letter-spacing:var(--tr);text-transform:var(--up);font-size:20px}
.nav a{color:var(--fg);text-decoration:none;font-size:15px;opacity:.85}.nav__burger{display:none}
.h1{font-weight:var(--wg);font-variation-settings:"wdth" var(--wd);letter-spacing:var(--tr);text-transform:var(--up);font-size:clamp(38px,5.4vw,72px);line-height:.98}
.h2{font-weight:var(--wg);font-variation-settings:"wdth" var(--wd);letter-spacing:var(--tr);text-transform:var(--up);font-size:clamp(28px,3.2vw,44px);line-height:1.02;margin-bottom:28px}
.lede{font-size:clamp(17px,1.5vw,20px);color:var(--mut);max-width:34ch;margin-top:18px}
.hero__btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.ph{position:relative;overflow:hidden;border-radius:var(--r);background:radial-gradient(120% 90% at 30% 20%,color-mix(in srgb,var(--acc) 34%,var(--sf)) 0%,var(--sf) 62%),var(--sf);border:1px solid var(--line);display:grid;place-items:center;min-height:120px}
.ph__ic{width:30%;max-width:120px;height:auto;aspect-ratio:1;color:color-mix(in srgb,var(--fg) 26%,transparent);stroke-width:1}
.ph__cap{position:absolute;left:12px;bottom:10px;font-size:12px;padding:3px 8px;border-radius:999px;background:color-mix(in srgb,var(--bg) 70%,transparent);color:var(--mut)}
.ph.sq{aspect-ratio:1;min-height:0}.ph.wide{aspect-ratio:16/10;min-height:0;margin-bottom:16px}
.hero{max-width:1280px;margin:0 auto;padding:40px 40px 72px}
.hero--split{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}.hero__img{min-height:460px;height:100%}
.hero--overlay{position:relative;padding:0 40px 40px;min-height:600px;display:flex;flex-direction:column;justify-content:flex-end}
.hero__bg{position:absolute;inset:0 40px 0 40px;min-height:0}.hero__bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 20%,color-mix(in srgb,var(--bg) 92%,transparent) 88%)}
.hero--overlay .hero__copy,.hero--overlay .bar{position:relative;z-index:1;margin-left:40px;margin-right:40px}.hero--overlay .hero__copy{padding:0 0 28px}
.hero--stacked{text-align:center}.hero--stacked .hero__copy{display:flex;flex-direction:column;align-items:center}.hero--stacked .lede{margin-left:auto;margin-right:auto}.hero--stacked .hero__btns{justify-content:center}.hero__wide{margin-top:34px;aspect-ratio:21/8;min-height:0}
.bar{display:flex;flex-wrap:wrap;gap:0;margin-top:30px;background:var(--sf);border:1px solid var(--line);border-radius:var(--r);padding:8px;align-items:stretch;box-shadow:0 18px 50px -24px rgba(0,0,0,.45)}
.hero--stacked .bar{max-width:900px;margin-left:auto;margin-right:auto}
.bar__f{flex:1 1 140px;display:grid;padding:8px 14px;border-right:1px solid var(--line);text-align:left}.bar__f span{font-size:12px;color:var(--mut)}.bar__f i{font-style:normal;font-weight:600;font-size:15px}
.bar .btn{margin-left:8px;align-self:center}
.sec{padding:84px 0;border-top:1px solid var(--line)}.sec.hero{border-top:0;padding:40px 40px 72px}.sec.hero--overlay{padding:0 40px 40px}
.grid{display:grid;gap:22px}.g3{grid-template-columns:repeat(3,1fr)}.g4{grid-template-columns:repeat(4,1fr)}
.card{background:var(--sf);border:1px solid var(--line);border-radius:var(--r);padding:20px;display:flex;flex-direction:column;gap:6px;position:relative}
.card__ic{color:var(--acc);margin-bottom:10px}.card__t{font-size:18px}.card__p{margin-top:auto;padding-top:12px;font-weight:700;color:var(--acc)}
.pkg{padding:28px;gap:10px}.pkg__t{font-size:15px;color:var(--mut);font-weight:700}.pkg__p{font-size:34px;font-weight:var(--wg);font-variation-settings:"wdth" var(--wd)}.pkg .btn{margin-top:14px}
.pkg--hot{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc) inset}.tag{position:absolute;top:-11px;left:24px;background:var(--acc);color:var(--on);font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px}
.menu{display:grid;grid-template-columns:1fr 1fr;gap:26px 56px}.menu__t{display:flex;align-items:baseline;gap:10px;font-size:18px}.menu__dots{flex:1;border-bottom:1px dotted var(--line);transform:translateY(-4px)}
.look{display:grid;grid-template-columns:1.3fr 1fr 1fr;grid-template-rows:auto auto;gap:22px}.look__i{margin:0;display:flex;flex-direction:column;gap:10px}.look__i .ph{aspect-ratio:3/4;min-height:0}
.look__i--big{grid-row:span 2}.look__i:nth-child(4){grid-column:span 2}.look__i:nth-child(4) .ph{aspect-ratio:16/7}.look__i--big .ph{aspect-ratio:auto;flex:1}.look figcaption{display:grid;grid-template-columns:1fr auto;gap:2px 10px}.look figcaption small{grid-column:1/-1}
.prod{gap:4px}.prod .ph{margin-bottom:12px}.stars{color:var(--acc);letter-spacing:2px;font-size:13px}.prod__row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px}
.list{display:grid;border-top:1px solid var(--line)}.list__row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 4px;border-bottom:1px solid var(--line)}.list__p{display:flex;align-items:center;gap:16px}.sched__t{min-width:120px}
.proof{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.proof__i{display:flex;gap:12px;align-items:flex-start}.proof__i .ic{color:var(--acc);flex:none}
.reviews{margin-top:34px;padding:22px;border:1px dashed var(--line);border-radius:var(--r);display:flex;align-items:center;gap:14px;color:var(--mut)}.reviews b{color:var(--acc);letter-spacing:2px}
.cta{background:var(--acc);color:var(--on);border-radius:var(--r);padding:56px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.cta .h2{margin:0;color:var(--on)}.cta .btn--acc{background:var(--on);color:var(--acc)}.cta .btn--line{border-color:color-mix(in srgb,var(--on) 40%,transparent);color:var(--on)}.cta .btns{display:flex;gap:12px;flex-wrap:wrap}
.foot{padding:48px 0 60px;border-top:1px solid var(--line);color:var(--mut);font-size:14px}.foot__row{display:flex;flex-wrap:wrap;gap:12px 28px;align-items:center}.foot__name{color:var(--fg);font-weight:700;margin-right:auto}
.note{margin-top:26px;font-size:12px;opacity:.75}
@media (max-width:760px){
 .wrap{padding:0 20px}.nav{padding:16px 20px;gap:14px}.nav a,.nav .btn{display:none}.nav__burger{display:block}
 .hero{padding:16px 20px 48px}.hero--split{grid-template-columns:1fr;gap:26px}.hero__img{min-height:240px;order:-1}
 .hero--overlay{padding:0 0 24px;min-height:560px}.hero__bg{inset:0}.hero--overlay .hero__copy,.hero--overlay .bar{margin-left:20px;margin-right:20px}
 .hero__wide{aspect-ratio:4/3}.lede{max-width:none}
 .bar{flex-direction:column;padding:6px}.bar__f{border-right:0;border-bottom:1px solid var(--line);flex:none}.bar .btn{margin:8px 0 2px;width:100%}
 .sec{padding:56px 0}.sec.hero{padding:16px 20px 48px}.sec.hero--overlay{padding:0 0 24px}.look__i:nth-child(4){grid-column:1/-1}.g3,.g4,.proof,.menu{grid-template-columns:1fr}.g4{grid-template-columns:1fr 1fr}
 .look{grid-template-columns:1fr 1fr}.look__i--big{grid-column:1/-1;grid-row:auto}.look__i--big .ph{aspect-ratio:4/3}
 .list__row{flex-wrap:wrap}.cta{padding:32px 24px}
}
.anim .sec,.anim .nav{opacity:0;transform:translateY(14px);animation:rise .7s cubic-bezier(.2,.7,0,1) forwards;animation-delay:calc(var(--i,0)*.38s + .1s)}
@keyframes rise{to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.anim .sec,.anim .nav{animation:none;opacity:1;transform:none}}`;
  }

  // Readable text colour on the accent.
  function onColor(hex) {
    const h = String(hex).replace("#", ""); if (h.length !== 6) return "#ffffff";
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.4 ? "#0b0b0b" : "#ffffff";
  }

  function page(c, opts) {
    opts = opts || {};
    const name = esc(c.name);
    return `<!doctype html>
<html lang="en-ZA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>${name} | Website concept ${esc(c.id)}</title><style>${css(c, opts.base || "")}</style></head>
<body class="${opts.animate ? "anim" : ""}">
<header class="nav" style="--i:0"><span class="nav__logo">${name}</span>${c.nav.map(n => `<a href="#">${esc(n)}</a>`).join("")}<span class="btn btn--acc">${esc(c.cta)}</span>${icon("menu", "ic nav__burger")}</header>
${heroHTML(c)}
<section class="sec" style="--i:2"><div class="wrap"><h2 class="h2">${esc(c.module.title)}</h2>${moduleHTML(c)}</div></section>
<section class="sec" style="--i:3"><div class="wrap"><h2 class="h2">Why ${name}</h2><div class="proof">${c.proof.map(p => `<div class="proof__i">${icon("check")}<p><b>${esc(p)}</b></p></div>`).join("")}</div><div class="reviews"><b>★★★★★</b><span>Your Google reviews, shown live on the page.</span></div></div></section>
<section class="sec" style="--i:4"><div class="wrap"><div class="cta"><h2 class="h2">Ready when you are.</h2><div class="btns"><span class="btn btn--acc btn--lg">${esc(c.cta)}</span><span class="btn btn--line btn--lg">${icon("wa", "ic")}WhatsApp us</span></div></div></div></section>
<footer class="sec foot" style="--i:5"><div class="wrap"><div class="foot__row"><span class="foot__name">${name}</span>${c.nav.map(n => `<span>${esc(n)}</span>`).join("")}<span>WhatsApp</span><span>Call</span><span>Email</span></div>
<p class="note">Concept ${esc(c.id)} · ${esc(c.category)} · ${esc(c.style)} feel · ${esc(c.layout)} layout. Designed by Web Designs4U. Photos, prices and copy are placeholders until we build it with you.</p></div></footer>
</body></html>`;
  }

  root.WD4U_RenderConcept = { page, onColor, esc };
})(typeof window !== "undefined" ? window : globalThis);
