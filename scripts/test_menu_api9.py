import urllib.request, json

BASE = 'http://localhost:8001'

# Login
req = urllib.request.Request(BASE + '/admin/base/open/captcha')
resp = urllib.request.urlopen(req, timeout=5)
data = json.loads(resp.read())
captcha_id = data['data']['captchaId']
login_data = json.dumps({"username": "admin", "password": "123456", "captchaId": captcha_id, "verifyCode": "0000"}).encode()
req2 = urllib.request.Request(BASE + '/admin/base/open/login', data=login_data, method='POST')
req2.add_header('Content-Type', 'application/json')
resp2 = urllib.request.urlopen(req2, timeout=5)
token = json.loads(resp2.read())['data']['token']

req3 = urllib.request.Request(BASE + '/admin/base/comm/permmenu')
req3.add_header('Authorization', token)
resp3 = urllib.request.urlopen(req3, timeout=5)
resp_data = json.loads(resp3.read())

# Print menu structure
def show_menus(items, depth=0):
    for m in items:
        prefix = '  ' * depth
        r = m.get('router', '')
        vp = m.get('viewPath', '')
        n = m.get('name', '?')
        t = m.get('type', '?')
        print(f'{prefix}[t={t}] {n:20s} r={r} vp={vp}')
        for k in ['id', 'parentId', 'orderNum', 'isShow', 'keepAlive', 'icon']:
            if k in m:
                pass  # for debug
        if m.get('childMenus'):
            show_menus(m['childMenus'], depth + 1)

menus = resp_data['data']['menus']
print(f'Total root menus: {len(menus)}')
show_menus(menus)
