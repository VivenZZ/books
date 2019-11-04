var express = require('express');
var router = express.Router();
const path = require('path');
const fs = require('fs');
const https = require('https');
// 异步请求 防止请求过快内容过载
const async = require('async');
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
// 获取创建文本的js
const mkDir = require('../tools/mkDir.js');

let Book = mongodb.Book;
let BookContent = mongodb.BookContent;
/**
 * 这里只添加最新添加的章节内容。
 * 即：当书籍id的文件夹存在books里面的时候，我们就pass掉。
 * 如果不存在，我们就把章节下载进文件夹内，
 * 当书籍id的文件夹存在里面的时候，我们执行update方法。去执行更新。
 */
router.get('/', function(req, res, next) {
    // 读取书籍数据库内容
    Book.find({}).exec(function (err, bookList) {
        if (err) console.log(err);
        // 获取书籍列表遍历
        bookList.forEach((book, index) => {
            // 获取书籍ID
            let ID = book._id;
            let href = book.href;
            // 检测bookList/books文件夹下是否有当前id的文件夹
            if (fs.existsSync(`../bookList/books/${ID}`)){
                //存在直接进行更新
                console.log('文件存在')
            } else {
                // 不存在全部下载
                // 首先读取bookContent表中的数据
                BookContent.find({
                    bookId: ID
                }).exec(function (err, bookContents) {
                    // 循环结果根据href字段找到章节内容
                    async.mapLimit(bookContents, 2, (bookContent, callback) => {
                        let url = href + bookContent.href.match(/([0-9]+).html/)[0];
                        let bookContentNumber = bookContent.chapterNumber;
                        getBookContenDetails(url).then(data=>{
                            mkDir(`./bookList/books/${ID}`,
                                `./bookList/books/${ID}/${bookContentNumber}.txt`,
                                data);
                            callback(null,bookContent);
                        });
                    });
                })
            }

        })
    });

    // 根据url 爬取书籍章节详情
    async function getBookContenDetails(href) {
        try {
            const res = await superagent.get(href).charset('utf-8');
            let $ = cheerio.load(res.text);
            return $("#content").text();

        } catch (e) {
            console.log(e);
        }
    }


    res.send('添加书籍内容到本地文件夹');
});

module.exports = router;
