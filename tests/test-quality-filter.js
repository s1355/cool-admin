const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听所有请求
  page.on('request', request => {
    const url = request.url();
    if (url.includes('film/page') && request.method() === 'POST') {
      const body = request.postDataJSON();
      console.log(`\n📡 POST ${url}`);
      console.log(`   Body: ${JSON.stringify(body)}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('film/page')) {
      const status = response.status();
      console.log(`📡 响应状态: ${status}`);
      if (status !== 200) {
        const text = await response.text().catch(() => '');
        console.log(`   错误: ${text.substring(0, 300)}`);
      } else {
        const data = await response.json().catch(() => ({}));
        if (data.code === 1000) {
          console.log(`   成功，共 ${data.data?.pagination?.total || 0} 条`);
        } else {
          console.log(`   失败: ${data.message}`);
        }
      }
    }
  });

  console.log('=== 测试质量筛选 ===\n');

  // 先访问页面获取登录态
  await page.goto('http://localhost:9001/#/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 截图查看登录页
  await page.screenshot({ path: 'login-page.png' });
  console.log('已截图登录页');

  // 直接通过 API 调用筛选（不依赖UI登录）
  // 先通过 fetch 登录
  const loginResult = await page.evaluate(async () => {
    try {
      const captchaRes = await fetch('http://localhost:8001/admin/base/open/captcha');
      const captchaData = await captchaRes.json();
      const captchaId = captchaData.data?.captchaId;

      const loginRes = await fetch('http://localhost:8001/admin/base/open/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: '123456',
          captchaId: 'test',
          verifyCode: 'test'
        })
      });
      const loginData = await loginRes.json();
      return loginData;
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log(`\n登录结果: ${JSON.stringify(loginResult).substring(0, 200)}`);

  await browser.close();
})();
