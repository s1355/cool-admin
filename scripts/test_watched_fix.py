import urllib.request, urllib.parse, json

BASE = 'http://localhost:8001'

# Check if backend is up
try:
    req = urllib.request.Request(BASE + '/admin/base/open/captcha')
    resp = urllib.request.urlopen(req, timeout=5)
    data = json.loads(resp.read())
    print(f'Backend is up! Captcha: {data.get("data",{}).get("captchaId","")[:20]}...')
    
    # Login
    captcha_id = data['data']['captchaId']
    login_data = json.dumps({"username": "admin", "password": "123456", "captchaId": captcha_id, "verifyCode": "0000"}).encode()
    req2 = urllib.request.Request(BASE + '/admin/base/open/login', data=login_data, method='POST')
    req2.add_header('Content-Type', 'application/json')
    resp2 = urllib.request.urlopen(req2, timeout=5)
    token = json.loads(resp2.read())['data']['token']
    print('Login OK')
    
    # Test film page with watched filter
    test_url = BASE + '/admin/knowledge/film/page?page=1&size=3&watched=true'
    req3 = urllib.request.Request(test_url)
    req3.add_header('Authorization', token)
    try:
        resp3 = urllib.request.urlopen(req3, timeout=5)
        result = json.loads(resp3.read())
        print(f'\nTest watched=true: code={result.get("code")}')
        if result.get('code') == 1000:
            print(f'  Total: {result["data"]["total"]}')
            print(f'  SUCCESS! watched filter works!')
        else:
            print(f'  Error: {result.get("message","")}')
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'\nTest watched=true: HTTP {e.code}')
        print(f'  Body: {body[:200]}')
    
    # Test with watched=false
    test_url2 = BASE + '/admin/knowledge/film/page?page=1&size=3&watched=false'
    req4 = urllib.request.Request(test_url2)
    req4.add_header('Authorization', token)
    try:
        resp4 = urllib.request.urlopen(req4, timeout=5)
        result2 = json.loads(resp4.read())
        print(f'\nTest watched=false: code={result2.get("code")}')
        if result2.get('code') == 1000:
            print(f'  Total: {result2["data"]["total"]}')
            print(f'  SUCCESS!')
        else:
            print(f'  Error: {result2.get("message","")}')
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'\nTest watched=false: HTTP {e.code}')
        print(f'  Body: {body[:200]}')
    
    # Test quality filter
    test_url3 = BASE + '/admin/knowledge/film/page?page=1&size=3&quality=S'
    req5 = urllib.request.Request(test_url3)
    req5.add_header('Authorization', token)
    try:
        resp5 = urllib.request.urlopen(req5, timeout=5)
        result3 = json.loads(resp5.read())
        print(f'\nTest quality=S: code={result3.get("code")}')
        if result3.get('code') == 1000:
            print(f'  Total: {result3["data"]["total"]}')
            print(f'  SUCCESS!')
        else:
            print(f'  Error: {result3.get("message","")}')
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'\nTest quality=S: HTTP {e.code}')
        print(f'  Body: {body[:200]}')
    
except urllib.error.URLError as e:
    print(f'Backend not reachable: {e}')
except Exception as e:
    print(f'Error: {e}')
