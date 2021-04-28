import mysql from 'mysql'
import moment from 'moment'

const database = {
  host: '199.19.105.117',
  user: 'root',
  password: 'ostrovsky_z',
  database: 'videos',
  port: '3306',
  charset: 'utf8mb4'
}
export const sql = {};
const pool = mysql.createPool(database);
/**
 * 通用操作方法
 */
sql.query = function (sql, params) {
  return new Promise(function (resolve, reject) {
    pool.getConnection(function (err, connection) {
      if (err) {
        console.error(moment().format() + "sql.query:" + err + "----sql:" + sql);
        reject(err);
      }

      connection.query(sql, params, function (err, result) {
        if (err) {
          console.error(moment().format() + "\n #### sql.query:" + err + "\n----sql:" + sql + "\n----param:" + params);
          reject(err);
        }
        resolve(result);
      });
      //回收pool
      connection.release();
    });
  });
};
/**
 * 事务
 */
sql.transaction = function () {
  return new Promise(function (resolve, reject) {
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log("事务生成错误");
        reject(err);
      }
      connection.beginTransaction(function(err) {
        if (err) {
          console.log("事务生成错误");
          reject(err);
        }
        console.log("事务生成成功");
        resolve(connection);
      });
      
    });
  });
};

/**
 * 提交事务
 */
 sql.commit = function (connection) {
  return new Promise(function (resolve, reject) {
    
    connection.commit(function(err) {
      if (err) {
        connection.rollback(function() {
          console.log('事务提交失败,已回滚');
          reject(connection);
        });
      }
      console.log('事务提交!');
      resolve(connection)
    });

  });
};

/**
 * 回滚事务
 */
 sql.rollback = function (connection) {
  return new Promise(function (resolve, reject) {
    
    connection.rollback(function() {
      console.log('事务回滚');
      resolve(connection);
    });

  });
};
/**
 * 销毁事务
 */
 sql.release = function (connection) {
  return new Promise(function (resolve, reject) {
    console.log('事务准备销毁');
    
    connection.release();
    resolve(connection);

  });
};
