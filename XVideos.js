// XPTV: XVideos extension (分類 + 標籤 + 收藏類別)

const cheerio = createCheerio();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";

const appConfig = {
  ver: 1,
  title: "XVideos",
  site: "https://www.xvideos.com",
  tabs: []
};

// 🟢 自選收藏類別（你可以自由增減）
const favoriteCategories = [
  { name: "亞洲", url: "https://www.xvideos.com/c/Asia-69" },
  { name: "女同", url: "https://www.xvideos.com/c/Lesbian-20" },
  { name: "HD 高畫質", url: "https://www.xvideos.com/c/HD-7" }
];

function abs(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return appConfig.site.replace(/\/$/, "") + (u.startsWith("/") ? u : "/" + u);
}

// 初始化分類 + 標籤
async function getConfig() {
  if (appConfig.tabs.length === 0) {
    // 基礎
    appConfig.tabs.push({ name: "首頁", ext: { url: appConfig.site } });
    appConfig.tabs.push({ name: "最新", ext: { url: `${appConfig.site}/new/` } });
    appConfig.tabs.push({ name: "熱門", ext: { url: `${appConfig.site}/best/` } });

    // 收藏類別
    favoriteCategories.forEach(cat => {
      appConfig.tabs.push({ name: "★ " + cat.name, ext: { url: cat.url } });
    });

    // Categories
    const { data: catHtml } = await $fetch.get(`${appConfig.site}/categories/`, { headers: { "User-Agent": UA } });
    const $c = cheerio.load(catHtml);
    $c("ul#categories li a").each((_, el) => {
      const name = $c(el).text().trim();
      const href = $c(el).attr("href");
      if (name && href) {
        appConfig.tabs.push({ name: "[分類] " + name, ext: { url: abs(href) } });
      }
    });

    // Tags
    const { data: tagHtml } = await $fetch.get(`${appConfig.site}/tags/`, { headers: { "User-Agent": UA } });
    const $t = cheerio.load(tagHtml);
    $t("ul.tags li a").each((_, el) => {
      const name = $t(el).text().trim();
      const href = $t(el).attr("href");
      if (name && href) {
        appConfig.tabs.push({ name: "[標籤] " + name, ext: { url: abs(href) } });
      }
    });
  }
  return jsonify(appConfig);
}

// 抓影片清單
async function getCards(ext) {
  ext = argsify(ext);
  const { url, page = 1 } = ext;

  let target = url;
  if (page > 1) {
    target = url.replace(/\/$/, "") + "/" + page + "/";
  }

  const { data } = await $fetch.get(target, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);

  let list = [];
  $(".thumb-block").each((_, el) => {
    const a = $(el).find("a.thumb");
    const href = a.attr("href");
    const title = a.attr("title");
    const cover = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
    const duration = $(el).find(".duration").text().trim();

    if (href && title) {
      list.push({
        vod_id: abs(href),
        vod_name: title,
        vod_pic: cover,
        vod_remarks: duration,
        ext: { url: abs(href) }
      });
    }
  });

  return jsonify({ list, page, pagecount: 999 });
}

// 播放源
async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const tracks = [];

  const hls = data.match(/setVideoHLS\(['"](.+?)['"]\)/);
  if (hls) tracks.push({ name: "HLS", ext: { url: hls[1], referer: url } });

  const mp4High = data.match(/setVideoUrlHigh\(['"](.+?)['"]\)/);
  if (mp4High) tracks.push({ name: "MP4高", ext: { url: mp4High[1], referer: url } });

  const mp4Low = data.match(/setVideoUrlLow\(['"](.+?)['"]\)/);
  if (mp4Low) tracks.push({ name: "MP4低", ext: { url: mp4Low[1], referer: url } });

  return jsonify({ list: [{ title: "播放", tracks }] });
}

async function getPlayinfo(ext) {
  ext = argsify(ext);
  const playUrl = ext.url;
  const referer = ext.referer || appConfig.site;
  const headers = { "User-Agent": UA, "Referer": referer };
  return jsonify({ urls: [playUrl], headers: [headers] });
}

// 搜尋
async function search(ext) {
  ext = argsify(ext);
  const { keyword, page = 1 } = ext;
  let target = `${appConfig.site}/?k=${encodeURIComponent(keyword)}&p=${page}`;
  const { data } = await $fetch.get(target, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);

  let list = [];
  $(".thumb-block").each((_, el) => {
    const a = $(el).find("a.thumb");
    const href = a.attr("href");
    const title = a.attr("title");
    const cover = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
    const duration = $(el).find(".duration").text().trim();

    if (href && title) {
      list.push({
        vod_id: abs(href),
        vod_name: title,
        vod_pic: cover,
        vod_remarks: duration,
        ext: { url: abs(href) }
      });
    }
  });

  return jsonify({ list, page });
}
