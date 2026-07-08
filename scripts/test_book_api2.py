import urllib.request, json

url = 'http://localhost:8001/admin/knowledge/book/page?page=1&size=3'
try:
    req = urllib.request.Request(url)
    req.add_header('Accept', 'application/json')
    resp = urllib.request.urlopen(req, timeout=5)
    data = json.loads(resp.read())
    print('API code:', data.get('code'))
    if data.get('code') == 1000:
        rows = data['data']['list']
        print('数据条数:', len(rows))
        for r in rows:
            print('  [%s] %s' % (r.get('id'), r.get('name','?')))
        print('总计:', data['data'].get('total', '?'))
        print('\n书籍管理API正常运行!')
    else:
        print('返回:', str(data)[:300])
except Exception as e:
    print('错误:', e)
