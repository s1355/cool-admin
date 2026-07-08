import urllib.request, json, re

BASE = 'http://localhost:8001'

# Step 1: Get captcha
req = urllib.request.Request(BASE + '/admin/base/open/captcha')
resp = urllib.request.urlopen(req, timeout=5)
captcha_data = json.loads(resp.read())
captcha_id = captcha_data.get('data', {}).get('captchaId', '')
print('1. Captcha ID:', captcha_id)

# Step 2: Login
login_data = json.dumps({"username": "admin", "password": "123456", "captchaId": captcha_id, "code": "0000"}).encode()
req2 = urllib.request.Request(BASE + '/admin/base/open/login', data=login_data, method='POST')
req2.add_header('Content-Type', 'application/json')
resp2 = urllib.request.urlopen(req2, timeout=5)
login = json.loads(resp2.read())
code = login.get('code')
print('2. Login code:', code)
if code != 1000:
    print('Login fail:', login.get('message', ''))
    exit()

token = login['data']['token']
print('   Token:', token[:30] + '...')

# Step 3: Get permmenu
req3 = urllib.request.Request(BASE + '/admin/base/comm/permmenu')
req3.add_header('Authorization', 'Bearer ' + token)
resp3 = urllib.request.urlopen(req3, timeout=5)
permmenu = json.loads(resp3.read())

menus = permmenu.get('data', {}).get('menu', [])
print('\n3. Menus:')

def print_menus(items, depth=0):
    for m in items:
        router = m.get('router', '')
        view_path = m.get('viewPath', '')
        prefix = '  ' * depth
        print(f'{prefix}[{m.get("id","?")}] {m.get("name","?"):20s} r={router} vp={view_path}')
        child = m.get('childMenus', [])
        if child:
            print_menus(child, depth + 1)

print_menus(menus)

flat = json.dumps(menus)
print(f'\n书籍管理: {"YES" if "书籍管理" in flat else "NO"}  书籍列表: {"YES" if "书籍列表" in flat else "NO"}')
