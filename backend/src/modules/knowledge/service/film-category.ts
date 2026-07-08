import { Provide } from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeFilmCategoryEntity } from '../entity/film-category';
import { escapeObject } from '../utils/xss';

/**
 * 知识库模块-电影分类
 */
@Provide()
export class KnowledgeFilmCategoryService extends BaseService {
  @InjectEntityModel(KnowledgeFilmCategoryEntity)
  knowledgeFilmCategoryEntity: Repository<KnowledgeFilmCategoryEntity>;

  /**
   * 新增分类 - XSS 防护
   * @param params 分类数据
   */
  async add(params: any) {
    const safeParams = escapeObject(params);
    return super.add(safeParams);
  }

  /**
   * 更新分类 - XSS 防护
   * @param params 分类数据
   */
  async update(params: any) {
    const safeParams = escapeObject(params);
    return super.update(safeParams);
  }
}
