// 直接查询数据库，验证 posters 字段的存储格式
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'cool-admin-demo', 'cool.db');
console.log('数据库路径:', dbPath);

try {
  const db = new Database(dbPath);

  console.log('\n=== Step 1: 查询电影表结构 ===');
  const columns = db.prepare("PRAGMA table_info(knowledge_film)").all();
  console.log('表字段:');
  columns.forEach(col => {
    console.log(`  ${col.name}: ${col.type} (nullable: ${col.notnull === 0 ? '是' : '否'})`);
  });

  console.log('\n=== Step 2: 查询电影数据条数 ===');
  const count = db.prepare("SELECT COUNT(*) as cnt FROM knowledge_film").get();
  console.log('总条数:', count.cnt);

  console.log('\n=== Step 3: 查询前5条数据的 posters 字段 ===');
  const rows = db.prepare("SELECT id, name, posters FROM knowledge_film LIMIT 5").all();
  rows.forEach(row => {
    console.log(`\nID: ${row.id}, 名称: ${row.name}`);
    console.log('  posters 值:', row.posters);
    console.log('  posters 类型:', typeof row.posters);
    console.log('  posters 是 JSON 字符串吗?', isJsonString(row.posters));
  });

  console.log('\n=== Step 4: 统计 posters 类型分布 ===');
  const allRows = db.prepare("SELECT posters FROM knowledge_film").all();
  let nullCount = 0, stringCount = 0, jsonArrayCount = 0, jsonObjCount = 0, emptyString = 0;
  allRows.forEach(row => {
    const p = row.posters;
    if (p === null) nullCount++;
    else if (typeof p === 'string') {
      stringCount++;
      if (p === '') emptyString++;
      else {
        try {
          const parsed = JSON.parse(p);
          if (Array.isArray(parsed)) jsonArrayCount++;
          else jsonObjCount++;
        } catch (e) {
          // 普通字符串
        }
      }
    }
  });
  console.log('  null:', nullCount);
  console.log('  字符串:', stringCount);
  console.log('    其中空字符串:', emptyString);
  console.log('    其中JSON数组:', jsonArrayCount);
  console.log('    其中JSON对象:', jsonObjCount);

  console.log('\n=== Step 5: 有海报数据的电影 ===');
  const withPosters = db.prepare(`
    SELECT id, name, posters 
    FROM knowledge_film 
    WHERE posters IS NOT NULL 
      AND posters != '' 
      AND posters != '[]'
    LIMIT 5
  `).all();
  console.log('有海报数据的电影:', withPosters.length, '条');
  withPosters.forEach(row => {
    console.log(`  ${row.name}: ${row.posters.substring(0, 80)}`);
  });

  db.close();
} catch (e) {
  console.error('数据库错误:', e.message);
}

function isJsonString(str) {
  if (typeof str !== 'string') return false;
  try { JSON.parse(str); return true; } catch (e) { return false; }
}
