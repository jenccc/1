// XPTV: xxoo168 extension (從 Python 轉換 JS)
// 現階段 getCards 用假資料，getTracks 用真 API

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const SITE = "https://h5.xxoo168.org";

const appConfig = {
  ver: 1,
  title: "香蕉视频",
  site: SITE,
  tabs: [
    { name: "首頁 (測試)", ext: {}, ui: 1 },
  ]
};

async function getConfig() {
  return jsonify(appConfig);
}

// ===== 先用假資料模擬列表 =====
async function getCards(ext) {
  // 模擬三個影片卡片，方便測試
  const list = [
    {
      vod_id: "12345",
      vod_name: "測試影片1",
      vod_pic: "https://via.placeholder.com/300x168.png?text=Video1",
      vod_remarks: "測試",
      ext: { video_id: "12345" }
    },
    {
      vod_id: "67890",
      vod_name: "測試影片2",
      vod_pic: "https://via.placeholder.com/300x168.png?text=Video2",
      vod_remarks: "測試",
      ext: { video_id: "67890" }
    }
  ];

  return jsonify({ list, page: 1, pagecount: 1 });
}

// ===== 用真 API 拿播放源 =====
async function getTracks(ext) {
  ext = argsify(ext);
  const { video_id } = ext;  // 從卡片 ext.video_id 帶過來

  const apiUrl = `${SITE}/api/v2/vod/reqplay/${video_id}`;
  const { data } = await $fetch.get(apiUrl, {
    headers: {
      "User-Agent": UA,
      "Referer": SITE,
      "X-Requested-With": "XMLHttpRequest"
    }
  });

  const j = JSON.parse(data);

  const tracks = [];
  if (j.data) {
    if (j.data.httpurl_preview)
      tracks.push({ name: "預覽", ext: { url: j.data.httpurl_preview } });
    if (j.data.httpurl)
      tracks.push({ name: "正式", ext: { url: j.data.httpurl } });
  }

  if (tracks.length === 0)
    tracks.push({ name: "原頁面", ext: { url: apiUrl } });

  return jsonify({ list: [{ title: "播放", tracks }] });
}

// ===== 播放請求頭 =====
async function getPlayinfo(ext) {
  ext = argsify(ext);
  return jsonify({
    urls: [ext.url],
    headers: [{ "User-Agent": UA, Referer: SITE }]
  });
}

// ===== 搜尋（暫空） =====
async function search(ext) {
  return jsonify({ list: [], page: 1 });
}
