import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Essential Auth Selectors (자주 사용되는 것들만)
export const selectAuth = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectSessionKey = (state: RootState) => state.auth.sessionKey;
export const selectMaskedAccountNumber = (state: RootState) => state.auth.maskedAccountNumber;
export const selectAccountType = (state: RootState) => state.auth.accountType;

// Trading Selectors
export const selectTargetStock = (state: RootState) => state.trading.targetStock;
