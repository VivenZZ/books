const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const http = require('http');
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

/* GET home page. */
router.get('/', function(req, res, next) {


// 定义书籍列表
    let bookList = [];
    /**
     * 通过async定义 异步函数
     * @param url 地址
     * @param novelClass 书籍分类
     * @returns {Promise<void>} 返回一个promise 结果值为书籍列表
     */
    async function getBookList(url,novelClass) {
        try {
            // 通过请求获取内容 .charset 解决中文乱码
            const res = await superagent.get(url).buffer(true).charset('utf-8');
            // 通过cheerio进行dom操作
            let $ = cheerio.load(res.text);
            // 遍历标签
            $('div#newscontent .r li').each((idx, ele) => {
                // 定义书标签内容
                let book = {
                    name: $(ele).find('.s2 a').text(),
                    href: $(ele).find('.s2 a').attr('href'),
                    Author: $(ele).find('.s5').text(),
                    newChapter: '',
                    uptime: '',
                    description: '',
                    img: '',
                    imgPath: '',
                    novelclass: novelClass,
                    status: false
                };
                bookList.push(book)
            });
            return bookList;
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * 获取书籍的详细信息，进入书籍详情页
     * @param href 通过书籍列表获取的href
     * @param book 通过书籍列表获取的书籍
     * @returns {Promise<*>} 补全书籍信息后的book
     */
    async function getBook(href, book) {
        try {
            const res = await superagent.get(href).buffer(true).charset('utf-8');
            let $ = cheerio.load(res.text);
            book.uptime = $("#info p").eq(2).text().replace('最后更新：','');
            book.newChapter = $("#info p").eq(3).text().replace('最新章节： ','');
            book.description = $("#intro p").eq(1).text();
            book.img = $("#fmimg img").attr('src');
            $("#list dd").each((idx, ele) => {
                let title = $(ele).find('a').text();
                let href =  $(ele).find('a').attr('href');
                // 这里获取每个章节的信息
            });
            return book;
        } catch (e) {
            console.log(e);
        }
    }

    getBookList('http://www.xbiquge.la/dushixiaoshuo/', 'dushixiaoshuo').then(books=>{
        books.forEach((item, index) => {
            // 需要通过上面获得的书籍href进入详情页 获取详细信息
            getBook(item.href, item).then(val=>{
                Book.find({
                    name: val.name,
                    Author: val.Author
                }).exec(function (err, book) {
                    if (err) {
                        console.log(err);
                    } else {
                        // 如果书籍不存在 添加书籍
                        if (book.length == 0) {
                            let bookId = mongoose.Types.ObjectId();
                            val.imgPath = path.join(__dirname,`../bookList/image/${bookId}.png`);// 封面图本地路径
                            saveImage(val.img, val.imgPath);
                            let book = new Book({
                                _id: bookId,
                                name: val.name, // 名称
                                href: val.href, // 地址
                                Author: val.Author, // 作者
                                newChapter: val.newChapter, // 最新章节
                                uptime: val.uptime, // 更新时间
                                description: val.description, // 简介
                                img: val.img, // 封面图
                                novelclass: val.novelclass, // 分类
                                imgPath: val.imgPath, // 封面图本地路径
                                status: val.status // 状态 连载or完本
                            });
                            book.save(function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('添加成功');
                                }
                            })
                        }
                        // 如果书籍存在，我们要获取当前章节数 和 数据库的章节数是否相等
                        if (book.length != 0) {
                            console.log('书籍已经存在，不要重复添加')
                        }
                    }
                });
            });

        })
    });


//保存图片
    function saveImage(url,path) {
        http.get(url,function (req,res) {
            var imgData = '';
            req.on('data',function (chunk) {
                imgData += chunk;
            });
            req.setEncoding('binary');
            req.on('end',function () {
                fs.writeFile(path,imgData,'binary',function (err) {
                    if (err) {
                        console.log('图片保存失败' + err);
                    } else {
                        console.log('保存图片成功'+path)
                    }
                })
            })
        })
    }
    res.send('获取书籍列表接口')
});

module.exports = router;

