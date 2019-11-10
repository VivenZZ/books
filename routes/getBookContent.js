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

router.get('/', function (req, res, next) {
    // 首先读取数据库，获取内容

    // 读取数据库里面的数据
    Book.find({}).exec(function (err, books) {
        let booksLength =  books.length
        if (err) {
            console.log(err);
        } else {
            // 拿到数据，循环遍历，根据url查找书籍详情页
            books.forEach((item, index) => {
                getBook(item.href, item._id).then(bookContentList => {
                    // bookContentList 书籍章节列表
                    // 查找数据库书籍id的chapterNumber的最大值章节
                    BookContent.find({
                        bookId: item._id
                    }).sort({'chapterNumber': -1})
                        .skip(0)
                        .limit(1)
                        .exec(function (err, dataBookContent) {
                        if (dataBookContent.length == 0) {
                            // 章节内容不存在
                            BookContent.insertMany(bookContentList, function (err, docs) {
                                if (err) console.log(`《${item.name}》章节添加失败${err}`);
                                console.log(`《${item.name}》章节添加完成`);
                            })
                        } else {
                            /**
                             * 章节内容存在，我们找到最大章节
                             */
                            let maxChapterNumber = dataBookContent[0].chapterNumber;

                            // 循环页面获取的章节列表
                            bookContentList.forEach((content, index) => {
                                //如果index>= maxChapterNumber 则 添加到数据库
                               if (index >= maxChapterNumber) {
                                   let bookContet = new BookContent({
                                       _id: content._id, // id
                                       href: content.href,
                                       chapterNumber: content.chapterNumber,
                                       bookId: content.bookId, // 书籍id
                                       title: content.title, // 书籍标题
                                       path: content.path // 书籍路径
                                   });
                                   bookContet.save(function (err) {
                                       if (err) {
                                           console.log(err);
                                       } else {
                                           console.log(`添加${item.name}/${content.title}成功`);
                                       }
                                   })
                               }

                            });
                        }
                        booksLength--;
                        if (booksLength == 0) {
                            console.log('章节全部更新完成');
                            res.send('<a href="/">下载小说章节列表完毕，点击返回主页</a>')
                        }
                    });
                });
            })
        }
    });

    // 根据url 爬取书籍详情页
    async function getBook(href, bookId) {
        try {
            // 定义章节列表
            let bookContent = [];
            const res = await superagent.get(href).buffer(true).charset('gbk');
            let $ = cheerio.load(res.text);
            let chapterNumber = 0;
            $("#list-chapterAll .panel-chapterlist dd").each((idx, ele) => {
                let title = $(ele).find('a').text();
                let href = $(ele).find('a').attr('href');
                chapterNumber++;
                // 这里获取每个章节的信息
                let chapterId = mongoose.Types.ObjectId();
                bookContent.push({
                    _id: chapterId,
                    title,
                    href,
                    chapterNumber,
                    bookId,
                    path: `/books/${bookId}/${chapterId}.txt`
                })
            });
            return bookContent;
        } catch (e) {
            console.log(e);
        }
    }
});

module.exports = router;
