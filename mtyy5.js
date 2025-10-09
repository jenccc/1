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

let DYNAMIC_COOKIE = ""; // 自動更新 Cookie
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

function abs(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return appConfig.site.replace(/\/$/, "") + (u.startsWith("/") ? u : "/" + u);
}

// 自動從首頁抓 Cookie
async function ensureCookie() {
  if (DYNAMIC_COOKIE) return DYNAMIC_COOKIE;
  try {
    const rsp = await $fetch.get(appConfig.site + "/", {
      headers: { "User-Agent": UA },
    });
    const setCookie = rsp.headers["set-cookie"];
    if (setCookie) {
      DYNAMIC_COOKIE = Array.isArray(setCookie)
        ? setCookie.join("; ")
        : setCookie;
    }
  } catch (e) {
    console.log("Cookie 初始化失敗", e.message);
  }
  return DYNAMIC_COOKIE;
}

async function getConfig() {
  return jsonify(appConfig);
}

// 自動重試的 GET
async function safeGet(url, headers = {}, retry = 3) {
  for (let i = 0; i < retry; i++) {
    try {
      const rsp = await $fetch.get(url, { headers });
      if (rsp && rsp.data && rsp.status === 200) return rsp.data;
    } catch (e) {
      console.log(`第 ${i + 1} 次請求失敗: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return "";
}

async function getCards(ext) {
  ext = argsify(ext);
  const { path = "/", page = 1 } = ext;
  let url = appConfig.site + path;
  if (page > 1) url = url.replace(".html", `-${page}.html`);

  const cookie = await ensureCookie();
  const html = await safeGet(url, {
    "User-Agent": UA,
    Cookie: cookie,
    Referer: appConfig.site + "/",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
  });

  if (!html) {
    return jsonify({
      list: [
        {
          vod_name: "⚠️ 網站無回應或被防火牆擋住",
          vod_pic:
            "https://dummyimage.com/600x338/000/fff&text=Request+Failed",
          vod_remarks: "請稍後重試或更換網路",
          vod_id: "",
        },
      ],
      page,
      pagecount: 1,
    });
  }

  const $ = cheerio.load(html);
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

  if (list.length === 0) {
    list.push({
      vod_name: "⚠️ 無法取得影片列表",
      vod_pic: "https://dummyimage.com/600x338/111/fff&text=No+Videos+Found",
      vod_remarks: "請檢查 Cookie 或網站防爬",
      vod_id: "",
    });
  }

  return jsonify({ list, page, pagecount: 999 });
}

// 播放頁解析
async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;
  const cookie = await ensureCookie();
  const html = await safeGet(url, {
    "User-Agent": UA,
    Cookie: cookie,
    Referer: appConfig.site + "/",
  });

  if (!html) {
    return jsonify({
      list: [
        {
          title: "載入失敗",
          tracks: [{ name: "無法載入", ext: { url } }],
        },
      ],
    });
  }

  const tryRx = (...rxs) => {
    for (const rx of rxs) {
      const m = html.match(rx);
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
      name: "原畫播放",
      ext: { url: m3u8, referer: url },
    });
  } else {
    tracks.push({
      name: "原頁播放",
      ext: { url, referer: url },
    });
  }

  return jsonify({ list: [{ title: "播放", tracks }] });
}

// 最終播放
async function getPlayinfo(ext) {
  ext = argsify(ext);
  const playUrl = ext.url;
  const referer = ext.referer || appConfig.site;
  const cookie = await ensureCookie();
  return jsonify({
    urls: [playUrl],
    headers: [
      {
        "User-Agent": UA,
        Referer: referer,
        Cookie: cookie,
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
    ],
  });
}
