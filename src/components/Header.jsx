export default function Header({ activeTab, setActiveTab, onLock }) {
  const tabs = [{ id: "dashboard", icon: "🏠", label: "डॅशबोर्ड" }, { id: "monthly", icon: "📋", label: "मासिक" }, { id: "members", icon: "👥", label: "सदस्य" }, { id: "reports", icon: "📊", label: "अहवाल" }];
  return (
    <>
      <div style={{ background: "linear-gradient(135deg, #E8650A 0%, #C4540A 50%, #A03A06 100%)", padding: "16px 20px 20px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, border: "2px solid rgba(255,255,255,0.4)" }}>🪔</div>
            <div style={{ flex: 1 }}>
              <div className="marathi" style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>श्री स्वामी समर्थ बचत गट</div>
              <div className="marathi" style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>बारड · तालुका मुदखेड · जि. नांदेड</div>
            </div>
            <button onClick={onLock} style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "6px 10px", color: "#fff", fontSize: 18, cursor: "pointer" }} title="Lock">🔒</button>
          </div>
        </div>
      </div>
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", position: "sticky", top: 76, zIndex: 99, display: "flex", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "10px 4px", background: "none", border: "none", borderBottom: activeTab === tab.id ? "3px solid var(--saffron)" : "3px solid transparent", color: activeTab === tab.id ? "var(--saffron)" : "var(--text3)", fontFamily: "inherit", transition: "all 0.15s", cursor: "pointer" }}>
            <div style={{ fontSize: 18 }}>{tab.icon}</div>
            <div className="marathi" style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{tab.label}</div>
          </button>
        ))}
      </div>
    </>
  );
}
