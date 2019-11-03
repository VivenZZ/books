
const fs = require('fs');
const path  = require('path');
function getStat(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                resolve(false);
            } else {
                resolve(stats);
            }
        })
    })
}

function mkdir(dir) {
    return new Promise((resolve, reject) => {
        fs.mkdir(dir, err => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        })
    })
}
async function dirExists(dir){
    let isExists = await getStat(dir);
    //如果该路径且不是文件，返回true
    if(isExists && isExists.isDirectory()){
        return true;
    }else if(isExists){     //如果该路径存在但是文件，返回false
        return false;
    }
    //如果该路径不存在
    let tempDir = path.parse(dir).dir;      //拿到上级路径
    //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
    let status = await dirExists(tempDir);
    let mkdirStatus;
    if(status){
        mkdirStatus = await mkdir(dir);
    }
    return mkdirStatus;
}

/**
 *
 * @param dir './2019/a/b
 * @param path './2019/a/b/1.txt
 * @param data '数据源'
 * @returns {Promise<void>}
 */
async function mkDir(dir, path, data){
    await dirExists(dir);
    fs.writeFile(path, data, err => {
        if(err) return console.log('写入失败' + err);
        console.log('写入成功')
    })
}

module.exports = mkDir;