import React, { useState } from 'react';
import { authApi } from '../../api/auth.api';
import { useUserStore } from '../../stores/user.store';
import { Button } from '../common/Button';

export const RegisterPanel: React.FC = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((s) => s.setUser);

  const handleRegister = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register(name.trim());
      setUser(res.user, res.accessToken);
    } catch {
      setError('注册失败，请重试');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">🌺 花语嫁接师</h1>
        <p className="text-gray-400 text-sm">注册即玩，开启你的花语之旅</p>
      </div>

      <div className="w-full max-w-xs">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
          placeholder="输入你的昵称"
          maxLength={20}
          className="w-full px-4 py-3 rounded-lg bg-[#1a1a2e] border border-[#0f3460] text-white placeholder-gray-500 focus:outline-none focus:border-[#533483] transition-colors"
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      <Button onClick={handleRegister} disabled={!name.trim() || loading}>
        {loading ? '注册中...' : '开始游戏'}
      </Button>
    </div>
  );
};
