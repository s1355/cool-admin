// 验证海报 + 详情页滚动
const { chromium } = require('playwright');

(async () => {
  console.log('=== 验证海报 + 详情页滚动 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:9001/?_t=' + Date.now());
  await page.waitForTimeout(3000);
  await page.click('text=知识库管理');
  await page.waitForTimeout(500);
  await page.click('text=电影管理');
  await page.waitForTimeout(500);
  await page.click('text=电影列表');
  await page.waitForTimeout(8000);

  // 1. 验证海报
  console.log('--- 海报验证 ---');
  const rows = page.locator('.el-table__row');
  let posterCount = 0;
  for (let i = 0; i < Math.min(await rows.count(), 12); i++) {
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
  console.log('正常显示的海报数量（前12行）:', posterCount);

  // 2. 验证详情页
  console.log('\n--- 详情页验证 ---');
  if (await rows.count() > 9) {
    const detailBtn = rows.nth(9).locator('button:has-text("详情")');
    if (await detailBtn.count() > 0) {
      await detailBtn.click();
      await page.waitForTimeout(4000);
      
      const filmDetail = page.locator('.film-detail');
      if (await filmDetail.count() > 0) {
        const box = await filmDetail.first().boundingBox();
        console.log('film-detail 尺寸:', box?.width, 'x', box?.height);
        
        // 检查滚动
        const scrollInfo = await page.evaluate(() => {
          const el = document.querySelector('.film-detail');
          if (!el) return null;
          return {
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            scrollTop: el.scrollTop,
            overflowY: getComputedStyle(el).overflowY
          };
        });
        console.log('滚动信息:', JSON.stringify(scrollInfo));
        
        // 尝试滚动详情页
        const scrolled = await page.evaluate(() => {
          const el = document.querySelector('.film-detail');
          if (!el) return false;
          el.scrollTop = 500;
          return el.scrollTop;
        });
        console.log('滚动测试 - scrollTop 设置为500后:', scrolled);
        
        // 检查卡片数量
        const cards = filmDetail.locator('.el-card');
        console.log('卡片数量:', await cards.count());
        
        // 滚动到底部，检查最后一个卡片是否可见
        const lastCardVisible = await page.evaluate(() => {
          const el = document.querySelector('.film-detail');
          if (!el) return false;
          const cards = el.querySelectorAll('.el-card');
          if (cards.length === 0) return false;
          const lastCard = cards[cards.length - 1];
          const rect = lastCard.getBoundingClientRect();
          const containerRect = el.getBoundingClientRect();
          return {
            lastCardBottom: rect.bottom,
            containerBottom: containerRect.bottom,
            isVisible: rect.top < containerRect.bottom
          };
        });
        console.log('最后卡片位置:', JSON.stringify(lastCardVisible));
      }
    }
  }

  console.log('\n控制台错误:', errors.length);
  errors.forEach(e => console.log('  -', e.substring(0, 200)));

  // 截图
  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\verify-detail-scroll.png' });
  console.log('\n截图: verify-detail-scroll.png');

  await browser.close();
})();
