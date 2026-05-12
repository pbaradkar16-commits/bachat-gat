import { useState } from "react";
import { monthLabel, formatRs, getMonthStats, getGroupBalanceSheet, loadBankBalances, saveBankBalances, calcEMI, saveMemberToDB, createMonthInDB } from "../store.js";
export default function Reports({ members, months, currentMonth, onUpdateMembers, onUpdateMonths }) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [view, setView] = useState("monthly");
  const [bankInput, setBankInput] = useState("");
  const [bankBalances, setBankBalancesState] = useState(loadBankBalances());
  const monthKeys = Object.keys(months).sort().reverse();
  const monthRecord = months[selectedMonth];
  const stats = getMonthStats(monthRecord, members);
  const currentBank = bankBalances[currentMonth] || 0;
  const bs = getGroupBalanceSheet(members, months, currentBank);
  const M = ["जानेवारी","फेब्रुवारी","मार्च","एप्रिल","मे","जून","जुलै","ऑगस्ट","सप्टेंबर","ऑक्टोबर","नोव्हेंबर","डिसेंबर"];

  function saveBankBalance() {
    const val = Number(bankInput) || 0;
    const updated = { ...bankBalances, [selectedMonth]: val };
    setBankBalancesState(updated);
    saveBankBalances(updated);
    setBankInput("");
    alert(`${monthLabel(selectedMonth)} चा Bank Balance ₹${val.toLocaleString("en-IN")} जतन झाला!`);
  }

  function handleNewLoan(member, amount) {
    if (member.balance > 0) { alert("जुने कर्ज आधी पूर्ण करा!"); return; }
    const updatedMember = { ...member, loanAmount: amount, balance: amount, loanHistory: [...(member.loanHistory||[]), { amount, date: Date.now(), status: "active" }] };
    const updatedMembers = members.map(m => m.id === member.id ? updatedMember : m);
    saveMembers(updatedMembers);
    const updatedMonths = { ...months };
    if (updatedMonths[currentMonth]) {
      const principal = calcEMI(amount);
      const interest = Math.round(amount * 0.015);
      const SAVING = 1000;
      const entry = updatedMonths[currentMonth].entries[member.id];
      if (entry && !entry.paid) {
        updatedMonths[currentMonth] = { ...updatedMonths[currentMonth], entries: { ...updatedMonths[currentMonth].entries, [member.id]: { ...entry, principal, interest, totalDue: SAVING+principal+interest, balanceBefore: amount, balanceAfter: Math.max(0, amount-principal) } } };
        saveMonths(updatedMonths);
        onUpdateMonths(updatedMonths);
      }
    }
    onUpdateMembers(updatedMembers);
    alert(`${member.name} यांना ${formatRs(amount)} कर्ज दिले!`);
  }

  function handlePDF() {
    if (!monthRecord) return;
    const [y,m] = selectedMonth.split("-");
    const monthName = `${M[parseInt(m)-1]} ${y}`;
    const bankBal = bankBalances[selectedMonth] || 0;
    const rows = members.map(mb => { const e = monthRecord.entries[mb.id]; if(!e) return ""; return `<tr><td style="padding:8px;font-family:serif;border-bottom:1px solid #eee;">${mb.name}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">${formatRs(e.saving)}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">${formatRs(e.principal)}</td><td style="padding:8px;text-align:center;color:#C62828;border-bottom:1px solid #eee;">${formatRs(e.interest)}</td><td style="padding:8px;text-align:center;font-weight:700;border-bottom:1px solid #eee;">${formatRs(e.totalDue)}</td><td style="padding:8px;text-align:center;color:${e.paid?"#1A7F4B":"#C62828"};font-weight:700;border-bottom:1px solid #eee;">${e.paid?"✓ भरले":"बाकी"}</td></tr>`; }).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${monthName} अहवाल</title><style>body{font-family:Arial,sans-serif;margin:20px;}h1,h2{font-family:serif;color:#E8650A;text-align:center;}table{width:100%;border-collapse:collapse;margin-top:16px;}th{background:#FFF3E8;padding:10px;text-align:center;font-weight:700;border-bottom:2px solid #E8650A;}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0;}.box{background:#F4F1EC;border-radius:8px;padding:12px;text-align:center;}.box-val{font-size:18px;font-weight:700;color:#1A7F4B;}.box-lbl{font-size:11px;color:#9C8060;margin-top:4px;}.bs{background:#E8F7EF;border-radius:8px;padding:16px;margin-top:16px;}.bs h3{color:#1A7F4B;margin:0 0 12px;}@media print{button{display:none;}}</style></head><body><h1>🪔 श्री स्वामी समर्थ बचत गट</h1><h2>बारड · तालुका मुदखेड · जि. नांदेड</h2><h2>${monthName} - मासिक अहवाल</h2><div class="summary"><div class="box"><div class="box-val">${formatRs(stats.totalCollection)}</div><div class="box-lbl">एकूण संकलन</div></div><div class="box"><div class="box-val">${formatRs(stats.totalInterest)}</div><div class="box-lbl">व्याज</div></div><div class="box"><div class="box-val">${stats.paidCount}/${stats.totalMembers}</div><div class="box-lbl">भरले</div></div></div><table><thead><tr><th style="font-family:serif;">सदस्य</th><th>बचत</th><th>हप्ता</th><th>व्याज</th><th>एकूण</th><th>स्थिती</th></tr></thead><tbody>${rows}</tbody><tfoot><tr style="background:#FFF3E8;font-weight:700;"><td style="padding:10px;font-family:serif;">एकूण</td><td style="padding:10px;text-align:center;">${formatRs(stats.totalSaving)}</td><td style="padding:10px;text-align:center;">${formatRs(stats.totalPrincipal||0)}</td><td style="padding:10px;text-align:center;color:#C62828;">${formatRs(stats.totalInterest)}</td><td style="padding:10px;text-align:center;color:#1A7F4B;">${formatRs(stats.totalCollection)}</td><td></td></tr></tfoot></table>${bankBal>0?`<div class="bs"><h3>📊 Balance Sheet</h3><table><tr><td style="padding:6px;">Bank Balance</td><td style="padding:6px;font-weight:700;text-align:right;">${formatRs(bankBal)}</td></tr><tr><td style="padding:6px;">थकीत कर्जे</td><td style="padding:6px;font-weight:700;text-align:right;">${formatRs(members.reduce((s,m)=>s+m.balance,0))}</td></tr><tr style="background:#1A7F4B;color:#fff;"><td style="padding:8px;font-weight:700;">एकूण Group मालमत्ता</td><td style="padding:8px;font-weight:700;text-align:right;">${formatRs(bankBal+members.reduce((s,m)=>s+m.balance,0))}</td></tr></table></div>`:"" }<p style="text-align:center;margin-top:20px;color:#9C8060;font-size:12px;">दिनांक: ${new Date().toLocaleDateString("mr-IN")}</p><button onclick="window.print()" style="display:block;margin:20px auto;padding:12px 30px;background:#E8650A;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;">🖨️ Print / PDF Save करा</button></body></html>`;
    const w = window.open("","_blank"); w.document.write(html); w.document.close();
  }

  function shareWhatsApp() {
    if (!monthRecord) return;
    const [y,m] = selectedMonth.split("-");
    const monthName = `${M[parseInt(m)-1]} ${y}`;
    const pending = Object.entries(monthRecord.entries).filter(([,e])=>!e.paid).map(([id])=>members.find(mb=>mb.id===id)?.name).filter(Boolean);
    const bankBal = bankBalances[selectedMonth] || 0;
    const msg = `🪔 *श्री स्वामी समर्थ बचत गट - बारड*\n\n📅 *${monthName} अहवाल*\n\n💰 एकूण संकलन: ${formatRs(stats.totalCollection)}\n📈 व्याज: ${formatRs(stats.totalInterest)}\n🏦 बचत: ${formatRs(stats.totalSaving)}\n✅ भरले: ${stats.paidCount} सदस्य\n⏳ बाकी: ${stats.pendingCount} सदस्य${bankBal>0?`\n\n🏦 Bank Balance: ${formatRs(bankBal)}\n💎 Group मालमत्ता: ${formatRs(bankBal+members.reduce((s,m)=>s+m.balance,0))}`:""}${pending.length>0?`\n\n*थकबाकी सदस्य:*\n${pending.map((n,i)=>`${i+1}. ${n}`).join('\n')}`:`\n\n✅ सर्व सदस्यांनी रक्कम भरली!`}\n\n_bachat-gat.netlify.app_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  }

  function handleBackup() {
    const data = { members:JSON.parse(localStorage.getItem("sssb_members")||"[]"), months:JSON.parse(localStorage.getItem("sssb_months")||"{}"), currentMonth:localStorage.getItem("sssb_current_month"), bankBalances:loadBankBalances(), backupDate:new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="bachat-gat-backup.json"; a.click(); URL.revokeObjectURL(url);
  }

  function handleRestore(e) {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const data=JSON.parse(ev.target.result); if(data.members) localStorage.setItem("sssb_members",JSON.stringify(data.members)); if(data.months) localStorage.setItem("sssb_months",JSON.stringify(data.months)); if(data.currentMonth) localStorage.setItem("sssb_current_month",data.currentMonth); if(data.bankBalances) saveBankBalances(data.bankBalances); alert("Backup restore झाला!"); window.location.reload(); } catch { alert("File चुकीची आहे!"); } };
    reader.readAsText(file);
  }

  function printCertificate(member) {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>कर्ज पूर्णता प्रमाणपत्र</title><style>body{font-family:serif;margin:40px;text-align:center;background:#FFFDF7;}.border{border:8px double #E8650A;padding:40px;border-radius:16px;max-width:600px;margin:0 auto;}h1{color:#E8650A;}h2{color:#1A7F4B;}.name{font-size:26px;font-weight:700;color:#1A7F4B;border-bottom:2px solid #E8650A;display:inline-block;padding:0 20px;margin:16px 0;}.amount{font-size:22px;font-weight:700;color:#C62828;}@media print{button{display:none;}}</style></head><body><div class="border"><div style="font-size:60px;">🪔</div><h1>श्री स्वामी समर्थ बचत गट</h1><p style="color:#9C8060;">बारड · तालुका मुदखेड · जि. नांदेड</p><h2>कर्ज पूर्णता प्रमाणपत्र</h2><p>हे प्रमाणित केले जाते की</p><div class="name">${member.name}</div><p>यांनी घेतलेले एकूण कर्ज</p><div class="amount">${formatRs(member.loanAmount)}</div><p>पूर्णपणे परत फेड केले आहे.</p><p style="color:#9C8060;margin-top:20px;">दिनांक: ${new Date().toLocaleDateString("mr-IN")}</p><div style="margin-top:40px;display:flex;justify-content:space-around;"><div><div style="border-top:1px solid #333;width:120px;padding-top:8px;font-size:13px;">सचिव</div></div><div><div style="border-top:1px solid #333;width:120px;padding-top:8px;font-size:13px;">अध्यक्ष</div></div></div></div><br><button onclick="window.print()" style="padding:12px 30px;background:#1A7F4B;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;">🖨️ Certificate Print करा</button></body></html>`;
    const w = window.open("","_blank"); w.document.write(html); w.document.close();
  }

  return (
    <div style={{ padding: "16px 16px 100px" }}>
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {[["monthly","📋 मासिक"],["balance","📊 Balance Sheet"],["loans","💳 नवीन कर्ज"],["history","📜 इतिहास"],["backup","💾 बॅकअप"]].map(([v,l]) => (
          <button key={v} onClick={()=>setView(v)} style={{ flex:1, minWidth:60, padding:"8px 2px", fontSize:10, background:view===v?"var(--saffron)":"var(--surface)", color:view===v?"#fff":"var(--text2)", border:"1.5px solid", borderColor:view===v?"var(--saffron)":"var(--border)", borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
            <span className="marathi">{l}</span>
          </button>
        ))}
      </div>

      {view === "monthly" && (
        <div>
          <div style={{ marginBottom:14 }}>
            <label className="marathi">महिना निवडा</label>
            <select className="input marathi" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}>
              {monthKeys.map(k=><option key={k} value={k}>{monthLabel(k)}</option>)}
            </select>
          </div>
          {!monthRecord ? <div className="marathi text-center text-muted" style={{padding:40}}>या महिन्याची नोंद नाही</div> : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {[{label:"एकूण संकलन",value:formatRs(stats.totalCollection),color:"var(--green)",icon:"💰"},{label:"एकूण व्याज",value:formatRs(stats.totalInterest),color:"var(--blue)",icon:"📈"},{label:"एकूण बचत",value:formatRs(stats.totalSaving),color:"var(--saffron)",icon:"🏦"},{label:"मूळ वसुली",value:formatRs(stats.totalPrincipal||0),color:"#6A1B9A",icon:"💳"},{label:"भरले",value:stats.paidCount+" जण",color:"var(--green)",icon:"✅"},{label:"बाकी",value:stats.pendingCount+" जण",color:"var(--red)",icon:"⏳"}].map((s,i)=>(
                  <div key={i} className="card card-body" style={{textAlign:"center",padding:12}}>
                    <div style={{fontSize:22}}>{s.icon}</div>
                    <div style={{fontSize:16,fontWeight:700,color:s.color,marginTop:4}}>{s.value}</div>
                    <div className="marathi text-xs text-muted">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="card" style={{overflow:"hidden",marginBottom:16}}>
                <div style={{padding:"12px 14px",background:"var(--surface2)",borderBottom:"1px solid var(--border)"}}><div className="marathi font-bold">सविस्तर यादी</div></div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead><tr style={{background:"#FFF8F0"}}>{["सदस्य","बचत","हप्ता","व्याज","एकूण","✓"].map(h=><th key={h} className="marathi" style={{padding:"8px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text2)",borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                    <tbody>{members.map((m,i)=>{ const e=monthRecord.entries[m.id]; if(!e) return null; return(<tr key={m.id} style={{borderBottom:"1px solid #F5F0EA",background:i%2===0?"#fff":"var(--surface2)"}}><td className="marathi" style={{padding:"8px",fontWeight:600,fontSize:12}}>{m.name}</td><td style={{padding:"8px"}}>{formatRs(e.saving)}</td><td style={{padding:"8px"}}>{formatRs(e.principal)}</td><td style={{padding:"8px",color:"var(--red)"}}>{formatRs(e.interest)}</td><td style={{padding:"8px",fontWeight:700}}>{formatRs(e.totalDue)}</td><td style={{padding:"8px"}}><span style={{color:e.paid?"var(--green)":"var(--red)",fontWeight:700}}>{e.paid?"✓":"✗"}</span></td></tr>);})}</tbody>
                    <tfoot><tr style={{background:"#FFF8F0",fontWeight:700}}><td className="marathi" style={{padding:"8px"}}>एकूण</td><td style={{padding:"8px"}}>{formatRs(stats.totalSaving)}</td><td style={{padding:"8px"}}>{formatRs(stats.totalPrincipal||0)}</td><td style={{padding:"8px",color:"var(--red)"}}>{formatRs(stats.totalInterest)}</td><td style={{padding:"8px",color:"var(--green)"}}>{formatRs(stats.totalCollection)}</td><td/></tr></tfoot>
                  </table>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button className="btn btn-saffron btn-full" onClick={handlePDF}><span>📄</span><span className="marathi"> PDF Report तयार करा</span></button>
                <button className="btn btn-green btn-full" onClick={shareWhatsApp}><span>📲</span><span className="marathi"> WhatsApp वर Share करा</span></button>
              </div>
            </>
          )}
        </div>
      )}

      {view === "balance" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="card card-body">
            <div className="marathi font-bold mb-3" style={{fontSize:16}}>📊 Group Balance Sheet</div>
            <div style={{marginBottom:16}}>
              <label className="marathi">महिना निवडा आणि Bank Balance टाका</label>
              <select className="input marathi" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{marginBottom:8}}>
                {monthKeys.map(k=><option key={k} value={k}>{monthLabel(k)}</option>)}
              </select>
              <div style={{display:"flex",gap:8}}>
                <input className="input" type="number" value={bankInput} onChange={e=>setBankInput(e.target.value)} placeholder={`Bank Balance (सध्या: ${formatRs(bankBalances[selectedMonth]||0)})`} style={{flex:1}}/>
                <button className="btn btn-green" onClick={saveBankBalance}><span className="marathi">जतन</span></button>
              </div>
            </div>
          </div>

          <div style={{background:"linear-gradient(135deg, #1A7F4B, #135C36)",borderRadius:16,padding:20}}>
            <div className="marathi" style={{color:"rgba(255,255,255,0.8)",fontSize:13,marginBottom:4}}>Group एकूण मालमत्ता</div>
            <div style={{color:"#fff",fontSize:32,fontWeight:700}}>{formatRs(bs.netWorth)}</div>
          </div>

          <div className="card card-body">
            <div className="marathi font-bold mb-3">📋 तपशील</div>
            {[
              {icon:"🏦",label:"Bank मधील शिल्लक",value:formatRs(bs.bankBalance),color:"var(--blue)"},
              {icon:"💳",label:"थकीत कर्जे (वसुली बाकी)",value:formatRs(bs.totalOutstanding),color:"var(--saffron)"},
              {icon:"📈",label:"एकूण व्याज मिळाले",value:formatRs(bs.totalInterestEarned),color:"var(--green)"},
              {icon:"🏆",label:"एकूण संकलन (सर्व महिने)",value:formatRs(bs.totalCollection),color:"#4A148C"},
              {icon:"📄",label:"सक्रिय कर्जे",value:bs.activeLoans+" सदस्य",color:"var(--red)"},
              {icon:"✅",label:"कर्जमुक्त सदस्य",value:bs.completedLoans+" सदस्य",color:"var(--green)"},
            ].map((item,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<5?"1px solid var(--border)":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>{item.icon}</span>
                  <span className="marathi" style={{fontSize:13}}>{item.label}</span>
                </div>
                <span style={{fontWeight:700,fontSize:14,color:item.color}}>{item.value}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-saffron btn-full" onClick={()=>{
            const bsHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Balance Sheet</title><style>body{font-family:serif;margin:30px;}h1,h2{color:#E8650A;text-align:center;}table{width:100%;border-collapse:collapse;margin-top:16px;}td,th{padding:10px;border-bottom:1px solid #eee;}.total{background:#1A7F4B;color:#fff;font-weight:700;}@media print{button{display:none;}}</style></head><body><h1>🪔 श्री स्वामी समर्थ बचत गट</h1><h2>Group Balance Sheet - ${new Date().toLocaleDateString("mr-IN")}</h2><table><tr><th style="text-align:left;">तपशील</th><th style="text-align:right;">रक्कम</th></tr><tr><td>Bank मधील शिल्लक</td><td style="text-align:right;">${formatRs(bs.bankBalance)}</td></tr><tr><td>थकीत कर्जे (वसुली बाकी)</td><td style="text-align:right;">${formatRs(bs.totalOutstanding)}</td></tr><tr><td>एकूण व्याज मिळाले</td><td style="text-align:right;">${formatRs(bs.totalInterestEarned)}</td></tr><tr><td>एकूण बचत संकलन</td><td style="text-align:right;">${formatRs(bs.totalSavingsCollected)}</td></tr><tr class="total"><td>एकूण Group मालमत्ता</td><td style="text-align:right;">${formatRs(bs.netWorth)}</td></tr></table><br><button onclick="window.print()" style="padding:12px 30px;background:#E8650A;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;">🖨️ Print करा</button></body></html>`;
            const w=window.open("","_blank"); w.document.write(bsHtml); w.document.close();
          }}><span>📄</span><span className="marathi"> Balance Sheet PDF</span></button>
        </div>
      )}

      {view === "loans" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"#FFF8E1",borderRadius:12,padding:14,border:"1px solid #F4A825"}}>
            <div className="marathi font-bold" style={{color:"#B8860B",marginBottom:4}}>ℹ️ नियम</div>
            <div className="marathi text-sm" style={{color:"#B8860B"}}>जुने कर्ज पूर्ण झाल्यावरच नवीन कर्ज देता येईल.</div>
          </div>
          {members.map((m,i) => {
            const canGiveLoan = m.balance === 0;
            const [loanAmt, setLoanAmt] = useState("");
            return (
              <div key={m.id} className="card card-body fade-in">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div className="marathi font-bold" style={{fontSize:15}}>{m.name}</div>
                  <span className={"badge "+(canGiveLoan?"badge-green":"badge-red")}>
                    <span className="marathi">{canGiveLoan?"✓ पात्र":"कर्ज चालू"}</span>
                  </span>
                </div>
                {!canGiveLoan && <div className="marathi text-sm text-muted">बाकी: {formatRs(m.balance)}</div>}
                {canGiveLoan && (
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <input className="input" type="number" value={loanAmt} onChange={e=>setLoanAmt(e.target.value)} placeholder="कर्ज रक्कम ₹" style={{flex:1}}/>
                    <button className="btn btn-green" onClick={()=>{ if(!loanAmt||Number(loanAmt)<=0){alert("रक्कम भरा");return;} handleNewLoan(m,Number(loanAmt)); setLoanAmt(""); }} style={{whiteSpace:"nowrap"}}><span className="marathi">द्या</span></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === "history" && (
        <div>
          <div style={{background:"linear-gradient(135deg, #1A7F4B, #135C36)",borderRadius:16,padding:16,marginBottom:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[{l:"एकूण संकलन",v:formatRs(Object.values(months).reduce((s,mr)=>s+Object.values(mr.entries).filter(e=>e.paid).reduce((ss,e)=>ss+e.totalDue,0),0))},{l:"एकूण व्याज",v:formatRs(Object.values(months).reduce((s,mr)=>s+Object.values(mr.entries).filter(e=>e.paid).reduce((ss,e)=>ss+e.interest,0),0))},{l:"एकूण बचत",v:formatRs(Object.values(months).reduce((s,mr)=>s+Object.values(mr.entries).filter(e=>e.paid).reduce((ss,e)=>ss+e.saving,0),0))},{l:"एकूण महिने",v:Object.keys(months).length}].map(({l,v})=>(
              <div key={l} style={{textAlign:"center"}}><div style={{color:"#fff",fontSize:17,fontWeight:700}}>{v}</div><div className="marathi" style={{color:"rgba(255,255,255,0.7)",fontSize:11}}>{l}</div></div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {monthKeys.map(k=>{ const mr=months[k]; const s=getMonthStats(mr,members); const bb=bankBalances[k]||0; return(
              <div key={k} className="card card-body">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div className="marathi font-bold">{monthLabel(k)}</div><div className="marathi text-xs text-muted">{s.paidCount}/{s.totalMembers} सदस्य</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontWeight:700,color:"var(--green)",fontSize:15}}>{formatRs(s.totalCollection)}</div><div className="marathi text-xs text-muted">व्याज: {formatRs(s.totalInterest)}</div></div>
                </div>
                {bb>0&&<div className="marathi text-xs text-blue mt-1">🏦 Bank: {formatRs(bb)}</div>}
                {s.pendingCount>0&&<div style={{marginTop:6}}><span className="badge badge-red"><span className="marathi">{s.pendingCount} बाकी</span></span></div>}
              </div>
            );})}
          </div>
        </div>
      )}

      {view === "backup" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="card card-body" style={{textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:12}}>💾</div>
            <div className="marathi font-bold text-lg mb-2">डेटा बॅकअप</div>
            <div className="marathi text-muted text-sm mb-4">सर्व data JSON file मध्ये save होईल</div>
            <button className="btn btn-green btn-full" onClick={handleBackup}><span>⬇️</span><span className="marathi"> Backup Download करा</span></button>
          </div>
          <div className="card card-body" style={{textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:12}}>📂</div>
            <div className="marathi font-bold text-lg mb-2">Backup Restore करा</div>
            <label style={{display:"block",background:"var(--blue)",color:"#fff",padding:"12px 20px",borderRadius:10,cursor:"pointer",fontWeight:600}}>
              <span>📁 </span><span className="marathi">File निवडा</span>
              <input type="file" accept=".json" onChange={handleRestore} style={{display:"none"}}/>
            </label>
          </div>
          <div style={{background:"#FFF8E1",borderRadius:12,padding:14,border:"1px solid #F4A825"}}>
            <div className="marathi text-sm font-bold" style={{color:"#B8860B",marginBottom:6}}>⚠️ महत्त्वाचे</div>
            <div className="marathi text-sm" style={{color:"#B8860B"}}>दर महिन्याला backup घ्या!</div>
          </div>
          <div className="card card-body">
            <div className="marathi font-bold mb-3">🏆 कर्जमुक्त सदस्य</div>
            {members.filter(m=>m.loanAmount>0&&m.balance===0).length===0 && <div className="marathi text-muted text-sm">अद्याप कोणीही कर्जमुक्त नाही</div>}
            {members.filter(m=>m.loanAmount>0&&m.balance===0).map(m=>(
              <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                <div className="marathi font-bold">{m.name}</div>
                <button className="btn btn-sm" style={{background:"#1A7F4B",color:"#fff"}} onClick={()=>printCertificate(m)}><span>🏆</span><span className="marathi"> Certificate</span></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
