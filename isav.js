// XPTV: iSav extension

const cheerio = createCheerio();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";

const appConfig = {
  ver: 1,
  title: "iSav",
  site: "https://isav.jennas.cc",
  tabs: [
    { name: "首頁", ext: { url: "https://isav.jennas.cc/" } },
    { name: "最新", ext: { url: "https://isav.jennas.cc/latest" } },
    { name: "熱門", ext: { url: "https://isav.jennas.cc/hot" } }
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

// 抓取列表/分頁
async function getCards(ext) {
  ext = argsify(ext);
  const { url, page = 1 } = ext;

  let target = url;
  if (page > 1) {
    // 如果有分頁參數，根據實際情況調整
    target = url + (url.includes("?") ? "&" : "?") + "page=" + page;
  }

  const { data } = await $fetch.get(target, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);

  const list = [];

  // ⚠️ 根據實際 DOM 結構修改選擇器
  $("div.video-card").each((_, el) => {
    const a = $(el).find("a").first();
    const href = a.attr("href");
    const title = a.attr("title") || $(el).find(".title").text().trim();
    const cover = $(el).find("img").attr("src") || "";
    const remarks = $(el).find(".duration").text().trim();

    if (href) {
      list.push({
        vod_id: abs(href),
        vod_name: title || "無標題",
        vod_pic: abs(cover),
        vod_remarks: remarks,
        ext: { url: abs(href) },
      });
    }
  });

  return jsonify({ list, page, pagecount: 999 });
}

// 抓取播放頁面可用資源
async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;

  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);

  const tracks = [];

  // ⚠️ 嘗試從 <video> 或 <source> 抓取
  const src = $("video source").attr("src") || $("video").attr("src");
  if (src) {
    tracks.push({ name: "主線路", ext: { url: abs(src), referer: url } });
  }

  return jsonify({
    list: [{ title: "播放", tracks }],
  });
}

// 真正回傳播放地址
async function getPlayinfo(ext) {
  ext = argsify(ext);
  const playUrl = ext.url;
  const referer = ext.referer || appConfig.site;

  const headers = {
    "User-Agent": UA,
    Referer: referer,
  };

  return jsonify({ urls: [playUrl], headers: [headers] });
}

// 搜尋功能
async function search(ext) {
  ext = argsify(ext);
  const text = ext.text || ext.keyword || "";
  const page = Number(ext.page || 1);
  const url = `${appConfig.site}/search?keyword=${encodeURIComponent(text)}&page=${page}`;

  const { data } =
