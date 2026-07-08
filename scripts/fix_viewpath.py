import sqlite3

db_path = r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Check current viewPath for book menu
c.execute('SELECT id, name, viewPath, router FROM base_sys_menu WHERE id IN (89,90)')
print('Before fix:')
for r in c.fetchall():
    print(f'  [{r[0]}] {r[1]:20s} vp={r[2]}, r={r[3]}')

# Check the film list for comparison
c.execute('SELECT id, name, viewPath, router FROM base_sys_menu WHERE id IN (79,84)')
print('\nFilm menus (for reference):')
for r in c.fetchall():
    print(f'  [{r[0]}] {r[1]:20s} vp={r[2]}, r={r[3]}')

# Fix: update viewPath for book list (id=90)
c.execute("UPDATE base_sys_menu SET viewPath='modules/knowledge/views/book/index.vue' WHERE id=90")
conn.commit()

# Verify
print('\nAfter fix:')
c.execute('SELECT id, name, viewPath, router FROM base_sys_menu WHERE id=90')
r = c.fetchone()
print(f'  [{r[0]}] {r[1]:20s} vp={r[2]}, r={r[3]}')
