import { formatRs, monthLabel, getMonthStats, SAVING_AMOUNT } from "../store.js";
export default function Dashboard({ group, members, months, currentMonth, setActiveTab }) {
  const monthRecord = months[currentMonth];
  const stats = getMonthStats(monthRecord, members);
  const totalOutstanding = members.reduce((s, m) => s + (m.balance || 0), 0);
  const activeLoans = members.filter((m) => m.balance > 0).length;
  const allTimeCollection = Object.values(months).reduce((sum, mr) => sum + Object.values(mr.entries).filter(e => e.paid).reduce((s, e) => s + e.totalDue, 0), 0);
  const totalLoansGiven = members.reduce((s, m) => s + (m.loanAmount || 0), 0);
  const totalPrincipalRecovered = members.reduce((s, m) => s + ((m.loanAmount || 0) - (m.balance || 0)), 0);
  const totalSavingsAllTime = Object.values(months).reduce((sum, mr) => sum + Object.values(mr.entries).filter(e => e.paid).reduce((s, e) => s + (e.saving || 0), 0), 0);
  const totalInterestAllTime = Object.values(months).reduce((sum, mr) => sum + Object.values(mr.entries).filter(e => e.paid).reduce((s, e) => s + (e.interest || 0), 0), 0);
  const openingBalance = Number(localStorage.getItem('opening_balance_' + (group?.id || 'default')) || 0);
  const currentMonthRecord = months[currentMonth];
  const currentMonthSaving = 0;
  const currentMonthPrincipal = 0;
  const currentMonthInterest = 0;
  const totalCustomExtra = currentMonthRecord ? Object.values(currentMonthRecord.entries).filter(e => e.paid && e.customAmount > e.totalDue).reduce((s, e) => s + (e.customAmount - e.totalDue), 0) : 0;
  const cashInHand = openingBalance + currentMonthSaving + currentMonthPrincipal + currentMonthInterest;
  const cards = [
    { label: "चालू महिना संकलन", value: formatRs(stats.totalCollection), icon: "💰", color: "var(--green)", bg: "var(--green-light)", sub: `${stats.paidCount} / ${stats.totalMembers} सदस्य` },
    { label: "व्याज मिळाले", value: formatRs(stats.totalInterest), icon: "📈", color: "var(--blue)", bg: "var(--blue-light)", sub: "चालू महिना" },
    { label: "बचत संकलन", value: formatRs(stats.totalSaving), icon: "🏦", color: "var(--saffron)", bg: "var(--saffron-light)", sub: `प्रति सदस्य ${formatRs(SAVING_AMOUNT)}` },
    { label: "थकबाकी सदस्य", value: stats.pendingCount, icon: "⏳", color: "var(--red)", bg: "var(--red-light)", sub: "या महिन्यात बाकी" },
    { label: "सक्रिय कर्जे", value: activeLoans, icon: "📄", color: "#7B3F00", bg: "#FFF3E0", sub: `थकबाकी ${formatRs(totalOutstanding)}` },
    { label: "एकूण संकलन", value: formatRs(allTimeCollection), icon: "🏆", color: "#4A148C", bg: "#F3E5F5", sub: "सर्व महिने मिळून" },
    { label: "रोख शिल्लक", value: formatRs(cashInHand), icon: "💵", color: "#1A7F4B", bg: "#E8F7EF", sub: formatRs(openingBalance) + " उघडणारी रक्कम" },
  ];
  function shareWhatsApp() {
    const M = ["जानेवारी","फेब्रुवारी","मार्च","एप्रिल","मे","जून","जुलै","ऑगस्ट","सप्टेंबर","ऑक्टोबर","नोव्हेंबर","डिसेंबर"];
    const [y,m] = currentMonth.split("-");
    const monthName = `${M[parseInt(m)-1]} ${y}`;
    const pending = monthRecord ? Object.entries(monthRecord.entries).filter(([,e]) => !e.paid).map(([id]) => members.find(mb => mb.id === id)?.name).filter(Boolean) : [];
    const msg = `🪔 *${group?.name || "बचत गट"}*\n\n📅 *${monthName} अहवाल*\n\n💰 एकूण संकलन: ${formatRs(stats.totalCollection)}\n📈 व्याज: ${formatRs(stats.totalInterest)}\n🏦 बचत: ${formatRs(stats.totalSaving)}\n✅ भरले: ${stats.paidCount} सदस्य\n⏳ बाकी: ${stats.pendingCount} सदस्य${pending.length > 0 ? `\n\n*थकबाकी सदस्य:*\n${pending.map((n,i) => `${i+1}. ${n}`).join('\n')}` : ''}\n\n_pbaradkar16-commits.github.io/bachat-gat_`;
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
        <div className="card card-body" style={{marginBottom:10}}>
        <div className="marathi font-bold" style={{marginBottom:8}}>💰 उघडणारी रक्कम (Opening Balance)</div>
        <div style={{display:"flex",gap:8}}>
          <input className="input" type="number" 
            defaultValue={localStorage.getItem('opening_balance_' + (group?.id || 'default'))||''} 
            placeholder="₹45,771"
            id="opening_bal_input"
            style={{flex:1}}/>
          <button className="btn btn-green" onClick={()=>{
            const val = document.getElementById('opening_bal_input').value;
            localStorage.setItem('opening_balance_' + (group?.id || 'default'), val);
            window.location.reload();
          }}><span className="marathi">जतन</span></button>
        </div>
        <div className="marathi text-xs text-muted" style={{marginTop:6}}>हे एकदाच set करा — नंतर automatically calculate होईल</div>
      </div>
      <div className="card card-body" style={{marginBottom:16,border:"2px solid #1A7F4B"}}>
        <div className="marathi font-bold" style={{fontSize:15,marginBottom:12,color:"#1A7F4B"}}>📊 Cash in Hand — हिशोब</div>
        <div style={{display:"flex",flexDirection:"column",gap:6,fontSize:13}}>
          <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F0EDE8"}}>
            <span className="marathi" style={{color:"var(--text2)"}}>मागील शिल्लक</span>
            <span style={{fontWeight:700,color:"#1A7F4B"}}>+ {formatRs(openingBalance)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F0EDE8"}}>
            <span className="marathi" style={{color:"var(--text2)"}}>बचत संकलन</span>
            <span style={{fontWeight:700,color:"#1A7F4B"}}>+ {currentMonthSaving > 0 ? formatRs(currentMonthSaving) : "₹0 (no payments yet)"}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F0EDE8"}}>
            <span className="marathi" style={{color:"var(--text2)"}}>हप्ता वसुली</span>
            <span style={{fontWeight:700,color:"#1A7F4B"}}>+ {formatRs(currentMonthPrincipal)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F0EDE8"}}>
            <span className="marathi" style={{color:"var(--text2)"}}>व्याज वसुली</span>
            <span style={{fontWeight:700,color:"#1A7F4B"}}>+ {formatRs(currentMonthInterest)}</span>
          </div>
          
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",background:"#E8F7EF",borderRadius:8,paddingLeft:8,paddingRight:8,marginTop:4}}>
            <span className="marathi" style={{fontWeight:700,fontSize:15}}>💵 शिल्लक रोख</span>
            <span style={{fontWeight:700,fontSize:18,color:"#1A7F4B"}}>{formatRs(cashInHand)}</span>
          </div>
        </div>
      </div>
      <button className="btn btn-saffron btn-full" onClick={() => setActiveTab("monthly")}><span>📋</span><span className="marathi"> मासिक हजेरी भरा</span></button>
        <button className="btn btn-green btn-full" onClick={shareWhatsApp}><span>📲</span><span className="marathi"> WhatsApp वर Report Share करा</span></button>
      </div>
    </div>
  );
}
