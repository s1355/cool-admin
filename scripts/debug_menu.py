import sqlite3, json

db_path = r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check all menu tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%menu%' OR name LIKE '%comm%')")
tables = [t[0] for t in cursor.fetchall()]
print('Menu/Comm tables:', tables)

if 'base_commune_menu' in tables:
    cursor.execute("SELECT COUNT(*) FROM base_commune_menu")
    print('base_commune_menu rows:', cursor.fetchone()[0])
    cursor.execute("SELECT id, name, parentId, type, router, viewPath, orderNum FROM base_commune_menu ORDER BY parentId, orderNum")
    for r in cursor.fetchall():
        print(f'  [{r[0]}] {r[1]:20s} parent={r[2]} type={r[3]} r={r[4]} vp={r[5]} order={r[6]}')

# Check if products menu has the right structure
cursor.execute("SELECT id, name, parentId, type, router, viewPath, orderNum FROM base_sys_menu WHERE parentId=77 OR id=77 ORDER BY orderNum, id")
rows = cursor.fetchall()
print('\nbase_sys_menu 知识库管理(77):')
for r in rows:
    print(f'  [{r[0]}] {r[1]:20s} parent={r[2]} type={r[3]} r={r[4] or "-"} vp={r[5] or "-"} order={r[6]}')

# Check if admin role has correct permissions for menu
cursor.execute("""
    SELECT m.id, m.name, r.name as role_name 
    FROM base_sys_menu m
    LEFT JOIN base_sys_role_menu rm ON m.id = rm.menuId
    LEFT JOIN base_sys_role r ON rm.roleId = r.id
    WHERE m.id IN (89, 90, 91, 92, 93, 94, 77, 78, 84, 79)
    ORDER BY m.id
""")
print('\nMenu-Role mappings:')
for r in cursor.fetchall():
    print(f'  Menu[{r[0]}] {r[1]:20s} assigned to role: {r[2] or "NONE!"}')

# Check the sys_menu table for isShow field
cursor.execute("PRAGMA table_info(base_sys_menu)")
cols = cursor.fetchall()
has_is_show = any(c[1] == 'isShow' for c in cols)
print(f'\nbase_sys_menu has isShow column: {has_is_show}')
if has_is_show:
    cursor.execute("SELECT id, name, isShow FROM base_sys_menu WHERE id IN (89, 90, 77, 78)")
    for r in cursor.fetchall():
        print(f'  [{r[0]}] {r[1]:20s} isShow={r[2]}')

# Check what the menu query actually returns
cursor.execute("SELECT id, name, type, parentId FROM base_sys_menu ORDER BY parentId, orderNum")
all_menus = cursor.fetchall()
print(f'\nTotal base_sys_menu records: {len(all_menus)}')
