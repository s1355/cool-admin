// 验证 render 函数方式的海报列
const { chromium } = require('playwright');

(async () => {
  console.log('=== 验证 render 函数方式 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
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

  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\film-page-fixed.png', fullPage: true });

  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  console.log('表格行数:', rowCount);

  let imgCount = 0;
  let errCount = 0;
  console.log('\n逐行检查海报列:');
  for (let i = 0; i < Math.min(rowCount, 10); i++) {
    const row = rows.nth(i);
    const cells = row.locator('.el-table__cell');
    const cellCount = await cells.count();
    if (cellCount > 1) {
      const posterCell = cells.nth(1);
      const imgs = await posterCell.locator('img').count();
      const errs = await posterCell.locator('.el-image__error').count();
      const nameText = cellCount > 2 ? await cells.nth(2).innerText() : '?';
      console.log(`  行${i} [${nameText.trim().substring(0,14)}]: img=${imgs}, err=${errs}`);
      if (imgs > 0) imgCount++;
      if (errs > 0) errCount++;
    }
  }

  console.log('\n前10行统计:');
  console.log('  有图片的行数:', imgCount);
  console.log('  有错误图标的行数:', errCount);

  console.log('\n控制台错误:', errors.length);
  errors.slice(0, 3).forEach(e => console.log('  -', e.substring(0, 200)));

  // 点击第一张有图片的海报，验证预览
  if (imgCount > 0) {
    console.log('\n尝试点击海报预览...');
    for (let i = 0; i < Math.min(rowCount, 10); i++) {
      const row = rows.nth(i);
      const cells = row.locator('.el-table__cell');
      const cellCount = await cells.count();
      if (cellCount > 1) {
        const posterCell = cells.nth(1);
        const imgs = await posterCell.locator('img').count();
        if (imgs > 0) {
          await posterCell.click();
          await page.waitForTimeout(1000);
          const previewVisible = await page.locator('.el-image-viewer__wrapper').isVisible().catch(() => false);
          console.log('  预览弹窗可见:', previewVisible);
          break;
        }
      }
    }
  }

  console.log('\n截图: film-page-fixed.png');
  await browser.close();
})();
