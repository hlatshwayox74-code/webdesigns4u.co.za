/* =====================================================================
   CONCEPT ENGINE
   ---------------------------------------------------------------------
   Turns the visitor's answers into a website concept.

   Each business type has a PLAYBOOK built from research into what the
   leading websites in that niche do (see docs/niche-research.md), plus
   the one thing we do better. The concept combines that playbook with
   the visitor's name, goals, chosen feel and layout variant.

   Deterministic: the same answers always give the same concept. This
   file runs in the browser AND in the email function (Node), so the
   template we receive is exactly the one the customer saw.

   Later: set WD4U_CONFIG.ai.endpoint. generate() will POST
     { business: { name, type, goals[], style }, variant }
   and merge the JSON it returns over build(). Falls back to build().
   ===================================================================== */
(function (root) {

  /* ---------- Niche playbooks (research-based) ---------- */
  const PLAYBOOKS = {
    "Real Estate": {
      label: "real estate agencies", noun: "viewing", icon: "home",
      headlines: ["Find the place that feels like yours.", "Homes worth coming home to.", "Your next address starts here."],
      taglines: ["Homes and investments, honestly priced.", "Local agents who know every street."],
      patterns: ["Lead with striking, image-first property photography", "Make listings and suburb guides the core of the site", "Keep a clear talk-to-an-agent prompt on every page"],
      edge: "A property search right in the hero, so visitors are browsing homes within seconds, not hunting for the listings page.",
      second: "Book a valuation",
      module: { type: "search", title: "Featured listings", items: [
        { t: "Family home with garden", d: "4 bed · 2 bath · Double garage", p: "R 2 450 000" },
        { t: "Modern sea-view apartment", d: "2 bed · 2 bath · Balcony", p: "R 1 690 000" },
        { t: "Estate townhouse", d: "3 bed · 2 bath · 24h security", p: "R 1 950 000" }] },
      proof: ["Local agents who know every street", "Real photos and floor plans on every listing", "Free valuations, booked online"]
    },
    "Restaurant": {
      label: "restaurants", noun: "table", icon: "plate",
      headlines: ["Come hungry. Leave planning the next visit.", "Good food. Better company.", "A table worth waiting for. Book it now."],
      taglines: ["Seasonal plates, a room worth staying in.", "Fresh, local and made to share."],
      patterns: ["Open with photography that makes visitors hungry", "Show a real web menu with prices, never a PDF", "Keep the reservation button visible everywhere"],
      edge: "Book a table straight from the hero (date, time, guests) and a menu that loads instantly on a phone in the parking lot.",
      second: "View the menu",
      module: { type: "menu", title: "From the menu", items: [
        { t: "Line-caught fish of the day", d: "Charred lemon, herb butter, greens", p: "R 185" },
        { t: "Slow-braised short rib", d: "Mash, red wine jus · Chef's pick", p: "R 225" },
        { t: "Wood-fired vegetables", d: "Whipped feta, dukkah · Vegetarian", p: "R 135" },
        { t: "Burnt honey cheesecake", d: "Seasonal fruit", p: "R 85" }] },
      proof: ["Real reviews, shown live", "Hours, parking and directions in one tap", "Bookings confirmed instantly"]
    },
    "Construction": {
      label: "construction companies", noun: "site visit", icon: "crane",
      headlines: ["Built properly. Handed over on time.", "From groundwork to keys, done right.", "Projects you can stand behind."],
      taglines: ["Residential and commercial builds, start to keys.", "Registered, insured and on schedule."],
      patterns: ["Show big, real project imagery, not stock photos", "Organise the portfolio by sector and project type", "Put certifications, safety and a quote button everywhere"],
      edge: "Every project shown as a short case study (brief, timeline, result), so clients see the outcome before they ask for a quote.",
      second: "View our projects",
      module: { type: "projects", title: "Recent projects", items: [
        { t: "Family home, new build", d: "Residential · 9-month build", p: "Case study" },
        { t: "Retail centre upgrade", d: "Commercial · Phased renovation", p: "Case study" },
        { t: "Warehouse and offices", d: "Industrial · Design and build", p: "Case study" }] },
      proof: ["Registered and fully insured", "Safety-first sites, every time", "Fixed quotes, clear timelines"]
    },
    "Driving School": {
      label: "driving schools", noun: "lesson", icon: "wheel",
      headlines: ["Learn to drive with confidence.", "Pass your test. Drive for life.", "Calm instructors. Real road time. Your licence."],
      taglines: ["Patient instructors. Real road time. Licence ready.", "Lessons that fit around school and work."],
      patterns: ["Lead with the outcome: passing, confidently", "Show packages and prices upfront", "Let learners book online with instant confirmation"],
      edge: "Choose a package and book the first lesson in one flow, with instructor profiles and pass stories right beside the price.",
      second: "See packages",
      module: { type: "packages", title: "Lesson packages", items: [
        { t: "Starter", d: "5 lessons · Basics and confidence", p: "R 1 750" },
        { t: "Test ready", d: "10 lessons + test-route practice", p: "R 3 300", hot: true },
        { t: "Refresher", d: "3 lessons · For licensed drivers", p: "R 1 080" }] },
      proof: ["Patient, accredited instructors", "Test-route practice included", "Book and pay online"]
    },
    "Clothing": {
      label: "clothing brands", noun: "fitting", icon: "hanger",
      headlines: ["Wear what you actually mean.", "Made to be worn, again and again.", "Style with a story."],
      taglines: ["Small runs, made to last.", "Designed locally. Made to be lived in."],
      patterns: ["Tell a style story with editorial photography", "Show products worn and in motion, not flat", "Give clear sizing and fit guidance to cut returns"],
      edge: "An editorial lookbook that is also the shop: tap any look to buy it, with fit notes from people your size.",
      second: "Shop the lookbook",
      module: { type: "lookbook", title: "The new collection", items: [
        { t: "Linen overshirt", d: "Sand · Relaxed fit", p: "R 899" },
        { t: "Everyday tee", d: "Organic cotton · 4 colours", p: "R 349" },
        { t: "Tailored trouser", d: "Charcoal · True to size", p: "R 1 099" },
        { t: "Weekend knit", d: "Merino blend", p: "R 1 299" }] },
      proof: ["Free exchanges on every order", "Size guide on every product", "Secure checkout, tracked delivery"]
    },
    "Ecommerce": {
      label: "online stores", noun: "order", icon: "bag",
      headlines: ["Everything you came for, one tap away.", "Shop the best. Skip the hassle.", "Loved by customers. Delivered fast."],
      taglines: ["Fast delivery, easy returns.", "Secure checkout, tracked to your door."],
      patterns: ["Hero with a bold product or lifestyle shot", "A clean product grid with ratings on every item", "Shipping and returns spelled out before checkout"],
      edge: "A two-question product finder in the hero that sends shoppers straight to the right product, then a three-tap checkout.",
      second: "Find my product",
      module: { type: "products", title: "Best sellers", items: [
        { t: "Signature bundle", d: "Most loved", p: "R 799" },
        { t: "Everyday essential", d: "New", p: "R 349" },
        { t: "Gift set", d: "Ready to wrap", p: "R 599" },
        { t: "Travel size", d: "Under R300", p: "R 249" }] },
      proof: ["Free delivery over R 750", "30-day easy returns", "Secure checkout"]
    },
    "Beauty": {
      label: "salons and spas", noun: "appointment", icon: "spark",
      headlines: ["Leave looking like your best day.", "Feel good. Look better.", "Your time. Our care."],
      taglines: ["Skin, hair and nails by people who care.", "Book in seconds. Relax for hours."],
      patterns: ["Tap-to-book online booking on every page", "A gallery of real work, organised by service", "Long-term client reviews and the team front and centre"],
      edge: "A treatment menu where every service shows price, time and a Book button, so booking takes one tap.",
      second: "See treatments",
      module: { type: "treatments", title: "Treatment menu", items: [
        { t: "Signature facial", d: "60 min · Skin analysis included", p: "R 650" },
        { t: "Gel manicure", d: "45 min", p: "R 320" },
        { t: "Cut and blow-dry", d: "60 min", p: "R 450" },
        { t: "Full-body massage", d: "90 min", p: "R 790" }] },
      proof: ["Real results, real clients", "Meet your therapist before you book", "Gift vouchers online"]
    },
    "Fitness": {
      label: "gyms and studios", noun: "session", icon: "dumbbell",
      headlines: ["Stronger starts on Monday. Or today.", "Train with people who notice.", "Show up. We'll do the rest."],
      taglines: ["Coaching that fits your week.", "Classes, coaching and community."],
      patterns: ["Show real classes and the space in the hero", "A live class schedule with one-click booking", "Membership prices shown openly, not hidden"],
      edge: "Pick a class from this week's timetable and book a free first session on the spot, with the coach's profile one tap away.",
      second: "View timetable",
      module: { type: "schedule", title: "This week's classes", items: [
        { t: "Mon 06:00", d: "Strength · Coach A", p: "Book" },
        { t: "Tue 17:30", d: "HIIT · Coach B", p: "Book" },
        { t: "Wed 06:00", d: "Mobility · Coach A", p: "Book" },
        { t: "Thu 18:00", d: "Boxing · Coach C", p: "Book" }] },
      proof: ["Coaches who know your name", "Memberships from R 450 a month", "First session free"]
    },
    "Professional Services": {
      label: "professional firms", noun: "consultation", icon: "brief",
      headlines: ["Clear advice. Decisions you can stand behind.", "Expertise, explained in plain language.", "The right advice, when it matters."],
      taglines: ["Specialists who explain things properly.", "Trusted by businesses and families."],
      patterns: ["A strong value statement in the hero", "Plain-language service pages that explain the process", "People profiles, credentials and a click-to-call consultation"],
      edge: "Every service page ends with 'what happens next' in three steps and a consultation you can book without a phone call.",
      second: "Our services",
      module: { type: "expertise", title: "How we help", items: [
        { t: "Advisory", d: "Clear guidance on the decisions that matter", p: "Learn more" },
        { t: "Compliance", d: "Stay on the right side of every deadline", p: "Learn more" },
        { t: "Planning", d: "A plan you understand and can act on", p: "Learn more" }] },
      proof: ["Qualified, registered professionals", "Plain-language advice", "Consultations booked online"]
    },
    "Hospitality": {
      label: "hotels and guesthouses", noun: "stay", icon: "bed",
      headlines: ["Arrive. Exhale. Stay longer.", "Your stay, beautifully looked after.", "Wake up somewhere better."],
      taglines: ["Rooms, views and service you'll talk about.", "Book direct for the best rate."],
      patterns: ["Photography of the real guest experience", "A booking bar visible on every page", "Every room with its own identity, plus local experiences"],
      edge: "Book direct from the hero with the best-rate promise beside the button, so guests don't drift off to booking sites.",
      second: "Explore rooms",
      module: { type: "stay", title: "Rooms and suites", items: [
        { t: "Garden room", d: "Queen bed · Breakfast included", p: "R 1 450 / night" },
        { t: "Sea-view suite", d: "King bed · Private balcony", p: "R 2 300 / night" },
        { t: "Family room", d: "Sleeps 4 · Pool access", p: "R 2 650 / night" }] },
      proof: ["Best rate when you book direct", "Free cancellation up to 48h", "Local tips from our team"]
    },
    "Automotive": {
      label: "auto service centres", noun: "service", icon: "car",
      headlines: ["Your car, handled properly.", "Honest service. No surprises.", "Back on the road, faster."],
      taglines: ["Servicing, repairs and parts with straight answers.", "Quotes before work. Always."],
      patterns: ["A clear promise with real workshop photos", "Book-a-service and the phone number above the fold", "Warranties, certifications and real reviews up front"],
      edge: "A service booker that shows a price range before you book, so customers trust you before they arrive.",
      second: "Our services",
      module: { type: "service", title: "Services", items: [
        { t: "Minor service", d: "Oil, filters, 30-point check", p: "From R 1 200" },
        { t: "Brakes", d: "Pads, discs and fluid", p: "From R 950" },
        { t: "Diagnostics", d: "Computer scan and report", p: "From R 450" },
        { t: "Tyres and alignment", d: "Fitted while you wait", p: "Quote" }] },
      proof: ["Workmanship guaranteed", "Quotes before any work", "Real reviews from real drivers"]
    },
    "Education": {
      label: "schools and tutors", noun: "trial lesson", icon: "book",
      headlines: ["Where learning finally clicks.", "Better marks. More confidence.", "Teaching that meets every learner."],
      taglines: ["Teaching that meets each learner where they are.", "Results families notice."],
      patterns: ["Lead with proof: real results and progress", "Subjects reachable straight from the homepage", "Open pricing and a low-commitment trial lesson"],
      edge: "Pick subject and grade in the hero and book a free trial lesson, with tutor profiles matched to that subject.",
      second: "Our programmes",
      module: { type: "programmes", title: "Programmes", items: [
        { t: "Maths", d: "Grades 8–12 · In person or online", p: "From R 280 / lesson" },
        { t: "Science", d: "Physical and life sciences", p: "From R 280 / lesson" },
        { t: "Exam prep", d: "Matric crash courses", p: "From R 1 800" }] },
      proof: ["Qualified, vetted tutors", "Progress reports every month", "First lesson free"]
    },
    "Other": {
      label: "leading small businesses", noun: "call", icon: "star",
      headlines: ["Exactly what you need, done properly.", "Good work, done right, on time.", "The business people recommend by name."],
      taglines: ["A business people recommend by name.", "Clear prices. Fast replies."],
      patterns: ["A specific hero and a plain headline about what you do", "One main next step, not five competing buttons", "Reviews, trust badges and tap-to-call on mobile"],
      edge: "One clear path from 'what do you do?' to 'booked' in under a minute, on any phone.",
      second: "Our services",
      module: { type: "generic", title: "What we do", items: [
        { t: "Service one", d: "What it is and who it's for", p: "From R —" },
        { t: "Service two", d: "What it is and who it's for", p: "From R —" },
        { t: "Service three", d: "What it is and who it's for", p: "Quote" }] },
      proof: ["Recommended by the people we work with", "Clear pricing", "Fast replies on WhatsApp"]
    }
  };
  // Back-compat for code that reads CATEGORIES.
  const CATEGORIES = PLAYBOOKS;

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
  const GOALS = Object.keys(GOAL_INTENT);

  const CTA = {
    book:      (p) => `Book your ${p.noun}`,
    sell:      ()  => "Shop now",
    leads:     ()  => "Get a free quote",
    customers: ()  => "Get started",
    trust:     ()  => "See our work",
    showcase:  ()  => "Explore",
    automate:  (p) => `Book a ${p.noun} online`,
    other:     ()  => "Get in touch"
  };

  // Visual themes ("feels").
  const THEMES = {
    Luxury:     { bg: "#0d0b09", fg: "#efe6d8", accent: "#c9a46a", surface: "#17130f", wdth: 112, wght: 300, track: "0.18em", upper: true,  radius: "0px",  serif: false },
    Premium:    { bg: "#0b0d10", fg: "#eef1f4", accent: "#ff7a2f", surface: "#14181d", wdth: 100, wght: 600, track: "-0.01em", upper: false, radius: "2px", serif: false },
    Bold:       { bg: "#ff3d2e", fg: "#120707", accent: "#120707", surface: "#ff5a4d", wdth: 62,  wght: 900, track: "-0.02em", upper: true,  radius: "0px",  serif: false },
    Minimal:    { bg: "#f4f4f2", fg: "#141414", accent: "#141414", surface: "#ffffff", wdth: 100, wght: 400, track: "-0.01em", upper: false, radius: "0px",  serif: false },
    Modern:     { bg: "#f2f5f7", fg: "#0e1a22", accent: "#2b6cff", surface: "#ffffff", wdth: 92,  wght: 700, track: "-0.02em", upper: false, radius: "10px", serif: false },
    Futuristic: { bg: "#03070b", fg: "#dff6ff", accent: "#6fd3ff", surface: "#0a131b", wdth: 125, wght: 500, track: "0.08em", upper: true,  radius: "0px",  serif: false },
    Editorial:  { bg: "#f1ece4", fg: "#1b1714", accent: "#8a2d1b", surface: "#faf6ef", wdth: 100, wght: 400, track: "-0.01em", upper: false, radius: "0px",  serif: true  },
    Corporate:  { bg: "#ffffff", fg: "#0f2340", accent: "#1d5fd1", surface: "#f3f6fb", wdth: 100, wght: 600, track: "0em",    upper: false, radius: "6px",  serif: false },
    Creative:   { bg: "#1a0b2e", fg: "#fff4d6", accent: "#ffcf3d", surface: "#26123f", wdth: 70,  wght: 800, track: "-0.01em", upper: false, radius: "24px", serif: false },
    Custom:     { bg: "#0b0b0b", fg: "#f2f4f5", accent: "#ff7a2f", surface: "#161616", wdth: 84,  wght: 700, track: "0em",    upper: false, radius: "4px",  serif: false }
  };
  const LAYOUTS = ["split", "overlay", "stacked"];

  const NAV_BY_MODULE = {
    search: ["Buy", "Sell", "Rent", "About"], menu: ["Menu", "Book", "Private dining", "Find us"],
    projects: ["Projects", "Services", "About", "Safety"], packages: ["Packages", "Instructors", "Reviews", "FAQ"],
    lookbook: ["New in", "Collections", "Size guide", "About"], products: ["Shop", "Best sellers", "Reviews", "Help"],
    treatments: ["Treatments", "Gallery", "Team", "Gift vouchers"], schedule: ["Timetable", "Memberships", "Coaches", "About"],
    expertise: ["Services", "People", "Insights", "Contact"], stay: ["Rooms", "Experiences", "Dining", "Offers"],
    service: ["Services", "Book", "Reviews", "Find us"], programmes: ["Programmes", "Tutors", "Results", "Pricing"],
    generic: ["Services", "About", "Reviews", "Contact"]
  };

  function pickIntent(goals) {
    const list = Array.isArray(goals) ? goals : (goals ? [goals] : []);
    const order = ["book", "sell", "leads", "customers", "automate", "trust", "showcase", "other"];
    const intents = list.map(g => GOAL_INTENT[g]).filter(Boolean);
    return order.find(o => intents.includes(o)) || "customers";
  }

  // Small stable hash -> concept reference like W4U-RE-3F9A2C
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).toUpperCase().padStart(8, "0"); }
  const CODE = { "Real Estate": "RE", "Restaurant": "RS", "Construction": "CN", "Driving School": "DS", "Clothing": "CL", "Ecommerce": "EC", "Beauty": "BT", "Fitness": "FT", "Professional Services": "PS", "Hospitality": "HP", "Automotive": "AU", "Education": "ED", "Other": "OT" };

  // Clean, bounded inputs (they also arrive from links and the network).
  function normalize(b) {
    b = b || {};
    const name = String(b.name || "").replace(/\s+/g, " ").trim().slice(0, 60);
    const type = PLAYBOOKS[b.type] ? b.type : "Other";
    const goals = (Array.isArray(b.goals) ? b.goals : (b.goals ? [b.goals] : [])).filter(g => GOALS.includes(g)).slice(0, 8);
    const style = THEMES[b.style] ? b.style : "Premium";
    const variant = Math.max(0, Math.min(999, parseInt(b.variant, 10) || 0));
    return { name, type, goals, style, variant };
  }

  function build(business, variant) {
    const n = normalize(Object.assign({}, business, variant !== undefined ? { variant } : {}));
    const p = PLAYBOOKS[n.type];
    const name = n.name || "Your business";
    const intent = pickIntent(n.goals);
    const v = n.variant;
    const module = p.module;
    return {
      id: `W4U-${CODE[n.type]}-${hash([n.name.toLowerCase(), n.type, n.goals.join(","), n.style, v].join("|")).slice(0, 6)}`,
      inputs: { n: n.name, t: n.type, g: n.goals, s: n.style, v },
      name, category: n.type, style: n.style, intent, goals: n.goals,
      theme: THEMES[n.style],
      layout: LAYOUTS[v % LAYOUTS.length],
      icon: p.icon,
      nav: NAV_BY_MODULE[module.type] || NAV_BY_MODULE.generic,
      headline: p.headlines[v % p.headlines.length],
      tagline: p.taglines[v % p.taglines.length],
      cta: CTA[intent](p),
      secondaryCta: p.second,
      module,
      proof: p.proof,
      research: { label: p.label, patterns: p.patterns, edge: p.edge },
      // Back-compat fields used by older code paths.
      sections: [
        { title: module.title, items: module.items.map(i => i.t) },
        { title: "Why choose us", items: p.proof },
        { title: "Contact", items: ["WhatsApp", "Call", "Email"] }
      ],
      trust: p.proof[0],
      steps: ["Navigation", "Hero", module.title, "Why choose us", "Call to action", "Contact"]
    };
  }

  /* ---------- Shareable concept links ---------- */
  function toB64Url(str) {
    const bytes = new TextEncoder().encode(str); let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function fromB64Url(s) {
    s = String(s || "").replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
    const bin = atob(s); const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function encodeInputs(inputs) { const i = inputs || {}; return toB64Url(JSON.stringify({ n: i.n || "", t: i.t || "Other", g: i.g || [], s: i.s || "Premium", v: i.v || 0 })); }
  function decodeInputs(code) {
    try {
      if (!code || code.length > 1200) return null;
      const o = JSON.parse(fromB64Url(code));
      const n = normalize({ name: o.n, type: o.t, goals: o.g, style: o.s, variant: o.v });
      return { name: n.name, type: n.type, goals: n.goals, style: n.style, variant: n.variant };
    } catch (e) { return null; }
  }
  function viewerUrl(concept, origin) {
    return String(origin || "").replace(/\/$/, "") + "/concept.html?c=" + encodeInputs(concept.inputs);
  }

  async function generate(business, variant) {
    const endpoint = root.WD4U_CONFIG && root.WD4U_CONFIG.ai && root.WD4U_CONFIG.ai.endpoint;
    if (!endpoint) return build(business, variant);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business, variant }) });
      if (!res.ok) throw new Error("AI endpoint returned " + res.status);
      const data = await res.json();
      return Object.assign(build(business, variant), data); // never leave gaps
    } catch (err) {
      console.warn("[concept] AI endpoint unavailable, using built-in engine.", err);
      return build(business, variant);
    }
  }

  root.WD4U_Concept = { build, generate, normalize, encodeInputs, decodeInputs, viewerUrl, THEMES, PLAYBOOKS, CATEGORIES, GOALS };
})(typeof window !== "undefined" ? window : globalThis);
