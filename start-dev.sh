#!/bin/bash
# 花语嫁接师 — 全栈启动脚本
# 在 WSL Ubuntu 中运行：chmod +x start-dev.sh && ./start-dev.sh
set -e

FLOWER_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🌺 花语嫁接师 — Phase 1 启动"
echo "=============================="

# 1. Docker 基础设施
echo "[1/4] Docker 容器..."
cd "$FLOWER_ROOT"
docker compose up -d 2>/dev/null
sleep 2
echo "  ✅ PostgreSQL :5432 | Redis :6379 | MinIO :9000"

# 2. AI Gateway
echo "[2/4] AI Gateway (Python)..."
cd "$FLOWER_ROOT/ai-gateway"
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
echo "  ✅ http://localhost:8000 (占位图模式)"

# 3. NestJS 后端
echo "[3/4] NestJS 后端..."
cd "$FLOWER_ROOT/server"
npx nest start &
echo "  ✅ http://localhost:3000"

# 4. 前端
echo "[4/4] Vite 前端..."
cd "$FLOWER_ROOT/web"
npx vite --host 0.0.0.0 &
sleep 3

echo ""
echo "=============================="
echo "  🌐 前端:    http://localhost:5173"
echo "  📡 后端:    http://localhost:3000"
echo "  🤖 AI:      http://localhost:8000/health"
echo "  📦 MinIO:   http://localhost:9001 (flowerlang / flowerlang123)"
echo ""
echo "  在 Windows 浏览器打开 http://localhost:5173 即可游玩"
echo "  Ctrl+C 停止全部服务"
echo "=============================="
wait
