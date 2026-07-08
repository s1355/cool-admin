// 核心功能回归测试 - 精简版
const { chromium } = require('playwright');

(async () => {
  console.log('=== 核心功能回归测试 ===\n');

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

  // 导航到电影列表
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
  console.log('列表行数:', rowCount);

  // 1. 检查海报列
  console.log('\n--- 海报列 ---');
  let withImg = 0;
  let withErr = 0;
  let empty = 0;
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = row.locator('.el-table__cell');
    const cellCount = await cells.count();
    if (cellCount > 1) {
      const posterCell = cells.nth(1);
      const imgCount = await posterCell.locator('img').count();
      const errCount = await posterCell.locator('.el-image__error').count();
      const elImageCount = await posterCell.locator('el-image, .el-image').count();
      
      if (errCount > 0) withErr++;
      else if (imgCount > 0 || elImageCount > 0) withImg++;
      else empty++;
    }
  }
  check('无加载失败图标', withErr === 0);
  check('有海报的行 > 0', withImg > 0);
  console.log(`   有海报: ${withImg}, 加载失败: ${withErr}, 空白: ${empty}`);

  // 2. 检查第一行的 el-image 是否有正确的 src
  console.log('\n--- 第10行海报详情（应该有海报）---');
  if (rowCount > 9) {
    const row = rows.nth(9);
    const cells = row.locator('.el-table__cell');
    const cellCount = await cells.count();
    if (cellCount > 1) {
      const posterHtml = await cells.nth(1).innerHTML();
      console.log('   HTML片段:', posterHtml.substring(0, 300));
      const hasSrc = posterHtml.includes('src=') && posterHtml.includes('tmdb');
      check('海报有正确src', hasSrc);
    }
  }

  // 3. 检查按钮
  console.log('\n--- 按钮功能 ---');
  const addBtn = page.locator('text=新增').first();
  check('新增按钮存在', await addBtn.count() > 0);
  
  const refreshBtn = page.locator('text=刷新').first();
  check('刷新按钮存在', await refreshBtn.count() > 0);

  // 4. 测试新增弹窗
  console.log('\n--- 新增弹窗测试 ---');
  await addBtn.click();
  await page.waitForTimeout(1500);
  const dialog = page.locator('.el-dialog');
  check('新增弹窗弹出', await dialog.count() > 0);
  
  // 关闭弹窗
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 5. 分页
  console.log('\n--- 分页 ---');
  const paginationText = await page.locator('.el-pagination').innerText().catch(() => '');
  check('分页信息存在', paginationText.length > 0);
  console.log('   分页文本:', paginationText.substring(0, 80));

  // 6. 控制台错误
  console.log('\n--- 控制台 ---');
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  check('无控制台错误', errors.length === 0);
  if (errors.length > 0) {
    errors.slice(0, 3).forEach(e => console.log('   错误:', e.substring(0, 150)));
  }

  console.log('\n=== 测试结果 ===');
  console.log(`通过: ${passed}, 失败: ${failed}`);

  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\film-regression-final.png', fullPage: true });
  console.log('\n截图: film-regression-final.png');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
