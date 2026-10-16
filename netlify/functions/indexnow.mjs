/* =====================================================================
   INDEXNOW  |  runs after every successful production deploy
   ---------------------------------------------------------------------
   Tells Bing (and the other IndexNow search engines: Yandex, Seznam,
   Naver, Yep) that the site changed, so updates get crawled quickly.
   Google does not use IndexNow; Google uses the sitemap submitted in
   Search Console. The key file (c3203affceac220ebd6301f2b7caa259.txt) proves we own the domain.
   ===================================================================== */
const HOST = "webdesigns4u.co.za";
const KEY = "c3203affceac220ebd6301f2b7caa259";
const URLS = ["https://webdesigns4u.co.za/"];

export default {
  async deploySucceeded(event) {
    if (event?.deploy?.context && event.deploy.context !== "production") return;
    try {
      const res = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: URLS })
      });
      console.log("[indexnow]", res.status, res.status < 300 ? "submitted" : await res.text());
    } catch (e) {
      console.error("[indexnow] failed:", e.message);
    }
  }
};
