"""查询电影表数据 - 验证 posters 字段是否为空"""
import sqlite3
import json
import os

DB_PATH = r'd:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'

if not os.path.exists(DB_PATH):
    print(f'错误: 数据库文件不存在: {DB_PATH}')
    exit(1)

print(f'数据库文件大小: {os.path.getsize(DB_PATH)} bytes')

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# 列出所有表
print('\n===== 数据库表列表 =====')
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print(tables)

# 查询 knowledge_film 表的所有数据
print('\n===== knowledge_film 表数据 =====')
try:
    cur.execute('SELECT id, name, director, year, posters, createTime FROM knowledge_film ORDER BY id')
    rows = cur.fetchall()
    print(f'总记录数: {len(rows)}')

    print('\n--- 各电影 posters 字段 ---')
    empty_count = 0
    has_posters_count = 0
    for row in rows:
        posters_val = row['posters']
        # 检查 posters 字段
        posters_parsed = None
        if posters_val:
            try:
                posters_parsed = json.loads(posters_val) if isinstance(posters_val, str) else posters_val
            except Exception as e:
                posters_parsed = f'(解析失败: {e})'

        is_empty = not posters_val or posters_val == '[]' or posters_val == 'null' or posters_val == ''
        if is_empty:
            empty_count += 1
        else:
            has_posters_count += 1

        print(f'\nID={row["id"]}: {row["name"]}')
        print(f'  posters 原始值: {repr(posters_val)[:200] if posters_val else "(空)"}')
        print(f'  posters 解析后: {posters_parsed}')
        print(f'  是否为空: {is_empty}')

    print(f'\n===== 统计 =====')
    print(f'总记录: {len(rows)}')
    print(f'有海报数据: {has_posters_count}')
    print(f'无海报数据(空): {empty_count}')

    # 检查表结构
    print('\n===== knowledge_film 表结构 =====')
    cur.execute('PRAGMA table_info(knowledge_film)')
    for col in cur.fetchall():
        print(f'  {col["name"]} ({col["type"]}) nullable={col["notnull"]==0} default={col["dflt_value"]}')

except Exception as e:
    print(f'查询失败: {e}')

conn.close()
