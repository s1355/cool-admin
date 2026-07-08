const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: '38.147.172.28', port: 3306,
    user: 'cool-admin', password: '7dz2ssmWSNWfsAbK',
    database: 'cool-admin',
  });
  console.log('已连接 MySQL');

  // 查看当前锁记录
  const [locks] = await conn.execute("SELECT cKey, cValue FROM base_sys_conf WHERE cKey LIKE 'init_%'");
  console.log('初始化锁记录:', locks.length, '条');
  locks.forEach(r => console.log(' ', r.cKey, '=', r.cValue));

  // 删除锁记录
  if (locks.length > 0) {
    const [result] = await conn.execute("DELETE FROM base_sys_conf WHERE cKey LIKE 'init_%'");
    console.log('已删除', result.affectedRows, '条锁记录');
  } else {
    console.log('无需清理');
  }

  // 检查各表状态
  const [menu] = await conn.execute("SELECT COUNT(*) AS cnt FROM base_sys_menu");
  console.log('base_sys_menu:', menu[0].cnt, '条');

  const [role] = await conn.execute("SELECT COUNT(*) AS cnt FROM base_sys_role");
  console.log('base_sys_role:', role[0].cnt, '条');

  const [usr] = await conn.execute("SELECT COUNT(*) AS cnt FROM base_sys_user");
  console.log('base_sys_user:', usr[0].cnt, '条');

  // 验证清理结果
  const [remains] = await conn.execute("SELECT COUNT(*) AS cnt FROM base_sys_conf WHERE cKey LIKE 'init_%'");
  console.log('清理后锁记录:', remains[0].cnt, '条');

  await conn.end();
  console.log('完成');
})().catch(e => { console.error('失败:', e.message); process.exit(1); });
