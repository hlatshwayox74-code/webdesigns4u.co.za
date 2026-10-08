/* =====================================================================
   WEB DESIGNS4U  |  EXPERIENCE ENGINE
   Modules (in order): Media, Store, Intro, Scroll engine + chapters,
   Personalisation, Concept preview, Integrations, Contact, Layers,
   Intake, Cursor, Sound, Init.
   ===================================================================== */
(function () {
  "use strict";
  const C = window.WD4U_CONFIG;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOBILE_Q = "(max-width: 820px), (orientation: portrait) and (max-width: 1100px)";
  const isMobile = () => matchMedia(MOBILE_Q).matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const Sound = window.WD4U_Sound;
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const root = document.documentElement;
  const body = document.body;

  /* ================= MEDIA ================= */
  // Single-file previews ship videos inline; turn them into blob URLs.
  if (window.__WD4U_INLINE_RAW) {
    Object.keys(window.__WD4U_INLINE_RAW).forEach(k => {
      const raw = window.__WD4U_INLINE_RAW[k];
      try {
        const bin = atob(raw.v); const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        C.media[k] = { src: URL.createObjectURL(new Blob([bytes], { type: "video/mp4" })), poster: "data:image/jpeg;base64," + raw.p, mobile: "" };
      } catch (e) { console.warn("[media] inline decode failed", k, e); }
    });
  }
  const media = (key) => C.media[key] || null;
  const srcFor = (key) => { const m = media(key); if (!m) return ""; return (isMobile() && m.mobile) ? m.mobile : m.src; };
  const posterFor = (key) => (media(key) || {}).poster || "";
  const autoplayOK = !reduce && !saveData;

  const videos = $$("video[data-media]");
  videos.forEach(v => { const p = posterFor(v.dataset.media); if (p) v.poster = p; });
  function ensureSrc(v) { if (!v.dataset.loaded) { const s = srcFor(v.dataset.media); if (s) { v.src = s; v.dataset.loaded = "1"; } } }
  // Inline previews: if the host blocks blob: media, fall back to a data: URI once.
  videos.forEach(v => v.addEventListener("error", () => {
    const raw = window.__WD4U_INLINE_RAW && window.__WD4U_INLINE_RAW[v.dataset.media];
    if (raw && v.src.startsWith("blob:") && !v.dataset.fallback) { v.dataset.fallback = "1"; v.src = "data:video/mp4;base64," + raw.v; if (v._visible) playVid(v); }
  }));
  function playVid(v) {
    if (!autoplayOK) return;
    ensureSrc(v);
    const pr = v.play(); if (pr && pr.catch) pr.catch(() => {});
  }
  const vidIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      const v = en.target;
      v._visible = en.isIntersecting;
      if (en.isIntersecting) {
        if (v.dataset.stage && !v.classList.contains("on")) { ensureSrc(v); return; }
        playVid(v);
      } else if (!v.paused) v.pause();
    });
  }, { rootMargin: "25% 0px" });
  videos.forEach(v => vidIO.observe(v));

  $$("[data-poster-of]").forEach(el => { const p = posterFor(el.dataset.posterOf); if (p) el.style.backgroundImage = `url("${p}")`; });

  // Ambient layer (blurred poster of the current chapter)
  const ambSlots = $$(".ambient__img"); let ambIdx = 0, ambKey = "";
  function setAmbient(key) {
    if (!key || key === ambKey) return; ambKey = key;
    const p = posterFor(key); if (!p) return;
    const next = ambSlots[ambIdx ^ 1], cur = ambSlots[ambIdx];
    next.style.backgroundImage = `url("${p}")`; next.classList.add("on"); cur.classList.remove("on");
    ambIdx ^= 1;
  }

  /* ================= STORE ================= */
  const STATE_KEY = "wd4u.state";
  const defaults = () => ({ entered: false, business: { name: "", type: "", goals: [], style: "", websiteType: "" }, contact: { name: "", email: "", phone: "", whatsapp: "" }, progress: 0 });
  const Store = {
    state: (() => { try { const s = JSON.parse(localStorage.getItem(STATE_KEY) || "null"); return s ? Object.assign(defaults(), s, { entered: false }) : defaults(); } catch (e) { return defaults(); } })(),
    subs: [],
    set(patch) {
      ["business", "contact"].forEach(k => { if (patch[k]) this.state[k] = Object.assign({}, this.state[k], patch[k]); });
      Object.keys(patch).forEach(k => { if (k !== "business" && k !== "contact") this.state[k] = patch[k]; });
      try { localStorage.setItem(STATE_KEY, JSON.stringify(this.state)); } catch (e) {}
      this.subs.forEach(fn => fn(this.state));
    },
    on(fn) { this.subs.push(fn); }
  };
  window.WD4U_State = Store; // handy for debugging and future integrations

  const nameEls = $$("[data-bind-name]");
  nameEls.forEach(el => { if (!el.dataset.fallback) el.dataset.fallback = el.textContent; });
  const slug = (s) => (s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "") || "yourbusiness";

  function bindState(s) {
    const name = (s.business.name || "").trim();
    body.classList.toggle("has-name", !!name);
    nameEls.forEach(el => { el.textContent = name || el.dataset.fallback; });
    $$("[data-bind-slug]").forEach(el => { el.textContent = slug(name); });
    const tags = { name: name || "Your business", category: s.business.type || "Other", style: s.business.style || "Premium", goal: (s.business.goals && s.business.goals.length) ? s.business.goals.join(", ") : "Get more customers" };
    $$("[data-tag]").forEach(el => { el.textContent = tags[el.dataset.tag]; });
    fitName();
  }
  Store.on(bindState);
  // Keep chapter 06 controls in step with edits made elsewhere (intake, "Try another feel").
  Store.on(st => {
    const b = st.business, n = $("#you-name");
    if (n && document.activeElement !== n && n.value !== (b.name || "")) n.value = b.name || "";
    $$('input[name="you-type"]').forEach(i => i.checked = i.value === b.type);
    $$('input[name="you-goals"]').forEach(i => i.checked = (b.goals || []).includes(i.value));
    $$('input[name="you-style"]').forEach(i => i.checked = i.value === b.style);
  });

  // Long business names shrink to fit their line instead of overflowing.
  function fitName() {
    $$("[data-fit]").forEach(el => {
      el.style.fontSize = "";
      const avail = el.clientWidth, w = el.scrollWidth;
      if (avail > 0 && w > avail) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * avail / w * 0.98) + "px";
    });
  }

  /* ================= INTRO ================= */
  const intro = $("#intro");
  const sets = $$(".intro__set", intro);
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  let entered = false;

  function showSet(i) { sets.forEach((s, j) => s.classList.toggle("on", i === j)); }

  async function runIntro() {
    const heroV = $("video", intro);
    if (autoplayOK) { ensureSrc(heroV); heroV.play().catch(() => {}); }
    else { ensureSrc(heroV); }
    if (reduce) { intro.classList.add("is-ready"); showSet(2); intro.classList.add("is-gate"); $("#count").textContent = "100"; return; }
    const count = $("#count"); const t0 = performance.now(); const dur = 1700;
    await new Promise(res => {
      (function step(t) {
        const p = clamp((t - t0) / dur, 0, 1);
        count.textContent = Math.round((1 - Math.pow(1 - p, 3)) * 100);
        if (p < 1 && !entered) requestAnimationFrame(step); else res();
      })(t0);
    });
    if (entered) return;
    intro.classList.add("is-ready");
    await wait(400); if (entered) return; showSet(0);
    await wait(3000); if (entered) return; showSet(1);
    await wait(2600); if (entered) return; showSet(2);
    await wait(700); if (entered) return; intro.classList.add("is-gate");
  }

  function enter(skip) {
    if (entered) return; entered = true;
    Store.set({ entered: true });
    intro.classList.add("is-gate");
    if (!skip && !reduce) { Sound.whoosh(); intro.classList.add("is-leaving"); }
    const delay = (skip || reduce) ? 0 : 900;
    setTimeout(() => {
      body.classList.remove("is-locked"); body.classList.add("is-entered");
      intro.classList.add("is-gone");
      window.scrollTo(0, 0); measure(); onScroll();
      $("#main").focus({ preventScroll: true });
    }, delay);
    setTimeout(() => { const v = $("video", intro); v.pause(); intro.setAttribute("hidden", ""); }, delay + 1800);
  }

  // Press-and-hold initiation (keyboard: Enter or Space).
  (function holdButton() {
    const btn = $("#initiate"); let raf = 0, start = 0, holding = false; const HOLD = 950;
    const set = (v) => btn.style.setProperty("--hold", v);
    function tick(t) {
      if (!holding) return;
      const p = clamp((t - start) / HOLD, 0, 1); set(p);
      if (p >= 1) { holding = false; enter(false); return; }
      raf = requestAnimationFrame(tick);
    }
    btn.addEventListener("pointerdown", e => { if (e.button !== 0) return; holding = true; start = performance.now(); btn.setPointerCapture && btn.setPointerCapture(e.pointerId); Sound.tick(); raf = requestAnimationFrame(tick); });
    const release = () => {
      if (!holding) return; holding = false; cancelAnimationFrame(raf);
      const from = parseFloat(btn.style.getPropertyValue("--hold")) || 0; const t0 = performance.now();
      $("#hold-hint").textContent = "Keep holding until the ring closes.";
      (function back(t) { const p = clamp((t - t0) / 300, 0, 1); set(from * (1 - p)); if (p < 1) requestAnimationFrame(back); })(t0);
    };
    btn.addEventListener("pointerup", release); btn.addEventListener("pointercancel", release); btn.addEventListener("lostpointercapture", release);
    btn.addEventListener("click", e => { if (e.detail === 0) enter(false); }); // keyboard activation
    btn.addEventListener("contextmenu", e => e.preventDefault());
    btn.dataset.cursor = "Hold";
  })();
  $("#skip-intro").addEventListener("click", () => enter(true));
  $(".skip").addEventListener("click", () => { if (!entered) enter(true); }); // skip link also clears the opening
  document.addEventListener("keydown", e => { if (!entered && intro.classList.contains("is-gate") && e.key === "Enter" && document.activeElement === body) enter(false); });

  /* ================= SCROLL ENGINE ================= */
  const pins = $$(".ch--pin").map(el => ({ el, id: el.id, items: $$("[data-range]", el).map(n => { const r = n.dataset.range.split(",").map(Number); return { n, a: r[0], b: r[1] }; }), top: 0, h: 0, p: -1 }));
  const chapters = $$("[data-num]");
  const rail = $(".rail span");
  let vh = innerHeight, current = null;

  function measure() {
    vh = innerHeight;
    pins.forEach(p => { const r = p.el.getBoundingClientRect(); p.top = r.top + scrollY; p.h = p.el.offsetHeight; });
  }

  const updaters = {};
  function onScroll() {
    const y = scrollY;
    pins.forEach(pin => {
      const span = Math.max(1, pin.h - vh);
      const p = clamp((y - pin.top) / span, 0, 1);
      if (p === pin.p) return;
      pin.p = p;
      pin.items.forEach(it => it.n.classList.toggle("on", p >= it.a && p < it.b));
      if (updaters[pin.id]) updaters[pin.id](p, pin);
    });
    const docH = document.documentElement.scrollHeight - vh;
    rail.parentElement.style.setProperty("--p", docH > 0 ? (y / docH).toFixed(4) : 0);

    // Current chapter: the one under the middle of the screen
    let cur = null;
    for (const c of chapters) { const r = c.getBoundingClientRect(); if (r.top <= vh * .5 && r.bottom > vh * .5) { cur = c; break; } }
    if (cur && cur !== current) setChapter(cur);
  }

  function setChapter(c) {
    current = c;
    $(".hud__num").textContent = c.dataset.num;
    $(".hud__title").textContent = c.dataset.title;
    setAmbient(c.dataset.media);
    setHeat();
    if (entered) Sound.tick();
  }
  function setHeat() {
    const base = current ? parseFloat(current.dataset.heat || 0) : 0;
    const named = !!(Store.state.business.name || "").trim();
    const heat = Math.max(base, named ? .3 : 0);
    root.style.setProperty("--heat", heat);
    root.style.setProperty("--warm", heat >= .36 ? 1 : 0); // cold internet until the business enters the story
  }
  Store.on(setHeat);

  let ticking = false;
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
  addEventListener("resize", () => { measure(); pins.forEach(p => p.p = -1); onScroll(); fitName(); layoutNoise(); });

  /* ---- CH01: noise ---- */
  const NOISE = ["Businesses","Search","Social","Mobile","Competitors","Customers","Attention","Noise","Sponsored","Open now?","Reviews","Compare prices","Directions","Swipe","Back","3 new tabs","Notifications","Near me","Best in town","Skip","Ads","Order online","Is this legit?","Book today"];
  const noise = $("#ch-internet .noise");
  function layoutNoise() {
    const mobile = isMobile();
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    noise.innerHTML = "";
    NOISE.forEach((w, i) => {
      const f = document.createElement("span");
      f.className = "frag" + (i < 8 || rnd() > .7 ? " is-hot" : "");
      let x, y, guard = 0;
      do { // keep the headline readable: fragments avoid the copy block
        x = mobile ? 4 + rnd() * 60 : 3 + rnd() * 62;
        y = mobile ? 10 + rnd() * 42 : 12 + rnd() * 76;
      } while (!mobile && x < 44 && y > 30 && y < 80 && ++guard < 40);
      const tx = mobile ? 50 : 78, ty = 50;
      f.style.cssText = `--x:${x}%;--y:${y}%;--s:${(12 + rnd() * 10).toFixed(1)}px;--o:${(.55 + rnd() * .45).toFixed(2)};--cx:${(tx - x).toFixed(1)}vw;--cy:${(ty - y).toFixed(1)}vh`;
      f.dataset.t = (i < 8 ? .02 + i * .035 : .06 + rnd() * .32).toFixed(3);
      f.textContent = w;
      noise.appendChild(f);
    });
    if (pins[0]) pins[0].p = -1;
  }
  layoutNoise();
  updaters["ch-internet"] = (p) => {
    const frags = noise.children;
    for (const f of frags) f.classList.toggle("on", p >= +f.dataset.t);
    noise.classList.toggle("collapse", p > .42);
  };

  /* ---- CH03: modes ---- */
  const demo = $("#ch-page .demo");
  const modeBtns = $$("#ch-page [data-mode]");
  updaters["ch-page"] = (p) => {
    const level = p < .06 ? -1 : Math.min(4, Math.floor((p - .06) / .9 * 5));
    for (let i = 0; i < 5; i++) demo.classList.toggle("l" + i, level >= i);
    modeBtns.forEach((b, i) => { b.classList.toggle("is-on", i <= level); b.setAttribute("aria-current", i === level ? "step" : "false"); });
  };
  modeBtns.forEach((b, i) => b.addEventListener("click", () => {
    const pin = pins.find(x => x.id === "ch-page"); measure();
    const p = .06 + (i + .5) / 5 * .9;
    scrollTo({ top: pin.top + p * (pin.h - vh), behavior: reduce ? "auto" : "smooth" });
    Sound.select();
  }));

  /* ---- CH05: template dissolving ---- */
  const tpl = $("#ch-story .tpl");
  const TPL = ["Header", "Hero image", "Headline", "Button", "Feature", "Feature", "Feature", "Testimonial", "Gallery", "Lorem ipsum", "Newsletter", "Footer"];
  let s2 = 3; const r2 = () => (s2 = (s2 * 9301 + 49297) % 233280) / 233280;
  const tplVec = TPL.map(label => { const i = document.createElement("i"); i.textContent = label; tpl.appendChild(i); return { i, dx: (r2() - .5) * 900, dy: (r2() - .7) * 700, rot: (r2() - .5) * 70 }; });
  updaters["ch-story"] = (p) => {
    const k = clamp((p - .08) / .7, 0, 1); const e = k * k;
    tplVec.forEach(v => { v.i.style.transform = `translate3d(${v.dx * e}px, ${v.dy * e}px, 0) rotate(${v.rot * e}deg)`; v.i.style.opacity = (1 - k).toFixed(3); });
  };

  /* ---- CH08: journey uses data-range only ---- */

  /* ---- CH09: process ---- */
  const proc = $("#ch-process .process"), track = $("#ch-process .process__track");
  const stepsEls = $$("li", track);
  const procVids = $$("#ch-process video[data-stage]");
  const procNow = $("#ch-process .process__now");
  function setStackVideo(list, idx) {
    list.forEach((v, i) => {
      const on = i === idx; v.classList.toggle("on", on);
      if (on && v._visible !== false) playVid(v); else if (!on && !v.paused) v.pause();
    });
  }
  updaters["ch-process"] = (p) => {
    const active = Math.min(6, Math.floor(clamp((p - .04) / .9, 0, .9999) * 7));
    stepsEls.forEach((li, i) => { li.classList.toggle("is-active", i === active); li.classList.toggle("is-done", i < active); });
    if (!isMobile()) {
      const max = Math.max(0, track.scrollWidth - proc.clientWidth);
      track.style.transform = `translate3d(${-max * clamp((p - .04) / .86, 0, 1)}px,0,0)`;
    }
    setStackVideo(procVids, active <= 1 ? 0 : active === 2 ? 1 : 2);
    procNow.textContent = $("b", stepsEls[active]).textContent;
  };

  /* ---- CH11: salesperson ---- */
  const salesVids = $$("#ch-sales video[data-stage]");
  updaters["ch-sales"] = (p) => setStackVideo(salesVids, p >= .88 ? 1 : 0);

  /* ================= CH04: TRANSFORMATION ================= */
  (function transform() {
    const cmp = $(".compare"), range = $("#tf-range"), runBtn = $("#tf-run");
    const before = $('[data-tf="before"]'), after = $('[data-tf="after"]');
    range.dataset.cursor = "Drag";
    let done = false;
    function setPos(v) {
      cmp.style.setProperty("--pos", v);
      range.value = v;
      const isAfter = v >= 90;
      before.classList.toggle("on", !isAfter); after.classList.toggle("on", isAfter);
      if (isAfter && !done) { done = true; Sound.select(); }
      if (!isAfter) done = false;
      runBtn.textContent = v >= 90 ? "Show the before" : "Transform it";
    }
    range.addEventListener("input", () => setPos(+range.value));
    runBtn.addEventListener("click", () => {
      const from = +range.value, to = from >= 90 ? 0 : 100;
      if (reduce) { setPos(to); return; }
      Sound.whoosh();
      const t0 = performance.now(), dur = 1500;
      (function step(t) { const k = clamp((t - t0) / dur, 0, 1); const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; setPos(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); })(t0);
    });
    $$(".seg [data-device]").forEach(b => b.addEventListener("click", () => {
      cmp.dataset.device = b.dataset.device;
      $$(".seg [data-device]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      Sound.select();
    }));
  })();

  /* ================= CH06: PERSONALISATION ================= */
  function chipHTML(group, kind, value, name) {
    return `<label class="chip"><input type="${kind}" name="${name}" value="${esc(value)}"><span>${esc(value)}</span></label>`;
  }
  (function personalise() {
    const lists = { type: C.intake.businessTypes, goals: C.personalise.goals, style: C.personalise.styles };
    $$("[data-chips]").forEach(box => {
      const g = box.dataset.chips; box.innerHTML = lists[g].map(v => chipHTML(g, box.dataset.kind, v, "you-" + g)).join("");
    });
    const form = $("#you-form"), nameIn = $("#you-name");
    const b = Store.state.business;
    nameIn.value = b.name || "";
    $$('input[name="you-type"]').forEach(i => i.checked = i.value === b.type);
    $$('input[name="you-goals"]').forEach(i => i.checked = (b.goals || []).includes(i.value));
    $$('input[name="you-style"]').forEach(i => i.checked = i.value === b.style);
    nameIn.addEventListener("input", () => Store.set({ business: { name: nameIn.value } }));
    form.addEventListener("change", e => {
      const t = e.target;
      if (t.name === "you-type") Store.set({ business: { type: t.value } });
      if (t.name === "you-goals") Store.set({ business: { goals: $$('input[name="you-goals"]:checked').map(i => i.value) } });
      if (t.name === "you-style") Store.set({ business: { style: t.value } });
      if (t.type !== "text") Sound.select();
    });
    form.addEventListener("submit", e => {
      e.preventDefault();
      if (!nameIn.value.trim()) { nameIn.focus(); nameIn.placeholder = "Type your business name first"; return; }
      $("#ch-preview").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      conceptDirty = true; setTimeout(() => buildConcept(), reduce ? 0 : 700);
    });
  })();

  /* ================= CH07: CONCEPT PREVIEW ================= */
  let conceptDirty = true, conceptVisible = false, variant = 0, buildToken = 0;
  const STYLE_POSTER = { Luxury: "final", Premium: "final", Editorial: "story", Creative: "story", Bold: "story", Futuristic: "network", Modern: "network", Corporate: "internet", Minimal: "alive", Custom: "hero" };
  const cxD = $('.cx[data-surface="desktop"]'), cxP = $('.cx[data-surface="phone"]'), cxLog = $(".concept__log");

  async function buildConcept() {
    const token = ++buildToken; conceptDirty = false;
    const b = Store.state.business;
    const cx = await window.WD4U_Concept.generate({ name: b.name, type: b.type, goals: b.goals, style: b.style }, variant);
    if (token !== buildToken) return;
    const t = cx.theme;
    [cxD, cxP].forEach(el => {
      el.style.setProperty("--cbg", t.bg); el.style.setProperty("--cfg", t.fg); el.style.setProperty("--cacc", t.accent);
      el.style.setProperty("--cwdth", t.wdth); el.style.setProperty("--cwght", t.wght); el.style.setProperty("--ctrack", t.track);
      el.style.setProperty("--cupper", t.upper ? "uppercase" : "none"); el.style.setProperty("--cradius", t.radius);
      el.style.setProperty("--cfont", t.serif ? 'Georgia, "Times New Roman", serif' : "var(--f)");
    });
    const poster = posterFor(STYLE_POSTER[cx.style] || "final");
    const img = poster ? `style="background-image:url('${poster}')"` : "";
    const n = esc(cx.name), s0 = cx.sections[0], s1 = cx.sections[1];
    cxD.innerHTML =
      `<div class="cx-nav piece" data-step="0"><b>${n}</b>${cx.nav.map(x => `<span>${esc(x)}</span>`).join("")}<span class="cx-btn piece" data-step="2">${esc(cx.cta)}</span></div>
       <div class="cx-hero"><div class="cx-hero__copy"><p class="cx-hero__h piece" data-step="1">${esc(cx.headline)}</p><p class="cx-hero__t piece" data-step="1">${esc(cx.tagline)}</p><span class="cx-btn piece" data-step="2" style="justify-self:start">${esc(cx.cta)}</span></div><div class="cx-hero__img piece" data-step="1" ${img}></div></div>
       <div class="cx-row"><div class="piece" data-step="3"><small>${esc(s0.title)}</small>${esc(s0.items[0])}</div><div class="piece" data-step="3"><small>${esc(s0.title)}</small>${esc(s0.items[1])}</div><div class="piece" data-step="4"><small>${esc(s1.title)}</small>${esc(cx.trust)}</div><div class="piece" data-step="5"><small>Contact</small>WhatsApp, call, email</div></div>`;
    cxP.innerHTML =
      `<div class="cx-nav piece" data-step="0"><b>${n}</b><span aria-hidden="true">☰</span></div>
       <div class="cx-p-hero"><div class="cx-hero__img piece" data-step="1" ${img}></div><div class="cx-hero__copy"><p class="cx-hero__h piece" data-step="1">${esc(cx.headline)}</p><span class="cx-btn piece" data-step="2">${esc(cx.cta)}</span></div></div>
       <div class="cx-p-list piece" data-step="3">${s0.items.slice(0, 3).map(x => `<span>${esc(x)}</span>`).join("")}</div>`;
    cxLog.innerHTML = cx.steps.map(s => `<li>${esc(s)}</li>`).join("");
    const logItems = $$("li", cxLog);
    const pieces = $$(".piece", cxD).concat($$(".piece", cxP));
    if (reduce) { pieces.forEach(x => x.classList.add("built")); logItems.forEach(x => x.classList.add("on")); return; }
    for (let step = 0; step < 6; step++) {
      await wait(step === 0 ? 150 : 380);
      if (token !== buildToken) return;
      pieces.filter(x => +x.dataset.step === step).forEach(x => x.classList.add("built"));
      if (logItems[step]) logItems[step].classList.add("on");
      Sound.tick();
    }
  }
  let conceptTimer = 0;
  Store.on(() => { conceptDirty = true; if (conceptVisible) { clearTimeout(conceptTimer); conceptTimer = setTimeout(buildConcept, 450); } });
  new IntersectionObserver(([en]) => { conceptVisible = en.isIntersecting; if (conceptVisible && conceptDirty) buildConcept(); }, { threshold: .25 }).observe($("#concept"));
  $("#cx-rebuild").addEventListener("click", () => { variant++; buildConcept(); });
  $("#cx-style").addEventListener("click", () => {
    const list = C.personalise.styles.filter(s => s !== "Custom");
    const cur = list.indexOf(Store.state.business.style || "Premium");
    const next = list[(cur + 1) % list.length];
    $$('input[name="you-style"]').forEach(i => i.checked = i.value === next);
    Store.set({ business: { style: next } });
    Sound.select();
  });

  /* ================= CH10: INTEGRATIONS HUB ================= */
  (function hub() {
    const ul = $(".hub__nodes"), svg = $(".hub__lines"), readout = $(".integ__readout");
    const items = C.integrations, N = items.length; const NS = "http://www.w3.org/2000/svg";
    items.forEach((it, i) => {
      const a = -Math.PI / 2 + i / N * Math.PI * 2;
      const x = 50 + 43 * Math.cos(a), y = 50 + 43 * Math.sin(a);
      const x0 = 50 + 17 * Math.cos(a), y0 = 50 + 17 * Math.sin(a);
      const li = document.createElement("li"); li.style.cssText = `--x:${x}%;--y:${y}%`;
      li.innerHTML = `<button type="button" aria-pressed="false">${esc(it.name)}</button>`;
      ul.appendChild(li);
      ["", "pulse"].forEach(cls => {
        const l = document.createElementNS(NS, "line");
        l.setAttribute("x1", x0 * 10); l.setAttribute("y1", y0 * 10); l.setAttribute("x2", x * 10); l.setAttribute("y2", y * 10);
        l.setAttribute("pathLength", "100"); if (cls) { l.setAttribute("class", cls); l.style.animationDelay = (-i * .37) + "s"; }
        l.dataset.i = i; svg.appendChild(l);
      });
      $("button", li).addEventListener("click", e => {
        $$("button", ul).forEach(b => b.setAttribute("aria-pressed", "false"));
        e.currentTarget.setAttribute("aria-pressed", "true");
        $$("line.pulse", svg).forEach(l => l.classList.toggle("is-sel", +l.dataset.i === i));
        readout.innerHTML = `<b>${esc(it.name)}</b><span>${esc(it.line)}</span>`;
        Sound.select();
      });
    });
  })();

  /* ================= CLOCK ================= */
  function clock() {
    let t;
    try { t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: C.brand.timezone }).format(new Date()); }
    catch (e) { t = new Date().toTimeString().slice(0, 5); }
    $$("[data-clock]").forEach(el => el.textContent = t);
  }
  $$("[data-tz-label]").forEach(el => el.textContent = C.brand.timezoneLabel);
  clock(); setInterval(clock, 15000);

  /* ================= CONTACT ================= */
  const CT = C.contact;
  const waBase = "https://wa.me/" + String(CT.whatsappIntl || "").replace(/\D/g, "");
  const waLink = (text) => waBase + (text ? "?text=" + encodeURIComponent(text) : "");
  const lines = (pairs) => pairs.filter(([, v]) => v && String(v).trim()).map(([k, v]) => `${k}: ${v}`).join("\n");
  const list = (v) => [].concat(v || []).filter(Boolean).join(", ");

  // Pre-filled WhatsApp from the journey so far (chapter 06 answers).
  function journeyWhatsApp() {
    const b = Store.state.business;
    if (!b.name && !b.type && !(b.goals || []).length) return CT.whatsappMessage;
    return "Hi Web Designs4U 👋\n\nI'd like to build a website for my business.\n\n" +
      lines([["Business Name", b.name], ["Business Type", b.type], ["My goal", list(b.goals)], ["Preferred style", b.style]]) +
      "\n\nI experienced the Web Designs4U website and I'd like to discuss building my website.";
  }
  // Pre-filled WhatsApp from a full enquiry: the visitor only presses Send.
  function leadWhatsApp(l) {
    return "Hi Web Designs4U 👋\n\nI'd like to build a website for my business.\n\n" +
      lines([["Business Name", l.businessName], ["Business Type", l.businessType], ["What we do", l.businessDescription], ["My goal", list(l.goals)], ["Looking for", l.websiteType], ["Preferred style", l.style], ["Existing website", l.existingWebsite], ["My name", l.name], ["Email", l.email], ["Phone", l.phone], ["Message", l.message]]) +
      "\n\nI experienced the Web Designs4U website and I'd like to discuss building my website.";
  }
  function leadMailto(l) {
    const body = "WEB DESIGNS4U | NEW WEBSITE ENQUIRY\n\n" +
      lines([["Name", l.name], ["Business", l.businessName], ["Business Type", l.businessType], ["What we do", l.businessDescription], ["Email", l.email], ["Phone / WhatsApp", l.phone], ["Website Goal", list(l.goals)], ["Looking for", l.websiteType], ["Website Style", l.style], ["Existing Website", l.existingWebsite], ["Message", l.message]]) +
      "\n\nSource: Web Designs4U Website";
    return `mailto:${CT.email}?subject=${encodeURIComponent("Website enquiry: " + (l.businessName || l.name || "new business"))}&body=${encodeURIComponent(body)}`;
  }
  function refreshJourneyLinks() { $$('[data-wa="journey"]').forEach(a => a.href = waLink(journeyWhatsApp())); }
  Store.on(refreshJourneyLinks);

  (function contact() {
    const rows = [];
    const tel = (intl, local) => "tel:" + (intl || (local || "").replace(/[^\d+]/g, ""));
    if (CT.whatsapp) rows.push({ k: "WhatsApp", v: CT.whatsapp, href: waLink(journeyWhatsApp()), ext: true, wa: true });
    if (CT.phone) rows.push({ k: "Call", v: CT.phone, href: tel(CT.phoneIntl, CT.phone) });
    if (CT.email) rows.push({ k: "Email", v: CT.email, href: "mailto:" + CT.email });
    if (CT.businessNumber) rows.push({ k: "Business number", v: CT.businessNumber, href: tel("", CT.businessNumber) });
    Object.keys(CT.social || {}).forEach(k => { if (CT.social[k]) rows.push({ k: k[0].toUpperCase() + k.slice(1), v: "Follow", href: CT.social[k], ext: true }); });
    const html = rows.map(r => `<li><a href="${esc(r.href)}"${r.ext ? ' target="_blank" rel="noopener"' : ""}${r.wa ? ' data-wa="journey"' : ""}><small>${esc(r.k)}</small><strong>${esc(r.v)}</strong></a></li>`).join("");
    $$(".contact-list").forEach(ul => ul.innerHTML = html);
    $(".contact__empty").hidden = rows.length > 0;
    $$("[data-cta-primary]").forEach(b => b.textContent = C.cta.primary);
    $$("[data-cta-supporting]").forEach(p => p.textContent = C.cta.supporting);
    refreshJourneyLinks();

    const form = $("#quick-form"), msg = $(".form-msg", form);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      if (!d.fullName.trim() || !d.reply.trim() || !d.message.trim()) { msg.textContent = "Add your name, a way to reply and a message."; return; }
      const btn = $("button[type=submit]", form); if (btn.disabled) return;
      btn.disabled = true; btn.textContent = "Building your connection…";
      try {
        const r = await window.WD4U_Leads.submit("contact", d);
        msg.textContent = r.preview ? "Preview mode: message not sent anywhere." : r.duplicate ? "We already have this message. We'll reply soon." : "Message sent. We'll reply soon.";
        form.reset(); Sound.chime();
      } catch (err) {
        msg.innerHTML = `Something interrupted the connection. <a href="${esc(waLink("Hi Web Designs4U 👋\n\n" + d.message + "\n\n" + d.fullName))}" target="_blank" rel="noopener">WhatsApp us instead → ${esc(CT.whatsapp)}</a>`;
      } finally { btn.disabled = false; btn.textContent = "Send message"; }
    });
  })();

  /* ================= LAYERS (menu, contact, intake) ================= */
  let openLayer = null, lastFocus = null;
  function openL(id, opts) {
    if (openLayer && openLayer.id !== id) closeL(true);
    const el = document.getElementById(id); if (!el) return;
    lastFocus = lastFocus || document.activeElement;
    el.hidden = false; openLayer = el; body.classList.add("layer-open");
    if (id === "intake") Intake.open(opts);
    const f = $("input:not([type=hidden]), textarea, button:not([data-close])", id === "intake" ? $(".step.on", el) || el : el) || $("button", el);
    setTimeout(() => f && f.focus(), 60);
    Sound.select();
  }
  function closeL(silent) {
    if (!openLayer) return;
    if (openLayer.id === "intake") Intake.close();
    openLayer.hidden = true; openLayer = null; body.classList.remove("layer-open");
    if (!silent && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }
  document.addEventListener("click", e => {
    const o = e.target.closest("[data-open]");
    if (o) { e.preventDefault(); openL(o.dataset.open, { intent: o.dataset.intent }); return; }
    const c = e.target.closest("[data-close]");
    if (c) { const href = c.getAttribute("href"); closeL(!!href); if (href) { e.preventDefault(); const t = $(href); t && t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); } }
  });
  document.addEventListener("keydown", e => {
    if (!openLayer) return;
    if (e.key === "Escape") { closeL(); return; }
    if (e.key === "Tab") { // focus trap
      const f = $$("a[href], button:not([disabled]), input:not([type=hidden]), textarea, select", openLayer).filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // Menu chapter index
  $(".menu__index").innerHTML = $$(".ch[data-num]").map(c => `<li><a href="#${c.id}" data-close><b>${c.dataset.num}</b>${esc(c.dataset.title)}</a></li>`).join("");

  /* ================= INTAKE: BUILD MY WEBSITE ================= */
  const Intake = (function () {
    const el = $("#intake"), form = $("#intake-form"), steps = $$(".step", form), TOTAL = steps.length;
    const back = $("#in-back"), next = $("#in-next"), msg = $(".intake__msg"), nav = $(".intake__nav");
    const done = $(".done", el), sendingEl = $(".sending", el), card = $(".journey-card", form);
    let step = 1, intent = "", sending = false, skip = new Set(), lastLead = null;
    const lists = { businessType: C.intake.businessTypes, goals: C.intake.goals, websiteType: C.intake.websiteTypes, style: C.intake.styles };
    $$("[data-ichips]", form).forEach(box => { const g = box.dataset.ichips; box.innerHTML = lists[g].map(v => chipHTML(g, box.dataset.kind, v, g)).join(""); });
    const f = (n) => form.elements[n];
    const checked = (name) => $$(`input[name="${name}"]:checked`, form).map(i => i.value);
    const flow = () => steps.map(s => +s.dataset.step).filter(n => !skip.has(n));
    const forName = $(".intake__for b", el);
    const setFor = () => { forName.textContent = f("businessName").value.trim() || "your website"; };
    f("businessName").addEventListener("input", () => { setFor(); Store.set({ business: { name: f("businessName").value } }); });

    const PHONE_OK = (v) => {
      const d = v.replace(/[\s().-]/g, "");
      if (/^\+\d{9,15}$/.test(d)) return true;      // international, e.g. +27 71 437 9593
      if (/^0\d{9}$/.test(d)) return true;            // South African local, e.g. 071 437 9593
      return /^\d{9,15}$/.test(d) && !d.startsWith("0");
    };
    const EMAIL_OK = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

    function renderCard() {
      const rows = [
        ["Business", f("businessName").value.trim(), 2], ["Type", checked("businessType")[0], 3],
        ["Goal", checked("goals").join(", "), 4], ["Looking for", checked("websiteType")[0], 5], ["Feel", checked("style")[0], 6]
      ].filter(r => r[1]);
      card.innerHTML = rows.length ? `<p>From your journey</p><dl>${rows.map(([k, v, n]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd><button type="button" data-goto="${n}">Edit</button></div>`).join("")}</dl>` : "";
    }
    card.addEventListener("click", e => { const b = e.target.closest("[data-goto]"); if (!b) return; const n = +b.dataset.goto; skip.delete(n); show(n); });

    function show(n) {
      step = n; msg.textContent = "";
      steps.forEach(s => s.classList.toggle("on", +s.dataset.step === step));
      const fl = flow(), pos = fl.indexOf(step) + 1;
      $(".intake__step", el).innerHTML = `Step <b>${pos}</b> of ${fl.length}`;
      $(".intake__bar", el).style.setProperty("--p", pos / fl.length);
      const first = fl[0];
      back.style.visibility = step === first ? "hidden" : "visible";
      next.textContent = step === fl[fl.length - 1] ? "Send my enquiry" : ([5, 6].includes(step) && !checked(step === 5 ? "websiteType" : "style").length ? "Skip" : "Continue");
      if (step === 7) renderCard();
      const target = $(step === 3 && checked("businessType").length ? "#in-desc" : "input:not([type=radio]):not([type=checkbox]), textarea", steps[step - 1]);
      if (target && el.contains(document.activeElement)) setTimeout(() => target.focus({ preventScroll: true }), 50);
      form.scrollTop = 0;
    }
    function go(dir) { const fl = flow(); const i = fl.indexOf(step) + dir; if (i >= 0 && i < fl.length) show(fl[i]); }

    function validate() {
      const say = (t, field) => { msg.textContent = t; if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); } return false; };
      $$("[aria-invalid]", form).forEach(x => x.removeAttribute("aria-invalid"));
      switch (step) {
        case 1: return f("name").value.trim() ? true : say("Tell us what to call you.", f("name"));
        case 2: return f("businessName").value.trim() ? true : say("Add your business name. A working name is fine.", f("businessName"));
        case 3:
          if (!checked("businessType").length) return say("Pick the closest match. Other is fine.");
          return f("businessDescription").value.trim().length >= 3 ? true : say("Add one line about what your business offers.", f("businessDescription"));
        case 4: return checked("goals").length ? true : say("Pick at least one thing your website should achieve.");
        case 7: {
          const email = f("email").value.trim(), phone = f("phone").value.trim();
          if (!email) return say("Add your email address.", f("email"));
          if (!EMAIL_OK(email)) return say("That email doesn't look right. Check for typos.", f("email"));
          if (!phone) return say("Add a phone or WhatsApp number.", f("phone"));
          if (!PHONE_OK(phone)) return say("That number doesn't look right. Use 071 234 5678 or +27 71 234 5678.", f("phone"));
          return true;
        }
        default: return true; // 5, 6, 8 are optional
      }
    }

    function collect() {
      const b = Store.state.business;
      return {
        name: f("name").value.trim(), businessName: f("businessName").value.trim(),
        businessType: checked("businessType")[0] || "", businessDescription: f("businessDescription").value.trim(),
        goals: checked("goals"), websiteType: checked("websiteType")[0] || "", style: checked("style")[0] || "",
        email: f("email").value.trim(), phone: f("phone").value.trim(), existingWebsite: f("existingWebsite").value.trim(),
        message: f("message").value.trim(), intent: intent || "build",
        personalised: { category: b.type || "", goals: b.goals || [], style: b.style || "" },
        "bot-field": f("bot-field").value
      };
    }

    function result(state, r) {
      done.dataset.state = state;
      $(".done__preview", done).hidden = !(r && r.preview);
      if (r && r.duplicate) $(".done__success .done__received", done).textContent = "We already have this enquiry. We'll be in touch shortly.";
      else $(".done__success .done__received", done).textContent = "Your enquiry has been received. We'll be in touch shortly.";
      $('[data-wa="lead"]', done).href = waLink(leadWhatsApp(lastLead));
      $('[data-mail="lead"]', done).href = leadMailto(lastLead);
      done.hidden = false; nav.hidden = true;
      if (state === "success") Sound.chime();
      setTimeout(() => $(".opt--wa", done).focus(), 60);
    }

    async function submit() {
      if (sending) return; // no double submissions
      sending = true; next.disabled = true; back.disabled = true;
      lastLead = collect();
      sendingEl.hidden = false; sendingEl.classList.remove("is-sent");
      const minShow = wait(reduce ? 0 : 1400);
      let r = null, failed = false;
      try { r = await window.WD4U_Leads.submit("build", lastLead); } catch (err) { failed = true; console.warn("[intake]", err); }
      await minShow;
      if (!failed) { sendingEl.classList.add("is-sent"); await wait(reduce ? 0 : 1000); }
      sendingEl.hidden = true;
      if (!failed) Store.set({ business: { name: lastLead.businessName, type: lastLead.businessType, goals: lastLead.goals, style: lastLead.style || Store.state.business.style, websiteType: lastLead.websiteType }, contact: { name: lastLead.name, email: lastLead.email, phone: lastLead.phone } });
      result(failed ? "error" : "success", r);
      sending = false; next.disabled = false; back.disabled = false;
    }

    next.addEventListener("click", () => { if (!validate()) return; const fl = flow(); if (step === fl[fl.length - 1]) submit(); else { go(1); Sound.tick(); } });
    back.addEventListener("click", () => go(-1));
    $(".done__retry", done).addEventListener("click", () => { done.hidden = true; nav.hidden = false; submit(); });
    form.addEventListener("submit", e => e.preventDefault());
    form.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      if (e.target.tagName === "TEXTAREA" && !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault(); next.click();
    });
    form.addEventListener("change", e => {
      const t = e.target; Sound.select();
      // Intake edits flow back into the journey state so the page and the form never disagree.
      if (t.name === "businessType") Store.set({ business: { type: t.value } });
      if (t.name === "goals") Store.set({ business: { goals: checked("goals") } });
      if (t.name === "style") Store.set({ business: { style: t.value } });
      if (t.name === "businessType") setTimeout(() => f("businessDescription").focus({ preventScroll: true }), 60);
      if (t.type === "radio" && [5, 6].includes(step)) setTimeout(() => { if (validate()) go(1); }, reduce ? 0 : 380);
      if ([5, 6].includes(step)) show(step);
    });

    return {
      open(opts) {
        intent = (opts && opts.intent) || "";
        if (!done.hidden && done.dataset.state === "success") form.reset();
        done.hidden = true; nav.hidden = false; sendingEl.hidden = true;
        const s = Store.state, b = s.business;
        // Carry the journey through. Answers already given are pre-filled and their steps skipped.
        skip = new Set();
        if (!f("name").value) f("name").value = s.contact.name || "";
        if (b.name) { f("businessName").value = b.name; skip.add(2); }
        if (!f("email").value) f("email").value = s.contact.email || "";
        if (!f("phone").value) f("phone").value = s.contact.phone || s.contact.whatsapp || "";
        if (b.type) $$('input[name="businessType"]', form).forEach(i => i.checked = i.value === b.type);
        if ((b.goals || []).length) $$('input[name="goals"]', form).forEach(i => i.checked = b.goals.includes(i.value));
        if (checked("goals").length) skip.add(4);
        if (b.style) $$('input[name="style"]', form).forEach(i => i.checked = i.value === b.style);
        if (checked("style").length) skip.add(6);
        setFor();
        show(1);
      },
      close() { if (!done.hidden && done.dataset.state === "success") { form.reset(); done.hidden = true; nav.hidden = false; } }
    };
  })();

  /* ================= CURSOR ================= */
  if (matchMedia("(pointer: fine)").matches && !reduce) {
    const cur = $(".cursor"), label = $(".cursor__label");
    let x = -100, y = -100, cx = -100, cy = -100;
    addEventListener("pointermove", e => { x = e.clientX; y = e.clientY; root.classList.add("has-cursor"); }, { passive: true });
    document.addEventListener("pointerleave", () => root.classList.remove("has-cursor"));
    document.addEventListener("pointerover", e => {
      const t = e.target.closest("a, button, label.chip, input, textarea, [data-cursor]");
      cur.classList.toggle("is-hover", !!t);
      label.textContent = t && t.dataset.cursor ? t.dataset.cursor : "";
    });
    (function loop() { cx += (x - cx) * .22; cy += (y - cy) * .22; cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`; requestAnimationFrame(loop); })();
  }

  /* ================= SOUND ================= */
  function syncSound() {
    const on = Sound.enabled;
    $$("[data-sound-toggle]").forEach(b => b.setAttribute("aria-pressed", String(on)));
    $$(".hud__sound-text").forEach(t => t.textContent = on ? "Sound on" : "Sound off");
    $$(".sound-switch__text").forEach(t => t.textContent = on ? "Sound on" : "Best with sound. Turn it on");
  }
  $$("[data-sound-toggle]").forEach(b => b.addEventListener("click", () => { Sound.toggle(); syncSound(); }));

  /* ================= INIT ================= */
  $("#year").textContent = new Date().getFullYear();
  bindState(Store.state);
  measure(); onScroll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); fitName(); });
  addEventListener("load", () => { measure(); onScroll(); });
  if (location.hash && location.hash.length > 1) enter(true); // deep links skip the opening
  else runIntro();
})();
