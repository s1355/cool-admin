import sqlite3

db_path = r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='knowledge_book'")
table = cursor.fetchone()
print('表 knowledge_book:', '存在' if table else '不存在')

if table:
    cursor.execute('PRAGMA table_info(knowledge_book)')
    cols = cursor.fetchall()
    print('列数:', len(cols))
    for c in cols:
        print(' ', c[1], '-', c[2])
    
    cursor.execute('SELECT COUNT(*) FROM knowledge_book')
    count = cursor.fetchone()[0]
    print('\n数据行数:', count)
    
    cursor.execute('SELECT id, name, originalName, author, year, quality, doubanRating, tags FROM knowledge_book LIMIT 5')
    rows = cursor.fetchall()
    print('\n前5条数据:')
    for r in rows:
        print(f'  [{r[0]}] {r[1][:25]:25s} | {str(r[4]):6s} | {str(r[5]):4s} | 豆瓣{r[6]}')
    
    cursor.execute('SELECT priority, COUNT(*) FROM knowledge_book GROUP BY priority ORDER BY priority')
    print('\n优先级分布:')
    for r in cursor.fetchall():
        print(f'  {r[0]}: {r[1]}条')
    
    cursor.execute('SELECT quality, COUNT(*) FROM knowledge_book GROUP BY quality ORDER BY quality')
    print('\n品质分布:')
    for r in cursor.fetchall():
        print(f'  {r[0]}: {r[1]}条')

print('\n--- 文件验证 ---')
import os
files = [
    r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\src\modules\knowledge\entity\book.ts',
    r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\src\modules\knowledge\service\book.ts',
    r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\src\modules\knowledge\controller\admin\book.ts',
    r'D:\Users\kaifa\Trae_cn260425\cool-admin-vue\src\modules\knowledge\views\book\index.vue',
    r'D:\Users\kaifa\Trae_cn260425\cool-admin-vue\src\modules\knowledge\views\book\detail.vue',
    r'D:\Users\kaifa\Trae_cn260425\cool-admin-vue\src\modules\knowledge\components\book-cover-edit.vue',
]
for f in files:
    print(f'  {"OK" if os.path.exists(f) else "MISS"}: {os.path.basename(f)}')
