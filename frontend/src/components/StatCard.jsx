export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={styles.wrap}>
      <div>
        <h1 style={styles.title}>{title}</h1>
        {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 24
  },
  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
    color: "#0f172a"
  },
  subtitle: {
    margin: "6px 0 0 0",
    color: "#64748b"
  }
};