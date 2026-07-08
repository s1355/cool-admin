import sqlite3
import re

db_path = r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 读取所有电影
cursor.execute("SELECT id, name FROM knowledge_film")
existing = {row[0]: row[1] for row in cursor.fetchall()}
print(f"数据库中已有: {len(existing)} 部电影")

# 24部推荐电影的数据
movies_data = [
    # (name, originalName, director, year, country, douban, tmdb, quality, priority, category, synopsis)
    ("色戒", "Lust, Caution", "李安", 2007, "中国", 8.7, 7.5, "S", "P0", "情欲经典", "1942年抗日战争时期的上海，女学生王佳芝以麦太太身份接近汪伪特务头子易先生。"),
    ("白日美人", "Belle de Jour", "路易斯·布努埃尔", 1967, "法国/意大利", 7.6, 7.6, "S", "P0", "情欲经典", "巴黎中产阶级少妇赛芙琳过着体面生活，却在白日梦中幻想施虐受虐。"),
    ("钢琴教师", "La Pianiste", "迈克尔·哈内克", 2001, "奥地利/法国", 7.5, 7.4, "S", "P0", "情欲经典", "维也纳钢琴教授艾丽卡在控制与压抑中生活，与年轻学生瓦尔特发生冲突。"),
    ("菊豆", "Ju Dou", "张艺谋", 1990, "中国", 8.2, 7.7, "S", "P0", "情欲经典", "1920年代中国北方山村，菊豆与染坊侄子天青之间无法遏制的感情。"),
    ("巴黎野玫瑰", "37°2 le matin", "让-雅克·贝奈克斯", 1986, "法国", 8.1, 7.3, "S", "P1", "情欲经典", "法国南部海滨小镇，杂工佐格与美丽女孩贝蒂踏上不计后果的旅程。"),
    ("爱情重伤", "Damage", "路易·马勒", 1992, "英国/法国", 7.4, 6.9, "A", "P1", "情欲经典", "英国国会议员斯蒂芬与儿子未婚妻安娜的隐秘恋情。"),
    ("情人", "L'Amant", "让-雅克·阿诺", 1992, "法国/英国/越南", 8.2, 6.8, "S", "P0", "情欲经典", "1929年法属印度支那，15岁法国少女与中国富家子弟的跨种族恋情。"),
    ("苏州河", "Suzhou River", "娄烨", 2000, "中国", 8.2, 7.4, "S", "P0", "情欲经典", "世纪之交上海，送货骑手马达与少女牡丹在苏州河边的故事。"),
    ("苦月亮", "Bitter Moon", "罗曼·波兰斯基", 1992, "法国/英国", 8.4, 7.2, "S", "P0", "情欲经典", "豪华邮轮上英国夫妇与法国女人及其瘫痪丈夫的欲望博弈。"),
    ("春光乍泄", "Happy Together", "王家卫", 1997, "中国香港", 8.9, 7.7, "S", "P0", "情欲经典", "何宝荣与黎耀辉从香港到阿根廷，恋人之间的反复离开与重逢。"),
    ("西西里的美丽传说", "Malena", "朱塞佩·托纳多雷", 2000, "意大利", 8.9, 7.4, "S", "P0", "情欲经典", "1940年西西里小镇，12岁少年雷纳多对玛莲娜的执念凝视。"),
    ("大开眼戒", "Eyes Wide Shut", "斯坦利·库布里克", 1999, "美国/英国", 8.1, 7.5, "S", "P0", "情欲经典", "纽约医生比尔因妻子坦白而在圣诞夜游历各种欲望场所。"),
    ("蓝宇", "Lan Yu", "关锦鹏", 2001, "中国香港", 8.2, 7.1, "A", "P1", "情欲经典", "1988年北京，高干子弟陈捍东与穷学生蓝宇的多年感情。"),
    ("戏梦巴黎", "The Dreamers", "贝纳尔多·贝托鲁奇", 2003, "法国/英国/意大利", 7.9, 7.1, "A", "P1", "情欲经典", "1968年巴黎五月风暴前夕，三个年轻人用电影代替对话。"),
    ("洛丽塔", "Lolita", "阿德里安·莱恩", 1997, "美国/法国", 8.0, 6.9, "A", "P1", "情欲经典", "中年文学教授亨伯特与14岁少女多洛蕾丝的危险迷恋。"),
    ("推拿", "Blind Massage", "娄烨", 2014, "中国", 8.0, 7.2, "S", "P0", "情欲经典", "南京盲人按摩中心，一群视障按摩师在黑暗中编织情感。"),
    ("布拉格之恋", "The Unbearable Lightness of Being", "菲利普·考夫曼", 1988, "美国", 8.2, 7.3, "S", "P0", "情欲经典", "1968年布拉格，脑外科医生托马斯在婚姻与自由间的平衡。"),
    ("小姐", "The Handmaiden", "朴赞郁", 2016, "韩国", 8.6, 8.1, "S", "P0", "情欲经典", "1930年代日据朝鲜，侍女淑熙与贵族小姐秀子的感情觉醒。"),
    ("钢琴课", "The Piano", "简·坎皮恩", 1993, "新西兰/澳大利亚/法国", 8.1, 7.6, "S", "P0", "情欲经典", "19世纪哑女艾达远嫁新西兰殖民地，以钢琴课重获声音。"),
    ("失乐园", "Lost Paradise", "森田芳光", 1997, "日本", 7.4, 6.8, "A", "P1", "情欲经典", "东京中年编辑久木与人妻书法教师凛子的禁忌之爱。"),
    ("苹果", "Lost in Beijing", "李玉", 2007, "中国", 6.9, 6.7, "B", "P2", "情欲经典", "北京打工妹苹果被洗脚城老板侵犯后展开的命运交易。"),
    ("红高粱", "Red Sorghum", "张艺谋", 1988, "中国", 8.5, 7.4, "S", "P0", "情欲经典", "山东高密，九儿与轿夫余占鳌在高粱地里的原始激情。"),
    ("亲密", "Intimacy", "帕特里斯·夏侯", 2001, "法国/英国", 7.8, 6.8, "A", "P1", "情欲经典", "伦敦中年男人与女人每周的匿名亲密仪式。"),
    ("性、谎言和录像带", "Sex, Lies, and Videotape", "史蒂文·索德伯格", 1989, "美国", 7.7, 7.2, "S", "P0", "情欲经典", "约翰与安的婚姻被秘密情人辛西娅和旧友格雷厄姆打破。"),
]

# 获取分类映射
cursor.execute("SELECT id, name FROM knowledge_film_category")
categories = {row[1]: row[0] for row in cursor.fetchall()}

# 分类名映射 (数据库的分类ID)
def get_category_id(name):
    for cn, cid in categories.items():
        if name in cn or cn in name:
            return cid
    return None

# 检查已存在
to_insert = []
already_have = []
for m in movies_data:
    name = m[0]
    # 检查是否已存在
    found = False
    for eid, ename in existing.items():
        for n in [name, m[1] if m[1] else ""]:
            if n and (n.lower() in ename.lower() or ename.lower() in n.lower()):
                already_have.append((name, ename, eid))
                found = True
                break
        if found:
            break
    if not found:
        to_insert.append(m)

print(f"\n已存在: {len(already_have)} 部")
for n, e, i in already_have:
    print(f"  {n} <-> [{i}] {e}")

print(f"\n待新增: {len(to_insert)} 部")
for m in to_insert:
    print(f"  {m[0]}")

# 准备SQL
if to_insert:
    print("\n=== 准备插入数据 ===")
    for m in to_insert:
        name, originalName, director, year, country, douban, tmdb, quality, priority, category, synopsis = m
        cat_id = get_category_id(category)
        # 用导演作为主信息附加到内容简介
        full_synopsis = f"导演：{director}。{synopsis}"

        cursor.execute("""
            INSERT INTO knowledge_film
            (name, originalName, director, year, country, synopsis, doubanRating, tmdbRating, quality, priority, categoryId, createTime, updateTime)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (name, originalName, director, year, country, full_synopsis, douban, tmdb, quality, priority, cat_id))
        print(f"  + {name} (分类: {cat_id})")

    conn.commit()
    print(f"\n✅ 成功插入 {len(to_insert)} 部电影")
else:
    print("\n所有电影已存在，无需插入")

# 最终统计
cursor.execute("SELECT COUNT(*) FROM knowledge_film")
print(f"\n数据库现有电影总数: {cursor.fetchone()[0]}")

conn.close()
