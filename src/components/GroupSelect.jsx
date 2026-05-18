import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";

export default function GroupSelect({ onSelect }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [meetingDay, setMeetingDay] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadGroups(); }, []);

  async function loadGroups() {
    setLoading(true);
    const { data } = await supabase.from('groups').select('*').order('created_at', { ascending: true });
    setGroups(data || []);
    setLoading(false);
  }

  async function handleCreateGroup() {
    if (!newName.trim()) { alert("गट नाव भरा!"); return; }
    if (!meetingDay || meetingDay < 1 || meetingDay > 31) { alert("बैठकीचा दिवस भरा! (1-31)"); return; }
    setSaving(true);
    const { data } = await supabase.from('groups').insert({ name: newName.trim(), address: newAddress.trim(), meeting_day: Number(meetingDay) }).select().single();
    if (data) { setGroups(prev => [...prev, data]); setShowNew(false); setNewName(""); setNewAddress(""); setMeetingDay(""); onSelect(data); }
    setSaving(false);
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <div style={{ fontSize:50, marginBottom:16 }}>🪔</div>
      <div className="marathi" style={{ fontSize:16, color:"var(--text2)" }}>गट लोड होत आहे...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #E8650A, #A03A06)", padding:20, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontSize:60, marginBottom:8 }}>🪔</div>
      <div className="marathi" style={{ color:"#fff", fontSize:22, fontWeight:700, marginBottom:4, textAlign:"center" }}>BachatMitra</div>
      <div className="marathi" style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginBottom:24, textAlign:"center" }}>गट निवडा</div>
      <div style={{ width:"100%", maxWidth:400 }}>
        {groups.map(g => (
          <div key={g.id} onClick={() => onSelect(g)} style={{ background:"#fff", borderRadius:14, padding:16, marginBottom:12, cursor:"pointer", boxShadow:"0 4px 16px rgba(0,0,0,0.15)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div className="marathi font-bold" style={{ fontSize:15 }}>{g.name}</div>
              {g.address && <div className="marathi" style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>{g.address}</div>}
              {g.meeting_day && <div className="marathi" style={{ fontSize:11, color:"var(--saffron)", marginTop:2 }}>📅 बैठक: दर महिन्याच्या {g.meeting_day} तारखेला</div>}
            </div>
            <div style={{ fontSize:24 }}>▶</div>
          </div>
        ))}
        {!showNew ? (
          <button onClick={() => setShowNew(true)} style={{ width:"100%", background:"rgba(255,255,255,0.2)", border:"2px dashed rgba(255,255,255,0.6)", borderRadius:14, padding:16, color:"#fff", fontSize:16, cursor:"pointer", fontFamily:"inherit" }}>
            <span className="marathi">➕ नवीन बचत गट बनवा</span>
          </button>
        ) : (
          <div style={{ background:"#fff", borderRadius:14, padding:20 }}>
            <div className="marathi font-bold" style={{ fontSize:16, marginBottom:14 }}>नवीन बचत गट</div>
            <div style={{ marginBottom:12 }}>
              <label className="marathi" style={{ fontSize:13 }}>गटाचे नाव *</label>
              <input className="input marathi" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="उदा. श्री गणेश बचत गट"/>
            </div>
            <div style={{ marginBottom:12 }}>
              <label className="marathi" style={{ fontSize:13 }}>पत्ता</label>
              <input className="input marathi" value={newAddress} onChange={e=>setNewAddress(e.target.value)} placeholder="उदा. तालुका मुदखेड"/>
            </div>
            <div style={{ marginBottom:16 }}>
              <label className="marathi" style={{ fontSize:13 }}>📅 बैठकीची तारीख (महिन्याचा दिवस) *</label>
              <input className="input" type="number" min="1" max="31" value={meetingDay} onChange={e=>setMeetingDay(e.target.value)} placeholder="उदा. 2"/>
              <div className="marathi" style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>म्हणजे दर महिन्याच्या {meetingDay || "?"} तारखेला बैठक होते</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn btn-saffron" style={{ flex:1 }} onClick={handleCreateGroup} disabled={saving}><span className="marathi">{saving?"जतन होत आहे...":"✓ बनवा"}</span></button>
              <button className="btn btn-outline" onClick={() => setShowNew(false)}><span className="marathi">रद्द</span></button>
            </div>
          </div>
        )}
        <div className="marathi" style={{ textAlign:"center", marginTop:20, color:"rgba(255,255,255,0.6)", fontSize:11 }}>निर्मिती: पवन भिमेवार अँड असोसिएट्स, नांदेड</div>
      </div>
    </div>
  );
}
