import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StockInfo } from '../../types/agentica';

interface TradingState {
  targetStock: StockInfo | null;
}

const initialState: TradingState = {
  targetStock: null,
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setTargetStock: (state, action: PayloadAction<StockInfo>) => {
      state.targetStock = action.payload;
    },
    clearTargetStock: (state) => {
      state.targetStock = null;
    },
  },
});

export const { setTargetStock, clearTargetStock } = tradingSlice.actions;
export default tradingSlice.reducer;
