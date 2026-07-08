// 逐步排查海报不显示原因
// Step 1: 验证后端 page 接口返回的 posters 字段格式

const http = require('http');

// 先获取 token
function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'admin',
      password: '123456',
      captcha: '1234'
    });

    const options = {
      hostname: 'localhost',
      port: 8001,
      path: '/admin/base/open/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data?.token || json.token);
        } catch (e) {
          reject(new Error('登录响应解析失败: ' + data.substring(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function callApi(token, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('响应解析失败: ' + data.substring(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    console.log('=== 逐步排查海报不显示原因 ===\n');

    console.log('Step 1: 登录获取 token...');
    const token = await login();
    console.log('Token 获取成功:', token?.substring(0, 20), '...\n');

    console.log('Step 2: 调用 page 接口获取列表数据...');
    const pageResult = await callApi(token, '/admin/knowledge/film/page?page=1&size=10');
    console.log('page 接口响应结构:', Object.keys(pageResult));
    console.log('code:', pageResult.code);

    const list = pageResult.data?.list || pageResult.list || [];
    console.log('列表数据条数:', list.length, '\n');

    if (list.length > 0) {
      console.log('Step 3: 分析第一条数据的 posters 字段...');
      const first = list[0];
      console.log('第一条数据ID:', first.id);
      console.log('第一条数据名称:', first.name);
      console.log('posters 值:', first.posters);
      console.log('posters 类型:', typeof first.posters);
      console.log('posters 是数组吗:', Array.isArray(first.posters));

      // 检查是否是 JSON 字符串
      if (typeof first.posters === 'string') {
        try {
          const parsed = JSON.parse(first.posters);
          console.log('posters 是 JSON 字符串，解析后:', parsed);
          console.log('解析后是数组:', Array.isArray(parsed));
        } catch (e) {
          console.log('posters 是普通字符串，不是 JSON:', first.posters);
        }
      }
      console.log('');

      // 检查更多数据
      console.log('Step 4: 检查所有数据的 posters 类型分布...');
      let arrayCount = 0, stringCount = 0, nullCount = 0, otherCount = 0;
      let withPosters = 0;
      list.forEach(item => {
        const p = item.posters;
        if (p === null || p === undefined) nullCount++;
        else if (Array.isArray(p)) { arrayCount++; if (p.length > 0) withPosters++; }
        else if (typeof p === 'string') { stringCount++; if (p && p !== '[]') withPosters++; }
        else otherCount++;
      });
      console.log('  数组类型:', arrayCount, '条');
      console.log('  字符串类型:', stringCount, '条');
      console.log('  null/undefined:', nullCount, '条');
      console.log('  其他类型:', otherCount, '条');
      console.log('  有海报数据的:', withPosters, '条');
      console.log('');
    }

    console.log('Step 5: 调用 info 接口对比详情数据...');
    const firstItem = list[0];
    if (firstItem) {
      const infoResult = await callApi(token, `/admin/knowledge/film/info?id=${firstItem.id}`);
      const infoData = infoResult.data || infoResult;
      console.log('info 接口 posters 值:', infoData.posters);
      console.log('info 接口 posters 类型:', typeof infoData.posters);
      console.log('info 接口 posters 是数组:', Array.isArray(infoData.posters));
      console.log('');
    }

    console.log('=== 结论 ===');
    console.log('如果 page 接口 posters 是字符串，info 接口是数组，');
    console.log('则问题在 BaseService.page() 走原生 SQL，transformer 不生效。');
    console.log('前端 parsePosters() 兼容处理即可解决。');

  } catch (e) {
    console.error('错误:', e.message);
  }
})();
