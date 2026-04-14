import { useState, useCallback, createContext, useContext } from "react";
import "../common/Toast.css";

const ConfirmContext = createContext(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback — uses browser confirm
    return (opts) => Promise.resolve(window.confirm(typeof opts === "string" ? opts : opts.message));
  }
  return ctx;
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((opts) => {
    const config = typeof opts === "string" ? { message: opts } : opts;
    return new Promise((resolve) => {
      setState({ ...config, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  const variant = state?.variant || "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="rc-confirm-overlay" onClick={handleCancel}>
          <div className="rc-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className={`rc-confirm-icon ${variant}`}>
              {variant === "danger" ? "🗑️" : variant === "warning" ? "⚠️" : "❓"}
            </div>
            <h3 className="rc-confirm-title">{state.title || "Are you sure?"}</h3>
            <p className="rc-confirm-message">{state.message || "This action cannot be undone."}</p>
            <div className="rc-confirm-actions">
              <button className="rc-confirm-btn rc-confirm-btn-cancel" onClick={handleCancel}>
                {state.cancelText || "Cancel"}
              </button>
              <button className={`rc-confirm-btn rc-confirm-btn-confirm ${variant}`} onClick={handleConfirm}>
                {state.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
