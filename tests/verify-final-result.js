// 验证海报显示效果 - 看有海报的电影
const { chromium } = require('playwright');

(async () => {
  console.log('=== 验证海报显示效果 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:9001/');
  await page.waitForTimeout(2000);
  await page.click('text=知识库管理');
  await page.waitForTimeout(500);
  await page.click('text=电影管理');
  await page.waitForTimeout(500);
  await page.click('text=电影列表');
  await page.waitForTimeout(6000);

  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  console.log('总数据行数:', rowCount);

  let withImg = 0;
  let withErr = 0;
  let empty = 0;

  console.log('\n逐行检查海报列:');
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = row.locator('.el-table__cell');
    const cellCount = await cells.count();
    if (cellCount > 1) {
      const posterCell = cells.nth(1);
      const imgs = await posterCell.locator('img').count();
      const errs = await posterCell.locator('.el-image__error').count();
      const nameText = cellCount > 2 ? await cells.nth(2).innerText() : '?';
      
      const hasElImage = await posterCell.locator('.el-image, el-image').count();
      
      let status = '空';
      if (imgs > 0) { status = '有图片'; withImg++; }
      else if (errs > 0) { status = '加载失败'; withErr++; }
      else if (hasElImage > 0) { status = '有el-image(加载中)'; withImg++; }
      else { empty++; }
      
      console.log(`  行${String(i).padStart(2,'0')} [${nameText.trim().substring(0,14)}]: ${status}`);
    }
  }

  console.log('\n统计:');
  console.log('  有海报显示的行数:', withImg);
  console.log('  加载失败的行数:', withErr);
  console.log('  无海报(空)的行数:', empty);

  // 控制台错误
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  console.log('  控制台错误数:', errors.length);

  // 点击一张有海报的图片预览
  if (withImg > 0) {
    console.log('\n测试海报预览...');
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator('.el-table__cell');
      const cellCount = await cells.count();
      if (cellCount > 1) {
        const posterCell = cells.nth(1);
        const hasElImg = await posterCell.locator('.el-image, el-image').count();
        if (hasElImg > 0) {
          await posterCell.click();
          await page.waitForTimeout(1000);
          const previewVisible = await page.locator('.el-image-viewer__wrapper, .el-image-viewer-mask').count();
          console.log('  预览弹窗可见:', previewVisible > 0);
          
          // 关闭预览
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          break;
        }
      }
    }
  }

  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\film-page-final-result.png', fullPage: true });
  console.log('\n截图: film-page-final-result.png');

  await browser.close();
})();
