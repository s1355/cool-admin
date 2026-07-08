const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== 电影编辑弹窗海报上传标签页测试 ===\n');

  try {
    // 1. 打开登录页面
    console.log('1. 打开登录页面...');
    await page.goto('http://localhost:9001/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'step1-login.png' });

    // 2. 登录 - 使用 locator 直接定位
    console.log('2. 登录中...');
    await page.locator('input[type="text"]').first().fill('admin');
    await page.waitForTimeout(100);
    await page.locator('input[type="password"]').fill('123456');
    await page.waitForTimeout(100);
    await page.locator('button:has-text("登录")').click();
    await page.waitForTimeout(3000);
    console.log('   登录完成');
    await page.screenshot({ path: 'step2-after-login.png' });

    // 3. 导航到电影管理
    console.log('3. 导航到知识库管理 → 电影管理...');
    await page.locator('text=知识库管理').click();
    await page.waitForTimeout(1000);

    await page.locator('text=电影管理').click();
    await page.waitForTimeout(3000);
    console.log('   电影管理页面已加载');
    await page.screenshot({ path: 'step3-film-list.png' });

    // 4. 等待电影列表加载
    console.log('4. 等待电影列表加载...');
    await page.waitForTimeout(2000);

    // 5. 点击第一条电影的编辑按钮
    console.log('5. 点击第一条电影的编辑按钮...');
    await page.locator('button:has-text("编辑")').first().click();
    console.log('   已点击编辑按钮');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'step4-edit-dialog.png' });

    // 6. 在弹窗中查找海报上传标签页
    console.log('6. 查找海报上传标签页...');

    // 列出所有标签
    const allTabs = await page.locator('[role="tab"]').all();
    console.log(`   找到 ${allTabs.length} 个标签页`);
    for (let i = 0; i < allTabs.length; i++) {
      const text = await allTabs[i].textContent();
      console.log(`   标签 ${i + 1}: "${text.trim()}"`);
    }

    // 点击海报标签
    const posterTab = page.locator('[role="tab"]:has-text("海报")');
    if (await posterTab.count() > 0) {
      await posterTab.click();
      console.log('   已点击海报上传标签页');
    } else {
      console.log('   未找到海报标签，尝试点击包含"海报"的元素...');
      const posterText = page.locator('text=海报上传');
      if (await posterText.count() > 0) {
        await posterText.click();
        console.log('   已点击海报上传');
      }
    }

    // 7. 等待3秒让内容完全渲染
    console.log('7. 等待3秒让内容完全渲染...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'step5-poster-tab.png' });

    // 8. 检查标签页内容
    console.log('\n=== 检查结果 ===');

    // 检查是否有"添加海报"按钮
    const addPosterBtn = await page.locator('button:has-text("添加海报")').count();
    console.log('添加海报按钮:', addPosterBtn > 0 ? '✓ 存在' : '✗ 不存在');

    // 检查海报上传相关按钮
    const uploadBtn = await page.locator('button:has-text("上传")').count();
    console.log('上传按钮:', uploadBtn > 0 ? '✓ 存在' : '✗ 不存在');

    // 检查海报缩略图
    const posterImages = await page.locator('img[src*="poster"], img[alt*="海报"]').all();
    console.log('海报图片:', posterImages.length > 0 ? `✓ 存在 ${posterImages.length} 张` : '✗ 不存在');

    // 获取弹窗内容
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.count() > 0) {
      const dialogText = await dialog.textContent();
      console.log('弹窗内容长度:', dialogText.length, '字符');
      console.log('弹窗内容预览:', dialogText.substring(0, 300).replace(/\s+/g, ' ').trim());
    } else {
      console.log('弹窗内容: 未找到对话框');
    }

    // 9. 截图
    console.log('\n9. 截图保存...');
    await page.screenshot({ path: 'movie-poster-tab-final.png', fullPage: false });
    console.log('   截图已保存: movie-poster-tab-final.png');

  } catch (error) {
    console.error('测试出错:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('错误截图已保存: error-screenshot.png');
  } finally {
    await browser.close();
    console.log('\n=== 测试完成 ===');
  }
})();
