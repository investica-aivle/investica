import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AuthRequest, AuthResponse } from '../../types/auth';
import { RootState } from '../store';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api/kis`,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const sessionKey = state.auth.sessionKey;

      if (sessionKey) {
        headers.set('Authorization', `Bearer ${sessionKey}`);
      }

      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    authenticate: builder.mutation<AuthResponse, AuthRequest>({
      query: (credentials) => ({
        url: '/auth',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

export const {
  useAuthenticateMutation,
} = authApi;
