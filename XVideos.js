async function getConfig() {
  const appConfig = {
    ver: 1,
    title: "xvideos",
    site: "https://www.xvideos.com",
    tabs: [{
      name: '最近更新',
      ext: { 
        ui:1,
        id: channels-index,
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
        vod_id: 'vid',
        vod_name: 'vid',
        vod_pic: 'cover',
        vod_remarks: 'remarksa',
        ext: {  // ext
          url: `vid`,
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
