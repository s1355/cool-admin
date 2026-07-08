import requests
import json
import time
import os
import glob
import hashlib

BASE = 'http://localhost:8001'

# 模拟前端通过 token 验证
keys = "a02e8413-52ff-467b-b1cb-b968e5bd8765"
hash_key = hashlib.md5(keys.encode('utf-8')).hexdigest()
cache_dir = os.path.join(os.path.expanduser("~"), ".cool-admin", hash_key, "cache")

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

# 第一步：获取 captchaId
resp = requests.get(f"{BASE}/admin/base/open/captcha")
captcha = resp.json()
captcha_id = captcha["data"]["captchaId"]
print(f"captchaId: {captcha_id}")

# 等缓存写入
time.sleep(1)
verify_code = find_captcha_in_cache(captcha_id)
print(f"verify_code: {verify_code}")

if not verify_code:
    print("未找到验证码，尝试关闭验证码登录")
    verify_code = "test"
    captcha_id = "test"

# 登录
login_data = {
    "username": "admin",
    "password": "123456",
    "captchaId": captcha_id,
    "verifyCode": verify_code
}
resp = requests.post(f"{BASE}/admin/base/open/login", json=login_data)
result = resp.json()
print(f"登录结果: code={result.get('code')}, msg={result.get('message')}")

if result.get("code") == 1000:
    token = result["data"]["token"]
    print(f"Token: {token[:30]}...")

    # 测试不同的 quality 参数
    headers = {"Authorization": f"Bearer {token}"}

    tests = [
        ("quality='S'", {"page": 1, "size": 5, "quality": "S"}),
        ("quality='A'", {"page": 1, "size": 5, "quality": "A"}),
        ("quality=0 (数字)", {"page": 1, "size": 5, "quality": 0}),
        ("quality='0' (字符串)", {"page": 1, "size": 5, "quality": "0"}),
        ("quality=null", {"page": 1, "size": 5, "quality": None}),
        ("quality='' (空)", {"page": 1, "size": 5, "quality": ""}),
    ]

    for name, params in tests:
        print(f"\n--- {name} ---")
        # POST 请求
        resp = requests.post(f"{BASE}/admin/knowledge/film/page", json=params, headers=headers)
        result = resp.json()
        code = result.get("code")
        msg = result.get("message", "")
        if code == 1000:
            total = result.get("data", {}).get("pagination", {}).get("total", 0)
            print(f"  ✅ 成功, 共{total}条")
        else:
            print(f"  ❌ 失败, code={code}, msg={msg[:200]}")
else:
    print("登录失败")
