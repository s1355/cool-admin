import { CoolController, BaseController } from '@cool-midway/core';
import { KnowledgeFilmCategoryEntity } from '../../entity/film-category';
import { KnowledgeFilmCategoryService } from '../../service/film-category';

/**
 * 知识库模块-电影分类
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: KnowledgeFilmCategoryEntity,
  service: KnowledgeFilmCategoryService,
  pageQueryOp: {
    keyWordLikeFields: ['a.name'],
    fieldEq: ['a.status'],
  },
})
export class AdminKnowledgeFilmCategoryController extends BaseController {}
