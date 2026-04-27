#!/bin/bash
set -e

PHASE_NAME="$1"
COMMIT_MSG="$2"

if [ -z "$PHASE_NAME" ] || [ -z "$COMMIT_MSG" ]; then
    echo "用法: ./commit-phase.sh <phase名称> <提交说明>"
    echo "示例: ./commit-phase.sh phase1 '完成用户系统与认证模块'"
    exit 1
fi

cd ~/flowerlang

# 检查是否有变更
if [ -z "$(git status --porcelain)" ]; then
    echo "⚠️  工作区无变更，跳过提交"
    exit 0
fi

# 阶段化提交
git add .
git commit -m "[$PHASE_NAME] $COMMIT_MSG"
git push origin main

echo "✅ [$PHASE_NAME] 已提交并推送: $COMMIT_MSG"
