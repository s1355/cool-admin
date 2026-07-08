const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: "C:\\Users\\snow\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe"
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 监听控制台
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("error") || text.includes("success") || text.includes("登录")) {
      console.log("控制台:", text);
    }
  });
  
  console.log("访问核销登录页面...");
  await page.goto("http://localhost:5173/#/pages/verify/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  
  // 填写表单
  const inputs = await page.$$("input");
  console.log("找到", inputs.length, "个输入框");
  
  if (inputs.length >= 2) {
    await inputs[0].fill("13800138001");
    await inputs[1].fill("123456");
    
    // 点击登录
    const loginBtn = await page.$("text=登录");
    if (loginBtn) {
      console.log("\n点击登录按钮...");
      await loginBtn.click();
      
      // 等待5秒
      await page.waitForTimeout(5000);
      
      const newUrl = page.url();
      console.log("登录后URL:", newUrl);
      
      if (newUrl.includes("/pages/verify/index")) {
        console.log(" 登录成功！");
      } else {
        console.log(" 登录失败");
        
        // 检查页面上是否显示"登录失败"
        const pageContent = await page.content();
        if (pageContent.includes("登录失败")) {
          console.log("页面显示: 登录失败");
        }
      }
    }
  }
  
  await browser.close();
})();
