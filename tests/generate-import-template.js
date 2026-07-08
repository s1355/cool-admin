// 生成电影导入模板
const XLSX = require('xlsx');

// 模板数据（表头 + 示例行）
const headers = [
  '名称',
  '导演',
  '年份',
  '国家',
  '语言',
  '主要人物',
  '内容简介',
  '背景故事',
  '海报链接',
  '评分',
  '分类',
  '质量',
  '是否已看',
  '豆瓣评分',
  'TMDB评分',
  '链接',
  '荣誉',
  '亮点所在',
  '为什么值得一看'
];

const exampleRow = [
  '示例电影',
  '张三',
  2024,
  '中国',
  '中文',
  '李四, 王五',
  '这是一部示例电影的内容简介',
  '',
  'https://example.com/poster.jpg',
  7.5,
  '',
  'A',
  false,
  8.0,
  7.8,
  'https://example.com/movie',
  '',
  '',
  ''
];

const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

// 设置列宽
ws['!cols'] = headers.map((h, i) => {
  if (i === 6 || i === 7 || i === 17 || i === 18) {
    return { wch: 40 }; // 长文本列
  }
  if (i === 5 || i === 16) {
    return { wch: 25 };
  }
  return { wch: 15 };
});

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '电影数据');

XLSX.writeFile(wb, 'd:\\Users\\kaifa\\Trae_cn260425\\cool-admin-vue\\public\\电影导入模板.xlsx');
console.log('模板已生成: cool-admin-vue/public/电影导入模板.xlsx');
