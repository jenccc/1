// XPTV: YouTube Extension (完整版，帶 Cookie → SAPISIDHASH)

const cheerio = createCheerio();
const crypto = createCryptoJS();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";

// 生成 SAPISIDHASH 授權頭
function makeSAPISIDHASH(cookie, origin = "https://www.youtube.com") {
  const match = cookie.match(/SAPISID=(.+?);/);
  if (!match) return null;
  const sapisid = match[1];
  const timestamp = Math.floor(Date.now() / 1000);
  const input = timestamp + " " + sapisid + " " + origin;
  const hash = crypto.SHA1(input).toString();
  return `SAPISIDHASH ${timestamp}_${hash}`;
}

// 初始化 API Key & Context
async function initSession() {
  let apiKey = $cache.get("yt_api_key");
  let context = $cache.get("yt_context");
  if (apiKey && context) return { apiKey, context };

  const { data } = await $fetch.get("https://www.youtube.com", { headers: { "User-Agent": UA } });
  const match = data.match(/ytcfg\.set\(({.*?})\)/);
  if (match) {
    const cfg = JSON.parse(match[1]);
    apiKey = cfg.INNERTUBE_API_KEY;
    context = cfg.INNERTUBE_CONTEXT;
    $cache.set("yt_api_key", apiKey);
    $cache.set("yt_context", context);
  }
  return { apiKey, context };
}

// 配置
async function getConfig() {
  return jsonify({
    ver: 1,
    title: "YouTube",
    site: "https://www.youtube.com",
    tabs: [
      { name: "推薦", ext: { type: "home" } },
      { name: "熱門", ext: { type: "trending" } }
    ]
  });
}

// 提取所有影片
function extractVideos(obj, list = []) {
  if (!obj) return list;
  if (obj.videoRenderer) {
    const vid = obj.videoRenderer.videoId;
    if (vid) {
      list.push({
        vod_id: vid,
        vod_name: obj.videoRenderer.title?.runs?.[0]?.text || "未命名",
        vod_pic: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        vod_remarks: obj.videoRenderer.lengthText?.simpleText || "",
        ext: { vid }
      });
    }
  }
  for (const k in obj) {
    if (typeof obj[k] === "object") extractVideos(obj[k], list);
  }
  return list;
}

// 清單
async function getCards(ext) {
  ext = argsify(ext);
  const { type = "home", page = 1 } = ext;
  const { apiKey, context } = await initSession();

  let url, body;
  if (type === "home") {
    url = `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`;
    body = { context, browseId: "FEwhat_to_watch" };
  } else {
    url = `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`;
    body = { context, browseId: "FEtrending" };
  }

  const { data } = await $fetch.post(url, body, { headers: { "User-Agent": UA } });
  const json = argsify(data);

  const list = extractVideos(json, []);
  return jsonify({ list, page, pagecount: 999 });
}

// Tracks
async function getTracks(ext) {
  ext = argsify(ext);
  return jsonify({
    list: [{
      title: "播放",
      tracks: [{ name: "YouTube", ext }]
    }]
  });
}

// 播放
async function getPlayinfo(ext) {
  ext = argsify(ext);
  const vid = ext.vid;
  const { apiKey, context } = await initSession();

  let headers = {
    "User-Agent": UA,
    "Referer": "https://www.youtube.com/"
  };

  // 帶 Cookie & 自動生成 SAPISIDHASH
  if (ext.cookie) {
    headers.Cookie = ext.cookie;
    const auth = makeSAPISIDHASH(ext.cookie);
    if (auth) headers.Authorization = auth;
  }

  const url = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
  const body = { context, videoId: vid };

  const { data } = await $fetch.post(url, body, { headers });
  const json = argsify(data);

  let urls = [];

  if (json.streamingData?.hlsManifestUrl) {
    urls.push(json.streamingData.hlsManifestUrl);
  }

  if (json.streamingData?.formats) {
    json.streamingData.formats.forEach(f => {
      if (f.url) urls.push(f.url);
    });
  }

  return jsonify({ urls, headers: [headers] });
}

// 搜尋
async function search(ext) {
  ext = argsify(ext);
  const text = ext.text || ext.keyword || "";
  const { apiKey, context } = await initSession();

  const url = `https://www.youtube.com/youtubei/v1/search?key=${apiKey}`;
  const body = { context, query: text };

  const { data } = await $fetch.post(url, body, { headers: { "User-Agent": UA } });
  const json = argsify(data);

  const list = extractVideos(json, []);
  return jsonify({ list });
}
