import { useState, useEffect, useCallback } from "react";
import LicenseScreen from "./components/LicenseScreen.jsx";
import { supabase } from "./supabase.js";
import GroupSelect from "./components/GroupSelect.jsx";
import { monthLabel, nextMonthKey, prevMonthKey, todayMonthKey, calcEMI, calcInterest, SAVING_AMOUNT, loadCurrentMonth, saveCurrentMonth } from "./store.js";
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
            <div className="marathi" style={{ textAlign:"center", marginTop:20, color:"var(--text3)", fontSize:11 }}>निर्मिती: पवन भिमेवार अँड असोसिएट्स, नांदेड</div>
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

async function loadMembersFromDB(groupId) {
  const { data, error } = await supabase.from('members').select('*').eq('group_id', groupId).order('created_at', { ascending: true });
  if (error) { console.error('loadMembers error:', error); return []; }
  return (data || []).map(m => ({ id: m.id, name: m.name, phone: m.phone||"", loanAmount: Number(m.loan_amount)||0, balance: Number(m.balance)||0 }));
}

async function loadMonthsFromDB(members, groupId) {
  const { data: monthsData, error: mError } = await supabase.from('months').select('*').eq('group_id', groupId);
  if (mError) { console.error('loadMonths error:', mError); return {}; }
  if (!monthsData || monthsData.length === 0) return {};
  const months = {};
  for (const m of monthsData) {
    const { data: entriesData } = await supabase.from('entries').select('*').eq('month_id', m.id);
    const entries = {};
    for (const e of entriesData || []) {
      entries[e.member_id] = { memberId: e.member_id, db_id: e.id, saving: Number(e.saving)||1000, principal: Number(e.principal)||0, interest: Number(e.interest)||0, totalDue: Number(e.total_due)||0, customAmount: Number(e.custom_amount)||0, paid: e.paid||false, paidAt: e.paid_at, balanceBefore: Number(e.balance_before)||0, balanceAfter: Number(e.balance_after)||0 };
    }
    months[m.month_key] = { key: m.month_key, db_id: m.id, entries, bankBalance: Number(m.bank_balance)||0 };
  }
  return months;
}

async function createMonthInDB(members, key, groupId, allMonths) {
  const prevKey = prevMonthKey(key);
  const prevMonth = allMonths ? allMonths[prevKey] : null;
  const { data: monthData, error } = await supabase.from('months').insert({ group_id: groupId, month_key: key, bank_balance: 0 }).select().single();
  if (error) { console.error('createMonth error:', error); return null; }
  const entriesInsert = members.map(m => {
    let openingBalance = m.balance;
    if (prevMonth && prevMonth.entries[m.id]) {
      const prevEntry = prevMonth.entries[m.id];
      openingBalance = prevEntry.paid ? prevEntry.balanceAfter : prevEntry.balanceBefore;
    }
    const principal = calcEMI(m.loanAmount);
    const interest = calcInterest(openingBalance);
    return { month_id: monthData.id, member_id: m.id, saving: SAVING_AMOUNT, principal, interest, total_due: SAVING_AMOUNT+principal+interest, paid: false, balance_before: openingBalance, balance_after: openingBalance>0?Math.max(0,openingBalance-principal):0 };
  });
  const { data: entriesData } = await supabase.from('entries').insert(entriesInsert).select();
  const entries = {};
  for (const e of entriesData || []) {
    entries[e.member_id] = { memberId: e.member_id, db_id: e.id, saving: Number(e.saving)||1000, principal: Number(e.principal)||0, interest: Number(e.interest)||0, totalDue: Number(e.total_due)||0, customAmount: 0, paid: false, paidAt: null, balanceBefore: Number(e.balance_before)||0, balanceAfter: Number(e.balance_after)||0 };
  }
  return { key, db_id: monthData.id, entries, bankBalance: 0 };
}

export default function App() {


  const [unlocked, setUnlocked] = useState(sessionStorage.getItem("sssb_unlocked") === "true");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [members, setMembers] = useState([]);
  const [months, setMonths] = useState({});
  const [currentMonth, setCurrentMonthState] = useState(todayMonthKey());


  useEffect(() => {
    if (!unlocked) return;
    setMembers([]);
    setMonths({});
    async function init() {
      setLoading(true);
      try {
        const m = await loadMembersFromDB(selectedGroup.id);
        setMembers(m);
        const cm = loadCurrentMonth();
        setCurrentMonthState(cm);
        let mo = await loadMonthsFromDB(m, selectedGroup.id);
        if (!mo[cm]) {
          const newMonth = await createMonthInDB(m, cm, selectedGroup.id, mo);
          if (newMonth) mo = { ...mo, [cm]: newMonth };
        }
        setMonths(mo);
      } catch(e) { console.error('init error:', e); }
      setLoading(false);
    }
    init();
  }, [unlocked, selectedGroup]);

  function setCurrentMonth(key) { setCurrentMonthState(key); saveCurrentMonth(key); }

  const handleMarkPaid = useCallback(async (monthKey, memberId, customAmount, isForeclosure) => {
    const monthRecord = months[monthKey];
    if (!monthRecord) return;
    const entry = monthRecord.entries[memberId];
    if (!entry || entry.paid) return;
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const emi = calcEMI(member.loanAmount);
    const extra = customAmount && customAmount > (entry.totalDue||0) ? customAmount - (entry.totalDue||0) : 0;
    const newBalance = isForeclosure ? 0 : (member.balance > 0 ? Math.max(0, member.balance - emi - extra) : 0);
    await supabase.from('entries').update({ paid: true, paid_at: new Date().toISOString(), balance_after: newBalance, custom_amount: customAmount||0 }).eq('id', entry.db_id);
    await supabase.from('members').update({ balance: newBalance }).eq('id', memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? {...m, balance: newBalance} : m));
    setMonths(prev => ({ ...prev, [monthKey]: { ...monthRecord, entries: { ...monthRecord.entries, [memberId]: { ...entry, paid: true, paidAt: new Date().toISOString(), customAmount: customAmount||0, balanceAfter: newBalance } } } }));
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
    await supabase.from('entries').update({ paid: false, paid_at: null }).eq('id', entry.db_id);
    await supabase.from('members').update({ balance: restoredBalance }).eq('id', memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? {...m, balance: restoredBalance} : m));
    setMonths(prev => ({ ...prev, [monthKey]: { ...monthRecord, entries: { ...monthRecord.entries, [memberId]: { ...entry, paid: false, paidAt: null } } } }));
    toast("रक्कम रद्द केली", "info");
  }, [months, members]);

  const handleCreateNextMonth = useCallback(async (forMonthKey) => {
    const targetKey = forMonthKey ? forMonthKey : nextMonthKey(currentMonth);
    if (months[targetKey]) { setCurrentMonth(targetKey); return; }
    const newMonth = await createMonthInDB(members, targetKey, selectedGroup.id, months);
    if (newMonth) {
      setMonths(prev => ({ ...prev, [targetKey]: newMonth }));
      setCurrentMonth(targetKey);
      toast(`${monthLabel(targetKey)} महिना तयार झाला`, "success");
    }
  }, [currentMonth, months, members]);

  const handleSaveMember = useCallback(async (member) => {
    if (member.id && member.id.includes('-')) {
      await supabase.from('members').update({ name: member.name, phone: member.phone||"", loan_amount: member.loanAmount||0, balance: member.balance||0 }).eq('id', member.id);
      const principal = calcEMI(member.loanAmount||0);
      const interest = calcInterest(member.balance||0);
      const updatedMonths = { ...months };
      for (const mk of Object.keys(updatedMonths)) {
        const mr = updatedMonths[mk];
        if (mr.entries[member.id] && !mr.entries[member.id].paid) {
          await supabase.from('entries').update({ principal, interest, total_due: SAVING_AMOUNT+principal+interest, balance_before: member.balance||0, balance_after: member.balance>0?Math.max(0,member.balance-principal):0 }).eq('id', mr.entries[member.id].db_id);
          updatedMonths[mk] = { ...mr, entries: { ...mr.entries, [member.id]: { ...mr.entries[member.id], principal, interest, totalDue: SAVING_AMOUNT+principal+interest, balanceBefore: member.balance||0, balanceAfter: member.balance>0?Math.max(0,member.balance-principal):0 } } };
        }
      }
      setMonths(updatedMonths);
      setMembers(prev => prev.map(m => m.id === member.id ? member : m));
    } else {
      const { data } = await supabase.from('members').insert({ group_id: selectedGroup.id, name: member.name, phone: member.phone||"", loan_amount: member.loanAmount||0, balance: member.balance||0 }).select().single();
      if (data) {
        const newMember = { ...member, id: data.id };
        const principal = calcEMI(member.loanAmount||0);
        const interest = calcInterest(member.balance||0);
        const updatedMonths = { ...months };
        for (const mk of Object.keys(updatedMonths)) {
          const mr = updatedMonths[mk];
          const entryData = { month_id: mr.db_id, member_id: data.id, saving: SAVING_AMOUNT, principal, interest, total_due: SAVING_AMOUNT+principal+interest, paid: false, balance_before: member.balance||0, balance_after: member.balance>0?Math.max(0,member.balance-principal):0 };
          const { data: eData } = await supabase.from('entries').insert(entryData).select().single();
          if (eData) {
            updatedMonths[mk] = { ...mr, entries: { ...mr.entries, [data.id]: { memberId: data.id, db_id: eData.id, saving: SAVING_AMOUNT, principal, interest, totalDue: SAVING_AMOUNT+principal+interest, customAmount: 0, paid: false, paidAt: null, balanceBefore: member.balance||0, balanceAfter: member.balance>0?Math.max(0,member.balance-principal):0 } } };
          }
        }
        setMembers(prev => [...prev, newMember]);
        setMonths(updatedMonths);
      }
    }
    toast("माहिती जतन झाली ✓", "success");
  }, [months]);

  const handleDeleteMember = useCallback(async (memberId) => {
    await supabase.from('entries').delete().eq('member_id', memberId);
    await supabase.from('members').delete().eq('id', memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
    toast("सदस्य काढला", "info");
  }, []);

  if (!unlocked) return <PinScreen onSuccess={() => { setUnlocked(true); sessionStorage.setItem("sssb_unlocked","true"); }} />;
  if (!selectedGroup) return <GroupSelect onSelect={(g) => { setSelectedGroup(g);  }} />;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <div style={{ fontSize:50, marginBottom:16 }}>🪔</div>
      <div className="marathi" style={{ fontSize:16, color:"var(--text2)" }}>डेटा लोड होत आहे...</div>
    </div>
  );

  return (
    <div style={{ maxWidth:600, margin:"0 auto", minHeight:"100vh", background:"var(--bg)", position:"relative" }}>
      <ToastContainer />
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onLock={() => { setUnlocked(false); sessionStorage.removeItem("sssb_unlocked"); }} group={selectedGroup} />
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
