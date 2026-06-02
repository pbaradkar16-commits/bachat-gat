import { useState } from "react";
import { formatRs, calcEMI, calcInterest, SAVING_AMOUNT, genId } from "../store.js";
import { toast } from "./Toast.jsx";
function LoanHistoryModal({ member, months, onClose }) {
  const history = Object.entries(months).sort(([a],[b]) => a.localeCompare(b)).map(([key, mr]) => { const e = mr.entries[member.id]; return e ? { key, ...e } : null; }).filter(Boolean);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle"/>
        <div className="marathi font-bold text-lg mb-4">{member.name} - कर्ज इतिहास</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {history.length === 0 && <div className="marathi text-muted text-center" style={{padding:20}}>कोणतीही नोंद नाही</div>}
          {history.map((h,i) => {
            const { monthLabel } = require ? (() => { const M=["जानेवारी","फेब्रुवारी","मार्च","एप्रिल","मे","जून","जुलै","ऑगस्ट","सप्टेंबर","ऑक्टोबर","नोव्हेंबर","डिसेंबर"]; const [y,m]=h.key.split("-"); return {monthLabel:`${M[parseInt(m)-1]} ${y}`}; })() : (() => { const M=["जानेवारी","फेब्रुवारी","मार्च","एप्रिल","मे","जून","जुलै","ऑगस्ट","सप्टेंबर","ऑक्टोबर","नोव्हेंबर","डिसेंबर"]; const [y,m]=h.key.split("-"); return {monthLabel:`${M[parseInt(m)-1]} ${y}`}; })();
            return (
              <div key={i} style={{background:h.paid?"var(--green-light)":"var(--red-light)",borderRadius:10,padding:"10px 12px",border:`1px solid ${h.paid?"var(--green)":"var(--red)"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div className="marathi font-bold" style={{fontSize:13}}>{monthLabel}</div>
                  <span className={"badge "+(h.paid?"badge-green":"badge-red")}><span className="marathi">{h.paid?"✓ भरले":"बाकी"}</span></span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:8}}>
                  {[["बचत",h.saving],["हप्ता",h.principal],["व्याज",h.interest]].map(([l,v])=>(
                    <div key={l} style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:700}}>{formatRs(v)}</div><div className="marathi text-xs text-muted">{l}</div></div>
                  ))}
                </div>
                <div style={{marginTop:6,textAlign:"right"}}><span className="marathi text-xs text-muted">एकूण: </span><span style={{fontWeight:700,fontSize:13}}>{formatRs(h.totalDue)}</span></div>
                {h.paid && h.paidAt && <div className="marathi text-xs text-muted" style={{marginTop:4}}>दिनांक: {new Date(h.paidAt).toLocaleDateString("mr-IN")}</div>}
              </div>
            );
          })}
        </div>
        <button className="btn btn-outline btn-full" style={{marginTop:16}} onClick={onClose}><span className="marathi">बंद करा</span></button>
      </div>
    </div>
  );
}
function MemberModal({ member, onSave, onClose }) {
  const isNew = !member.id;
  const [form, setForm] = useState({ name: member.name||"", phone: member.phone||"", loanAmount: member.loanAmount||0, balance: member.balance||0, emi: member.emi||0 });
  function set(k,v) { setForm(f=>({...f,[k]:v})); }
  function handleSave() {
    if (!form.name.trim()) { toast("नाव भरा","error"); return; }
    const loanAmount = Number(form.loanAmount)||0;
    const balance = Number(form.balance)||0;
    onSave({...member, id:member.id||genId(), name:form.name.trim(), phone:form.phone.trim(), loanAmount:loanAmount||balance, balance, emi:Number(form.emi)||0, createdAt:member.createdAt||Date.now()});
  }
  const emi=Number(form.emi)||0;
  const interest=calcInterest(Number(form.balance)||0);
  const totalDue=SAVING_AMOUNT+emi+interest;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div className="marathi text-lg font-bold mb-4">{isNew?"नवीन सदस्य जोडा":"सदस्य माहिती बदला"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><label className="marathi">नाव *</label><input className="input input-marathi" value={form.name} onChange={e=>set("name",e.target.value)} placeholder="सदस्याचे नाव"/></div>
          <div><label className="marathi">मोबाइल नंबर</label><input className="input" type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="10 अंकी नंबर"/></div>
          <div><label className="marathi">मूळ कर्ज रक्कम (₹)</label><input className="input" type="number" value={form.loanAmount} onChange={e=>set("loanAmount",e.target.value)} placeholder="0" min="0"/></div>
          <div><label className="marathi">उर्वरित कर्ज शिल्लक (₹)</label><input className="input" type="number" value={form.balance} onChange={e=>set("balance",e.target.value)} placeholder="0" min="0"/></div>
          <div><label className="marathi">मासिक हप्ता / EMI (₹)</label><input className="input" type="number" value={form.emi} onChange={e=>set("emi",e.target.value)} placeholder="0" min="0"/></div>
          {(Number(form.loanAmount)>0||Number(form.balance)>0)&&(
            <div style={{background:"var(--green-light)",borderRadius:12,padding:"12px 14px"}}>
              <div className="marathi text-sm font-bold text-green mb-2">मासिक देणे (अंदाज)</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[["बचत",SAVING_AMOUNT],["हप्ता",emi],["व्याज",interest]].map(([l,v])=>(
                  <div key={l} style={{textAlign:"center"}}><div style={{fontWeight:700}}>{formatRs(v)}</div><div className="marathi text-xs text-muted">{l}</div></div>
                ))}
              </div>
              <div style={{height:1,background:"var(--border)",margin:"10px 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between"}}><span className="marathi text-sm font-bold">एकूण</span><span style={{fontWeight:700,color:"var(--green)"}}>{formatRs(totalDue)}</span></div>
            </div>
          )}
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button className="btn btn-outline btn-full" onClick={onClose}><span className="marathi">रद्द</span></button>
            <button className="btn btn-green btn-full" onClick={handleSave}><span className="marathi">{isNew?"जोडा":"जतन करा"}</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function Members({ members, months, onSave, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [expandId, setExpandId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [historyMember, setHistoryMember] = useState(null);
  const filtered = members.filter(m=>m.name.includes(search)||m.phone.includes(search));
  function handleSave(member) { onSave(member); setEditing(null); toast(member.id?"माहिती जतन झाली":"नवीन सदस्य जोडला ✓","success"); }
  function handleDelete(member) { onDelete(member.id); setDeleteConfirm(null); toast(`${member.name} काढले`,"info"); }
  return (
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {[{label:"एकूण सदस्य",value:members.length,color:"var(--saffron)"},{label:"कर्जदार",value:members.filter(m=>m.balance>0).length,color:"var(--red)"},{label:"कर्जमुक्त",value:members.filter(m=>m.loanAmount>0&&m.balance===0).length,color:"var(--green)"}].map((s,i)=>(
          <div key={i} className="card card-body" style={{textAlign:"center",padding:12}}>
            <div style={{fontSize:20,fontWeight:700,color:s.color}}>{s.value}</div>
            <div className="marathi text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <input className="input marathi" placeholder="🔍 सदस्य शोधा..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1}}/>
        <button className="btn btn-green btn-sm" onClick={()=>setEditing({})}><span>＋</span><span className="marathi">जोडा</span></button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map((member,idx)=>{
          const emi=Number(member.emi)||0;
          const interest=calcInterest(member.balance);
          const totalDue=SAVING_AMOUNT+emi+interest;
          const loanPct=member.loanAmount>0?((member.loanAmount-member.balance)/member.loanAmount)*100:0;
          const isExpanded=expandId===member.id;
          const paidMonths=months?Object.values(months).filter(mr=>{const e=mr.entries[member.id];return e&&e.paid;}).length:0;
          return (
            <div key={member.id} className="card fade-in" style={{animationDelay:`${idx*0.03}s`}}>
              <div className="card-body" style={{cursor:"pointer"}} onClick={()=>setExpandId(isExpanded?null:member.id)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:"var(--saffron-light)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"var(--saffron)",flexShrink:0}}>{member.name.charAt(0)}</div>
                      <div>
                        <div className="marathi font-bold" style={{fontSize:15}}>{member.name}</div>
                        {member.phone&&<div style={{fontSize:12,color:"var(--text3)"}}>📞 {member.phone}</div>}
                      </div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:700,color:"var(--green)"}}>{formatRs(totalDue)}</div>
                    <div className="marathi text-xs text-muted">मासिक देणे</div>
                  </div>
                </div>
                {(member.loanAmount>0||member.balance>0)&&(
                  <div style={{marginTop:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span className="marathi text-xs text-muted">कर्ज परतफेड</span>
                      <span className="marathi text-xs font-bold">{formatRs(member.balance)} बाकी</span>
                    </div>
                    <div style={{background:"#F0EDE8",borderRadius:4,height:6,overflow:"hidden"}}>
                      <div style={{width:`${loanPct}%`,height:"100%",background:"linear-gradient(90deg, var(--green), #22C55E)",borderRadius:4}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                      <div className="marathi text-xs text-muted">{Math.round(loanPct)}% परतफेड</div>
                      <div className="marathi text-xs text-muted">{paidMonths} महिने भरले</div>
                    </div>
                  </div>
                )}
                {(!(member.balance>0)&&!(member.emi>0))&&<div style={{marginTop:8}}><span className="badge badge-green"><span className="marathi">फक्त बचत सदस्य</span></span></div>}
              </div>
              {isExpanded&&(
                <div style={{borderTop:"1px solid var(--border)",padding:"12px 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button className="btn btn-blue btn-sm" style={{flex:1}} onClick={()=>{setEditing(member);setExpandId(null);}}><span>✏️</span><span className="marathi">बदला</span></button>
                  <button className="btn btn-sm" style={{flex:1,background:"#6A1B9A",color:"#fff"}} onClick={()=>{setHistoryMember(member);setExpandId(null);}}><span>📜</span><span className="marathi">इतिहास</span></button>
                  <button className="btn btn-red btn-sm" style={{flex:1}} onClick={()=>{setDeleteConfirm(member);setExpandId(null);}}><span>🗑️</span><span className="marathi">काढा</span></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"var(--text3)"}}><div style={{fontSize:40,marginBottom:8}}>👥</div><div className="marathi">कोणताही सदस्य सापडला नाही</div></div>}
      {editing!==null&&<MemberModal member={editing} onSave={handleSave} onClose={()=>setEditing(null)}/>}
      {historyMember&&<LoanHistoryModal member={historyMember} months={months||{}} onClose={()=>setHistoryMember(null)}/>}
      {deleteConfirm&&(
        <div className="modal-overlay" onClick={()=>setDeleteConfirm(null)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div style={{textAlign:"center",padding:"0 10px"}}>
              <div style={{fontSize:48,marginBottom:12}}>⚠️</div>
              <div className="marathi font-bold text-lg mb-2">सदस्य काढायचा का?</div>
              <div className="marathi text-muted mb-6">"{deleteConfirm.name}" यांना काढल्यानंतर सर्व डेटा जाईल.</div>
              <div style={{display:"flex",gap:12}}>
                <button className="btn btn-outline btn-full" onClick={()=>setDeleteConfirm(null)}><span className="marathi">रद्द</span></button>
                <button className="btn btn-red btn-full" onClick={()=>handleDelete(deleteConfirm)}><span className="marathi">हो, काढा</span></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
