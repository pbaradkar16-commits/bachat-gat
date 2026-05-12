import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";
import { loadCurrentMonth, saveCurrentMonth, nextMonthKey, todayMonthKey, calcEMI, getOrCreateGroup, loadMembersFromDB, saveMemberToDB, deleteMemberFromDB, loadMonthsFromDB, createMonthInDB, markEntryPaid, undoEntryPaid, updateMemberBalance, monthKey } from "./store.js";
import Header from "./components/Header.jsx";
import Dashboard from "./components/Dashboard.jsx";
import MonthlyView from "./components/MonthlyView.jsx";
import Members from "./components/Members.jsx";
import Reports from "./components/Reports.jsx";
import Footer from "./components/Footer.jsx";
import { ToastContainer, toast } from "./components/Toast.jsx";

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
      <div className="marathi" style={{ color:"#fff", fontSize:20, fontWeight:700, marginBottom:4, textAlign:"center" }}>श्री स्वामी समर्थ बचत गट</div>
      <div className="marathi" style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginBottom:32, textAlign:"center" }}>बारड · तालुका मुदखेड · जि. नांदेड</div>
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
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [members, setMembers] = useState([]);
  const [months, setMonths] = useState({});
  const [currentMonth, setCurrentMonthState] = useState(todayMonthKey());
  const [groupId, setGroupId] = useState(null);

  useEffect(() => {
    if (!unlocked) return;
    async function init() {
      setLoading(true);
      try {
        const group = { id: "a1e0e13a-595b-4a1b-99b6-a820cac734eb" };
        setGroupId(group.id);
        let dbMembers = await loadMembersFromDB(group.id);
        if (dbMembers.length === 0) {
          const DEFAULT_NAMES = ["रवी कराळे","सुनील घंटेवार","शिवराज कस्तुरे","पवन भिमेवार","शेख शब्बीर मामा","माधव सूर्यवंशी","नागोराव मामा कल्याणकर","दिगंबर येलमगुंडे","संदीप मामा बट्टेवार","पिराजीराव केदारे","प्रदीप हुके","परमेश्वर धर्मे","सुदाम मुपडे","अमोल पंचभाई","गिरीष घंटेवार","शुभम चिवटेवार","पदमेश दुर्गे","संदीप पानबुडे","साहेब सोनटके","शंकर शिंदे"];
          for (const name of DEFAULT_NAMES) {
            const { data } = await supabase.from('members').insert({ group_id: group.id, name, phone: "", loan_amount: 0, balance: 0 }).select().single();
            if (data) dbMembers.push(data);
          }
        }
        const mappedMembers = dbMembers.map(m => ({ id: m.id, db_id: m.id, name: m.name, phone: m.phone||"", loanAmount: m.loan_amount||0, balance: m.balance||0, createdAt: m.created_at }));
        setMembers(mappedMembers);
        const cm = loadCurrentMonth();
        setCurrentMonthState(cm);
        let dbMonths = await loadMonthsFromDB(group.id);
        if (!dbMonths[cm]) {
          const newMonth = await createMonthInDB(mappedMembers, cm, group.id);
          if (newMonth) dbMonths[cm] = newMonth;
        }
        setMonths(dbMonths);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    init();
  }, [unlocked]);

  function setCurrentMonth(key) { setCurrentMonthState(key); saveCurrentMonth(key); }

  const handleMarkPaid = useCallback(async (monthKey, memberId) => {
    const monthRecord = months[monthKey];
    if (!monthRecord) return;
    const entry = monthRecord.entries[memberId];
    if (!entry || entry.paid) return;
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const principal = calcEMI(member.loanAmount);
    const newBalance = member.balance > 0 ? Math.max(0, member.balance - principal) : 0;
    await markEntryPaid(entry.db_id, newBalance, 0);
    await updateMemberBalance(member.db_id, newBalance);
    setMembers(prev => prev.map(m => m.id === memberId ? {...m, balance: newBalance} : m));
    setMonths(prev => ({ ...prev, [monthKey]: { ...monthRecord, entries: { ...monthRecord.entries, [memberId]: { ...entry, paid: true, paidAt: new Date().toISOString(), balanceAfter: newBalance } } } }));
    toast("रक्कम यशस्वीरित्या नोंद झाली ✓", "success");
  }, [months, members]);

  const handleUndoPaid = useCallback(async (monthKey, memberId) => {
    const monthRecord = months[monthKey];
    if (!monthRecord) return;
    const entry = monthRecord.entries[memberId];
    if (!entry || !entry.paid) return;
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const restoredBalance = entry.balanceBefore !== undefined ? entry.balanceBefore : member.balance + calcEMI(member.loanAmount);
    await undoEntryPaid(entry.db_id);
    await updateMemberBalance(member.db_id, restoredBalance);
    setMembers(prev => prev.map(m => m.id === memberId ? {...m, balance: restoredBalance} : m));
    setMonths(prev => ({ ...prev, [monthKey]: { ...monthRecord, entries: { ...monthRecord.entries, [memberId]: { ...entry, paid: false, paidAt: null } } } }));
    toast("रक्कम रद्द केली", "info");
  }, [months, members]);

  const handleCreateNextMonth = useCallback(async (forMonthKey) => {
    const targetKey = forMonthKey ? forMonthKey : nextMonthKey(currentMonth);
    if (months[targetKey]) { setCurrentMonth(targetKey); return; }
    const newMonth = await createMonthInDB(members, targetKey, groupId);
    if (newMonth) {
      setMonths(prev => ({ ...prev, [targetKey]: newMonth }));
      setCurrentMonth(targetKey);
      toast(`${targetKey} महिना तयार झाला`, "success");
    }
  }, [currentMonth, months, members, groupId]);

  const handleSaveMember = useCallback(async (member) => {
    const saved = await saveMemberToDB(member, groupId);
    if (!saved) return;
    const mappedMember = { ...member, id: saved.id, db_id: saved.id, loanAmount: saved.loan_amount||0, balance: saved.balance||0 };
    setMembers(prev => { const exists = prev.find(m => m.id === member.id); return exists ? prev.map(m => m.id === member.id ? mappedMember : m) : [...prev, mappedMember]; });
    toast("माहिती जतन झाली ✓", "success");
  }, [groupId]);

  const handleDeleteMember = useCallback(async (memberId) => {
    await deleteMemberFromDB(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
    toast("सदस्य काढला", "info");
  }, []);

  if (!unlocked) return <PinScreen onSuccess={() => setUnlocked(true)} />;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <div style={{ fontSize:50, marginBottom:16 }}>🪔</div>
      <div className="marathi" style={{ fontSize:16, color:"var(--text2)" }}>डेटा लोड होत आहे...</div>
    </div>
  );

  return (
    <div style={{ maxWidth:600, margin:"0 auto", minHeight:"100vh", background:"var(--bg)", position:"relative" }}>
      <ToastContainer />
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onLock={() => setUnlocked(false)} />
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
