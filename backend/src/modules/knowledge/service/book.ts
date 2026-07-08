import { Inject, Provide } from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import {
  escapeObject,
  filterImageUrls,
  truncateString,
  validateYear,
  validateRating,
  validateCategoryId,
} from '../utils/xss';
import { KnowledgeBookEntity } from '../entity/book';

@Provide()
export class KnowledgeBookService extends BaseService {
  @InjectEntityModel(KnowledgeBookEntity)
  knowledgeBookEntity: Repository<KnowledgeBookEntity>;

  @Inject()
  ctx;

  async page(query: any, option?: any) {
    const { page: pageNo = 1, size = 20, keyWord = '', order = 'id', sort = 'desc' } = query;
    const pageNum = Math.max(1, parseInt(String(pageNo), 10) || 1);
    const pageSize = Math.max(1, parseInt(String(size), 10) || 20);
    const offset = (pageNum - 1) * pageSize;

    const qb = this.knowledgeBookEntity.createQueryBuilder('a');

    if (query.quality !== undefined && query.quality !== null && query.quality !== '') {
      qb.andWhere('a.quality = :quality', { quality: String(query.quality) });
    }

    if (query.priority !== undefined && query.priority !== null && query.priority !== '') {
      qb.andWhere('a.priority = :priority', { priority: String(query.priority) });
    }

    if (query.categoryId !== undefined && query.categoryId !== null && query.categoryId !== '') {
      const catId = typeof query.categoryId === 'string' ? parseInt(query.categoryId, 10) : query.categoryId;
      if (!isNaN(catId)) {
        qb.andWhere('a.categoryId = :categoryId', { categoryId: catId });
      }
    }

    if (keyWord) {
      const like = `%${keyWord}%`;
      qb.andWhere('(a.name LIKE :kw OR a.author LIKE :kw)', { kw: like });
    }

    const allowedSort = ['asc', 'desc'].includes(String(sort).toLowerCase()) ? String(sort).toUpperCase() : 'DESC';
    const orderField = ['id', 'createTime', 'updateTime', 'name', 'year'].includes(order) ? order : 'id';
    qb.orderBy(`a.${orderField}`, allowedSort as 'ASC' | 'DESC');

    // 分页（导出时取消分页，返回全部数据）
    if (!query.isExport) {
      qb.skip(offset).take(pageSize);
    }

    const [list, total] = await qb.getManyAndCount();

    return {
      list,
      pagination: {
        page: pageNum,
        size: pageSize,
        total: Number(total),
      },
    };
  }

  async add(params: any) {
    if (params.name) params.name = truncateString(params.name, 200);
    if (params.author) params.author = truncateString(params.author, 100);
    if (params.country) params.country = truncateString(params.country, 100);
    if (params.quality) params.quality = truncateString(params.quality, 10);
    if (params.priority) params.priority = truncateString(params.priority, 10);

    if (params.name) {
      const exist = await this.knowledgeBookEntity.findOne({
        where: { name: params.name },
      });
      if (exist) {
        throw new Error(`书籍"${params.name}"已存在，请勿重复添加`);
      }
    }

    if (params.cover) {
      params.cover = filterImageUrls(params.cover);
    }

    const safeParams = escapeObject(params, ['cover']);
    return super.add(safeParams);
  }

  async update(params: any) {
    if (params.name) params.name = truncateString(params.name, 200);
    if (params.author) params.author = truncateString(params.author, 100);
    if (params.country) params.country = truncateString(params.country, 100);
    if (params.quality) params.quality = truncateString(params.quality, 10);
    if (params.priority) params.priority = truncateString(params.priority, 10);

    if (params.cover) {
      params.cover = filterImageUrls(params.cover);
    }

    const safeParams = escapeObject(params, ['cover']);
    return super.update(safeParams);
  }

  async importBooks(books: any[]) {
    let success = 0;
    let fail = 0;
    let skip = 0;
    const successList = [];
    const failList = [];
    const skipList = [];

    for (const book of books) {
      if (!book.name) {
        fail++;
        failList.push({ name: book.name || '未知', reason: '缺少名称' });
        continue;
      }

      const exist = await this.knowledgeBookEntity.findOne({
        where: { name: book.name },
      });
      if (exist) {
        skip++;
        skipList.push({ name: book.name, reason: '已存在' });
        continue;
      }

      try {
        const bookData = {
          name: truncateString(book.name || '', 200),
          originalName: book.originalName || book['原名'] || '',
          author: truncateString(book.author || book['作者'] || '', 100),
          year: validateYear(book.year || book['年份']),
          country: truncateString(book.country || book['国家'] || '', 100),
          synopsis: book.synopsis || book['内容简介'] || '',
          backgroundStory: book.backgroundStory || book['背景故事'] || '',
          cover: filterImageUrls(book.cover || book['封面链接'] ? [book.cover || book['封面链接']] : []),
          categoryId: validateCategoryId(book.categoryId ?? book['分类ID'] ?? book['分类']),
          quality: truncateString(book.quality || book['质量'] || book['质量评级'] || 'C', 10),
          priority: truncateString(book.priority || book['优先级'] || 'P3', 10),
          doubanRating: validateRating(book.doubanRating || book['豆瓣评分']),
          tags: book.tags || book['标签'] || '',
        };

        await this.add(bookData);
        success++;
        successList.push({ name: book.name });
      } catch (e) {
        fail++;
        failList.push({ name: book.name, reason: e.message });
      }
    }

    return { total: books.length, success, fail, skip, successList, failList, skipList };
  }
}
