import urllib.request, json

BASE = 'http://localhost:8001'

# Step 1: Login
login_data = json.dumps({"username": "admin", "password": "123456", "captchaId": "", "code": ""}).encode()
req = urllib.request.Request(BASE + '/admin/base/open/login', data=login_data, method='POST')
req.add_header('Content-Type', 'application/json')
resp = urllib.request.urlopen(req, timeout=5)
login = json.loads(resp.read())
code = login.get('code')
print('1. Login code:', code)
if code != 1000:
    print('Login fail:', login.get('message', ''))
    exit()

token = login['data']['token']
print('   Token OK')

# Step 2: Get permmenu
req2 = urllib.request.Request(BASE + '/admin/base/comm/permmenu')
req2.add_header('Authorization', 'Bearer ' + token)
resp2 = urllib.request.urlopen(req2, timeout=5)
permmenu = json.loads(resp2.read())

# 打印菜单部分
menus = permmenu.get('data', {}).get('menu', [])
print('\n2. Menu count:', len(menus))

def print_menus(items, depth=0):
    for m in items:
        router = m.get('router', '')
        view_path = m.get('viewPath', '')
        prefix = '  ' * depth
        print(f'{prefix}[{m.get("id","?")}] {m.get("name","?"):20s} r={router} vp={view_path}')
        if m.get('childMenus'):
            print_menus(m['childMenus'], depth + 1)

print_menus(menus)

# Check for book
flat = json.dumps(menus)
has_book_menu = '书籍管理' in flat
has_book_list = '书籍列表' in flat
print(f'\n书籍管理: {"YES" if has_book_menu else "NO"}  书籍列表: {"YES" if has_book_list else "NO"}')

# Step 3: Route finding simulation - can we find /knowledge/book?
print('\n3. EPS book entry:')
eps_entries = permmenu.get('data', {}).get('eps', [])
for e in eps_entries:
    if 'knowledge/book' in e.get('prefix', ''):
        print(f'   {e["prefix"]} -> {[a["path"] for a in e.get("api",[])]}')
