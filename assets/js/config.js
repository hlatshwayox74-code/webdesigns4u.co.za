/* =====================================================================
   WEB DESIGNS4U  |  SITE CONFIGURATION
   ---------------------------------------------------------------------
   Everything you will want to change lives here. No component reads a
   hard-coded contact detail, video path or CTA label.
   Empty strings are hidden on the live site, never invented.
   ===================================================================== */
window.WD4U_CONFIG = {

  brand: {
    name: "Web Designs4U",
    statement: ["Don't just get a website.", "Get a digital experience."],
    alternates: [
      ["Your business has a story.", "We build the place where it lives."],
      ["We don't just build websites.", "We build what happens next."],
      ["Turn your business", "into an experience."]
    ],
    location: "Gqeberha, South Africa",
    timezone: "Africa/Johannesburg",
    timezoneLabel: "Gqeberha"
  },

  /* ---- CONTACT ------------------------------------------------------
     Fill these in. Leave a value empty ("") and that row is hidden.
     phone / business / whatsapp: use international format, e.g. +27...  */
  contact: {
    email: "webdesigns4u.co.za@gmail.com",
    phone: "071 437 9593",          // shown as written
    phoneIntl: "+27714379593",      // used for tel: links
    whatsapp: "071 437 9593",       // shown as written
    whatsappIntl: "27714379593",    // used for wa.me links (digits only, no +)
    businessNumber: "",             // optional second line; empty = hidden
    whatsappMessage: "Hi Web Designs4U 👋\n\nI'd like to talk about building a website for my business.",
    social: {           // optional: full URLs
      instagram: "",
      facebook: "",
      linkedin: "",
      tiktok: ""
    }
  },

  /* ---- CTA LABELS ---------------------------------------------------- */
  cta: {
    primary: "Build my website",
    quote: "Get a quote",
    whatsapp: "WhatsApp us",
    contact: "Contact",
    supporting: "Your business has a story. Let's build the place where it lives."
  },

  /* ---- MEDIA ---------------------------------------------------------
     Swap any video without touching the layout. All clips are vertical
     (9:16). "mobile" is optional: a separate file for small screens.   */
  media: {
    hero:        { src: "media/hero.mp4",        poster: "media/hero.jpg",        mobile: "" },
    internet:    { src: "media/internet.mp4",    poster: "media/internet.jpg",    mobile: "" },
    story:       { src: "media/story.mp4",       poster: "media/story.jpg",       mobile: "" },
    identity:    { src: "media/identity.mp4",    poster: "media/identity.jpg",    mobile: "" },
    journey:     { src: "media/journey.mp4",     poster: "media/journey.jpg",     mobile: "" },
    strategy:    { src: "media/strategy.mp4",    poster: "media/strategy.jpg",    mobile: "" },
    design:      { src: "media/design.mp4",      poster: "media/design.jpg",      mobile: "" },
    build:       { src: "media/build.mp4",       poster: "media/build.jpg",       mobile: "" },
    network:     { src: "media/network.mp4",     poster: "media/network.jpg",     mobile: "" },
    salesperson: { src: "media/salesperson.mp4", poster: "media/salesperson.jpg", mobile: "" },
    growth:      { src: "media/growth.mp4",      poster: "media/growth.jpg",      mobile: "" },
    final:       { src: "media/final.mp4",       poster: "media/final.jpg",       mobile: "" },
    intake:      { src: "media/intake.mp4",      poster: "media/intake.jpg",      mobile: "" },
    alive:       { src: "media/alive.mp4",       poster: "media/alive.jpg",       mobile: "" }
  },

  /* ---- LEADS ---------------------------------------------------------
     mode: "auto" sends leads on a real domain and stays silent in
     previews (file://, claude.ai). Use "live" to force sending.        */
  leads: {
    mode: "auto",
    netlifyForms: true,                 // stores every lead in Netlify > Forms
    buildFormName: "build-my-website",
    contactFormName: "contact",
    endpoint: "/api/lead",              // Netlify Function: webhooks, CRM, emails
    keepLocalBackup: true,              // last leads kept in the visitor's browser if sending fails
    duplicateWindowMinutes: 30          // identical enquiry within this window is not sent twice
  },

  /* ---- AI CONCEPT ENGINE ---------------------------------------------
     Leave endpoint empty to use the built-in deterministic engine.
     When set, POST {business:{...}} and expect the concept JSON shape
     documented in assets/js/concept-engine.js.                         */
  ai: {
    endpoint: ""
  },

  /* ---- INTAKE OPTIONS (Build my website flow) ------------------------ */
  intake: {
    businessTypes: ["Restaurant","Construction","Driving School","Clothing","Ecommerce","Beauty","Fitness","Professional Services","Real Estate","Hospitality","Automotive","Education","Other"],
    goals: ["Get more customers","Generate leads","Sell products","Take bookings","Build credibility","Showcase my business","Automate my business","Other"],
    websiteTypes: ["Business website","Ecommerce","Landing page","Booking website","Portfolio","Custom experience","Not sure yet"],
    styles: ["Luxury","Premium","Modern","Bold","Minimal","Creative","Futuristic","Editorial","Corporate","Custom"]
  },

  /* ---- CHAPTER 06 OPTIONS (in-page personalisation) ------------------ */
  personalise: {
    goals: ["Get more customers","Generate leads","Sell products","Take bookings","Build credibility","Showcase my business","Automate my business","Other"],
    styles: ["Luxury","Bold","Minimal","Futuristic","Editorial","Corporate","Creative","Premium","Custom"]
  },

  /* ---- INTEGRATIONS (Chapter 10) ------------------------------------- */
  integrations: [
    { name: "Email",         line: "Every enquiry lands in your inbox, formatted and ready to answer." },
    { name: "Contact forms", line: "Short forms that ask the right questions, and nothing else." },
    { name: "WhatsApp",      line: "Visitors message you from the page with their enquiry already typed." },
    { name: "Booking",       line: "Customers pick a time that suits them. Your calendar fills itself." },
    { name: "Payments",      line: "Deposits and full payments taken online, before anyone picks up a phone." },
    { name: "Ecommerce",     line: "A real store: products, stock, checkout and delivery." },
    { name: "CRM",           line: "Every lead saved with where it came from and what it wants." },
    { name: "Analytics",     line: "See which pages bring customers, and which ones lose them." },
    { name: "Automation",    line: "Follow-ups, reminders and confirmations sent without you." },
    { name: "Social",        line: "Your feeds, reviews and links working together with the site." },
    { name: "SEO",           line: "Found on Google when someone nearby searches for what you do." }
  ]
};
