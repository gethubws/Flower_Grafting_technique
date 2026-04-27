// Phase 1 Seed — 5 种初始种子
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始播种...');

  const seeds = [
    {
      name: '玫瑰',
      description: '经典红花，花瓣层叠，香气浓郁。新手友好的基础品种。',
      emoji: '🌹',
      priceGold: 100,
      atomLibrary: ['红花', '重瓣', '层叠', '香气1', '圆形', '柔和', '尖刺茎'],
      growTime: 0,
    },
    {
      name: '向日葵',
      description: '向阳而生，花盘宽阔，金黄灿烂。适合搭配创造温暖色调。',
      emoji: '🌻',
      priceGold: 120,
      atomLibrary: ['黄花', '大花盘', '向阳', '棕色蕊', '高大茎', '温暖', '单瓣'],
      growTime: 0,
    },
    {
      name: '百合',
      description: '洁白优雅，六瓣对称，花型修长。高贵气质的不二之选。',
      emoji: '🪷',
      priceGold: 150,
      atomLibrary: ['白花', '六瓣', '对称', '修长', '香气2', '优雅', '细茎'],
      growTime: 0,
    },
    {
      name: '郁金香',
      description: '杯状花冠，色彩鲜艳，线条简洁。简约而不简单。',
      emoji: '🌷',
      priceGold: 130,
      atomLibrary: ['杯状', '鲜艳', '单色', '简洁', '光滑花瓣', '直立茎', '早春'],
      growTime: 0,
    },
    {
      name: '蝴蝶兰',
      description: '花型如蝶，姿态飘逸，热带风情。罕见的异域品种。',
      emoji: '🌺',
      priceGold: 180,
      atomLibrary: ['蝶形', '飘逸', '热带', '斑纹', '宽瓣', '长花期', '附生'],
      growTime: 0,
    },
  ];

  for (const seed of seeds) {
    await prisma.seed.upsert({
      where: { name: seed.name },
      update: seed,
      create: seed,
    });
    console.log(`  ✅ ${seed.emoji} ${seed.name} — ${seed.priceGold} 金币`);
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
