// XPTV: xxoo168 extension
// 目前 getCards 用假資料測試，getTracks 直接調 API 拿 m3u8/mp4

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

// ========== 列表 (目前假資料) ==========
async function getCards(ext) {
  // TODO: 你找到列表 API 後，改成直接調 API
  const list = [
    {
      vod_id: "74159",
      vod_name: "測試影片 (74159)",
      vod_pic: "https://via.placeholder.com/300x168.png?text=Video",
      vod_remarks: "測試",
      ext: { video_id: "74159" } // 這裡帶 video_id 給 getTracks 用
    }
  ];
  return jsonify({ list, page: 1, pagecount: 1 });
}

// ========== 播放源 ==========
async function getTracks(ext) {
  ext = argsify(ext);
  const { video_id } = ext; // 從卡片 ext.video_id 帶過來

  const apiUrl = `${SITE}/api/v2/vod/reqplay/${video_id}`;
  const { data: raw } = await $fetch.get(apiUrl, {
    headers: {
      "User-Agent": UA,
      "Referer": SITE,
      "X-Requested-With": "XMLHttpRequest"
    }
  });

  let j;
  try {
    j = JSON.parse(raw);
  } catch (e) {
    return jsonify({ list: [{ title: "播放", tracks: [{ name: "原頁面", ext: { url: apiUrl } }] }] });
  }

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

// ========== 播放請求頭 ==========
async function getPlayinfo(ext) {
  ext = argsify(ext);
  return jsonify({
    urls: [ext.url],
    headers: [{ "User-Agent": UA, Referer: SITE }]
  });
}

// ========== 搜尋 (暫空) ==========
async function search(ext) {
  return jsonify({ list: [], page: 1 });
}
