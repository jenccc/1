// XPTV Extension: XVideos (Enhanced + Pornstars)
// Version: 2.1

const cheerio = createCheerio();
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const appConfig = {
  ver: 2,
  title: "XVideos",
  site: "https://www.xvideos.com",
  tabs: [
    // === 主頁 ===
    { name: "首頁 Home", ext: { id: "" }, ui: 1 },
    { name: "最新 Latest", ext: { id: "new" }, ui: 1 },
    { name: "最多觀看 Most Viewed", ext: { id: "top" }, ui: 1 },
    { name: "HD 精選 HD Videos", ext: { id: "quality_hd" }, ui: 1 },

    // === 預設分類 ===
    { name: "─", ext: {}, ui: 0 },
    { name: "巨乳 Big Tits", ext: { url: "https://www.xvideos.com/c/Big_Tits-23" }, ui: 1 },
    { name: "亞洲 Asian", ext: { url: "https://www.xvideos.com/c/Asian-28" }, ui: 1 },
    { name: "素人 Amateur", ext: { url: "https://www.xvideos.com/c/Amateur-3" }, ui: 1 },
    { name: "女同性戀 Lesbian", ext: { url: "https://www.xvideos.com/c/Lesbian-30" }, ui: 1 },
    { name: "歐美 Western", ext: { url: "https://www.xvideos.com/c/Western-2" }, ui: 1 },
    { name: "台灣 Taiwan", ext: { url: "https://www.xvideos.com/?k=taiwan&top" }, ui: 1 },
    { name: "SWAG", ext: { url: "https://www.xvideos.com/?k=swag&top" }, ui: 1 },
    { name: "AI", ext: { url: "https://www.xvideos.com/c/AI-239" }, ui: 1 },

    // === 擴充熱門分類 ===
    { name: "─", ext: {}, ui: 0 },
    { name: "日本 Japan", ext: { url: "https://www.xvideos.com/c/Japanese-25" }, ui: 1 },
    { name: "韓國 Korea", ext: { url: "https://www.xvideos.com/?k=korean" }, ui: 1 },
    { name: "中國 China", ext: { url: "https://www.xvideos.com/?k=china" }, ui: 1 },
    { name: "情侶 Couple", ext: { url: "https://www.xvideos.com/?k=couple" }, ui: 1 },
    { name: "學生 Student", ext: { url: "https://www.xvideos.com/?k=student" }, ui: 1 },
    { name: "老師 Teacher", ext: { url: "https://www.xvideos.com/?k=teacher" }, ui: 1 },
    { name: "OL 辦公室 Office Lady", ext: { url: "https://www.xvideos.com/?k=office+lady" }, ui: 1 },
    { name: "人妻 Mature", ext: { url: "https://www.xvideos.com/c/MILF-26" }, ui: 1 },
    { name: "口交 Blowjob", ext: { url: "https://www.xvideos.com/c/Blowjob-12" }, ui: 1 },
    { name: "自慰 Masturbation", ext: { url: "https://www.xvideos.com/c/Masturbation-48" }, ui: 1 },
    { name: "群交 Orgy", ext: { url: "https://www.xvideos.com/c/Orgy-43" }, ui: 1 },
    { name: "角色扮演 Cosplay", ext: { url: "https://www.xvideos.com/?k=cosplay" }, ui: 1 },
    { name: "動漫 Hentai", ext: { url: "https://www.xvideos.com/c/Hentai-32" }, ui: 1 },
    { name: "SM / 調教 BDSM", ext: { url: "https://www.xvideos.com/c/BDSM-35" }, ui: 1 },
    { name: "偷拍 Candid", ext: { url: "https://www.xvideos.com/?k=candid" }, ui: 1 },
    { name: "直播 Live", ext: { url: "https://www.xvideos.com/?k=live" }, ui: 1 },
    { name: "中文 Chinese", ext: { url: "https://www.xvideos.com/?k=chinese" }, ui: 1 },

    // === 色情明星 Pornstars ===
    { name: "─", ext: {}, ui: 0 },
    { name: "色情明星 Pornstars", ext: { url: "https://www.xvideos.com/pornstars-index" }, ui: 1 },
    { name: "熱門明星 Top Pornstars", ext: { url: "https://www.xvideos.com/pornstars-index/top" }, ui: 1 },
    { name: "日本女優 Japanese Pornstars", ext: { url: "https://www.xvideos.com/pornstars-index/japanese" }, ui: 1 },
    { name: "韓國女優 Korean Pornstars", ext: { url: "https://www.xvideos.com/?k=korean+pornstar" }, ui: 1 },
    { name: "歐美女優 Western Pornstars", ext: { url: "https://www.xvideos.com/pornstars-index/american" }, ui: 1 },
    { name: "素人偶像 Amateur Stars", ext: { url: "https://www.xvideos.com/?k=amateur+pornstar" }, ui: 1 },
    { name: "台灣創作者 Taiwan Creators", ext: { url: "https://www.xvideos.com/?k=taiwan+pornstar" }, ui: 1 },
    { name: "SWAG 女優 SWAG Stars", ext: { url: "https://www.xvideos.com/?k=swag+pornstar" }, ui: 1 },
    { name: "AI 虛擬女優 AI Pornstars", ext: { url: "https://www.xvideos.com/?k=AI+pornstar" }, ui: 1 }
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

async function getCards(ext) {
  ext = argsify(ext);
  const { id = "", page = 1, url } = ext;
  let listUrl = url || appConfig.site;
  if (id) listUrl = `${appConfig.site}/tags/${id}/${page}`;
  else if (page > 1) listUrl = `${appConfig.site}/new/${page}`;

  const { data } = await $fetch.get(listUrl, { headers: { "User-Agent": UA } }).catch(() => ({ data: "" }));
  const $ = cheerio.load(data || "");
  const list = [];

  $("div.thumb-block, div.thumb-under").each((_, el) => {
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
        vod_pic: abs(cover),
        vod_remarks: views,
        vod_duration: duration,
        ext: { url: abs(href) }
      });
    }
  });

  return jsonify({ list, page, pagecount: 999 });
}

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

  const ogVideo = data.match(/property="og:video" content="([^"]+)"/)?.[1];
  if (!tracks.length && ogVideo) tracks.push({ name: "OG Video", ext: { url: ogVideo, referer: url } });

  if (!tracks.length) tracks.push({ name: "原頁面", ext: { url, referer: url } });

  return jsonify({ list: [{ title: "播放", tracks }] });
}

async function getPlayinfo(ext) {
  ext = argsify(ext);
  return jsonify({ urls: [ext.url], headers: [{ "User-Agent": UA, Referer: appConfig.site }] });
}

async function search(ext) {
  ext = argsify(ext);
  const text = ext.text || ext.keyword || "";
  const page = Number(ext.page || 1);
  const url = `${appConfig.site}/?k=${encodeURIComponent(text)}&p=${page}`;

  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);
  const list = [];

  $("div.thumb-block, div.thumb-under").each((_, el) => {
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
        vod_pic: abs(cover),
        vod_remarks: views,
        vod_duration: duration,
        ext: { url: abs(href) }
      });
    }
  });

  return jsonify({ list, page });
}
