#!/bin/bash
set -e

echo "=== [1/4] 启动基础设施 ==="
docker compose up -d

echo "=== [2/4] 启动 AI Gateway ==="
cd ~/flowerlang/ai-gateway
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
AI_PID=$!

echo "=== [3/4] 启动 NestJS 后端 ==="
cd ~/flowerlang/server
npm run start:dev &
API_PID=$!

echo "=== [4/4] 启动前端 ==="
cd ~/flowerlang/web
npm run dev &
WEB_PID=$!

echo ""
echo "服务已启动："
echo "  前端:     http://localhost:5173"
echo "  后端 API: http://localhost:3000"
echo "  AI 网关:  http://localhost:8000"
echo "  MinIO:    http://localhost:9001 (控制台)"
echo ""
echo "按 Ctrl+C 停止全部，或分别 kill $AI_PID $API_PID $WEB_PID"
wait
