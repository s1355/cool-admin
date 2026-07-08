// 验证海报修复 + 详细检查详情页
const { chromium } = require('playwright');

(async () => {
  console.log('=== 验证海报修复 + 详情页检查 ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const imgRequests = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('request', req => {
    const url = req.url();
    if (url.includes('tmdb') || url.includes('upload')) {
      imgRequests.push({ url, status: 'pending' });
    }
  });
  page.on('requestfailed', req => {
    const url = req.url();
    const idx = imgRequests.findIndex(r => r.url === url);
    if (idx >= 0) imgRequests[idx].status = 'failed: ' + req.failure()?.errorText;
  });
  page.on('response', res => {
    const url = res.url();
    const idx = imgRequests.findIndex(r => r.url === url);
    if (idx >= 0) imgRequests[idx].status = res.status();
  });

  await page.goto('http://localhost:9001/');
  await page.waitForTimeout(2000);
  await page.click('text=知识库管理');
  await page.waitForTimeout(500);
  await page.click('text=电影管理');
  await page.waitForTimeout(500);
  await page.click('text=电影列表');
  await page.waitForTimeout(6000);

  const rows = page.locator('.el-table__row');
  const rowCount = await rows.count();
  console.log('列表行数:', rowCount);

  // 检查第10行海报列
  console.log('\n--- 第10行海报列 ---');
  if (rowCount > 9) {
    const row = rows.nth(9);
    const cells = row.locator('.el-table__cell');
    const posterCell = cells.nth(1);
    
    const elImg = posterCell.locator('.el-image');
    const elImgCount = await elImg.count();
    console.log('el-image 数量:', elImgCount);
    
    if (elImgCount > 0) {
      const elImgBox = await elImg.first().boundingBox();
      console.log('el-image 尺寸:', elImgBox);
      
      const innerImg = elImg.first().locator('img');
      const imgCount = await innerImg.count();
      console.log('内部 img 数量:', imgCount);
      
      if (imgCount > 0) {
        const src = await innerImg.first().getAttribute('src');
        console.log('img src:', src?.substring(0, 80));
        const imgBox = await innerImg.first().boundingBox();
        console.log('img 尺寸:', imgBox);
      }
    }
    
    // 检查无海报的行（第1行）
    console.log('\n--- 第1行海报列（应该无海报）---');
    const row1 = rows.first();
    const posterCell1 = row1.locator('.el-table__cell').nth(1);
    const elImg1 = posterCell1.locator('.el-image');
    console.log('el-image 数量:', await elImg1.count());
    const cellText1 = await posterCell1.innerText();
    console.log('单元格文本:', cellText1 || '(空)');
  }

  console.log('\n--- 图片请求状态 ---');
  console.log('图片请求总数:', imgRequests.length);
  imgRequests.slice(0, 5).forEach(r => console.log('  ', r.status, r.url.substring(0, 60)));

  // 检查详情页
  console.log('\n=== 详情页详细检查 ===');
  if (rowCount > 9) {
    const row = rows.nth(9);
    const detailBtn = row.locator('button:has-text("详情")');
    if (await detailBtn.count() > 0) {
      await detailBtn.click();
      await page.waitForTimeout(4000);
      
      // 截图
      await page.screenshot({ path: 'd:\\Users\\kaifa\\Trae_cn260425\\debug-detail3.png' });
      console.log('详情页截图: debug-detail3.png');
      
      // 检查详情页完整结构
      const filmDetail = page.locator('.film-detail');
      if (await filmDetail.count() > 0) {
        // 检查海报轮播
        const carousel = filmDetail.locator('.el-carousel');
        console.log('海报轮播数量:', await carousel.count());
        
        if (await carousel.count() > 0) {
          const carouselBox = await carousel.first().boundingBox();
          console.log('轮播尺寸:', carouselBox);
          
          const carouselItems = carousel.locator('.el-carousel__item');
          console.log('轮播项数量:', await carouselItems.count());
          
          const imgs = carousel.locator('img');
          console.log('轮播内图片数量:', await imgs.count());
          if (await imgs.count() > 0) {
            for (let i = 0; i < Math.min(await imgs.count(), 3); i++) {
              const src = await imgs.nth(i).getAttribute('src');
              console.log(`  图片${i}:`, src?.substring(0, 80));
            }
          }
        } else {
          console.log('⚠️  没有找到轮播组件，检查poster-wrapper');
          const posterWrapper = filmDetail.locator('.poster-wrapper');
          console.log('poster-wrapper 数量:', await posterWrapper.count());
          
          const posterCarousel = filmDetail.locator('.poster-carousel');
          console.log('poster-carousel 数量:', await posterCarousel.count());
          
          if (await posterCarousel.count() > 0) {
            const html = await posterCarousel.first().innerHTML();
            console.log('poster-carousel HTML:', html.substring(0, 500));
          }
        }
        
        // 检查基本信息区域
        const basicInfo = filmDetail.locator('.basic-info');
        console.log('\nbasic-info 数量:', await basicInfo.count());
        if (await basicInfo.count() > 0) {
          const basicText = await basicInfo.first().innerText();
          console.log('基本信息内容:');
          console.log(basicText.substring(0, 300));
        }
        
        // 检查卡片数量
        const cards = filmDetail.locator('.el-card');
        console.log('\nel-card 卡片总数:', await cards.count());
        for (let i = 0; i < await cards.count(); i++) {
          const card = cards.nth(i);
          const header = card.locator('.el-card__header');
          let title = '(无header)';
          if (await header.count() > 0) {
            title = await header.first().innerText();
          }
          const bodyText = await card.locator('.el-card__body').first().innerText();
          console.log(`卡片${i+1} [${title.trim()}]:`, bodyText.substring(0, 50).replace(/\n/g, ' '));
        }
        
        // 页面滚动高度
        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        const viewportHeight = await page.evaluate(() => window.innerHeight);
        console.log('\n页面总高度:', scrollHeight, '视口高度:', viewportHeight);
      }
      
      // 检查是否有隐藏内容
      const hiddenEls = await page.evaluate(() => {
        const els = document.querySelectorAll('[style*="display: none"], [hidden]');
        return Array.from(els).slice(0, 10).map(el => el.tagName + '.' + el.className);
      });
      console.log('隐藏元素数量:', hiddenEls.length);
    }
  }

  console.log('\n控制台错误数:', errors.length);
  errors.forEach(e => console.log('  -', e.substring(0, 200)));

  await browser.close();
})();
