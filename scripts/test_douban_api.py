import urllib.request, urllib.parse, json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
}

# Test 1: Douban v2 API
query = urllib.parse.quote('亲密陷阱')
url = f'https://api.douban.com/v2/book/search?q={query}'
print('=== Test 1: Douban API v2 ===')
print(f'URL: {url}')
try:
    req = urllib.request.Request(url, headers=headers)
    resp = urllib.request.urlopen(req, timeout=10)
    data = json.loads(resp.read())
    print(f'Total results: {data.get("total", "?")}')
    books = data.get('books', [])
    if books:
        b = books[0]
        print(f'Title: {b.get("title")}')
        print(f'Cover: {b.get("image", "")}')
        print(f'ID: {b.get("id")}')
    else:
        print('No results')
except urllib.error.HTTPError as e:
    print(f'HTTP {e.code}')
    print(e.read().decode()[:500])
except Exception as e:
    print(f'Error: {e}')

print()
print('='*60)

# Test 2: Douban search API (the one used by the search page)
query2 = urllib.parse.quote('亲密陷阱')
url2 = f'https://search.douban.com/api/book/search?q={query2}'
print('=== Test 2: search.douban.com API ===')
print(f'URL: {url2}')
try:
    req2 = urllib.request.Request(url2, headers=headers)
    resp2 = urllib.request.urlopen(req2, timeout=10)
    data2 = json.loads(resp2.read())
    print(json.dumps(data2, indent=2, ensure_ascii=False)[:1000])
except urllib.error.HTTPError as e:
    print(f'HTTP {e.code}')
    print(e.read().decode()[:500])
except Exception as e:
    print(f'Error: {e}')

print()
print('='*60)

# Test 3: Douban subject API
url3 = 'https://book.douban.com/subject/26797939/'
print('=== Test 3: Direct subject page ===')
try:
    req3 = urllib.request.Request(url3, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })
    resp3 = urllib.request.urlopen(req3, timeout=10)
    html = resp3.read().decode('utf-8', errors='ignore')
    import re
    covers = re.findall(r'https://img[^"\']+doubanio[^"\']+\.jpg', html)
    print(f'Covers: {covers[:3]}')
    title = re.findall(r'<title>([^<]+)</title>', html)
    print(f'Title: {title}')
except urllib.error.HTTPError as e:
    print(f'HTTP {e.code}')
except Exception as e:
    print(f'Error: {e}')
