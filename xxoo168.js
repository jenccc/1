// XPTV: xxoo168 extension (修正 & 加強版)

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

function abs(u) {
  if (!u) return "";
  if (u.startsWith("#/")) {
    return SITE + "/" + u.slice(2);  // 把 "#/video/123" 轉成完整 URL
  }
  if (!u.startsWith("http")) {
    return SITE + u;
  }
  return u;
}

async function getCards(ext) {
  ext = argsify(ext);
  const { path = "/#/LongVideo", page = 1 } = ext;

  let listUrl = SITE + path;
  // 若頁面分頁 url 不同，可在這裡加分頁處理

  const { data } = await $fetch.get(listUrl, {
    headers: { "User-Agent": UA }
  });

  const $ = cheerio.load(data);
  const list = [];

  $('a[href^="#/video"]').each((_, el) => {
    const a = $(el);
    const href = a.attr("href") || "";
    const title = a.find("span.title").text().trim();
    const cover =
      a.find("img.cover-img").attr("data-src") ||
      a.find("img.cover-img").attr("src") ||
      "";
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

async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;

  const { data } = await $fetch.get(url, {
    headers: { "User-Agent": UA }
  });

  const tracks = [];

  // 1. 看 video > source
  const sourceMatch = data.match(/<source[^>]+src=['"]([^'"]+)['"]/i);
  if (sourceMatch && sourceMatch[1]) {
    tracks.push({ name: "標清", ext: { url: sourceMatch[1], referer: url } });
  }

  // 2. m3u8
  const m3u8Match = data.match(/https?:\/\/[^"']+\.m3u8/);
  if (m3u8Match && m3u8Match[0]) {
    tracks.push({ name: "HLS", ext: { url: m3u8Match[0], referer: url } });
  }

  // 3. mp4
  const mp4Match = data.match(/https?:\/\/[^"']+\.mp4/);
  if (mp4Match && mp4Match[0]) {
    tracks.push({ name: "MP4", ext: { url: mp4Match[0], referer: url } });
  }

  // 4. player.src(...) 或其他 JS
  const playerSrcMatch = data.match(/player\.src\(['"]([^'"]+)['"]\)/i);
  if (playerSrcMatch && playerSrcMatch[1]) {
    tracks.push({ name: "PlayerSrc", ext: { url: playerSrcMatch[1], referer: url } });
  }

  if (tracks.length === 0) {
    tracks.push({ name: "原頁面", ext: { url, referer: url } });
  }

  return jsonify({ list: [{ title: "播放", tracks }] });
}

async function getPlayinfo(ext) {
  ext = argsify(ext);
  return jsonify({
    urls: [ext.url],
    headers: [{ "User-Agent": UA, Referer: SITE }]
  });
}

async function search(ext) {
  ext = argsify(ext);
  const { text = "", page = 1 } = ext;
  const url = `${SITE}/#/search/${encodeURIComponent(text)}?page=${page}`;

  const { data } = await $fetch.get(url, {
    headers: { "User-Agent": UA }
  });

  const $ = cheerio.load(data);
  const list = [];

  $('a[href^="#/video"]').each((_, el) => {
    const a = $(el);
    const href = a.attr("href") || "";
    const title = a.find("span.title").text().trim();
    const cover =
      a.find("img.cover-img").attr("data-src") ||
      a.find("img.cover-img").attr("src") ||
      "";
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
