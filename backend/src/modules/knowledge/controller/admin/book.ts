import { Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { CoolController, BaseController, CoolTag, TagTypes } from '@cool-midway/core';
import { Context } from '@midwayjs/koa';
import * as http from 'http';
import * as https from 'https';
import { KnowledgeBookEntity } from '../../entity/book';
import { KnowledgeBookService } from '../../service/book';

@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: KnowledgeBookEntity,
  service: KnowledgeBookService,
  pageQueryOp: {
    keyWordLikeFields: ['a.name', 'a.author'],
    fieldEq: ['a.quality', 'a.priority', 'a.categoryId'],
  },
})
export class AdminKnowledgeBookController extends BaseController {
  @Inject()
  ctx: Context;

  @Post('/import', { summary: '批量导入书籍' })
  async importBooks(@Body() books: any[]) {
    return this.ok(await this.service.importBooks(books));
  }

  /**
   * API: POST /admin/knowledge/book/batchUpdateCategory - 批量修改书籍分类
   * 注意：路由必须用驼峰，不能用连字符。原因同 film 控制器（@cool-vue/vite-plugin 跳过连字符方法）。
   * @param body.ids 书籍 ID 数组
   * @param body.categoryId 目标分类 ID
   */
  @Post('/batchUpdateCategory', { summary: '批量修改书籍分类' })
  async batchUpdateCategory(@Body() body: { ids: number[]; categoryId: number }) {
    await this.service.batchUpdateCategory(body.ids, body.categoryId);
    return this.ok();
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Get('/proxy-cover', { summary: '代理获取书籍封面，解决防盗链' })
  async proxyCover(@Query('url') url: string) {
    if (!url || !url.startsWith('http')) {
      this.ctx.status = 400;
      this.ctx.body = 'Invalid url';
      return;
    }
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const { hostname, pathname, search } = new URL(url);
    const path = pathname + search;
    const options = {
      hostname,
      path,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://book.douban.com/',
      },
      timeout: 10000,
    };
    return new Promise<void>((resolve, reject) => {
      const req = client.get(options, (resp) => {
        const contentType = resp.headers['content-type'] || 'image/jpeg';
        this.ctx.type = contentType;
        resp.pipe(this.ctx.res);
        this.ctx.res.on('finish', resolve);
      });
      req.on('error', () => {
        this.ctx.status = 502;
        this.ctx.body = 'Proxy error';
        resolve();
      });
      req.on('timeout', () => {
        req.destroy();
        this.ctx.status = 504;
        this.ctx.body = 'Timeout';
        resolve();
      });
    });
  }
}
