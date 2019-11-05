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
    Book.find({}).exec((err, books) => {
        res.json(books)
    })
});

module.exports = router;
