const cheerio = createCheerio();

const appConfig = {
  ver: 2,
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

// ✅ 目前使用的 Cookie（可隨時更新）
let FIXED_COOKIE =
  "6baebcda651ec96cb78e82051847e85f=00f86ffe76a5317ffa03415601146193; popup_closed=true; server_name_session=e26fd9c9e3fa80e5c12b65f5b49124fd; mac_history=%7Blog%3A%5B%7B%22name%22%3A%22%5B%E7%94%B5%E8%A7%86%E5%89%A7%5D%E8%AE%B8%E6%88%91%E8%80%80%E7%9C%BC%22%2C%22link%22%3A%22https%3A%2F%2Fwww.mtyy5.com%2Fvodplay%2F196703-5-1.html%22%2C%22pic%22%3A%22https%3A%2F%2Fvcover-vt-pic.puui.qpic.cn%2Fvcover_vt_pic%2F0%2Fmzc00200f19q8q51726740653099%2F260%22%2C%22mid%22%3A%22%E7%AC%AC01%E9%9B%86%22%7D%5D%7D; Hm_lvt_wau1y1a5u38=1760019754; Hm_tf_wau1y1a5u38=1760019754; SITE_TOTAL_ID=08fcdefe199e5276cfcdabf13e9cf2ec; Hm_lpvt_wau1y1a5u38=1760019756;";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

function abs(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return appConfig.site.replace(/\/$/, "") + (u.startsWith("/") ? u : "/" + u);
}

function randomReferer() {
  const pages = ["/", "/vodtype/1.html", "/vodtype/2.html", "/vodtype/3.html"];
  const pick = pages[Math.floor(Math.random() * pages.length)];
  return appConfig.site + pick;
}

async function getConfig() {
  return jsonify(appConfig);
}

/**
 * 檢查 HTML 是否可能被防爬 / Cookie 過期
 */
function isInvalidHTML(html) {
  if (!html) return true;
  if (html.includes("Cloudflare") || html.includes("Access denied")) return true;
  if (html.includes("請開啟JavaScript") || html.includes("安全驗證")) return true;
  if (!/<a[^>]+vodlist_thumb/.test(html)) return true;
  return false;
}

async function getCards(ext) {
  ext = argsify(ext);
  const { path = "/", page = 1 } = ext;
  let url = appConfig.site + path;
  if (page > 1) url = url.replace(".html", `-${page}.html`);

  const headers = {
    "User-Agent": UA,
    Cookie: FIXED_COOKIE,
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
          vod_name: "⚠️ 無法連線",
          vod_pic: "https://dummyimage.com/600x338/111/fff&text=Request+Failed",
          vod_remarks: err.message,
          vod_id: "",
        },
      ],
    });
  }

  // 🧠 自動判斷 Cookie 是否過期
  if (isInvalidHTML(html)) {
    return jsonify({
      list: [
        {
          vod_name: "⚠️ Cookie 可能已過期",
          vod_pic:
            "https://dummyimage.com/600x338/222/fff&text=Cookie+Expired",
          vod_remarks:
            "請重新開啟 https://www.mtyy5.com 登入，複製新的 Cookie 並更新到 mtyy5.js。",
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
      vod_name: "⚠️ 無影片內容",
      vod_pic:
        "https://dummyimage.com/600x338/333/fff&text=No+Videos+Found",
      vod_remarks: "可能網站更新或防爬中",
      vod_id: "",
    });
  }

  return jsonify({ list, page, pagecount: 999 });
}

/**
 * 播放源解析
 */
async function getTracks(ext) {
  ext = argsify(ext);
  const { url } = ext;

  const rsp = await $fetch.get(url, {
    headers: {
      "User-Agent": UA,
      Cookie: FIXED_COOKIE,
      Referer: appConfig.site + "/",
    },
  });

  const data = rsp.data || "";
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

/**
 * 播放請求 Header
 */
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
        Cookie: FIXED_COOKIE,
      },
    ],
  });
}
