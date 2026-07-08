// 验证 component props 函数的所有参数结构
const { chromium } = require('playwright');

(async () => {
  console.log('=== 验证 scope/row 参数结构 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const propsLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[海报列 props]') || text.includes('[parsePosters]')) {
      propsLogs.push(text);
    }
  });

  await page.goto('http://localhost:9001/knowledge/film');
  await page.waitForTimeout(5000);

  console.log('当前海报列 props 日志:');
  propsLogs.forEach(t => console.log('  ', t.substring(0, 200)));

  console.log('\n=== 问题分析 ===');
  console.log('scope 是空对象 {}，所以 scope.posters = undefined');
  console.log('需要查看 cl-crud 源码，确认 component 的 props 函数参数结构');

  await browser.close();
})();
