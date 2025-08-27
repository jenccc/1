// XPTV: 91Porn extension (Fixed Mirror 91pornhd.com)

const cheerio = createCheerio();
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const SITE = "https://91pornhd.com";

const appConfig = {
  ver: 1,
  title: "91Porn",
  site: SITE,
  tabs: [
    { name: "首頁 Home", ext: { path: "/v.php" }, ui: 1 },
    { name: "最新 Latest", ext: { path: "/v.php?category=mr" }, ui: 1 },
    { name: "本週熱門 Weekly", ext: { path: "/v.php?category=mf" }, ui: 1 },
    { name: "本月熱門 Monthly", ext: { path: "/v.php?category=tf" }, ui: 1 },
    { name: "精選 Featured", ext: { path: "/v.php?category=rf" }, ui: 1 }
  ]
};

async function getConfig() {
  return jsonify(appConfig);
}

// === 抓影片卡片 ===
async function getCards(ext) {
  ext = argsify(ext);
  const { path = "/v.php", page = 1 } = ext;
  let listUrl = SITE + path;
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

// === 播放源解析 ===
async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });

  const tracks = [];
  const match = data.match(/<source\s+src="([^"]+)"/);
  if (match) tracks.push({ name: "標清", ext: { url: match[1], referer: url } });

  const m3u8 = data.match(/https?:\/\/[^"']+\.m3u8/);
  if (m3u8) tracks.push({ name: "HLS", ext: { url: m3u8[0], referer: url } });

  if (tracks.length === 0) tracks.push({ name: "原頁面", ext: { url, referer: url } });

  return jsonify({ list: [{ title: "播放", tracks }] });
}

// === 播放資訊 ===
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
