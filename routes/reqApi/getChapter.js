const express = require('express');
const router = express.Router();
let fs = require('fs');
const https = require('https');
// 异步请求 防止请求过快内容过载
const async = require('async');
// 防乱码
const charset = require('superagent-charset');
// 请求
const superagent = charset(require('superagent'));
// dom操作
let cheerio = require('cheerio');
// 获取创建文本的js
const mkDir = require('../../tools/mkDir.js');

// 链接数据库
let mongodb = require('../../db/index.js');
let BookContent = mongodb.BookContent;


/* GET home page. */
/**
 * 请求所有书籍列表
 */
/**
 * 请求所有书籍列表
 */
async function getBookContenDetails(href) {
  try {
    const res = await superagent.get(href).buffer(true).charset('gbk');
    let $ = cheerio.load(res.text);
    // 获取页码
    let ym = $(".readTitle small").text().match(/[0-9]/g);
    let text = $("#htmlContent").text();
    return {text,currentPage: ym[0], pages: ym[1]};
  } catch (e) {
    console.log(e);
  }
}
router.get('/:chapterId', function(req, res, next) {
  BookContent.find({_id: req.params.chapterId}).exec((err, chapter) => {
    let bookId = chapter[0].bookId;
    let chapterId =  chapter[0]._id;
    if (fs.existsSync(`bookList/books/${bookId}/${chapterId}.txt`)) {
      console.log('文件已存在');
    } else {
      console.log('文件不存在');
      let text = '';
      getBookContenDetails(`https://www.ranwen8.com${ chapter[0].href}`).then(data=>{
        console.log(data);
        let newHref = `https://www.ranwen8.com${chapter[0].href}`.replace(/.html$/,'');
        if (data.currentPage < data.pages){
          text+=data.text;
          getBookContenDetails(`${newHref}_${++data.currentPage}.html`).then(data=>{
            text += data.text;
            res.json(text)
          });
        }
        // mkDir(`./bookList/books/${bookId}`,
        //   `./bookList/books/${bookId}/${chapterId}.txt`,
        //   data);
        // res.json(data)
        // if (!ym || ym[0] == ym[1]){
        //   return text;
        // }
        // if (ym[0] < ym[1]){
        //   getBookContenDetails(`${newHref}_${++ym[0]}.html`).then(data=>{
        //     console.log('第二次' + data);
        //     text += data;
        //   });
        // }
      });
    }
  })
});


module.exports = router;
