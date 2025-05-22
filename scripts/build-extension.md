const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

// 创建zip文件
const output = fs.createWriteStream(path.resolve(__dirname, '../dist/onetabs.zip'))
const archive = archiver('zip', {
  zlib: { level: 9 }, // 设置压缩级别
})

output.on('close', function () {
  console.log(`Extension package created: ${archive.pointer()} bytes`)
})

archive.on('error', function (err) {
  throw err
})

// 确保icons目录存在
const iconsDir = path.resolve(__dirname, '../dist/icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// 将dist目录下的所有文件打包
archive.pipe(output)
archive.directory(path.resolve(__dirname, '../dist/'), false)
archive.finalize()
