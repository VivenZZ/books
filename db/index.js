var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/books', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function (callback) {
    console.log("数据库成功连接");
});
// 定义书籍列表模型
let bookSchema = new mongoose.Schema({
    ID: String, // 自动获取id
    name: String, // 名称
    href: String, // 地址
    Author: String, // 作者
    newChapter: String, // 最新章节
    uptime: String, // 更新时间
    description: String, // 简介
    img: String, // 封面图
    novelclass: String, // 分类
    imgPath: String, // 封面图本地路径
    status: Boolean // 状态 连载or完本
});
// 定义书籍模型
let bookContentSchema = new mongoose.Schema({
    ID: String, // id
    href: String,
    chapterNumber: Number,
    bookId: String, // 书籍id
    title: String, // 书籍标题
    path: String // 书籍路径
});

let mongodb = {};
mongodb.Book = mongoose.model('book', bookSchema);
mongodb.BookContent = mongoose.model('bookContent', bookContentSchema);
module.exports = mongodb;
