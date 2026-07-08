import urllib.request, urllib.parse
import json, re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

# Test searching for "我在现场：性社会学田野调查笔记"
query = urllib.parse.quote('我在现场 性社会学田野调查笔记')
url = f'https://search.douban.com/book/subject_search?search_text={query}'
print(f'URL: {url}')

req = urllib.request.Request(url, headers=headers)
try:
    resp = urllib.request.urlopen(req, timeout=10)
    html = resp.read().decode('utf-8', errors='ignore')
    print(f'Response size: {len(html)} chars')
    
    # Try to find cover images in the HTML
    # Douban uses: <img src="https://img2.doubanio.com/.../sXXXXXX.jpg"
    covers = re.findall(r'https://img[^"\']+doubanio[^"\']+\.jpg', html)
    print(f'Found {len(covers)} cover URLs')
    for c in covers[:3]:
        print(f'  {c}')
    
    # Also try to find book titles
    titles = re.findall(r'<a[^>]+title="([^"]+)"', html)
    print(f'\nBook titles: {titles[:5]}')
    
except urllib.error.HTTPError as e:
    print(f'HTTP Error: {e.code}')
    print(f'Headers: {e.headers}')
except Exception as e:
    print(f'Error: {e}')
