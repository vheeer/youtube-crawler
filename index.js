const { crawler } = require('./crawler')
const { getFile } = require('./download')
;(async () => {
  const url = 'https://www.youtube.com/channel/UChaPcyq-uGOio8S_7-bguZA/videos'
  const videos = await crawler(url)
  console.log(videos)

  for(let url of videos) {
    await getFile(url)
  }
})()