// XPTV: XVideos extension (Final Packaged Build)
// Tabs: 收藏 / 基礎 / 官方大類 / 分類 / 熱門標籤 / 熱門搜索
// 技術學習用途，站點可能改版需調整選擇器與正則

const cheerio = createCheerio();
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const appConfig = {
  ver: 1,
  title: "XVideos",
  site: "https://www.xvideos.com",
  tabs: []
};

function abs(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return appConfig.site.replace(/\/$/, "") + (u.startsWith("/") ? u : "/" + u);
}

// === 配置 ===
async function getConfig() {
  if (appConfig.tabs.length <= 0) {
    // 收藏區
    appConfig.tabs.push({ name: "收藏區", ext: {}, ui: 0 });
    appConfig.tabs.push({ name: "★ 巨乳 Big Tits", ext: { url: "https://www.xvideos.com/c/Big_Tits-23" }, ui: 1 });
    appConfig.tabs.push({ name: "★ 台灣 Taiwan Search", ext: { url: "https://www.xvideos.com/?k=taiwan&top" }, ui: 1 });
    appConfig.tabs.push({ name: "★ SWAG", ext: { url: "https://www.xvideos.com/?k=swag&top" }, ui: 1 });
    appConfig.tabs.push({ name: "★ AI", ext: { url: "https://www.xvideos.com/c/AI-239" }, ui: 1 });

    // 基礎區
    appConfig.tabs.push({ name: "基礎區", ext: {}, ui: 0 });
    appConfig.tabs.push({ name: "首頁 Home", ext: { id: "" }, ui: 1 });
    appConfig.tabs.push({ name: "最新 Latest", ext: { id: "new" }, ui: 1 });
    appConfig.tabs.push({ name: "最多觀看 Most Viewed", ext: { id: "top" }, ui: 1 });
    appConfig.tabs.push({ name: "HD 精選 HD", ext: { id: "quality_hd" }, ui: 1 });
    appConfig.tabs.push({ name: "女同性戀 Lesbian", ext: { id: "lesbian" }, ui: 1 });
    appConfig.tabs.push({ name: "亞洲 Asian", ext: { id: "asian" }, ui: 1 });
    appConfig.tabs.push({ name: "素人 Amateur", ext: { id: "amateur" }, ui: 1 });

    // 官方大類
    appConfig.tabs.push({ name: "官方大類", ext: {}, ui: 0 });
    appConfig.tabs.push({ name: "最佳影片 Best Videos", ext: { url: "https://www.xvideos.com/best" }, ui: 1 });

    // 頻道 (動態展開)
    appConfig.tabs.push({ name: "頻道 Channels", ext: {}, ui: 0 });
    try {
      const { data } = await $fetch.get("https://www.xvideos.com/channels-index", { headers: { "User-Agent": UA } });
      const $ = cheerio.load(data);
      let count = 0;
      $("div#channels li a, div.channel-list a").each((_, el) => {
        if (count >= 20) return false; // 只取前20
        const name = $(el).text().trim();
        const href = $(el).attr("href");
        if (name && href) {
          appConfig.tabs.push({ name: "[頻道] " + name, ext: { url: abs(href) }, ui: 1 });
          count++;
        }
      });
    } catch (e) {
      $print("抓取頻道失敗：" + e);
    }

    appConfig.tabs.push({ name: "色情明星 Pornstars", ext: { url: "https://www.xvideos.com/pornstars-index" }, ui: 1 });
    appConfig.tabs.push({ name: "RED 視頻 RED Videos", ext: { url: "https://www.xvideos.com/red" }, ui: 1 });
    appConfig.tabs.push({ name: "現場直播 Live Cams", ext: { url: "https://www.xvideos.com/cams/" }, ui: 1 });

    // 分類
    appConfig.tabs.push({ name: "分類 Categories", ext: {}, ui: 0 });
    try {
      const { data } = await $fetch.get(`${appConfig.site}/categories/`, { headers: { "User-Agent": UA } });
      const $ = cheerio.load(data);
      $("ul#categories li a, div.cat-list a").each((_, el) => {
        const name = $(el).text().trim();
        const href = $(el).attr("href");
        if (name && href) {
          appConfig.tabs.push({ name: "[分類] " + name, ext: { url: abs(href) }, ui: 1 });
        }
      });
    } catch (e) {
      $print("抓取分類失敗：" + e);
    }

    // 標籤 (限 20)
    appConfig.tabs.push({ name: "熱門標籤 Tags", ext: {}, ui: 0 });
    try {
      const { data } = await $fetch.get(`${appConfig.site}/tags/`, { headers: { "User-Agent": UA } });
      const $ = cheerio.load(data);
      let count = 0;
      $("ul.tags li a, div.tag-list a").each((_, el) => {
        if (count >= 20) return false;
        const name = $(el).text().trim();
        const href = $(el).attr("href");
        if (name && href) {
          appConfig.tabs.push({ name: "[標籤] " + name, ext: { url: abs(href) }, ui: 1 });
          count++;
        }
      });
    } catch (e) {
      $print("抓取標籤失敗：" + e);
    }

    // 熱門搜索 (限 20)
    appConfig.tabs.push({ name: "熱門搜索 Trending", ext: {}, ui: 0 });
    try {
      const { data } = await $fetch.get(appConfig.site, { headers: { "User-Agent": UA } });
      const $ = cheerio.load(data);
      let count = 0;
      $("div.trending-searches a, .search-keywords a").each((_, el) => {
        if (count >= 20) return false;
        const keyword = $(el).text().trim();
        if (keyword) {
          appConfig.tabs.push({ name: "⚡ " + keyword, ext: { keyword }, ui: 1 });
          count++;
        }
      });
    } catch (e) {
      $print("抓取熱門搜索詞失敗：" + e);
    }
  }
  return jsonify(appConfig);
}

// === 影片清單 ===
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
    const title = $(el).find("p.title").text().trim() || a.attr("title") || $(el).find("img").attr("alt") || "";
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

// === 播放源 ===
async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });

  const tracks = [];
  const m3u8 = data.match(/setVideoHLS\(['"](.+?)['"]\)/)?.[1];
  if (m3u8) tracks.push({ name: "HLS", ext: { url: m3u8, referer: url } });

  const mp4High = data.match(/setVideoUrlHigh\(['"](.+?)['"]\)/)?.[1];
  const mp4Low = data.match(/setVideoUrlLow\(['"](.+?)['"]\)/)?.[1];
  if (mp4High) tracks.push({ name: "MP4(高)", ext: { url: mp4High, referer: url } });
  if (mp4Low) tracks.push({ name: "MP4(低)", ext: { url: mp4Low, referer: url } });

  return jsonify({ list: [{ title: "播放", tracks }] });
}

// === 播放資訊 ===
async function getPlayinfo(ext) {
  ext = argsify(ext);
  const playUrl = ext.url;
  const referer = ext.referer || appConfig.site;
  return jsonify({ urls: [playUrl], headers: [{ "User-Agent": UA, Referer: referer }] });
}

// === 搜尋 ===
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
    const title = $(el).find("p.title").text().trim() || a.attr("title") || $(el).find("img").attr("alt") || "";
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
