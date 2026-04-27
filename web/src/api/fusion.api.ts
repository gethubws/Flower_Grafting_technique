import client from './client';
import type { FusionRequest, FusionResponse } from '../types';

export const fusionApi = {
  fuse: (data: FusionRequest) =>
    client.post<FusionResponse>('/fusion', data).then((r) => r.data),
};
