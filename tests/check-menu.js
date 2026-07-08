// 检查左侧菜单结构，找到电影管理入口
const { chromium } = require('playwright');

(async () => {
  console.log('=== 检查左侧菜单 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:9001/');
  await page.waitForTimeout(3000);

  // 获取所有菜单项
  const menuItems = page.locator('.cl-menu .menu-item, .el-menu-item, .el-sub-menu');
  const count = await menuItems.count();
  console.log('菜单项数量:', count);

  // 获取所有菜单文本
  const allTexts = await page.locator('.el-menu, .cl-menu').allInnerTexts();
  console.log('\n菜单文本 (完整):');
  allTexts.forEach((t, i) => console.log(`  [${i}]`, t.substring(0, 300).replace(/\n/g, ' | ')));

  // 点击知识库管理
  console.log('\n尝试点击"知识库管理"...');
  const knowledgeMenu = page.locator('text=知识库管理').first();
  const kmCount = await knowledgeMenu.count();
  console.log('找到数量:', kmCount);
  
  if (kmCount > 0) {
    await knowledgeMenu.click();
    await page.waitForTimeout(2000);
    
    // 再次获取菜单文本
    const texts2 = await page.locator('.el-menu, .cl-menu').allInnerTexts();
    console.log('\n点击后菜单文本:');
    texts2.forEach((t, i) => console.log(`  [${i}]`, t.substring(0, 300).replace(/\n/g, ' | ')));
  }

  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\menu-check.png', fullPage: true });
  console.log('\n截图: menu-check.png');

  await browser.close();
})();
