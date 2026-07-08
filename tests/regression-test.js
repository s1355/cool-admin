// 回归测试 - 验证所有功能
const { chromium } = require('playwright');

(async () => {
  console.log('=== 回归测试 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function check(name, condition) {
    if (condition) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  }

  await page.goto('http://localhost:9001/');
  await page.waitForTimeout(2000);
  await page.click('text=知识库管理');
  await page.waitForTimeout(500);
  await page.click('text=电影管理');
  await page.waitForTimeout(500);
  await page.click('text=电影列表');
  await page.waitForTimeout(5000);

  console.log('--- 基础功能 ---');

  // 1. 列表数据
  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  check('列表数据行数 > 0', rowCount > 0);
  console.log(`   数据行数: ${rowCount}`);

  // 2. 分页
  const pagination = page.locator('.cl-pagination, .el-pagination');
  const paginationVisible = await pagination.isVisible().catch(() => false);
  check('分页组件可见', paginationVisible);

  // 3. 海报列
  let withImg = 0;
  let withErr = 0;
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = row.locator('.el-table__cell');
    const cellCount = await cells.count();
    if (cellCount > 1) {
      const posterCell = cells.nth(1);
      const errs = await posterCell.locator('.el-image__error').count();
      const hasImg = await posterCell.locator('img, .el-image').count();
      if (errs > 0) withErr++;
      if (hasImg > 0) withImg++;
    }
  }
  check('无加载失败图标', withErr === 0);
  check('有海报显示的行 > 0', withImg > 0);
  console.log(`   有海报: ${withImg} 行, 加载失败: ${withErr} 行`);

  console.log('\n--- 筛选功能 ---');

  // 4. 分类筛选
  const categorySelect = page.locator('.cl-select').first();
  const categoryVisible = await categorySelect.isVisible().catch(() => false);
  check('分类筛选可见', categoryVisible);

  // 5. 搜索框
  const searchInput = page.locator('input[placeholder*="搜索"]').first();
  const searchVisible = await searchInput.isVisible().catch(() => false);
  check('搜索框可见', searchVisible);

  // 6. 测试搜索
  if (searchVisible) {
    await searchInput.fill('晚熟');
    await page.waitForTimeout(2000);
    const searchedRows = await rows.count();
    check('搜索后行数减少（筛选生效）', searchedRows < rowCount);
    console.log(`   搜索后行数: ${searchedRows}`);
    
    // 清空搜索
    await searchInput.fill('');
    await page.waitForTimeout(2000);
  }

  console.log('\n--- 按钮功能 ---');

  // 7. 刷新按钮
  const refreshBtn = page.locator('.cl-refresh-btn, button:has-text("刷新")').first();
  check('刷新按钮可见', await refreshBtn.isVisible().catch(() => false));

  // 8. 新增按钮
  const addBtn = page.locator('.cl-add-btn, button:has-text("新增")').first();
  check('新增按钮可见', await addBtn.isVisible().catch(() => false));

  // 9. 批量删除按钮
  const multiDelBtn = page.locator('.cl-multi-delete-btn').first();
  check('批量删除按钮可见', await multiDelBtn.isVisible().catch(() => false));

  // 10. 测试新增弹窗
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click();
    await page.waitForTimeout(1000);
    const dialogVisible = await page.locator('.el-dialog, .cl-upsert').count();
    check('点击新增弹出弹窗', dialogVisible > 0);
    
    // 关闭弹窗
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  console.log('\n--- 电影分类页面 ---');

  // 11. 电影分类页面不受影响
  await page.click('text=电影分类');
  await page.waitForTimeout(3000);
  const catRows = page.locator('.el-table__row');
  const catRowCount = await catRows.count();
  check('电影分类页面数据正常', catRowCount > 0);
  console.log(`   分类数据行数: ${catRowCount}`);

  console.log('\n=== 测试结果 ===');
  console.log(`通过: ${passed}, 失败: ${failed}`);

  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\film-page-regression.png', fullPage: true });
  console.log('\n截图: film-page-regression.png');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
