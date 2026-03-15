export default function Modal({ open, title, children, onClose, width = 640 }) {

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={{ ...styles.modal, maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >

        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>{title}</h3>

          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.body}>
          {children}
        </div>

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },

  modal: {
    width: "100%",
    background: "#fff",
    borderRadius: 16,
    padding: 20
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10
  },

  body: {
    marginTop: 10
  },

  closeBtn: {
    border: "none",
    background: "#eee",
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: 6
  }
};