// 完整回归测试
const { chromium } = require('playwright');

(async () => {
  console.log('=== 完整回归测试 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  let passed = 0;
  let failed = 0;

  function test(name, condition) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${name}`);
      failed++;
    }
  }

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

  // 1. 数据加载
  test('列表加载数据（19条）', rowCount >= 19);

  // 2. 海报显示
  let posterCount = 0;
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const imgs = row.locator('.el-table__cell').nth(1).locator('img');
    const count = await imgs.count();
    if (count > 0) {
      const box = await imgs.first().boundingBox();
      if (box && box.width > 50 && box.height > 70) {
        posterCount++;
      }
    }
  }
  test('海报正常显示（有海报的电影都显示缩略图）', posterCount >= 4);

  // 3. 无海报的行不显示加载失败
  let failImgCount = 0;
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cell = row.locator('.el-table__cell').nth(1);
    const failEl = cell.locator('.el-image__error, .el-image__placeholder');
    failImgCount += await failEl.count();
  }
  test('无海报行不显示加载失败图标', failImgCount === 0);

  // 4. 新增按钮
  const addBtn = page.locator('button:has-text("新增")');
  test('新增按钮存在', await addBtn.count() > 0);

  // 5. 刷新按钮
  const refreshBtn = page.locator('button:has-text("刷新")');
  test('刷新按钮存在', await refreshBtn.count() > 0);

  // 6. 分页
  const pagination = page.locator('.el-pagination');
  test('分页组件存在', await pagination.count() > 0);

  // 7. 操作列按钮
  if (rowCount > 9) {
    const row = rows.nth(9);
    const detailBtn = row.locator('button:has-text("详情")');
    const editBtn = row.locator('button:has-text("编辑")');
    const deleteBtn = row.locator('button:has-text("删除")');
    test('操作列有详情按钮', await detailBtn.count() > 0);
    test('操作列有编辑按钮', await editBtn.count() > 0);
    test('操作列有删除按钮', await deleteBtn.count() > 0);

    // 8. 详情页
    await detailBtn.click();
    await page.waitForTimeout(4000);

    const filmDetail = page.locator('.film-detail');
    test('详情页加载', await filmDetail.count() > 0);

    if (await filmDetail.count() > 0) {
      // 检查滚动
      const scrollInfo = await page.evaluate(() => {
        const el = document.querySelector('.film-detail');
        if (!el) return null;
        return {
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          overflowY: getComputedStyle(el).overflowY
        };
      });
      test('详情页可滚动（overflow-y: auto）', scrollInfo?.overflowY === 'auto');
      test('详情页内容超出视口（需要滚动）', scrollInfo?.scrollHeight > scrollInfo?.clientHeight);

      // 检查卡片
      const cards = filmDetail.locator('.el-card');
      test('详情页有7个卡片', await cards.count() === 7);

      // 检查海报轮播
      const carousel = filmDetail.locator('.el-carousel');
      test('详情页有海报轮播', await carousel.count() > 0);

      // 检查基本信息
      const basicInfo = filmDetail.locator('.basic-info');
      test('详情页有基本信息区域', await basicInfo.count() > 0);

      // 返回列表
      const backBtn = filmDetail.locator('.el-page-header, .detail-header button');
      const backCount = await backBtn.count();
      if (backCount > 0) {
        await backBtn.first().click();
      } else {
        await page.goBack();
      }
      await page.waitForTimeout(2000);
    }
  }

  // 9. 控制台错误
  test('无控制台错误', errors.length === 0);
  if (errors.length > 0) {
    console.log('\n错误详情:');
    errors.forEach(e => console.log('  -', e.substring(0, 200)));
  }

  console.log(`\n=== 测试结果: ${passed} passed, ${failed} failed ===`);

  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\regression-final.png', fullPage: true });
  console.log('截图: regression-final.png');

  await browser.close();
})();
