import React from 'react';
import { useFusionStore } from '../../stores/fusion.store';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PlaceholderCard } from '../flower-card/PlaceholderCard';

export const FusionResultModal: React.FC = () => {
  const response = useFusionStore((s) => s.response);
  const setResponse = useFusionStore((s) => s.setResponse);

  if (!response) return null;

  const handleClose = () => setResponse(null);

  return (
    <Modal open={!!response} onClose={handleClose} title="嫁接结果">
      {response.success ? (
        <div className="flex flex-col items-center gap-3">
          <PlaceholderCard
            rarity={response.rarity || 'N'}
            atoms={response.atoms || []}
            stage="BLOOMING"
          />
          <div className="text-center">
            <p className="text-green-400 font-bold text-lg">
              🎉 嫁接成功！
            </p>
            <p className="text-gray-300">
              珍稀度：<span className="font-bold text-amber-400">{response.rarity}</span>
            </p>
            {response.reward && (
              <p className="text-gray-400 text-sm mt-1">
                +{response.reward.gold}💰 +{response.reward.xp}⭐
                {response.isFirstTime && ' (首达奖励!)'}
              </p>
            )}
          </div>
          <Button onClick={handleClose}>确定</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-red-400 font-bold text-lg">💔 嫁接失败</p>
          <p className="text-gray-300">
            {response.failType === 'GRAVE' ? '大失败！亲本A进入恢复状态...' : '普通失败，亲本保留。'}
          </p>
          <Button onClick={handleClose} variant="danger">确定</Button>
        </div>
      )}
    </Modal>
  );
};
