import React, { type ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import { setUser, setToken, clearUser } from '@/store/slices/userSlice';
import { useAuth, AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';

// Wrapper component to sync AuthContext with Redux store
const AuthSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token, isLoading } = useAuth();
  const dispatch = store.dispatch;

  useEffect(() => {
    if (token) {
      dispatch(setToken(token));
      if (user) {
        dispatch(setUser(user));
      }
    } else {
      dispatch(clearUser());
    }
  }, [user, token, dispatch]);

  return <>{children}</>;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SidebarProvider>
          <AuthProvider>
            <AuthSyncProvider>
              {children}
            </AuthSyncProvider>
          </AuthProvider>
        </SidebarProvider>
      </PersistGate>
    </Provider>
  );
};