import requests
import json
import hashlib
import os
import glob
import time

BASE = 'http://localhost:8001'
ADMIN_PREFIX = '/admin'

keys = "a02e8413-52ff-467b-b1cb-b968e5bd8765"
hash_key = hashlib.md5(keys.encode('utf-8')).hexdigest()
cache_dir = os.path.join(os.path.expanduser("~"), ".cool-admin", hash_key, "cache")

def get_captcha():
    url = f"{BASE}{ADMIN_PREFIX}/base/open/captcha"
    resp = requests.get(url, timeout=10)
    data = resp.json()
    if data.get("code") == 1000:
        return data["data"]["captchaId"]
    return None

def find_captcha_in_cache(captcha_id):
    cache_files = glob.glob(os.path.join(cache_dir, "*.json"))
    for cache_file in cache_files:
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if data.get("key") == f"verify:img:{captcha_id}":
                return data.get("val")
        except:
            pass
    return None

def login():
    captcha_id = get_captcha()
    if not captcha_id:
        print("Failed to get captcha")
        return None
    
    time.sleep(0.5)
    verify_code = find_captcha_in_cache(captcha_id)
    
    if not verify_code:
        print("Failed to find captcha in cache, trying test/test...")
        login_data = {"username": "admin", "password": "123456", "captchaId": "test", "verifyCode": "test"}
        resp = requests.post(f"{BASE}{ADMIN_PREFIX}/base/open/login", json=login_data, timeout=10)
        result = resp.json()
        if result.get("code") == 1000:
            return result["data"]["token"]
        print(f"Test login failed: {result}")
        return None
    
    login_data = {"username": "admin", "password": "123456", "captchaId": captcha_id, "verifyCode": verify_code}
    resp = requests.post(f"{BASE}{ADMIN_PREFIX}/base/open/login", json=login_data, timeout=10)
    result = resp.json()
    if result.get("code") == 1000:
        return result["data"]["token"]
    print(f"Login failed: {result}")
    return None

def test_filter(name, params, token):
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{BASE}{ADMIN_PREFIX}/knowledge/film/page"
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        result = resp.json()
        code = result.get("code")
        msg = result.get("message", "")
        if code == 1000:
            total = result.get("data", {}).get("pagination", {}).get("total", 0)
            print(f"  ✅ {name}: 成功, 共{total}条")
            return True
        else:
            print(f"  ❌ {name}: 失败, code={code}, msg={msg}")
            return False
    except Exception as e:
        print(f"  ❌ {name}: 异常 - {e}")
        return False

if __name__ == "__main__":
    print("=== 电影筛选功能测试 ===\n")
    
    token = login()
    if not token:
        print("无法登录，退出")
        exit(1)
    print("登录成功！\n")
    
    print("测试筛选参数:\n")
    
    print("1. 无筛选（对照）")
    test_filter("无筛选", {"page": 1, "size": 5}, token)
    
    print("\n2. 质量筛选 - 字符串 'A'")
    test_filter("quality='A'", {"page": 1, "size": 5, "quality": "A"}, token)
    
    print("\n3. 质量筛选 - 数字 0")
    test_filter("quality=0", {"page": 1, "size": 5, "quality": 0}, token)
    
    print("\n4. 已看筛选 - 字符串 'true'")
    test_filter("watched='true'", {"page": 1, "size": 5, "watched": "true"}, token)
    
    print("\n5. 已看筛选 - 布尔值 True")
    test_filter("watched=True", {"page": 1, "size": 5, "watched": True}, token)
    
    print("\n6. 分类筛选 - 数字 45")
    test_filter("categoryId=45", {"page": 1, "size": 5, "categoryId": 45}, token)
    
    print("\n7. 分类筛选 - 字符串 '45'")
    test_filter("categoryId='45'", {"page": 1, "size": 5, "categoryId": "45"}, token)
    
    print("\n8. 关键词搜索")
    test_filter("keyWord='爱'", {"page": 1, "size": 5, "keyWord": "爱"}, token)
    
    print("\n=== 测试完成 ===")
