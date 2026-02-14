import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './slices/userSlice';
import apiReducer from './slices/apiSlice';
import jobEnrichmentsReducer from './slices/jobEnrichmentsSlice';

const rootReducer = combineReducers({
  user: userReducer,
  api: apiReducer,
  jobEnrichments: jobEnrichmentsReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['jobEnrichments'], // Only persist jobEnrichments
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;