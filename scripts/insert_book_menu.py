import sqlite3

db_path = r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 获取下一个可用的 ID
cursor.execute("SELECT MAX(id) FROM base_sys_menu")
max_id = cursor.fetchone()[0] or 0
print(f'当前最大菜单 ID: {max_id}')

# 检查书籍管理是否已存在
cursor.execute("SELECT id FROM base_sys_menu WHERE name='书籍管理'")
if cursor.fetchone():
    print('书籍管理菜单已存在，跳过')
else:
    # 1. 书籍管理 (parentId=77 知识库管理, type=0)
    new_id_1 = max_id + 1
    cursor.execute(
        "INSERT INTO base_sys_menu (id, name, parentId, type, router, perms, icon, orderNum, createTime, updateTime) "
        "VALUES (?, '书籍管理', 77, 0, NULL, NULL, 'icon-goods', 2, datetime('now'), datetime('now'))",
        (new_id_1,)
    )
    print(f'插入 书籍管理: id={new_id_1}')

    # 2. 书籍列表 (parentId=书籍管理的ID, type=1)
    new_id_2 = new_id_1 + 1
    cursor.execute(
        "INSERT INTO base_sys_menu (id, name, parentId, type, router, perms, icon, orderNum, createTime, updateTime) "
        "VALUES (?, '书籍列表', ?, 1, '/knowledge/book', NULL, 'icon-menu', 1, datetime('now'), datetime('now'))",
        (new_id_2, new_id_1)
    )
    print(f'插入 书籍列表: id={new_id_2}')

    # 3. 4个权限按钮 (parentId=书籍列表的ID, type=2)
    btns = [
        (new_id_2 + 1, '新增', 'knowledge:book:add', 1),
        (new_id_2 + 2, '删除', 'knowledge:book:delete', 2),
        (new_id_2 + 3, '修改', 'knowledge:book:info,knowledge:book:update', 3),
        (new_id_2 + 4, '查询', 'knowledge:book:page,knowledge:book:list,knowledge:book:info', 4),
    ]
    for btn_id, btn_name, perms, order_num in btns:
        cursor.execute(
            "INSERT INTO base_sys_menu (id, name, parentId, type, router, perms, icon, orderNum, createTime, updateTime) "
            "VALUES (?, ?, ?, 2, NULL, ?, NULL, ?, datetime('now'), datetime('now'))",
            (btn_id, btn_name, new_id_2, perms, order_num)
        )
        print(f'插入 {btn_name}: id={btn_id}')

    conn.commit()
    print('\n菜单插入完成!')

# 验证
print('\n验证菜单树:')
cursor.execute("""
    SELECT id, name, parentId, type, router, orderNum 
    FROM base_sys_menu 
    WHERE parentId = 77 OR parentId IN (SELECT id FROM base_sys_menu WHERE parentId = 77)
    ORDER BY orderNum, id
""")
rows = cursor.fetchall()
for r in rows:
    indent = '  ' if r[2] != 77 else ''
    parent = f'parent={r[2]}'
    print(f'{indent}[{r[0]}] {r[1]:20s} type={r[3]} {r[4] or ""} {parent}')
