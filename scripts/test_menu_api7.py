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

# Get permmenu WITHOUT Bearer prefix (works)
req3 = urllib.request.Request(BASE + '/admin/base/comm/permmenu')
req3.add_header('Authorization', token)
resp3 = urllib.request.urlopen(req3, timeout=5)
data = json.loads(resp3.read())

print('Menu data type:', type(data['data']['menu']))
print('Menu length:', len(data['data']['menu']))
print()

# Print first 2 menus
for m in data['data']['menu'][:2]:
    print(json.dumps(m, indent=2, ensure_ascii=False)[:500])
    print('...')

# Check book perms in perms list
perms = data['data'].get('perms', [])
book_perms = [p for p in perms if 'knowledge:book' in p]
print(f'Book perms: {book_perms}')
