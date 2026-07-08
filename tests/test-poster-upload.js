const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // 收集控制台错误
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 收集页面错误
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  try {
    console.log('=== 步骤1: 导航到 http://localhost:9001/ ===');
    await page.goto('http://localhost:9001/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 检查是否需要登录
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      console.log('=== 步骤2: 检测到需要登录，执行登录 ===');
      const inputs = await page.$$('input');
      if (inputs.length >= 2) {
        await inputs[0].fill('admin');
        await inputs[1].fill('123456');
      }
      await page.click('button[type="submit"], button:has-text("登录")');
      await page.waitForTimeout(3000);
    } else {
      console.log('已登录或不需要登录');
    }

    console.log('=== 步骤3: 直接导航到电影列表页面 ===');
    await page.goto('http://localhost:9001/knowledge/film', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('=== 步骤4: 等待电影列表加载 ===');
    try {
      await page.waitForSelector('.el-table__row', { timeout: 10000 });
      console.log('表格已加载');
    } catch (e) {
      console.log('等待表格超时');
    }
    await page.waitForTimeout(1000);

    console.log('=== 步骤5: 找到列表中的第一条电影，点击"编辑"按钮 ===');

    const editButtons = await page.locator('button:has-text("编辑")').all();
    console.log(`找到 ${editButtons.length} 个编辑按钮`);

    if (editButtons.length > 0) {
      await editButtons[0].click();
      console.log('已点击第一行的编辑按钮');
    }

    await page.waitForTimeout(2000);

    console.log('=== 步骤6: 等待编辑弹窗打开 ===');
    await page.waitForTimeout(500);

    // 查找编辑弹窗
    const dialog = await page.locator('.cl-dialog').first();
    const dialogExists = await dialog.count();
    console.log(`找到 .cl-dialog 元素: ${dialogExists}个`);
    
    const dialogBox = await dialog.boundingBox();
    console.log(`弹窗尺寸: ${JSON.stringify(dialogBox)}`);

    console.log('=== 步骤7: 查找并点击"海报上传" tab ===');
    await page.waitForTimeout(500);

    // 找到海报上传tab的LI元素 - 直接使用更精确的选择器
    // 查找所有在 cl-form-tabs 中的 LI 元素
    const tabItems = await page.locator('.cl-form-tabs li').all();
    console.log(`找到 ${tabItems.length} 个tab项`);
    
    for (let i = 0; i < tabItems.length; i++) {
      const tab = tabItems[i];
      const text = await tab.textContent();
      const isActive = await tab.evaluate(el => el.classList.contains('is-active'));
      console.log(`  Tab ${i+1}: "${text.trim()}" ${isActive ? '(active)' : ''}`);
    }

    // 点击"海报上传" tab - 使用 first() 获取第一个匹配项
    const posterTab = await page.locator('.cl-form-tabs li:has-text("海报上传")').first();
    if (await posterTab.count() > 0) {
      // 直接点击这个 LI 元素
      await posterTab.click({ force: true });
      console.log('已点击海报上传LI元素 (force=true)');
      await page.waitForTimeout(3000);  // 等待更长时间让内容切换
    } else {
      console.log('未找到海报上传tab');
    }

    console.log('=== 步骤8: 检查点击后的tab状态 ===');
    const tabsAfterClick = await page.locator('.cl-form-tabs li').all();
    for (let i = 0; i < tabsAfterClick.length; i++) {
      const tab = tabsAfterClick[i];
      const text = await tab.textContent();
      const isActive = await tab.evaluate(el => el.classList.contains('is-active'));
      console.log(`  Tab ${i+1}: "${text.trim()}" ${isActive ? '(active)' : ''}`);
    }

    console.log('=== 步骤9: 截图当前弹窗内容 ===');
    
    await page.screenshot({ 
      path: 'poster-upload-tab.png', 
      fullPage: false 
    });
    console.log('页面截图已保存: poster-upload-tab.png');

    // 截取弹窗区域
    const dialogBoxAfter = await dialog.boundingBox();
    if (dialogBoxAfter) {
      console.log(`弹窗尺寸: ${dialogBoxAfter.width}x${dialogBoxAfter.height}`);
      await page.screenshot({ 
        path: 'poster-upload-dialog.png',
        clip: { x: dialogBoxAfter.x, y: dialogBoxAfter.y, width: dialogBoxAfter.width, height: dialogBoxAfter.height }
      });
      console.log('弹窗截图已保存: poster-upload-dialog.png');
    }

    // 获取弹窗内容
    const dialogContent = await dialog.textContent();
    console.log('\n=== 点击后弹窗文本内容 ===');
    console.log(dialogContent);

    console.log('=== 步骤10: 检查浏览器控制台错误 ===');
    console.log('控制台错误 (Error级别):');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((err, i) => {
        console.log(`  [${i+1}] ${err}`);
      });
    } else {
      console.log('  无控制台错误');
    }

    console.log('\n页面错误 (JavaScript异常):');
    if (pageErrors.length > 0) {
      pageErrors.forEach((err, i) => {
        console.log(`  [${i+1}] ${err}`);
      });
    } else {
      console.log('  无页面错误');
    }

    // 检查关键元素
    console.log('\n=== 关键观察 ===');
    
    // 检查是否有"添加海报"按钮
    const addPosterBtns = await page.locator('.cl-dialog button').all();
    console.log(`弹窗内所有按钮数量: ${addPosterBtns.length}`);
    for (const btn of addPosterBtns) {
      const text = await btn.textContent();
      if (text) {
        console.log(`  按钮: "${text.trim()}"`);
      }
    }
    
    // 检查海报相关组件
    const posterComponents = await page.$$('.cl-dialog [class*="poster"]');
    console.log(`海报相关组件: ${posterComponents.length}个`);
    
    // 检查图片
    const imagesInDialog = await page.locator('.cl-dialog img').all();
    console.log(`弹窗内图片: ${imagesInDialog.length}个`);
    
    // 检查上传区域
    const uploadAreas = await page.$$('.cl-dialog [class*="upload"]');
    console.log(`上传区域: ${uploadAreas.length}个`);
    
    // 检查文件输入框
    const fileInputs = await page.$$('.cl-dialog input[type="file"]');
    console.log(`文件上传输入框: ${fileInputs.length}个`);

  } catch (error) {
    console.error('执行过程中出错:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('\n测试完成!');
  }
})();
