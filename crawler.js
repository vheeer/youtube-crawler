const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

exports.crawler = async (url) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  })
  const page = await browser.newPage()
  await page.goto(url)
  const html = await page.content()
  const results = parse(html)

  await browser.close()
  return results
}

function parse(html) {
  const $ = cheerio.load(html)
  let results = []
  $('#contents ytd-grid-video-renderer').each((i, link) => {
    results.push('https://www.youtube.com' + $(link).find('#thumbnail').attr('href'))
  })
  return results
}