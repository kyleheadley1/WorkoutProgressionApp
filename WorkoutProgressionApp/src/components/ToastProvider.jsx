// src/components/ToastProvider.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';

/**
 * Minimal toast system:
 * - <ToastProvider> wraps your app once.
 * - useToast() gives you toast.success / toast.error / toast.info
 * - Auto-hides after 3s (configurable)
 */

const ToastCtx = createContext(null);

export function ToastProvider({ children, defaultDuration = 3000 }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant, message, opts = {}) => {
      const id = idRef.current++;
      const duration = opts.duration ?? defaultDuration;
      setToasts((prev) => [...prev, { id, variant, message }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
    },
    [defaultDuration, remove]
  );

  const api = useMemo(
    () => ({
      success: (msg, opts) => push('success', msg, opts),
      error: (msg, opts) => push('error', msg, opts),
      info: (msg, opts) => push('info', msg, opts),
      remove,
    }),
    [push, remove]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        aria-live='polite'
        aria-atomic='true'
        style={{
          position: 'fixed',
          right: 12,
          bottom: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role='status'
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              background:
                t.variant === 'success'
                  ? 'rgba(24,160,88,0.95)'
                  : t.variant === 'error'
                  ? 'rgba(220,53,69,0.95)'
                  : 'rgba(33, 37, 41, 0.95)',
              color: 'white',
              fontSize: 14,
              maxWidth: 380,
              wordBreak: 'break-word',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
