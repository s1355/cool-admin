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

# Get permmenu
req3 = urllib.request.Request(BASE + '/admin/base/comm/permmenu')
req3.add_header('Authorization', token)
resp3 = urllib.request.urlopen(req3, timeout=5)
resp_data = json.loads(resp3.read())

print('Top keys:', list(resp_data.keys()))
print('Data keys:', list(resp_data['data'].keys()))
print()
print('Full response:')
print(json.dumps(resp_data, indent=2, ensure_ascii=False)[:3000])
