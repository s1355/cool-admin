import requests
import re

# 24部推荐电影名称列表（用于匹配）
recommended = [
    ("色戒", "色，戒", "Lust, Caution"),
    ("白日美人", "Belle de Jour"),
    ("钢琴教师", "La Pianiste"),
    ("菊豆", "Ju Dou"),
    ("巴黎野玫瑰", "Betty Blue"),
    ("爱情重伤", "Damage"),
    ("情人", "L'Amant", "The Lover"),
    ("苏州河", "Suzhou River"),
    ("苦月亮", "Bitter Moon"),
    ("春光乍泄", "Happy Together"),
    ("西西里的美丽传说", "Malena"),
    ("大开眼戒", "Eyes Wide Shut"),
    ("蓝宇", "Lan Yu"),
    ("戏梦巴黎", "The Dreamers"),
    ("洛丽塔", "Lolita"),
    ("推拿", "Blind Massage"),
    ("布拉格之恋", "The Unbearable Lightness of Being"),
    ("小姐", "The Handmaiden", "小姐"),
    ("钢琴课", "The Piano"),
    ("失乐园", "Lost Paradise"),
    ("苹果", "Lost in Beijing"),
    ("红高粱", "Red Sorghum"),
    ("亲密", "Intimacy"),
    ("性、谎言和录像带", "Sex, Lies, and Videotape"),
]

# 获取数据库中所有电影
try:
    resp = requests.get("http://localhost:8001/admin/knowledge/film/list?page=1&size=200", timeout=5)
    data = resp.json()
    existing = [item.get("name", "") for item in data.get("list", [])]
except Exception as e:
    print(f"Error: {e}")
    existing = []

print("=== 已存在的电影 ===")
for name in existing:
    print(f"  {name}")

print("\n=== 待导入分析 ===")
new_movies = []
already_have = []
for names in recommended:
    found = False
    main_name = names[0]
    for ename in existing:
        for n in names:
            if n.lower() in ename.lower() or ename.lower() in n.lower():
                found = True
                already_have.append((main_name, ename))
                break
        if found:
            break
    if not found:
        new_movies.append(main_name)

print(f"\n已在数据库: {len(already_have)} 部")
for n, e in already_have:
    print(f"  {n} <-> {e}")

print(f"\n需新增: {len(new_movies)} 部")
for n in new_movies:
    print(f"  {n}")
