// 排查海报不显示 + 详情页问题
const { chromium } = require('playwright');

(async () => {
  console.log('=== 排查海报和详情页问题 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const requests = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('requestfailed', req => {
    if (req.url().includes('upload') || req.url().includes('tmdb')) {
      requests.push({ url: req.url(), error: req.failure()?.errorText });
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

  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  console.log('列表行数:', rowCount);

  // 检查第10行（晚熟之情，应该有海报）
  console.log('\n--- 第10行海报列详细检查 ---');
  if (rowCount > 9) {
    const row = rows.nth(9);
    const cells = row.locator('.el-table__cell');
    const cellCount = await cells.count();
    console.log('列数:', cellCount);
    
    if (cellCount > 1) {
      const posterCell = cells.nth(1);
      
      // 完整HTML
      const html = await posterCell.innerHTML();
      console.log('海报列HTML:');
      console.log('  ', html.substring(0, 600));
      
      // 计算实际高度
      const cellBox = await posterCell.boundingBox();
      console.log('单元格尺寸:', cellBox);
      
      // 检查所有子元素
      const children = await posterCell.locator('*').count();
      console.log('子元素数量:', children);
      
      // 检查el-image内部
      const elImg = posterCell.locator('el-image, .el-image');
      const elImgCount = await elImg.count();
      console.log('el-image 数量:', elImgCount);
      
      if (elImgCount > 0) {
        const elImgBox = await elImg.first().boundingBox();
        console.log('el-image 尺寸:', elImgBox);
        
        const innerImg = elImg.first().locator('img');
        const innerCount = await innerImg.count();
        console.log('内部 img 数量:', innerCount);
        
        if (innerCount > 0) {
          const src = await innerImg.first().getAttribute('src');
          console.log('img src:', src);
          const imgBox = await innerImg.first().boundingBox();
          console.log('img 尺寸:', imgBox);
        }
      }
    }
  }

  // 失败的图片请求
  console.log('\n--- 失败的图片请求 ---');
  console.log('失败请求数:', requests.length);
  requests.slice(0, 5).forEach(r => console.log('  ', r.url.substring(0, 80), '-', r.error));

  // 控制台错误
  console.log('\n--- 控制台错误 ---');
  console.log('错误数:', errors.length);
  errors.slice(0, 5).forEach(e => console.log('  -', e.substring(0, 200)));

  // 截图
  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\debug-posters.png', fullPage: true });
  console.log('\n截图: debug-posters.png');

  // 检查详情页
  console.log('\n--- 详情页检查 ---');
  
  // 找一个有详情按钮的行
  if (rowCount > 9) {
    const row = rows.nth(9);
    const detailBtn = row.locator('text=详情, button:has-text("详情")').first();
    const btnCount = await detailBtn.count();
    console.log('详情按钮数量:', btnCount);
    
    if (btnCount > 0) {
      await detailBtn.click();
      await page.waitForTimeout(3000);
      
      // 截图详情页
      await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\debug-detail.png', fullPage: true });
      console.log('详情页截图: debug-detail.png');
      
      // 检查详情页内容
      const detailContent = await page.locator('.el-dialog, .detail-page, [class*="detail"]').first().innerText().catch(() => '(无)');
      console.log('详情页文本长度:', detailContent.length);
      console.log('详情页文本前500字:', detailContent.substring(0, 500));
    } else {
      console.log('未找到详情按钮，检查操作列...');
      // 检查操作列
      const lastCell = row.locator('.el-table__cell').last();
      const lastHtml = await lastCell.innerHTML();
      console.log('最后一列HTML:', lastHtml.substring(0, 500));
    }
  }

  await browser.close();
})();
