import urllib.request, urllib.parse, re, time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

# Test with a very slow delay - 10 seconds between requests
tests = [
    '亲密陷阱 埃丝特',
    '第二性 波伏娃',
    '亲密关系 罗兰·米勒',
    '性心理学 霭理士',
    '金赛性学报告',
    '非暴力沟通',
    '爱的五种语言',
]

for i, q in enumerate(tests):
    if i > 0:
        print(f'Waiting 10s...')
        time.sleep(10)
    
    query = urllib.parse.quote(q)
    url = f'https://search.douban.com/book/subject_search?search_text={query}'
    print(f'\n[{i+1}] Searching: {q}')
    
    try:
        req = urllib.request.Request(url, headers=headers)
        resp = urllib.request.urlopen(req, timeout=15)
        html = resp.read().decode('utf-8', errors='ignore')
        covers = re.findall(r'https://img[^"\']+doubanio[^"\']+\.jpg', html)
        
        if covers:
            print(f'  ✓ Found: {covers[0][:80]}')
        else:
            # Check what the page says
            if 'captcha' in html.lower() or '验证' in html:
                print(f'  ✗ CAPTCHA page! ({len(html)} chars)')
            elif '没有找到' in html:
                print(f'  ✗ No results found')
            else:
                # Try to find any book link
                links = re.findall(r'<a[^>]+href="(https://book\.douban\.com/subject/\d+/)"', html)
                print(f'  ✗ No covers, {len(links)} book links found')
                if links:
                    print(f'  First link: {links[0]}')
    except Exception as e:
        print(f'  ✗ Error: {e}')
