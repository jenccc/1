// XPTV: Pornhub extension (cn.pornhub.com, Test + Categories + Pornstars)

const cheerio = createCheerio();
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const appConfig = {
  ver: 1,
  title: "Pornhub",
  site: "https://cn.pornhub.com",
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
    // 基礎區
    appConfig.tabs.push({ name: "────────── 基礎區", ext: {}, ui: 0 });
    appConfig.tabs.push({ name: "首頁 Home", ext: { url: "https://cn.pornhub.com/video" }, ui: 1 });
    appConfig.tabs.push({ name: "最新 Latest", ext: { url: "https://cn.pornhub.com/video?o=cm" }, ui: 1 });

    // 熱門類別 Categories
    appConfig.tabs.push({ name: "────────── 熱門類別 Categories", ext: {}, ui: 0 });
    try {
      const { data } = await $fetch.get("https://cn.pornhub.com/categories", { headers: { "User-Agent": UA } });
      const $ = cheerio.load(data);
      $("ul.categories-list li a, .category-wrapper a").each((_, el) => {
        const name = $(el).find("span").text().trim() || $(el).text().trim();
        const href = $(el).attr("href");
        if (name && href) {
          appConfig.tabs.push({
            name: "[分類] " + name,
            ext: { url: abs(href) },
            ui: 1
          });
        }
      });
    } catch (e) {
      $print("抓取 Categories 失敗：" + e);
    }

    // 明星 Pornstars
    appConfig.tabs.push({ name: "────────── 明星 Pornstars", ext: {}, ui: 0 });
    try {
      const { data } = await $fetch.get("https://cn.pornhub.com/pornstars", { headers: { "User-Agent": UA } });
      const $ = cheerio.load(data);
      $(".pornstarBox a").each((_, el) => {
        const name = $(el).attr("title") || $(el).text().trim();
        const href = $(el).attr("href");
        if (name && href) {
          appConfig.tabs.push({
            name: "[明星] " + name,
            ext: { url: abs(href) },
            ui: 1
          });
        }
      });
    } catch (e) {
      $print("抓取 Pornstars 失敗：" + e);
    }
  }
  return jsonify(appConfig);
}

// === 影片清單 ===
async function getCards(ext) {
  ext = argsify(ext);
  const { url = "", page = 1 } = ext;
  let listUrl = url;
  if (page > 1) {
    listUrl += listUrl.includes("?") ? `&page=${page}` : `?page=${page}`;
  }

  const { data } = await $fetch.get(listUrl, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);
  const list = [];

  $("li.videoBox, div.videoBox, .phimage").each((_, el) => {
    const a = $(el).find("a").first();
    const href = a.attr("href");
    const title = a.attr("title") || $(el).find(".title").text().trim();
    const img = $(el).find("img");
    const cover = img.attr("data-thumb_url") || img.attr("src") || "";
    const duration = $(el).find(".duration").text().trim();
    if (href && title && cover) {
      list.push({
        vod_id: abs(href),
        vod_name: title,
        vod_pic: cover,
        vod_duration: duration,
        ext: { url: abs(href) }
      });
    }
  });

  return jsonify({ list, page, pagecount: 99 });
}

// === 播放源 ===
async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });

  const tracks = [];
  const match = data.match(/var\s+flashvars\s*=\s*({[\s\S]*?});/);
  if (match) {
    try {
      const j = JSON.parse(match[1]);
      if (j.mediaDefinitions) {
        j.mediaDefinitions.forEach(md => {
          if (md.videoUrl) {
            tracks.push({ name: md.quality || "Video", ext: { url: md.videoUrl, referer: url } });
          }
        });
      }
    } catch (e) {}
  }

  if (tracks.length === 0) {
    const ogVideo = data.match(/property="og:video" content="([^"]+)"/)?.[1];
    if (ogVideo) tracks.push({ name: "OG Video", ext: { url: ogVideo, referer: url } });
  }

  return jsonify({ list: [{ title: "播放", tracks }] });
}

// === 播放資訊 ===
async function getPlayinfo(ext) {
  ext = argsify(ext);
  return jsonify({ urls: [ext.url], headers: [{ "User-Agent": UA, Referer: appConfig.site }] });
}

// === 搜尋 ===
async function search(ext) {
  ext = argsify(ext);
  const text = ext.text || ext.keyword || "";
  const page = Number(ext.page || 1);
  const url = `${appConfig.site}/video/search?search=${encodeURIComponent(text)}&page=${page}`;

  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);
  const list = [];

  $("li.videoBox, div.videoBox, .phimage").each((_, el) => {
    const a = $(el).find("a").first();
    const href = a.attr("href");
    const title = a.attr("title") || $(el).find(".title").text().trim();
    const img = $(el).find("img");
    const cover = img.attr("data-thumb_url") || img.attr("src") || "";
    const duration = $(el).find(".duration").text().trim();
    if (href && title && cover) {
      list.push({
        vod_id: abs(href),
        vod_name: title,
        vod_pic: cover,
        vod_duration: duration,
        ext: { url: abs(href) }
      });
    }
  });

  return jsonify({ list, page });
}
