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
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-4 animate-bounce-soft">🌺</div>
        <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          花语嫁接师
        </h1>
        <p className="text-gray-500 text-sm">注册即玩，培育你的专属花语</p>
      </div>

      <div className="w-full max-w-xs animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
          placeholder="输入你的昵称..."
          maxLength={20}
          className="input-field text-center text-lg"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <Button
          onClick={handleRegister}
          disabled={!name.trim() || loading}
          size="default"
          className="px-10 py-3 text-base"
        >
          {loading ? '🌸 注册中...' : '✨ 开始游戏'}
        </Button>
      </div>

      <p className="text-gray-700 text-xs absolute bottom-4">v0.1 Phase 1</p>
    </div>
  );
};
