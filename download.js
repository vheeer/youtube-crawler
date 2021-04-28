import ytdl from 'ytdl-core'
import cliProgress from 'cli-progress'
import fs from 'fs'

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
      // console.log("chunk_length" + _, "totalDownloaded" + totalDownloaded, "total" + total)
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

const downloadVideo = async (stream, url, folder) => {
  // const strs = url.split('=')
  const id = url
  const path = `${folder}/${id}.mp4`
  const path_tmp = path + '.tmp'
  console.log('path_tmp' + path_tmp)
  const writer = fs.createWriteStream(path_tmp)
  stream.pipe(writer)
  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      fs.renameSync(path_tmp, path);
      resolve ({
        success: true
      })
    })
    writer.on('error', (a) => {
      reject("出大事了" + a)
    })
  }) 
}

export const getFile = async (url, folder) => {
  // ytdl(url)
  // .pipe(fs.createWriteStream('video.mp4'));
  const stream = await getStream(url)
  // const stream = ytdl(url).on('progress',(a,b,c) => console.log(`${a}-${b}-${c}`))
  const movie = await downloadVideo(stream, url, folder)
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