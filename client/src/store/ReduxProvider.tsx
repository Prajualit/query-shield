'use client';

import { ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import { verifyAuth } from '@/store/authSlice';
import { getAccessToken } from '@/lib/auth';

export function ReduxProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Verify auth on mount if token exists
    if (getAccessToken()) {
      store.dispatch(verifyAuth());
    }
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
