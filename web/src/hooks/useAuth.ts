import { useEffect, useState } from 'react';
import { authApi } from '../api/auth.api';
import { useUserStore } from '../stores/user.store';

export const useAuth = () => {
  const token = useUserStore((s) => s.token);
  const setUser = useUserStore((s) => s.setUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // 每次加载都验证 token，防止残留旧 token 导致 isLoggedIn 错误
      authApi
        .getMe()
        .then((user) => {
          setUser(user, token);
        })
        .catch(() => {
          useUserStore.getState().logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return { loading };
};
