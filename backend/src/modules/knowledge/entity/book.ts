import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('knowledge_book')
export class KnowledgeBookEntity extends BaseEntity {
  @Index()
  @Column({ comment: '名称', length: 200 })
  name: string;

  @Column({ comment: '原名', nullable: true })
  originalName: string;

  @Column({ comment: '作者', nullable: true })
  author: string;

  @Column({ comment: '年份', nullable: true })
  year: number;

  @Column({ comment: '国家', nullable: true })
  country: string;

  @Column({ comment: '内容简介', type: 'text', nullable: true })
  synopsis: string;

  @Column({ comment: '背景故事', type: 'text', nullable: true })
  backgroundStory: string;

  @Column({ comment: '豆瓣评分', type: 'decimal', precision: 3, scale: 1, nullable: true })
  doubanRating: number;

  @Column({ comment: '优先级', nullable: true })
  priority: string;

  @Column({ comment: '分类ID', nullable: true })
  categoryId: number;

  @Column({ comment: '质量评级', nullable: true })
  quality: string;

  @Column({ comment: '封面', type: 'json', nullable: true, transformer: transformerJson })
  cover: string[];

  @Column({ comment: '标签', length: 500, nullable: true })
  tags: string;
}
