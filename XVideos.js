// XPTV: XVideos extension (clean build)
// 技術學習用途，站點可能改版需調整選擇器與正則

const cheerio = createCheerio();
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const appConfig = {
  ver: 1,
  title: "XVideos",
  site: "https://www.xvideos.com",
  tabs: [
    { name: "首頁", ext: { id: "" }, ui: 1 },
    { name: "最新", ext: { id: "new" }, ui: 1 },
    { name: "最多觀看", ext: { id: "top" }, ui: 1 },
    { name: "HD 精選", ext: { id: "quality_hd" }, ui: 1 },
    { name: "女同性戀", ext: { id: "lesbian" }, ui: 1 },
    { name: "亞洲", ext: { id: "asian" }, ui: 1 },
    { name: "素人", ext: { id: "amateur" }, ui: 1 },
  ],
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
  const { id = "", page = 1 } = ext;

  let url = appConfig.site;
  if (id) {
    // 標籤/分類
    url = `${appConfig.site}/tags/${id}/${page}`;
  } else if (page > 1) {
    // 首頁預設走「最新」分頁
    url = `${appConfig.site}/new/${page}`;
  }

  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);

  const list = [];
  $("div.thumb-block").each((_, el) => {
    const a = $(el).find("a.thumb, a");
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
        ext: { url: abs(href) },
      });
    }
  });

  // XVideos 沒有明確 pagecount，給個大數
  return jsonify({ list, page, pagecount: 999 });
}

async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;
  // 在 getTracks 先把可用播放源都找出來，交給 getPlayinfo 直播
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });

  const tracks = [];

  // 1) HLS
  const m3u8 =
    data.match(/setVideoHLS\('([^']+)'\)/)?.[1] ||
    data.match(/setVideoHLS\("([^"]+)"\)/)?.[1];
  if (m3u8) {
    tracks.push({ name: "HLS", pan: "", ext: { url: m3u8, referer: url } });
  }

  // 2) MP4 高/低清
  const mp4High =
    data.match(/setVideoUrlHigh\('([^']+)'\)/)?.[1] ||
    data.match(/setVideoUrlHigh\("([^"]+)"\)/)?.[1];
  const mp4Low =
    data.match(/setVideoUrlLow\('([^']+)'\)/)?.[1] ||
    data.match(/setVideoUrlLow\("([^"]+)"\)/)?.[1];

  if (mp4High) tracks.push({ name: "MP4(高)", pan: "", ext: { url: mp4High, referer: url } });
  if (mp4Low) tracks.push({ name: "MP4(低)", pan: "", ext: { url: mp4Low, referer: url } });

  // 3) 後備：頁面 JSON 片段（有時存在）
  if (tracks.length === 0) {
    try {
      const jsonStr = data.match(/html5player\s*=\s*({[\s\S]*?});/)?.[1];
      if (jsonStr) {
        const j = JSON.parse(jsonStr);
        if (j.HLS) tracks.push({ name: "HLS", pan: "", ext: { url: j.HLS, referer: url } });
        if (j.highdef) tracks.push({ name: "MP4(高)", pan: "", ext: { url: j.highdef, referer: url } });
        if (j.lowdef) tracks.push({ name: "MP4(低)", pan: "", ext: { url: j.lowdef, referer: url } });
      }
    } catch (e) {
      // 忽略
    }
  }

  // 4) 再後備：OpenGraph
  if (tracks.length === 0) {
    const $ = cheerio.load(data);
    const ogVideo = $('meta[property="og:video"]').attr("content");
    if (ogVideo) tracks.push({ name: "OG Video", pan: "", ext: { url: ogVideo, referer: url } });
  }

  // 至少留一條（避免空陣列）
  if (tracks.length === 0) {
    tracks.push({ name: "原頁面", pan: "", ext: { url, referer: url } });
  }

  return jsonify({
    list: [
      {
        title: "播放",
        tracks,
      },
    ],
  });
}

async function getPlayinfo(ext) {
  ext = argsify(ext);
  const playUrl = ext.url;
  const referer = ext.referer || appConfig.site;

  const headers = {
    "User-Agent": UA,
    Referer: referer,
    // XVideos 多數情況不需 Cookies；如遇到區域/年齡牆可在此補 Cookie
    // Cookie: "age_verified=1; ..."
  };

  return jsonify({
    urls: [playUrl],
    headers: [headers],
  });
}

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
        ext: { url: abs(href) },
      });
    }
  });

  return jsonify({ list, page });
}
