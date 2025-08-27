// XPTV: 91Porn extension (Final Basic Build)

const cheerio = createCheerio();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// 有些 91Porn 站點會改域名，建議用能打開的最新鏡像站
const SITE = "https://91porn.com";
const API_BASE = "https://91povideo.com/api";

const appConfig = {
  ver: 1,
  title: "91Porn",
  site: SITE,
  tabs: [
    { name: "首頁 Home", ext: { category: "" }, ui: 1 },
    { name: "精選 Featured", ext: { category: "rf" }, ui: 1 },
    { name: "本月熱門 Monthly Hot", ext: { category: "tf" }, ui: 1 },
    { name: "本週熱門 Weekly Hot", ext: { category: "mf" }, ui: 1 },
    { name: "最新影片 Latest", ext: { category: "mr" }, ui: 1 }
  ]
};

async function getConfig() {
  return jsonify(appConfig);
}

async function getCards(ext) {
  const { category = "", page = 1 } = argsify(ext);
  const url = `${API_BASE}/list_info?category=${category}&page=${page}`;
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });

  const list = (data.data?.list || []).map(v => ({
    vod_id: v.viewkey,
    vod_name: v.title,
    vod_pic: v.pic,
    vod_duration: v.duration,
    vod_remarks: v.addtime || "",
    ext: { viewkey: v.viewkey }
  }));

  return jsonify({ list, page, pagecount: Number(data.data.totalPage || 99) });
}

async function getTracks(ext) {
  const { viewkey } = argsify(ext);
  const url = `${API_BASE}/video_info?viewkey=${viewkey}&userKey=`;
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });

  const tracks = [];
  if (data?.data?.videoSrc) {
    tracks.push({ name: "標清", ext: { url: data.data.videoSrc } });
  }
  if (data?.data?.HD) {
    tracks.push({ name: "高清", ext: { url: data.data.HD } });
  }

  return jsonify({ list: [{ title: "播放", tracks }] });
}

async function getPlayinfo(ext) {
  return jsonify({
    urls: [ext.url],
    headers: [{ "User-Agent": UA, Referer: SITE }]
  });
}

async function search(ext) {
  const { text = "", page = 1 } = argsify(ext);
  const url = `${API_BASE}/search?search=${encodeURIComponent(text)}&page=${page}`;
  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });

  const list = (data.data?.list || []).map(v => ({
    vod_id: v.viewkey,
    vod_name: v.title,
    vod_pic: v.pic,
    vod_duration: v.duration,
    ext: { viewkey: v.viewkey }
  }));

  return jsonify({ list, page });
}