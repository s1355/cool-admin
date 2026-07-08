const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:9001/login');
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'debug-login.png', fullPage: true });
  
  console.log('Title:', await page.title());
  console.log('URL:', page.url());
  
  // 检查弹窗
  const overlayCount = await page.locator('.el-overlay').count();
  console.log('Overlay count:', overlayCount);
  
  const msgBoxCount = await page.locator('.el-message-box').count();
  console.log('MessageBox count:', msgBoxCount);
  
  if (msgBoxCount > 0) {
    const msgText = await page.locator('.el-message-box').first().innerText();
    console.log('MessageBox text:', msgText.substring(0, 200));
  }
  
  // 列出所有输入框
  const inputs = await page.locator('input').all();
  console.log('\nInput count:', inputs.length);
  for (let i = 0; i < inputs.length; i++) {
    const type = await inputs[i].getAttribute('type');
    const placeholder = await inputs[i].getAttribute('placeholder');
    const name = await inputs[i].getAttribute('name');
    console.log(`Input ${i}: type=${type}, placeholder=${placeholder}, name=${name}`);
  }
  
  // 列出所有按钮
  const buttons = await page.locator('button').all();
  console.log('\nButton count:', buttons.length);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].innerText();
    const visible = await buttons[i].isVisible();
    console.log(`Button ${i}: text=${text.trim()}, visible=${visible}`);
  }
  
  // 关闭弹窗（如果有）
  if (msgBoxCount > 0) {
    console.log('\n尝试关闭弹窗...');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'debug-after-close.png' });
  }
  
  await browser.close();
})();
