const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser test for DesignSystemDemo...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to DesignSystemDemo...');
  await page.goto('http://localhost:5173/design-system-demo');
  await page.waitForTimeout(3000);

  const title = await page.title();
  console.log('Page title:', title);

  const bodyContent = await page.content();
  const hasDesignSystemDemo = bodyContent.includes('DesignSystemDemo') || bodyContent.includes('设计系统');
  console.log('Has DesignSystemDemo content:', hasDesignSystemDemo);

  const hasGenerator = bodyContent.includes('生成器') || bodyContent.includes('Generator');
  console.log('Has Generator module:', hasGenerator);

  const hasScenes = bodyContent.includes('SPA') || bodyContent.includes('Dashboard') || bodyContent.includes('App');
  console.log('Has scene examples:', hasScenes);

  if (hasDesignSystemDemo || hasGenerator) {
    console.log('SUCCESS - DesignSystemDemo page loaded correctly!');
  } else {
    console.log('WARNING - Checking page content...');
    console.log('Current URL:', page.url());
  }

  await browser.close();
  console.log('Test completed.');
})();
