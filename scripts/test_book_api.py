import urllib.request, json

url = 'http://localhost:8001/admin/knowledge/book/page?page=1&size=3'
try:
    req = urllib.request.Request(url)
    resp = urllib.request.urlopen(req, timeout=5)
    data = json.loads(resp.read())
    code = data.get('code')
    print('API code:', code)
    if code == 1000:
        rows = data['data']['list']
        print('数据条数:', len(rows))
        for r in rows:
            print('  [%s] %s | %s | %s' % (r.get('id'), r.get('name','?'), r.get('author','?'), r.get('quality','?')))
        print('合计:', data['data'].get('total', '?'))
    else:
        print('返回:', str(data)[:300])
except Exception as e:
    print('错误:', e)
