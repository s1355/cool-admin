import requests, os

BASE = r'D:\Users\kaifa\Trae_cn260425\downloads'
UA = {'User-Agent': 'Mozilla/5.0'}

pages = [
    ('c2 path', 'http://www.npc.gov.cn/npc/c2/c30834/201905/t20190521_278505.html'),
    ('c30834 path', 'http://www.npc.gov.cn/npc/c30834/201905/t20190521_278505.html'),
]
kw = '\u6bcd\u5e7c\u4fdd\u5065'  # 母婴保健
for name, url in pages:
    r = requests.get(url, headers=UA, timeout=30)
    text = r.content.decode('utf-8', errors='replace')
    has = kw in text
    print(f'{name}: {len(r.content)} bytes, has law text: {has}')

# check guangde version
r = requests.get('https://www.guangde.gov.cn/Jczwgk/show/2373518.html', headers=UA, timeout=30)
text = r.content.decode('utf-8', errors='replace')
print(f'guangde: {len(r.content)} bytes, has law text: {kw in text}')
if kw in text:
    d = os.path.join(BASE, '11-\u5987\u5e7c\u4fdd\u5065')
    with open(os.path.join(d, '09-\u6bcd\u5e7c\u4fdd\u5065\u6cd52017\u4fee\u6b63.html'), 'wb') as f:
        f.write(r.content)
    print('  -> saved over NPC version')

# 基本医疗卫生与健康促进法 from guangde
kw2 = '\u57fa\u672c\u533b\u7597\u536b\u751f'
r = requests.get('https://www.guangde.gov.cn/Jczwgk/show/2375080.html', headers=UA, timeout=30)
text = r.content.decode('utf-8', errors='replace')
print(f'guangde basic law: {len(r.content)} bytes, has text: {kw2 in text}')
if kw2 in text:
    d = os.path.join(BASE, '01-\u57fa\u7840\u6cd5\u5f8b\u4f53\u7cfb')
    with open(os.path.join(d, '21-\u57fa\u672c\u533b\u7597\u536b\u751f\u4e0e\u5065\u5eb7\u4fc3\u8fdb\u6cd52019.html'), 'wb') as f:
        f.write(r.content)
    print('  -> saved!')

# 传染病防治法 from guangde
kw3 = '\u4f20\u67d3\u75c5\u9632\u6cbb\u6cd5'
r = requests.get('https://www.guangde.gov.cn/Jczwgk/show/2372086.html', headers=UA, timeout=30)
text = r.content.decode('utf-8', errors='replace')
print(f'guangde infectious: {len(r.content)} bytes, has text: {kw3 in text}')
if kw3 in text:
    d = os.path.join(BASE, '01-\u57fa\u7840\u6cd5\u5f8b\u4f53\u7cfb')
    with open(os.path.join(d, '22-\u4f20\u67d3\u75c5\u9632\u6cbb\u6cd52013\u4fee\u6b63.html'), 'wb') as f:
        f.write(r.content)
    print('  -> saved!')

# 中医药法 from linyi.gov.cn (or other)
kw4 = '\u4e2d\u533b\u836f\u6cd5'
r = requests.get('https://www.guangde.gov.cn/Jczwgk/show/2375438.html', headers=UA, timeout=30)
text = r.content.decode('utf-8', errors='replace')
print(f'guangde TCM: {len(r.content)} bytes, has text: {kw4 in text}')

# 精神卫生法
kw5 = '\u7cbe\u795e\u536b\u751f\u6cd5'
r = requests.get('https://www.guangde.gov.cn/Jczwgk/show/2373540.html', headers=UA, timeout=30)
text = r.content.decode('utf-8', errors='replace')
print(f'guangde mental: {len(r.content)} bytes, has text: {kw5 in text}')

# Final count
total = sum(len([f for f in files if f.endswith(('.pdf','.html'))]) for _,_,files in os.walk(BASE))
print(f'\nTotal: {total}')
