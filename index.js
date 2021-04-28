import fs from 'fs'
import getFolderSize from 'get-folder-size'
import { crawler, getVideosByUser } from './crawler.js'
import { getFile } from './download.js'
import { sleep } from './utils.js'
import { sql } from "./mysql.js";

// const channelURL = "https://www.youtube.com/playlist?list=PL7X0EtIoZRgEZfnI0XUXcJFGk7ES7EBD0" 关键时刻-完整版播放列表 2301.086388888889  hours
// const channelURL = "https://www.youtube.com/playlist?list=PLsM1UnHINXdQxeBanAHRf52cqDlLVgS9e" 萨沙-2020NEW播放列表 视频数: 2142 视频时长: 401.3797222222222  hours
// const channelURL = "https://www.youtube.com/playlist?list=PLsM1UnHINXdTgk_IX03bU5xrSHXC0U-Zz" 萨沙-2021NEW播放列表 视频数: 624 视频时长: 119.49972222222222  hours
// const channelURL = "https://www.youtube.com/playlist?list=PLsM1UnHINXdShbA0RcZEiv3D1m3xPSvxf" 萨沙-底层逻辑播放列表 视频数: 741 视频时长: 202.14277777777778  hours
// const channelURL = "https://www.youtube.com/channel/UCY8bSKQb5ZpP9QCszCCL-ow" 竹老板 375.89166666666665  hours
// const channelURL = "https://www.youtube.com/channel/UCAHK74SppWwI-my4xBuh2LA" 阿斗 55.415  hours
// const channelURL = "https://www.youtube.com/channel/UCghLs6s95LrBWOdlZUCH4qw" 石洞 726.4191666666667  hours
// const channelURL = "https://www.youtube.com/channel/UC5xunxPS6oZ1zzKufgREFuA" 袁腾飞官方 424.5830555555556  hours
// const channelURL = "https://www.youtube.com/channel/UCM33VtveeEmfA6LC7tH30Xw" 袁腾飞个人 12.865555555555556  hours
// const channelURL = "https://www.youtube.com/channel/UCD_gy8DWV_DhjJ-bQXF5dGQ" 磊哥 89.03083333333333  hours
// const channelURL = "https://www.youtube.com/channel/UCThvTxQ-zF_ENso9LD_uHOQ" 狗哥 151.69583333333333  hours
// const channelURL = "https://www.youtube.com/channel/UCvTe3Z7TZsjGzUERx4Ce6zA" 摄图日记 220.52694444444444  hours
// const channelURL = "https://www.youtube.com/channel/UC5uh3zVGmvyQoks_LxBJ-5Q" 郑国成 1190.421111111111  hours
// const channelURL = "https://www.youtube.com/channel/UCIXOIjR2mp8tHz78DE0vj2A" 徐晓东 270.98083333333335  hours
// const channelURL = "https://www.youtube.com/channel/UCAPTk-pgX5cfharAoWnkRUQ" 秦胖子 视频数: 444 视频时长: 296.36055555555555  hours
// const channelURL = "https://www.youtube.com/channel/UCNiJNzSkfumLB7bYtXcIEmg" 博通 274.5875  hours
// const channelURL = "https://www.youtube.com/channel/UCa6ERCDt3GzkvLye32ar89w" 江峰 291.5577777777778  hours 共748个视频
// const channelURL = "https://www.youtube.com/channel/UCtAIPjABiQD3qjlEl1T5VpA" 文昭 286.94388888888886  hours 共903个视频
// const channelURL = "https://www.youtube.com/channel/UCzjhdu0yMChb8vRz8Ky3LCg" 长脸 65.40305555555555  hours
// const channelURL = "https://www.youtube.com/channel/UCnyPxKrdrXDjlBBucRAIuuA" 圆脸 117.49222222222222  hours
// const channelURL = "https://www.youtube.com/channel/UCjGBF7OQXzgJFDwrbzxtDrQ" 蒟蒻 34.66722222222222  hours
// const channelURL = "https://www.youtube.com/channel/UCtLgwBOza-dnuaBg6W6YXog" 公民老黑 210.42361111111111  hours
// const channelURL = "https://www.youtube.com/channel/UCSs4A6HYKmHA2MG_0z-F0xw" 李永乐老师 84.1061111111111  hours 共364个视频
// const channelURL = "https://www.youtube.com/channel/UCUBhobCkTLhgfUNRAgHSYmw" 科学声音 63.85333333333333  hours 视频数: 245
// const channelURL = "https://www.youtube.com/channel/UC000Jn3HGeQSwBuX_cLDK8Q" 柳杰克 视频数: 230 视频时长: 84.03861111111111  hours
// const channelURL = "https://www.youtube.com/channel/UCbKazqxVVIT0aIm4ZPR9t4w" 悉尼奶爸 视频数: 412 视频时长: 128.7711111111111  hours
// const channelURL = "https://www.youtube.com/channel/UCRByPS00RZsAUe2DTCoHuFQ" 好奇大叔 视频数: 90 视频时长: 31.038888888888888  hours
// const channelURL = "https://www.youtube.com/channel/UClIi3_PFR0zG4OiaOBa94Qw" 猫眼看世界（猫神）视频数: 453 视频时长: 78.765  hours

// const channelURL = "https://www.youtube.com/channel/UCRByPS00RZsAUe2DTCoHuFQ" 
// 每人抓取近期150个视频
// const channelURL = "https://www.youtube.com/channel/UCAHK74SppWwI-my4xBuh2LA" 



;(async () => {
  //创建目录
  const myFolder = './youtube-video';
  try{
    fs.mkdirSync(myFolder)
  }catch(e){
    console.log(myFolder + '目录已存在');
  }

  const _main = async () => {
    const size = await getFolderSize.loose(myFolder);
    let folder = "youtube-video";
    console.log('size: ' + (size / 1024 / 1024))
    // 文件夹大于10G时停止运行
    if (size > 10 * 1024 * 1024 * 1024)
      return
    console.log(`现存视频共： ${(size / 1000 / 1000 / 1000).toFixed(2)} GB, 开始执行`);
    
    const videos = fs.readdirSync('./youtube-video').filter(video => video.indexOf('.mp4') > -1);
    
    const sqlm = `
    SELECT 
      *
    FROM
      
      (SELECT MIN(id) AS v_1_id,SUM(video.download) AS download_count FROM video GROUP BY author_channel_id) AS v_1 
        LEFT JOIN
          (SELECT * FROM video WHERE id IN (SELECT MIN(id) FROM video GROUP BY author_channel_id) ORDER BY video.id) AS v
        ON
          v_1.v_1_id = v.id 
        LEFT JOIN
          user
        ON
          v.author_channel_id = user.channel_id
      
    ORDER BY
      v_1.download_count ASC;
    `;
    
    let current_video_id;
    let current_author_channel_id;
    try {
      const videos = await sql.query(sqlm);
      current_author_channel_id = videos[0]['author_channel_id'];
      const video_list = await sql.query("SELECT * FROM video WHERE author_channel_id = ? AND video.download = 0 ORDER BY id ASC;", [ current_author_channel_id ]);
      current_video_id = video_list[0]['video_id'];
    }catch(e){
      console.log("提取视频链接出现错误", e);
    }

    const second_folder = folder + "/" + current_author_channel_id;
    

    try{
      fs.mkdirSync(second_folder)
    }catch(e){
      console.log(second_folder + '目录已存在');
    }

    try {
      await getFile(current_video_id, second_folder);
      // 标记视频已经下载
      await sql.query("UPDATE video SET download = 1 WHERE video_id = ?;", [ current_video_id ])
    }catch(e){
      console.log("下载保存视频出现错误", e);
      fs.unlinkSync(`./${second_folder}/${current_video_id}.mp4`);
    }
  }

  while (1) {
    // try{
      await _main();
    // }catch(e){
    //   console.log('运行时出错', e);
    // }
    await sleep(5000);
  }

 

  // for(let url of videos) {
  //   await getFile(url)
  // }

  // await getFile(videos[0])

})() 