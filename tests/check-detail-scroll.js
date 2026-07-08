// 检查详情页滚动问题
const { chromium } = require('playwright');

(async () => {
  console.log('=== 详情页滚动问题排查 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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
  if (await rows.count() > 9) {
    const detailBtn = rows.nth(9).locator('button:has-text("详情")');
    if (await detailBtn.count() > 0) {
      await detailBtn.click();
      await page.waitForTimeout(4000);
      
      // 检查各层容器的 overflow 和高度
      const result = await page.evaluate(() => {
        const info = [];
        
        // 从外到内检查
        const selectors = [
          'html',
          'body',
          '#app',
          '.app-main',
          '.main-content',
          '.film-detail',
          '.detail-content'
        ];
        
        selectors.forEach(sel => {
          const el = document.querySelector(sel);
          if (el) {
            const cs = getComputedStyle(el);
            info.push({
              selector: sel,
              height: el.offsetHeight,
              scrollHeight: el.scrollHeight,
              overflow: cs.overflow,
              overflowY: cs.overflowY,
              position: cs.position,
              display: cs.display
            });
          } else {
            info.push({ selector: sel, found: false });
          }
        });
        
        // 检查所有带 overflow:hidden 的祖先
        const filmDetail = document.querySelector('.film-detail');
        if (filmDetail) {
          let parent = filmDetail.parentElement;
          while (parent) {
            const cs = getComputedStyle(parent);
            if (cs.overflow === 'hidden' || cs.overflowY === 'hidden') {
              info.push({
                selector: 'PARENT: ' + parent.tagName + '.' + parent.className.substring(0, 50),
                overflow: cs.overflow,
                overflowY: cs.overflowY,
                height: parent.offsetHeight
              });
            }
            parent = parent.parentElement;
          }
        }
        
        return info;
      });
      
      console.log('容器层级检查:');
      result.forEach(r => {
        if (r.found === false) {
          console.log(`  ${r.selector}: 未找到`);
        } else {
          console.log(`  ${r.selector}:`);
          console.log(`    height=${r.height}, scrollHeight=${r.scrollHeight}`);
          console.log(`    overflow=${r.overflow}, overflowY=${r.overflowY}`);
          console.log(`    position=${r.position}, display=${r.display}`);
        }
      });
      
      // 尝试滚动
      const canScroll = await page.evaluate(() => {
        window.scrollTo(0, 500);
        return window.scrollY;
      });
      console.log('\nwindow.scrollY 滚动后:', canScroll);
      
      // 检查 .app-main 或 .main-content 的结构
      const mainContent = await page.evaluate(() => {
        const main = document.querySelector('.app-main, .main-content, #app > div');
        if (!main) return null;
        const cs = getComputedStyle(main);
        return {
          tag: main.tagName,
          class: main.className.substring(0, 100),
          height: main.offsetHeight,
          scrollHeight: main.scrollHeight,
          overflow: cs.overflow,
          overflowY: cs.overflowY,
          display: cs.display,
          flexDirection: cs.flexDirection
        };
      });
      console.log('\n主内容容器:', JSON.stringify(mainContent, null, 2));
    }
  }

  await browser.close();
})();
