'use client';

/* Toast notifications replicating zentic.js showToast markup/animation. */

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  icon: string;
  removing?: boolean;
}

interface ToastCtx {
  toast: (type: ToastType, message: string, icon?: string, duration?: number) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function useToast(): ToastCtx {
  return useContext(Ctx);
}

const COLORS: Record<ToastType, string> = {
  success: 'var(--zc-success)',
  error: 'var(--zc-danger)',
  warning: 'var(--zc-warning)',
  info: 'var(--zc-info)',
};

const DEFAULT_ICONS: Record<ToastType, string> = {
  success: 'circle-check',
  error: 'circle-x',
  warning: 'alert-triangle',
  info: 'info-circle',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const toast = useCallback((type: ToastType, message: string, icon?: string, duration = 4000) => {
    const id = ++seq.current;
    const item: ToastItem = { id, type, message, icon: icon || DEFAULT_ICONS[type] };
    setItems((prev) => [...prev, item]);
    setTimeout(() => {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 300);
    }, duration);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div id="toastContainer" className="toast-container">
        {items.map((t) => (
          <div key={t.id} className={`toast-item${t.removing ? ' removing' : ''}`}>
            <i className={`toast-icon ti ti-${t.icon.replace(/^(ti-|icon-)/, '')}`} style={{ color: COLORS[t.type] }} />
            <span className="toast-span">{t.message}</span>
            <button onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))} aria-label="Dismiss">
              <i className="ti ti-x" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
