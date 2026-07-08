/**
 * 批量更新电影评分脚本
 * 从 erotic-film-database.xlsx 读取 TMDB/豆瓣评分，更新到数据库
 * 评分格式：TMDB 7.0 / 豆瓣 7.6 或 TMDB 7.0
 */
const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();

const EXCEL_FILE = 'd:\\Users\\kaifa\\Trae_cn260425\\erotic-film-database.xlsx';
const DB_FILE = 'd:\\Users\\kaifa\\Trae_cn260425\\cool-admin-demo\\database\\cool-admin.db';

/**
 * 解析评分字符串
 * @param ratingStr 评分字符串，如 "TMDB 7.0 / 豆瓣 7.6" 或 "TMDB 7.4" 或 "-"
 * @returns {tmdbRating: number|null, doubanRating: number|null}
 */
function parseRating(ratingStr) {
    if (!ratingStr || ratingStr === '-' || ratingStr.trim() === '') {
        return { tmdbRating: null, doubanRating: null };
    }

    const str = String(ratingStr).trim();
    let tmdbRating = null;
    let doubanRating = null;

    // 格式: TMDB 7.0 / 豆瓣 7.6
    if (str.includes('/')) {
        const parts = str.split('/');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.startsWith('TMDB')) {
                const match = trimmed.match(/[\d.]+/);
                if (match) tmdbRating = parseFloat(match[0]);
            } else if (trimmed.startsWith('豆瓣')) {
                const match = trimmed.match(/[\d.]+/);
                if (match) doubanRating = parseFloat(match[0]);
            }
        }
    } else {
        // 格式: TMDB 7.0
        const match = str.match(/([\d.]+)/);
        if (match) tmdbRating = parseFloat(match[1]);
    }

    return { tmdbRating, doubanRating };
}

/**
 * 模糊匹配电影名称（处理简繁体、特殊字符差异）
 */
function normalizeName(name) {
    if (!name) return '';
    return String(name)
        .toLowerCase()
        .replace(/[《》]/g, '')  // 去除书名号
        .replace(/\s+/g, '')      // 去除空格
        .replace(/[.,，、。]/g, ''); // 去除标点
}

async function main() {
    console.log('=== 批量更新电影评分 ===\n');

    // 1. 读取 Excel 数据
    console.log('1. 读取 Excel 文件...');
    const wb = XLSX.readFile(EXCEL_FILE);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const excelRows = data.slice(1); // 跳过表头

    // 构建 Excel 评分映射 (标准化名称 -> 评分)
    const excelRatings = new Map();
    for (const row of excelRows) {
        const name = row[1]; // 作品名称
        const ratingStr = row[9]; // 评分列
        if (name) {
            const { tmdbRating, doubanRating } = parseRating(ratingStr);
            const key = normalizeName(name);
            excelRatings.set(key, { name, tmdbRating, doubanRating });
        }
    }
    console.log(`   读取 ${excelRatings.size} 条评分数据\n`);

    // 2. 连接数据库
    console.log('2. 连接数据库...');
    const db = new sqlite3.Database(DB_FILE);

    // 3. 查询数据库电影
    console.log('3. 查询数据库电影...');
    const dbFilms = await new Promise((resolve, reject) => {
        db.all('SELECT id, name FROM knowledge_film', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
    console.log(`   数据库有 ${dbFilms.length} 部电影\n`);

    // 4. 匹配并更新
    console.log('4. 开始匹配更新...\n');
    let updated = 0;
    let noMatch = 0;
    let noRating = 0;
    const updateList = [];

    for (const film of dbFilms) {
        const key = normalizeName(film.name);
        const excelData = excelRatings.get(key);

        if (!excelData) {
            // 尝试模糊匹配（只匹配包含的情况）
            let found = null;
            for (const [k, v] of excelRatings) {
                if (k.includes(key) || key.includes(k)) {
                    found = v;
                    break;
                }
            }
            if (found) excelData = found;
        }

        if (excelData) {
            if (excelData.tmdbRating !== null || excelData.doubanRating !== null) {
                updateList.push({
                    id: film.id,
                    name: film.name,
                    tmdbRating: excelData.tmdbRating,
                    doubanRating: excelData.doubanRating
                });
            } else {
                noRating++;
            }
        } else {
            noMatch++;
        }
    }

    // 5. 执行批量更新
    console.log(`   待更新: ${updateList.length} 部`);
    console.log(`   无匹配: ${noMatch} 部`);
    console.log(`   无评分: ${noRating} 部\n`);

    if (updateList.length > 0) {
        console.log('5. 执行批量更新...\n');
        let successCount = 0;
        let failCount = 0;

        for (const item of updateList) {
            await new Promise((resolve) => {
                const sql = `
                    UPDATE knowledge_film 
                    SET tmdbRating = ?, doubanRating = ?
                    WHERE id = ?
                `;
                db.run(sql, [item.tmdbRating, item.doubanRating, item.id], function(err) {
                    if (err) {
                        console.log(`   ❌ 失败: ${item.name} - ${err.message}`);
                        failCount++;
                    } else {
                        console.log(`   ✓ ${item.name} | TMDB: ${item.tmdbRating} | 豆瓣: ${item.doubanRating}`);
                        successCount++;
                    }
                    resolve();
                });
            });
        }

        console.log(`\n=== 更新完成 ===`);
        console.log(`成功: ${successCount} 部`);
        console.log(`失败: ${failCount} 部`);
    }

    db.close();
    console.log('\n数据库连接已关闭');
}

main().catch(console.error);
