import urllib.request, json

# 先登录获取 token
login_url = 'http://localhost:8001/admin/base/commune/login'
login_data = json.dumps({
    "username": "admin",
    "password": "123456",
    "captchaId": "",
    "code": ""
}).encode('utf-8')

req = urllib.request.Request(login_url, data=login_data, method='POST')
req.add_header('Content-Type', 'application/json')

try:
    resp = urllib.request.urlopen(req, timeout=5)
    result = json.loads(resp.read())
    print('登录结果:', result.get('code'))
    if result.get('code') == 1000:
        token = result['data']['token']
        print('Token:', token[:20] + '...')
        
        # 获取菜单
        menu_url = 'http://localhost:8001/admin/base/commune/menu'
        menu_req = urllib.request.Request(menu_url)
        menu_req.add_header('Authorization', 'Bearer ' + token)
        menu_resp = urllib.request.urlopen(menu_req, timeout=5)
        menu_data = json.loads(menu_resp.read())
        
        # 打印菜单结构
        def print_menu(items, indent=0):
            for item in items:
                prefix = '  ' * indent
                router = item.get('router', '')
                view_path = item.get('viewPath', '')
                perms = item.get('perms', '')
                print(f'{prefix}[{item.get("id","?")}] {item.get("name","?"):20s} router={router} viewPath={view_path}')
                if item.get('childMenus'):
                    print_menu(item['childMenus'], indent + 1)
        
        print('\n菜单树:')
        print_menu(menu_data if isinstance(menu_data, list) else menu_data.get('data', []))
        print()
        
        # 检查是否有书籍菜单
        menu_str = json.dumps(menu_data)
        if '书籍管理' in menu_str:
            print('书籍管理菜单存在!')
        else:
            print('书籍管理菜单不存在!')
        
        if '书籍列表' in menu_str:
            print('书籍列表菜单存在!')
        else:
            print('书籍列表菜单不存在!')
            
    else:
        print('登录失败:', result.get('message'))
except Exception as e:
    print('错误:', e)
