async function getConfig() {
  const appConfig = {
    ver: 1,
    title: "xvideos",
    site: "https://www.xvideos.com",
    tabs: [{
      name: '最近更新',
      ext: {  // ext在当请求 getCards 回传
        id: 0,
      },
    }]
  }
  return jsonify(appconfig)
}

async function getCards(ext) {
  ext = argsify(ext)
  const { page, id } = ext
  let cards = []
  return jsonify({
      list: [{
        vod_id: '',
        vod_name: '',
        vod_pic: '',
        vod_remarks: '',
        ext: {  // ext在当请求 getTracks 回传
          url: `xxx`,
        },
      }],
  });
}

async function getTracks(ext) {
  ext = argsify(ext)
  const { url } = ext
  return jsonify({
      list: [{
        title: '默认',
        tracks: [{
          name: '',
          pan: '', // 网盘
          ext: {  // ext在当请求 getPlayinfo 回传
            url: '', 
          }
        }]
      }],
  });
}

async function getPlayinfo(ext) {
  ext = argsify(ext)
  let url = ext.url
  return jsonify({ 
    urls: [url],
    headers: [{'User-Agent': '', Referer: ''}], // 可选
  })
}

async function search(ext) {
  ext = argsify(ext)
  let cards = []
  return jsonify({
      list: cards,
  })
}
