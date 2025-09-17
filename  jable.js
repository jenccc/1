// XPTV: Jable 全功能版
// 技術學習用途；站點可能改版需調整選擇器與正則

const cheerio = createCheerio();
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const appConfig = {
  ver: 1,
  title: "Jable",
  site: "https://jable.tv",
  tabs: [
    { name: "最新更新", ext: { path: "/latest-updates/" }, ui: 1 },
    { name: "熱門影片", ext: { path: "/most-popular/" }, ui: 1 },
    { name: "最多收藏", ext: { path: "/most-favourited/" }, ui: 1 },
    { name: "最多觀看", ext: { path: "/most-viewed/" }, ui: 1 },
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

/** 取卡片：對應 tabs 的 path */
async function getCards(ext) {
  ext = argsify(ext);
  const { path = "/latest-updates/", page = 1 } = ext;

  let url = appConfig.site + path;
  if (page > 1) {
    url = url.replace(/\/$/, "") + `/page/${page}/`;
  }

  const { data } = await $fetch.get(url, {
    headers: { "User-Agent": UA, "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8" },
  });

  const $ = cheerio.load(data);
  const list = [];

  $('a[href*="/videos/"]').each((_, a) => {
    const href = $(a).attr("href");
    if (!href || !/\/videos\/[^/]+\/?$/.test(href)) return;

    const img = $(a).find("img");
    const title =
      img.attr("alt") ||
      $(a).attr("title") ||
      $(a).find(".title, .video-title").text().trim() ||
      "";
    const cover =
      img.attr("data-src") ||
      img.attr("data-lazy-src") ||
      img.attr("src") ||
      "";
    const duration =
      $(a).find(".duration, .time").text().trim() ||
      $(a).parent().find(".duration, .time").text().trim() ||
      "";

    if (title && cover) {
      list.push({
        vod_id: abs(href),
        vod_name: title,
        vod_pic: cover.startsWith("//") ? "https:" + cover : cover,
        vod_remarks: duration,
        ext: { url: abs(href) },
      });
    }
  });

  return jsonify({ list, page: Number(page), pagecount: 999 });
}

/** 解析播放：抓出 m3u8 */
async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;
  const { data } = await $fetch.get(url, {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      Referer: appConfig.site + "/",
    },
  });

  const tryRx = (...rxs) => {
    for (const rx of rxs) {
      const m = data.match(rx);
      if (m && m[1]) return m[1];
    }
    return "";
  };

  const m3u8 =
    tryRx(/file:\s*["']([^"']+\.m3u8[^"']*)["']/i) ||
    tryRx(/hls[_-]?src:\s*["']([^"']+\.m3u8[^"']*)["']/i) ||
    tryRx(/hls:\s*["']([^"']+\.m3u8[^"']*)["']/i) ||
    tryRx(/<source[^>]+src=["']([^"']+\.m3u8[^"']*)["']/i);

  const tracks = [];
  if (m3u8) {
    tracks.push({
      name: "HLS",
      pan: "",
      ext: { url: m3u8, referer: url },
    });
  } else {
    // 後備：丟原頁面
    tracks.push({ name: "原頁", pan: "", ext: { url, referer: url } });
  }

  return jsonify({
    list: [{ title: "播放", tracks }],
  });
}

/** 交付播放頭與 Referer */
async function getPlayinfo(ext) {
  ext = argsify(ext);
  const playUrl = ext.url;
  const referer = ext.referer || appConfig.site;

  return jsonify({
    urls: [playUrl],
    headers: [
      {
        "User-Agent": UA,
        Referer: referer,
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      },
    ],
  });
}

/** 搜尋 */
async function search(ext) {
  ext = argsify(ext);
  const text = (ext.text || ext.keyword || "").trim();
  const page = Number(ext.page || 1);

  const url1 = `${appConfig.site}/search/${encodeURIComponent(text)}/?from=videos`;
  const url2 = `${appConfig.site}/?s=${encodeURIComponent(text)}`;

  const { data: d1 } = await $fetch.get(url1, {
    headers: { "User-Agent": UA, "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8" },
  }).catch(() => ({ data: "" }));

  const html =
    d1 && d1.length
      ? d1
      : (
          await $fetch.get(url2, {
            headers: {
              "User-Agent": UA,
              "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
            },
          })
        ).data;

  const $ = cheerio.load(html);
  const list = [];

  $('a[href*="/videos/"]').each((_, a) => {
    const href = $(a).attr("href");
    if (!href || !/\/videos\/[^/]+\/?$/.test(href)) return;

    const img = $(a).find("img");
    const title =
      img.attr("alt") ||
      $(a).attr("title") ||
      $(a).find(".title, .video-title").text().trim() ||
      "";
    const cover =
      img.attr("data-src") ||
      img.attr("data-lazy-src") ||
      img.attr("src") ||
      "";
    const duration =
      $(a).find(".duration, .time").text().trim() ||
      $(a).parent().find(".duration, .time").text().trim() ||
      "";

    if (title && cover) {
      list.push({
        vod_id: abs(href),
        vod_name: title,
        vod_pic: cover.startsWith("//") ? "https:" + cover : cover,
        vod_remarks: duration,
        ext: { url: abs(href) },
      });
    }
  });

  return jsonify({ list, page });
}