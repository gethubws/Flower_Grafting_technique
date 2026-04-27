import client from './client';
import type { RegisterResponse, User } from '../types';

export const authApi = {
  register: (name: string) =>
    client.post<RegisterResponse>('/auth/register', { name }).then((r) => r.data),

  login: (name: string) =>
    client.post<RegisterResponse>('/auth/login', { name }).then((r) => r.data),

  getMe: () => client.get<User>('/user/me').then((r) => r.data),
};
