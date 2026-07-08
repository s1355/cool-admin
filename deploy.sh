#!/bin/bash
# ============================================================
# cool-admin 一键部署脚本
# 适用于宝塔面板 / 标准 Linux 服务器
# MySQL 配置：宝塔面板已安装 MySQL，自动建库建用户
# 用法：
#   chmod +x deploy.sh && ./deploy.sh
#   如需自动配置 MySQL，先设置:  export MYSQL_ROOT_PW="你的宝塔MySQLroot密码"
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── MySQL 连接信息（与 config.prod.ts 保持一致） ──────
DB_NAME="cool-admin"
DB_USER="cool-admin"
DB_PASS="7dz2ssmWSNWfsAbK"
DB_HOST="127.0.0.1"
DB_PORT=3306

echo "========================================"
echo "  cool-admin 部署开始"
echo "  项目路径: $PROJECT_DIR"
echo "========================================"

# ── 1. 拉取最新代码 ──────────────────────────────────
echo ""
echo ">>> [1/6] 拉取最新代码..."
cd "$PROJECT_DIR"
git pull

# ── 2. 配置 MySQL ────────────────────────────────────
echo ""
echo ">>> [2/6] 检查 MySQL 配置..."

# 先用已配好的 DB 用户尝试连接，验证是否已就绪
if mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" -e "SELECT 1" "$DB_NAME" 2>/dev/null | grep -q 1; then
    echo "  ✓ 数据库 $DB_NAME 已就绪，跳过配置"
else
    echo "  ! 数据库 $DB_NAME 未就绪，尝试自动创建..."

    # 检查 MySQL 是否已安装
    if ! command -v mysql &> /dev/null; then
        echo "  ✗ MySQL 未安装！请在宝塔面板 → 软件商店 安装 MySQL 后重试"
        exit 1
    fi

    # MySQL root 密码来源：环境变量 > 宝塔默认路径 > 提示输入
    if [ -z "$MYSQL_ROOT_PW" ] && [ -f /www/server/mysql/default.pass ]; then
        MYSQL_ROOT_PW=$(cat /www/server/mysql/default.pass)
    fi

    if [ -z "$MYSQL_ROOT_PW" ]; then
        echo "  请输入宝塔 MySQL root 密码"
        echo "  (后续可通过 export MYSQL_ROOT_PW=\"密码\" 跳过输入)"
        read -r -p "  MySQL root 密码: " MYSQL_ROOT_PW
    fi

    # 创建数据库
    mysql -uroot -p"$MYSQL_ROOT_PW" -h"$DB_HOST" -P"$DB_PORT" \
        -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
    echo "  ✓ 数据库 $DB_NAME 已创建"

    # 创建用户并授权（如果已存在则更新密码）
    mysql -uroot -p"$MYSQL_ROOT_PW" -h"$DB_HOST" -P"$DB_PORT" \
        -e "CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS';"
    mysql -uroot -p"$MYSQL_ROOT_PW" -h"$DB_HOST" -P"$DB_PORT" \
        -e "ALTER USER '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS';"
    mysql -uroot -p"$MYSQL_ROOT_PW" -h"$DB_HOST" -P"$DB_PORT" \
        -e "GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'%'; FLUSH PRIVILEGES;"
    echo "  ✓ 用户 $DB_USER 已创建/更新并授权"

    # 验证配置
    if mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" -e "SELECT 1" "$DB_NAME" 2>/dev/null | grep -q 1; then
        echo "  ✓ MySQL 配置验证通过"
    else
        echo "  ✗ MySQL 配置验证失败，请检查密码或手动在宝塔面板创建数据库"
        exit 1
    fi
fi

# ── 3. 安装后端依赖 ──────────────────────────────────
echo ""
echo ">>> [3/6] 安装后端依赖..."
cd "$PROJECT_DIR/backend"
npm install

# ── 4. 编译后端 ──────────────────────────────────────
echo ""
echo ">>> [4/6] 编译后端 TypeScript..."
npm run build

# ── 5. 启动/重启后端进程 ────────────────────────────
echo ""
echo ">>> [5/6] 启动后端服务..."

if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "cool-admin"; then
        pm2 restart cool-admin
    else
        pm2 start bootstrap.js --name "cool-admin" --cwd "$PROJECT_DIR/backend"
    fi
    pm2 save
    echo "  后端已通过 pm2 启动/重启 (端口 8001)"
else
    OLD_PID=$(lsof -ti:8001 2>/dev/null || true)
    if [ -n "$OLD_PID" ]; then
        echo "  停止旧进程 (PID: $OLD_PID)..."
        kill -9 "$OLD_PID" 2>/dev/null || true
        sleep 1
    fi
    cd "$PROJECT_DIR/backend"
    nohup node bootstrap.js > run.log 2>&1 &
    echo "  后端已通过 nohup 启动 (PID: $!, 端口 8001)"
    sleep 2
fi

# ── 6. 构建前端 ──────────────────────────────────────
echo ""
echo ">>> [6/6] 构建前端..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "  前端静态文件: $PROJECT_DIR/frontend/dist/"
echo "  后端 API 地址: http://localhost:8001"
echo ""
echo "  宝塔面板配置指引："
echo "  1. 添加 Node 项目 => 路径: $PROJECT_DIR/backend"
echo "     启动命令: npm run start | 端口: 8001"
echo "  2. 添加网站 => 根目录: $PROJECT_DIR/frontend/dist/"
echo "     反向代理 /dev/ => http://127.0.0.1:8001"
echo ""
echo "  默认管理员账号: admin / 123456"
echo ""
echo "  【首次部署注意】"
echo "  如果数据库是空库（首次部署），需要将 config.prod.ts 中"
echo "  synchronize 和 initDB 临时改为 true 以自动建表导入数据，"
echo "  启动成功后改回 false（当前已是 false）。"
echo ""
