const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// 计算缓存目录
const keys = 'a02e8413-52ff-467b-b1cb-b968e5bd8765';
const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');
const cacheDir = path.join(os.homedir(), '.cool-admin', md5(keys), 'cache');

console.log('Cache dir:', cacheDir);

// 读取所有缓存文件，查找验证码
const files = fs.readdirSync(cacheDir);
console.log('Total cache files:', files.length);

let found = 0;
for (const file of files) {
  const filePath = path.join(cacheDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    // 查找验证码相关的 key
    for (const key of Object.keys(data)) {
      if (key.includes('verify') || key.includes('img') || key.includes('captcha')) {
        console.log(`Found key: ${key} = ${data[key]}`);
        found++;
      }
    }
  } catch (e) {
    // skip
  }
}

console.log(`Found ${found} captcha-related keys`);
