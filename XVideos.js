
const cheerio = createCheerio();

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

let appConfig = {
    ver: 1,
    title: 'XVideos',
    site: 'https://www.xvideos.com',
    tabs: [
        { name: '首頁', ext: { id: '' }, ui: 1 },
        { name: '最新', ext: { id: 'new' }, ui: 1 },
        { name: '最多觀看', ext: { id: 'top' }, ui: 1 },
        { name: 'HD 精選', ext: { id: 'quality_hd' }, ui: 1 },
        { name: '女同性戀', ext: { id: 'lesbian' }, ui: 1 },
        { name: '亞洲', ext: { id: 'asian' }, ui: 1 },
        { name: '素人', ext: { id: 'amateur' }, ui: 1 },
    ],
};

async function getConfig() {
    return jsonify(appConfig);
}

async function getCards(ext) {
    ext = argsify(ext);
    let cards = [];
    let { page = 1, id } = ext;
    let url = appConfig.site;

    if (id) {
        url += `/tags/${id}/${page}`;
    } else if (page > 1) {
        url += `/new/${page}`;
    }

    const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA },
    });

    const $ = cheerio.load(data);

    $('div.thumb-block').each((_, el) => {
        const href = $(el).find('a').attr('href');
        const title = $(el).find('p.title').text().trim();
        const cover = $(el).find('img').attr('data-src') || '';
        const subTitle = $(el).find('.metadata span.views').text().trim() || '';
        const duration = $(el).find('.duration').text().trim() || '';
        if (href && title && cover) {
            cards.push({
                vod_id: href,
                vod_name: title,
                vod_pic: cover,
                vod_remarks: subTitle,
                vod_duration: duration,
                ext: {
                    url: appConfig.site + href,
                },
            });
        }
    });

    return jsonify({ list: cards });
}

async function getTracks(ext) {
    ext = argsify(ext);
    let tracks = [];
    let url = ext.url;

    const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA },
    });

    const matches = data.match(/setVideoUrlHigh\('(.+?)'\)/);
    if (matches && matches[1]) {
        tracks.push({
            name: '高清 MP4',
            pan: '',
            ext: {
                url: matches[1],
            },
        });
    }

    return jsonify({
        list: [
            {
                title: '預設分組',
                tracks,
            },
        ],
    });
}

async function getPlayinfo(ext) {
    ext = argsify(ext);
    const url = ext.url;
    const headers = { 'User-Agent': UA };

    return jsonify({ urls: [url], headers: [headers] });
}

async function search(ext) {
    ext = argsify(ext);
    let cards = [];

    let text = encodeURIComponent(ext.text);
    let page = ext.page || 1;
    let url = `${appConfig.site}/?k=${text}&p=${page}`;

    const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA },
    });

    const $ = cheerio.load(data);

    $('div.thumb-block').each((_, el) => {
        const href = $(el).find('a').attr('href');
        const title = $(el).find('p.title').text().trim();
        const cover = $(el).find('img').attr('data-src') || '';
        const subTitle = $(el).find('.metadata span.views').text().trim() || '';
        const duration = $(el).find('.duration').text().trim() || '';
        if (href && title && cover) {
            cards.push({
                vod_id: href,
                vod_name: title,
                vod_pic: cover,
                vod_remarks: subTitle,
                vod_duration: duration,
                ext: {
                    url: appConfig.site + href,
                },
            });
        }
    });

    return jsonify({ list: cards });
}
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
        vod_id: 'href',
        vod_name: 'title',
        vod_pic: 'cover',
        vod_remarks: 'remarksa',
        ext: {  // ext
          url: `href`,
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
