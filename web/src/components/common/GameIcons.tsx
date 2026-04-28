/**
 * Game Icons — 花语秘境自定义 SVG 图标库
 * 所有图标来自 flower_game_ui_kit_v2.html 设计规范
 * 渐变光影 · 立体层次 · 游戏级质感
 */
import React from 'react';

type IconProps = { size?: number; className?: string };

// ===== 工具栏图标 (64 viewBox) =====

export const IconSeedBag: React.FC<IconProps> = ({ size = 38, className }) => (
  <svg viewBox="0 0 64 64" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="ic-sack-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A1887F"/><stop offset="50%" stopColor="#8D6E63"/><stop offset="100%" stopColor="#6D4C41"/>
      </linearGradient>
      <linearGradient id="ic-sack-light" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D7CCC8" stopOpacity="0.6"/><stop offset="100%" stopColor="#8D6E63" stopOpacity="0"/>
      </linearGradient>
      <filter id="ic-sack-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#5D4037" floodOpacity="0.3"/>
      </filter>
    </defs>
    <path d="M22 16C22 16 24 10 32 10C40 10 42 16 42 16" stroke="#6D4C41" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M18 20C18 20 14 34 20 44C26 54 38 54 44 44C50 34 46 20 46 20C46 20 42 18 32 18C22 18 18 20 18 20Z" fill="url(#ic-sack-body)" filter="url(#ic-sack-shadow)"/>
    <path d="M18 20C18 20 14 34 20 44C26 54 38 54 44 44C50 34 46 20 46 20C46 20 42 18 32 18C22 18 18 20 18 20Z" fill="url(#ic-sack-light)"/>
    <path d="M26 24C26 24 24 30 26 36C28 42 36 42 38 36C40 30 38 24 38 24" stroke="#5D4037" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="M32 28V40" stroke="#A1887F" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M28 32L32 28L36 32" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="32" cy="24" r="3.5" fill="#66BB6A" stroke="#43A047" strokeWidth="1"/>
    <path d="M30 22L32 20L34 22" stroke="#C8E6C9" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconGlove: React.FC<IconProps> = ({ size = 38, className }) => (
  <svg viewBox="0 0 64 64" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="ic-glove-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E1BEE7"/><stop offset="50%" stopColor="#CE93D8"/><stop offset="100%" stopColor="#AB47BC"/>
      </linearGradient>
      <linearGradient id="ic-glove-cuff" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#BA68C8"/><stop offset="100%" stopColor="#8E24AA"/>
      </linearGradient>
      <linearGradient id="ic-glove-light" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.3"/><stop offset="100%" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <filter id="ic-glove-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#6A1B9A" floodOpacity="0.3"/>
      </filter>
    </defs>
    <path d="M24 22C24 18 28 14 32 14C36 14 40 18 40 22V34C40 38 36 42 32 42C28 42 24 38 24 34V22Z" fill="url(#ic-glove-body)" filter="url(#ic-glove-shadow)"/>
    <path d="M24 22C24 18 28 14 32 14C36 14 40 18 40 22V34C40 38 36 42 32 42C28 42 24 38 24 34V22Z" fill="url(#ic-glove-light)"/>
    <path d="M26 42V48C26 50 28 52 30 52H34C36 52 38 50 38 48V42" stroke="url(#ic-glove-cuff)" strokeWidth="4" strokeLinecap="round"/>
    <path d="M26 42V48C26 50 28 52 30 52H34C36 52 38 50 38 48V42" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" transform="translate(0,-1)"/>
    <path d="M26 26H28" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    <path d="M36 26H38" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    <path d="M26 32H28" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    <path d="M36 32H38" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
  </svg>
);

export const IconKnife: React.FC<IconProps> = ({ size = 38, className }) => (
  <svg viewBox="0 0 64 64" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="ic-blade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EEEEEE"/><stop offset="50%" stopColor="#BDBDBD"/><stop offset="100%" stopColor="#757575"/>
      </linearGradient>
      <linearGradient id="ic-blade-shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="white" stopOpacity="0.6"/><stop offset="100%" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="ic-handle" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A1887F"/><stop offset="100%" stopColor="#5D4037"/>
      </linearGradient>
      <filter id="ic-knife-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#3E2723" floodOpacity="0.3"/>
      </filter>
    </defs>
    <path d="M22 42L38 26L42 30L26 46C24 48 22 46 22 42Z" fill="url(#ic-blade)" stroke="#616161" strokeWidth="1.5" filter="url(#ic-knife-shadow)"/>
    <path d="M24 40L36 28" stroke="url(#ic-blade-shine)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M38 26L46 18" stroke="#9E9E9E" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M18 46L22 42" stroke="url(#ic-handle)" strokeWidth="5" strokeLinecap="round"/>
    <path d="M18 46L22 42" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" transform="translate(0,1)"/>
    <circle cx="46" cy="18" r="3.5" fill="#EF5350" stroke="#C62828" strokeWidth="1"/>
    <circle cx="46" cy="18" r="1.5" fill="#FFCDD2"/>
    <path d="M40 24L42 22" stroke="#616161" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

export const IconWarehouse: React.FC<IconProps> = ({ size = 38, className }) => (
  <svg viewBox="0 0 64 64" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="ic-roof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFCC80"/><stop offset="100%" stopColor="#FF9800"/>
      </linearGradient>
      <linearGradient id="ic-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFE0B2"/><stop offset="100%" stopColor="#FFCC80"/>
      </linearGradient>
      <linearGradient id="ic-door" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A1887F"/><stop offset="100%" stopColor="#6D4C41"/>
      </linearGradient>
      <filter id="ic-house-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#E65100" floodOpacity="0.25"/>
      </filter>
    </defs>
    <path d="M14 32L32 14L50 32V50C50 52 48 54 46 54H18C16 54 14 52 14 50V32Z" fill="url(#ic-roof)" stroke="#E65100" strokeWidth="2.5" strokeLinejoin="round" filter="url(#ic-house-shadow)"/>
    <path d="M14 32L32 14L50 32" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    <path d="M22 54V38C22 36 24 34 26 34H38C40 34 42 36 42 38V54" fill="url(#ic-door)" stroke="#5D4037" strokeWidth="2"/>
    <path d="M22 54V38C22 36 24 34 26 34H38C40 34 42 36 42 38V54" fill="url(#ic-wall)" opacity="0.3"/>
    <circle cx="32" cy="24" r="5" fill="#FFF3E0" stroke="#E65100" strokeWidth="2"/>
    <path d="M29 21L32 18L35 21" stroke="#66BB6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M32 18V15" stroke="#66BB6A" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="30" cy="44" r="1.5" fill="#FFD54F"/>
  </svg>
);

export const IconDNA: React.FC<IconProps> = ({ size = 38, className }) => (
  <svg viewBox="0 0 64 64" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="ic-dna1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#F48FB1"/><stop offset="100%" stopColor="#EC407A"/>
      </linearGradient>
      <linearGradient id="ic-dna2" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#81D4FA"/><stop offset="100%" stopColor="#42A5F5"/>
      </linearGradient>
      <filter id="ic-dna-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#AD1457" floodOpacity="0.2"/>
      </filter>
    </defs>
    <path d="M22 18C22 18 22 28 28 32C34 36 34 46 34 46" stroke="url(#ic-dna1)" strokeWidth="3.5" strokeLinecap="round" filter="url(#ic-dna-shadow)"/>
    <path d="M42 18C42 18 42 28 36 32C30 36 30 46 30 46" stroke="url(#ic-dna2)" strokeWidth="3.5" strokeLinecap="round" filter="url(#ic-dna-shadow)"/>
    <path d="M20 24H28" stroke="#F48FB1" strokeWidth="3" strokeLinecap="round"/>
    <path d="M36 24H44" stroke="#42A5F5" strokeWidth="3" strokeLinecap="round"/>
    <path d="M24 38H32" stroke="#F48FB1" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 38H40" stroke="#42A5F5" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="32" cy="12" r="5" fill="#66BB6A" stroke="#43A047" strokeWidth="1.5"/>
    <path d="M30 10L32 8L34 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M32 8V6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="32" cy="12" r="2" fill="#C8E6C9" opacity="0.6"/>
  </svg>
);

// ===== 小型功能图标 (24 viewBox) =====

export const IconCoin: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="ic-coin-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFE082"/><stop offset="100%" stopColor="#FFA000"/>
      </linearGradient>
      <filter id="ic-coin-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#FF6F00" floodOpacity="0.3"/>
      </filter>
    </defs>
    <circle cx="12" cy="12" r="9" fill="url(#ic-coin-grad)" stroke="#FF8F00" strokeWidth="1.5" filter="url(#ic-coin-shadow)"/>
    <circle cx="12" cy="12" r="7" stroke="#FF8F00" strokeWidth="0.5" fill="none" opacity="0.5"/>
    <text x="12" y="16" textAnchor="middle" fill="#5D4037" fontSize="10" fontWeight="800" fontFamily="Nunito, sans-serif">G</text>
  </svg>
);

export const IconGem: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="ic-gem-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#B3E5FC"/><stop offset="50%" stopColor="#4FC3F7"/><stop offset="100%" stopColor="#0288D1"/>
      </linearGradient>
      <filter id="ic-gem-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#01579B" floodOpacity="0.3"/>
      </filter>
    </defs>
    <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="url(#ic-gem-grad)" stroke="#0277BD" strokeWidth="1.5" strokeLinejoin="round" filter="url(#ic-gem-shadow)"/>
    <path d="M12 2L12 22" stroke="white" strokeWidth="1" opacity="0.5"/>
    <path d="M2 12L22 12" stroke="white" strokeWidth="1" opacity="0.5"/>
    <path d="M7 7L17 17" stroke="white" strokeWidth="0.5" opacity="0.3"/>
    <path d="M17 7L7 17" stroke="white" strokeWidth="0.5" opacity="0.3"/>
  </svg>
);

export const IconDrop: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="ic-drop-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#81D4FA"/><stop offset="100%" stopColor="#0288D1"/>
      </linearGradient>
      <filter id="ic-drop-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#01579B" floodOpacity="0.2"/>
      </filter>
    </defs>
    <path d="M12 2C12 2 6 10 6 14C6 17.3 8.7 20 12 20C15.3 20 18 17.3 18 14C18 10 12 2 12 2Z" fill="url(#ic-drop-grad)" stroke="#0277BD" strokeWidth="1.5" strokeLinejoin="round" filter="url(#ic-drop-shadow)"/>
    <ellipse cx="12" cy="14" rx="3" ry="4" fill="white" opacity="0.4"/>
    <circle cx="10" cy="11" r="1" fill="white" opacity="0.8"/>
  </svg>
);

export const IconStar: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="ic-star-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFF176"/><stop offset="50%" stopColor="#FFD54F"/><stop offset="100%" stopColor="#FF8F00"/>
      </linearGradient>
      <filter id="ic-star-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#E65100" floodOpacity="0.3"/>
      </filter>
    </defs>
    <path d="M12 2L14.5 9.5L22 10L16 14.5L18 22L12 17.5L6 22L8 14.5L2 10L9.5 9.5L12 2Z" fill="url(#ic-star-grad)" stroke="#FF8F00" strokeWidth="1.5" strokeLinejoin="round" filter="url(#ic-star-shadow)"/>
    <path d="M12 2L12 17.5" stroke="white" strokeWidth="1" opacity="0.4"/>
  </svg>
);

// ===== 花朵占位 SVG =====

export const FlowerRose: React.FC<IconProps> = ({ size = 80, className }) => (
  <svg viewBox="0 0 64 64" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="fr-rose1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#F48FB1"/><stop offset="100%" stopColor="#C2185B"/></linearGradient>
      <linearGradient id="fr-rose2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#F8BBD0"/><stop offset="100%" stopColor="#E91E63"/></linearGradient>
      <filter id="fr-rose-shadow"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#880E4F" floodOpacity="0.25"/></filter>
    </defs>
    <path d="M32 16C28 12 22 16 22 22C22 28 28 32 32 28" fill="url(#fr-rose1)" filter="url(#fr-rose-shadow)"/>
    <path d="M32 16C36 12 42 16 42 22C42 28 36 32 32 28" fill="url(#fr-rose2)" filter="url(#fr-rose-shadow)"/>
    <path d="M32 20C30 18 28 20 28 22C28 24 30 26 32 24" fill="#FCE4EC"/>
    <path d="M32 20C34 18 36 20 36 22C36 24 34 26 32 24" fill="#F8BBD0"/>
    <circle cx="32" cy="22" r="3" fill="#FFD54F" stroke="#FF8F00" strokeWidth="0.5"/>
    <path d="M32 28V52" stroke="#43A047" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 36C32 36 22 34 20 40" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 40C32 40 42 38 44 44" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M24 38C24 38 22 42 24 44" stroke="#43A047" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

export const FlowerSunflower: React.FC<IconProps> = ({ size = 80, className }) => (
  <svg viewBox="0 0 64 64" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="fs-center" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFF176"/><stop offset="100%" stopColor="#FF8F00"/></linearGradient>
      <linearGradient id="fs-petals" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFF59D"/><stop offset="100%" stopColor="#FBC02D"/></linearGradient>
      <filter id="fs-sun-shadow"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#F57F17" floodOpacity="0.25"/></filter>
    </defs>
    <g filter="url(#fs-sun-shadow)">
      {[0,30,60,90,120,150].map((deg,i) => (
        <ellipse key={i} cx="32" cy="22" rx="4" ry="10" fill="url(#fs-petals)" transform={`rotate(${deg} 32 22)`}/>
      ))}
    </g>
    <circle cx="32" cy="22" r="7" fill="url(#fs-center)" stroke="#F57F17" strokeWidth="1"/>
    <circle cx="30" cy="20" r="1.5" fill="#5D4037" opacity="0.6"/>
    <circle cx="34" cy="20" r="1.5" fill="#5D4037" opacity="0.6"/>
    <circle cx="32" cy="24" r="1.5" fill="#5D4037" opacity="0.6"/>
    <path d="M32 29V54" stroke="#43A047" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 38C32 38 20 36 18 44" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 42C32 42 44 40 46 48" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export const FlowerTulip: React.FC<IconProps> = ({ size = 80, className }) => (
  <svg viewBox="0 0 64 64" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="ft-tulip1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#CE93D8"/><stop offset="100%" stopColor="#7B1FA2"/></linearGradient>
      <linearGradient id="ft-tulip2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#E1BEE7"/><stop offset="100%" stopColor="#9C27B0"/></linearGradient>
      <filter id="ft-tulip-shadow"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#4A148C" floodOpacity="0.25"/></filter>
    </defs>
    <path d="M32 14C28 10 24 14 24 20V28C24 32 28 36 32 36" fill="url(#ft-tulip1)" filter="url(#ft-tulip-shadow)"/>
    <path d="M32 14C36 10 40 14 40 20V28C40 32 36 36 32 36" fill="url(#ft-tulip2)" filter="url(#ft-tulip-shadow)"/>
    <path d="M32 14V36" stroke="white" strokeWidth="1" opacity="0.3"/>
    <path d="M28 18C28 18 30 16 32 16" stroke="white" strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
    <path d="M28 22C28 22 30 20 32 20" stroke="white" strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
    <path d="M32 36V56" stroke="#43A047" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 44C32 44 22 42 20 48" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 48C32 48 42 46 44 52" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export const FlowerLily: React.FC<IconProps> = ({ size = 80, className }) => (
  <svg viewBox="0 0 64 64" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="fl-lily1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FCE4EC"/><stop offset="100%" stopColor="#F48FB1"/></linearGradient>
      <linearGradient id="fl-lily2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#F8BBD0"/><stop offset="100%" stopColor="#EC407A"/></linearGradient>
      <filter id="fl-lily-shadow"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#C2185B" floodOpacity="0.2"/></filter>
    </defs>
    <path d="M32 12C28 8 22 12 22 18C22 24 28 28 32 24" fill="url(#fl-lily1)" filter="url(#fl-lily-shadow)"/>
    <path d="M32 12C36 8 42 12 42 18C42 24 36 28 32 24" fill="url(#fl-lily1)" filter="url(#fl-lily-shadow)"/>
    <path d="M32 16C28 14 24 18 24 22C24 26 28 30 32 26" fill="url(#fl-lily2)" filter="url(#fl-lily-shadow)"/>
    <path d="M32 16C36 14 40 18 40 22C40 26 36 30 32 26" fill="url(#fl-lily2)" filter="url(#fl-lily-shadow)"/>
    <path d="M32 20C30 18 28 20 28 22C28 24 30 26 32 24" fill="#FFF8E1"/>
    <circle cx="32" cy="22" r="2" fill="#FFD54F"/>
    <path d="M32 26V56" stroke="#43A047" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 40C32 40 20 38 18 46" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 44C32 44 44 42 46 50" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export const FlowerOrchid: React.FC<IconProps> = ({ size = 80, className }) => (
  <svg viewBox="0 0 64 64" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="fo-orchid1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFAB91"/><stop offset="100%" stopColor="#D84315"/></linearGradient>
      <linearGradient id="fo-orchid2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFCCBC"/><stop offset="100%" stopColor="#FF5722"/></linearGradient>
      <filter id="fo-orchid-shadow"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#BF360C" floodOpacity="0.25"/></filter>
    </defs>
    <path d="M32 12C28 8 24 12 24 16C24 20 28 24 32 20" fill="url(#fo-orchid1)" filter="url(#fo-orchid-shadow)"/>
    <path d="M32 12C36 8 40 12 40 16C40 20 36 24 32 20" fill="url(#fo-orchid1)" filter="url(#fo-orchid-shadow)"/>
    <path d="M32 16C28 14 24 18 24 22C24 26 28 30 32 26" fill="url(#fo-orchid2)" filter="url(#fo-orchid-shadow)"/>
    <path d="M32 16C36 14 40 18 40 22C40 26 36 30 32 26" fill="url(#fo-orchid2)" filter="url(#fo-orchid-shadow)"/>
    <path d="M32 20C30 18 28 20 28 22C28 24 30 26 32 24" fill="#FFF3E0"/>
    <ellipse cx="32" cy="22" rx="2" ry="3" fill="#FF8F00"/>
    <path d="M32 26V56" stroke="#43A047" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 40C32 40 20 38 18 46" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 44C32 44 44 42 46 50" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export const FlowerFusion: React.FC<IconProps> = ({ size = 80, className }) => (
  <svg viewBox="0 0 64 64" fill="none" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="ff-fusion1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#CE93D8"/><stop offset="100%" stopColor="#7B1FA2"/></linearGradient>
      <linearGradient id="ff-fusion2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#81D4FA"/><stop offset="100%" stopColor="#0288D1"/></linearGradient>
      <filter id="ff-fusion-shadow"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#4A148C" floodOpacity="0.3"/></filter>
    </defs>
    <path d="M32 10C28 8 24 12 24 16C24 20 28 24 32 20" fill="url(#ff-fusion1)" filter="url(#ff-fusion-shadow)"/>
    <path d="M32 10C36 8 40 12 40 16C40 20 36 24 32 20" fill="url(#ff-fusion2)" filter="url(#ff-fusion-shadow)"/>
    <path d="M32 14C28 12 24 16 24 20C24 24 28 28 32 24" fill="url(#ff-fusion1)" filter="url(#ff-fusion-shadow)"/>
    <path d="M32 14C36 12 40 16 40 20C40 24 36 28 32 24" fill="url(#ff-fusion2)" filter="url(#ff-fusion-shadow)"/>
    <path d="M32 18C30 16 28 18 28 20C28 22 30 24 32 22" fill="#FFF8E1"/>
    <circle cx="32" cy="20" r="2" fill="#FFD54F"/>
    <path d="M32 24V56" stroke="#43A047" strokeWidth="3" strokeLinecap="round"/>
    <path d="M26 16C26 16 28 14 30 14" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    <path d="M38 16C38 16 36 14 34 14" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
  </svg>
);
