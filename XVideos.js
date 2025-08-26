// XPTV: XVideos extension (整合乾淨版)

const cheerio = createCheerio();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";

const appConfig = {
  ver: 1,
  title: "XVideos",
  site: "https://www.xvideos.com",
  tabs: [
    { name: "首頁", ext: { url: "https://www.xvideos.com" } },
    { name: "最新", ext: { url: "https://www.xvideos.com/new" } },
    { name: "最多觀看", ext: { url: "https://www.xvideos.com/hot" } },
    { name: "HD 精選", ext: { url: "https://www.xvideos.com/c/HD-7" } },
    { name: "女同", ext: { url: "https://www.xvideos.com/c/Lesbian-20" } },
    { name: "亞洲", ext: { url: "https://www.xvideos.com/c/Asia-69" } },
    { name: "素人", ext: { url: "https://www.xvideos.com/c/Amateur-3" } }
  ]
};

function abs(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return appConfig.site.replace(/\/$/, "") + u;
}

// 配置
async function getConfig() {
  return jsonify(appConfig);
}

// 抓影片清單
async function getCards(ext) {
  ext = argsify(ext);
  let { url, page = 1 } = ext;
  if (page > 1) {
    url = url.replace(/\/$/, "") + "/" + page;
  }

  const { data } = await $fetch.get(url, { headers: { "User-Agent": UA } });
  const $ = cheerio.load(data);

  let list = [];
  $(".thumb-block, .video-thumb").each((_, el) => {
    const a = $(el).find("a").first();
    const href = a.attr("href");
    const title = a.attr("title") || a.text().trim();
    const cover =
