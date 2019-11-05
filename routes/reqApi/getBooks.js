const express = require('express');
const router = express.Router();

// 链接数据库
let mongodb = require('../../db/index.js');
let Book = mongodb.Book;


/* GET home page. */
/**
 * 请求所有书籍列表
 */
router.get('/books', function(req, res, next) {
    console.log(req.params.id);
    Book.find({}).exec((err, books) => {
        res.json({books})
    })
});
/**
 * 请求分类列表
 * 1.xuanhuanxiaoshuo
 * 2.xiuzhenxiaoshuo
 * 3.dushixiaoshuo
 * 4.chuanyuexiaoshuo
 * 5.wangyouxiaoshuo
 * 6.kehuanxiaoshuo
 */
router.get('/books/:className', function(req, res, next) {
    Book.find({novelclass: req.params.className}).exec((err, books) => {
        res.json({books})
    })
});

module.exports = router;
