// 检查 render 函数参数
const { chromium } = require('playwright');

(async () => {
  console.log('=== 检查 render 函数参数 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const renderLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[render]')) {
      renderLogs.push(text);
    }
  });

  await page.goto('http://localhost:9001/');
  await page.waitForTimeout(2000);
  await page.click('text=知识库管理');
  await page.waitForTimeout(500);
  await page.click('text=电影管理');
  await page.waitForTimeout(500);
  await page.click('text=电影列表');
  await page.waitForTimeout(6000);

  console.log('render 函数调用次数:', renderLogs.length);
  console.log('\n前12条日志:');
  renderLogs.slice(0, 12).forEach((t, i) => {
    console.log(`  [${i}]`, t.substring(0, 200));
  });

  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  console.log('\n表格行数:', rowCount);

  // 检查第10行（晚熟之情应该有海报）
  if (rowCount > 9) {
    const row = rows.nth(9);
    const cells = row.locator('.el-table__cell');
    const cellCount = await cells.count();
    if (cellCount > 1) {
      const posterHtml = await cells.nth(1).innerHTML();
      console.log('\n第10行海报列HTML (前300):', posterHtml.substring(0, 300));
    }
  }

  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\film-page-render-debug.png', fullPage: true });
  console.log('\n截图: film-page-render-debug.png');

  await browser.close();
})();
