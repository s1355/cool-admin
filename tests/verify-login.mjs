import { chromium } from '@playwright/test';
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

  // 监听网络请求
  const requests = [];
  context.on('request', request => {
    if (request.url().includes('/admin/')) {
      requests.push({ type: 'request', url: request.url(), method: request.method(), headers: request.headers(), postData: request.postData() });
    }
  });
  context.on('response', response => {
    if (response.url().includes('/admin/')) {
      requests.push({ type: 'response', url: response.url(), status: response.status() });
    }
  });

  const page = await context.newPage();

  // 1. 打开登录页
  console.log('=== Step 1: 打开登录页 ===');
  await page.goto('http://localhost:9001', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });
  console.log('  截图已保存: 01-login-page.png');

  // 2. 查看页面内容
  const html = await page.content();
  console.log(`  页面标题: ${await page.title()}`);
  
  // 查找输入框
  const inputs = await page.locator('input').all();
  console.log(`  找到 ${inputs.length} 个 input`);
  for (const input of inputs) {
    const name = await input.getAttribute('name') || '';
    const placeholder = await input.getAttribute('placeholder') || '';
    const id = await input.getAttribute('id') || '';
    const type = await input.getAttribute('type') || '';
    console.log(`    input: name=${name}, id=${id}, placeholder=${placeholder}, type=${type}`);
  }

  // 查找登录按钮
  const buttons = await page.locator('button, .el-button, [class*="login"], [class*="submit"]').all();
  console.log(`  找到 ${buttons.length} 个按钮`);
  for (const btn of buttons) {
    const text = await btn.textContent();
    const cls = await btn.getAttribute('class') || '';
    console.log(`    button: text="${text?.trim()}", class=${cls}`);
  }

  // 3. 尝试填写用户名和密码
  console.log('\n=== Step 2: 填写登录表单 ===');
  
  // 尝试不同的选择器
  const userInput = page.locator('input').first();
  const pwdInput = page.locator('input').nth(1);
  
  await userInput.fill('admin');
  await pwdInput.fill('123456');
  console.log('  已填写 admin / 123456');
  await page.screenshot({ path: path.join(screenshotDir, '02-filled.png'), fullPage: true });

  // 4. 点击登录按钮
  console.log('\n=== Step 3: 点击登录 ===');
  const loginBtn = page.locator('button').first();
  const btnText = await loginBtn.textContent();
  console.log(`  点击按钮: "${btnText?.trim()}"`);
  
  // 监听导航
  const navPromise = page.waitForNavigation({ timeout: 10000 }).catch(() => null);
  await loginBtn.click();
  
  await page.waitForTimeout(3000);
  
  // 检查是否跳转
  const currentUrl = page.url();
  console.log(`  当前URL: ${currentUrl}`);
  
  await page.screenshot({ path: path.join(screenshotDir, '03-after-login.png'), fullPage: true });
  console.log('  截图已保存: 03-after-login.png');

  // 5. 输出网络请求记录
  console.log('\n=== Step 4: API 请求记录 ===');
  for (const req of requests) {
    if (req.type === 'request') {
      console.log(`  >> ${req.method} ${req.url}`);
      if (req.postData) console.log(`     POST: ${req.postData}`);
    } else {
      console.log(`  << ${req.status} ${req.url}`);
    }
  }

  // 6. 检查页面错误
  const errorEls = await page.locator('.el-message, .el-notification, [class*="error"], [class*="danger"]').all();
  console.log(`\n=== Step 5: 错误提示 ===`);
  for (const el of errorEls) {
    const text = await el.textContent();
    if (text?.trim()) console.log(`  ${text.trim()}`);
  }

  await browser.close();
  console.log('\n=== 验证完成 ===');
})().catch(err => {
  console.error('验证失败:', err);
  process.exit(1);
});
