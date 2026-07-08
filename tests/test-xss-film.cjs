/**
 * XSS 修复效果复检 - 知识库电影模块
 * 测试后端 API 层的 XSS 转义是否生效
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8001';
const TEST_PREFIX = 'xss-test-';

// 测试结果汇总
const results = {
  passed: [],
  failed: [],
  testDataIds: {
    films: [],
    categories: []
  }
};

let token = '';

// 工具函数：记录测试结果
function recordTest(name, passed, detail = '') {
  const result = { name, passed, detail };
  if (passed) {
    results.passed.push(result);
    console.log(`  [PASS] ${name}`);
  } else {
    results.failed.push(result);
    console.log(`  [FAIL] ${name} - ${detail}`);
  }
}

// 工具函数：检查是否包含 XSS 危险字符（未转义）
function containsXssDanger(str) {
  // 如果包含未转义的 <script>、<img 等标签，说明有 XSS 风险
  if (typeof str !== 'string') return false;
  const dangerPatterns = [
    /<script[^>]*>/i,
    /<img[^>]*onerror/i,
    /<svg[^>]*onload/i,
    /javascript:/i,
    /on\w+=/i  // 事件处理器
  ];
  return dangerPatterns.some(pattern => pattern.test(str));
}

// 工具函数：检查是否被正确转义
function isProperlyEscaped(original, escaped) {
  // 原始字符串中的特殊字符应该被转义
  if (original.includes('<') && !escaped.includes('&lt;')) return false;
  if (original.includes('>') && !escaped.includes('&gt;')) return false;
  if (original.includes('"') && !escaped.includes('&quot;')) return false;
  if (original.includes("'") && !escaped.includes('&#039;') && !escaped.includes('&apos;')) {
    // 单引号可能转义为 &#039; 或 &apos;，也可能不需要转义（取决于实现）
    // 这里放宽检查
  }
  // 不应该包含未转义的危险标签
  if (containsXssDanger(escaped)) return false;
  return true;
}

// 从 SVG 验证码中提取文字
function extractCaptchaFromSvg(svgData) {
  // svg-captcha 生成的 SVG 中，文字在 <text> 元素内
  // 格式通常是: <text ...>ABCD</text>
  const match = svgData.match(/<text[^>]*>([^<]+)<\/text>/i);
  if (match) {
    return match[1].trim();
  }
  return null;
}

// 登录获取 token
async function login() {
  console.log('\n=== 登录获取 Token ===');
  try {
    // 1. 获取验证码
    const captchaResponse = await axios.get(`${BASE_URL}/admin/base/open/captcha`, { timeout: 10000 });
    const captchaData = captchaResponse.data?.data;
    
    if (!captchaData?.captchaId) {
      console.log('  获取验证码失败');
      return false;
    }
    
    const captchaId = captchaData.captchaId;
    const svgData = captchaData.data;
    
    // 从 SVG 中提取验证码文字
    const verifyCode = extractCaptchaFromSvg(svgData);
    
    if (!verifyCode) {
      console.log('  无法从 SVG 提取验证码');
      return false;
    }
    
    console.log(`  验证码: ${verifyCode}`);
    
    // 2. 登录
    const response = await axios.post(`${BASE_URL}/admin/base/open/login`, {
      username: 'admin',
      password: '123456',
      captchaId: captchaId,
      verifyCode: verifyCode
    }, { timeout: 10000 });
    
    if (response.data?.data?.token) {
      token = response.data.data.token;
      console.log('  登录成功');
      return true;
    } else {
      console.log('  登录失败:', JSON.stringify(response.data));
      return false;
    }
  } catch (error) {
    console.log('  登录异常:', error.message);
    if (error.response) {
      console.log('  响应数据:', JSON.stringify(error.response.data));
    }
    return false;
  }
}

// API 请求封装
async function apiRequest(method, url, data = null) {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    timeout: 10000
  };
  if (data) {
    config.data = data;
  }
  const response = await axios(config);
  return response.data;
}

// ========== 1. 电影新增 XSS 测试 ==========
async function testFilmAddXss() {
  console.log('\n=== 1. 电影新增 XSS 测试 ===');
  
  const xssPayloads = [
    { field: 'name', payload: '<script>alert("xss-test")</script>', desc: 'script标签' },
    { field: 'name', payload: '<img src=x onerror=alert(1)>', desc: 'img onerror' },
    { field: 'director', payload: '<svg onload=alert(1)>', desc: 'svg onload' },
    { field: 'description', payload: '"><script>alert(1)</script>', desc: '闭合引号+script' }
  ];

  for (const test of xssPayloads) {
    try {
      const filmData = {
        name: `${TEST_PREFIX}film-${test.desc}`,
        director: '测试导演',
        categoryId: 1,
        quality: '高清',
        year: 2024
      };
      filmData[test.field] = test.payload;
      
      const result = await apiRequest('POST', '/admin/knowledge/film/add', filmData);
      
      if (result.code === 0 || result.code === 200) {
        const filmId = result.data;
        results.testDataIds.films.push(filmId);
        
        // 查询详情验证
        const detailResult = await apiRequest('GET', `/admin/knowledge/film/info?id=${filmId}`);
        
        if (detailResult.code === 0 || detailResult.code === 200) {
          const detail = detailResult.data;
          const actualValue = detail[test.field];
          const escaped = isProperlyEscaped(test.payload, actualValue);
          
          recordTest(
            `电影新增 - ${test.field}字段(${test.desc})`,
            escaped,
            `输入: ${test.payload} | 返回: ${actualValue}`
          );
        } else {
          recordTest(`电影新增 - ${test.field}字段(${test.desc})`, false, '查询详情失败');
        }
      } else {
        recordTest(`电影新增 - ${test.field}字段(${test.desc})`, false, `新增失败: ${result.message}`);
      }
    } catch (error) {
      recordTest(`电影新增 - ${test.field}字段(${test.desc})`, false, `请求异常: ${error.message}`);
    }
  }
}

// ========== 2. 电影编辑 XSS 测试 ==========
async function testFilmUpdateXss() {
  console.log('\n=== 2. 电影编辑 XSS 测试 ===');
  
  // 先创建一条正常的电影
  let filmId;
  try {
    const addResult = await apiRequest('POST', '/admin/knowledge/film/add', {
      name: `${TEST_PREFIX}film-update-normal`,
      director: '测试导演',
      categoryId: 1,
      quality: '高清',
      year: 2024
    });
    if (addResult.code === 0 || addResult.code === 200) {
      filmId = addResult.data;
      results.testDataIds.films.push(filmId);
    } else {
      console.log('  创建测试数据失败');
      return;
    }
  } catch (error) {
    console.log('  创建测试数据异常:', error.message);
    return;
  }

  const xssPayloads = [
    { field: 'name', payload: '<img src=x onerror=alert(2)>', desc: 'img onerror' },
    { field: 'director', payload: '<script>alert("director-xss")</script>', desc: 'script标签' },
    { field: 'description', payload: '\' onmouseover=alert(1) \'', desc: '单引号闭合+事件' }
  ];

  for (const test of xssPayloads) {
    try {
      const updateData = { id: filmId };
      updateData[test.field] = test.payload;
      
      const result = await apiRequest('POST', '/admin/knowledge/film/update', updateData);
      
      if (result.code === 0 || result.code === 200) {
        // 查询详情验证
        const detailResult = await apiRequest('GET', `/admin/knowledge/film/info?id=${filmId}`);
        
        if (detailResult.code === 0 || detailResult.code === 200) {
          const detail = detailResult.data;
          const actualValue = detail[test.field];
          const escaped = isProperlyEscaped(test.payload, actualValue);
          
          recordTest(
            `电影编辑 - ${test.field}字段(${test.desc})`,
            escaped,
            `输入: ${test.payload} | 返回: ${actualValue}`
          );
        } else {
          recordTest(`电影编辑 - ${test.field}字段(${test.desc})`, false, '查询详情失败');
        }
      } else {
        recordTest(`电影编辑 - ${test.field}字段(${test.desc})`, false, `更新失败: ${result.message}`);
      }
    } catch (error) {
      recordTest(`电影编辑 - ${test.field}字段(${test.desc})`, false, `请求异常: ${error.message}`);
    }
  }
}

// ========== 3. 分类新增 XSS 测试 ==========
async function testCategoryAddXss() {
  console.log('\n=== 3. 分类新增 XSS 测试 ===');
  
  const xssPayloads = [
    { field: 'name', payload: '<script>alert("cat-xss")</script>', desc: 'script标签' },
    { field: 'name', payload: '<img src=x onerror=alert(1)>', desc: 'img onerror' },
    { field: 'name', payload: '"><svg onload=alert(1)>', desc: '闭合引号+svg' }
  ];

  for (const test of xssPayloads) {
    try {
      const catData = { name: test.payload };
      
      const result = await apiRequest('POST', '/admin/knowledge/filmCategory/add', catData);
      
      if (result.code === 0 || result.code === 200) {
        const catId = result.data;
        results.testDataIds.categories.push(catId);
        
        // 查询详情验证
        const listResult = await apiRequest('GET', '/admin/knowledge/filmCategory/list');
        
        if (listResult.code === 0 || listResult.code === 200) {
          const list = listResult.data || [];
          const found = list.find(item => item.id === catId);
          
          if (found) {
            const actualValue = found[test.field];
            const escaped = isProperlyEscaped(test.payload, actualValue);
            
            recordTest(
              `分类新增 - ${test.field}字段(${test.desc})`,
              escaped,
              `输入: ${test.payload} | 返回: ${actualValue}`
            );
          } else {
            recordTest(`分类新增 - ${test.field}字段(${test.desc})`, false, '未找到新增的分类');
          }
        } else {
          recordTest(`分类新增 - ${test.field}字段(${test.desc})`, false, '查询列表失败');
        }
      } else {
        recordTest(`分类新增 - ${test.field}字段(${test.desc})`, false, `新增失败: ${result.message}`);
      }
    } catch (error) {
      recordTest(`分类新增 - ${test.field}字段(${test.desc})`, false, `请求异常: ${error.message}`);
    }
  }
}

// ========== 4. 分类编辑 XSS 测试 ==========
async function testCategoryUpdateXss() {
  console.log('\n=== 4. 分类编辑 XSS 测试 ===');
  
  // 先创建一个正常的分类
  let catId;
  try {
    const addResult = await apiRequest('POST', '/admin/knowledge/filmCategory/add', {
      name: `${TEST_PREFIX}cat-update-normal`
    });
    if (addResult.code === 0 || addResult.code === 200) {
      catId = addResult.data;
      results.testDataIds.categories.push(catId);
    } else {
      console.log('  创建测试数据失败');
      return;
    }
  } catch (error) {
    console.log('  创建测试数据异常:', error.message);
    return;
  }

  const xssPayloads = [
    { field: 'name', payload: '<img src=x onerror=alert(3)>', desc: 'img onerror' },
    { field: 'name', payload: '<script>alert("cat-update-xss")</script>', desc: 'script标签' }
  ];

  for (const test of xssPayloads) {
    try {
      const updateData = { id: catId };
      updateData[test.field] = test.payload;
      
      const result = await apiRequest('POST', '/admin/knowledge/filmCategory/update', updateData);
      
      if (result.code === 0 || result.code === 200) {
        // 查询验证
        const listResult = await apiRequest('GET', '/admin/knowledge/filmCategory/list');
        
        if (listResult.code === 0 || listResult.code === 200) {
          const list = listResult.data || [];
          const found = list.find(item => item.id === catId);
          
          if (found) {
            const actualValue = found[test.field];
            const escaped = isProperlyEscaped(test.payload, actualValue);
            
            recordTest(
              `分类编辑 - ${test.field}字段(${test.desc})`,
              escaped,
              `输入: ${test.payload} | 返回: ${actualValue}`
            );
          } else {
            recordTest(`分类编辑 - ${test.field}字段(${test.desc})`, false, '未找到分类');
          }
        } else {
          recordTest(`分类编辑 - ${test.field}字段(${test.desc})`, false, '查询列表失败');
        }
      } else {
        recordTest(`分类编辑 - ${test.field}字段(${test.desc})`, false, `更新失败: ${result.message}`);
      }
    } catch (error) {
      recordTest(`分类编辑 - ${test.field}字段(${test.desc})`, false, `请求异常: ${error.message}`);
    }
  }
}

// ========== 5. 回归测试 - 正常功能 ==========
async function testRegression() {
  console.log('\n=== 5. 回归测试 - 正常功能 ===');
  
  // 5.1 新增正常电影
  try {
    const filmData = {
      name: `${TEST_PREFIX}normal-film`,
      director: '正常导演',
      categoryId: 1,
      quality: '高清',
      year: 2024,
      description: '这是一部正常的测试电影，包含中文、English、数字123和特殊符号!@#$%^&*()'
    };
    
    const result = await apiRequest('POST', '/admin/knowledge/film/add', filmData);
    
    if (result.code === 0 || result.code === 200) {
      const filmId = result.data;
      results.testDataIds.films.push(filmId);
      
      // 验证详情
      const detailResult = await apiRequest('GET', `/admin/knowledge/film/info?id=${filmId}`);
      
      if (detailResult.code === 0 || detailResult.code === 200) {
        const detail = detailResult.data;
        const nameMatch = detail.name === filmData.name;
        const directorMatch = detail.director === filmData.director;
        const descMatch = detail.description === filmData.description;
        
        recordTest(
          '回归 - 新增正常电影',
          nameMatch && directorMatch && descMatch,
          nameMatch ? '数据一致' : `数据不一致: name=${detail.name}, director=${detail.director}`
        );
      } else {
        recordTest('回归 - 新增正常电影', false, '查询详情失败');
      }
    } else {
      recordTest('回归 - 新增正常电影', false, `新增失败: ${result.message}`);
    }
  } catch (error) {
    recordTest('回归 - 新增正常电影', false, `请求异常: ${error.message}`);
  }

  // 5.2 编辑正常电影
  try {
    // 创建一条用于编辑的电影
    const addResult = await apiRequest('POST', '/admin/knowledge/film/add', {
      name: `${TEST_PREFIX}edit-before`,
      director: '原始导演',
      categoryId: 1,
      quality: '标清',
      year: 2020
    });
    
    if (addResult.code === 0 || addResult.code === 200) {
      const filmId = addResult.data;
      results.testDataIds.films.push(filmId);
      
      // 执行编辑
      const updateData = {
        id: filmId,
        name: `${TEST_PREFIX}edit-after`,
        director: '更新后导演',
        quality: '蓝光',
        year: 2025
      };
      
      const updateResult = await apiRequest('POST', '/admin/knowledge/film/update', updateData);
      
      if (updateResult.code === 0 || updateResult.code === 200) {
        const detailResult = await apiRequest('GET', `/admin/knowledge/film/info?id=${filmId}`);
        
        if (detailResult.code === 0 || detailResult.code === 200) {
          const detail = detailResult.data;
          const allMatch = 
            detail.name === updateData.name &&
            detail.director === updateData.director &&
            detail.quality === updateData.quality &&
            detail.year === updateData.year;
          
          recordTest(
            '回归 - 编辑正常电影',
            allMatch,
            allMatch ? '所有字段更新正确' : `部分字段未正确更新`
          );
        } else {
          recordTest('回归 - 编辑正常电影', false, '查询详情失败');
        }
      } else {
        recordTest('回归 - 编辑正常电影', false, `更新失败: ${updateResult.message}`);
      }
    }
  } catch (error) {
    recordTest('回归 - 编辑正常电影', false, `请求异常: ${error.message}`);
  }

  // 5.3 新增正常分类
  try {
    const catData = { name: `${TEST_PREFIX}normal-category` };
    const result = await apiRequest('POST', '/admin/knowledge/filmCategory/add', catData);
    
    if (result.code === 0 || result.code === 200) {
      const catId = result.data;
      results.testDataIds.categories.push(catId);
      
      const listResult = await apiRequest('GET', '/admin/knowledge/filmCategory/list');
      if (listResult.code === 0 || listResult.code === 200) {
        const list = listResult.data || [];
        const found = list.find(item => item.id === catId);
        recordTest(
          '回归 - 新增正常分类',
          found && found.name === catData.name,
          found ? `名称: ${found.name}` : '未找到分类'
        );
      } else {
        recordTest('回归 - 新增正常分类', false, '查询列表失败');
      }
    } else {
      recordTest('回归 - 新增正常分类', false, `新增失败: ${result.message}`);
    }
  } catch (error) {
    recordTest('回归 - 新增正常分类', false, `请求异常: ${error.message}`);
  }

  // 5.4 电影列表分页
  try {
    const result = await apiRequest('GET', '/admin/knowledge/film/page?page=1&size=10');
    if (result.code === 0 || result.code === 200) {
      const data = result.data;
      const hasList = Array.isArray(data.list);
      const hasPagination = data.pagination && typeof data.pagination.total === 'number';
      recordTest(
        '回归 - 电影列表分页',
        hasList && hasPagination,
        hasList ? `列表长度: ${data.list.length}, 总数: ${data.pagination?.total}` : '列表格式错误'
      );
    } else {
      recordTest('回归 - 电影列表分页', false, `查询失败: ${result.message}`);
    }
  } catch (error) {
    recordTest('回归 - 电影列表分页', false, `请求异常: ${error.message}`);
  }
}

// ========== 6. 清理测试数据 ==========
async function cleanupTestData() {
  console.log('\n=== 6. 清理测试数据 ===');
  
  // 清理电影
  for (const filmId of results.testDataIds.films) {
    try {
      await apiRequest('POST', '/admin/knowledge/film/delete', { ids: [filmId] });
    } catch (error) {
      console.log(`  删除电影 ${filmId} 失败: ${error.message}`);
    }
  }
  console.log(`  已清理 ${results.testDataIds.films.length} 条电影数据`);
  
  // 清理分类
  for (const catId of results.testDataIds.categories) {
    try {
      await apiRequest('POST', '/admin/knowledge/filmCategory/delete', { ids: [catId] });
    } catch (error) {
      console.log(`  删除分类 ${catId} 失败: ${error.message}`);
    }
  }
  console.log(`  已清理 ${results.testDataIds.categories.length} 条分类数据`);
}

// ========== 主函数 ==========
async function main() {
  console.log('========================================');
  console.log('  XSS 修复效果复检 - 知识库电影模块');
  console.log('========================================');
  console.log(`测试环境: ${BASE_URL}`);
  console.log(`测试前缀: ${TEST_PREFIX}`);

  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n登录失败，终止测试');
    process.exit(1);
  }

  // 执行测试
  await testFilmAddXss();
  await testFilmUpdateXss();
  await testCategoryAddXss();
  await testCategoryUpdateXss();
  await testRegression();

  // 输出结果汇总
  console.log('\n========================================');
  console.log('  测试结果汇总');
  console.log('========================================');
  console.log(`总用例数: ${results.passed.length + results.failed.length}`);
  console.log(`通过: ${results.passed.length}`);
  console.log(`失败: ${results.failed.length}`);
  console.log(`通过率: ${((results.passed.length / (results.passed.length + results.failed.length)) * 100).toFixed(2)}%`);

  if (results.failed.length > 0) {
    console.log('\n失败用例详情:');
    results.failed.forEach(item => {
      console.log(`  - ${item.name}: ${item.detail}`);
    });
  }

  // 清理测试数据
  await cleanupTestData();

  console.log('\n最终结论: ' + (results.failed.length === 0 ? 'PASS - XSS修复有效，回归测试通过' : 'FAIL - 存在未修复的XSS漏洞或回归问题'));

  // 输出 JSON 格式结果供后续使用
  console.log('\n---JSON_RESULT---');
  console.log(JSON.stringify({
    total: results.passed.length + results.failed.length,
    passed: results.passed.length,
    failed: results.failed.length,
    passRate: ((results.passed.length / (results.passed.length + results.failed.length)) * 100).toFixed(2) + '%',
    overall: results.failed.length === 0 ? 'PASS' : 'FAIL',
    failedCases: results.failed,
    passedCases: results.passed
  }, null, 2));
}

main().catch(error => {
  console.error('测试执行异常:', error);
  process.exit(1);
});
