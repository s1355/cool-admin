// 检查详情页滚动和内容
const { chromium } = require('playwright');

(async () => {
  console.log('=== 详情页内容完整检查 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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
  await page.waitForTimeout(6000);

  const rows = page.locator('.el-table__row');
  
  // 点击第10行的详情
  if (await rows.count() > 9) {
    const detailBtn = rows.nth(9).locator('button:has-text("详情")');
    if (await detailBtn.count() > 0) {
      await detailBtn.click();
      await page.waitForTimeout(4000);
      
      console.log('当前URL:', page.url());
      
      // 检查页面结构
      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
      console.log('页面滚动高度:', scrollHeight, '视口高度:', clientHeight);
      
      // 检查 film-detail 高度
      const detailEl = page.locator('.film-detail');
      if (await detailEl.count() > 0) {
        const detailBox = await detailEl.first().boundingBox();
        console.log('film-detail 尺寸:', detailBox);
        
        // 检查所有卡片
        const cards = detailEl.locator('.el-card');
        console.log('卡片数量:', await cards.count());
        
        // 滚动到底部，看看有没有更多内容
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        
        // 检查页面底部
        const bottomText = await page.evaluate(() => {
          const bottom = document.querySelector('.film-detail');
          return bottom ? bottom.innerText.substring(bottom.innerText.length - 200) : '';
        });
        console.log('\n页面底部内容:', bottomText);
        
        // 检查所有卡片的高度
        for (let i = 0; i < await cards.count(); i++) {
          const card = cards.nth(i);
          const box = await card.boundingBox();
          const header = await card.locator('.el-card__header').innerText().catch(() => '(无header)');
          const body = await card.locator('.el-card__body').innerText().catch(() => '');
          console.log(`\n卡片${i+1} [${header.trim().substring(0, 15)}]: y=${box?.y}, height=${box?.height}`);
          console.log(`  内容: ${body.substring(0, 60).replace(/\n/g, ' | ')}`);
        }
      }
      
      // 检查是否有隐藏的 tab 或其他内容
      const tabs = await page.evaluate(() => {
        const tabs = document.querySelectorAll('.el-tabs');
        return Array.from(tabs).map(t => ({
          class: t.className,
          tabs: Array.from(t.querySelectorAll('.el-tabs__item')).map(i => i.textContent?.trim())
        }));
      });
      console.log('\nTab组件数量:', tabs.length);
      tabs.forEach((t, i) => console.log(`  Tab${i+1}:`, t.tabs));
      
      // 全屏截图
      await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\debug-detail-full.png', fullPage: true });
      console.log('\n完整截图: debug-detail-full.png');
    }
  }

  console.log('\n控制台错误:', errors.length);
  errors.forEach(e => console.log('  -', e.substring(0, 200)));

  await browser.close();
})();
