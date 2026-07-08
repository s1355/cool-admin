import sqlite3, json

db_path = r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 统计总记录
cursor.execute("SELECT COUNT(*) FROM knowledge_book")
total = cursor.fetchone()[0]

# 统计封面为空或为[]的记录
cursor.execute("SELECT COUNT(*) FROM knowledge_book WHERE cover IS NULL OR cover = '[]' OR cover = ''")
no_cover = cursor.fetchone()[0]

# 有封面的
has_cover = total - no_cover

print(f'书籍总数: {total}')
print(f'有封面: {has_cover}')
print(f'缺封面: {no_cover}')
print()

# 列出缺封面的书名和作者
if no_cover > 0:
    cursor.execute("""
        SELECT id, name, author, originalName, doubanRating, quality, priority 
        FROM knowledge_book 
        WHERE cover IS NULL OR cover = '[]' OR cover = ''
        ORDER BY priority, quality, id
    """)
    rows = cursor.fetchall()
    print(f'缺封面的书籍列表 ({len(rows)}本):')
    print('-' * 100)
    for r in rows:
        print(f'  [{r[0]:3d}] {r[1][:35]:35s} 作者: {str(r[2] or "-"):15s} 原名: {str(r[3] or "-"):25s} 豆瓣: {str(r[4] or "-"):5s} 质量: {r[5]} 优先级: {r[6]}')
