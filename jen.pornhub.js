
const cheerio = createCheerio()

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

let appConfig = {
    ver: 1,
    title: 'pornhub',
    site: 'https://cn.pornhub.com',
    tabs: [
        { name: '首頁', ext: { id: 'sy' }, ui: 1 },
        { name: '最新', ext: { id: 'cm' }, ui: 1 },
        { name: '最多觀看', ext: { id: 'mv' }, ui: 1 },
        { name: '最熱門', ext: { id: 'ht' }, ui: 1 },
        { name: '最高評價', ext: { id: 'tr' }, ui: 1 },
        { name: '女同性戀', ext: { id: 'c', category: 'lesbian' }, ui: 1 },
        { name: '素人', ext: { id: 'c', category: 'amateur' }, ui: 1 },
        { name: '亞洲', ext: { id: 'c', category: 'asian' }, ui: 1 },
        { name: '日本', ext: { id: 'c', category: 'japanese' }, ui: 1 },
        { name: '熱門女優', ext: { id: 'c', category: 'pornstars' }, ui: 1 },
    ],
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let { page = 1, id, category } = ext
    let url = ''

    if (id === 'sy') {
        url = `${appConfig.site}/video?`
        if (page > 1) {
            url += `page=${page}`
        }
    } else if (id === 'c' && category) {
        url = `${appConfig.site}/video?c=${category}`
        if (page > 1) {
            url += `&page=${page}`
        }
    } else {
        url = `${appConfig.site}/video?o=${id}`
        if (page > 1) {
            url += `&page=${page}`
        }
    }

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)

    $('li.videoBox').each((_, element) => {
        const href = $(element).find('.phimage a.img').attr('href')
        const title = $(element).find('.title a').attr('title')
        const cover = $(element).find('.phimage a.img img').attr('src') || $(element).find('.phimage a.img img').attr('data-mediumthumb') || ''
        const subTitle = $(element).find('.views').text().trim() || ''
        const duration = $(element).find('.duration').text().trim() || ''
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: subTitle,
            vod_duration: duration,
            ext: {
                url: appConfig.site + href,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}

async function getTracks(ext) {
    ext = argsify(ext)
    let tracks = []
    let url = ext.url

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const jsonStr = data.match(/var flashvars_.* = \{(.*?)\};/)[1]
    const json = JSON.parse('{' + jsonStr + '}')
    const videos = json.mediaDefinitions.filter((e) => e.format === 'hls')
    videos.forEach((e) => {
        tracks.push({
            name: e.quality,
            pan: '',
            ext: {
                url: e.videoUrl,
            },
        })
    })

    return jsonify({
        list: [
            {
                title: '預設分組',
                tracks,
            },
        ],
    })
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    const url = ext.url
    const headers = {
        'User-Agent': UA,
    }

    return jsonify({ urls: [url], headers: [headers] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = `${appConfig.site}/video/search?search=${text}&page=${page}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)

    $('li.videoBox').each((_, element) => {
        const href = $(element).find('.phimage a.img').attr('href')
        const title = $(element).find('.title a').attr('title')
        const cover = $(element).find('.phimage a.img img').attr('src') || $(element).find('.phimage a.img img').attr('data-mediumthumb') || ''
        const subTitle = $(element).find('.views').text().trim() || ''
        const duration = $(element).find('.duration').text().trim() || ''
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: subTitle,
            vod_duration: duration,
            ext: {
                url: appConfig.site + href,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
