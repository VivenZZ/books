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
    let pageNumber = req.query.pageNumber;
    let pageSize = req.query.pageSize ? req.query.pageSize : 5;
    let classId = req.query.classId;
    let status = req.query.status;
    let opt = {}
    switch (classId) {
        case 'xuanhuan':
            opt.novelclass = '玄幻小说'
            break
        case 'dushi':
            opt.novelclass = '都市小说'
            break
        case 'xianxia':
            opt.novelclass = '仙侠小说'
            break
        case 'lishi':
            opt.novelclass = '历史小说'
            break
    }
    if(status == 1) {
        opt.status = '连载中'
    }
    if(status == 2) {
        opt.status = '已完成'
    }
    console.log(opt)
    let limitNumber = pageSize * (pageNumber-1);
    Book.find(opt).countDocuments((err, count) => {
        Book.find(opt).skip(limitNumber).limit(pageSize).sort({hot: -1}).exec((err, books) => {
            res.json({books, count})
        })
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
