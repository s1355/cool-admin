import urllib.request, json

BASE = 'http://localhost:8001'

# Captcha
req = urllib.request.Request(BASE + '/admin/base/open/captcha')
resp = urllib.request.urlopen(req, timeout=5)
data = json.loads(resp.read())
captcha_id = data.get('data', {}).get('captchaId', '')
print('1. Captcha OK')

# Login - field is verifyCode
login_data = json.dumps({
    "username": "admin", "password": "123456",
    "captchaId": captcha_id, "verifyCode": "0000"
}).encode()
req2 = urllib.request.Request(BASE + '/admin/base/open/login', data=login_data, method='POST')
req2.add_header('Content-Type', 'application/json')
resp2 = urllib.request.urlopen(req2, timeout=5)
login = json.loads(resp2.read())
print('2. Login:', login.get('message'))
token = login['data']['token']

# Get permmenu
req3 = urllib.request.Request(BASE + '/admin/base/comm/permmenu')
req3.add_header('Authorization', 'Bearer ' + token)
resp3 = urllib.request.urlopen(req3, timeout=5)
permmenu = json.loads(resp3.read())

menus = permmenu.get('data', {}).get('menu', [])
print('\n3. === MENU STRUCTURE ===')

def print_menus(items, depth=0):
    for m in items:
        router = m.get('router', '')
        view_path = m.get('viewPath', '')
        prefix = '  ' * depth
        id_val = m.get('id', '?')
        name = m.get('name', '?')
        print(f'{prefix}[{id_val}] {name:20s} router={router} viewPath={view_path}')
        child = m.get('childMenus', [])
        if child:
            print_menus(child, depth + 1)

print_menus(menus)

has_book = '书籍管理' in json.dumps(menus)
has_book_list = '书籍列表' in json.dumps(menus)
print(f'\n书籍管理: {"YES" if has_book else "NO"}')
print(f'书籍列表: {"YES" if has_book_list else "NO"}')
