import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ApiState {
  requests: {
    [key: string]: {
      loading: boolean;
      error: string | null;
      data: any;
      timestamp: number;
    };
  };
}

const initialState: ApiState = {
  requests: {},
};

const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    startRequest: (state, action: PayloadAction<string>) => {
      const requestId = action.payload;
      state.requests[requestId] = {
        loading: true,
        error: null,
        data: null,
        timestamp: Date.now(),
      };
    },
    successRequest: (state, action: PayloadAction<{ requestId: string; data: any }>) => {
      const { requestId, data } = action.payload;
      if (state.requests[requestId]) {
        state.requests[requestId] = {
          ...state.requests[requestId],
          loading: false,
          error: null,
          data,
          timestamp: Date.now(),
        };
      }
    },
    errorRequest: (state, action: PayloadAction<{ requestId: string; error: string }>) => {
      const { requestId, error } = action.payload;
      if (state.requests[requestId]) {
        state.requests[requestId] = {
          ...state.requests[requestId],
          loading: false,
          error,
          timestamp: Date.now(),
        };
      }
    },
    clearRequest: (state, action: PayloadAction<string>) => {
      delete state.requests[action.payload];
    },
  },
});

export const { startRequest, successRequest, errorRequest, clearRequest } = apiSlice.actions;
export default apiSlice.reducer;