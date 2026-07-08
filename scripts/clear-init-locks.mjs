// 清理 base_sys_conf 中的初始化锁标记
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '38.147.172.28',
    port: 3306,
    user: 'cool-admin',
    password: '7dz2ssmWSNWfsAbK',
    database: 'cool-admin',
  });

  console.log('✅ 已连接到 MySQL');

  // 查看当前 init_* 锁记录
  const [locks] = await conn.execute(
    "SELECT * FROM base_sys_conf WHERE cKey LIKE 'init_%'"
  );
  console.log(`\n当前初始化锁记录 (${locks.length} 条):`);
  locks.forEach(r => console.log(`  - cKey: ${r.cKey}, cValue: ${r.cValue}`));

  // 如果锁记录存在，清理它们
  if (locks.length > 0) {
    const [result] = await conn.execute(
      "DELETE FROM base_sys_conf WHERE cKey LIKE 'init_%'"
    );
    console.log(`\n✅ 已删除 ${result.affectedRows} 条锁记录`);
  } else {
    console.log('\n⚠️ 没有锁记录需要清理');
  }

  // 检查 base_sys_menu 和 base_sys_role 是否为空
  const [menuCount] = await conn.execute("SELECT COUNT(*) as cnt FROM base_sys_menu");
  console.log(`base_sys_menu 记录数: ${menuCount[0].cnt}`);

  const [roleCount] = await conn.execute("SELECT COUNT(*) as cnt FROM base_sys_role");
  console.log(`base_sys_role 记录数: ${roleCount[0].cnt}`);

  const [userCount] = await conn.execute("SELECT COUNT(*) as cnt FROM base_sys_user");
  console.log(`base_sys_user 记录数: ${userCount[0].cnt}`);

  // 验证清理结果
  const [remaining] = await conn.execute(
    "SELECT * FROM base_sys_conf WHERE cKey LIKE 'init_%'"
  );
  console.log(`\n清理后剩余的锁记录: ${remaining.length} 条`);

  await conn.end();
  console.log('\n✅ 数据库操作完成');
}

main().catch(err => {
  console.error('❌ 失败:', err.message);
  process.exit(1);
});
