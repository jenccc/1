// XPTV: XVideos extension (Final Full Build)

const cheerio = createCheerio();
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const appConfig = {
  ver: 1,
  title: "XVideos",
  site: "https://www.xvideos.com",
  tabs: [
    { name: "首頁 Home", ext: { id: "" }, ui: 1 },
    { name: "最新 Latest", ext: { id: "new" }, ui: 1 },
    { name: "最多觀看 Most Viewed", ext: { id: "top" }, ui: 1 },
    { name: "HD 精選 HD Videos", ext: { id: "quality_hd" }, ui: 1 }
  ]
};

function abs(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return appConfig.site.replace(/\/$/, "") + (u.startsWith("/") ? u : "/" + u);
}

// === Config: 動態抓分類、頻道、Pornstars ===
async function getConfig() {
  if (appConfig.tabs.length <= 4) {
    // Categories
    appConfig.tabs.push({ name: "────────── 熱門類別 Categories", ext: {}, ui: 0 });
    try {
      const { data } = await $fetch.get(`${appConfig.site}/categories`, { headers: { "User-Agent": UA } });
      const $ = cheerio.load(data);
      $(".categories a").each((_, el) => {
        const name = $(el).text().trim();
        const href = $(el).attr("href");
        if (name && href) {
          appConfig.tabs.push({ name: "[分類] " + name, ext: { url: abs(href) }, ui: 1 });
        }
      });
    } catch (e) { $print("抓取 Categories 失敗：" + e); }

    // Channels
    appConfig.tabs.push({ name: "────────── 頻道 Channels", ext: {}, ui: 0 });
    try {
      const { data } = await $fetch.get(`${appConfig.site}/channels-index`, { headers: { "User-Agent": UA } });
      const $ = cheerio.load(data);
      $(".thumb-block a").each((_, el) => {
        const name = $(el).attr("title") || $(el).text().trim();
        const href = $(el).attr("href");
        if (name && href) {
          appConfig.tabs.push({ name: "[頻道] " + name, ext: { url: abs(href) }, ui: 1 });
        }
      });
    } catch (e) { $print("抓取 Channels 失敗：" + e); }

    // Pornstars
    appConfig.tabs.push({ name: "────────── 明星 Pornstars", ext: {}, ui: 0 });
    try {
      const { data } = await $fetch.get(`${appConfig.site}/pornstars-index`, { headers: { "User-Agent": UA } });
      const $ = cheerio.load(data);
      $(".pornstar-profile a").each((_, el) => {
        const name = $(el).attr("title") || $(el).text().trim();
        const href = $(el).attr("href");
        if (name && href) {
          appConfig.tabs.push({ name: "[明星] " + name, ext: { url: abs(href) }, ui: 1 });
        }
      });
    } catch (e) { $print("抓取 Pornstars 失敗：" + e); }
  }
  return jsonify(appConfig);
}

// === Cards ===
async function getCards(ext) {
  ext = argsify(ext);
  const { id = "", page = 1, url } = ext;
  let listUrl = url || appConfig.site;
  if (id) listUrl = `${appConfig.site}/tags/${id}/${page}`;
  else if (page > 1) listUrl = `${appConfig.site}/new/${page}`;

  const { data } = await $fetch.get(listUrl, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);
  const list = [];

  $("div.thumb-block").each((_, el) => {
    const a = $(el).find("a.thumb, a");
    const href = a.attr("href");
    const title = $(el).find("p.title").text().trim() || a.attr("title") || "";
    const img = $(el).find("img");
    const cover = img.attr("data-src") || img.attr("src") || "";
    const views = $(el).find(".metadata span.views").text().trim() || "";
    const duration = $(el).find(".duration").text().trim() || "";

    if (href && title && cover) {
      list.push({ vod_id: abs(href), vod_name: title, vod_pic: cover, vod_remarks: views, vod_duration: duration, ext: { url: abs(href) } });
    }
  });

  return jsonify({ list, page, pagecount: 999 });
}

// === Tracks ===
async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const tracks = [];

  // HLS
  const m3u8 = data.match(/setVideoHLS\(['"]([^'"]+)['"]\)/)?.[1];
  if (m3u8) tracks.push({ name: "HLS", ext: { url: m3u8, referer: url } });

  // MP4 高低清
  const mp4High = data.match(/setVideoUrlHigh\(['"]([^'"]+)['"]\)/)?.[1];
  const mp4Low = data.match(/setVideoUrlLow\(['"]([^'"]+)['"]\)/)?.[1];
  if (mp4High) tracks.push({ name: "MP4 高清", ext: { url: mp4High, referer: url } });
  if (mp4Low) tracks.push({ name: "MP4 低清", ext: { url: mp4Low, referer: url } });

  // 後備 JSON
  if (tracks.length === 0) {
    const jsonStr = data.match(/html5player\s*=\s*({[\s\S]*?});/)?.[1];
    if (jsonStr) {
      try {
        const j = JSON.parse(jsonStr);
        if (j.HLS) tracks.push({ name: "HLS", ext: { url: j.HLS, referer: url } });
        if (j.highdef) tracks.push({ name: "MP4 高清", ext: { url: j.highdef, referer: url } });
        if (j.lowdef) tracks.push({ name: "MP4 低清", ext: { url: j.lowdef, referer: url } });
      } catch (e) {}
    }
  }

  // OpenGraph
  if (tracks.length === 0) {
    const $ = cheerio.load(data);
    const ogVideo = $('meta[property="og:video"]').attr("content");
    if (ogVideo) tracks.push({ name: "OG Video", ext: { url: ogVideo, referer: url } });
  }

  // 保底
  if (tracks.length === 0) tracks.push({ name: "原頁面", ext: { url, referer: url } });

  return jsonify({ list: [{ title: "播放", tracks }] });
}

// === Playinfo ===
async function getPlayinfo(ext) {
  ext = argsify(ext);
  return jsonify({ urls: [ext.url], headers: [{ "User-Agent": UA, Referer: appConfig.site }] });
}

// === Search ===
async function search(ext) {
  ext = argsify(ext);
  const text = ext.text || ext.keyword || "";
  const page = Number(ext.page || 1);
  const url = `${appConfig.site}/?k=${encodeURIComponent(text)}&p=${page}`;

  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);
  const list = [];

  $("div.thumb-block").each((_, el) => {
    const a = $(el).find("a.thumb, a");
    const href = a.attr("href");
    const title = $(el).find("p.title").text().trim() || a.attr("title") || "";
    const img = $(el).find("img");
    const cover = img.attr("data-src") || img.attr("src") || "";
    const views = $(el).find(".metadata span.views").text().trim() || "";
    const duration = $(el).find(".duration").text().trim() || "";

    if (href && title && cover) {
      list.push({ vod_id: abs(href), vod_name: title, vod_pic: cover, vod_remarks: views, vod_duration: duration, ext: { url: abs(href) } });
    }
  });

  return jsonify({ list, page });
}
