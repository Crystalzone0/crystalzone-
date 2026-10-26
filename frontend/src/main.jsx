import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastBar, Toaster } from 'react-hot-toast';

import App from './App.jsx';
import CrashScreen from './components/common/CrashScreen.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import OfflineBanner from './components/common/OfflineBanner.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      // Retry only temporary problems (offline, server hiccups), never 4xx answers.
      retry: (failureCount, error) => failureCount < 2 && Boolean(error?.isNetwork || error?.status >= 500),
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Outermost safety net: if anything above the router crashes, the visitor still sees a page. */}
    <ErrorBoundary fallback={({ error }) => <CrashScreen error={error} />}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <SettingsProvider>
                <CartProvider>
                  <WishlistProvider>
                    <App />
                    <OfflineBanner />
                    <Toaster
                      position="top-center"
                      gutter={10}
                      toastOptions={{
                        duration: 2800,
                        style: {
                          background: '#111111',
                          color: '#F8F5EF',
                          border: '1px solid rgba(198, 161, 91, 0.35)',
                          borderRadius: '12px',
                          boxShadow: '0 12px 32px -12px rgba(17, 17, 17, 0.45)',
                          fontSize: '14px',
                          padding: '12px 16px',
                          maxWidth: '420px',
                        },
                        success: { iconTheme: { primary: '#C6A15B', secondary: '#111111' } },
                        error: { duration: 4500, iconTheme: { primary: '#F87171', secondary: '#111111' } },
                      }}
                    >
                      {(t) => (
                        <ToastBar
                          toast={t}
                          style={{
                            ...t.style,
                            animation: t.visible
                              ? 'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
                              : 'toast-out 0.2s ease-in both',
                          }}
                        />
                      )}
                    </Toaster>
                  </WishlistProvider>
                </CartProvider>
              </SettingsProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);