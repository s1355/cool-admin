#!/bin/bash
# ============================================================
# cool-admin 一键部署脚本
# 适用于宝塔面板 / 标准 Linux 服务器
# 用法：
#   chmod +x deploy.sh && ./deploy.sh
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================"
echo "  cool-admin 部署开始"
echo "  项目路径: $PROJECT_DIR"
echo "========================================"

# ── 1. 拉取最新代码 ──────────────────────────────────
echo ""
echo ">>> [1/5] 拉取最新代码..."
cd "$PROJECT_DIR"
git pull

# ── 2. 安装后端依赖 ──────────────────────────────────
echo ""
echo ">>> [2/5] 安装后端依赖..."
cd "$PROJECT_DIR/backend"
npm install

# ── 3. 编译后端 ──────────────────────────────────────
echo ""
echo ">>> [3/5] 编译后端 TypeScript..."
npm run build

# ── 4. 启动/重启后端进程 ────────────────────────────
echo ""
echo ">>> [4/5] 启动后端服务..."

if command -v pm2 &> /dev/null; then
    # 如果有 pm2，优雅重启
    if pm2 list | grep -q "cool-admin"; then
        pm2 restart cool-admin
    else
        pm2 start bootstrap.js --name "cool-admin" --cwd "$PROJECT_DIR/backend"
    fi
    pm2 save
    echo "  后端已通过 pm2 启动/重启 (端口 8001)"
else
    # 无 pm2，杀掉旧进程后启动
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

# ── 5. 构建前端 ──────────────────────────────────────
echo ""
echo ">>> [5/5] 构建前端..."
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
