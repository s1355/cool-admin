const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 收集控制台消息
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('=== Step 1: 打开浏览器并登录 ===');
    await page.goto('http://localhost:9001/', { waitUntil: 'networkidle' });
    console.log('页面已加载');
    await page.waitForTimeout(3000);

    console.log('=== Step 2: 导航到电影列表 ===');
    // 尝试查找电影/海报相关链接
    const filmLinks = await page.locator('a').filter({ hasText: /电影|海报|film|poster/i }).all();
    if (filmLinks.length > 0) {
      await filmLinks[0].click();
      console.log('已点击电影链接');
      await page.waitForTimeout(2000);
    } else {
      // 直接导航到可能的 film 路由
      await page.goto('http://localhost:9001/#/film/poster', { waitUntil: 'networkidle' });
      console.log('已直接导航到电影海报页面');
      await page.waitForTimeout(2000);
    }

    console.log('=== Step 3: 点击第一条电影的编辑按钮 ===');
    // 先获取页面所有按钮文本用于调试
    const allButtons = await page.locator('button').allTextContents();
    console.log('页面中的按钮:', allButtons);

    // 查找编辑按钮 - 使用更宽泛的匹配
    const editButton = page.locator('button').filter({ hasText: /^编辑$/ }).first();
    const editButtonCount = await editButton.count();

    if (editButtonCount > 0) {
      await editButton.click();
      console.log('已点击编辑按钮');
    } else {
      // 尝试点击表格中的编辑按钮（通常在操作列）
      const actionButtons = await page.locator('.el-table__row .el-button').all();
      console.log(`找到 ${actionButtons.length} 个表格操作按钮`);
      if (actionButtons.length > 0) {
        await actionButtons[0].click();
        console.log('已点击第一个表格操作按钮');
      } else {
        console.log('未找到编辑按钮，尝试点击任意编辑相关按钮');
        const anyEdit = await page.locator('button:has-text("编辑")').first();
        if (await anyEdit.count() > 0) {
          await anyEdit.click();
          console.log('已点击编辑按钮（文本匹配）');
        }
      }
    }

    await page.waitForTimeout(3000);

    console.log('=== Step 4: 等待编辑弹窗打开 ===');
    const dialogVisible = await page.locator('.el-dialog').isVisible().catch(() => false);
    console.log('弹窗可见:', dialogVisible);

    if (!dialogVisible) {
      // 尝试查找其他可能的弹窗
      const anyModal = await page.locator('.el-dialog__body, [role="dialog"]').isVisible().catch(() => false);
      console.log('任何弹窗可见:', anyModal);
    }

    console.log('=== Step 5: 执行 JavaScript 检查 Vue 组件 ===');

    const vueInfo = await page.evaluate(() => {
      const results = {};

      // 检查 Vue 实例
      const app = document.querySelector('#app');
      if (app && app.__vue_app__) {
        results['Vue app'] = 'found';
        const vueApp = app.__vue_app__;

        // 检查全局注册的属性
        const config = vueApp.config;
        results['globalProperties'] = Object.keys(config.globalProperties || {});

        // 检查 $cl 组件
        if (config.globalProperties.$cl) {
          results['$cl exists'] = true;
          if (config.globalProperties.$cl.components) {
            results['$cl components'] = Object.keys(config.globalProperties.$cl.components);
          }
        } else {
          results['$cl exists'] = false;
        }

        // 检查所有组件
        const allComponents = vueApp._context.components;
        const componentNames = Object.keys(allComponents || {}).filter(name =>
          name.toLowerCase().includes('poster') ||
          name.toLowerCase().includes('film')
        );
        results['Poster/Film related components'] = componentNames;
        results['Has film-poster-edit component'] = !!allComponents['film-poster-edit'];
        results['Has film-poster component'] = !!allComponents['film-poster'];

        // 列出可能与海报编辑相关的组件
        results['All registered components'] = Object.keys(allComponents || {});
      } else {
        results['Vue app'] = 'not found';
      }

      // 检查 dialog
      const dialog = document.querySelector('.el-dialog');
      if (dialog) {
        results['Dialog found'] = true;
        results['Dialog classes'] = dialog.className;
        results['Dialog innerHTML (truncated)'] = dialog.innerHTML.substring(0, 500);
        if (dialog.__vueParentComponent) {
          results['Dialog parent component'] = 'found';
        }
      } else {
        results['Dialog found'] = false;
      }

      // 检查 window.Cool
      if (window.Cool) {
        results['Cool object keys'] = Object.keys(window.Cool);
      }

      return results;
    });

    console.log('\n=== Vue 组件检查结果 ===');
    console.log(JSON.stringify(vueInfo, null, 2));

    console.log('=== Step 6: 收集控制台输出 ===');
    console.log('\n浏览器控制台日志:');
    consoleLogs.forEach(log => console.log(log));

    console.log('=== Step 7: 截图当前状态 ===');
    await page.screenshot({ path: 'vue-component-check.png', fullPage: true });
    console.log('截图已保存: vue-component-check.png');

    // 如果弹窗打开，单独截取弹窗
    if (await page.locator('.el-dialog').isVisible().catch(() => false)) {
      await page.locator('.el-dialog').screenshot({ path: 'dialog-screenshot.png' });
      console.log('弹窗截图已保存: dialog-screenshot.png');
    }

  } catch (error) {
    console.error('执行错误:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();
