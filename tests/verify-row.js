// 通过点击左侧菜单导航到电影管理
const { chromium } = require('playwright');

(async () => {
  console.log('=== 导航到电影管理并验证海报 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const propsLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[海报列 props]') || text.includes('[parsePosters]')) {
      propsLogs.push(text);
    }
  });

  await page.goto('http://localhost:9001/');
  await page.waitForTimeout(2000);

  // 点击左侧"知识库管理"展开菜单
  console.log('Step 1: 展开知识库管理菜单...');
  const knowledgeMenu = page.locator('text=知识库管理').first();
  await knowledgeMenu.click();
  await page.waitForTimeout(1000);

  // 点击"影片管理"（或"电影管理"）
  console.log('Step 2: 点击影片管理...');
  const filmMenu = page.locator('text=影片管理, text=电影管理').first();
  const count = await filmMenu.count();
  if (count > 0) {
    await filmMenu.click();
  } else {
    // 尝试直接导航
    console.log('  没找到菜单，直接跳转...');
    await page.goto('http://localhost:9001/knowledge/film');
  }
  await page.waitForTimeout(5000);

  // 截图
  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\film-page-3.png', fullPage: true });
  console.log('截图已保存');

  // 当前 URL
  console.log('当前URL:', page.url());

  // 检查表格
  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  console.log('表格行数:', rowCount);

  // 控制台日志
  console.log('\n控制台海报相关日志:');
  propsLogs.slice(0, 15).forEach((t, i) => {
    console.log(`  [${i}]`, t.substring(0, 250));
  });

  if (rowCount > 0) {
    const firstRow = rows.first();
    const cells = firstRow.locator('.el-table__cell');
    const cellCount = await cells.count();
    console.log('\n第一行列数:', cellCount);
    
    if (cellCount > 1) {
      const posterCell = cells.nth(1);
      const html = await posterCell.innerHTML();
      console.log('海报列HTML (前500):', html.substring(0, 500));
      
      const imgCount = await posterCell.locator('img').count();
      const errorCount = await posterCell.locator('.el-image__error').count();
      console.log('img:', imgCount, ', error:', errorCount);
    }
  }

  await browser.close();
})();
