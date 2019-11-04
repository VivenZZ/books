var express = require('express');
var router = express.Router();
const path = require('path');
const fs = require('fs');
const https = require('https');
// 防乱码
const charset = require('superagent-charset');
// 请求
const superagent = charset(require('superagent'));
// dom操作
let cheerio = require('cheerio');
// mongo
let mongoose = require('mongoose');
// 链接数据库
let mongodb = require('../db/index.js');

let Book = mongodb.Book;
let BookContent = mongodb.BookContent;

router.get('/', function(req, res, next) {
  // 首先读取数据库，获取内容

  // 读取数据库里面的数据
  Book.find({}).exec(function (err, books) {
    if (err) {
      console.log(err);
    } else {
      // 拿到数据，循环遍历，根据url查找书籍详情页
      books.forEach((item, index) => {
        getBook(item.href, item._id).then(bookContentList =>{
            // bookContentList 书籍章节列表
            // 查找数据库，如果书籍id不存在，则全部添加
            BookContent.find({
                bookId: item._id
            }).exec(function (err, dataBookContent) {
                if (dataBookContent.length == 0) {
                    // 章节内容不存在
                    BookContent.insertMany(bookContentList, function (err, docs) {
                        if (err) console.log(`《${item.name}》章节添加失败${err}`);
                        console.log(`《${item.name}》章节添加完成`);
                    })
                } else {
                    // 章节内容存在，开始对比章节title, 如果title已经存在则返回，不存在则继续添加
                    // 因为bookContentList是依次添加进去的，所以可以实现从后向前遍历，
                    // 如果有相同章节出现则不用继续添加了。
                    let list = [];
                    dataBookContent.forEach((item, index) => {
                        list.push(item.title);
                    });
                    // 遍历 获取的章节，从后依次向前
                    for (let i = bookContentList.length - 1; i > 0 ; i--) {
                        // 判断数据库中的标题可包含当前标题，包含则退出循环
                        if (list.includes(bookContentList[i].title)) {
                            return;
                        } else {
                            // 不包含当前章节，则添加当前章节到数据库。
                            let bookContet = new BookContent({
                                _id: bookContentList[i]._id, // id
                                href: bookContentList[i].href,
                                chapterNumber: bookContentList[i].chapterNumber,
                                bookId: bookContentList[i].bookId, // 书籍id
                                title: bookContentList[i].title, // 书籍标题
                                path: bookContentList[i].path // 书籍路径
                            });
                            bookContet.save(function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(`添加${bookContentList[i].title}成功`);
                                }
                            })
                        }
                    }
                }
            });
        })
      })
    }
  });

  // 根据url 爬取书籍详情页
  async function getBook(href, bookId) {
    try {
      // 定义章节列表
      let bookContent = [];

      const res = await superagent.get(href).charset('utf-8');
      let $ = cheerio.load(res.text);
      let chapterNumber = 0;
      $("#list dd").each((idx, ele) => {
        let title = $(ele).find('a').text();
        let href =  $(ele).find('a').attr('href');
        chapterNumber++;
        // 这里获取每个章节的信息
        let chapterId = mongoose.Types.ObjectId();
        bookContent.push({
          _id: chapterId,
          title,
          href,
          chapterNumber,
          bookId,
          path: path.join(__dirname,`../bookList/book/${bookId}/${chapterId}.txt`)
        })
      });
      return bookContent;
    } catch (e) {
      console.log(e);
    }
  }


  res.send('获取书籍内容接口');
});

module.exports = router;
