// 验证海报显示效果
const { chromium } = require('playwright');

(async () => {
  console.log('=== 验证海报显示效果 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

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

  // 检查前12行的海报列
  let imgCount = 0;
  let successCount = 0;

  for (let i = 0; i < Math.min(rowCount, 12); i++) {
    const row = rows.nth(i);
    const cells = row.locator('.el-table__cell');
    const cellCount = await cells.count();
    
    if (cellCount > 1) {
      const posterCell = cells.nth(1);
      const imgs = posterCell.locator('img');
      const count = await imgs.count();
      
      const nameCell = cells.nth(2);
      const name = await nameCell.innerText().catch(() => '?');
      
      if (count > 0) {
        imgCount++;
        const src = await imgs.first().getAttribute('src');
        const box = await imgs.first().boundingBox();
        const hasSize = box && box.width > 10 && box.height > 10;
        if (hasSize) successCount++;
        console.log(`行${i+1} [${name.substring(0, 10)}]: img=${count}, 尺寸=${box?.width}x${box?.height}, src=${src?.substring(0, 50)}`);
      } else {
        const cellHtml = await posterCell.innerHTML();
        console.log(`行${i+1} [${name.substring(0, 10)}]: 无img, HTML=${cellHtml.substring(0, 60)}`);
      }
    }
  }

  console.log(`\n有img标签的行: ${imgCount}`);
  console.log(`有实际尺寸(>10px)的行: ${successCount}`);

  console.log('\n控制台错误:', errors.length);
  errors.forEach(e => console.log('  -', e.substring(0, 200)));

  // 截图
  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\verify-img-posters.png', fullPage: true });
  console.log('\n截图: verify-img-posters.png');

  await browser.close();
})();
