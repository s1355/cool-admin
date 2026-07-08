// 重新验证海报列
const { chromium } = require('playwright');

(async () => {
  console.log('=== 重新验证海报列 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const warns = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warns.push(msg.text());
  });
  page.on('pageerror', err => {
    errors.push('PAGEERROR: ' + err.message);
  });

  // 直接访问，绕过缓存
  await page.goto('http://localhost:9001/?_t=' + Date.now());
  await page.waitForTimeout(3000);
  await page.click('text=知识库管理');
  await page.waitForTimeout(500);
  await page.click('text=电影管理');
  await page.waitForTimeout(500);
  await page.click('text=电影列表');
  await page.waitForTimeout(8000);

  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  console.log('列表行数:', rowCount);

  // 检查所有行的海报列
  let posterCount = 0;
  let emptyCount = 0;
  
  for (let i = 0; i < Math.min(rowCount, 12); i++) {
    const row = rows.nth(i);
    const cells = row.locator('.el-table__cell');
    const cellCount = await cells.count();
    
    if (cellCount > 1) {
      const posterCell = cells.nth(1);
      const elImg = posterCell.locator('el-image, .el-image');
      const imgCount = await elImg.count();
      
      const nameCell = cells.nth(2);
      const name = await nameCell.innerText().catch(() => '?');
      
      if (imgCount > 0) {
        posterCount++;
        const src = await elImg.first().getAttribute('src');
        const box = await elImg.first().boundingBox();
        console.log(`行${i+1} [${name.substring(0, 8)}]: el-image存在, src=${src?.substring(0, 50)}, 尺寸=${box?.width}x${box?.height}`);
      } else {
        emptyCount++;
        const cellHtml = await posterCell.innerHTML();
        console.log(`行${i+1} [${name.substring(0, 8)}]: 无el-image, HTML=${cellHtml.substring(0, 80)}`);
      }
    }
  }

  console.log(`\n有海报的行: ${posterCount}, 无海报的行: ${emptyCount}`);

  console.log('\n控制台错误:', errors.length);
  errors.forEach(e => console.log('  ERROR:', e.substring(0, 300)));
  console.log('控制台警告:', warns.length);
  warns.slice(0, 3).forEach(w => console.log('  WARN:', w.substring(0, 200)));

  // 截图
  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\debug-posters2.png', fullPage: true });
  console.log('\n截图: debug-posters2.png');

  await browser.close();
})();
