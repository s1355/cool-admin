const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 拦截所有 film/page 请求
  page.on('request', request => {
    const url = request.url();
    if (url.includes('film/page') && request.method() === 'POST') {
      try {
        const body = request.postDataJSON();
        console.log(`\n📡 POST ${url}`);
        console.log(`   Body: ${JSON.stringify(body)}`);
        for (const k of Object.keys(body)) {
          console.log(`   ${k}: ${JSON.stringify(body[k])} (${typeof body[k]})`);
        }
      } catch (e) {
        console.log(`POST ${url} - Raw: ${request.postData()}`);
      }
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('film/page')) {
      const status = response.status();
      console.log(`📡 响应: ${status}`);
    }
  });

  // 等待用户登录
  console.log('请在浏览器中手动登录...');
  await page.goto('http://localhost:9001/#/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'login-now.png', fullPage: true });
  
  // 等待登录完成（URL 变化或时间）
  await page.waitForFunction(
    () => !location.hash.includes('login'),
    { timeout: 300000 }
  ).catch(() => console.log('登录超时或失败'));
  
  await page.waitForTimeout(2000);
  console.log(`登录后 URL: ${page.url()}`);
  await page.screenshot({ path: 'after-login-now.png', fullPage: true });
  
  // 导航到电影列表
  console.log('\n导航到电影列表...');
  await page.goto('http://localhost:9001/#/knowledge/film', { waitUntil: 'networkidle' });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'film-page.png', fullPage: true });
  
  // 列出所有筛选器
  const selects = page.locator('.el-select');
  const selectCount = await selects.count();
  console.log(`\n找到 ${selectCount} 个筛选器`);
  
  for (let i = 0; i < selectCount; i++) {
    const placeholder = await selects.nth(i).locator('.el-select__placeholder').innerText().catch(() => '');
    console.log(`  Select ${i}: "${placeholder}"`);
  }
  
  // 点击质量筛选
  if (selectCount >= 2) {
    console.log('\n=== 点击质量筛选（第2个） ===');
    await selects.nth(1).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'quality-open.png', fullPage: true });
    
    const options = page.locator('.el-select-dropdown__item');
    const optCount = await options.count();
    console.log(`选项数: ${optCount}`);
    for (let i = 0; i < optCount; i++) {
      const txt = await options.nth(i).innerText();
      console.log(`  ${i}: "${txt.trim()}"`);
    }
    
    if (optCount >= 1) {
      console.log('\n点击 S级...');
      await options.nth(0).click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'after-quality-s.png', fullPage: true });
    }
  }
  
  // 等待观察
  await page.waitForTimeout(5000);
  console.log('\n=== 完成 ===');
  
  await page.waitForTimeout(30000);
  await browser.close();
})();
