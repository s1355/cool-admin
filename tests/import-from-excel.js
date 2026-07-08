// 从 erotic-film-database.v2.xlsx 导入数据到电影数据库
const { chromium } = require('playwright');

(async () => {
  console.log('=== 从 Excel 导入数据到电影数据库 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. 登录后台
  await page.goto('http://localhost:9001/');
  await page.waitForTimeout(2000);
  await page.fill('input[placeholder="请输入用户名"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', '123456');
  await page.click('button:has-text("登录")');
  await page.waitForTimeout(3000);

  // 2. 导航到电影管理
  await page.click('text=知识库管理');
  await page.waitForTimeout(500);
  await page.click('text=电影管理');
  await page.waitForTimeout(500);
  await page.click('text=电影列表');
  await page.waitForTimeout(5000);

  // 3. 检查当前数据量
  const rows = page.locator('.el-table__row');
  const currentCount = await rows.count();
  console.log('当前电影数量:', currentCount);

  // 4. 检查是否有导入功能
  const importBtn = page.locator('button:has-text("导入"), button:has-text("批量导入")');
  const importCount = await importBtn.count();
  console.log('导入按钮数量:', importCount);

  if (importCount > 0) {
    console.log('找到导入功能，准备使用...');
  } else {
    console.log('未找到导入按钮，需要通过 API 或其他方式导入');
  }

  // 5. 截图当前状态
  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\before-import.png', fullPage: true });
  console.log('截图: before-import.png');

  await browser.close();
})();
