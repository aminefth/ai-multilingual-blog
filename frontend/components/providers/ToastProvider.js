'use client';

import { Toaster } from 'react-hot-toast';
import { useTheme } from './ThemeProvider';

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
          color: resolvedTheme === 'dark' ? '#f9fafb' : '#111827',
          border: `1px solid ${resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
          borderRadius: '0.75rem',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow:
            resolvedTheme === 'dark'
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },

        // Success toasts
        success: {
          duration: 3000,
          style: {
            background: resolvedTheme === 'dark' ? '#065f46' : '#d1fae5',
            color: resolvedTheme === 'dark' ? '#a7f3d0' : '#065f46',
            border: `1px solid ${resolvedTheme === 'dark' ? '#059669' : '#10b981'}`,
          },
          iconTheme: {
            primary: '#10b981',
            secondary: resolvedTheme === 'dark' ? '#065f46' : '#ffffff',
          },
        },

        // Error toasts
        error: {
          duration: 5000,
          style: {
            background: resolvedTheme === 'dark' ? '#7f1d1d' : '#fee2e2',
            color: resolvedTheme === 'dark' ? '#fca5a5' : '#7f1d1d',
            border: `1px solid ${resolvedTheme === 'dark' ? '#dc2626' : '#ef4444'}`,
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: resolvedTheme === 'dark' ? '#7f1d1d' : '#ffffff',
          },
        },

        // Loading toasts
        loading: {
          style: {
            background: resolvedTheme === 'dark' ? '#1e40af' : '#dbeafe',
            color: resolvedTheme === 'dark' ? '#93c5fd' : '#1e40af',
            border: `1px solid ${resolvedTheme === 'dark' ? '#2563eb' : '#3b82f6'}`,
          },
          iconTheme: {
            primary: '#3b82f6',
            secondary: resolvedTheme === 'dark' ? '#1e40af' : '#ffffff',
          },
        },
      }}
    />
  );
}
