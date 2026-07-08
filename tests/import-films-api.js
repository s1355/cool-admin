// 通过 API 从 Excel 导入电影数据
const XLSX = require('xlsx');

(async () => {
  console.log('=== 从 Excel 导入电影数据到数据库（API方式）===\n');

  // 1. 读取 Excel 文件
  const workbook = XLSX.readFile('d:\\Users\\kaifa\\Trae_cn260425\\erotic-film-database.v2.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Excel 总数据: ${data.length} 条\n`);

  // 2. 通过 API 登录获取 token
  // cool-admin 在开发环境(NODE_ENV=local)会跳过验证码校验
  console.log('正在通过 API 登录...');
  const loginRes = await fetch('http://localhost:8001/admin/base/open/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: '123456',
      captchaId: 'skip',
      verifyCode: 0
    })
  });
  const loginData = await loginRes.json();
  console.log('登录响应 code:', loginData.code);

  if (loginData.code !== 0 && loginData.code !== 1) {
    console.log('登录失败:', loginData.msg || JSON.stringify(loginData));
    return;
  }

  const token = loginData.data?.token || loginData.token;
  if (!token) {
    console.log('未获取到 token');
    return;
  }
  console.log('登录成功\n');

  // 3. 获取电影分类列表
  console.log('获取电影分类...');
  const categoryRes = await fetch('http://localhost:9001/admin/knowledge/filmCategory/list', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const categories = await categoryRes.json();
  
  const categoryMap = {};
  const catList = categories.list || categories.data?.list || categories.data || categories;
  if (Array.isArray(catList)) {
    catList.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
  }
  console.log('分类映射:', categoryMap);

  // 4. 逐条导入数据
  let successCount = 0;
  let failCount = 0;
  const errors = [];

  console.log(`\n开始导入 ${data.length} 条数据...\n`);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    const filmData = {
      name: row['名称'] || '',
      director: row['导演/作者'] || '',
      year: row['年份'] || null,
      country: row['国家'] || '',
      mainCharacters: row['主要人物'] || '',
      synopsis: row['内容简介'] || '',
      backgroundStory: row['背景故事'] || '',
      posters: row['海报链接'] ? [row['海报链接']] : [],
      personalRating: row['评分'] || null,
      categoryId: categoryMap[row['分类']] || null,
      quality: row['质量'] || 'C',
      watched: false,
      doubanRating: null,
      tmdbRating: null,
      link: '',
      honors: '',
      highlights: '',
      whyWorthWatching: ''
    };

    if (!filmData.name) {
      console.log(`[${i + 1}/${data.length}] 跳过: 名称为空`);
      failCount++;
      continue;
    }

    try {
      const res = await fetch('http://localhost:9001/admin/knowledge/film/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filmData)
      });

      const result = await res.json();
      
      if (result.code === 0 || result.code === 1) {
        successCount++;
        console.log(`[${i + 1}/${data.length}] 成功: ${filmData.name}`);
      } else {
        failCount++;
        errors.push({ index: i + 1, name: filmData.name, error: result.msg || '未知错误' });
        console.log(`[${i + 1}/${data.length}] 失败: ${filmData.name} - ${result.msg || '未知错误'}`);
      }
    } catch (e) {
      failCount++;
      errors.push({ index: i + 1, name: filmData.name, error: e.message });
      console.log(`[${i + 1}/${data.length}] 异常: ${filmData.name} - ${e.message}`);
    }

    if ((i + 1) % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n=== 导入完成 ===');
  console.log(`成功: ${successCount} 条`);
  console.log(`失败: ${failCount} 条`);
  
  if (errors.length > 0) {
    console.log('\n失败详情:');
    errors.slice(0, 20).forEach(err => {
      console.log(`  [${err.index}] ${err.name}: ${err.error}`);
    });
    if (errors.length > 20) {
      console.log(`  ... 还有 ${errors.length - 20} 条错误`);
    }
  }
})();
