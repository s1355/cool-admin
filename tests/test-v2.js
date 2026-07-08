const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser test for DemoDesignSkillsV2...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to V2 page...');
  await page.goto('http://localhost:5173/demo-design-skills-v2');
  await page.waitForTimeout(3000);

  const bodyContent = await page.content();
  const hasV2Content = bodyContent.includes('v2.0 增强版') || bodyContent.includes('title-gradient');
  console.log('Has V2 content:', hasV2Content);

  const hasSceneButtons = bodyContent.includes('奢享SPA') || bodyContent.includes('scene');
  console.log('Has scene buttons:', hasSceneButtons);

  const hasThreeLayers = bodyContent.includes('Human Layer') || bodyContent.includes('AI Layer');
  console.log('Has three layers:', hasThreeLayers);

  if (hasV2Content) {
    console.log('SUCCESS - DemoDesignSkillsV2 page loaded correctly!');
  } else {
    console.log('WARNING - V2 page may not have loaded properly');
  }

  await browser.close();
  console.log('Test completed.');
})();
