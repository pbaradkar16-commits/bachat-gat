import { formatRs, monthLabel, getMonthStats, SAVING_AMOUNT } from "../store.js";
export default function Dashboard({ members, months, currentMonth, setActiveTab }) {
  const monthRecord = months[currentMonth];
  const stats = getMonthStats(monthRecord, members);
  const totalOutstanding = members.reduce((s, m) => s + (m.balance || 0), 0);
  const activeLoans = members.filter((m) => m.balance > 0).length;
  const allTimeCollection = Object.values(months).reduce((sum, mr) => sum + Object.values(mr.entries).filter(e => e.paid).reduce((s, e) => s + e.totalDue, 0), 0);
  const totalLoansGiven = members.reduce((s, m) => s + (m.loanAmount || 0), 0);
  const totalPrincipalRecovered = members.reduce((s, m) => s + ((m.loanAmount || 0) - (m.balance || 0)), 0);
  const totalSavingsAllTime = Object.values(months).reduce((sum, mr) => sum + Object.values(mr.entries).filter(e => e.paid).reduce((s, e) => s + (e.saving || 0), 0), 0);
  const totalInterestAllTime = Object.values(months).reduce((sum, mr) => sum + Object.values(mr.entries).filter(e => e.paid).reduce((s, e) => s + (e.interest || 0), 0), 0);
  const cashInHand = totalSavingsAllTime + totalPrincipalRecovered + totalInterestAllTime - totalLoansGiven;
  const cards = [
    { label: "चालू महिना संकलन", value: formatRs(stats.totalCollection), icon: "💰", color: "var(--green)", bg: "var(--green-light)", sub: `${stats.paidCount} / ${stats.totalMembers} सदस्य` },
    { label: "व्याज मिळाले", value: formatRs(stats.totalInterest), icon: "📈", color: "var(--blue)", bg: "var(--blue-light)", sub: "चालू महिना" },
    { label: "बचत संकलन", value: formatRs(stats.totalSaving), icon: "🏦", color: "var(--saffron)", bg: "var(--saffron-light)", sub: `प्रति सदस्य ${formatRs(SAVING_AMOUNT)}` },
    { label: "थकबाकी सदस्य", value: stats.pendingCount, icon: "⏳", color: "var(--red)", bg: "var(--red-light)", sub: "या महिन्यात बाकी" },
    { label: "सक्रिय कर्जे", value: activeLoans, icon: "📄", color: "#7B3F00", bg: "#FFF3E0", sub: `थकबाकी ${formatRs(totalOutstanding)}` },
    { label: "एकूण संकलन", value: formatRs(allTimeCollection), icon: "🏆", color: "#4A148C", bg: "#F3E5F5", sub: "सर्व महिने मिळून" },
    { label: "रोख शिल्लक", value: formatRs(cashInHand), icon: "💵", color: "#1A7F4B", bg: "#E8F7EF", sub: "बचत + वसुली - कर्ज" },
  ];
  function shareWhatsApp() {
    const M = ["जानेवारी","फेब्रुवारी","मार्च","एप्रिल","मे","जून","जुलै","ऑगस्ट","सप्टेंबर","ऑक्टोबर","नोव्हेंबर","डिसेंबर"];
    const [y,m] = currentMonth.split("-");
    const monthName = `${M[parseInt(m)-1]} ${y}`;
    const pending = monthRecord ? Object.entries(monthRecord.entries).filter(([,e]) => !e.paid).map(([id]) => members.find(mb => mb.id === id)?.name).filter(Boolean) : [];
    const msg = `🪔 *श्री स्वामी समर्थ बचत गट - बारड*\n\n📅 *${monthName} अहवाल*\n\n💰 एकूण संकलन: ${formatRs(stats.totalCollection)}\n📈 व्याज: ${formatRs(stats.totalInterest)}\n🏦 बचत: ${formatRs(stats.totalSaving)}\n✅ भरले: ${stats.paidCount} सदस्य\n⏳ बाकी: ${stats.pendingCount} सदस्य${pending.length > 0 ? `\n\n*थकबाकी सदस्य:*\n${pending.map((n,i) => `${i+1}. ${n}`).join('\n')}` : ''}\n\n_app.netlify.app/bachat-gat_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  }
  return (
    <div style={{ padding: "16px 16px 100px" }}>
      <div style={{ background: "linear-gradient(135deg, #1A7F4B, #135C36)", borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 16px rgba(26,127,75,0.3)" }}>
        <div>
          <div className="marathi" style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>चालू महिना</div>
          <div className="marathi" style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>{monthLabel(currentMonth)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="marathi" style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>एकूण सदस्य</div>
          <div style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>{members.length}</div>
        </div>
      </div>
      {stats.totalMembers > 0 && (
        <div className="card card-body mb-4">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span className="marathi text-sm font-bold">महिना प्रगती</span>
            <span className="marathi text-sm text-muted">{stats.paidCount}/{stats.totalMembers}</span>
          </div>
          <div style={{ background: "#F0EDE8", borderRadius: 8, height: 10, overflow: "hidden" }}>
            <div style={{ width: `${stats.totalMembers ? (stats.paidCount / stats.totalMembers) * 100 : 0}%`, height: "100%", background: "linear-gradient(90deg, var(--green), #22C55E)", borderRadius: 8, transition: "width 0.5s ease" }} />
          </div>
          <div className="marathi text-xs text-muted mt-2">{stats.pendingCount > 0 ? `${stats.pendingCount} सदस्यांची रक्कम बाकी` : "सर्व सदस्यांनी रक्कम भरली ✓"}</div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {cards.map((c, i) => (
          <div key={i} className="card card-body fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div className="marathi" style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>{c.label}</div>
            <div className="marathi" style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="btn btn-saffron btn-full" onClick={() => setActiveTab("monthly")}><span>📋</span><span className="marathi"> मासिक हजेरी भरा</span></button>
        <button className="btn btn-green btn-full" onClick={shareWhatsApp}><span>📲</span><span className="marathi"> WhatsApp वर Report Share करा</span></button>
      </div>
    </div>
  );
}
