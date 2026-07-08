const axios = require('axios');
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:8001';

// 从 data URI 中提取 base64 数据
function getDataUriBase64(dataUri) {
  const match = dataUri.match(/^data:image\/svg\+xml;base64,(.+)$/);
  return match ? match[1] : null;
}

// base64 转 buffer
function base64ToBuffer(base64) {
  return Buffer.from(base64, 'base64');
}

(async () => {
  // 1. 获取验证码
  const response = await axios.get(`${BASE_URL}/admin/base/open/captcha`, { timeout: 10000 });
  const captchaData = response.data.data;
  console.log('captchaId:', captchaData.captchaId);
  
  const svgBase64 = getDataUriBase64(captchaData.data);
  if (svgBase64) {
    const svgBuffer = base64ToBuffer(svgBase64);
    const svgContent = svgBuffer.toString('utf-8');
    console.log('SVG length:', svgContent.length);
    
    // 保存 SVG 文件
    const fs = require('fs');
    fs.writeFileSync('captcha.svg', svgContent);
    console.log('SVG saved to captcha.svg');
    
    // 尝试从 SVG 中提取文字
    // svg-captcha 的 path 数据比较复杂，让我看看格式
    const pathMatch = svgContent.match(/<path[^>]*d="([^"]+)"[^>]*>/g);
    console.log('Path count:', pathMatch ? pathMatch.length : 0);
    
    // 试试用 Playwright 渲染 SVG 然后截图
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.setContent(`
      <html>
        <body style="background: white;">
          <img src="${captchaData.data}" style="width: 300px; height: 100px;" />
        </body>
      </html>
    `);
    
    await page.screenshot({ path: 'captcha-rendered.png' });
    console.log('Rendered screenshot saved to captcha-rendered.png');
    
    await browser.close();
  }
  
})();
