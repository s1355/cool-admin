import { Provide } from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { escapeObject } from '../utils/xss';
import { KnowledgeBookCategoryEntity } from '../entity/book-category';

@Provide()
export class KnowledgeBookCategoryService extends BaseService {
  @InjectEntityModel(KnowledgeBookCategoryEntity)
  knowledgeBookCategoryEntity: Repository<KnowledgeBookCategoryEntity>;

  async add(params: any) {
    const safeParams = escapeObject(params);
    return super.add(safeParams);
  }

  async update(params: any) {
    const safeParams = escapeObject(params);
    return super.update(safeParams);
  }
}
