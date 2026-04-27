import { useEffect, useState } from 'react';
import { authApi } from '../api/auth.api';
import { useUserStore } from '../stores/user.store';

export const useAuth = () => {
  const token = useUserStore((s) => s.token);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const setUser = useUserStore((s) => s.setUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && !isLoggedIn) {
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
