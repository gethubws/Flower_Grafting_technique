import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'gold';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  leaving: boolean;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✨', error: '💔', info: '📋', gold: '🪙',
};
const TOAST_BG: Record<ToastType, string> = {
  success: 'linear-gradient(135deg, #C8E6C9, #A5D6A7)',
  error: 'linear-gradient(135deg, #FFCDD2, #EF9A9A)',
  info: 'linear-gradient(135deg, #BBDEFB, #90CAF9)',
  gold: 'linear-gradient(135deg, #FFF8E1, #FFE082)',
};
const TOAST_BORDER: Record<ToastType, string> = {
  success: '#81C784', error: '#E57373', info: '#64B5F6', gold: '#FFD54F',
};

interface ToastCtx {
  toast: (msg: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

let _id = 0;
// Global toast emitter (accessible without hook)
type ToastListener = (msg: string, type: ToastType) => void;
let _globalListener: ToastListener | null = null;
export const showToast = (msg: string, type: ToastType = 'info') => {
  if (_globalListener) _globalListener(msg, type);
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type, leaving: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 350);
    }, 2500);
  }, []);

  useEffect(() => {
    _globalListener = addToast;
    return () => { _globalListener = null; };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-6 left-1/2 z-[300] flex flex-col items-center gap-2 pointer-events-none"
        style={{ transform: 'translateX(-50%)' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg pointer-events-auto"
            style={{
              background: TOAST_BG[t.type],
              border: `1px solid ${TOAST_BORDER[t.type]}`,
              color: '#3E2723',
              backdropFilter: 'blur(10px)',
              animation: t.leaving ? 'toast-out 0.3s ease-in forwards' : 'toast-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              maxWidth: '90vw',
              whiteSpace: 'pre-line',
              textAlign: 'center',
            }}
          >
            <span>{TOAST_ICONS[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
