//昊
//2025-3-22
//超清 4K 加密未解密无法获取
const cheerio = createCheerio()
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const appConfig = {
  ver: 1,
  title: '网菲猫',
  site: 'https://www.ncat21.com',
  tabs: [
    {
      name: '電影',
      ext: {
        id: 1,
      },
    },
    {
      name: '劇集',
      ext: {
        id: 2,
      },
    },
    {
      name: '動漫',
      ext: {
        id: 3,
      },
    },

  ],
}

async function getConfig() {
  return jsonify(appConfig)
}

async function getCards(ext) {

  ext = argsify(ext)
  let cards = []
  let { page = 1, id } = ext

  const url = appConfig.site + `/show/${id}-----3-${page}.html`
  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA,
    },
  })

  const $ = cheerio.load(data)

  $("div.module-item").each((index, e) => {
    console.log(index)
    const href = $(e).find("a.v-item").attr('href') || ''
    const title = $(e).find("div.v-item-title").eq(1).text().trim() || ''
    const img = $(e).find('img').eq(1).attr('data-original') || ''
    const remarks = $(e).find('span').eq(1).text().trim() || $(e).find('span').text().trim()
    if (img) {
      cards.push({
        vod_id: href,
        vod_name: title,
        vod_pic: img,
        vod_remarks: remarks,
        ext: {
          url: `${appConfig.site}${href}`,
        },

      })
    }

  })

  return jsonify({
    list: cards,
  })
}

async function getTracks(ext) {
  ext = argsify(ext);

  let groups = [];
  let url = ext.url;
  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA,
    },
  });
  const $ = cheerio.load(data);
  const line_list = []
  const line_change = $('span.source-item-label')
  line_change.each((index, el) => {
    line_list.push($(el).text().trim())

  })
  console.log(line_list)

  const line_id = []


  $('div.episode-list').each((num, el) => {

    line_id.push($(el).attr("id"))

  })
  for (let i = 0; i < line_id.length; i++) {
    let group = {
      title: `${line_list[i]}`,
      tracks: [],
    };

    const playlist = $(`div#${line_id[i]}`)

    playlist.each((index, e) => {

      $(e).find("a.episode-item").each((n, el) => {

        group.tracks.push({
          name: `${$(el).text()}`,
          pan: '',
          ext: {
            url: `${appConfig.site}${$(el).attr("href")}`,
          },
        });
      })

    })

    if (group.tracks.length > 0) {
      groups.push(group);
    }
  }
  return jsonify({ list: groups });
}

async function getPlayinfo(ext) {
  ext = argsify(ext)
  const url = ext.url
  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA,
    },
  })

  //$utils.toastError(jsonify(data))
  const $ = cheerio.load(data);
  const scriptContent = $('script:contains("function gogogo()")').html();
  const srcRegex = /const\s+playSource\s*=\s*{\s*src:\s*"([^"]+)"/;
  let url_id = scriptContent.match(srcRegex)[1];
  return jsonify({ urls: [url_id] })
}
async function search(ext) {
  ext = argsify(ext)
  let cards = []

  let text = encodeURIComponent(ext.text)
  let page = ext.page || 1
  let url = `${appConfig.site}/search?k=${text}&page=${page}&os=pc`

  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA,
    },
  })

  const $ = cheerio.load(data)

  $("a.search-result-item").each((index, e) => {
    console.log(index)

    const href = $(e).attr('href') || ''
    const title = $(e).find('img.lazy.lazyload').eq(0).attr("title") || ''
    const img = $(e).find('img.lazy.lazyload').attr('data-original') || ''

    const remarks = $(e).find('div').first().text().trim() || ''

    cards.push({
      vod_id: href,
      vod_name: title,
      vod_pic: appConfig.site + img,
      vod_remarks: remarks,
      ext: {
        url: `${appConfig.site}${href}`,
      },

    })
  })

  return jsonify({
    list: cards,
  })
}
async function extractPlaySourceSrc(code) {

  //$utils.toastError(jsonify(code))

  let match = code.match(/'\\u0073\\u0072\\u0063'\s*:\s*"([^"]+)"/);
  if (match) {
    let encodedSrc = match[1];
    let decodedSrc = JSON.parse(`"${encodedSrc}"`);
    $utils.toastError(jsonify(decodedSrc))
    return decodedSrc;
  }


}
