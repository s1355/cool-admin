// 逐步验证海报不显示原因 - 已登录状态
const { chromium } = require('playwright');

(async () => {
  console.log('=== 逐步验证海报不显示原因 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 收集控制台日志
  const consoleLogs = { log: [], warn: [], error: [], info: [] };
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (consoleLogs[type]) {
      consoleLogs[type].push(text);
    }
  });

  // 收集网络请求响应
  const apiResponses = {};
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/knowledge/film/page')) {
      try {
        const body = await response.json();
        apiResponses['film/page'] = body;
      } catch (e) {
        apiResponses['film/page_error'] = e.message;
      }
    }
  });

  console.log('Step 1: 访问首页（已登录状态）...');
  await page.goto('http://localhost:9001/');
  await page.waitForTimeout(3000);

  console.log('Step 2: 导航到电影管理页...');
  await page.goto('http://localhost:9001/knowledge/film');
  await page.waitForTimeout(5000);

  // 截图
  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\film-page.png', fullPage: true });
  console.log('  截图已保存: film-page.png\n');

  console.log('Step 3: 检查表格数据行数...');
  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  console.log('  表格行数:', rowCount);

  if (rowCount > 0) {
    console.log('\nStep 4: 逐行检查海报列...');
    
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const row = rows.nth(i);
      const cells = row.locator('.el-table__cell');
      const cellCount = await cells.count();
      
      if (cellCount > 1) {
        const posterCell = cells.nth(1);
        
        // 检查是否有 img
        const imgCount = await posterCell.locator('img').count();
        // 检查是否有错误图标
        const errorCount = await posterCell.locator('.el-image__error').count();
        // 检查是否有 el-image
        const elImageCount = await posterCell.locator('.el-image').count();
        
        // 获取行名称
        const nameCell = cellCount > 2 ? await cells.nth(2).innerText() : '(未知)';
        
        console.log(`  行${i} [${nameCell.trim().substring(0, 10)}]: img=${imgCount}, error=${errorCount}, el-image=${elImageCount}`);
        
        if (imgCount > 0) {
          const src = await posterCell.locator('img').first().getAttribute('src');
          console.log(`    img src: ${src?.substring(0, 80)}`);
        }
      }
    }

    // 检查第一行海报列的 HTML
    console.log('\nStep 5: 第一行海报列 HTML 详情...');
    const firstRow = rows.first();
    const firstCells = firstRow.locator('.el-table__cell');
    const firstCellCount = await firstCells.count();
    
    if (firstCellCount > 1) {
      const posterHtml = await firstCells.nth(1).innerHTML();
      console.log('  HTML (前800字符):');
      console.log('  ', posterHtml.substring(0, 800));
    }
  }

  // 检查分页
  console.log('\nStep 6: 检查分页信息...');
  const paginationEl = page.locator('.el-pagination__total');
  if (await paginationEl.isVisible().catch(() => false)) {
    const totalText = await paginationEl.innerText();
    console.log('  总数:', totalText);
  } else {
    const allPaginationText = await page.locator('.cl-pagination, .el-pagination').innerText().catch(() => '(无)');
    console.log('  分页文本:', allPaginationText.substring(0, 100));
  }

  // 控制台日志中的 parsePosters 相关
  console.log('\nStep 7: 控制台 parsePosters 相关日志...');
  const posterLogs = [...consoleLogs.log, ...consoleLogs.info].filter(t => 
    t.toLowerCase().includes('poster') || t.includes('parsePosters') || t.includes('海报')
  );
  console.log('  相关日志数量:', posterLogs.length);
  posterLogs.slice(0, 10).forEach((t, i) => {
    console.log(`  [${i}]`, t.substring(0, 250));
  });

  // 错误日志
  console.log('\nStep 8: 控制台错误日志...');
  console.log('  错误数量:', consoleLogs.error.length);
  consoleLogs.error.slice(0, 5).forEach((t, i) => {
    console.log(`  [${i}]`, t.substring(0, 300));
  });

  // API 响应
  console.log('\nStep 9: API 响应验证...');
  if (apiResponses['film/page']) {
    const res = apiResponses['film/page'];
    console.log('  code:', res.code);
    const list = res.data?.list || res.list || [];
    console.log('  列表条数:', list.length);
    if (list.length > 0) {
      const first = list[0];
      console.log('  第一条 posters:', first.posters);
      console.log('  第一条 posters 类型:', typeof first.posters);
      console.log('  第一条 posters 是数组:', Array.isArray(first.posters));
    }
  } else {
    console.log('  未捕获到 film/page 响应');
  }

  console.log('\n=== 验证完成 ===');
  console.log('截图: film-page.png');

  await browser.close();
})();
