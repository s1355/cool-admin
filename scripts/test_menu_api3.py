import urllib.request, json

BASE = 'http://localhost:8001'

# Get captcha full response
req = urllib.request.Request(BASE + '/admin/base/open/captcha')
resp = urllib.request.urlopen(req, timeout=5)
data = json.loads(resp.read())
print('Captcha full:', json.dumps(data, indent=2)[:500])

# Try login with verifyCode
captcha_id = data.get('data', {}).get('captchaId', '')
print('\n captchaId:', captcha_id)

# Try different field names
for code_field in ['code', 'verifyCode', 'verificationCode']:
    for code_val in ['0000', '0', '']:
        login_data = json.dumps({
            "username": "admin", "password": "123456",
            "captchaId": captcha_id,
            code_field: code_val
        }).encode()
        try:
            req2 = urllib.request.Request(BASE + '/admin/base/open/login', data=login_data, method='POST')
            req2.add_header('Content-Type', 'application/json')
            resp2 = urllib.request.urlopen(req2, timeout=5)
            login = json.loads(resp2.read())
            print(f'  {code_field}={code_val} -> code={login.get("code")}: {login.get("message", "")}')
        except Exception as e:
            print(f'  {code_field}={code_val} -> ERROR: {e}')
