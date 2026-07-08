import urllib.request, urllib.parse, json

BASE = 'http://localhost:8001'

try:
    req = urllib.request.Request(BASE + '/admin/base/open/captcha')
    resp = urllib.request.urlopen(req, timeout=5)
    data = json.loads(resp.read())
    print(f'Backend is up! Captcha: {data.get("data",{}).get("captchaId","")[:20]}...')
    
    captcha_id = data['data']['captchaId']
    login_data = json.dumps({"username": "admin", "password": "123456", "captchaId": captcha_id, "verifyCode": "0000"}).encode()
    req2 = urllib.request.Request(BASE + '/admin/base/open/login', data=login_data, method='POST')
    req2.add_header('Content-Type', 'application/json')
    resp2 = urllib.request.urlopen(req2, timeout=5)
    login_result = json.loads(resp2.read())
    print(f'Login response code: {login_result.get("code")}')
    
    if login_result.get('code') != 1000:
        print(f'Login failed: {login_result.get("message")}')
        print('Trying with test captcha...')
        login_data2 = json.dumps({"username": "admin", "password": "123456", "captchaId": "test", "verifyCode": "test"}).encode()
        req2b = urllib.request.Request(BASE + '/admin/base/open/login', data=login_data2, method='POST')
        req2b.add_header('Content-Type', 'application/json')
        resp2b = urllib.request.urlopen(req2b, timeout=5)
        login_result2 = json.loads(resp2b.read())
        print(f'Login2 response code: {login_result2.get("code")}')
        if login_result2.get('code') == 1000:
            token = login_result2['data']['token']
        else:
            print('Login2 also failed')
            exit(1)
    else:
        token = login_result['data']['token']
    
    print('Login OK, token obtained')
    
    def test_filter(name, params):
        query = urllib.parse.urlencode(params)
        test_url = BASE + '/admin/knowledge/film/page?' + query
        req_test = urllib.request.Request(test_url)
        req_test.add_header('Authorization', 'Bearer ' + token)
        try:
            resp_test = urllib.request.urlopen(req_test, timeout=10)
            result = json.loads(resp_test.read())
            print(f'\nTest {name}: code={result.get("code")}')
            if result.get('code') == 1000:
                print(f'  ✅ SUCCESS! Total: {result["data"]["pagination"]["total"]}')
                return True
            else:
                print(f'  ❌ Error: {result.get("message","")}')
                return False
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f'\nTest {name}: HTTP {e.code}')
            print(f'  ❌ Body: {body[:300]}')
            return False
    
    test_filter('no filter (baseline)', {'page': 1, 'size': 3})
    test_filter('watched=true', {'page': 1, 'size': 3, 'watched': 'true'})
    test_filter('watched=false', {'page': 1, 'size': 3, 'watched': 'false'})
    test_filter('quality=S', {'page': 1, 'size': 3, 'quality': 'S'})
    test_filter('quality=A', {'page': 1, 'size': 3, 'quality': 'A'})
    test_filter('keyWord=爱', {'page': 1, 'size': 3, 'keyWord': '爱'})
    
    print('\n=== All tests completed ===')
    
except urllib.error.URLError as e:
    print(f'Backend not reachable: {e}')
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f'Error: {e}')
