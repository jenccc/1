// XVideos 插件 (僅技術演示)

// 工具
const cheerio = createCheerio()

// 配置
async function getConfig() {
  const appConfig = {
    ver: 1,
    title: "XVideos",
    site: "https://www.xvideos.com/",
    tabs: [
      { name: '最新', ext: { url: 'https://www.xvideos.com/new/' } },
      { name: '熱門', ext: { url: 'https://www.xvideos.com/best/' } },
    ]
  }
  return jsonify(appConfig)
}

// 列表
async function getCards(ext) {
  ext = argsify(ext)
  const { url, page = 1 } = ext

  let target = url
  if (page > 1) {
    target = url.replace(/\/$/, '') + '/' + page + '/'
  }

  const { data } = await $fetch.get(target, { headers: { "User-Agent": "Mozilla/5.0" } })
  const $ = cheerio.load(data)

  let list = []
  $('.thumb-block').each((i, el) => {
    const a = $(el).find('a.thumb')
    const vod_name = a.attr('title')
    const vod_pic = $(el).find('img').attr('data-src') || $(el).find('img').attr('src')
    const vod_id = 'https://www.xvideos.com' + a.attr('href')
    list.push({
      vod_id,
      vod_name,
      vod_pic,
      vod_remarks: '',
      ext: { url: vod_id }
    })
  })

  return jsonify({ list, page, pagecount: 999 })
}

// Tracks
async function getTracks(ext) {
  ext = argsify(ext)
  const { url } = ext

  return jsonify({
    list: [{
      title: '播放',
      tracks: [{
        name: '主線路',
        pan: '',
        ext: { url }
      }]
    }]
  })
}

// 播放地址
async function getPlayinfo(ext) {
  ext = argsify(ext)
  const { url } = ext

  const { data } = await $fetch.get(url, { headers: { "User-Agent": "Mozilla/5.0" } })
  const $ = cheerio.load(data)

  // XVideos 頁面中 videoUrl 變量包含 m3u8/mp4
  const regex = /setVideoUrlHigh\('(.*?)'\)/
  const match = data.match(regex)
  let playUrl = match ? match[1] : ''

  return jsonify({
    urls: [playUrl],
    headers: [{ 'User-Agent': 'Mozilla/5.0', 'Referer': url }]
  })
}

// 搜索
async function search(ext) {
  ext = argsify(ext)
  const { keyword, page = 1 } = ext

  let target = `https://www.xvideos.com/?k=${encodeURIComponent(keyword)}&p=${page}`
  const { data } = await $fetch.get(target, { headers: { "User-Agent": "Mozilla/5.0" } })
  const $ = cheerio.load(data)

  let list = []
  $('.thumb-block').each((i, el) => {
    const a = $(el).find('a.thumb')
    const vod_name = a.attr('title')
    const vod_pic = $(el).find('img').attr('data-src') || $(el).find('img').attr('src')
    const vod_id = 'https://www.xvideos.com' + a.attr('href')
    list.push({
      vod_id,
      vod_name,
      vod_pic,
      ext: { url: vod_id }
    })
  })

  return jsonify({ list })
}