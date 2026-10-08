/* =====================================================================
   LEAD FUNCTION  |  POST /api/lead
   ---------------------------------------------------------------------
   Emails every enquiry to Web Designs4U, then fans it out to any
   webhooks. Secrets live only in Netlify environment variables.

   Required for email:
   RESEND_API_KEY      From resend.com (free). Sign up with
                       webdesigns4u.co.za@gmail.com and leave LEAD_FROM
                       empty: Resend's test sender can deliver to the
                       account owner's own inbox with no domain setup.
   Optional:
   LEAD_NOTIFY_TO      Default: webdesigns4u.co.za@gmail.com
   LEAD_FROM           Default: "Web Designs4U <onboarding@resend.dev>".
                       Set to an address on your own verified domain later.
   LEAD_CONFIRM        "true" also emails the customer (needs your own
                       verified domain in LEAD_FROM).
   LEAD_WEBHOOK_URLS   Comma-separated: Zapier, Make, n8n, Google Sheets,
                       Airtable, HubSpot, GoHighLevel.

   Response: { ok, emailed } so the website never claims an enquiry
   was delivered when it wasn't.
   ===================================================================== */

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const env = (k) => (process.env[k] || "").trim();
const NOTIFY_TO = () => env("LEAD_NOTIFY_TO") || "webdesigns4u.co.za@gmail.com";
const FROM = () => env("LEAD_FROM") || "Web Designs4U <onboarding@resend.dev>";
const list = (v) => [].concat(v || []).filter(Boolean).join(", ");

// 071 437 9593 -> 27714379593 so you can tap through to the customer's WhatsApp
function waNumber(raw) {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("0") && d.length === 10) d = "27" + d.slice(1);
  return /^\d{9,15}$/.test(d) ? d : "";
}

function saTime(iso) {
  try { return new Intl.DateTimeFormat("en-ZA", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Johannesburg" }).format(new Date(iso)); }
  catch { return iso; }
}

function fields(lead) {
  const src = lead.source || {};
  const campaign = [src.utm_source, src.utm_medium, src.utm_campaign].filter(Boolean).join(" / ");
  if (lead.kind === "contact") {
    return [
      ["Name", lead.fullName], ["Business", lead.businessName], ["Reply to", lead.reply], ["Message", lead.message],
      ["Source", "Web Designs4U Website (contact panel)" + (campaign ? ` | ${campaign}` : "")],
      ["Date/Time", saTime(lead.received_at)]
    ];
  }
  const p = lead.personalised || {};
  return [
    ["Name", lead.name], ["Business", lead.businessName], ["Business Type", lead.businessType],
    ["What they do", lead.businessDescription], ["Email", lead.email], ["Phone / WhatsApp", lead.phone],
    ["Website Goal", list(lead.goals)], ["Looking for", lead.websiteType], ["Website Style", lead.style],
    ["Existing Website", lead.existingWebsite], ["Message", lead.message],
    ["Journey answers", [p.category, list(p.goals), p.style].filter(Boolean).join(" | ")],
    ["Source", "Web Designs4U Website" + (campaign ? ` | ${campaign}` : src.referrer ? ` | via ${src.referrer}` : "")],
    ["Date/Time", saTime(lead.received_at)]
  ];
}

function emailText(lead) {
  return "WEB DESIGNS4U | NEW WEBSITE ENQUIRY\n\n" +
    fields(lead).map(([k, v]) => `${k}:\n${v || "-"}`).join("\n\n");
}

/* ---------------------------------------------------------------------
   RESPONSIVE EMAIL
   Mobile-first single column: every answer is a label above its value,
   so it reads well on any screen even where media queries are ignored.
   Gmail and Apple Mail also get full-width tap buttons on phones.
   Outlook desktop gets a fixed 600px wrapper.
   --------------------------------------------------------------------- */
const F = "Arial, Helvetica, sans-serif";

function layout({ preheader, eyebrow, title, subtitle, body }) {
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light only">
<title>${esc(title)}</title>
<style>
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  @media only screen and (max-width: 620px) {
    .outer { padding: 0 !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .h1 { font-size: 30px !important; line-height: 32px !important; }
    .btn { display: block !important; width: 100% !important; box-sizing: border-box !important; margin: 0 0 10px 0 !important; text-align: center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ececec;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#ececec;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ececec;">
<tr><td class="outer" align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;">
  <tr><td class="px" style="background:#000000;padding:28px 32px 26px;">
    <p style="margin:0 0 14px;font-family:${F};font-size:12px;line-height:16px;letter-spacing:2px;color:#ff7a2f;font-weight:bold;">${esc(eyebrow)}</p>
    <h1 class="h1" style="margin:0;font-family:${F};font-size:34px;line-height:36px;font-weight:900;color:#ffffff;text-transform:uppercase;word-break:break-word;">${esc(title)}</h1>
    ${subtitle ? `<p style="margin:10px 0 0;font-family:${F};font-size:15px;line-height:22px;color:#b5b5b5;">${esc(subtitle)}</p>` : ""}
  </td></tr>
  ${body}
  <tr><td class="px" style="background:#000000;padding:22px 32px;">
    <p style="margin:0;font-family:${F};font-size:13px;line-height:20px;color:#ffffff;font-weight:bold;">Web Designs4U</p>
    <p style="margin:0;font-family:${F};font-size:13px;line-height:20px;color:#9a9a9a;">Don't just get a website. Get a digital experience.</p>
  </td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}

const field = (label, value, html) => value ? `
  <tr><td class="px" style="padding:0 32px 16px;">
    <p style="margin:0 0 3px;font-family:${F};font-size:11px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:#8a8a8a;">${esc(label)}</p>
    <p style="margin:0;font-family:${F};font-size:16px;line-height:23px;color:#111111;word-break:break-word;overflow-wrap:anywhere;white-space:pre-wrap;">${html || esc(value)}</p>
  </td></tr>` : "";

const section = (title, rows) => {
  const inner = rows.join("");
  if (!inner.trim()) return "";
  return `
  <tr><td class="px" style="padding:24px 32px 14px;">
    <p style="margin:0;padding-top:16px;border-top:2px solid #111111;font-family:${F};font-size:13px;line-height:18px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#111111;">${esc(title)}</p>
  </td></tr>${inner}`;
};

const button = (href, label, bg, fg, border) =>
  `<a class="btn" href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:14px 20px;background:${bg};color:${fg};border:2px solid ${border || bg};font-family:${F};font-size:15px;line-height:18px;font-weight:bold;text-decoration:none;">${esc(label)}</a>`;

const link = (href, text) => `<a href="${esc(href)}" style="color:#111111;text-decoration:underline;">${esc(text)}</a>`;

function emailHtml(lead) {
  const src = lead.source || {};
  const campaign = [src.utm_source, src.utm_medium, src.utm_campaign].filter(Boolean).join(" / ");
  const sourceLine = "Web Designs4U Website" + (campaign ? ` | ${campaign}` : src.referrer ? ` | via ${src.referrer}` : "");
  const wa = waNumber(lead.phone || lead.reply);
  const email = lead.email || (/@/.test(lead.reply || "") ? lead.reply : "");
  const buttons = [
    wa ? button(`https://wa.me/${wa}`, `WhatsApp ${lead.name || lead.fullName || "them"}`, "#25D366", "#000000") : "",
    email ? button(`mailto:${email}`, "Reply by email", "#111111", "#ffffff") : "",
    wa ? button(`tel:+${wa}`, "Call", "#ffffff", "#111111", "#111111") : ""
  ].join("");
  const actions = buttons ? `<tr><td class="px" style="padding:24px 32px 8px;">${buttons}</td></tr>` : "";

  let body;
  if (lead.kind === "contact") {
    body = actions +
      section("Contact", [field("Name", lead.fullName), field("Business", lead.businessName), field("Reply to", lead.reply)]) +
      section("Message", [field("Message", lead.message)]) +
      section("Details", [field("Source", sourceLine), field("Date/Time", saTime(lead.received_at))]);
    return layout({ preheader: `${lead.fullName || "Someone"}: ${String(lead.message || "").slice(0, 90)}`, eyebrow: "WEB DESIGNS4U", title: "New message", subtitle: lead.fullName || "", body: body + `<tr><td style="padding:0 0 16px;"></td></tr>` });
  }
  const p = lead.personalised || {};
  body = actions +
    section("The business", [
      field("Business", lead.businessName), field("Business Type", lead.businessType),
      field("What they do", lead.businessDescription),
      field("Existing Website", lead.existingWebsite, lead.existingWebsite ? link(/^https?:/i.test(lead.existingWebsite) ? lead.existingWebsite : "https://" + lead.existingWebsite, lead.existingWebsite) : "")
    ]) +
    section("Contact", [
      field("Name", lead.name),
      field("Email", lead.email, lead.email ? link("mailto:" + lead.email, lead.email) : ""),
      field("Phone / WhatsApp", lead.phone, wa ? link("tel:+" + wa, lead.phone) : "")
    ]) +
    section("The website", [field("Website Goal", list(lead.goals)), field("Looking for", lead.websiteType), field("Website Style", lead.style)]) +
    section("Message", [field("Message", lead.message)]) +
    section("Details", [
      field("Journey answers", [p.category, list(p.goals), p.style].filter(Boolean).join(" | ")),
      field("Source", sourceLine), field("Date/Time", saTime(lead.received_at))
    ]) + `<tr><td style="padding:0 0 16px;"></td></tr>`;
  return layout({
    preheader: [lead.businessType, list(lead.goals), lead.name].filter(Boolean).join(" | "),
    eyebrow: "WEB DESIGNS4U | NEW WEBSITE ENQUIRY",
    title: lead.businessName || lead.name || "New enquiry",
    subtitle: [lead.businessType, lead.name].filter(Boolean).join(" | "),
    body
  });
}

function confirmationHtml(lead) {
  const business = lead.businessName || "your business";
  const body = `
  <tr><td class="px" style="padding:28px 32px 8px;">
    <p style="margin:0 0 14px;font-family:${F};font-size:16px;line-height:24px;color:#111111;">Hi ${esc(lead.name || "there")},</p>
    <p style="margin:0 0 14px;font-family:${F};font-size:16px;line-height:24px;color:#111111;">We've received your enquiry for <strong>${esc(business)}</strong>. We'll be in touch shortly.</p>
    <p style="margin:0 0 20px;font-family:${F};font-size:16px;line-height:24px;color:#111111;">Prefer to chat now? We're on WhatsApp.</p>
  </td></tr>
  <tr><td class="px" style="padding:0 32px 24px;">
    ${button("https://wa.me/27714379593", "WhatsApp us: 071 437 9593", "#25D366", "#000000")}${button("mailto:webdesigns4u.co.za@gmail.com", "Email us", "#111111", "#ffffff")}
  </td></tr>`;
  return layout({ preheader: `We've received your enquiry for ${business}.`, eyebrow: "WEB DESIGNS4U", title: "Your next chapter starts here.", subtitle: business, body });
}

async function sendEmail({ to, subject, html, text, replyTo }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM(), to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) })
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

async function postWebhook(url, lead) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
  if (!res.ok) throw new Error(`Webhook ${url} ${res.status}`);
}

export default async (req, context) => {
  if (req.method !== "POST") return json({ ok: false, error: "Use POST." }, 405);
  const raw = await req.text();
  if (raw.length > 20000) return json({ ok: false, error: "Request too large." }, 413);
  let lead;
  try { lead = JSON.parse(raw); } catch { return json({ ok: false, error: "Body must be JSON." }, 400); }
  if (lead["bot-field"]) return json({ ok: true, emailed: true }); // honeypot: bots see success, nothing is sent
  delete lead["bot-field"];
  const reachable = lead.email || lead.phone || lead.reply;
  if (!reachable) return json({ ok: false, emailed: false, error: "A way to reply is required." }, 422);

  lead.received_at = new Date().toISOString();
  lead.country = context?.geo?.country?.code || "";

  // 1. Email to Web Designs4U: the delivery that decides success.
  let emailed = false, emailError = "";
  if (env("RESEND_API_KEY")) {
    try {
      await sendEmail({
        to: NOTIFY_TO(),
        subject: lead.kind === "contact"
          ? `WEB DESIGNS4U | New message from ${lead.fullName || "the website"}`
          : `WEB DESIGNS4U | New website enquiry: ${lead.businessName || lead.name || "new business"}`,
        html: emailHtml(lead), text: emailText(lead),
        replyTo: lead.email || undefined
      });
      emailed = true;
    } catch (e) { emailError = e.message; console.error("[lead] email failed:", e.message); }
  } else {
    emailError = "RESEND_API_KEY not set";
  }

  // 2. Extras: webhooks and optional customer confirmation. Failures here never block the lead.
  const extras = [];
  env("LEAD_WEBHOOK_URLS").split(",").map((u) => u.trim()).filter(Boolean).forEach((url) => extras.push(postWebhook(url, lead)));
  if (emailed && env("LEAD_CONFIRM") === "true" && lead.email && lead.kind !== "contact") {
    extras.push(sendEmail({
      to: lead.email,
      subject: `${lead.businessName || "Your business"}: your next chapter starts here`,
      html: confirmationHtml(lead), text: `Hi ${lead.name || "there"},\n\nWe've received your enquiry for ${lead.businessName || "your business"}. We'll be in touch shortly.\n\nPrefer to chat now? WhatsApp us on 071 437 9593: https://wa.me/27714379593\n\nWeb Designs4U\nDon't just get a website. Get a digital experience.`
    }));
  }
  const results = await Promise.allSettled(extras);
  results.filter((r) => r.status === "rejected").forEach((r) => console.error("[lead]", r.reason?.message || r.reason));

  return json({ ok: true, emailed, ...(emailed ? {} : { emailError }) });
};

export const config = { path: "/api/lead" };
