// 先看看登录页的结构
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:9001/login');
  await page.waitForTimeout(3000);

  // 截图
  await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\login-page.png', fullPage: true });

  // 获取所有 input
  const inputs = await page.$$('input');
  console.log('input 数量:', inputs.length);
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    const name = await input.getAttribute('name');
    console.log(`  input[${i}]: type=${type}, placeholder=${placeholder}, name=${name}`);
  }

  // 获取所有 button
  const buttons = await page.$$('button');
  console.log('\nbutton 数量:', buttons.length);
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const text = await btn.innerText();
    console.log(`  button[${i}]: "${text.trim()}"`);
  }

  // 获取页面标题
  const title = await page.title();
  console.log('\n页面标题:', title);

  // 获取页面 URL
  console.log('页面URL:', page.url());

  await browser.close();
  console.log('\n截图: login-page.png');
})();
