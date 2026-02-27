import { useState, useEffect, useCallback, createContext, useContext } from "react";

/* ─── Toast Context ─── */
const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback when used outside provider — still works, just logs
    return {
      success: (msg) => console.log("[toast]", msg),
      error: (msg) => console.error("[toast]", msg),
      info: (msg) => console.info("[toast]", msg),
      warn: (msg) => console.warn("[toast]", msg),
    };
  }
  return ctx;
}

let _globalAdd = null;

/** Imperative toast (works anywhere — no hook needed) */
export const toast = {
  success: (msg) => _globalAdd?.("success", msg),
  error: (msg) => _globalAdd?.("error", msg),
  info: (msg) => _globalAdd?.("info", msg),
  warn: (msg) => _globalAdd?.("warn", msg),
};

/* ─── Provider ─── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    _globalAdd = add;
    return () => { _globalAdd = null; };
  }, [add]);

  const ctx = {
    success: (msg) => add("success", msg),
    error: (msg) => add("error", msg),
    info: (msg) => add("info", msg),
    warn: (msg) => add("warn", msg),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="rc-toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─── Single Toast ─── */
const ICONS = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warn: "⚠",
};

function ToastItem({ toast: t, onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`rc-toast rc-toast-${t.type} ${exiting ? "rc-toast-exit" : ""}`}>
      <span className="rc-toast-icon">{ICONS[t.type]}</span>
      <span className="rc-toast-msg">{t.message}</span>
      <button className="rc-toast-close" onClick={onClose}>×</button>
    </div>
  );
}
