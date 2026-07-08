import sqlite3

db_path = r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 检查是否有菜单表
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%menu%'")
tables = cursor.fetchall()
print('菜单相关表:', [t[0] for t in tables])

# 检查 base_sys_menu 表
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='base_sys_menu'")
if cursor.fetchone():
    cursor.execute("SELECT id, name, parentId, router, type, perms, orderNum FROM base_sys_menu ORDER BY parentId, orderNum")
    rows = cursor.fetchall()
    print('\nbase_sys_menu 表:')
    for r in rows:
        indent = '  ' if r[2] else ''
        indent2 = '    ' if r[2] else ''
        parent_suffix = f' (parentId={r[2]})' if r[2] else ''
        print(f'{indent}[{r[0]}] {r[1]:20s} {str(r[3] or "-"):30s} type={r[4]}{parent_suffix}')
else:
    print('没有 base_sys_menu 表')

# 检查 base_commune_menu 表
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='base_commune_menu'")
if cursor.fetchone():
    cursor.execute("SELECT id, name, parentId, router, type, orderNum FROM base_commune_menu ORDER BY parentId, orderNum")
    rows = cursor.fetchall()
    print('\nbase_commune_menu 表:')
    for r in rows:
        indent = '  ' if r[2] else ''
        parent_suffix = f' (parentId={r[2]})' if r[2] else ''
        print(f'{indent}[{r[0]}] {r[1]:20s} {str(r[3] or "-"):30s} type={r[4]}{parent_suffix}')
else:
    print('没有 base_commune_menu 表')
