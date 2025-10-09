const cheerio = createCheerio();

const appConfig = {
  ver: 1,
  title: "MTYY5",
  site: "https://www.mtyy5.com",
  tabs: [
    { name: "首頁", ext: { path: "/" }, ui: 1 },
    { name: "電影", ext: { path: "/vodtype/1.html" }, ui: 1 },
    { name: "電視劇", ext: { path: "/vodtype/2.html" }, ui: 1 },
    { name: "綜藝", ext: { path: "/vodtype/3.html" }, ui: 1 },
    { name: "動漫", ext: { path: "/vodtype/4.html" }, ui: 1 },
  ],
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

const COOKIE = `6baebcda651ec96cb78e82051847e85f=8166a1400d7a2215e754dd06cfd79e2b;server_name_session=e26fd9c9e3fa80e5c12b65f5b49124fd;mac_history=%7Blog%3A%5B%7B%22name%22%3A%22%5B%E7%94%B5%E8%A7%86%E5%89%A7%5D%E8%AE%B8%E6%88%91%E8%80%80%E7%9C%BC%22%2C%22link%22%3A%22https%3A%2F%2Fwww.mtyy5.com%2Fvodplay%2F196703-5-1.html%22%2C%22pic%22%3A%22https%3A%2F%2Fvcover-vt-pic.puui.qpic.cn%2Fvcover_vt_pic%2F0%2Fmzc00200f19q8q51726740653099%2F260%22%2C%22mid%22%3A%22%E7%AC%AC01%E9%9B%86%22%7D%5D%7D;Hm_lvt_wau1y1a5u38=1760018069;Hm_tf_wau1y1a5u38=1760018069;SITE_TOTAL_ID=8bf70d2a4d2140cc329afb525e9288b2;Hm_lpvt_wau1y1a5u38=1760018084;PHPSESSID=d5btt8n5glal54qigiphs7cenn;`;

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
  const { path = "/", page = 1 } = ext;
  let url = appConfig.site + path;
  if (page > 1) url = url.replace(".html", `-${page}.html`);

  const { data } = await $fetch.get(url, {
    headers: {
      "User-Agent": UA,
      Cookie: COOKIE,
      Referer: appConfig.site + "/",
    },
  });

  const $ = cheerio.load(data);
  const list = [];

  $("a.vodlist_thumb").each((_, a) => {
    const href = $(a).attr("href");
    const img = $(a).find("img");
    const title = img.attr("alt") || $(a).attr("title") || "";
    const cover = img.attr("data-original") || img.attr("src") || "";
    const remark = $(a).find(".pic_text").text().trim();

    if (href && title) {
      list.push({
        vod_id: abs(href),
        vod_name: title,
        vod_pic: cover.startsWith("//") ? "https:" + cover : cover,
        vod_remarks: remark,
        ext: { url: abs(href) },
      });
    }
  });

  return jsonify({ list, page, pagecount: 999 });
}

async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;

  const { data } = await $fetch.get(url, {
    headers: {
      "User-Agent": UA,
      Cookie: COOKIE,
      Referer: appConfig.site + "/",
      "Accept-Language": "zh-CN,zh;q=0.9",
    },
  });

  // 嘗試匹配 m3u8
  const tryRx = (...rxs) => {
    for (const rx of rxs) {
      const m = data.match(rx);
      if (m && m[1]) return m[1];
    }
    return "";
  };

  const m3u8 =
    tryRx(/"url":"(https[^"]+\.m3u8[^"]*)"/i) ||
    tryRx(/src=["'](https[^"']+\.m3u8[^"']*)["']/i) ||
    tryRx(/file:\s*["']([^"']+\.m3u8[^"']*)["']/i);

  const tracks = [];
  if (m3u8) {
    tracks.push({
      name: "原畫質播放",
      pan: "",
      ext: { url: m3u8, referer: url },
    });
  } else {
    tracks.push({
      name: "原頁播放",
      pan: "",
      ext: { url, referer: url },
    });
  }

  return jsonify({ list: [{ title: "播放", tracks }] });
}

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
        Cookie: COOKIE,
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
    ],
  });
}