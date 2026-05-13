import { useState } from "react";
import { monthLabel, nextMonthKey, prevMonthKey, formatRs, SAVING_AMOUNT, getMonthStats, calcEMI } from "../store.js";
import { toast } from "./Toast.jsx";
export default function MonthlyView({ members, months, currentMonth, setCurrentMonth, onMarkPaid, onUndoPaid, onCreateNextMonth }) {
  const [confirmId, setConfirmId] = useState(null);
  const [undoId, setUndoId] = useState(null);
  const [filterPaid, setFilterPaid] = useState("all");
  const [customAmounts, setCustomAmounts] = useState({});
  const [foreclosureId, setForeclosureId] = useState(null);
  const monthRecord = months[currentMonth];
  const stats = getMonthStats(monthRecord, members);
  const prevKey = prevMonthKey(currentMonth);
  const nextKey = nextMonthKey(currentMonth);
  const hasPrev = !!months[prevKey];
  const hasNext = !!months[nextKey];
  function handleMarkPaid(memberId) {
    const customAmt = customAmounts[memberId];
    onMarkPaid(currentMonth, memberId, customAmt);
    setConfirmId(null);
    setCustomAmounts(prev => { const n = {...prev}; delete n[memberId]; return n; });
    toast("रक्कम यशस्वीरित्या नोंद झाली ✓", "success");
  }
  function handleForeclosure(memberId) {
    onMarkPaid(currentMonth, memberId, null, true);
    setForeclosureId(null);
    toast("Foreclosure यशस्वी! कर्ज बंद झाले ✓", "success");
  }
  function handleUndo(memberId) { onUndoPaid(currentMonth, memberId); setUndoId(null); toast("रक्कम रद्द केली", "info"); }
  function handleCreateNext() { onCreateNextMonth(); toast(`${monthLabel(nextKey)} महिना तयार झाला`, "success"); }
  if (!monthRecord) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>📅</div>
        <div className="marathi text-lg font-bold" style={{ marginBottom: 8 }}>{monthLabel(currentMonth)}</div>
        <div className="marathi text-muted" style={{ marginBottom: 20 }}>या महिन्याची नोंद अद्याप तयार झालेली नाही</div>
        <button className="btn btn-green" onClick={() => onCreateNextMonth(currentMonth)}><span>➕</span><span className="marathi"> हा महिना सुरू करा</span></button>
      </div>
    );
  }
  const filteredMembers = members.filter((m) => { const entry = monthRecord.entries[m.id]; if (!entry) return false; if (filterPaid === "paid") return entry.paid; if (filterPaid === "pending") return !entry.paid; return true; });
  return (
    <div style={{ padding: "16px 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <button className="btn btn-outline btn-sm" onClick={() => setCurrentMonth(prevKey)} disabled={!hasPrev} style={{ opacity: hasPrev ? 1 : 0.3 }}>◀</button>
        <div style={{ textAlign: "center" }}>
          <div className="marathi font-bold" style={{ fontSize: 17 }}>{monthLabel(currentMonth)}</div>
          <div className="marathi text-xs text-muted">{stats.paidCount}/{stats.totalMembers} भरले</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setCurrentMonth(nextKey)} disabled={!hasNext} style={{ opacity: hasNext ? 1 : 0.3 }}>▶</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[{ label: "संकलन", value: formatRs(stats.totalCollection), color: "var(--green)" }, { label: "व्याज", value: formatRs(stats.totalInterest), color: "var(--blue)" }, { label: "बाकी", value: stats.pendingCount + " जण", color: "var(--red)" }].map((s, i) => (
          <div key={i} className="card card-body" style={{ textAlign: "center", padding: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div className="marathi" style={{ fontSize: 11, color: "var(--text3)" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["all", "सर्व"], ["paid", "भरले ✓"], ["pending", "बाकी ⏳"]].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilterPaid(val)} style={{ flex: 1, padding: "8px 4px", fontSize: 12, background: filterPaid === val ? "var(--saffron)" : "var(--surface)", color: filterPaid === val ? "#fff" : "var(--text2)", border: "1.5px solid", borderColor: filterPaid === val ? "var(--saffron)" : "var(--border)", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            <span className="marathi">{lbl}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredMembers.map((member, idx) => {
          const entry = monthRecord.entries[member.id];
          if (!entry) return null;
          const isPaid = entry.paid;
          const emi = calcEMI(member.loanAmount);
          const minAmount = entry.totalDue;
          const customAmt = customAmounts[member.id];
          return (
            <div key={member.id} className="card fade-in" style={{ animationDelay: `${idx * 0.03}s`, borderLeft: `4px solid ${isPaid ? "var(--green)" : "var(--border)"}` }}>
              <div className="card-body" style={{ padding: "14px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div className="marathi font-bold" style={{ fontSize: 15 }}>{member.name}</div>
                    {member.phone && <div style={{ fontSize: 12, color: "var(--text3)" }}>📞 {member.phone}</div>}
                  </div>
                  <span className={"badge " + (isPaid ? "badge-green" : "badge-red")}><span className="marathi">{isPaid ? "✓ भरले" : "बाकी"}</span></span>
                </div>
                <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px", marginBottom: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 700, color: "var(--saffron)" }}>{formatRs(entry.saving)}</div><div className="marathi text-xs text-muted">बचत</div></div>
                  <div style={{ textAlign: "center", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}><div style={{ fontSize: 13, fontWeight: 700, color: "var(--blue)" }}>{formatRs(entry.principal)}</div><div className="marathi text-xs text-muted">हप्ता</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)" }}>{formatRs(entry.interest)}</div><div className="marathi text-xs text-muted">व्याज</div></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div><div className="marathi text-xs text-muted">किमान देणे</div><div style={{ fontSize: 17, fontWeight: 700 }}>{formatRs(entry.totalDue)}</div></div>
                  {member.balance > 0 && <div style={{ textAlign: "right" }}><div className="marathi text-xs text-muted">उर्वरित कर्ज</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--red)" }}>{formatRs(isPaid ? entry.balanceAfter : entry.balanceBefore)}</div></div>}
                </div>
                {!isPaid && member.balance > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <label className="marathi" style={{ fontSize: 12 }}>जास्त रक्कम भरायची असेल तर (optional):</label>
                    <input
                      className="input"
                      type="number"
                      placeholder={`किमान ${formatRs(minAmount)}`}
                      value={customAmt || ""}
                      onChange={e => { setCustomAmounts(prev => ({ ...prev, [member.id]: e.target.value === "" ? null : Number(e.target.value) })); }}
                      style={{ fontSize: 14, padding: "8px 12px" }}
                    />
                    {customAmt && customAmt > minAmount && (
                      <div className="marathi text-xs text-green mt-1">
                        अतिरिक्त: {formatRs(customAmt - minAmount)} — कर्ज जास्त कमी होईल ✓
                      </div>
                    )}
                  </div>
                )}
                {!isPaid && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {confirmId === member.id ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-green btn-sm" style={{ flex: 1 }} onClick={() => handleMarkPaid(member.id)}><span className="marathi">✓ हो, भरले</span></button>
                        <button className="btn btn-outline btn-sm" onClick={() => setConfirmId(null)}><span className="marathi">रद्द</span></button>
                      </div>
                    ) : (
                      <button className="btn btn-blue btn-full btn-sm" onClick={() => setConfirmId(member.id)}><span>💳</span><span className="marathi"> रक्कम जमा करा {customAmt ? `(${formatRs(customAmt)})` : ""}</span></button>
                    )}
                    {member.balance > 0 && (
                      foreclosureId === member.id ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-red btn-sm" style={{ flex: 1 }} onClick={() => handleForeclosure(member.id)}><span className="marathi">✓ हो, बंद करा</span></button>
                          <button className="btn btn-outline btn-sm" onClick={() => setForeclosureId(null)}><span className="marathi">रद्द</span></button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-full" style={{ background: "#7B3F00", color: "#fff" }} onClick={() => setForeclosureId(member.id)}><span>🔒</span><span className="marathi"> Foreclosure — संपूर्ण कर्ज बंद करा ({formatRs(member.balance)})</span></button>
                      )
                    )}
                  </div>
                )}
                {isPaid && (
                  <div>
                    <div className="marathi text-xs text-green" style={{ textAlign: "right", marginBottom: 8 }}>✓ {entry.paidAt ? new Date(entry.paidAt).toLocaleDateString("mr-IN") : "भरले"}{entry.customAmount > 0 ? ` — ${formatRs(entry.customAmount)} भरले` : ""}</div>
                    {undoId === member.id ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-red btn-sm" style={{ flex: 1 }} onClick={() => handleUndo(member.id)}><span className="marathi">हो, रद्द करा</span></button>
                        <button className="btn btn-outline btn-sm" onClick={() => setUndoId(null)}><span className="marathi">नको</span></button>
                      </div>
                    ) : (
                      <button className="btn btn-outline btn-full btn-sm" style={{ borderColor: "var(--red)", color: "var(--red)" }} onClick={() => setUndoId(member.id)}><span>↩️</span><span className="marathi"> चुकीने भरले — रद्द करा</span></button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!hasNext && stats.paidCount === stats.totalMembers && stats.totalMembers > 0 && (
        <div style={{ marginTop: 20, background: "var(--green-light)", border: "1.5px solid var(--green)", borderRadius: 14, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div className="marathi font-bold" style={{ marginBottom: 8 }}>सर्व रकमा जमा झाल्या!</div>
          <button className="btn btn-green" onClick={handleCreateNext}><span>➕</span><span className="marathi"> {monthLabel(nextKey)} सुरू करा</span></button>
        </div>
      )}
      {!hasNext && stats.pendingCount > 0 && (
        <div style={{ marginTop: 20 }}>
          <button className="btn btn-outline btn-full" onClick={handleCreateNext}><span>➕</span><span className="marathi"> {monthLabel(nextKey)} आधीच सुरू करा</span></button>
        </div>
      )}
    </div>
  );
}
