// XPTV: 91Porn extension (HTML Scraper Build)

const cheerio = createCheerio();
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ⚠️ 請改成你能打開的 91Porn 鏡像站
const SITE = "https://91porn.com";

const appConfig = {
  ver: 1,
  title: "91Porn",
  site: SITE,
  tabs: [
    { name: "首頁 Home", ext: { url: `${SITE}/v.php` }, ui: 1 },
    { name: "最新 Latest", ext: { url: `${SITE}/v.php?category=mr` }, ui: 1 },
    { name: "本週熱門 Weekly", ext: { url: `${SITE}/v.php?category=mf` }, ui: 1 },
    { name: "本月熱門 Monthly", ext: { url: `${SITE}/v.php?category=tf` }, ui: 1 },
    { name: "收藏精選 Featured", ext: { url: `${SITE}/v.php?category=rf` }, ui: 1 }
  ]
};

async function getConfig() {
  return jsonify(appConfig);
}

// === Cards: 抓影片列表 ===
async function getCards(ext) {
  const { url = `${SITE}/v.php`, page = 1 } = argsify(ext);
  let listUrl = url;
  if (page > 1) listUrl += (listUrl.includes("?") ? "&" : "?") + `page=${page}`;

  const { data } = await $fetch.get(listUrl, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);
  const list = [];

  $(".video-box, .listchannel li").each((_, el) => {
    const a = $(el).find("a").first();
    const href = a.attr("href");
    const title = a.attr("title") || $(el).find(".video-title").text().trim();
    const cover = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
    const duration = $(el).find(".video-duration, .duration").text().trim();
    if (href && title) {
      list.push({
        vod_id: SITE + href,
        vod_name: title,
        vod_pic: cover,
        vod_duration: duration,
        ext: { url: SITE + href }
      });
    }
  });

  return jsonify({ list, page, pagecount: 99 });
}

// === Tracks: 播放源解析 ===
async function getTracks(ext) {
  const { url } = argsify(ext);
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });

  const tracks = [];
  // 嘗試匹配 <source src="...">
  const match = data.match(/<source\s+src="([^"]+)"[^>]*>/);
  if (match) {
    tracks.push({ name: "標清", ext: { url: match[1], referer: url } });
  }

  // 後備：m3u8
  const m3u8 = data.match(/https?:\/\/[^"']+\.m3u8/);
  if (m3u8) {
    tracks.push({ name: "HLS", ext: { url: m3u8[0], referer: url } });
  }

  // 保底
  if (tracks.length === 0) {
    tracks.push({ name: "原頁面", ext: { url, referer: url } });
  }

  return jsonify({ list: [{ title: "播放", tracks }] });
}

// === Playinfo: 播放請求頭 ===
async function getPlayinfo(ext) {
  ext = argsify(ext);
  return jsonify({
    urls: [ext.url],
    headers: [{ "User-Agent": UA, Referer: SITE }]
  });
}

// === Search: 關鍵字搜尋 ===
async function search(ext) {
  const { text = "", page = 1 } = argsify(ext);
  const url = `${SITE}/search_result.php?search_id=${encodeURIComponent(text)}&page=${page}`;

  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);
  const list = [];

  $(".video-box, .listchannel li").each((_, el) => {
    const a = $(el).find("a").first();
    const href = a.attr("href");
    const title = a.attr("title") || $(el).find(".video-title").text().trim();
    const cover = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
    const duration = $(el).find(".video-duration, .duration").text().trim();
    if (href && title) {
      list.push({
        vod_id: SITE + href,
        vod_name: title,
        vod_pic: cover,
        vod_duration: duration,
        ext: { url: SITE + href }
      });
    }
  });

  return jsonify({ list, page });
}
