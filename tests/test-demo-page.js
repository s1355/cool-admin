const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to homepage first...');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);

  console.log('Navigating to demo page...');
  await page.goto('http://localhost:5173/demo-design-skills');
  await page.waitForTimeout(3000);

  const title = await page.title();
  console.log('Page title:', title);

  const bodyContent = await page.content();
  const hasDemoContainer = bodyContent.includes('demo-container');
  console.log('Has demo container:', hasDemoContainer);

  const hasDemoTitle = bodyContent.includes('DEMO');
  console.log('Has DEMO badge:', hasDemoTitle);

  if (hasDemoContainer && hasDemoTitle) {
    console.log('SUCCESS - Demo page loaded correctly!');
  } else {
    console.log('WARNING - Demo page may not have loaded properly');
    console.log('Current URL:', page.url());
  }

  await browser.close();
})();
