import fs from 'fs'
import { sql } from './mysql.js';
import { getVideosByUser } from './crawler.js'
import { join } from 'path';
// const channelURL = "https://www.youtube.com/playlist?list=PL7X0EtIoZRgEZfnI0XUXcJFGk7ES7EBD0" 关键时刻-完整版播放列表 2301.086388888889  hours
// const channelURL = "https://www.youtube.com/playlist?list=PLsM1UnHINXdQxeBanAHRf52cqDlLVgS9e" 萨沙-2020NEW播放列表 视频数: 2142 视频时长: 401.3797222222222  hours
// const channelURL = "https://www.youtube.com/playlist?list=PLsM1UnHINXdTgk_IX03bU5xrSHXC0U-Zz" 萨沙-2021NEW播放列表 视频数: 624 视频时长: 119.49972222222222  hours
// const channelURL = "https://www.youtube.com/playlist?list=PLsM1UnHINXdShbA0RcZEiv3D1m3xPSvxf" 萨沙-底层逻辑播放列表 视频数: 741 视频时长: 202.14277777777778  hours
const channel_links = [
  // "https://www.youtube.com/playlist?list=PL7X0EtIoZRgEZfnI0XUXcJFGk7ES7EBD0",
  // "https://www.youtube.com/playlist?list=PLsM1UnHINXdQxeBanAHRf52cqDlLVgS9e",
  // "https://www.youtube.com/playlist?list=PLsM1UnHINXdTgk_IX03bU5xrSHXC0U-Zz",
  // "https://www.youtube.com/playlist?list=PLsM1UnHINXdShbA0RcZEiv3D1m3xPSvxf",
  // "https://www.youtube.com/channel/UCY8bSKQb5ZpP9QCszCCL-ow",
  // "https://www.youtube.com/channel/UCAHK74SppWwI-my4xBuh2LA",
  "https://www.youtube.com/channel/UCghLs6s95LrBWOdlZUCH4qw",
  "https://www.youtube.com/channel/UC5xunxPS6oZ1zzKufgREFuA",
  "https://www.youtube.com/channel/UCM33VtveeEmfA6LC7tH30Xw",
  "https://www.youtube.com/channel/UCD_gy8DWV_DhjJ-bQXF5dGQ",
  "https://www.youtube.com/channel/UCThvTxQ-zF_ENso9LD_uHOQ",
  "https://www.youtube.com/channel/UCvTe3Z7TZsjGzUERx4Ce6zA",
  "https://www.youtube.com/channel/UC5uh3zVGmvyQoks_LxBJ-5Q",
  "https://www.youtube.com/channel/UCIXOIjR2mp8tHz78DE0vj2A",
  "https://www.youtube.com/channel/UCAPTk-pgX5cfharAoWnkRUQ",
  "https://www.youtube.com/channel/UCNiJNzSkfumLB7bYtXcIEmg",
  "https://www.youtube.com/channel/UCa6ERCDt3GzkvLye32ar89w",
  "https://www.youtube.com/channel/UCtAIPjABiQD3qjlEl1T5VpA",
  "https://www.youtube.com/channel/UCzjhdu0yMChb8vRz8Ky3LCg",
  "https://www.youtube.com/channel/UCnyPxKrdrXDjlBBucRAIuuA",
  "https://www.youtube.com/channel/UCjGBF7OQXzgJFDwrbzxtDrQ",
  "https://www.youtube.com/channel/UCtLgwBOza-dnuaBg6W6YXog",
  "https://www.youtube.com/channel/UCSs4A6HYKmHA2MG_0z-F0xw",
  "https://www.youtube.com/channel/UCUBhobCkTLhgfUNRAgHSYmw",
  "https://www.youtube.com/channel/UC000Jn3HGeQSwBuX_cLDK8Q",
  // "https://www.youtube.com/channel/UCbKazqxVVIT0aIm4ZPR9t4w",
  // "https://www.youtube.com/channel/UCRByPS00RZsAUe2DTCoHuFQ",
  // "https://www.youtube.com/channel/UClIi3_PFR0zG4OiaOBa94Qw"
];


        /**
                 * 数组分割成多数组
                 * @param  {[type]} array 要分割的数组
                 * @param  {[type]} size  每个数组的个数
                 * @return {[type]}       返回一个数组
                 */
         const slice_to_chunk = (array, size) => {
          let [start, end, result] = [null, null, []];
          for (let i = 0; i < Math.ceil(array.length / size); i++) {
              start = i * size;
              end = start + size;
              result.push(array.slice(start, end));
          }
          return result;
      };

  const users = await sql.query("SELECT * FROM user WHERE channel_id is NULL", ['']);
  console.log('需要处理的user：',users)

    for (const channel_link of users.map(user => user.url)) {
      console.log('开始处理频道链接：' + channel_link)
      // 开启事务
      const connection = await sql.transaction();

      try{
        const result = await getVideosByUser(channel_link, { limit: Infinity })
        const { name, url, channelID, bestAvatar: { url: best_avatar_url } } = result.author;
        try{
          await connection.query("UPDATE user SET channel_id = ? ,name = ?, best_avatar_url = ? WHERE url = ?", [channelID,name,best_avatar_url,channel_link])
          console.log("UPDATE user SET channel_id = ? ,name = ?, best_avatar_url = ? WHERE url = ?", [channelID,name,best_avatar_url,channel_link])
        }catch(e){
          console.log("-----频道添加错误",e)
          // 回滚
          await sql.rollback(connection);
          continue;
        }
        // 过滤重复
        const clear_items = [];
        for(const video of result.items) {
          if (clear_items[clear_items.length - 1] && clear_items[0]['id'] !== video['id'])
            clear_items.push(video)
        }

        const single_video_insert = async (video, channelID) => {
          console.log('>>>>>>>>单个处理视频：' + video.title)
          const { title, id, shortUrl: short_url, url, author, bestThumbnail, isAlive: is_alive, durationSec: duration_sec, isLive: is_live, isPlayable: is_playable } = video;
          try{
            await connection.query("insert into video (video_id,title,url,short_url,author_url,author_channel_id,author_name,best_thumbnail_url,is_live,duration,is_playable,content)values(?,?,?,?,?,?,?,?,?,?,?,'')", [id,title,url,short_url,author.url,author.channelID,author.name,bestThumbnail.url,is_live?1:0,duration_sec,is_playable?1:0])
          }catch(e){
            console.log("视频：" + name + " 已存在，ID为" + channelID + e)
          }
        }
        const mul_video_insert = async (videos, channelID, n=100) => {
          console.log('>>>>>>>>处理合集：');
          videos.map(video => console.log('>>>>视频: ' + video.title))
          const sql_1 = `(?,?,?,?,?,?,?,?,?,?,?,'')`;
          let sql_params = [];
          for (const video of videos) {
            
            const { title, id, shortUrl: short_url, url, author, bestThumbnail, isAlive: is_alive, durationSec: duration_sec, isLive: is_live, isPlayable: is_playable } = video;
            sql_params = [ ...sql_params,id,title,url,short_url,author.url,author.channelID,author.name,bestThumbnail.url,is_live?1:0,duration_sec,is_playable?1:0 ]; 

          }
          const sql_2 = Array.from(Array(videos.length), () => sql_1).join(',');

          try{
            await connection.query(`insert into video (video_id,title,url,short_url,author_url,author_channel_id,author_name,best_thumbnail_url,is_live,duration,is_playable,content)values${sql_2}`, sql_params);
          }catch(e){
            console.log("百条插入出现错误，开始逐条插入", e)
            for (const video of videos) {
              await single_video_insert(video, channelID)
            }
          }
        }

        // 灌入视频数据
        const n = 100;
        const chunks = slice_to_chunk(result.items, n);
        
        let x = 0;
        for (const chunk of chunks) {

          await mul_video_insert(chunk, channelID);

          console.log(x + '-' + Math.min(x+n) + ' of ' + result.items.length + ' done')
          x+=n
        }
      }catch(e){
        // 回滚
        await sql.rollback(connection);
        console.log("频道：" + channel_link + " 出现异常，停止操作", e)
      }
      console.log('---------提交---------');
      // 提交
      await sql.commit(connection);
      console.log('---------提交成功---------');
      await sql.release(connection);
      console.log('---------释放成功---------');
    }
  
  
    // const res = await sql.query("select * from video")
    // console.log(res)

    console.log('---结束----')


