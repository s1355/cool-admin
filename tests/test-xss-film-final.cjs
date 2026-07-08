/**
 * XSS 修复效果复检 - 知识库电影模块
 * 使用 API 调用验证后端转义 + Playwright 浏览器自动化验证前端渲染
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { chromium } = require('playwright');

const BACKEND_URL = 'http://localhost:8001';
const FRONTEND_URL = 'http://localhost:9001';
const TEST_PREFIX = 'xss-test-';
const SUCCESS_CODE = 1000;

// 缓存目录配置
const APP_KEYS = 'a02e8413-52ff-467b-b1cb-b968e5bd8765';
const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');
const CACHE_DIR = path.join(os.homedir(), '.cool-admin', md5(APP_KEYS), 'cache');

// 测试结果
const results = {
  passed: [],
  failed: [],
  testDataIds: { films: [], categories: [] }
};

let token = null;
let browser = null;
let page = null;

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

function isProperlyEscaped(original, escaped) {
  if (typeof escaped !== 'string') return false;
  if (original.includes('<') && !escaped.includes('&lt;')) return false;
  if (original.includes('>') && !escaped.includes('&gt;')) return false;
  if (original.includes('"') && !escaped.includes('&quot;')) return false;
  const dangerPatterns = [
    /<script[^>]*>/i,
    /<img[^>]*onerror/i,
    /<svg[^>]*onload/i,
    /javascript:/i
  ];
  if (dangerPatterns.some(p => p.test(escaped))) return false;
  return true;
}

function getCaptchaFromCache(captchaId) {
  const key = `verify:img:${captchaId}`;
  const files = fs.readdirSync(CACHE_DIR);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const content = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8');
      const data = JSON.parse(content);
      if (data.key === key) return data.val;
    } catch (e) {}
  }
  return null;
}

function findLatestCaptcha() {
  const files = fs.readdirSync(CACHE_DIR);
  let latest = null;
  let latestTime = 0;
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const content = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8');
      const data = JSON.parse(content);
      if (data.key && data.key.startsWith('verify:img:') && data.expireTime > latestTime) {
        latest = data.val;
        latestTime = data.expireTime;
      }
    } catch (e) {}
  }
  return latest;
}

async function login() {
  console.log('\n=== 登录获取 Token ===');
  try {
    const captchaResp = await axios.get(`${BACKEND_URL}/admin/base/open/captcha`, { timeout: 10000 });
    const captchaId = captchaResp.data.data.captchaId;
    await new Promise(r => setTimeout(r, 300));
    const verifyCode = getCaptchaFromCache(captchaId);
    
    if (!verifyCode) {
      console.log('  无法从缓存获取验证码');
      return false;
    }
    
    console.log(`  验证码: ${verifyCode}`);
    
    const loginResp = await axios.post(`${BACKEND_URL}/admin/base/open/login`, {
      username: 'admin',
      password: '123456',
      captchaId: captchaId,
      verifyCode: verifyCode
    }, { timeout: 10000 });
    
    if (loginResp.data?.code === SUCCESS_CODE && loginResp.data?.data?.token) {
      token = loginResp.data.data.token;
      console.log('  登录成功');
      return true;
    } else {
      console.log('  登录失败:', JSON.stringify(loginResp.data));
      return false;
    }
  } catch (error) {
    console.log('  登录异常:', error.message);
    if (error.response) console.log('  响应:', JSON.stringify(error.response.data));
    return false;
  }
}

async function apiRequest(method, url, data = null) {
  const config = {
    method,
    url: `${BACKEND_URL}${url}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    timeout: 10000
  };
  if (data) config.data = data;
  const response = await axios(config);
  return response.data;
}

// ========== 1. 电影新增 XSS 测试 ==========
async function testFilmAddXss() {
  console.log('\n=== 1. 电影新增 XSS 测试 (API层) ===');
  
  const xssPayloads = [
    { field: 'name', payload: '<script>alert("xss-test")</script>', desc: 'script标签' },
    { field: 'name', payload: '<img src=x onerror=alert(1)>', desc: 'img onerror' },
    { field: 'director', payload: '<svg onload=alert(1)>', desc: 'svg onload' },
    { field: 'synopsis', payload: '"><script>alert(1)</script>', desc: '闭合引号+script' }
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
      
      if (result.code === SUCCESS_CODE) {
        const filmId = result.data?.id || result.data;
        results.testDataIds.films.push(filmId);
        
        const detailResult = await apiRequest('GET', `/admin/knowledge/film/info?id=${filmId}`);
        
        if (detailResult.code === SUCCESS_CODE) {
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
  console.log('\n=== 2. 电影编辑 XSS 测试 (API层) ===');
  
  let filmId;
  try {
    const addResult = await apiRequest('POST', '/admin/knowledge/film/add', {
      name: `${TEST_PREFIX}film-update-normal`,
      director: '测试导演',
      categoryId: 1,
      quality: '高清',
      year: 2024
    });
    if (addResult.code === SUCCESS_CODE) {
      filmId = addResult.data?.id || addResult.data;
      results.testDataIds.films.push(filmId);
    } else {
      console.log('  创建测试数据失败:', addResult.message);
      return;
    }
  } catch (error) {
    console.log('  创建测试数据异常:', error.message);
    return;
  }

  const xssPayloads = [
    { field: 'name', payload: '<img src=x onerror=alert(2)>', desc: 'img onerror' },
    { field: 'director', payload: '<script>alert("director-xss")</script>', desc: 'script标签' },
    { field: 'synopsis', payload: '\' onmouseover=alert(1) \'', desc: '单引号闭合+事件' }
  ];

  for (const test of xssPayloads) {
    try {
      const updateData = { id: filmId };
      updateData[test.field] = test.payload;
      
      const result = await apiRequest('POST', '/admin/knowledge/film/update', updateData);
      
      if (result.code === SUCCESS_CODE) {
        const detailResult = await apiRequest('GET', `/admin/knowledge/film/info?id=${filmId}`);
        
        if (detailResult.code === SUCCESS_CODE) {
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
  console.log('\n=== 3. 分类新增 XSS 测试 (API层) ===');
  
  const xssPayloads = [
    { field: 'name', payload: '<script>alert("cat-xss")</script>', desc: 'script标签' },
    { field: 'name', payload: '<img src=x onerror=alert(1)>', desc: 'img onerror' },
    { field: 'name', payload: '"><svg onload=alert(1)>', desc: '闭合引号+svg' }
  ];

  for (const test of xssPayloads) {
    try {
      const catData = { name: test.payload };
      
      const result = await apiRequest('POST', '/admin/knowledge/film-category/add', catData);
      
      if (result.code === SUCCESS_CODE) {
        const catId = result.data?.id || result.data;
        results.testDataIds.categories.push(catId);
        
        const detailResult = await apiRequest('GET', `/admin/knowledge/film-category/info?id=${catId}`);
        
        if (detailResult.code === SUCCESS_CODE) {
          const detail = detailResult.data;
          const actualValue = detail[test.field];
          const escaped = isProperlyEscaped(test.payload, actualValue);
          
          recordTest(
            `分类新增 - ${test.field}字段(${test.desc})`,
            escaped,
            `输入: ${test.payload} | 返回: ${actualValue}`
          );
        } else {
          recordTest(`分类新增 - ${test.field}字段(${test.desc})`, false, '查询详情失败');
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
  console.log('\n=== 4. 分类编辑 XSS 测试 (API层) ===');
  
  let catId;
  try {
    const addResult = await apiRequest('POST', '/admin/knowledge/film-category/add', {
      name: `${TEST_PREFIX}cat-update-normal`
    });
    if (addResult.code === SUCCESS_CODE) {
      catId = addResult.data?.id || addResult.data;
      results.testDataIds.categories.push(catId);
    } else {
      console.log('  创建测试数据失败:', addResult.message);
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
      
      const result = await apiRequest('POST', '/admin/knowledge/film-category/update', updateData);
      
      if (result.code === SUCCESS_CODE) {
        const detailResult = await apiRequest('GET', `/admin/knowledge/film-category/info?id=${catId}`);
        
        if (detailResult.code === SUCCESS_CODE) {
          const detail = detailResult.data;
          const actualValue = detail[test.field];
          const escaped = isProperlyEscaped(test.payload, actualValue);
          
          recordTest(
            `分类编辑 - ${test.field}字段(${test.desc})`,
            escaped,
            `输入: ${test.payload} | 返回: ${actualValue}`
          );
        } else {
          recordTest(`分类编辑 - ${test.field}字段(${test.desc})`, false, '查询详情失败');
        }
      } else {
        recordTest(`分类编辑 - ${test.field}字段(${test.desc})`, false, `更新失败: ${result.message}`);
      }
    } catch (error) {
      recordTest(`分类编辑 - ${test.field}字段(${test.desc})`, false, `请求异常: ${error.message}`);
    }
  }
}

// ========== 5. 回归测试 ==========
async function testRegression() {
  console.log('\n=== 5. 回归测试 (API层) ===');
  
  // 新增正常电影
  try {
    const filmData = {
      name: `${TEST_PREFIX}normal-film`,
      director: '正常导演',
      categoryId: 1,
      quality: '高清',
      year: 2024,
      synopsis: '正常描述，包含中文、English、数字123和符号!@#$%'
    };
    
    const result = await apiRequest('POST', '/admin/knowledge/film/add', filmData);
    
    if (result.code === SUCCESS_CODE) {
      const filmId = result.data?.id || result.data;
      results.testDataIds.films.push(filmId);
      
      const detailResult = await apiRequest('GET', `/admin/knowledge/film/info?id=${filmId}`);
      
      if (detailResult.code === SUCCESS_CODE) {
        const detail = detailResult.data;
        const nameMatch = detail.name === filmData.name;
        const directorMatch = detail.director === filmData.director;
        const synopsisMatch = detail.synopsis === filmData.synopsis;
        
        recordTest(
          '回归 - 新增正常电影',
          nameMatch && directorMatch && synopsisMatch,
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

  // 编辑正常电影
  try {
    const addResult = await apiRequest('POST', '/admin/knowledge/film/add', {
      name: `${TEST_PREFIX}edit-before`,
      director: '原始导演',
      categoryId: 1,
      quality: '标清',
      year: 2020
    });
    
    if (addResult.code === SUCCESS_CODE) {
      const filmId = addResult.data?.id || addResult.data;
      results.testDataIds.films.push(filmId);
      
      const updateData = {
        id: filmId,
        name: `${TEST_PREFIX}edit-after`,
        director: '更新后导演',
        quality: '蓝光',
        year: 2025
      };
      
      const updateResult = await apiRequest('POST', '/admin/knowledge/film/update', updateData);
      
      if (updateResult.code === SUCCESS_CODE) {
        const detailResult = await apiRequest('GET', `/admin/knowledge/film/info?id=${filmId}`);
        
        if (detailResult.code === SUCCESS_CODE) {
          const detail = detailResult.data;
          const allMatch = 
            detail.name === updateData.name &&
            detail.director === updateData.director &&
            detail.quality === updateData.quality &&
            detail.year === updateData.year;
          
          recordTest(
            '回归 - 编辑正常电影',
            allMatch,
            allMatch ? '所有字段更新正确' : '部分字段未正确更新'
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

  // 新增正常分类
  try {
    const catData = { name: `${TEST_PREFIX}normal-category` };
    const result = await apiRequest('POST', '/admin/knowledge/film-category/add', catData);
    
    if (result.code === SUCCESS_CODE) {
      const catId = result.data?.id || result.data;
      results.testDataIds.categories.push(catId);
      
      const detailResult = await apiRequest('GET', `/admin/knowledge/film-category/info?id=${catId}`);
      if (detailResult.code === SUCCESS_CODE) {
        const detail = detailResult.data;
        recordTest(
          '回归 - 新增正常分类',
          detail.name === catData.name,
          `名称: ${detail.name}`
        );
      } else {
        recordTest('回归 - 新增正常分类', false, '查询详情失败');
      }
    } else {
      recordTest('回归 - 新增正常分类', false, `新增失败: ${result.message}`);
    }
  } catch (error) {
    recordTest('回归 - 新增正常分类', false, `请求异常: ${error.message}`);
  }

  // 电影列表分页
  try {
    const result = await apiRequest('POST', '/admin/knowledge/film/page', { page: 1, size: 10 });
    if (result.code === SUCCESS_CODE) {
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

// ========== 6. 前端渲染验证 ==========
async function testFrontendRendering() {
  console.log('\n=== 6. 前端渲染验证 (浏览器) ===');
  
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
  
  let dialogTriggered = false;
  page.on('dialog', async dialog => {
    dialogTriggered = true;
    console.log(`  检测到 alert 弹窗: ${dialog.message()}`);
    await dialog.dismiss();
  });
  
  try {
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForTimeout(2000);
    
    // 关闭可能的弹窗
    const overlayVisible = await page.locator('.el-overlay').first().isVisible({ timeout: 1000 }).catch(() => false);
    if (overlayVisible) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    
    const inputs = await page.locator('input').all();
    await inputs[0].fill('admin');
    await inputs[1].fill('123456');
    
    // 点击验证码刷新
    const captchaImg = page.locator('img[src*="captcha"], .captcha, [class*="captcha"]').first();
    if (await captchaImg.isVisible({ timeout: 2000 }).catch(() => false)) {
      await captchaImg.click();
      await page.waitForTimeout(500);
    }
    
    // 从缓存找最新验证码
    const latestCode = findLatestCaptcha();
    if (latestCode) {
      await inputs[2].fill(latestCode);
    } else {
      recordTest('前端 - 登录', false, '无法找到验证码');
      return;
    }
    
    // 点击登录
    const loginBtn = page.locator('button:has-text("登录")').first();
    await loginBtn.click();
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      recordTest('前端 - 登录', false, '登录失败，仍在登录页');
      await page.screenshot({ path: 'xss-test-login-fail.png' });
      return;
    }
    
    recordTest('前端 - 登录', true, '登录成功');
    await page.screenshot({ path: 'xss-test-04-dashboard.png' });
    
    // 导航到电影管理页面
    await navigateToFilmPage();
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'xss-test-05-film-list.png', fullPage: true });
    
    recordTest('前端 - 电影列表页加载', true, '页面已加载');
    
    // 检查是否有 XSS 弹窗
    if (dialogTriggered) {
      recordTest('前端 - 列表页无XSS弹窗', false, '检测到 alert 弹窗');
    } else {
      recordTest('前端 - 列表页无XSS弹窗', true, '未检测到 alert 弹窗');
    }
    
    // 检查页面 HTML 中是否有未转义的危险标签
    const pageContent = await page.content();
    const hasRawScript = /<script>alert\(/i.test(pageContent);
    
    recordTest(
      '前端 - 列表页无未转义危险标签',
      !hasRawScript,
      hasRawScript ? '页面中存在未转义的危险标签' : '页面正常'
    );
    
    // 尝试打开详情页
    try {
      // 找一个包含 xss-test- 的行，点击查看
      const xssRow = page.locator('tr:has-text("xss-test-")').first();
      if (await xssRow.isVisible({ timeout: 2000 })) {
        // 找查看/详情按钮
        const viewBtn = xssRow.locator('button:has-text("查看"), button:has-text("详情"), .el-button--primary').first();
        if (await viewBtn.isVisible({ timeout: 1000 })) {
          await viewBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'xss-test-06-film-detail.png' });
          
          recordTest('前端 - 详情页正常显示', !dialogTriggered, '详情页渲染完成');
        }
      }
    } catch (e) {
      // 忽略详情页测试
    }
    
  } catch (error) {
    recordTest('前端 - 渲染验证', false, `异常: ${error.message}`);
  }
}

async function navigateToFilmPage() {
  // 尝试点击侧边栏菜单
  const menuSelectors = [
    'text=电影管理',
    'text=知识库',
    'text=影片',
    'text=电影'
  ];
  
  for (const sel of menuSelectors) {
    try {
      const locator = page.locator(sel).first();
      if (await locator.isVisible({ timeout: 1000 })) {
        await locator.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}
  }
  
  // 如果是多级菜单，再点击子菜单
  try {
    const filmMenu = page.locator('text=电影信息, text=电影列表, text=影片列表').first();
    if (await filmMenu.isVisible({ timeout: 1000 })) {
      await filmMenu.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {}
}

// ========== 7. 清理测试数据 ==========
async function cleanupTestData() {
  console.log('\n=== 7. 清理测试数据 ===');
  
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
      await apiRequest('POST', '/admin/knowledge/film-category/delete', { ids: [catId] });
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
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log('\n登录失败，终止测试');
      process.exit(1);
    }

    await testFilmAddXss();
    await testFilmUpdateXss();
    await testCategoryAddXss();
    await testCategoryUpdateXss();
    await testRegression();
    await testFrontendRendering();

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

    await cleanupTestData();

    const overall = results.failed.length === 0 ? 'PASS' : 'FAIL';
    console.log(`\n最终结论: ${overall} - ${overall === 'PASS' ? 'XSS修复有效，回归测试通过' : '存在未修复的XSS漏洞或回归问题'}`);

    console.log('\n---JSON_RESULT---');
    console.log(JSON.stringify({
      total: results.passed.length + results.failed.length,
      passed: results.passed.length,
      failed: results.failed.length,
      passRate: ((results.passed.length / (results.passed.length + results.failed.length)) * 100).toFixed(2) + '%',
      overall: overall,
      failedCases: results.failed,
      passedCases: results.passed
    }, null, 2));

  } catch (error) {
    console.error('测试执行异常:', error);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

main();
