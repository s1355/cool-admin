import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 知识库模块-电影信息
 */
@Entity('knowledge_film')
export class KnowledgeFilmEntity extends BaseEntity {
  @Column({
    comment: '海报',
    nullable: true,
    type: 'json',
    transformer: transformerJson,
  })
  posters: string[];

  @Index()
	@Column({ comment: '名称', length: 200 })
	name: string;

  @Column({ comment: '导演', length: 200, nullable: true })
  director: string;

  @Column({ comment: '年份', type: 'int', nullable: true })
  year: number;

  @Column({ comment: '国家', length: 100, nullable: true })
  country: string;

  @Column({ comment: '语言', length: 100, nullable: true })
  language: string;

  @Column({ comment: '主要人物', type: 'text', nullable: true })
  mainCharacters: string;

  @Column({ comment: '内容简介', type: 'text', nullable: true })
  synopsis: string;

  @Column({ comment: '背景故事', type: 'text', nullable: true })
  backgroundStory: string;

  @Column({ comment: '链接', length: 500, nullable: true })
  link: string;

  @Column({
    comment: '豆瓣评分',
    type: 'decimal',
    precision: 3,
    scale: 1,
    nullable: true,
  })
  doubanRating: number;

  @Column({
    comment: 'TMDB评分',
    type: 'decimal',
    precision: 3,
    scale: 1,
    nullable: true,
  })
  tmdbRating: number;

  @Column({ comment: '分类ID', type: 'int' })
  categoryId: number;

  @Column({ comment: '质量评级', length: 10, nullable: true })
  quality: string;

  @Column({ comment: '荣誉', type: 'text', nullable: true })
  honors: string;

  @Column({ comment: '亮点所在', type: 'text', nullable: true })
  highlights: string;

  @Column({ comment: '为什么值得一看', type: 'text', nullable: true })
  whyWorthWatching: string;

  @Column({ comment: '是否已看', default: false })
  watched: boolean;

}
