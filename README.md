# Web Designs4U website

A scroll-driven, 12-chapter website that sells web design by being the demonstration. Plain HTML, CSS and JavaScript: no framework, no build step. It deploys to Netlify as-is.

## Before you go live

1. **Contact details are set:** webdesigns4u.co.za@gmail.com and 071 437 9593 (links use `tel:+27714379593` and `wa.me/27714379593`). Change them in one place: `contact` in `assets/js/config.js`.
2. **Turn on enquiry emails.** This takes about 5 minutes; see "Enquiries to your Gmail" below.
3. **Video licensing.** The clips in `/media` came from Pinterest creators. Replace them with footage you own or have licensed before a commercial launch. See "Swapping videos".
4. **Domain in metadata.** In `index.html`, change `og:image` to the full URL once the domain is live.

## Deploy (GitHub, Netlify, GoDaddy)

1. Create a new GitHub repository and upload everything in this folder, keeping the structure.
2. In Netlify, go to **Add new site**, then **Import from GitHub** and pick the repo. Leave the build command empty. `netlify.toml` already sets the publish folder and functions.
3. In Netlify, go to **Domain management**, then **Add domain**. Enter your GoDaddy domain.
4. In GoDaddy DNS, point the domain to Netlify. Either switch the nameservers to Netlify's (simplest), or add an `A` record for `@` to `75.2.60.5` and a `CNAME` for `www` to `your-site.netlify.app`. HTTPS turns on automatically once DNS resolves.
5. In Netlify, go to **Forms** and enable form detection, then redeploy once. Two forms appear: `build-my-website` and `contact`.

## Enquiries to your Gmail

Every "Build my website" enquiry is emailed to **webdesigns4u.co.za@gmail.com**. It's laid out as *WEB DESIGNS4U | NEW WEBSITE ENQUIRY* with every answer, the journey data, the source and the date and time in South African time. Reply-to is set to the customer, and there's a one-tap button to WhatsApp them back.

**Setup (one time):**

1. Create a free account at **resend.com** using **webdesigns4u.co.za@gmail.com**. This matters: until you verify your own domain, Resend's test sender only delivers to the account owner's address, which is exactly where enquiries need to go.
2. In Resend, create an API key.
3. In Netlify, go to **Site configuration**, then **Environment variables**, and add `RESEND_API_KEY` with that key. Redeploy.
4. Backup channel: in Netlify, go to **Forms**, then **Form notifications**, and add an email notification to webdesigns4u.co.za@gmail.com for the `build-my-website` and `contact` forms.
5. Submit a test enquiry on the live site and check your Gmail (and the spam folder, the first time).

**Honest delivery.** The site only shows "Your next chapter starts here" when the email function confirms the email was sent, or Netlify Forms has stored the enquiry (it then emails you via step 4). If both fail, the visitor sees "Something interrupted the connection" with the whole enquiry pre-typed into WhatsApp. No lead is lost.

**Built-in safeguards:** validation (email format, SA and international numbers, required fields), one submission per click, the same enquiry blocked from re-sending for 30 minutes, a spam honeypot, and no secrets in the frontend. The API key lives only in Netlify.

| Variable | Needed? | What it does |
|---|---|---|
| `RESEND_API_KEY` | Yes | Sends the enquiry email. |
| `LEAD_NOTIFY_TO` | No | Defaults to webdesigns4u.co.za@gmail.com. |
| `LEAD_FROM` | No | Defaults to Resend's test sender. Set it to e.g. `Web Designs4U <hello@webdesigns4u.co.za>` once that domain is verified in Resend. |
| `LEAD_CONFIRM` | No | `true` emails the customer a confirmation. Needs your own verified domain first. |
| `LEAD_WEBHOOK_URLS` | No | Comma-separated Zapier, Make or n8n webhooks for Google Sheets, a CRM and so on. |

**WhatsApp.** After submitting (or if sending fails), visitors get a WhatsApp button with their full enquiry already typed; they only press Send. Every other WhatsApp button on the site pre-fills whatever they told the site in chapter 06.

**Previews never send.** On `file://` or claude.ai the intake runs fully but shows "Preview mode". To force sending, set `leads.mode` to `"live"` in `config.js`.

## Swapping videos

All media is mapped in `config.js` under `media`. Each entry has `src`, `poster` and an optional `mobile` file.

- Keep clips vertical (9:16), 6–12 seconds, muted and looping. They play inside the phone-shaped portal on desktop and full screen on mobile.
- Encode for the web (about 0.5–1.2 MB each). Use a new filename when you replace a clip so caches update.

```bash
ffmpeg -i input.mp4 -t 10 -an -vf "scale=540:-2,fps=24" -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart media/hero-v2.mp4
ffmpeg -i input.mp4 -frames:v 1 -vf "scale=540:-2" -q:v 5 media/hero-v2.jpg
```

| Key | Where it plays |
|---|---|
| hero | Opening screen tunnel |
| internet | Ch 01 |
| design | Ch 02/03 background and process (Design) |
| story | Ch 05 |
| identity | Ch 06/07 |
| journey | Ch 08 |
| strategy, build | Ch 09 process |
| network | Ch 10 hub |
| salesperson, growth | Ch 11 |
| final | Ch 12 and final screen |
| intake | "Build my website" flow |
| alive | Submission screen |

## Editing content

- **CTA labels, brand lines, intake options, integrations:** `config.js`.
- **Chapter copy:** `index.html`. Each chapter is one `<section>`, and all text is real HTML that Google can read.
- **Generated website concepts (ch 07):** `assets/js/concept-engine.js` has headlines, services and CTAs per business type, plus visual themes per feel.
- **AI later:** set `ai.endpoint` in `config.js`. The engine POSTs the visitor's answers and expects the JSON shape documented at the top of `concept-engine.js`. If it fails, it falls back to the built-in engine.

## Files

```
index.html                    All chapters, intake, contact, menu
assets/css/main.css           Design system and layouts
assets/js/config.js           Everything editable
assets/js/app.js              Scroll engine, state, personalisation, intake
assets/js/concept-engine.js   Ch 07 website concept generator
assets/js/leads.js            Lead delivery rules, duplicate guard, source tracking
assets/js/audio.js            Optional synthesized sound (off by default)
assets/fonts/archivo-var.woff2  Self-hosted variable font (80 KB)
netlify/functions/lead.mjs    Webhooks and emails
netlify.toml                  Publish, functions, caching, security headers
media/                        Videos and poster frames
```

## Built in

- **Accessibility:** keyboard navigation, focus traps in overlays, Escape to close, real form labels, a skip link, and `prefers-reduced-motion`. Under reduced motion the intro shortens, videos show posters and animations stop. Videos are decorative (no speech), and every message they support also exists as text.
- **Performance:** videos load only near the viewport and pause off-screen, the font is self-hosted, there are no frameworks, and Data Saver shows posters only.
- **SEO:** a descriptive title and meta, a single H1, H2 per chapter, ProfessionalService schema for Gqeberha and Port Elizabeth, and `robots.txt`. Add a `sitemap.xml` once the domain is live.
