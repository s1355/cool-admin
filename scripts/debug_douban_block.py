import urllib.request, urllib.parse
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    # Add cookies to look more like a real browser
    'Cookie': 'bid=1234567890; __utma=1.1234567890.1234567890.1234567890.1234567890.1;',
}

# Test 1: Search for a known book
query = urllib.parse.quote('亲密陷阱 埃丝特·佩瑞尔')
url = f'https://search.douban.com/book/subject_search?search_text={query}'
print('=== Test 1: 亲密陷阱 ===')
print(f'URL: {url}')

req = urllib.request.Request(url, headers=headers)
try:
    resp = urllib.request.urlopen(req, timeout=10)
    html = resp.read().decode('utf-8', errors='ignore')
    print(f'Response size: {len(html)} chars')
    
    # Check for captcha
    if 'captcha' in html.lower() or '验证' in html:
        print('⚠ PAGE RETURNED CAPTCHA!')
    
    # Check for "没有找到"
    if '没有找到' in html:
        print('⚠ "没有找到" detected')
    
    covers = re.findall(r'https://img[^"\']+doubanio[^"\']+\.jpg', html)
    print(f'Covers found: {len(covers)}')
    for c in covers[:3]:
        print(f'  {c}')
    
    # Check title
    titles = re.findall(r'<a[^>]+href="https://book\.douban\.com/subject/\d+/"[^>]*>(.*?)</a>', html)
    print(f'Titles: {titles[:3]}')
    
    # Print first 1000 chars for debugging
    print('\n--- HTML snippet (first 1000 chars) ---')
    print(html[:1000])
except Exception as e:
    print(f'Error: {e}')

print('\n' + '='*60)

# Test 2: Try different User-Agent and no cookies
headers2 = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9',
}
query2 = urllib.parse.quote('亲密陷阱')
url2 = f'https://search.douban.com/book/subject_search?search_text={query2}'
print('=== Test 2: Simple request ===')
req2 = urllib.request.Request(url2, headers=headers2)
try:
    resp2 = urllib.request.urlopen(req2, timeout=10)
    html2 = resp2.read().decode('utf-8', errors='ignore')
    print(f'Response size: {len(html2)} chars')
    covers2 = re.findall(r'https://img[^"\']+doubanio[^"\']+\.jpg', html2)
    print(f'Covers found: {len(covers2)}')
    for c in covers2[:3]:
        print(f'  {c}')
    if 'captcha' in html2.lower() or '验证' in html2:
        print('⚠ CAPTCHA!')
    print('\n--- HTML (first 1500 chars) ---')
    print(html2[:1500])
except Exception as e:
    print(f'Error: {e}')
