import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'zh-CN',
  });

  const page = await context.newPage();

  // 监听网络请求
  const apiCalls = [];
  page.on('response', async res => {
    if (res.url().includes('/dev/admin/base/open/login')) {
      let body = '';
      try { body = await res.text(); } catch(e) { body = '(error)'; }
      apiCalls.push({ status: res.status(), body: body.substring(0, 300) });
    }
  });

  // 打开登录页
  console.log('=== 打开登录页 ===');
  await page.goto('http://localhost:9001', { waitUntil: 'networkidle', timeout: 30000 });
  
  // 等待自动登录（800ms + 网络请求）
  await page.waitForTimeout(5000);

  // 检查 API 结果
  console.log('\n=== Login API 响应 ===');
  for (const call of apiCalls) {
    console.log(`  HTTP ${call.status}: ${call.body}`);
  }

  // 检查当前 URL
  const currentUrl = page.url();
  console.log(`\n当前 URL: ${currentUrl}`);

  // 截图当前状态
  await page.screenshot({ path: path.join(screenshotDir, 'verify-fix-result.png'), fullPage: true });
  console.log('截图: verify-fix-result.png');

  // 检查页面内容
  const dialogs = await page.locator('.el-message-box, .el-dialog, .el-message, .el-alert').all();
  console.log(`\n弹窗/提示: ${dialogs.length}个`);
  for (const dlg of dialogs) {
    const visible = await dlg.isVisible();
    if (visible) {
      const text = await dlg.textContent();
      console.log(`  [visible] ${text?.trim().substring(0, 200)}`);
    }
  }

  if (currentUrl === 'http://localhost:9001/') {
    console.log('\n✅ 验证成功！已自动登录并跳转到首页');
  } else if (currentUrl.includes('/login') || currentUrl.includes('login')) {
    console.log('\n❌ 登录失败，仍在登录页');
  } else {
    console.log(`\n⚠️ URL: ${currentUrl}`);
  }

  await browser.close();
  console.log('\n=== 验证完成 ===');
})().catch(err => {
  console.error('验证失败:', err.message);
  process.exit(1);
});
