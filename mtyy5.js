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

let COOKIE_CACHE = "";

const UAs = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
];

function abs(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return appConfig.site.replace(/\/$/, "") + (u.startsWith("/") ? u : "/" + u);
}

function randomUA() {
  return UAs[Math.floor(Math.random() * UAs.length)];
}

function randomReferer() {
  const pages = ["/", "/vodtype/1.html", "/vodtype/2.html", "/vodtype/3.html"];
  const pick = pages[Math.floor(Math.random() * pages.length)];
  return appConfig.site + pick;
}

async function ensureCookie() {
  if (COOKIE_CACHE) return COOKIE_CACHE;
  try {
    const rsp = await $fetch.get(appConfig.site + "/", { headers: { "User-Agent": randomUA() } });
    const setCookie = rsp.headers["set-cookie"];
    if (setCookie) {
      COOKIE_CACHE = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie;
    }
  } catch (e) {
    console.log("Cookie 初始化失敗", e.message);
  }
  return COOKIE_CACHE;
}

async function getConfig() {
  return jsonify(appConfig);
}

async function getCards(ext) {
  ext = argsify(ext);
  const { path = "/", page = 1 } = ext;
  let url = appConfig.site + path;
  if (page > 1) url = url.replace(".html", `-${page}.html`);

  const cookie = await ensureCookie();
  const headers = {
    "User-Agent": randomUA(),
    Cookie: cookie,
    Referer: randomReferer(),
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
  };

  let html = "";
  try {
    const rsp = await $fetch.get(url, { headers });
    html = rsp.data;
  } catch (err) {
    return jsonify({
      list: [
        {
          vod_name: "⚠️ 無法連線到伺服器",
          vod_pic: "https://dummyimage.com/600x338/111/fff&text=Request+Failed",
          vod_remarks: err.message,
          vod_id: "",
        },
      ],
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
    // 嘗試從 script 中提取影片 json
    const jsonMatch = html.match(/var\s+vod_list\s*=\s*(\[[\s\S]*?\]);/);
    if (jsonMatch) {
      try {
        const vids = JSON.parse(jsonMatch[1]);
        for (const v of vids) {
          list.push({
            vod_id: abs(v.url || v.link || ""),
            vod_name: v.title || v.name || "未命名",
            vod_pic: v.pic || "",
            vod_remarks: "",
          });
        }
      } catch {}
    }
  }

  if (list.length === 0) {
    list.push({
      vod_name: "⚠️ 防爬中，暫無內容",
      vod_pic: "https://dummyimage.com/600x338/222/fff&text=No+Videos",
      vod_remarks: "可能被 Cloudflare 攔截，請稍後再試",
      vod_id: "",
    });
  }

  return jsonify({ list, page, pagecount: 999 });
}

async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;
  const cookie = await ensureCookie();
  const html = await $fetch.get(url, {
    headers: {
      "User-Agent": randomUA(),
      Cookie: cookie,
      Referer: randomReferer(),
    },
  });

  const data = html.data || "";
  const m3u8Match = data.match(/https[^"'<>]+\.m3u8[^"'<>]*/i);
  const m3u8 = m3u8Match ? m3u8Match[0] : "";

  const tracks = [];
  if (m3u8) {
    tracks.push({ name: "原畫播放", ext: { url: m3u8, referer: url } });
  } else {
    tracks.push({ name: "原頁播放", ext: { url, referer: url } });
  }

  return jsonify({ list: [{ title: "播放", tracks }] });
}

async function getPlayinfo(ext) {
  ext = argsify(ext);
  const playUrl = ext.url;
  const referer = ext.referer || appConfig.site;
  const cookie = await ensureCookie();
  return jsonify({
    urls: [playUrl],
    headers: [
      {
        "User-Agent": randomUA(),
        Referer: referer,
        Cookie: cookie,
      },
    ],
  });
}
