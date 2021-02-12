const ytdl = require('ytdl-core')
const cliProgress = require('cli-progress')
const fs = require('fs')

const b1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

const getStream = async (url) => {
  console.log(`Downloading from ${url} ...`)
  let allReceived = false
  return new Promise((resolve, reject) => {
    const stream = ytdl(url, { 
      quality: ['18'],
      filter: format => format.container === 'mp4' 
    })
    .on('progress', (_, totalDownloaded, total) => {
      if(!allReceived) {
        b1.start(total, 0, {
          mbTotal: (total / 1024 / 1024).toFixed(2),
          mbValue: 0
        })
        allReceived = true
      }
      b1.increment()
      b1.update(
        totalDownloaded,
        {
          mbValue: (totalDownloaded / 1024 / 1024).toFixed(2)
        }
      )
    })
    .on('end', () => {
      b1.stop()
      console.log('Download Complete!')
    })
    return resolve(stream)
  })
}

const downloadVideo = async (stream, url) => {
  const strs = url.split('=')
  const id = strs[1]
  const path = `files/${id}.mp4`
  const writer = fs.createWriteStream(path)
  stream.pipe(writer)
  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      resolve ({
        success: true
      })
    })
    writer.on('error', () => {
      resolve({
        success: false
      })
    })
  }) 
}

exports.getFile = async (url) => {
  const stream = await getStream(url)
  const movie = await downloadVideo(stream, url)
  if (!movie.success) {
    return ({
      success: false,
      err: '下载错误'
    })
  }
  return({
    success: true
  })
} 