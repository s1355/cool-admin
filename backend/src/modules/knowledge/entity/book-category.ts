import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('knowledge_book_category')
export class KnowledgeBookCategoryEntity extends BaseEntity {
  @Index()
  @Column({ comment: '分类名称', length: 100 })
  name: string;

  @Column({ comment: '排序', default: 0 })
  sort: number;

  @Column({ comment: '状态', dict: ['禁用', '启用'], default: 1 })
  status: number;

  @Column({ comment: '备注', nullable: true })
  remark: string;
}
