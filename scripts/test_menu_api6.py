import urllib.request, json

BASE = 'http://localhost:8001'

# Login
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
token = login['data']['token']

# Get permmenu - try with Bearer prefix
req3 = urllib.request.Request(BASE + '/admin/base/comm/permmenu')
# Use the Same header format as the frontend does
req3.add_header('Authorization', 'Bearer ' + token)
try:
    resp3 = urllib.request.urlopen(req3, timeout=5)
    permmenu = json.loads(resp3.read())
    print('permmenu response:', json.dumps(permmenu, indent=2, ensure_ascii=False)[:2000])
except urllib.error.HTTPError as e:
    print(f'401 with Bearer prefix')
    # Try without Bearer
    req4 = urllib.request.Request(BASE + '/admin/base/comm/permmenu')
    req4.add_header('Authorization', token)
    try:
        resp4 = urllib.request.urlopen(req4, timeout=5)
        permmenu = json.loads(resp4.read())
        print('permmenu (no Bearer):', json.dumps(permmenu, indent=2, ensure_ascii=False)[:2000])
    except:
        print('Still error without Bearer')
