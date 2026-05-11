import { useState, useCallback, useRef } from "react";
let _addToast = null;
export function toast(msg, type = "success") { if (_addToast) _addToast(msg, type); }
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef({});
  _addToast = useCallback((msg, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    timerRef.current[id] = setTimeout(() => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, 3000);
  }, []);
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          <span className="marathi">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
