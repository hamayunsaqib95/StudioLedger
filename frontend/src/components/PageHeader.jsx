import { useEffect } from "react";

export default function Toast({ toast, clearToast }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => clearToast(), 3000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  const bg =
    toast.type === "error"
      ? "#fee2e2"
      : toast.type === "warning"
      ? "#fef3c7"
      : "#dcfce7";

  const color =
    toast.type === "error"
      ? "#991b1b"
      : toast.type === "warning"
      ? "#92400e"
      : "#166534";

  return (
    <div style={{ ...styles.toast, background: bg, color }}>
      <div>
        <strong style={{ display: "block", marginBottom: 4 }}>
          {toast.title || "Notice"}
        </strong>
        <span>{toast.message}</span>
      </div>
      <button onClick={clearToast} style={styles.close}>✕</button>
    </div>
  );
}

const styles = {
  toast: {
    position: "fixed",
    right: 20,
    top: 20,
    minWidth: 320,
    maxWidth: 420,
    padding: "14px 16px",
    borderRadius: 16,
    boxShadow: "0 14px 40px rgba(0,0,0,0.15)",
    zIndex: 1100,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  close: {
    border: "none",
    background: "transparent",
    fontSize: 16,
    cursor: "pointer"
  }
};