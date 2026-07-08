import { Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { KnowledgeBookCategoryEntity } from '../../entity/book-category';
import { KnowledgeBookCategoryService } from '../../service/book-category';

@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: KnowledgeBookCategoryEntity,
  service: KnowledgeBookCategoryService,
  pageQueryOp: {
    keyWordLikeFields: ['a.name'],
    fieldEq: ['a.status'],
  },
})
export class AdminKnowledgeBookCategoryController extends BaseController {}
