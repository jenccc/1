// XPTV: xxoo168 extension (完整初版)
// 先抓列表 → 再抓播放頁 <source> / m3u8 / mp4

const cheerio = createCheerio();
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const SITE = "https://h5.xxoo168.org";

const appConfig = {
  ver: 1,
  title: "xxoo168",
  site: SITE,
  tabs: [
    { name: "首頁 Home", ext: { path: "/#/LongVideo" }, ui: 1 },
    { name: "最新 Latest", ext: { path: "/#/LongVideo?orderby=latest" }, ui: 1 },
    { name: "熱門 Hot", ext: { path: "/#/LongVideo?orderby=popular" }, ui: 1 }
  ]
};

async function getConfig() {
  return jsonify(appConfig);
}

// 將 #/video/xxx 轉換為 https://h5.xxoo168.org/video/xxx
function abs(u) {
  if (!u) return "";
  if (u.startsWith("#/")) {
    return SITE + "/" + u.slice(2);
  }
  if (!u.startsWith("http")) {
    return SITE + u;
  }
  return u;
}

// === 抓影片列表 ===
async function getCards(ext) {
  ext = argsify(ext);
  const { path = "/#/LongVideo", page = 1 } = ext;

  // 暫時先用首頁 URL，頁碼待調整
  let listUrl = SITE + path;

  const { data } = await $fetch.get(listUrl, {
    headers: { "User-Agent": UA }
  });

  const $ = cheerio.load(data);
  const list = [];

  // 按你提供的 HTML 結構抓取影片卡片
  $('a[href^="#/video"]').each((_, el) => {
    const a = $(el);
    const href = a.attr("href") || "";
    const title = a.find("span.title").text().trim();
    const cover =
      a.find("img.cover-img").attr("data-src") ||
      a.find("img.cover-img").attr("src");
    const duration = a.find(".mask .duration").text().trim();
    const playCount = a.find(".mask .play-count").text().trim();

    if (title && cover && href) {
      list.push({
        vod_id: abs(href),
        vod_name: title,
        vod_pic: cover,
        vod_remarks: `${duration}｜播放:${playCount}`,
        ext: { url: abs(href) }
      });
    }
  });

  return jsonify({ list, page, pagecount: 999 });
}

// === 抓播放源 ===
async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;

  const { data } = await $fetch.get(url, {
    headers: { "User-Agent": UA }
  });

  const tracks = [];

  // 1. <source src="...">
  const src = data.match(/<source[^>]+src="([^"]+)"/i)?.[1];
  if (src) tracks.push({ name: "標清", ext: { url: src, referer: url } });

  // 2. .m3u8
  const m3u8 = data.match(/https?:\/\/[^"']+\.m3u8/);
  if (m3u8) tracks.push({ name: "HLS", ext: { url: m3u8[0], referer: url } });

  // 3. .mp4
  const mp4 = data.match(/https?:\/\/[^"']+\.mp4/);
  if (mp4) tracks.push({ name: "MP4", ext: { url: mp4[0], referer: url } });

  // 4. player.src("...") JS 變數
  const playerSrc = data.match(/player\.src\(['"]([^'"]+)['"]\)/);
  if (playerSrc)
    tracks.push({ name: "PlayerSrc", ext: { url: playerSrc[1], referer: url } });

  // 保底
  if (tracks.length === 0)
    tracks.push({ name: "原頁面", ext: { url, referer: url } });

  return jsonify({ list: [{ title: "播放", tracks }] });
}

// === 播放請求頭 ===
async function getPlayinfo(ext) {
  ext = argsify(ext);
  return jsonify({
    urls: [ext.url],
    headers: [{ "User-Agent": UA, Referer: SITE }]
  });
}

// === 搜尋 ===
async function search(ext) {
  ext = argsify(ext);
  const { text = "", page = 1 } = ext;
  const url = `${SITE}/#/search/${encodeURIComponent(text)}?page=${page}`;

  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);
  const list = [];

  $('a[href^="#/video"]').each((_, el) => {
    const a = $(el);
    const href = a.attr("href") || "";
    const title = a.find("span.title").text().trim();
    const cover =
      a.find("img.cover-img").attr("data-src") ||
      a.find("img.cover-img").attr("src");
    const duration = a.find(".mask .duration").text().trim();
    if (title && cover && href) {
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
