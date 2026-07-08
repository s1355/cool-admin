/**
 * XSS 防护工具 - 对用户输入进行 HTML 实体转义
 * 防止存储型 XSS 攻击，作为纵深防御的一环
 */

/**
 * HTML 实体转义
 * 将特殊字符转换为 HTML 实体，防止脚本注入
 * @param str 输入字符串
 * @returns 转义后的字符串
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') {
    return str;
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 验证图片 URL 是否安全
 * 只允许 http:// 和 https:// 协议，防止 javascript: 等恶意协议
 * @param url 图片 URL
 * @returns 是否安全
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  // 允许 http://、https:// 和相对路径（如 /covers/）
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
}

/**
 * 过滤图片 URL 数组，移除不安全的 URL
 * @param urls 图片 URL 数组
 * @returns 安全的 URL 数组
 */
export function filterImageUrls(urls: string[] | any): string[] {
  if (!Array.isArray(urls)) {
    return [];
  }
  return urls.filter(url => isValidImageUrl(url));
}

/**
 * 截断字符串到指定长度，防止超出数据库字段长度限制
 * @param str 输入字符串
 * @param maxLength 最大长度
 * @returns 截断后的字符串
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str || typeof str !== 'string') {
    return str;
  }
  return str.length > maxLength ? str.substring(0, maxLength) : str;
}

/**
 * 验证并规范化年份字段
 * 只允许 1800-当前年份+10 范围内的合理年份
 * @param year 输入年份
 * @returns 有效的年份数字或 null
 */
export function validateYear(year: any): number | null {
  if (year === null || year === undefined || year === '') {
    return null;
  }
  const num = parseInt(String(year), 10);
  if (isNaN(num)) {
    return null;
  }
  const currentYear = new Date().getFullYear();
  if (num < 1800 || num > currentYear + 10) {
    return null;
  }
  return num;
}

/**
 * 验证评分字段（豆瓣评分、TMDB评分）
 * 只允许 0-10 范围内的数字，精度到小数点后1位
 * @param rating 输入评分
 * @returns 有效的评分数字或 null
 */
export function validateRating(rating: any): number | null {
  if (rating === null || rating === undefined || rating === '') {
    return null;
  }
  // 解析字符串格式的评分，如 "TMDB 7.4" / "豆瓣 8.0"
  if (typeof rating === 'string') {
    const match = rating.match(/(\d+\.?\d*)/);
    if (!match) {
      return null;
    }
    rating = parseFloat(match[1]);
  }
  const num = parseFloat(String(rating));
  if (isNaN(num)) {
    return null;
  }
  if (num < 0 || num > 10) {
    return null;
  }
  return Math.round(num * 10) / 10;
}

/**
 * 验证分类ID
 * 必须是正整数
 * @param categoryId 输入分类ID
 * @param defaultValue 默认值
 * @returns 有效的分类ID
 */
export function validateCategoryId(categoryId: any, defaultValue: number | null = null): number | null {
  if (categoryId === null || categoryId === undefined || categoryId === '') {
    return defaultValue;
  }
  const num = parseInt(String(categoryId), 10);
  if (isNaN(num) || num <= 0) {
    return defaultValue;
  }
  return num;
}

/**
 * 递归转义对象中的所有字符串字段
 * @param obj 输入对象
 * @param excludeFields 排除的字段列表（这些字段不转义，如富文本、JSON等）
 * @returns 转义后的对象
 */
export function escapeObject<T = any>(obj: T, excludeFields: string[] = []): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return escapeHtml(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => escapeObject(item, excludeFields)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result = { ...obj };
    for (const key in result) {
      if (excludeFields.includes(key)) {
        continue;
      }
      result[key] = escapeObject(result[key], excludeFields);
    }
    return result as T;
  }

  return obj;
}
