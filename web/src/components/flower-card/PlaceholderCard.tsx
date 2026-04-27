import React from 'react';

const RARITY_GRADIENTS: Record<string, string> = {
  N: 'from-gray-600 to-gray-700',
  R: 'from-blue-600 to-blue-800',
  SR: 'from-purple-600 to-purple-800',
  SSR: 'from-amber-500 to-amber-700',
  UR: 'from-red-500 to-red-700',
};

const RARITY_GLOW: Record<string, string> = {
  N: 'shadow-gray-500/30',
  R: 'shadow-blue-500/30',
  SR: 'shadow-purple-500/30',
  SSR: 'shadow-amber-500/30',
  UR: 'shadow-red-500/40',
};

interface PlaceholderCardProps {
  rarity: string;
  atoms: string[];
  stage?: string;
}

export const PlaceholderCard: React.FC<PlaceholderCardProps> = ({ rarity, atoms }) => {
  const gradient = RARITY_GRADIENTS[rarity] || RARITY_GRADIENTS.N;
  const glow = RARITY_GLOW[rarity] || RARITY_GLOW.N;

  return (
    <div
      className={`w-48 h-64 rounded-2xl bg-gradient-to-b ${gradient} ${glow} shadow-lg flex flex-col items-center justify-center gap-2 p-4 animate-pulse`}
    >
      <span className="text-5xl">🌸</span>
      <span className="text-white font-bold">{rarity}</span>
      <div className="flex flex-wrap gap-1 justify-center">
        {atoms.slice(0, 5).map((a, i) => (
          <span key={i} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-200">
            {a}
          </span>
        ))}
      </div>
    </div>
  );
};
