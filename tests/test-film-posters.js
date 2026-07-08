const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 收集控制台日志
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      console.log('[CONSOLE ERROR]', msg.text());
    }
  });

  // 收集网络请求
  const apiRequests = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/knowledge/film/page')) {
      const status = response.status();
      try {
        const body = await response.json();
        apiRequests.push({ url, status, body: JSON.stringify(body).substring(0, 2000) });
        console.log('\n[API 响应]', url);
        console.log('  status:', status);
        const list = body?.data?.list || body?.list || [];
        if (list.length > 0) {
          const first = list[0];
          console.log('  第一条数据 posters:', {
            value: first.posters,
            type: typeof first.posters,
            isArray: Array.isArray(first.posters)
          });
        }
      } catch (e) {
        console.log('[API 响应解析失败]', e.message);
      }
    }
  });

  console.log('步骤1: 访问登录页');
  await page.goto('http://localhost:9001/login');
  await page.waitForTimeout(2000);

  console.log('\n步骤2: 登录系统');
  await page.fill('input[placeholder="请输入账号"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', '123456');
  const captchaInput = page.locator('input[placeholder="请输入验证码"]');
  if (await captchaInput.isVisible()) {
    await captchaInput.fill('1234');
  }
  await page.click('button:has-text("登 录")');
  await page.waitForTimeout(3000);

  console.log('\n步骤3: 导航到电影管理');
  await page.goto('http://localhost:9001/knowledge/film');
  await page.waitForTimeout(5000);

  console.log('\n步骤4: 截图查看页面状态');
  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\film-list-screenshot.png', fullPage: true });
  console.log('截图已保存: film-list-screenshot.png');

  console.log('\n步骤5: 检查海报列渲染情况');
  const rows = await page.$$('.el-table__row');
  console.log('表格行数:', rows.length);

  if (rows.length > 0) {
    const firstRow = rows[0];
    const cells = await firstRow.$$('.el-table__cell');
    console.log('第一行列数:', cells.length);

    // 检查海报列（第2列，第0列是多选框）
    if (cells.length > 1) {
      const posterCell = cells[1];
      const posterHtml = await posterCell.innerHTML();
      console.log('\n海报列HTML片段:');
      console.log(posterHtml.substring(0, 500));

      const hasImg = await posterCell.$('img');
      console.log('\n海报列有img标签:', !!hasImg);

      const hasErrorIcon = await posterCell.$('.el-image__error');
      console.log('海报列有错误图标:', !!hasErrorIcon);
    }
  }

  console.log('\n========== 控制台日志 ==========');
  consoleLogs.forEach(log => {
    console.log(`[${log.type}] ${log.text.substring(0, 300)}`);
  });

  console.log('\n========== 可能原因分析 ==========');
  const posterErrors = consoleLogs.filter(l => l.text.includes('posters') || l.text.includes('海报') || l.text.includes('image'));
  if (posterErrors.length > 0) {
    console.log('找到海报相关日志:', posterErrors.length, '条');
    posterErrors.slice(0, 5).forEach(e => console.log('  -', e.text.substring(0, 200)));
  }

  await page.waitForTimeout(10000);
  await browser.close();
  console.log('\n测试完成');
})();
