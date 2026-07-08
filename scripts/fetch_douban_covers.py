import urllib.request, urllib.parse
import sqlite3
import re
import time
import json

# DB
db_path = r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Headers for Douban
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

# Get books without covers - process by priority
cursor.execute("""
    SELECT id, name, author, originalName, doubanRating 
    FROM knowledge_book 
    WHERE cover IS NULL OR cover = '[]' OR cover = ''
    ORDER BY 
        CASE priority 
            WHEN 'P0' THEN 0 
            WHEN 'P1' THEN 1 
            WHEN 'P2' THEN 2 
            WHEN 'P3' THEN 3 
            ELSE 4 
        END,
        quality, id
""")
books = cursor.fetchall()
print(f'需要抓取封面的书籍: {len(books)} 本\n')

# Track results
success = 0
failed = 0
skipped = 0

# Process each book
for idx, (book_id, name, author, original_name, rating) in enumerate(books, 1):
    # Build search query
    search_terms = name
    if author and author != '-' and author != '':
        # Add just the first author name
        first_author = author.replace('、', ' ').split()[0] if '、' in author else author.split()[0]
        search_terms = f'{name} {first_author}'
    
    # Also try original name if available
    if original_name and original_name != '-' and original_name != '':
        pass  # Keep Chinese search as primary
    
    query = urllib.parse.quote(search_terms[:50])  # Limit query length
    url = f'https://search.douban.com/book/subject_search?search_text={query}'
    
    try:
        req = urllib.request.Request(url, headers=headers)
        resp = urllib.request.urlopen(req, timeout=10)
        html = resp.read().decode('utf-8', errors='ignore')
        
        # Find cover URL
        covers = re.findall(r'https://img[^"\']+doubanio[^"\']+\.jpg', html)
        
        if covers:
            cover_url = covers[0]
            # Store as array format expected by frontend
            cover_json = json.dumps([{'url': cover_url}])
            
            cursor.execute("UPDATE knowledge_book SET cover=? WHERE id=?", (cover_json, book_id))
            conn.commit()
            success += 1
            status = '✓'
        else:
            # Try searching with just the name (shorter)
            short_query = urllib.parse.quote(name[:30])
            url2 = f'https://search.douban.com/book/subject_search?search_text={short_query}'
            req2 = urllib.request.Request(url2, headers=headers)
            resp2 = urllib.request.urlopen(req2, timeout=10)
            html2 = resp2.read().decode('utf-8', errors='ignore')
            covers2 = re.findall(r'https://img[^"\']+doubanio[^"\']+\.jpg', html2)
            
            if covers2:
                cover_url = covers2[0]
                cover_json = json.dumps([{'url': cover_url}])
                cursor.execute("UPDATE knowledge_book SET cover=? WHERE id=?", (cover_json, book_id))
                conn.commit()
                success += 1
                status = '✓'
            else:
                failed += 1
                status = '✗'
        
        print(f'{idx:3d}. {status} [{book_id:3d}] {name[:30]:30s} -> 封面: {"成功" if status == "✓" else "未找到"}')
        
    except urllib.error.HTTPError as e:
        print(f'{idx:3d}. ⚠ HTTP{e.code} [{book_id:3d}] {name[:30]:30s}')
        failed += 1
    except urllib.error.URLError as e:
        print(f'{idx:3d}. ⚠ 网络错误 [{book_id:3d}] {name[:30]:30s} - {str(e.reason)[:30]}')
        failed += 1
    except Exception as e:
        print(f'{idx:3d}. ⚠ 错误 [{book_id:3d}] {name[:30]:30s} - {str(e)[:50]}')
        failed += 1
    
    # Rate limiting - be nice to Douban
    time.sleep(1.5 + (idx % 3) * 0.5)  # 1.5-2.5 seconds between requests

print(f'\n{"="*50}')
print(f'完成! 成功: {success}, 失败: {failed}, 跳过: {skipped}')

# Final summary
cursor.execute("SELECT COUNT(*) FROM knowledge_book WHERE cover IS NOT NULL AND cover != '[]' AND cover != ''")
has_cover = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM knowledge_book WHERE cover IS NULL OR cover = '[]' OR cover = ''")
no_cover = cursor.fetchone()[0]
print(f'当前状态: 有封面: {has_cover}, 缺封面: {no_cover}')
