const { chromium } = require('playwright');

async function debugPosterComponent() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 捕获所有 console 输出
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push({ type: msg.type(), text: msg.text() });
    });
    
    // 捕获 page errors
    page.on('pageerror', error => {
        consoleLogs.push({ type: 'error', text: error.message });
    });
    
    try {
        console.log('=== 步骤1: 打开页面并登录 ===');
        await page.goto('http://localhost:9001/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // 检查是否需要登录
        const loginBtn = await page.$('button:has-text("登录"), .login-btn, [type="submit"]');
        if (loginBtn) {
            console.log('需要登录，执行登录...');
            // 尝试填写登录表单
            const usernameInput = await page.$('input[type="text"], input[name="username"], input[name="email"]');
            const passwordInput = await page.$('input[type="password"]');
            if (usernameInput && passwordInput) {
                await usernameInput.fill('admin');
                await passwordInput.fill('admin123');
                await page.click('button[type="submit"], .login-btn');
                await page.waitForTimeout(2000);
            }
        }
        
        console.log('=== 步骤2: 导航到电影列表 ===');
        // 尝试点击电影相关菜单
        const movieMenu = await page.$('a:has-text("电影"), .menu-item:has-text("电影"), [href*="movie"], [href*="film"]');
        if (movieMenu) {
            await movieMenu.click();
            await page.waitForTimeout(2000);
        } else {
            // 直接导航
            await page.goto('http://localhost:9001/#/movies', { waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
        }
        
        console.log('=== 步骤3: 找到有海报的电影并点击编辑 ===');
        // 等待电影列表加载
        await page.waitForTimeout(2000);
        
        // 查找第一条有海报的电影记录
        const movieRows = await page.$$('.el-table__row, .movie-item, [class*="movie"] tr');
        console.log(`找到 ${movieRows.length} 条电影记录`);
        
        // 查找编辑按钮
        let editBtn = null;
        
        // 方法1: 直接找编辑按钮
        const editButtons = await page.$$('button:has-text("编辑"), .el-button--text:has-text("编辑"), [class*="edit"]');
        console.log(`找到 ${editButtons.length} 个编辑按钮`);
        
        if (editButtons.length > 0) {
            editBtn = editButtons[0];
        }
        
        if (!editBtn) {
            // 方法2: 在表格行中找编辑按钮
            const firstRow = await page.$('.el-table__row');
            if (firstRow) {
                editBtn = await firstRow.$('button, .el-button, [class*="action"]');
            }
        }
        
        if (!editBtn) {
            // 方法3: 查找包含图标的编辑按钮
            editBtn = await page.$('[class*="edit"]:not([class*="poster"]):not([class*="image"])');
        }
        
        if (editBtn) {
            console.log('点击编辑按钮...');
            await editBtn.click();
            await page.waitForTimeout(2000);
        } else {
            console.log('未找到编辑按钮，尝试点击第一条记录...');
            const firstRow = await page.$('.el-table__row');
            if (firstRow) {
                await firstRow.click();
                await page.waitForTimeout(2000);
            }
        }
        
        console.log('=== 步骤4: 切换到海报上传标签页 ===');
        // 查找海报上传标签页
        const posterTab = await page.$('.el-tabs__item:has-text("海报"), [class*="tab"]:has-text("海报"), .tab-item:has-text("海报")');
        if (posterTab) {
            await posterTab.click();
            await page.waitForTimeout(2000);
            console.log('已切换到海报上传标签页');
        } else {
            console.log('未找到海报上传标签页，列出所有标签页...');
            const tabs = await page.$$('.el-tabs__item, [class*="tab"]');
            for (const tab of tabs) {
                const text = await tab.textContent();
                console.log(`  标签: ${text}`);
            }
        }
        
        console.log('=== 步骤5: 执行 JavaScript 调试代码 ===');
        
        // 执行用户提供的 JavaScript 调试代码
        const debugResult = await page.evaluate(() => {
            const results = {};
            
            // 检查 Vue 组件实例
            const dialog = document.querySelector('.el-dialog');
            if (dialog && dialog.__vueParentComponent) {
                let parent = dialog.__vueParentComponent;
                results.dialogVueComponent = {
                    type: parent.type?.name || parent.type,
                    hasParent: !!parent.parent
                };
                
                // 向上查找 cl-upsert
                while (parent && !parent.type?.name?.includes('upsert')) {
                    parent = parent.parent;
                }
                
                if (parent) {
                    results.upsertData = {
                        setupStateKeys: Object.keys(parent.setupState || {}),
                        formKeys: parent.setupState?.form ? Object.keys(parent.setupState.form) : null,
                        posters: parent.setupState?.form?.posters,
                        postersType: typeof parent.setupState?.form?.posters
                    };
                    
                    // 深度复制 posters 以避免 Proxy 问题
                    try {
                        results.upsertData.postersRaw = JSON.parse(JSON.stringify(parent.setupState?.form?.posters));
                    } catch (e) {
                        results.upsertData.postersRaw = String(parent.setupState?.form?.posters);
                    }
                } else {
                    results.upsertData = '未找到 cl-upsert 组件';
                }
            } else {
                results.dialogVueComponent = dialog ? 'dialog 存在但无 __vueParentComponent' : '未找到 dialog';
            }
            
            // 检查 DOM 中的 poster 相关元素
            const posterEl = document.querySelector('.film-poster-edit');
            if (posterEl) {
                results.posterElement = {
                    found: true,
                    innerHTML: posterEl.innerHTML.substring(0, 500),
                    className: posterEl.className,
                    childCount: posterEl.children.length
                };
                
                const addBtn = posterEl.querySelector('.poster-add');
                const posterList = posterEl.querySelector('.poster-list');
                results.posterElement.addBtn = {
                    found: !!addBtn,
                    outerHTML: addBtn?.outerHTML?.substring(0, 200)
                };
                results.posterElement.posterList = {
                    found: !!posterList,
                    outerHTML: posterList?.outerHTML?.substring(0, 500)
                };
                
                // 检查 display:none
                const directChildren = Array.from(posterEl.children);
                results.posterElement.childrenStyles = directChildren.map((div, i) => {
                    const style = window.getComputedStyle(div);
                    return {
                        index: i,
                        tagName: div.tagName,
                        className: div.className,
                        display: style.display,
                        visibility: style.visibility,
                        opacity: style.opacity
                    };
                });
            } else {
                results.posterElement = { found: false };
            }
            
            // 查找 film-poster-edit 组件
            const posterComponent = document.querySelector('[class*="film-poster"]');
            if (posterComponent) {
                results.filmPosterComponent = {
                    found: true,
                    tagName: posterComponent.tagName,
                    className: posterComponent.className,
                    hasVueComponent: !!posterComponent.__vueComponent
                };
                
                if (posterComponent.__vueComponent) {
                    results.filmPosterComponent.props = posterComponent.__vueComponent.props;
                    results.filmPosterComponent.setupState = posterComponent.__vueComponent.setupState;
                }
            } else {
                results.filmPosterComponent = { found: false };
            }
            
            // 检查所有可能相关的元素
            results.allPossibleElements = {
                hasFilmPosterEdit: !!document.querySelector('.film-poster-edit'),
                hasPosterUpload: !!document.querySelector('[class*="poster-upload"]'),
                hasPosterList: !!document.querySelector('[class*="poster-list"]'),
                hasUploadArea: !!document.querySelector('[class*="upload-area"]'),
                hasElDialog: !!document.querySelector('.el-dialog'),
                hasElTabs: !!document.querySelector('.el-tabs')
            };
            
            return results;
        });
        
        console.log('\n=== 调试结果 ===');
        console.log(JSON.stringify(debugResult, null, 2));
        
        // 截图保存当前状态
        await page.screenshot({ path: 'debug-poster-dialog.png', fullPage: false });
        console.log('\n截图已保存到 debug-poster-dialog.png');
        
        // 输出所有 console 日志
        console.log('\n=== Console 日志 ===');
        for (const log of consoleLogs) {
            console.log(`[${log.type}] ${log.text}`);
        }
        
    } catch (error) {
        console.error('调试过程中出错:', error.message);
        console.log('\n=== 错误前的 Console 日志 ===');
        for (const log of consoleLogs) {
            console.log(`[${log.type}] ${log.text}`);
        }
    } finally {
        await browser.close();
    }
}

debugPosterComponent().catch(console.error);
