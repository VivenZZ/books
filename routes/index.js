const express = require('express');
const router = express.Router();
// 链接数据库
let mongodb = require('../db/index.js');

let BookContent = mongodb.BookContent;

/* GET home page. */
router.get('/', function(req, res, next) {
  let books = []
  BookContent.find({bookId: '5dbf7f297c23081f6c1399c7'}).exec(function (err, book) {
    if (err) console.log(err);
    books = book;
    console.log(1111)
    res.json(books);
  });
});

module.exports = router;

