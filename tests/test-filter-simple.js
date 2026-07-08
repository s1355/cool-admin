const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== 测试电影筛选功能 ===\n');

  // 监听所有请求
  page.on('request', request => {
    const url = request.url();
    if (url.includes('film/page')) {
      console.log(`\n📡 请求: ${request.method()} ${url}`);
      if (request.method() === 'POST') {
        console.log(`   Body: ${request.postData()}`);
      }
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('film/page')) {
      console.log(`📡 响应状态: ${response.status()}`);
      if (response.status() !== 200) {
        const text = await response.text().catch(() => '');
        console.log(`   错误: ${text.substring(0, 200)}`);
      }
    }
  });

  // 打开登录页
  console.log('打开登录页...');
  await page.goto('http://localhost:9001/#/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 尝试登录
  console.log('尝试登录...');
  
  // 查找用户名输入框
  const inputs = page.locator('input');
  const inputCount = await inputs.count();
  console.log(`找到 ${inputCount} 个输入框`);

  // 填写用户名密码
  await inputs.nth(0).fill('admin');
  await inputs.nth(1).fill('123456');
  
  // 点击登录按钮
  const loginBtn = page.locator('button').filter({ hasText: '登录' });
  if (await loginBtn.count() > 0) {
    console.log('点击登录按钮...');
    await loginBtn.first().click();
    await page.waitForTimeout(3000);
  }

  // 导航到电影列表
  console.log('\n导航到电影列表...');
  await page.goto('http://localhost:9001/#/knowledge/film', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // 查找筛选器
  const selects = page.locator('.el-select');
  const selectCount = await selects.count();
  console.log(`找到 ${selectCount} 个筛选器`);

  // 测试质量筛选（第二个选择器）
  if (selectCount >= 2) {
    console.log('\n--- 测试质量筛选 ---');
    const sel = selects.nth(1);
    await sel.click();
    await page.waitForTimeout(1000);
    
    const options = page.locator('.el-select-dropdown__item');
    const optCount = await options.count();
    console.log(`选项数量: ${optCount}`);
    
    for (let i = 0; i < Math.min(optCount, 5); i++) {
      const txt = await options.nth(i).innerText();
      console.log(`  选项${i}: ${txt.trim()}`);
    }
    
    if (optCount > 0) {
      console.log('点击 S级 选项...');
      await options.nth(0).click();
      await page.waitForTimeout(5000);
    }
  }

  console.log('\n等待观察结果...');
  await page.waitForTimeout(5000);

  console.log('\n=== 测试完成 ===');
  await browser.close();
})();
