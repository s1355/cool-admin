// 直接访问详情页检查内容
const { chromium } = require('playwright');

(async () => {
  console.log('=== 详情页内容检查 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:9001/');
  await page.waitForTimeout(2000);
  await page.click('text=知识库管理');
  await page.waitForTimeout(500);
  await page.click('text=电影管理');
  await page.waitForTimeout(500);
  await page.click('text=电影列表');
  await page.waitForTimeout(5000);

  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  console.log('列表行数:', rowCount);

  if (rowCount > 9) {
    const row = rows.nth(9);
    const detailBtn = row.locator('button:has-text("详情")');
    console.log('详情按钮数量:', await detailBtn.count());
    
    if (await detailBtn.count() > 0) {
      await detailBtn.click();
      await page.waitForTimeout(3000);
      
      // 截图
      await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\debug-detail2.png', fullPage: true });
      console.log('详情页截图: debug-detail2.png');
      
      // 检查页面结构
      const pageTitle = await page.title();
      console.log('页面标题:', pageTitle);
      
      const filmDetail = page.locator('.film-detail');
      console.log('film-detail 元素数量:', await filmDetail.count());
      
      if (await filmDetail.count() > 0) {
        const text = await filmDetail.first().innerText();
        console.log('\n--- 详情页完整文本 ---');
        console.log(text.substring(0, 2000));
        console.log('... 总长度:', text.length);
        
        // 检查各个卡片
        const cards = filmDetail.locator('.el-card');
        console.log('\n--- 卡片数量:', await cards.count());
        for (let i = 0; i < Math.min(await cards.count(), 5); i++) {
          const cardText = await cards.nth(i).innerText();
          console.log(`卡片${i+1}:`, cardText.substring(0, 100).replace(/\n/g, ' | '));
        }
      }
      
      // 检查URL
      console.log('\n当前URL:', page.url());
    }
  }

  console.log('\n控制台错误数:', errors.length);
  errors.forEach(e => console.log('  -', e.substring(0, 200)));

  await browser.close();
})();
