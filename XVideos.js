// XPTV: XVideos extension (Default Categories Only)

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
    { name: "HD 精選 HD Videos", ext: { id: "quality_hd" }, ui: 1 },

    // === 預設分類 (固定常用) ===
    { name: "─", ext: {}, ui: 0 },
    { name: "巨乳 Big Tits", ext: { url: "https://www.xvideos.com/c/Big_Tits-23" }, ui: 1 },
    { name: "亞洲 Asian", ext: { url: "https://www.xvideos.com/c/Asian-28" }, ui: 1 },
    { name: "素人 Amateur", ext: { url: "https://www.xvideos.com/c/Amateur-3" }, ui: 1 },
    { name: "女同性戀 Lesbian", ext: { url: "https://www.xvideos.com/c/Lesbian-30" }, ui: 1 },
    { name: "歐美 Western", ext: { url: "https://www.xvideos.com/c/Western-2" }, ui: 1 },
    { name: "台灣 Taiwan", ext: { url: "https://www.xvideos.com/?k=taiwan&top" }, ui: 1 },
    { name: "SWAG", ext: { url: "https://www.xvideos.com/?k=swag&top" }, ui: 1 },
    { name: "AI", ext: { url: "https://www.xvideos.com/c/AI-239" }, ui: 1 }
  ]
};

function abs(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return appConfig.site.replace(/\/$/, "") + (u.startsWith("/") ? u : "/" + u);
}

async function getConfig() {
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
      list.push({
        vod_id: abs(href),
        vod_name: title,
        vod_pic: cover,
        vod_remarks: views,
        vod_duration: duration,
        ext: { url: abs(href) }
      });
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

  const m3u8 = data.match(/setVideoHLS\(['"]([^'"]+)['"]\)/)?.[1];
  if (m3u8) tracks.push({ name: "HLS", ext: { url: m3u8, referer: url } });

  const mp4High = data.match(/setVideoUrlHigh\(['"]([^'"]+)['"]\)/)?.[1];
  const mp4Low = data.match(/setVideoUrlLow\(['"]([^'"]+)['"]\)/)?.[1];
  if (mp4High) tracks.push({ name: "MP4 高清", ext: { url: mp4High, referer: url } });
  if (mp4Low) tracks.push({ name: "MP4 低清", ext: { url: mp4Low, referer: url } });

  if (tracks.length === 0) {
    const ogVideo = data.match(/property="og:video" content="([^"]+)"/)?.[1];
    if (ogVideo) tracks.push({ name: "OG Video", ext: { url: ogVideo, referer: url } });
  }

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
      list.push({
        vod_id: abs(href),
        vod_name: title,
        vod_pic: cover,
        vod_remarks: views,
        vod_duration: duration,
        ext: { url: abs(href) }
      });
    }
  });

  return jsonify({ list, page });
}
