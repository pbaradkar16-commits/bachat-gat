import { useState, useEffect, useCallback } from "react";
import { loadMembers, saveMembers, loadMonths, saveMonths, loadCurrentMonth, saveCurrentMonth, createMonthRecord, nextMonthKey, todayMonthKey, calcEMI } from "./store.js";
import Header from "./components/Header.jsx";
import Dashboard from "./components/Dashboard.jsx";
import MonthlyView from "./components/MonthlyView.jsx";
import Members from "./components/Members.jsx";
import Reports from "./components/Reports.jsx";
import Footer from "./components/Footer.jsx";
import { ToastContainer } from "./components/Toast.jsx";

function PinScreen({ onSuccess }) {
  const [mode, setMode] = useState("check");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const savedPin = localStorage.getItem("sssb_pin");
  useEffect(() => { if (!savedPin) setMode("setup"); }, []);
  function handleLogin() { if (pin === savedPin) { onSuccess(); } else { setError("चुकीचा PIN!"); setPin(""); } }
  function handleSetup() { if (newPin.length !== 4) { setError("4 अंकी PIN भरा"); return; } if (newPin !== confirm) { setError("PIN जुळत नाही!"); return; } localStorage.setItem("sssb_pin", newPin); onSuccess(); }
  function addDigit(d) { if (pin.length < 4) setPin(p => p + d); }
  function delDigit() { setPin(p => p.slice(0,-1)); }
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #E8650A, #A03A06)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🪔</div>
      <div className="marathi" style={{ color:"#fff", fontSize:20, fontWeight:700, marginBottom:4, textAlign:"center" }}>श्री शीतला देवी पुरुष बचत गट बारड</div>
      <div className="marathi" style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginBottom:32, textAlign:"center" }}>तालुका मुदखेड · जि. नांदेड</div>
      <div style={{ background:"#fff", borderRadius:20, padding:28, width:"100%", maxWidth:340, boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
        {mode === "check" ? (
          <>
            <div className="marathi font-bold text-center" style={{ fontSize:18, marginBottom:20 }}>🔐 PIN टाका</div>
            <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:24 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width:16, height:16, borderRadius:"50%", background:pin.length>i?"var(--saffron)":"#F0EDE8", border:"2px solid var(--saffron)", transition:"all 0.15s" }}/>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => (
                <button key={i} onClick={() => d==="⌫" ? delDigit() : d!=="" ? addDigit(String(d)) : null} style={{ padding:"16px 0", fontSize:d==="⌫"?20:22, fontWeight:700, background:d===""?"transparent":"#F4F1EC", border:"none", borderRadius:12, cursor:d===""?"default":"pointer", color:"var(--text)" }}>{d}</button>
              ))}
            </div>
            {error && <div className="marathi text-center" style={{ color:"var(--red)", fontSize:13, marginBottom:12 }}>{error}</div>}
            <button className="btn btn-saffron btn-full" onClick={handleLogin} disabled={pin.length!==4} style={{ opacity:pin.length===4?1:0.5 }}><span className="marathi">प्रवेश करा</span></button>
            <div className="marathi" style={{ textAlign:"center", marginTop:20, color:"var(--text3)", fontSize:11, fontFamily:"serif" }}>निर्मिती: पवन भिमेवार अँड असोसिएट्स, नांदेड</div>
          </>
        ) : (
          <>
            <div className="marathi font-bold text-center" style={{ fontSize:18, marginBottom:20 }}>🔑 नवीन PIN सेट करा</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label className="marathi">4 अंकी PIN</label><input className="input" type="password" maxLength={4} value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,""))} placeholder="••••" style={{ textAlign:"center", fontSize:24, letterSpacing:12 }}/></div>
              <div><label className="marathi">PIN परत टाका</label><input className="input" type="password" maxLength={4} value={confirm} onChange={e=>setConfirm(e.target.value.replace(/\D/g,""))} placeholder="••••" style={{ textAlign:"center", fontSize:24, letterSpacing:12 }}/></div>
              {error && <div className="marathi" style={{ color:"var(--red)", fontSize:13 }}>{error}</div>}
              <button className="btn btn-saffron btn-full" onClick={handleSetup}><span className="marathi">PIN जतन करा</span></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem("sssb_unlocked") === "true");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [members, setMembers] = useState([]);
  const [months, setMonths] = useState({});
  const [currentMonth, setCurrentMonthState] = useState(todayMonthKey());

  useEffect(() => {
    if (!unlocked) return;
    const m = loadMembers();
    const mo = loadMonths();
    const cm = loadCurrentMonth();
    setMembers(m);
    setCurrentMonthState(cm);
    let updatedMo = { ...mo };
    if (!updatedMo[cm]) { updatedMo[cm] = createMonthRecord(m, cm); saveMonths(updatedMo); }
    setMonths(updatedMo);
  }, [unlocked]);

  function setCurrentMonth(key) { setCurrentMonthState(key); saveCurrentMonth(key); }

  const handleMarkPaid = useCallback((monthKey, memberId) => {
    setMonths(prev => {
      const monthRecord = prev[monthKey];
      if (!monthRecord) return prev;
      const entry = monthRecord.entries[memberId];
      if (!entry || entry.paid) return prev;
      const updatedEntry = { ...entry, paid: true, paidAt: Date.now() };
      const updatedMonths = { ...prev, [monthKey]: { ...monthRecord, entries: { ...monthRecord.entries, [memberId]: updatedEntry } } };
      saveMonths(updatedMonths);
      setMembers(prevMembers => {
        const updatedMembers = prevMembers.map(m => {
          if (m.id !== memberId) return m;
          const extraPayment = customAmount ? customAmount - (entry.totalDue || 0) : 0;
          const principalPaid = calcEMI(m.loanAmount) + (extraPayment > 0 ? extraPayment : 0);
          const newBalance = isForeclosure ? 0 : (m.balance > 0 ? Math.max(0, m.balance - principalPaid) : 0);
          return { ...m, balance: newBalance };
        });
        saveMembers(updatedMembers);
        return updatedMembers;
      });
      return updatedMonths;
    });
  }, []);

  const handleUndoPaid = useCallback((monthKey, memberId) => {
    setMonths(prev => {
      const monthRecord = prev[monthKey];
      if (!monthRecord) return prev;
      const entry = monthRecord.entries[memberId];
      if (!entry || !entry.paid) return prev;
      const updatedEntry = { ...entry, paid: false, paidAt: null };
      const updatedMonths = { ...prev, [monthKey]: { ...monthRecord, entries: { ...monthRecord.entries, [memberId]: updatedEntry } } };
      saveMonths(updatedMonths);
      setMembers(prevMembers => {
        const updatedMembers = prevMembers.map(m => {
          if (m.id !== memberId) return m;
          const restoredBalance = entry.balanceBefore !== undefined ? entry.balanceBefore : m.balance + calcEMI(m.loanAmount);
          return { ...m, balance: restoredBalance };
        });
        saveMembers(updatedMembers);
        return updatedMembers;
      });
      return updatedMonths;
    });
  }, []);

  const handleCreateNextMonth = useCallback((forMonthKey) => {
    const targetKey = forMonthKey ? forMonthKey : nextMonthKey(currentMonth);
    setMembers(currentMembers => {
      setMonths(prev => {
        if (prev[targetKey]) { setCurrentMonth(targetKey); return prev; }
        const newRecord = createMonthRecord(currentMembers, targetKey);
        const updated = { ...prev, [targetKey]: newRecord };
        saveMonths(updated);
        setCurrentMonth(targetKey);
        return updated;
      });
      return currentMembers;
    });
  }, [currentMonth]);

  const handleSaveMember = useCallback((member) => {
    setMembers(prev => {
      const exists = prev.find(m => m.id === member.id);
      const updated = exists ? prev.map(m => m.id === member.id ? member : m) : [...prev, member];
      saveMembers(updated);
      setMonths(prevMonths => {
        const updatedMonths = { ...prevMonths };
        Object.keys(updatedMonths).forEach(mk => {
          const mr = updatedMonths[mk];
          const principal = calcEMI(member.loanAmount);
          const interest = Math.round(member.balance * 0.015);
          const SAVING = 1000;
          if (mr.entries[member.id]) {
            const entry = mr.entries[member.id];
            if (!entry.paid) { updatedMonths[mk] = { ...mr, entries: { ...mr.entries, [member.id]: { ...entry, principal, interest, totalDue: SAVING+principal+interest, balanceBefore: member.balance, balanceAfter: member.balance > 0 ? Math.max(0, member.balance - principal) : 0 } } }; }
          } else if (!exists) {
            updatedMonths[mk] = { ...mr, entries: { ...mr.entries, [member.id]: { memberId: member.id, saving: SAVING, principal, interest, totalDue: SAVING+principal+interest, paid: false, paidAt: null, balanceBefore: member.balance, balanceAfter: member.balance > 0 ? Math.max(0, member.balance - principal) : 0 } } };
          }
        });
        saveMonths(updatedMonths);
        return updatedMonths;
      });
      return updated;
    });
  }, []);

  const handleDeleteMember = useCallback((memberId) => {
    setMembers(prev => { const updated = prev.filter(m => m.id !== memberId); saveMembers(updated); return updated; });
    setMonths(prev => {
      const updated = {};
      Object.entries(prev).forEach(([k, mr]) => { const entries = { ...mr.entries }; delete entries[memberId]; updated[k] = { ...mr, entries }; });
      saveMonths(updated);
      return updated;
    });
  }, []);

  if (!unlocked) return <PinScreen onSuccess={() => { setUnlocked(true); sessionStorage.setItem("sssb_unlocked","true"); }} />;

  return (
    <div style={{ maxWidth:600, margin:"0 auto", minHeight:"100vh", background:"var(--bg)", position:"relative" }}>
      <ToastContainer />
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onLock={() => { setUnlocked(false); sessionStorage.removeItem("sssb_unlocked"); }} />
      <main>
        {activeTab==="dashboard" && <Dashboard members={members} months={months} currentMonth={currentMonth} setActiveTab={setActiveTab}/>}
        {activeTab==="monthly" && <MonthlyView members={members} months={months} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} onMarkPaid={handleMarkPaid} onUndoPaid={handleUndoPaid} onCreateNextMonth={handleCreateNextMonth}/>}
        {activeTab==="members" && <Members members={members} months={months} onSave={handleSaveMember} onDelete={handleDeleteMember}/>}
        {activeTab==="reports" && <Reports members={members} months={months} currentMonth={currentMonth} onUpdateMembers={setMembers} onUpdateMonths={setMonths}/>}
      </main>
      <Footer />
    </div>
  );
}
