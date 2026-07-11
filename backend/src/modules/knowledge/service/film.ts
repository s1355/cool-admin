import { KnowledgeFilmEntity } from './../entity/film';
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
  validateCategoryId
} from '../utils/xss';

/**
 * 知识库模块-电影信息
 */
@Provide()
export class KnowledgeFilmService extends BaseService {
  @InjectEntityModel(KnowledgeFilmEntity)
  knowledgeFilmEntity: Repository<KnowledgeFilmEntity>;

  @Inject()
  ctx;

  /**
   * 分页查询
   * - 重写自 BaseService.page，绕开 BaseSqliteService.fieldEq 注释掉 sqlParams.push 的 bug
   *   （该 bug 会导致 quality/categoryId 等精确匹配字段的查询参数未传递，typeorm 默认 0，触发 SQLITE_MISMATCH）
   * - 同时处理 watched 字段（前端布尔/字符串 → 数字 1/0）的类型转换
   * @param query 查询条件
   * @param option 查询配置
   */
  async page(query: any, option?: any) {
    // 1. watched 类型转换：布尔/字符串 → 数字 1/0
    if (query.watched !== undefined && query.watched !== null && query.watched !== '') {
      query.watched = query.watched === 'true' || query.watched === true ? 1 : 0;
    }

    // 2. 字符串数字 → 数字
    if (query.categoryId !== undefined && query.categoryId !== null && query.categoryId !== '') {
      if (typeof query.categoryId === 'string') {
        const num = parseInt(query.categoryId, 10);
        if (!isNaN(num)) {
          query.categoryId = num;
        }
      }
    }

    const { page: pageNo = 1, size = 20, keyWord = '', order = 'id', sort = 'desc' } = query;
    const pageNum = Math.max(1, parseInt(String(pageNo), 10) || 1);
    const pageSize = Math.max(1, parseInt(String(size), 10) || 20);
    const offset = (pageNum - 1) * pageSize;

    // 3. 构造 QueryBuilder，手动管理所有字段，避免走 fieldEq 有 bug 的路径
    const qb = this.knowledgeFilmEntity.createQueryBuilder('a');

    // quality 精确匹配
    if (query.quality !== undefined && query.quality !== null && query.quality !== '') {
      qb.andWhere('a.quality = :quality', { quality: String(query.quality) });
    }

    // categoryId 精确匹配
    if (query.categoryId !== undefined && query.categoryId !== null && query.categoryId !== '') {
      qb.andWhere('a.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    // watched 精确匹配
    if (query.watched !== undefined && query.watched !== null && query.watched !== '') {
      qb.andWhere('a.watched = :watched', { watched: query.watched });
    }

    // 关键字搜索（name、director、mainCharacters 三个字段）
    if (keyWord) {
      const like = `%${keyWord}%`;
      qb.andWhere(
        `(a.name LIKE :kw OR a.director LIKE :kw OR a.mainCharacters LIKE :kw)`,
        { kw: like }
      );
    }

    // 排序
    const allowedSort = ['asc', 'desc'].includes(String(sort).toLowerCase()) ? String(sort).toUpperCase() : 'DESC';
    const orderField = ['id', 'createTime', 'updateTime', 'name', 'year'].includes(order) ? order : 'id';
    qb.orderBy(`a.${orderField}`, allowedSort as 'ASC' | 'DESC');

    // 分页（导出时取消分页，返回全部数据）
    if (!query.isExport) {
      qb.skip(offset).take(pageSize);
    }

    // 4. 执行查询
    const [list, total] = await qb.getManyAndCount();

    return {
      list,
      pagination: {
        page: pageNum,
        size: pageSize,
        total: Number(total)
      }
    };
  }

  /**
   * 新增电影
   * - 业务层查重：检查同名电影是否已存在
   * - 对用户输入进行 XSS 过滤，防止存储型 XSS 攻击
   * - 对 posters 字段进行 URL 白名单校验，只允许 http/https 协议
   * @param params 电影数据
   */
  async add(params: any) {
    // 字段长度截断，防止超出数据库字段限制
    if (params.name) params.name = truncateString(params.name, 200);
    if (params.director) params.director = truncateString(params.director, 200);
    if (params.country) params.country = truncateString(params.country, 100);
    if (params.language) params.language = truncateString(params.language, 100);
    if (params.quality) params.quality = truncateString(params.quality, 10);
    if (params.link) params.link = truncateString(params.link, 500);

    // 业务层查重：检查同名电影是否已存在
    if (params.name) {
      const exist = await this.knowledgeFilmEntity.findOne({
        where: { name: params.name }
      });
      if (exist) {
        throw new Error(`电影"${params.name}"已存在，请勿重复添加`);
      }
    }
    // URL 白名单过滤 posters 字段
    if (params.posters) {
      params.posters = filterImageUrls(params.posters);
    }
    // XSS 过滤 - 排除 posters 字段（JSON 数组）
    const safeParams = escapeObject(params, ['posters']);
    return super.add(safeParams);
  }

  /**
   * 更新电影
   * - 对用户输入进行 XSS 过滤，防止存储型 XSS 攻击
   * - 对 posters 字段进行 URL 白名单校验，只允许 http/https 协议
   * @param params 电影数据
   */
  async update(params: any) {
    // 字段长度截断，防止超出数据库字段限制
    if (params.name) params.name = truncateString(params.name, 200);
    if (params.director) params.director = truncateString(params.director, 200);
    if (params.country) params.country = truncateString(params.country, 100);
    if (params.language) params.language = truncateString(params.language, 100);
    if (params.quality) params.quality = truncateString(params.quality, 10);
    if (params.link) params.link = truncateString(params.link, 500);

    // URL 白名单过滤 posters 字段
    if (params.posters) {
      params.posters = filterImageUrls(params.posters);
    }
    // XSS 过滤 - 排除 posters 字段（JSON 数组）
    const safeParams = escapeObject(params, ['posters']);
    return super.update(safeParams);
  }

  /**
   * 批量修改电影分类
   * @param ids 电影 ID 数组
   * @param categoryId 目标分类 ID
   */
  async batchUpdateCategory(ids: number[], categoryId: number) {
    if (!ids || ids.length === 0) {
      throw new Error('请选择要修改的数据');
    }
    if (!categoryId) {
      throw new Error('请选择目标分类');
    }
    await this.knowledgeFilmEntity
      .createQueryBuilder()
      .update()
      .set({ categoryId })
      .whereInIds(ids)
      .execute();
  }

  /**
   * API: importFilms - 批量导入电影数据
   * - 业务层查重：检查同名电影是否已存在，已存在则跳过
   * - 将 Excel 导入的数据逐条插入数据库
   * - 跳过名称为空的记录
   * - 对文本字段进行 XSS 过滤
   * @param films 电影数据数组（来自 Excel 解析）
   * @returns 导入结果统计
   */
  async importFilms(films: any[]) {
    const successList: string[] = [];
    const failList: { name: string; error: string }[] = [];
    const skipList: string[] = [];

    for (const film of films) {
      // 跳过名称为空的记录
      if (!film.name) {
        failList.push({ name: film.name || '(空)', error: '名称不能为空' });
        continue;
      }

      // 业务层查重：检查同名电影是否已存在
      const exist = await this.knowledgeFilmEntity.findOne({
        where: { name: film.name }
      });
      if (exist) {
        skipList.push(film.name);
        continue;
      }

      try {
        // 映射 Excel 列名到数据库字段，并进行字段校验与截断
        const filmData = {
          name: truncateString(film.name || '', 200),
          director: truncateString(film.director || film['导演'] || film['导演/作者'] || '', 200),
          year: validateYear(film.year || film['年份']),
          country: truncateString(film.country || film['国家'] || '', 100),
          language: truncateString(film.language || film['语言'] || '', 100),
          mainCharacters: film.mainCharacters || film['主要人物'] || '',
          synopsis: film.synopsis || film['内容简介'] || '',
          backgroundStory: film.backgroundStory || film['背景故事'] || '',
          posters: filterImageUrls(film.posters || film['海报链接']
            ? [film.posters || film['海报链接']]
            : []),
          categoryId: validateCategoryId(film.categoryId ?? film['分类ID'] ?? film['分类'], 45),
          quality: truncateString(film.quality || film['质量'] || film['质量评级'] || 'C', 10),
          watched: film.watched || film['是否已看'] || false,
          doubanRating: validateRating(film.doubanRating || film['豆瓣评分']),
          tmdbRating: validateRating(film.tmdbRating || film['TMDB评分']),
          link: truncateString(film.link || film['链接'] || '', 500),
          honors: film.honors || film['荣誉'] || '',
          highlights: film.highlights || film['亮点所在'] || '',
          whyWorthWatching: film.whyWorthWatching || film['为什么值得一看'] || ''
        };

        // XSS 过滤
        const safeData = escapeObject(filmData, ['posters']);
        await this.knowledgeFilmEntity.insert(safeData);
        successList.push(filmData.name);
      } catch (e: any) {
        failList.push({ name: film.name, error: e.message || '导入失败' });
      }
    }

    return {
      total: films.length,
      success: successList.length,
      fail: failList.length,
      skip: skipList.length,
      successList,
      failList,
      skipList
    };
  }
}
