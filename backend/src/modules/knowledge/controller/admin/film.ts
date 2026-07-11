import { CoolController, BaseController } from '@cool-midway/core';
import { KnowledgeFilmEntity } from '../../entity/film';
import { KnowledgeFilmService } from '../../service/film';
import { Body, Post } from '@midwayjs/core';

/**
 * 知识库模块-电影信息
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: KnowledgeFilmEntity,
  service: KnowledgeFilmService,
  pageQueryOp: {
    keyWordLikeFields: ['a.name', 'a.director', 'a.mainCharacters'],
    fieldEq: ['a.categoryId', 'a.quality', 'a.watched'],
  },
})
export class AdminKnowledgeFilmController extends BaseController {
  /**
   * API: POST /admin/knowledge/film/import - 批量导入电影数据
   * @param films 电影数据数组
   */
  @Post('/import', { summary: '批量导入电影' })
  async importFilms(@Body() films: any[]) {
    return this.ok(await this.service.importFilms(films));
  }

  /**
   * API: POST /admin/knowledge/film/batchUpdateCategory - 批量修改电影分类
   * 注意：路由必须用驼峰，不能用连字符。@cool-vue/vite-plugin 在生成前端 service 树时
   * 会跳过含连字符的方法（dist/index.js 中 !/[-:]/g.test(n) 判断），导致该接口无法出现在
   * 菜单管理「权限」级联选择器中，非 admin 用户访问会被 authority 中间件拦截返回 403。
   * @param body.ids 电影 ID 数组
   * @param body.categoryId 目标分类 ID
   */
  @Post('/batchUpdateCategory', { summary: '批量修改电影分类' })
  async batchUpdateCategory(@Body() body: { ids: number[]; categoryId: number }) {
    await this.service.batchUpdateCategory(body.ids, body.categoryId);
    return this.ok();
  }
}
