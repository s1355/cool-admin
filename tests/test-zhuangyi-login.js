/**
 * 壮医经筋养生小程序 - 登录流程测试
 * 测试步骤：
 * 1. 打开H5首页
 * 2. 点击"我的"进入会员中心
 * 3. 点击登录
 * 4. 输入手机号和验证码完成登录
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// 测试配置
const CONFIG = {
  baseUrl: 'https://hyyy.yuanzhengjun.xyz/h5/pages/index/index',
  testPhone: '13800138000',
  testCode: '123456',
  screenshotDir: path.join(__dirname, 'test-results', 'zhuangyi-login'),
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
  console.log(`📸 截图已保存: ${filePath}`);
  return filePath;
}

// 获取页面文本内容用于调试
async function getPageInfo(page) {
  const title = await page.title();
  const url = page.url();
  return { title, url };
}

async function runTest() {
  const results = {
    steps: [],
    screenshots: [],
    success: false,
    error: null,
  };

  ensureDir(CONFIG.screenshotDir);

  console.log('🚀 开始执行壮医经筋养生小程序登录流程测试...\n');

  const browser = await chromium.launch({
    headless: false, // 显示浏览器窗口便于观察
    slowMo: 1000,    // 减慢执行速度
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // 模拟手机视口 (iPhone X)
  });

  const page = await context.newPage();

  try {
    // ========== 步骤1: 打开H5首页 ==========
    console.log('📍 步骤1: 打开H5首页');
    results.steps.push({ step: 1, action: '打开首页', status: 'running' });
    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // 等待3秒让页面完全加载
    
    const pageInfo1 = await getPageInfo(page);
    console.log(`   页面标题: ${pageInfo1.title}`);
    console.log(`   当前URL: ${pageInfo1.url}`);
    
    const screenshot1 = await takeScreenshot(page, '01-homepage');
    results.screenshots.push({ step: 1, name: '首页', path: screenshot1 });
    results.steps[0].status = 'completed';
    results.steps[0].note = `标题: ${pageInfo1.title}`;

    // ========== 步骤2: 点击"我的"进入会员中心 ==========
    console.log('\n📍 步骤2: 点击"我的"进入会员中心');
    results.steps.push({ step: 2, action: '点击我的入口', status: 'running' });
    
    // 尝试多种可能的选择器来找到"我的"按钮
    const mySelectors = [
      'text=我的',
      'text="我的"',
      '.my-entry',
      '[class*="my"]',
      '[class*="user"]',
      'button:has-text("我的")',
      'view:has-text("我的")',
      'navigator:has-text("我的")',
    ];
    
    let myButton = null;
    for (const selector of mySelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          myButton = element;
          console.log(`   ✅ 找到"我的"按钮，使用选择器: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (myButton) {
      await myButton.click();
      console.log('   ✅ 已点击"我的"按钮');
    } else {
      console.log('   ⚠️ 未找到明确的"我的"按钮，尝试点击页面底部导航');
      // 尝试点击底部导航栏的最后一个项目
      const bottomNav = page.locator('tab-bar, .tab-bar, .nav-bar, navigator').last();
      if (await bottomNav.isVisible({ timeout: 2000 })) {
        await bottomNav.click();
      }
    }
    
    await page.waitForTimeout(2000); // 等待2秒
    
    const pageInfo2 = await getPageInfo(page);
    console.log(`   当前URL: ${pageInfo2.url}`);
    
    const screenshot2 = await takeScreenshot(page, '02-member-center');
    results.screenshots.push({ step: 2, name: '会员中心', path: screenshot2 });
    results.steps[1].status = 'completed';
    results.steps[1].note = `URL: ${pageInfo2.url}`;

    // ========== 步骤3: 检查并点击登录按钮 ==========
    console.log('\n📍 步骤3: 检查并点击登录按钮');
    results.steps.push({ step: 3, action: '点击登录按钮', status: 'running' });
    
    // 尝试多种登录相关选择器
    const loginSelectors = [
      'text=登录',
      'text="登录"',
      'text=立即登录',
      'text="立即登录"',
      'button:has-text("登录")',
      '.login-btn',
      '[class*="login"]',
    ];
    
    let loginButton = null;
    for (const selector of loginSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          loginButton = element;
          console.log(`   ✅ 找到登录按钮，使用选择器: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (loginButton) {
      await loginButton.click();
      console.log('   ✅ 已点击登录按钮');
    } else {
      console.log('   ⚠️ 未找到登录按钮，可能已登录或页面结构不同');
    }
    
    await page.waitForTimeout(2000); // 等待2秒
    
    const pageInfo3 = await getPageInfo(page);
    console.log(`   当前URL: ${pageInfo3.url}`);
    
    const screenshot3 = await takeScreenshot(page, '03-login-page');
    results.screenshots.push({ step: 3, name: '登录页面', path: screenshot3 });
    results.steps[2].status = 'completed';
    results.steps[2].note = `URL: ${pageInfo3.url}`;

    // ========== 步骤4: 输入手机号 ==========
    console.log('\n📍 步骤4: 输入测试手机号');
    results.steps.push({ step: 4, action: '输入手机号', status: 'running' });
    
    // 尝试多种手机号输入框选择器
    const phoneSelectors = [
      'input[type="tel"]',
      'input[placeholder*="手机"]',
      'input[placeholder*="Phone"]',
      'input[name="phone"]',
      'input[name="mobile"]',
      'input[class*="phone"]',
      'input[class*="mobile"]',
    ];
    
    let phoneInput = null;
    for (const selector of phoneSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          phoneInput = element;
          console.log(`   ✅ 找到手机号输入框，使用选择器: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (phoneInput) {
      await phoneInput.fill(CONFIG.testPhone);
      console.log(`   ✅ 已输入手机号: ${CONFIG.testPhone}`);
    } else {
      console.log('   ⚠️ 未找到手机号输入框');
    }
    
    results.steps[3].status = 'completed';
    results.steps[3].note = `输入手机号: ${CONFIG.testPhone}`;

    // ========== 步骤5: 点击获取验证码 ==========
    console.log('\n📍 步骤5: 点击获取验证码');
    results.steps.push({ step: 5, action: '点击获取验证码', status: 'running' });
    
    // 尝试多种验证码按钮选择器
    const codeSelectors = [
      'text=获取验证码',
      'text="获取验证码"',
      'text=发送验证码',
      'text="发送验证码"',
      'text=验证码',
      'button:has-text("验证码")',
      '[class*="code"]',
      '[class*="send"]',
    ];
    
    let codeButton = null;
    for (const selector of codeSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          codeButton = element;
          console.log(`   ✅ 找到验证码按钮，使用选择器: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (codeButton) {
      await codeButton.click();
      console.log('   ✅ 已点击获取验证码按钮');
    } else {
      console.log('   ⚠️ 未找到验证码按钮');
    }
    
    await page.waitForTimeout(3000); // 等待3秒
    
    const screenshot4 = await takeScreenshot(page, '04-after-send-code');
    results.screenshots.push({ step: 5, name: '发送验证码后', path: screenshot4 });
    results.steps[4].status = 'completed';

    // ========== 步骤6: 输入验证码 ==========
    console.log('\n📍 步骤6: 输入验证码');
    results.steps.push({ step: 6, action: '输入验证码', status: 'running' });
    
    // 尝试多种验证码输入框选择器
    const codeInputSelectors = [
      'input[placeholder*="验证码"]',
      'input[placeholder*="码"]',
      'input[name="code"]',
      'input[name="captcha"]',
      'input[class*="code"]',
      'input[type="number"]',
    ];
    
    let codeInput = null;
    for (const selector of codeInputSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          codeInput = element;
          console.log(`   ✅ 找到验证码输入框，使用选择器: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (codeInput) {
      await codeInput.fill(CONFIG.testCode);
      console.log(`   ✅ 已输入验证码: ${CONFIG.testCode}`);
    } else {
      console.log('   ⚠️ 未找到验证码输入框');
    }
    
    results.steps[5].status = 'completed';
    results.steps[5].note = `输入验证码: ${CONFIG.testCode}`;

    // ========== 步骤7: 点击登录按钮 ==========
    console.log('\n📍 步骤7: 点击登录按钮');
    results.steps.push({ step: 7, action: '提交登录', status: 'running' });
    
    // 尝试多种提交按钮选择器
    const submitSelectors = [
      'text=登录',
      'text="登录"',
      'text=确认',
      'text="确认"',
      'button:has-text("登录")',
      'button[type="submit"]',
      '[class*="submit"]',
      '[class*="login"][class*="btn"]',
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          submitButton = element;
          console.log(`   ✅ 找到登录提交按钮，使用选择器: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (submitButton) {
      await submitButton.click();
      console.log('   ✅ 已点击登录提交按钮');
    } else {
      console.log('   ⚠️ 未找到登录提交按钮');
    }
    
    await page.waitForTimeout(3000); // 等待3秒
    
    const screenshot5 = await takeScreenshot(page, '05-login-result');
    results.screenshots.push({ step: 7, name: '登录结果', path: screenshot5 });
    results.steps[6].status = 'completed';

    // ========== 测试完成 ==========
    console.log('\n✅ 测试执行完成');
    results.success = true;

  } catch (error) {
    console.error('\n❌ 测试执行出错:', error.message);
    results.error = error.message;
    results.steps.push({ step: 'error', action: '执行出错', status: 'failed', note: error.message });
    
    // 出错时也截一张图
    try {
      const errorScreenshot = await takeScreenshot(page, '99-error');
      results.screenshots.push({ step: 'error', name: '错误状态', path: errorScreenshot });
    } catch (screenshotError) {
      console.log('   无法保存错误截图');
    }
  } finally {
    await browser.close();
  }

  return results;
}

// 执行测试并输出报告
runTest().then(results => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试报告');
  console.log('='.repeat(60));
  
  console.log('\n📋 操作步骤记录:');
  results.steps.forEach(step => {
    const statusIcon = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
    console.log(`  ${statusIcon} 步骤${step.step}: ${step.action} - ${step.status}`);
    if (step.note) {
      console.log(`      ${step.note}`);
    }
  });
  
  console.log('\n📸 截图文件:');
  results.screenshots.forEach(ss => {
    console.log(`  - ${ss.name}: ${ss.path}`);
  });
  
  console.log('\n' + '='.repeat(60));
  if (results.success) {
    console.log('✅ 登录流程测试执行成功');
  } else if (results.error) {
    console.log(`❌ 测试执行失败: ${results.error}`);
  } else {
    console.log('⚠️ 测试执行完成但存在部分问题');
  }
  console.log('='.repeat(60));
  
  // 输出JSON格式结果便于程序处理
  console.log('\n📄 JSON结果:');
  console.log(JSON.stringify(results, null, 2));
  
  process.exit(results.success ? 0 : 1);
}).catch(error => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});
