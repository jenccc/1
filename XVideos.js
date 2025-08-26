// XPTV: XVideos extension (含收藏區 ★)

const cheerio = createCheerio();
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const appConfig = {
  ver: 1,
  title: "XVideos",
  site: "https://www.xvideos.com",
  tabs: [
    // 收藏區 ★
    { name: "★ 日本", ext: { url: "https://www.xvideos.com/c/Japan-28" }, ui: 1 },
    { name: "★ 台灣", ext: { url: "https://www.xvideos.com/c/Taiwan-201" }, ui: 1 },
    { name: "★ 大陸", ext: { url: "https://www.xvideos.com/c/China-203" }, ui: 1 },
    { name: "★ 歐美", ext: { url: "https://www.xvideos.com/c/Western-35" }, ui: 1 },

    // 基本區
    { name: "首頁", ext: { id: "" }, ui: 1 },
    { name: "最新", ext: { id: "new" }, ui: 1 },
    { name: "最多觀看", ext: { id: "top" }, ui: 1 },
    { name: "HD 精選", ext: { id: "quality_hd" }, ui: 1 },
    { name: "女同性戀", ext: { id: "lesbian" }, ui: 1 },
    { name: "亞洲", ext: { id: "asian" }, ui: 1 },
    { name: "素人", ext: { id: "amateur" }, ui: 1 }
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
  const { id = "", url: extUrl = "", page = 1 } = ext;

  let url = appConfig.site;
  if (extUrl) {
    url = extUrl;
    if (page > 1) url = url.replace(/\/$/, "") + "/" + page;
  } else if (id) {
    url = `${appConfig.site}/tags/${id}/${page}`;
  } else if (page > 1) {
    url = `${appConfig.site}/new/${page}`;
  }

  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);

  const list = [];
  $("div.thumb-block, div.video-thumb").each((_, el) => {
    const a = $(el).find("a.thumb, a").first();
    const href = a.attr("href");
    const title =
      $(el).find("p.title").text().trim() ||
      a.attr("title") ||
      $(el).find("img").attr("alt") ||
      "";
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

async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });

  const tracks = [];
  const m3u8 = data.match(/setVideoHLS\(['"](.+?)['"]\)/)?.[1];
  if (m3u8) tracks.push({ name: "HLS", pan: "", ext: { url: m3u8, referer: url } });

  const mp4High = data.match(/setVideoUrlHigh\(['"](.+?)['"]\)/)?.[1];
  const mp4Low = data.match(/setVideoUrlLow\(['"](.+?)['"]\)/)?.[1];
  if (mp4High) tracks.push({ name: "MP4(高)", pan: "", ext: { url: mp4High, referer: url } });
  if (mp4Low) tracks.push({ name: "MP4(低)", pan: "", ext: { url: mp4Low, referer: url } });

  return jsonify({ list: [{ title: "播放", tracks }] });
}

async function getPlayinfo(ext) {
  ext = argsify(ext);
  const playUrl = ext.url;
  const referer = ext.referer || appConfig.site;
  const headers = { "User-Agent": UA, Referer: referer };
  return jsonify({ urls: [playUrl], headers: [headers] });
}

async function search(ext) {
  ext = argsify(ext);
  const text = ext.text || ext.keyword || "";
  const page = Number(ext.page || 1);
  const url = `${appConfig.site}/?k=${encodeURIComponent(text)}&p=${page}`;
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);

  const list = [];
  $("div.thumb-block, div.video-thumb").each((_, el) => {
    const a = $(el).find("a.thumb, a").first();
    const href = a.attr("href");
    const title =
      $(el).find("p.title").text().trim() ||
      a.attr("title") ||
      $(el).find("img").attr("alt") ||
      "";
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
