/* =====================================================================
   CONCEPT ENGINE
   ---------------------------------------------------------------------
   Turns the visitor's answers into a website concept.

   Today: deterministic. Same answers give the same concept, built from
   the category, goal and style libraries below. Nothing is faked as AI.

   Later: set WD4U_CONFIG.ai.endpoint. generate() will POST
     { business: { name, type, goals[], style } }
   and expects JSON with the same shape that build() returns:
     { name, category, style, theme{}, nav[], headline, tagline, cta,
       sections[{title, items[]}], trust, steps[] }
   If the endpoint fails, it falls back to build().
   ===================================================================== */
(function () {

  const CATEGORIES = {
    "Restaurant":            { noun: "table",        headline: "Come hungry. Leave planning the next visit.", tagline: "Seasonal plates, a room worth staying in.", services: ["Menu","Private dining","Takeaway","Events"], trust: "Reviewed by the people next to you" },
    "Construction":          { noun: "site visit",   headline: "Built properly. Handed over on time.",        tagline: "Residential and commercial builds, start to keys.", services: ["New builds","Renovations","Project management","Maintenance"], trust: "Registered, insured and on schedule" },
    "Driving School":        { noun: "lesson",       headline: "Learn to drive with confidence.",            tagline: "Patient instructors. Real road time. Licence ready.", services: ["Beginner lessons","Licence test prep","Refresher lessons","Code 8 and 10"], trust: "Pass rates parents ask about" },
    "Clothing":              { noun: "fitting",      headline: "Wear what you actually mean.",               tagline: "Small runs, made to last.", services: ["New collection","Essentials","Made to order","Gift cards"], trust: "Free exchanges on every order" },
    "Ecommerce":             { noun: "order",        headline: "Everything you came for, one tap away.",     tagline: "Fast delivery, easy returns.", services: ["Shop all","New in","Best sellers","Bundles"], trust: "Secure checkout, tracked delivery" },
    "Beauty":                { noun: "appointment",  headline: "Leave looking like your best day.",          tagline: "Skin, hair and nails by people who care.", services: ["Treatments","Hair","Nails","Packages"], trust: "Real clients, real results" },
    "Fitness":               { noun: "session",      headline: "Stronger starts on Monday. Or today.",       tagline: "Coaching that fits your week.", services: ["Personal training","Classes","Nutrition","Memberships"], trust: "Coaches with results you can see" },
    "Professional Services": { noun: "consultation", headline: "Clear advice. Decisions you can stand behind.", tagline: "Specialists who explain things properly.", services: ["Advisory","Compliance","Planning","Support"], trust: "Trusted by businesses across the region" },
    "Real Estate":           { noun: "viewing",      headline: "Find the place that feels like yours.",      tagline: "Homes and investments, honestly priced.", services: ["Buy","Sell","Rent","Valuations"], trust: "Local agents who know every street" },
    "Hospitality":           { noun: "stay",         headline: "Arrive. Exhale. Stay longer.",               tagline: "Rooms, views and service you'll talk about.", services: ["Rooms","Experiences","Dining","Special offers"], trust: "Guests come back. That says enough." },
    "Automotive":            { noun: "service",      headline: "Your car, handled properly.",                tagline: "Servicing, repairs and parts with straight answers.", services: ["Servicing","Repairs","Diagnostics","Parts"], trust: "Fixed right, priced upfront" },
    "Education":             { noun: "place",        headline: "Where learning finally clicks.",             tagline: "Teaching that meets each learner where they are.", services: ["Programmes","Tutoring","Enrolment","Resources"], trust: "Results families notice" },
    "Other":                 { noun: "call",         headline: "Exactly what you need, done properly.",      tagline: "A business people recommend by name.", services: ["Services","About","Pricing","Contact"], trust: "Recommended by the people we work with" }
  };

  // Chapter 06 goals and intake goals both map onto these intents.
  const GOAL_INTENT = {
    "Get more customers": "customers", "More customers": "customers",
    "Generate leads": "leads", "More enquiries": "leads",
    "Sell products": "sell", "More sales": "sell", "Online store": "sell",
    "Take bookings": "book", "More bookings": "book",
    "Build credibility": "trust", "Better credibility": "trust",
    "Showcase my business": "showcase",
    "Automate my business": "automate", "Automation": "automate",
    "Other": "other"
  };

  const CTA = {
    book:      (c) => `Book your ${c.noun}`,
    sell:      ()  => "Shop now",
    leads:     ()  => "Get a free quote",
    customers: ()  => "Get started",
    trust:     ()  => "See the work",
    showcase:  ()  => "Explore",
    automate:  (c) => `Book a ${c.noun} online`,
    other:     ()  => "Get in touch"
  };

  // Visual themes for the generated concept preview.
  const THEMES = {
    Luxury:     { bg: "#0d0b09", fg: "#efe6d8", accent: "#c9a46a", font: "Archivo", wdth: 112, wght: 300, track: "0.18em", upper: true,  radius: "0px",  serif: false },
    Premium:    { bg: "#0b0d10", fg: "#eef1f4", accent: "#ff7a2f", font: "Archivo", wdth: 100, wght: 600, track: "-0.01em", upper: false, radius: "2px", serif: false },
    Bold:       { bg: "#ff3d2e", fg: "#120707", accent: "#120707", font: "Archivo", wdth: 62,  wght: 900, track: "-0.02em", upper: true,  radius: "0px",  serif: false },
    Minimal:    { bg: "#f4f4f2", fg: "#141414", accent: "#141414", font: "Archivo", wdth: 100, wght: 400, track: "-0.01em", upper: false, radius: "0px",  serif: false },
    Modern:     { bg: "#f2f5f7", fg: "#0e1a22", accent: "#2b6cff", font: "Archivo", wdth: 92,  wght: 700, track: "-0.02em", upper: false, radius: "10px", serif: false },
    Futuristic: { bg: "#03070b", fg: "#dff6ff", accent: "#6fd3ff", font: "Archivo", wdth: 125, wght: 500, track: "0.08em", upper: true,  radius: "0px",  serif: false },
    Editorial:  { bg: "#f1ece4", fg: "#1b1714", accent: "#8a2d1b", font: "Georgia", wdth: 100, wght: 400, track: "-0.01em", upper: false, radius: "0px",  serif: true  },
    Corporate:  { bg: "#ffffff", fg: "#0f2340", accent: "#1d5fd1", font: "Archivo", wdth: 100, wght: 600, track: "0em",    upper: false, radius: "6px",  serif: false },
    Creative:   { bg: "#1a0b2e", fg: "#fff4d6", accent: "#ffcf3d", font: "Archivo", wdth: 70,  wght: 800, track: "-0.01em", upper: false, radius: "24px", serif: false },
    Custom:     { bg: "#0b0b0b", fg: "#f2f4f5", accent: "#ff7a2f", font: "Archivo", wdth: 84,  wght: 700, track: "0em",    upper: false, radius: "4px",  serif: false }
  };

  const NAV_BY_INTENT = {
    sell: ["Shop", "Collections", "About"],
    book: ["Services", "Pricing", "About"],
    default: ["Services", "About", "Contact"]
  };

  function pickIntent(goals) {
    const list = Array.isArray(goals) ? goals : (goals ? [goals] : []);
    const order = ["book", "sell", "leads", "customers", "automate", "trust", "showcase", "other"];
    const intents = list.map(g => GOAL_INTENT[g]).filter(Boolean);
    return order.find(o => intents.includes(o)) || "customers";
  }

  function build(business, variant) {
    const name = (business.name || "").trim() || "Your business";
    const category = CATEGORIES[business.type] ? business.type : "Other";
    const c = CATEGORIES[category];
    const style = THEMES[business.style] ? business.style : "Premium";
    const intent = pickIntent(business.goals);
    const v = variant || 0;

    const taglines = [c.tagline, c.trust + ".", `${name}. ${c.tagline}`];
    const nav = (NAV_BY_INTENT[intent] || NAV_BY_INTENT.default);

    return {
      name, category, style, intent,
      theme: THEMES[style],
      nav,
      headline: c.headline,
      tagline: taglines[v % taglines.length],
      cta: CTA[intent](c),
      sections: [
        { title: intent === "sell" ? "Collections" : "Services", items: c.services },
        { title: "Why choose us", items: [c.trust, "Clear pricing", "Fast replies"] },
        { title: "Contact", items: ["WhatsApp", "Call", "Email"] }
      ],
      trust: c.trust,
      steps: ["Navigation", "Hero", "Call to action", intent === "sell" ? "Collections" : "Services", "Why choose us", "Contact"]
    };
  }

  async function generate(business, variant) {
    const endpoint = window.WD4U_CONFIG && window.WD4U_CONFIG.ai && window.WD4U_CONFIG.ai.endpoint;
    if (!endpoint) return build(business, variant);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business, variant })
      });
      if (!res.ok) throw new Error("AI endpoint returned " + res.status);
      const data = await res.json();
      // Fill any gaps from the deterministic engine so the preview never breaks.
      return Object.assign(build(business, variant), data);
    } catch (err) {
      console.warn("[concept] AI endpoint unavailable, using built-in engine.", err);
      return build(business, variant);
    }
  }

  window.WD4U_Concept = { build, generate, THEMES, CATEGORIES };
})();
