// 等待更长时间，检查表格完全加载后的海报列
const { chromium } = require('playwright');

(async () => {
  console.log('=== 等待表格完全加载后验证 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let propsCallCount = 0;
  const allLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    allLogs.push({ type: msg.type(), text });
    if (text.includes('[海报列 props] params keys')) {
      propsCallCount++;
    }
  });

  await page.goto('http://localhost:9001/knowledge/film');
  
  console.log('等待数据加载...');
  await page.waitForTimeout(8000);

  // 截图
  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\film-page-4.png', fullPage: true });

  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  console.log('表格行数:', rowCount);

  console.log('\nprops 函数被调用次数:', propsCallCount);
  
  // 输出所有海报相关日志
  const posterLogs = allLogs.filter(l => 
    l.text.includes('[海报列 props]') || l.text.includes('[parsePosters]')
  ).slice(0, 30);
  console.log('\n海报相关日志 (前30条):');
  posterLogs.forEach((l, i) => {
    console.log(`  [${i}] ${l.text.substring(0, 200)}`);
  });

  // 检查多行的海报列
  if (rowCount > 0) {
    console.log('\n逐行检查海报列:');
    for (let i = 0; i < Math.min(rowCount, 8); i++) {
      const row = rows.nth(i);
      const cells = row.locator('.el-table__cell');
      const cellCount = await cells.count();
      if (cellCount > 1) {
        const posterCell = cells.nth(1);
        const imgCount = await posterCell.locator('img').count();
        const errCount = await posterCell.locator('.el-image__error').count();
        const nameCell = cellCount > 2 ? await cells.nth(2).innerText() : '?';
        console.log(`  行${i} [${nameCell.trim().substring(0,10)}]: img=${imgCount}, err=${errCount}`);
      }
    }
  }

  // 检查分页
  const paginationText = await page.locator('.el-pagination__total').innerText().catch(() => '?');
  console.log('\n分页:', paginationText);

  // 所有错误日志
  const errors = allLogs.filter(l => l.type === 'error');
  console.log('\n控制台错误:', errors.length);
  errors.slice(0, 5).forEach(e => console.log('  -', e.text.substring(0, 200)));

  console.log('\n截图: film-page-4.png');
  await browser.close();
})();
