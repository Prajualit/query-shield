'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import type { RootState, AppDispatch } from '@/store/store';
import { verifyAuth } from '@/store/authSlice';

function AuthInitializer() {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken, refreshToken, user } = useSelector((state: RootState) => state.auth);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only run once on mount after rehydration
    if (!initialized && accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setInitialized(true);
    }
  }, [accessToken, refreshToken, initialized]);

  return null;
}

export function ReduxProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthInitializer />
        {children}
      </PersistGate>
    </Provider>
  );
}
