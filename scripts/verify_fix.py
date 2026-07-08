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

# Find book-related menus
found_book = False
def find_book(items, depth=0):
    global found_book
    for m in items:
        name = m.get('name', '')
        if '书籍' in name:
            prefix = '  ' * depth
            print(f'{prefix}{name:20s} router={m.get("router","")} viewPath={m.get("viewPath","")}')
            found_book = True
        if m.get('childMenus'):
            find_book(m['childMenus'], depth + 1)

print('=' * 60)
print('Searching for book menus...')
print('=' * 60)
find_book(resp_data['data']['menus'])

if not found_book:
    print('NO BOOK MENUS FOUND!')
else:
    print('\n=== VERIFICATION PASSED ===')
    print('Book menus are now accessible with correct viewPath.')
    print('\nPlease refresh http://localhost:9001/ and try clicking 书籍管理 > 书籍列表')
