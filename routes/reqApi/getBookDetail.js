const express = require('express');
const router = express.Router();

// 链接数据库
let mongodb = require('../../db/index.js');
let BookContent = mongodb.BookContent;


/* GET home page. */
/**
 * 请求所有书籍列表
 */
router.get('/:bookId', function(req, res, next) {
    BookContent.find({bookId: req.params.bookId}).exec((err, chapter) => {
        res.json({chapter})
    })
});


module.exports = router;
