const express = require('express');
const router = express.Router();
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
    async function getBookList(url) {
        try {
            // 通过请求获取内容 .charset 解决中文乱码
            const res = await superagent.get(url).buffer(true).charset('gbk');
            // 通过cheerio进行dom操作
            let $ = cheerio.load(res.text);
            // 遍历标签
            $('.table tr').each((idx, ele) => {
                // 如果不是第一行就开始
                if (idx != 0) {
                    // 定义书标签内容
                    let book = {
                        name: $(ele).find('td').eq(0).find('a').text(),
                        href: $(ele).find('td').eq(0).find('a').attr('href'),
                        Author: $(ele).find('td').eq(2).text(),
                        newChapter: $(ele).find('td').eq(1).find('a').text(),
                        uptime: $(ele).find('td').eq(4).text(),
                        description: '',
                        img: '',
                        imgPath: '',
                        novelclass: '',
                        numbers: '',
                        hot: $(ele).find('td').eq(3).text(),
                        status: $(ele).find('td').eq(5).text()
                    };
                    bookList.push(book)
                }
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
            const res = await superagent.get(href).buffer(true).charset('gbk');
            let $ = cheerio.load(res.text);
            book.novelclass = $(".booktag .red").eq(1).text();
            book.description = $("#bookIntro").text().replace(/(^\s*)|(\s*$)/g, "");
            book.img = $(".img-thumbnail").attr('src');
            book.numbers = $(".booktag .blue").eq(0).text().replace('字数：','');
            return book;
        } catch (e) {
            console.log(e);
        }
    }

    /**
     */
    let url = 'https://www.ranwen8.com/top/allvote/'
    getBookList(url).then(books=>{
        let booksLength = books.length;
        let addBooks = []; //添加的书籍
        let repeatBooks = []; // 重复的书籍
        books.forEach((item, index) => {
            // 需要通过上面获得的书籍href进入详情页 获取详细信息
            getBook(item.href, item).then(val=>{
                // 根据 作者和书名，确定不是同一本书
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
                            val.imgPath = `/image/${val.name}.png`;// 封面图本地路径
                            saveImage(val.img, path.join(__dirname,`../bookList/image/${val.name}.png`));
                            let book = new Book({
                                _id: bookId,
                                name: val.name, // 名称
                                href: val.href, // 地址
                                Author: val.Author, // 作者
                                newChapter: val.newChapter, // 最新章节
                                uptime: val.uptime, // 更新时间
                                description: val.description, // 简介
                                img: val.img, // 封面图
                                hot: val.hot,
                                numbers: val.numbers,
                                novelclass: val.novelclass, // 分类
                                imgPath: val.imgPath, // 封面图本地路径
                                status: val.status // 状态 连载or完本
                            });
                            book.save(function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(`${val.name}添加成功`);
                                }
                            })
                            addBooks.push(val.name);
                        }
                        // 如果书籍存在，我们要获取当前章节数 和 数据库的章节数是否相等
                        if (book.length != 0) {
                            repeatBooks.push(val.name);
                        }
                    }
                });
                booksLength--;
                if (booksLength == 0) {
                    console.log(JSON.stringify(repeatBooks) + '书籍已存在，无需添加！');
                    console.log(JSON.stringify(addBooks) + '书籍添加完毕！');
                    res.send('<a href="/">获取小说列表完毕，点击返回主页</a>')
                }
            })

        })
    });


//保存图片
    function saveImage(url,path) {
        https.get(url,function (req,res) {
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
});

module.exports = router;

