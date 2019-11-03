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
    BookContent.find({}).exec(function (err, books) {
        if (err) {
            console.log(err);
        } else {

        }
    });

    // 根据url 爬取书籍章节
    async function getBook(href, bookId) {
        try {
            // 定义章节列表
            let bookContent = [];

            const res = await superagent.get(href).charset('gbk');
            let $ = cheerio.load(res.text);
            $("#list dd").each((idx, ele) => {
                let title = $(ele).find('a').text();
                let href =  $(ele).find('a').attr('href');
                // 这里获取每个章节的信息
                let chapterId = mongoose.Types.ObjectId();
                bookContent.push({
                    _id: chapterId,
                    title,
                    href,
                    bookId,
                    path: path.join(__dirname,`../bookList/book/${bookId}/${chapterId}.txt`)
                })
            });
            return bookContent;
        } catch (e) {
            console.log(e);
        }
    }


    res.send('添加书籍内容到本地文件夹');
});

module.exports = router;
