var express = require('express');
var router = express.Router();
// 请求
const charset = require('superagent-charset');
const superagent = charset(require('superagent'));
// dom操作
let cheerio = require('cheerio');
// mongo
let mongoose = require('mongoose');

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
    const res = await superagent.get(url).charset('gbk');
    // 通过cheerio进行dom操作
    let $ = cheerio.load(res.text);
    // 遍历标签
    $('div#newscontent .r li').each((idx, ele) => {
      // 定义书标签内容
      let book = {
        name: $(ele).find('.s2 a').text(),
        href: $(ele).find('.s2 a').attr('href'),
        Author: '',
        newChapter: '',
        uptime: '',
        description: '',
        novelclass: novelClass
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
    const res = await superagent.get(href).charset('gbk');;
    let $ = cheerio.load(res.text);
    book.name = $("#info h1").text();
    book.Author = $("#info p").eq(0).text();
    book.uptime = $("#info p").eq(2).text();
    book.newChapter = $("#info p").eq(3).text();
    book.description = $("#intro p").eq(1).text();
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

getBookList('https://www.biquge.tv/xuanhuanxiaoshuo/', 'xuanhuan').then(books=>{
  books.forEach((item, index) => {
    // 需要通过上面获得的书籍href进入详情页 获取详细信息
    getBook(item.href, item).then(book=>{
    });
  })
});






/* GET home page. */
router.get('/books', function(req, res, next) {
  res.send(bookList);
});

module.exports = router;
