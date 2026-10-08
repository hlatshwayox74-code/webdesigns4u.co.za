/* =====================================================================
   LEAD SERVICE
   ---------------------------------------------------------------------
   One call from the frontend: WD4U_Leads.submit(kind, data)
   1. Adds source info (UTM, referrer, landing page) and a timestamp.
   2. Saves a backup in the visitor's browser.
   3. Posts to Netlify Forms (storage + email notification).
   4. Posts JSON to the lead endpoint (Netlify Function), which fans
      out to webhooks: Google Sheets, Airtable, HubSpot, GoHighLevel,
      Make, Zapier, n8n, plus team notification and customer email.
   Add or remove integrations in the function, never in the UI.
   ===================================================================== */
(function () {
  const CFG = () => (window.WD4U_CONFIG && window.WD4U_CONFIG.leads) || {};
  const SRC_KEY = "wd4u.source";
  const BACKUP_KEY = "wd4u.leads.backup";

  function captureSource() {
    try {
      if (sessionStorage.getItem(SRC_KEY)) return;
      const p = new URLSearchParams(location.search);
      const src = {
        utm_source: p.get("utm_source") || "",
        utm_medium: p.get("utm_medium") || "",
        utm_campaign: p.get("utm_campaign") || "",
        utm_term: p.get("utm_term") || "",
        utm_content: p.get("utm_content") || "",
        gclid: p.get("gclid") || "",
        fbclid: p.get("fbclid") || "",
        referrer: document.referrer || "",
        landing_page: location.href,
        first_seen: new Date().toISOString()
      };
      sessionStorage.setItem(SRC_KEY, JSON.stringify(src));
    } catch (e) { /* storage unavailable: source stays empty */ }
  }

  function getSource() {
    try { return JSON.parse(sessionStorage.getItem(SRC_KEY) || "{}"); } catch (e) { return {}; }
  }

  function isPreview() {
    const mode = CFG().mode || "auto";
    if (mode === "live") return false;
    if (mode === "preview") return true;
    const h = location.hostname;
    return location.protocol === "file:" || h === "" || /claude\.ai$|claudeusercontent\.com$|claude\.site$/.test(h);
  }

  function backup(lead) {
    if (!CFG().keepLocalBackup) return;
    try {
      const list = JSON.parse(localStorage.getItem(BACKUP_KEY) || "[]");
      list.unshift(lead);
      localStorage.setItem(BACKUP_KEY, JSON.stringify(list.slice(0, 10)));
    } catch (e) { /* ignore */ }
  }

  // Netlify Forms wants flat, url-encoded fields.
  function flatten(obj, prefix, out) {
    out = out || {};
    Object.keys(obj).forEach(k => {
      const v = obj[k];
      const key = prefix ? prefix + "_" + k : k;
      if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
      else out[key] = Array.isArray(v) ? v.join(", ") : (v == null ? "" : String(v));
    });
    return out;
  }

  async function postNetlify(formName, lead) {
    const body = new URLSearchParams(Object.assign({ "form-name": formName }, flatten(lead))).toString();
    const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!res.ok) throw new Error("Netlify Forms " + res.status);
    return res;
  }

  async function postEndpoint(lead) {
    const res = await fetch(CFG().endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
    let body = {};
    try { body = await res.json(); } catch (e) { /* non-JSON reply */ }
    if (!res.ok) throw new Error("Lead endpoint " + res.status);
    return body; // { ok, emailed, ... }
  }

  // Fingerprint of what the visitor typed (not timestamps), for duplicate protection.
  function fingerprint(kind, data) {
    const keys = ["name", "fullName", "businessName", "businessType", "businessDescription", "email", "phone", "reply", "message", "existingWebsite", "websiteType", "style"];
    const str = kind + "|" + keys.map(k => String(data[k] || "").trim().toLowerCase()).join("|") + "|" + [].concat(data.goals || []).join(",");
    let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return "wd4u.sent." + h;
  }
  function recentlySent(fp) {
    try { const t = +localStorage.getItem(fp); return t && (Date.now() - t) < (CFG().duplicateWindowMinutes || 30) * 60000; } catch (e) { return false; }
  }
  function markSent(fp) { try { localStorage.setItem(fp, String(Date.now())); } catch (e) {} }

  /* Success rules (never pretend):
     - the function confirms the email reached the inbox (emailed: true), or
     - Netlify Forms stored the lead (Netlify emails it to you as well).
     Anything else is a failure, and the UI offers WhatsApp instead. */
  async function submit(kind, data) {
    const cfg = CFG();
    const fp = fingerprint(kind, data);
    if (recentlySent(fp)) return { ok: true, duplicate: true, preview: isPreview() };

    const lead = Object.assign({}, data, {
      kind,
      source: getSource(),
      page: location.href,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    });
    backup(lead);

    if (isPreview()) {
      console.info("[leads] Preview mode: lead not sent.", lead);
      markSent(fp);
      return { ok: true, preview: true, lead };
    }

    const formName = kind === "contact" ? cfg.contactFormName : cfg.buildFormName;
    const [forms, fn] = await Promise.allSettled([
      cfg.netlifyForms ? postNetlify(formName, lead) : Promise.reject(new Error("forms off")),
      cfg.endpoint ? postEndpoint(lead) : Promise.reject(new Error("endpoint off"))
    ]);
    const emailed = fn.status === "fulfilled" && fn.value && fn.value.emailed === true;
    const stored = forms.status === "fulfilled";
    if (!emailed && !stored) {
      const err = new Error("The enquiry couldn't be delivered.");
      err.details = { forms, fn };
      throw err;
    }
    markSent(fp);
    return { ok: true, preview: false, emailed, stored, lead };
  }

  captureSource();
  window.WD4U_Leads = { submit, isPreview, getSource, fingerprint };
})();
