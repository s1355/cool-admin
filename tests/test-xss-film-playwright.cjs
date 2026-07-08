/**
 * XSS 修复效果复检 - 知识库电影模块
 * 使用 Playwright 进行浏览器自动化 + API 联合测试
 */

const { chromium } = require('playwright');
const axios = require('axios');

const FRONTEND_URL = 'http://localhost:9001';
const BACKEND_URL = 'http://localhost:8001';
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

let browser, page, token;

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

// 工具函数：检查是否被正确转义
function isProperlyEscaped(original, escaped) {
  if (typeof escaped !== 'string') return false;
  // 原始字符串中的特殊字符应该被转义
  if (original.includes('<') && !escaped.includes('&lt;')) return false;
  if (original.includes('>') && !escaped.includes('&gt;')) return false;
  if (original.includes('"') && !escaped.includes('&quot;')) return false;
  // 不应该包含未转义的危险标签
  const dangerPatterns = [
    /<script[^>]*>/i,
    /<img[^>]*onerror/i,
    /<svg[^>]*onload/i,
    /javascript:/i
  ];
  if (dangerPatterns.some(p => p.test(escaped))) return false;
  return true;
}

// API 请求封装
async function apiRequest(method, url, data = null) {
  const config = {
    method,
    url: `${BACKEND_URL}${url}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    timeout: 10000
  };
  if (data) config.data = data;
  const response = await axios(config);
  return response.data;
}

// ========== 1. 登录并获取 token ==========
async function loginAndGetToken() {
  console.log('\n=== 1. 登录并获取 Token ===');
  
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
  
  // 监听 dialog 事件
  page.on('dialog', async dialog => {
    console.log(`  检测到对话框: ${dialog.message()}`);
    await dialog.dismiss();
  });
  
  await page.goto(`${FRONTEND_URL}/login`);
  await page.waitForTimeout(3000);
  
  // 检查是否有弹窗，先关闭
  const modalCloseBtn = page.locator('.el-message-box__close, .el-dialog__close, [aria-label="Close"]').first();
  if (await modalCloseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('  检测到弹窗，尝试关闭');
    await modalCloseBtn.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  
  // 截图查看登录页
  await page.screenshot({ path: 'xss-test-01-login-page.png' });
  
  // 查找用户名和密码输入框
  const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="账号"], input[placeholder*="用户名"], input[placeholder*="admin"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="密码"]').first();
  
  await usernameInput.fill('admin');
  await passwordInput.fill('123456');
  
  // 截图查看填写后的页面
  await page.screenshot({ path: 'xss-test-02-login-filled.png' });
  
  // 点击登录按钮
  const loginBtn = page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first();
  
  // 检查是否有弹窗遮挡，如果有，先按 Enter 键关闭或确认
  const overlayVisible = await page.locator('.el-overlay').first().isVisible({ timeout: 1000 }).catch(() => false);
  if (overlayVisible) {
    console.log('  检测到遮罩层，按 Enter 键');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }
  
  await loginBtn.click();
  
  await page.waitForTimeout(3000);
  
  // 截图查看登录结果
  await page.screenshot({ path: 'xss-test-03-login-result.png' });
  
  // 检查是否登录成功
  const currentUrl = page.url();
  console.log(`  当前URL: ${currentUrl}`);
  
  if (currentUrl.includes('/login')) {
    console.log('  可能登录失败，仍在登录页');
    // 检查错误信息
    const errorText = await page.locator('.el-message, .el-notification, .error, [class*="error"]').first().innerText().catch(() => '');
    console.log(`  错误信息: ${errorText}`);
    return false;
  }
  
  // 从 localStorage 获取 token
  const localStorageData = await page.evaluate(() => JSON.stringify(localStorage));
  console.log(`  localStorage(前200字符): ${localStorageData.substring(0, 200)}...`);
  
  token = await page.evaluate(() => {
    const keys = ['token', 'accessToken', 'adminToken', 'Authorization'];
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) return val;
    }
    for (const key of Object.keys(localStorage)) {
      try {
        const obj = JSON.parse(localStorage.getItem(key));
        if (obj.token) return obj.token;
        if (obj.accessToken) return obj.accessToken;
      } catch (e) {}
    }
    return null;
  });
  
  if (token) {
    console.log('  登录成功，获取到 token');
    return true;
  }
  
  console.log('  未找到 token');
  return false;
}

// ========== 2. 电影新增 XSS 测试 (API) ==========
async function testFilmAddXss() {
  console.log('\n=== 2. 电影新增 XSS 测试 (API层) ===');
  
  const xssPayloads = [
    { field: 'name', payload: '<script>alert("xss-test")</script>', desc: 'script标签' },
    { field: 'name', payload: '<img src=x onerror=alert(1)>', desc: 'img onerror' },
    { field: 'director', payload: '<svg onload=alert(1)>', desc: 'svg onload' }
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

// ========== 3. 电影编辑 XSS 测试 (API) ==========
async function testFilmUpdateXss() {
  console.log('\n=== 3. 电影编辑 XSS 测试 (API层) ===');
  
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
    { field: 'director', payload: '<script>alert("director-xss")</script>', desc: 'script标签' }
  ];

  for (const test of xssPayloads) {
    try {
      const updateData = { id: filmId };
      updateData[test.field] = test.payload;
      
      const result = await apiRequest('POST', '/admin/knowledge/film/update', updateData);
      
      if (result.code === 0 || result.code === 200) {
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

// ========== 4. 分类新增 XSS 测试 (API) ==========
async function testCategoryAddXss() {
  console.log('\n=== 4. 分类新增 XSS 测试 (API层) ===');
  
  const xssPayloads = [
    { field: 'name', payload: '<script>alert("cat-xss")</script>', desc: 'script标签' },
    { field: 'name', payload: '<img src=x onerror=alert(1)>', desc: 'img onerror' }
  ];

  for (const test of xssPayloads) {
    try {
      const catData = { name: test.payload };
      
      const result = await apiRequest('POST', '/admin/knowledge/filmCategory/add', catData);
      
      if (result.code === 0 || result.code === 200) {
        const catId = result.data;
        results.testDataIds.categories.push(catId);
        
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

// ========== 5. 分类编辑 XSS 测试 (API) ==========
async function testCategoryUpdateXss() {
  console.log('\n=== 5. 分类编辑 XSS 测试 (API层) ===');
  
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

// ========== 6. 回归测试 (API) ==========
async function testRegression() {
  console.log('\n=== 6. 回归测试 (API层) ===');
  
  // 新增正常电影
  try {
    const filmData = {
      name: `${TEST_PREFIX}normal-film`,
      director: '正常导演',
      categoryId: 1,
      quality: '高清',
      year: 2024,
      description: '正常描述，包含中文、English、数字123和符号!@#$%'
    };
    
    const result = await apiRequest('POST', '/admin/knowledge/film/add', filmData);
    
    if (result.code === 0 || result.code === 200) {
      const filmId = result.data;
      results.testDataIds.films.push(filmId);
      
      const detailResult = await apiRequest('GET', `/admin/knowledge/film/info?id=${filmId}`);
      
      if (detailResult.code === 0 || detailResult.code === 200) {
        const detail = detailResult.data;
        const nameMatch = detail.name === filmData.name;
        const directorMatch = detail.director === filmData.director;
        
        recordTest(
          '回归 - 新增正常电影',
          nameMatch && directorMatch,
          nameMatch ? '数据一致' : `数据不一致`
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

  // 电影列表分页
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

// ========== 7. 前端渲染验证 (浏览器) ==========
async function testFrontendRendering() {
  console.log('\n=== 7. 前端渲染验证 (浏览器) ===');
  
  // 导航到电影列表页
  // 先尝试找到电影管理菜单
  try {
    // 等待页面加载完成
    await page.waitForTimeout(2000);
    
    // 尝试点击电影管理相关菜单
    const menuItem = page.locator('text=电影, text=影片, text=knowledge, text=知识库').first();
    if (await menuItem.isVisible({ timeout: 3000 })) {
      await menuItem.click();
      await page.waitForTimeout(1000);
    }
    
    // 截图查看当前页面
    await page.screenshot({ path: 'xss-test-04-film-list.png', fullPage: true });
    
    recordTest('前端 - 电影列表页加载', true, '页面已加载');
    
    // 检查页面中是否有 XSS payload 被执行的迹象
    // 1. 检查是否有 alert 弹出（通过监听 dialog 事件）
    let dialogTriggered = false;
    page.on('dialog', dialog => {
      dialogTriggered = true;
      dialog.dismiss();
    });
    
    // 刷新页面触发渲染
    await page.reload();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'xss-test-05-film-list-refresh.png', fullPage: true });
    
    if (dialogTriggered) {
      recordTest('前端 - 列表页无XSS弹窗', false, '检测到 alert 弹窗，XSS攻击生效');
    } else {
      recordTest('前端 - 列表页无XSS弹窗', true, '未检测到 alert 弹窗');
    }
    
    // 检查页面 HTML 中是否有未转义的 <script> 标签
    const pageContent = await page.content();
    const hasRawScript = /<script>alert\(/i.test(pageContent);
    
    recordTest(
      '前端 - 列表页无未转义script标签',
      !hasRawScript,
      hasRawScript ? '页面中存在未转义的 script 标签' : '页面中未检测到未转义的危险标签'
    );
    
  } catch (error) {
    recordTest('前端 - 电影列表渲染验证', false, `异常: ${error.message}`);
  }
}

// ========== 8. 清理测试数据 ==========
async function cleanupTestData() {
  console.log('\n=== 8. 清理测试数据 ===');
  
  for (const filmId of results.testDataIds.films) {
    try {
      await apiRequest('POST', '/admin/knowledge/film/delete', { ids: [filmId] });
    } catch (error) {
      console.log(`  删除电影 ${filmId} 失败: ${error.message}`);
    }
  }
  console.log(`  已清理 ${results.testDataIds.films.length} 条电影数据`);
  
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
  console.log(`前端: ${FRONTEND_URL}`);
  console.log(`后端: ${BACKEND_URL}`);
  console.log(`测试前缀: ${TEST_PREFIX}`);

  try {
    // 1. 登录
    const loginSuccess = await loginAndGetToken();
    if (!loginSuccess) {
      console.log('\n登录失败，终止测试');
      if (browser) await browser.close();
      process.exit(1);
    }

    // 2-6. API 层测试
    await testFilmAddXss();
    await testFilmUpdateXss();
    await testCategoryAddXss();
    await testCategoryUpdateXss();
    await testRegression();

    // 7. 前端渲染验证
    await testFrontendRendering();

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

    // JSON 结果
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

  } catch (error) {
    console.error('测试执行异常:', error);
  } finally {
    if (browser) await browser.close();
  }
}

main();
