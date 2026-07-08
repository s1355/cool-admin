const XLSX = require('xlsx');
const http = require('http');

const XLSX_FILE = 'd:\\Users\\kaifa\\Trae_cn260425\\erotic-film-database.v2.xlsx';
const API_BASE = 'http://localhost:8001';

function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'admin',
      password: '123456',
      captchaId: 'dev',
      verifyCode: 'dev',
    });

    const options = {
      hostname: 'localhost',
      port: 8001,
      path: '/admin/base/open/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 1000 && result.data?.token) {
            resolve(result.data.token);
          } else {
            reject(new Error('登录失败: ' + data));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function importFilms(token, films) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(films);

    const options = {
      hostname: 'localhost',
      port: 8001,
      path: '/admin/knowledge/film/import',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        Authorization: token,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function main() {
  const batchArg = process.argv[2] || '11-60';
  const [start, end] = batchArg.split('-').map(Number);

  console.log(`读取 Excel 文件...`);
  const wb = XLSX.readFile(XLSX_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const rows = data.slice(1);
  const batch = rows.slice(start - 1, end);

  console.log(`第 ${start}-${end} 条，共 ${batch.length} 条待导入`);

  const films = batch.map((row) => ({
    name: row[1] ? String(row[1]).trim() : '',
    director: row[2] ? String(row[2]).trim() : '',
    year: row[3] ? parseInt(row[3]) : null,
    country: row[4] ? String(row[4]).trim() : '',
    mainCharacters: row[5] ? String(row[5]).trim() : '',
    synopsis: row[6] ? String(row[6]).trim() : '',
    backgroundStory: row[7] ? String(row[7]).trim() : '',
    posters: row[8] ? [String(row[8]).trim()] : [],
    personalRating: row[9] ? parseFloat(row[9]) : null,
    quality: row[11] ? String(row[11]).trim() : 'C',
    categoryId: 45,
  }));

  console.log(`登录中...`);
  const token = await login();
  console.log(`登录成功`);

  console.log(`导入中...`);
  const result = await importFilms(token, films);
  console.log('导入结果:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
