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

  // 监听所有网络请求
  const apiCalls = [];
  page.on('request', req => {
    if (req.url().includes('localhost') || req.url().includes('8001')) {
      apiCalls.push({ type: 'REQ', url: req.url(), method: req.method(), postData: req.postData() });
    }
  });
  page.on('response', async res => {
    if (res.url().includes('localhost') || res.url().includes('8001')) {
      let body = '';
      try { body = await res.text(); } catch(e) { body = '(binary)'; }
      apiCalls.push({ type: 'RES', url: res.url(), status: res.status(), body: body.substring(0, 500) });
    }
  });

  // 打开登录页
  console.log('=== 打开登录页 ===');
  await page.goto('http://localhost:9001', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000); // 等待自动登录触发

  await page.screenshot({ path: path.join(screenshotDir, 'step1-loaded.png'), fullPage: true });
  
  // 打印所有 API 调用
  console.log('\n=== API 调用记录 ===');
  for (const call of apiCalls) {
    if (call.type === 'REQ') {
      console.log(`\n>> ${call.method} ${call.url}`);
      if (call.postData) console.log(`   Body: ${call.postData}`);
    } else {
      console.log(`<< ${call.status} ${call.url}`);
      console.log(`   Response: ${call.body}`);
    }
  }

  // 检查页面是否有错误提示
  const pageText = await page.locator('body').textContent();
  console.log('\n=== 页面文本 ===');
  console.log(pageText.substring(0, 2000));

  // 检查对话框
  const dialogs = await page.locator('.el-message-box, .el-dialog, .el-message, .el-alert').all();
  console.log(`\n=== 弹窗/提示 (${dialogs.length}个) ===`);
  for (const dlg of dialogs) {
    const visible = await dlg.isVisible();
    if (visible) {
      const text = await dlg.textContent();
      console.log(`  [visible] ${text?.trim().substring(0, 200)}`);
    }
  }

  await browser.close();
  console.log('\n=== 验证完成 ===');
})().catch(err => {
  console.error('验证失败:', err.message);
  process.exit(1);
});
