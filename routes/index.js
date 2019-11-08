const express = require('express');
const router = express.Router();
// const mkDir = require('../tools/mkDir.js');

console.log(11)
/* GET home page. */
router.get('/', function(req, res, next) {
  // mkDir('./bookList/books/2019/xxxx/ssss','./bookList/books/2019/xxxx/ssss/1.txt','我是神的试着')
  console.log(222);
  res.render('index', {title: '小说更新入口'});
});

module.exports = router;

