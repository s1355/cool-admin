// 通过菜单导航到电影列表 - 正确顺序
const { chromium } = require('playwright');

(async () => {
  console.log('=== 通过菜单导航到电影列表 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let propsCallCount = 0;
  const posterLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[海报列 props] params keys')) {
      propsCallCount++;
    }
    if (text.includes('[海报列 props]') || text.includes('[parsePosters]')) {
      posterLogs.push(text);
    }
  });

  await page.goto('http://localhost:9001/');
  await page.waitForTimeout(2000);

  // 1. 点击知识库管理
  console.log('Step 1: 点击知识库管理');
  await page.click('text=知识库管理');
  await page.waitForTimeout(1000);

  // 2. 点击电影管理（展开子菜单）
  console.log('Step 2: 点击电影管理');
  await page.click('text=电影管理');
  await page.waitForTimeout(1000);

  // 3. 点击电影列表
  console.log('Step 3: 点击电影列表');
  await page.click('text=电影列表');
  await page.waitForTimeout(6000);

  console.log('导航后URL:', page.url());

  // 截图
  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\film-page-final.png', fullPage: true });

  // 检查表格
  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  console.log('\n表格行数:', rowCount);

  console.log('props 函数调用次数:', propsCallCount);
  
  console.log('\n海报相关日志 (前25条):');
  posterLogs.slice(0, 25).forEach((t, i) => {
    console.log(`  [${i}]`, t.substring(0, 200));
  });

  // 检查海报列
  if (rowCount > 0) {
    console.log('\n逐行检查海报列 (前8行):');
    for (let i = 0; i < Math.min(rowCount, 8); i++) {
      const row = rows.nth(i);
      const cells = row.locator('.el-table__cell');
      const cellCount = await cells.count();
      if (cellCount > 1) {
        const posterCell = cells.nth(1);
        const imgCount = await posterCell.locator('img').count();
        const errCount = await posterCell.locator('.el-image__error').count();
        const nameText = cellCount > 2 ? await cells.nth(2).innerText() : '?';
        console.log(`  行${i} [${nameText.trim().substring(0,12)}]: img=${imgCount}, err=${errCount}`);
        
        if (imgCount > 0) {
          const src = await posterCell.locator('img').first().getAttribute('src');
          console.log(`    src: ${src?.substring(0, 60)}`);
        }
      }
    }
  }

  console.log('\n截图: film-page-final.png');
  await browser.close();
})();
