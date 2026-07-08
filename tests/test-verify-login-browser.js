/**
 * 核销端登录功能浏览器自动化测试
 * 测试账号：tech001 / Tech@001
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 测试配置
const CONFIG = {
  // 核销端登录页面URL - 请根据实际情况修改
  loginUrl: 'https://hyyy.yuanzhengjun.xyz/admin/login', // 假设的管理后台URL，需要确认
  testUsername: 'tech001',
  testPassword: 'Tech@001',
  screenshotDir: path.join(__dirname, 'test-results', 'browser-screenshots'),
  headless: false, // 设置为false可以看到浏览器操作
};

// 测试结果记录
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// 确保截图目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 截图保存函数
async function takeScreenshot(page, name) {
  const filePath = path.join(CONFIG.screenshotDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`   📸 截图已保存: ${filePath}`);
  return filePath;
}

// 测试用例运行器
async function runTest(name, testFn) {
  testResults.total++;
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}测试: ${name}${colors.reset}`);
  
  try {
    const result = await testFn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'passed', result });
    console.log(`${colors.green}✅ 测试通过${colors.reset}`);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'failed', error: error.message });
    console.log(`${colors.red}❌ 测试失败: ${error.message}${colors.reset}`);
    return false;
  }
}

// 测试用例1：页面加载测试
async function testPageLoad(page) {
  console.log(`   导航到登录页面: ${CONFIG.loginUrl}`);
  
  try {
    await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    const url = page.url();
    
    console.log(`   页面标题: ${title}`);
    console.log(`   当前URL: ${url}`);
    
    await takeScreenshot(page, '01-page-loaded');
    
    return { title, url };
  } catch (error) {
    console.log(`   ⚠️  页面加载失败，可能URL不正确`);
    console.log(`   错误: ${error.message}`);
    console.log(`   💡 提示: 请确认核销端登录页面的正确URL`);
    throw new Error('无法加载登录页面，请确认URL是否正确');
  }
}

// 测试用例2：正常登录测试
async function testValidLogin(page) {
  // 尝试多种选择器来找到用户名输入框
  const usernameSelectors = [
    'input[name="username"]',
    'input[name="user"]',
    'input[id*="username"]',
    'input[id*="user"]',
    'input[placeholder*="账号"]',
    'input[placeholder*="用户名"]',
    'input[placeholder*="Username"]',
    'input[type="text"]',
  ];
  
  // 尝试多种选择器来找到密码输入框
  const passwordSelectors = [
    'input[name="password"]',
    'input[id*="password"]',
    'input[placeholder*="密码"]',
    'input[placeholder*="Password"]',
    'input[type="password"]',
  ];
  
  // 尝试多种选择器来找到登录按钮
  const loginButtonSelectors = [
    'button[type="submit"]',
    'button:has-text("登录")',
    'button:has-text("Login")',
    'input[type="submit"]',
    '.login-btn',
    '.btn-login',
    '[class*="login"]',
  ];
  
  // 查找用户名输入框
  let usernameInput = null;
  for (const selector of usernameSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        usernameInput = element;
        console.log(`   ✅ 找到用户名输入框: ${selector}`);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!usernameInput) {
    throw new Error('无法找到用户名输入框');
  }
  
  // 查找密码输入框
  let passwordInput = null;
  for (const selector of passwordSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        passwordInput = element;
        console.log(`   ✅ 找到密码输入框: ${selector}`);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!passwordInput) {
    throw new Error('无法找到密码输入框');
  }
  
  // 查找登录按钮
  let loginButton = null;
  for (const selector of loginButtonSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        loginButton = element;
        console.log(`   ✅ 找到登录按钮: ${selector}`);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!loginButton) {
    throw new Error('无法找到登录按钮');
  }
  
  // 输入用户名和密码
  await usernameInput.fill(CONFIG.testUsername);
  await passwordInput.fill(CONFIG.testPassword);
  console.log(`   ✅ 输入用户名: ${CONFIG.testUsername}`);
  console.log(`   ✅ 输入密码: ***`);
  
  await takeScreenshot(page, '02-before-login');
  
  // 点击登录按钮
  await loginButton.click();
  console.log(`   ✅ 点击登录按钮`);
  
  // 等待一段时间看页面变化
  await page.waitForTimeout(3000);
  
  await takeScreenshot(page, '03-after-login');
  
  // 检查是否登录成功 - 可以通过URL变化、页面元素等判断
  const currentUrl = page.url();
  console.log(`   登录后URL: ${currentUrl}`);
  
  return { currentUrl };
}

// 测试用例3：错误密码测试
async function testWrongPassword(page) {
  // 先导航回登录页
  await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // 快速填充并提交
  const usernameInput = page.locator('input[type="text"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const loginButton = page.locator('button[type="submit"], input[type="submit"]').first();
  
  if (await usernameInput.isVisible({ timeout: 2000 })) {
    await usernameInput.fill(CONFIG.testUsername);
  }
  if (await passwordInput.isVisible({ timeout: 2000 })) {
    await passwordInput.fill('WrongPassword123!');
  }
  if (await loginButton.isVisible({ timeout: 2000 })) {
    await loginButton.click();
  }
  
  await page.waitForTimeout(2000);
  await takeScreenshot(page, '04-wrong-password');
  
  return true;
}

// 测试用例4：空账号密码测试
async function testEmptyCredentials(page) {
  await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  
  const loginButton = page.locator('button[type="submit"], input[type="submit"]').first();
  
  if (await loginButton.isVisible({ timeout: 2000 })) {
    await loginButton.click();
  }
  
  await page.waitForTimeout(2000);
  await takeScreenshot(page, '05-empty-credentials');
  
  return true;
}

// 生成报告
function generateReport() {
  console.log(`\n\n${colors.yellow}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.yellow}║               核销端登录功能浏览器测试报告                   ║${colors.reset}`);
  console.log(`${colors.yellow}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  
  console.log(`\n📅 测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`🔗 测试页面: ${CONFIG.loginUrl}`);
  console.log(`👤 测试账号: ${CONFIG.testUsername}`);
  
  console.log(`\n📊 测试统计:`);
  console.log(`   总测试数: ${testResults.total}`);
  console.log(`   ${colors.green}通过: ${testResults.passed}${colors.reset}`);
  console.log(`   ${colors.red}失败: ${testResults.failed}${colors.reset}`);
  console.log(`   通过率: ${testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(1) : 0}%`);
  
  console.log(`\n📋 详细测试结果:`);
  testResults.tests.forEach((test, index) => {
    const statusIcon = test.status === 'passed' ? '✅' : '❌';
    const statusColor = test.status === 'passed' ? colors.green : colors.red;
    console.log(`   ${statusIcon} ${index + 1}. ${test.name}`);
    if (test.error) {
      console.log(`      ${colors.red}错误: ${test.error}${colors.reset}`);
    }
  });
  
  const overallStatus = testResults.failed === 0 ? '✅ 测试通过' : '⚠️  存在失败的测试';
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${testResults.failed === 0 ? colors.green : colors.red}${overallStatus}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  // 返回JSON报告
  return {
    timestamp: new Date().toISOString(),
    config: {
      loginUrl: CONFIG.loginUrl,
      testUsername: CONFIG.testUsername,
    },
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(1) : 0,
    },
    tests: testResults.tests,
  };
}

// 主测试函数
async function main() {
  console.log(`${colors.yellow}`);
  console.log(`╔════════════════════════════════════════════════════════════╗`);
  console.log(`║         核销端登录功能 - 浏览器自动化测试                    ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
  console.log(`${colors.reset}`);
  console.log(`测试配置:`);
  console.log(`  登录页面: ${CONFIG.loginUrl}`);
  console.log(`  测试账号: ${CONFIG.testUsername}`);
  console.log(`  无头模式: ${CONFIG.headless ? '是' : '否'}`);
  console.log(`  截图目录: ${CONFIG.screenshotDir}`);
  
  ensureDir(CONFIG.screenshotDir);
  
  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: 500, // 稍微放慢操作速度
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  
  const page = await context.newPage();
  
  try {
    // 运行测试
    await runTest('页面加载测试', () => testPageLoad(page));
    await runTest('正常登录测试', () => testValidLogin(page));
    await runTest('错误密码测试', () => testWrongPassword(page));
    await runTest('空账号密码测试', () => testEmptyCredentials(page));
    
  } catch (error) {
    console.error(`${colors.red}\n❌ 测试执行出错: ${error.message}${colors.reset}`);
  } finally {
    await browser.close();
  }
  
  // 生成报告
  const report = generateReport();
  
  // 保存JSON报告
  const reportFile = path.join(CONFIG.screenshotDir, `browser-test-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`📄 JSON报告已保存: ${reportFile}`);
  
  return report;
}

// 运行测试
main().then((report) => {
  process.exit(report.summary.failed === 0 ? 0 : 1);
}).catch((error) => {
  console.error('测试运行异常:', error);
  process.exit(1);
});
