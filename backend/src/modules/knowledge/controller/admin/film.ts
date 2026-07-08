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
}
