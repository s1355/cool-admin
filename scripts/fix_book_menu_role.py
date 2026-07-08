import sqlite3

db_path = r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 检查角色菜单表
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='base_sys_role_menu'")
if not cursor.fetchone():
    print('没有 base_sys_role_menu 表')
    exit()

# 获取所有角色
cursor.execute("SELECT id, name FROM base_sys_role")
roles = cursor.fetchall()
print('角色列表:')
for r in roles:
    print(f'  [{r[0]}] {r[1]}')

# 获取书籍菜单的 ID (89-94)
book_menu_ids = [89, 90, 91, 92, 93, 94]

# 对每个角色检查并插入
for role_id, role_name in roles:
    inserted = 0
    for menu_id in book_menu_ids:
        cursor.execute(
            "SELECT id FROM base_sys_role_menu WHERE roleId=? AND menuId=?",
            (role_id, menu_id)
        )
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO base_sys_role_menu (roleId, menuId, createTime, updateTime) VALUES (?, ?, datetime('now'), datetime('now'))",
                (role_id, menu_id)
            )
            inserted += 1
    print(f'角色 [{role_name}] 新增 {inserted} 条菜单权限')

conn.commit()
print('\n完成!')
