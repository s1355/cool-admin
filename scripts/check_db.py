import sqlite3
import os

# 连接 SQLite 数据库
db_path = r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'
if not os.path.exists(db_path):
    print(f"DB not found: {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 查询所有表
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("=== Tables ===")
for t in tables:
    print(f"  {t[0]}")

# 查询电影表
print("\n=== Films ===")
try:
    cursor.execute("SELECT id, name, year, country, doubanRating FROM knowledge_film ORDER BY id")
    films = cursor.fetchall()
    print(f"Total: {len(films)}")
    for f in films:
        print(f"  {f[0]}: {f[1]} ({f[2]}) [{f[3]}] 豆{f[4]}")
except Exception as e:
    print(f"Error: {e}")

conn.close()
