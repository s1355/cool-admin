// 深入检查 el-image 元素结构
const { chromium } = require('playwright');

(async () => {
  console.log('=== 深入检查 el-image ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:9001/?_t=' + Date.now());
  await page.waitForTimeout(3000);
  await page.click('text=知识库管理');
  await page.waitForTimeout(500);
  await page.click('text=电影管理');
  await page.waitForTimeout(500);
  await page.click('text=电影列表');
  await page.waitForTimeout(8000);

  const rows = page.locator('.el-table__row');
  
  // 检查第10行（晚熟之情）
  const row = rows.nth(9);
  const posterCell = row.locator('.el-table__cell').nth(1);
  const elImg = posterCell.locator('.el-image');
  
  console.log('--- el-image 元素检查 ---');
  
  // 1. 检查元素属性
  const attrs = await page.evaluate((el) => {
    if (!el) return null;
    const result = {};
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      result[attr.name] = attr.value;
    }
    result.className = el.className;
    result.styleAttr = el.getAttribute('style');
    result.computedStyle = {
      width: getComputedStyle(el).width,
      height: getComputedStyle(el).height,
      display: getComputedStyle(el).display,
    };
    return result;
  }, await elImg.first().elementHandle());
  
  console.log('el-image 属性:', JSON.stringify(attrs, null, 2));
  
  // 2. 检查内部结构
  const innerHtml = await elImg.first().innerHTML();
  console.log('\n--- el-image 内部 HTML ---');
  console.log(innerHtml.substring(0, 1000));
  
  // 3. 检查子元素
  const children = await elImg.first().locator('*').all();
  console.log('\n--- 子元素列表 ---');
  for (const child of children) {
    const tag = await child.evaluate(el => el.tagName);
    const cls = await child.evaluate(el => el.className);
    const box = await child.boundingBox();
    console.log(`  ${tag}.${cls.substring(0, 50)} - 尺寸: ${box?.width}x${box?.height}`);
  }
  
  // 4. 检查实际图片
  const realImg = elImg.locator('img');
  const imgCount = await realImg.count();
  console.log('\n--- 内部 img 元素 ---');
  console.log('img 数量:', imgCount);
  if (imgCount > 0) {
    const src = await realImg.first().getAttribute('src');
    console.log('img src:', src);
    const display = await realImg.first().evaluate(el => getComputedStyle(el).display);
    console.log('img display:', display);
    const visibility = await realImg.first().evaluate(el => getComputedStyle(el).visibility);
    console.log('img visibility:', visibility);
  }
  
  // 5. 检查是否有占位图/加载图
  const placeholder = elImg.locator('.el-image__placeholder, .el-image__error, .el-image__inner');
  console.log('\n占位/错误/内部元素数量:', await placeholder.count());
  
  await browser.close();
})();
