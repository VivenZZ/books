const express = require('express');
const router = express.Router();

// 链接数据库
let mongodb = require('../../db/index.js');
let BookContent = mongodb.BookContent;
let Book = mongodb.Book;


/* GET home page. */
router.get('/:bookId', function(req, res, next) {
    let bookDetails = {}
    Book.find({_id: req.params.bookId}).exec((err, book) => {
        bookDetails =book[0];
        BookContent.find({bookId: req.params.bookId}).exec((err, chapter) => {
            res.json({bookDetails,chapter})
        })
    })
});


module.exports = router;
