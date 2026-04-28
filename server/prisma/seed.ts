// Phase 1.5 Seed — 5 种初始种子（结构化 atomLibrary）
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始播种 (Phase 1.5)...');

  const seeds = [
    {
      name: '玫瑰',
      description: '经典红花，花瓣层叠，香气浓郁。新手友好的基础品种。',
      emoji: '🌹',
      priceGold: 100,
      atomLibrary: [
        { atomId: '红花', guaranteed: true },
        { atomId: '重瓣', guaranteed: true },
        { atomId: '圆瓣', guaranteed: true },
        { atomId: '浓香', guaranteed: true },
        { atomId: '尖刺茎', guaranteed: true },
        { atomId: '绒面', guaranteed: true },
        { atomId: '黄花蕊', guaranteed: true },
      ],
    },
    {
      name: '向日葵',
      description: '向阳而生，花盘宽阔，金黄灿烂。适合搭配创造温暖色调。',
      emoji: '🌻',
      priceGold: 120,
      atomLibrary: [
        { atomId: '黄花', guaranteed: true },
        { atomId: '大花', guaranteed: true },
        { atomId: '单瓣', guaranteed: true },
        { atomId: '棕色蕊', guaranteed: true },
        { atomId: '直立茎', guaranteed: true },
        { atomId: '向阳', guaranteed: true },
      ],
    },
    {
      name: '百合',
      description: '洁白优雅，六瓣对称，花型修长。高贵气质的不二之选。',
      emoji: '🪷',
      priceGold: 150,
      atomLibrary: [
        { atomId: '白花', guaranteed: true },
        { atomId: '尖瓣', guaranteed: true },
        { atomId: '光滑花瓣', guaranteed: true },
        { atomId: '清香', guaranteed: true },
        { atomId: '细茎', guaranteed: true },
        { atomId: '细叶', guaranteed: true },
      ],
    },
    {
      name: '郁金香',
      description: '杯状花冠，色彩鲜艳，线条简洁。简约而不简单。',
      emoji: '🌷',
      priceGold: 130,
      atomLibrary: [
        { atomId: '杯状', guaranteed: true },
        { atomId: '光滑花瓣', guaranteed: true },
        { atomId: '粉花', guaranteed: true },
        { atomId: '直立茎', guaranteed: true },
        { atomId: '单瓣', guaranteed: true },
      ],
    },
    {
      name: '蝴蝶兰',
      description: '花型如蝶，姿态飘逸，热带风情。罕见的异域品种。',
      emoji: '🌺',
      priceGold: 180,
      atomLibrary: [
        { atomId: '蝶形', guaranteed: true },
        { atomId: '紫花', guaranteed: true },
        { atomId: '宽叶', guaranteed: true },
        { atomId: '大花', guaranteed: true },
        { atomId: '薄瓣', guaranteed: true },
        { atomId: '甜香', guaranteed: true },
      ],
    },
  ];

  for (const seed of seeds) {
    await prisma.seed.upsert({
      where: { name: seed.name },
      update: seed,
      create: seed,
    });
    console.log(`  ✅ ${seed.emoji} ${seed.name} — ${seed.priceGold} 金币 (${seed.atomLibrary.length} 因子)`);
  }

  console.log(`\n🎉 播种完成！共 ${seeds.length} 种种子入库。`);
}

main()
  .catch((e) => {
    console.error('❌ 播种失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
