const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 导航到目标页面
    console.log('正在导航到 http://localhost:9001/');
    await page.goto('http://localhost:9001/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 2. 使用 JavaScript 点击电影分类和电影列表
    console.log('\n使用 JavaScript 点击电影分类...');
    await page.evaluate(() => {
      const items = document.querySelectorAll('.el-menu-item');
      for (const item of items) {
        if (item.textContent.includes('电影分类')) {
          item.click();
          return;
        }
      }
    });
    await page.waitForTimeout(1000);

    console.log('使用 JavaScript 点击电影列表...');
    await page.evaluate(() => {
      const items = document.querySelectorAll('.el-menu-item');
      for (const item of items) {
        if (item.textContent.includes('电影列表')) {
          item.click();
          return;
        }
      }
    });
    await page.waitForTimeout(3000);
    console.log('当前 URL:', page.url());

    // 3. JS 点击编辑按钮
    console.log('\n使用 JavaScript 点击编辑按钮...');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, .el-button');
      for (const btn of buttons) {
        if (btn.textContent.includes('编辑')) {
          btn.click();
          return;
        }
      }
      const rows = document.querySelectorAll('.el-table__row');
      if (rows.length > 0) {
        const rowBtns = rows[0].querySelectorAll('.el-button');
        if (rowBtns.length > 0) {
          rowBtns[0].click();
        }
      }
    });
    await page.waitForTimeout(2000);

    // 4. JS 点击海报上传 tab
    console.log('\n使用 JavaScript 点击海报上传标签...');
    await page.evaluate(() => {
      // 找到 cl-form-tabs 组件内部的 tab
      const formTabs = document.querySelector('.cl-form-tabs');
      if (formTabs) {
        const lis = formTabs.querySelectorAll('li');
        for (const li of lis) {
          if (li.textContent.includes('海报上传')) {
            li.click();
            return;
          }
        }
      }
    });
    await page.waitForTimeout(2000);

    // 截图
    await page.screenshot({ path: 'poster-tab-screenshot.png' });
    console.log('已保存海报上传标签页截图: poster-tab-screenshot.png');

    // 5. 详细 DOM 结构分析
    console.log('\n========== 海报上传标签页 DOM 结构分析 ==========\n');

    const domInfo = await page.evaluate(() => {
      const results = {
        dialogBody: null,
        formTabs: null,
        allTabs: [],
        filmPosterEdit: [],
        allDataVElements: [],
        hiddenElements: [],
        mainElements: []
      };

      // 获取弹窗主体
      const body = document.querySelector('.el-dialog__body');
      if (body) {
        results.dialogBody = body.innerHTML;
      }

      // 查找 .cl-form-tabs 组件
      const formTabs = document.querySelector('.cl-form-tabs');
      if (formTabs) {
        const tabs = formTabs.querySelectorAll('li');
        results.allTabs = Array.from(tabs).map((li, i) => ({
          index: i,
          text: li.textContent?.trim(),
          class: li.className,
          isActive: li.classList.contains('is-active')
        }));

        results.formTabs = {
          className: formTabs.className,
          childHTML: formTabs.innerHTML
        };
      }

      // 查找 film-poster 相关
      const filmPosterElements = document.querySelectorAll('[class*="film-poster"], [class*="poster"], [id*="poster"], [class*="upload-poster"], [class*="poster-upload"]');
      filmPosterElements.forEach((el, i) => {
        results.filmPosterEdit.push({
          index: i,
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          visible: el.offsetParent !== null
        });
      });

      // 获取所有带 data-v- 的元素（在 dialog body 内）
      if (body) {
        const allEls = body.querySelectorAll('*');
        allEls.forEach(el => {
          if (el.attributes) {
            const dataVAttrs = [];
            for (const attr of el.attributes) {
              if (attr.name.startsWith('data-v-')) {
                dataVAttrs.push(attr.name);
              }
            }
            if (dataVAttrs.length > 0) {
              results.allDataVElements.push({
                tagName: el.tagName,
                className: el.className,
                id: el.id,
                dataVAttrs: dataVAttrs
              });
            }
          }
        });
      }

      // 检查隐藏元素
      if (body) {
        const allInBody = body.querySelectorAll('*');
        allInBody.forEach(el => {
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 1) {
            results.hiddenElements.push({
              tagName: el.tagName,
              className: el.className,
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity
            });
          }
        });
      }

      // 获取主要元素结构
      if (body) {
        const children = body.children;
        for (let i = 0; i < children.length; i++) {
          const el = children[i];
          results.mainElements.push({
            index: i,
            tagName: el.tagName,
            className: el.className,
            id: el.id
          });
        }
      }

      return results;
    });

    // 输出结果
    console.log('1. cl-form-tabs 组件的完整 HTML:');
    console.log('-----------------------------------');
    if (domInfo.formTabs) {
      console.log(`class: ${domInfo.formTabs.className}`);
      console.log('innerHTML:', domInfo.formTabs.childHTML);
    } else {
      console.log('未找到 .cl-form-tabs');
    }

    console.log('\n2. 所有 Tab 标签:');
    console.log('-----------------------------------');
    if (domInfo.allTabs.length > 0) {
      domInfo.allTabs.forEach(tab => {
        console.log(`[${tab.index}] class="${tab.class}" text="${tab.text}" ${tab.isActive ? '(active)' : ''}`);
      });
    } else {
      console.log('未找到 tabs');
    }

    console.log('\n3. film-poster 相关元素:');
    console.log('-----------------------------------');
    if (domInfo.filmPosterEdit.length > 0) {
      domInfo.filmPosterEdit.forEach(el => {
        console.log(`<${el.tagName}> class="${el.className}" id="${el.id}" visible=${el.visible}`);
      });
    } else {
      console.log('未找到 film-poster 相关元素');
    }

    console.log('\n4. dialog body 内的所有带 data-v-xxxx 属性的元素:');
    console.log('-----------------------------------');
    if (domInfo.allDataVElements.length > 0) {
      domInfo.allDataVElements.forEach(el => {
        console.log(`<${el.tagName}> class="${el.className}" id="${el.id}" data-v: ${el.dataVAttrs.join(', ')}`);
      });
    } else {
      console.log('未找到带 data-v- 属性的元素');
    }

    console.log('\n5. 隐藏元素 (display:none 或 visibility:hidden):');
    console.log('-----------------------------------');
    if (domInfo.hiddenElements.length > 0) {
      domInfo.hiddenElements.forEach(el => {
        console.log(`<${el.tagName}> class="${el.className}" display=${el.display} visibility=${el.visibility}`);
      });
    } else {
      console.log('未找到隐藏元素');
    }

    console.log('\n6. dialog body 的直接子元素:');
    console.log('-----------------------------------');
    if (domInfo.mainElements.length > 0) {
      domInfo.mainElements.forEach(el => {
        console.log(`<${el.tagName}> class="${el.className}" id="${el.id}"`);
      });
    } else {
      console.log('无子元素');
    }

    console.log('\n7. el-dialog__body 完整内容:');
    console.log('-----------------------------------');
    if (domInfo.dialogBody) {
      console.log(domInfo.dialogBody.substring(0, 10000));
    } else {
      console.log('未找到 .el-dialog__body');
    }

    console.log('\n========== DOM 结构分析完成 ==========\n');

    // 最终截图
    await page.screenshot({ path: 'final-poster-tab-screenshot.png' });
    console.log('已保存最终截图: final-poster-tab-screenshot.png');

  } catch (error) {
    console.error('执行出错:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('已保存错误截图: error-screenshot.png');
  } finally {
    await browser.close();
  }
})();
