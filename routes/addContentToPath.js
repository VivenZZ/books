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
// 获取文件夹下的文件个数
const checkFileNumber = require('../tools/checkFileNumber.js');

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
        // 获取书籍列表遍历 每次下载一本书
        async.mapLimit(bookList, 1, (book, callback) => {
            // 获取书籍ID
            let ID = book._id;
            let name = book.name;
            let href = book.href;
            let number = 0; // 本地文件夹中的章节数
            if (fs.existsSync(`../bookList/books/${name}`)){
                //存在直接进行更新
                console.log(`================${name}存在,开始更新=====================`);
                number = checkFileNumber(`../bookList/books/${name}`);
            }else {
                console.log(`================${name}不存在,开始下载=====================`);
                number = 0;
            }
            BookContent.find({
                bookId: ID,
                chapterNumber: {$gt: number}
            }).exec(function (err, bookContents) {
                console.log(bookContents.length)
                async.mapLimit(bookContents, 10, (bookContent, callback) => {
                    mkDir(`../bookList/books/${name}`,
                        `../bookList/books/${name}/${bookContent.chapterNumber}.txt`,
                        '',
                        callback);
                }, (err,results) =>{
                    if (err) console.log(err);
                });
                /*
                * 这里暂时不要下载，等前端有人看书的时候下载。暂时只建目录
                // 循环结果根据href字段找到章节内容
                async.mapLimit(bookContents, 50, (bookContent, callback) => {
                    let url = href + bookContent.href.match(/([0-9]+).html/)[0];
                    let bookContentNumber = bookContent.chapterNumber;
                    getBookContenDetails(url).then(data=>{
                        mkDir(`../bookList/books/${name}`,
                            `../bookList/books/${name}/${bookContentNumber}.txt`,
                            data);
                        callback(null,`${bookContent.title}下载完成`);
                    });
                }, function(err, results){
                    console.log(results)
                });*/
                callback(null, `${name}书籍下载完成`)
            })
        }, (err, results) => {
            if (err) {
                console.log(err)
            } else {
                console.log(results);
            };
        })
    });

    // 根据url 爬取书籍章节详情
    async function getBookContenDetails(href) {
        try {
            const res = await superagent.get(href).buffer(true).charset('utf-8');
            let $ = cheerio.load(res.text);
            return $("#content").text();

        } catch (e) {
            console.log(e);
        }
    }


    res.send('添加书籍内容到本地文件夹');
});

module.exports = router;
