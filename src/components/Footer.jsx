export default function Footer() {
  return (
    <div className="no-print" style={{
      textAlign: "center",
      padding: "20px 16px",
      borderTop: "1px solid var(--border)",
      marginTop: 8,
      background: "var(--surface)"
    }}>
      <div className="marathi" style={{
        fontSize: 12,
        color: "var(--text3)",
        fontFamily: "serif"
      }}>
        निर्मिती: पवन भिमेवार अँड असोसिएट्स, नांदेड
      </div>
      <div style={{
        fontSize: 10,
        color: "var(--text3)",
        marginTop: 4
      }}>
        © 2026 | श्री स्वामी समर्थ बचत गट
      </div>
    </div>
  );
}
