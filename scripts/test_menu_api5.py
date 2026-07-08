import urllib.request, json

BASE = 'http://localhost:8001'

# Captcha + Login
req = urllib.request.Request(BASE + '/admin/base/open/captcha')
resp = urllib.request.urlopen(req, timeout=5)
data = json.loads(resp.read())
captcha_id = data['data']['captchaId']

login_data = json.dumps({
    "username": "admin", "password": "123456",
    "captchaId": captcha_id, "verifyCode": "0000"
}).encode()
req2 = urllib.request.Request(BASE + '/admin/base/open/login', data=login_data, method='POST')
req2.add_header('Content-Type', 'application/json')
resp2 = urllib.request.urlopen(req2, timeout=5)
login = json.loads(resp2.read())
print('Login response:', json.dumps(login, indent=2)[:400])
print()

# The token might be in a different format or field
token = login['data'].get('token', login['data'].get('accessToken', ''))
print('Token field:', list(login['data'].keys()))
print()

# Try different auth header formats
for auth_format in ['Bearer ' + token, token]:
    req3 = urllib.request.Request(BASE + '/admin/base/comm/permmenu')
    req3.add_header('Authorization', auth_format)
    try:
        resp3 = urllib.request.urlopen(req3, timeout=5)
        permmenu = json.loads(resp3.read())
        print(f'Auth: {auth_format[:40]}... -> OK')
        break
    except urllib.error.HTTPError as e:
        print(f'Auth: {auth_format[:40]}... -> {e.code}')

print()

# If we got here, print menu
menus = permmenu.get('data', {}).get('menu', [])
print('=== MENUS ===')
def pm(items, depth=0):
    for m in items:
        prefix = '  ' * depth
        print(f'{prefix}{m.get("name","?"):20s} r={m.get("router","")} vp={m.get("viewPath","")}')
        if m.get('childMenus'):
            pm(m['childMenus'], depth+1)
pm(menus)

flat = json.dumps(menus)
print(f'\n书籍管理: {"YES" if "书籍管理" in flat else "NO"}')
print(f'书籍列表: {"YES" if "书籍列表" in flat else "NO"}')
