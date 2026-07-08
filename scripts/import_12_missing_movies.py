"""
导入12部缺失的推荐电影
"""
import sqlite3

db_path = r'D:\Users\kaifa\Trae_cn260425\cool-admin-demo\cool.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 分类ID: 情欲电影 = 45
CAT_ID = 45

# 12部缺失电影的数据
# (name, director, year, country, language, mainCharacters, doubanRating, tmdbRating, quality, synopsis, highlights, whyWorthWatching)
movies_data = [
    {
        "name": "钢琴教师",
        "originalName": "La Pianiste",
        "director": "迈克尔·哈内克（Michael Haneke）",
        "year": 2001,
        "country": "奥地利/法国",
        "language": "法语",
        "mainCharacters": "伊莎贝尔·于佩尔（Isabelle Huppert）、伯努瓦·马吉梅尔（Benoît Magimel）",
        "doubanRating": 7.5,
        "tmdbRating": 7.4,
        "quality": "S",
        "priority": 0,
        "synopsis": "维也纳音乐学院严厉的钢琴教授艾丽卡，年近四十仍与专横的母亲同住。当年轻学生瓦尔特的真诚追求试图打破她的防线时，她内心积累了几十年的控制欲、自我压抑和扭曲的渴望以毁灭性的方式被触发。",
        "highlights": "于佩尔的神级表演——戛纳最佳女演员奖，用冷峻面孔传达灵魂的全部痛苦；哈内克的冷暴力美学——每一帧都像手术刀般精确切开人物心理层；古典音乐作为叙事语言——舒伯特、巴赫的音乐是人物内心的外化。",
        "whyWorthWatching": "它比大多数同类题材更不妥协地解剖了情欲关系中的权力博弈。戛纳评审团大奖、最佳女演员、最佳男演员三项大奖集于一身的罕见成就。",
        "honors": "第54届戛纳电影节评审团大奖、最佳女演员、最佳男演员"
    },
    {
        "name": "菊豆",
        "originalName": "Ju Dou",
        "director": "张艺谋",
        "year": 1990,
        "country": "中国",
        "language": "普通话",
        "mainCharacters": "巩俐、李保田、李纬",
        "doubanRating": 8.2,
        "tmdbRating": 7.7,
        "quality": "S",
        "priority": 0,
        "synopsis": "1920年代中国北方山村。年轻的菊豆被卖给残暴的年迈染坊老板杨金山。在日复一日的压迫中，菊豆与杨金山的侄子天青之间产生了无法遏制的感情。染坊里的巨大布匹既是劳作的工具，也成为他们秘密世界的帷幕。",
        "highlights": "张艺谋将色彩提升到主角的位置——染坊中从天而降的巨幅布匹是人物内心欲望的具象化；巩俐的原始而野性的表演，沉默比呐喊更有力量；空间的政治学——整个故事封闭在染坊中，高耸的染布、幽暗的阁楼构成一个个牢笼。",
        "whyWorthWatching": "中国电影史上第一部获得奥斯卡最佳外语片提名的作品。它敢于直视的命题：在礼教森严的社会结构下，人的欲望如何寻找出口，以及当它试图冲破那道墙时，墙会以怎样的方式反噬。",
        "honors": "第63届奥斯卡最佳外语片提名、戛纳电影节路易斯·布努埃尔特别奖、芝加哥电影节金雨果奖"
    },
    {
        "name": "爱情