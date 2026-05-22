import { useState, useEffect } from "react";
import { supabase } from "../supabase";

// SCREENS: key | setPassword | login | selectGroup | forgot | resetPassword
export default function LicenseScreen({ onSuccess }) {
  const [screen, setScreen] = useState("key");
  const [licenseKey, setLicenseKey] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [licenseRow, setLicenseRow] = useState(null);
  const [groups, setGroups] = useState([]);

  // Check if already logged in
  useEffect(() => {
    const saved = localStorage.getItem("bm_session");
    if (saved) {
      const session = JSON.parse(saved);
      if (session.groups && session.groups.length === 1) {
        onSuccess(session.groups[0]);
      } else if (session.groups && session.groups.length > 1) {
        setGroups(session.groups);
        setScreen("selectGroup");
      }
    }
  }, []);

  async function handleKeySubmit() {
    setError("");
    if (!licenseKey.trim()) { setError("License key टाका"); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from("licenses")
      .select("*, groups(*)")
      .eq("license_key", licenseKey.trim().toUpperCase())
      .eq("status", "active")
      .single();
    setLoading(false);
    if (err || !data) {
      setError("चुकीची license key! पवन भिमेवार यांच्याशी संपर्क करा.\n📞 8007006310");
      return;
    }
    setLicenseRow(data);
    if (!data.password) {
      setScreen("setPassword");
    } else {
      setScreen("login");
    }
  }

  async function handleSetPassword() {
    setError("");
    if (password.length < 4) { setError("Password किमान 4 अक्षरांचा असावा"); return; }
    if (password !== confirmPassword) { setError("Password जुळत नाही!"); return; }
    setLoading(true);
    const { error: err } = await supabase
      .from("licenses")
      .update({ password: password })
      .eq("license_key", licenseKey.trim().toUpperCase());
    setLoading(false);
    if (err) { setError("Error! पुन्हा प्रयत्न करा"); return; }
    saveAndProceed(licenseRow);
  }

  async function handleLogin() {
    setError("");
    if (!password) { setError("Password टाका"); return; }
    if (password === licenseRow.password) {
      saveAndProceed(licenseRow);
    } else {
      setError("चुकीचा password! पुन्हा प्रयत्न करा");
    }
  }

  async function handleForgotKey() {
    setError("");
    if (!licenseKey.trim()) { setError("License key टाका"); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", licenseKey.trim().toUpperCase())
      .single();
    setLoading(false);
    if (err || !data) { setError("चुकीची license key!"); return; }
    setLicenseRow(data);
    setScreen("resetPassword");
  }

  async function handleResetPassword() {
    setError("");
    if (password.length < 4) { setError("Password किमान 4 अक्षरांचा असावा"); return; }
    if (password !== confirmPassword) { setError("Password जुळत नाही!"); return; }
    setLoading(true);
    const { error: err } = await supabase
      .from("licenses")
      .update({ password: password })
      .eq("license_key", licenseKey.trim().toUpperCase());
    setLoading(false);
    if (err) { setError("Error! पुन्हा प्रयत्न करा"); return; }
    saveAndProceed(licenseRow);
  }

  function saveAndProceed(license) {
    const groupData = license.groups;
    const session = { groups: [groupData], licenseKey: license.license_key };
    localStorage.setItem("bm_session", JSON.stringify(session));
    onSuccess(groupData);
  }

  function handleGroupSelect(group) {
    onSuccess(group);
  }

  function handleLogout() {
    localStorage.removeItem("bm_session");
    setScreen("key");
    setLicenseKey("");
    setPassword("");
    setGroups([]);
  }

  const bg = { minHeight:"100vh", background:"linear-gradient(135deg, #E8650A, #A03A06)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 };
  const card = { background:"#fff", borderRadius:20, padding:28, width:"100%", maxWidth:340, boxShadow:"0 8px 32px rgba(0,0,0,0.2)" };

  return (
    <div style={bg}>
      <div style={{ fontSize:60, marginBottom:16 }}>🪔</div>
      <div className="marathi" style={{ color:"#fff", fontSize:20, fontWeight:700, marginBottom:4, textAlign:"center" }}>BachatMitra</div>
      <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginBottom:32, textAlign:"center" }}>by Pawan Bhimewar & Associates, Nanded</div>

      <div style={card}>

        {screen === "key" && <>
          <div className="marathi font-bold text-center" style={{ fontSize:18, marginBottom:8 }}>🔑 License Key टाका</div>
          <div className="marathi text-center" style={{ fontSize:12, color:"var(--text3)", marginBottom:20 }}>पवन भिमेवार यांनी दिलेली key टाका</div>
          <input className="input" value={licenseKey} onChange={e=>setLicenseKey(e.target.value.toUpperCase())} placeholder="उदा. SWAMI-2024" style={{ textAlign:"center", fontSize:18, marginBottom:12, letterSpacing:2 }} />
          {error && <div className="marathi" style={{ color:"var(--red)", fontSize:13, marginBottom:12, textAlign:"center", whiteSpace:"pre-line" }}>{error}</div>}
          <button className="btn btn-saffron btn-full" onClick={handleKeySubmit} disabled={loading || !licenseKey.trim()}>
            <span className="marathi">{loading ? "तपासत आहे..." : "✅ पुढे जा"}</span>
          </button>
        </>}

        {screen === "setPassword" && <>
          <div className="marathi font-bold text-center" style={{ fontSize:18, marginBottom:8 }}>🔐 नवीन Password सेट करा</div>
          <div className="marathi text-center" style={{ fontSize:12, color:"var(--text3)", marginBottom:4 }}>स्वागत आहे!</div>
          <div className="marathi font-bold text-center" style={{ fontSize:14, color:"var(--saffron)", marginBottom:20 }}>{licenseRow?.groups?.name}</div>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="नवीन Password" style={{ textAlign:"center", fontSize:16, marginBottom:12 }} />
          <input className="input" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Password पुन्हा टाका" style={{ textAlign:"center", fontSize:16, marginBottom:12 }} />
          {error && <div className="marathi" style={{ color:"var(--red)", fontSize:13, marginBottom:12, textAlign:"center" }}>{error}</div>}
          <button className="btn btn-saffron btn-full" onClick={handleSetPassword} disabled={loading}>
            <span className="marathi">{loading ? "सेव्ह होत आहे..." : "✅ Password सेव्ह करा"}</span>
          </button>
          <button onClick={() => { setScreen("key"); setError(""); }} style={{ marginTop:12, background:"none", border:"none", color:"var(--text3)", fontSize:12, width:"100%", cursor:"pointer" }}>
            <span className="marathi">← मागे जा</span>
          </button>
        </>}

        {screen === "login" && <>
          <div className="marathi font-bold text-center" style={{ fontSize:18, marginBottom:8 }}>🔑 Password टाका</div>
          <div className="marathi font-bold text-center" style={{ fontSize:14, color:"var(--saffron)", marginBottom:20 }}>{licenseRow?.groups?.name}</div>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" style={{ textAlign:"center", fontSize:16, marginBottom:12 }} />
          {error && <div className="marathi" style={{ color:"var(--red)", fontSize:13, marginBottom:12, textAlign:"center" }}>{error}</div>}
          <button className="btn btn-saffron btn-full" onClick={handleLogin} disabled={loading}>
            <span className="marathi">{loading ? "..." : "✅ Login करा"}</span>
          </button>
          <button onClick={() => { setScreen("forgot"); setError(""); setPassword(""); }} style={{ marginTop:12, background:"none", border:"none", color:"#E8650A", fontSize:13, width:"100%", cursor:"pointer" }}>
            <span className="marathi">🔁 Password विसरलात?</span>
          </button>
          <button onClick={() => { setScreen("key"); setError(""); setPassword(""); }} style={{ marginTop:8, background:"none", border:"none", color:"var(--text3)", fontSize:12, width:"100%", cursor:"pointer" }}>
            <span className="marathi">← मागे जा</span>
          </button>
        </>}

        {screen === "forgot" && <>
          <div className="marathi font-bold text-center" style={{ fontSize:18, marginBottom:8 }}>🔁 Password Reset करा</div>
          <div className="marathi text-center" style={{ fontSize:12, color:"var(--text3)", marginBottom:20 }}>तुमची License Key टाका</div>
          <input className="input" value={licenseKey} onChange={e=>setLicenseKey(e.target.value.toUpperCase())} placeholder="उदा. SWAMI-2024" style={{ textAlign:"center", fontSize:18, marginBottom:12, letterSpacing:2 }} />
          {error && <div className="marathi" style={{ color:"var(--red)", fontSize:13, marginBottom:12, textAlign:"center" }}>{error}</div>}
          <button className="btn btn-saffron btn-full" onClick={handleForgotKey} disabled={loading || !licenseKey.trim()}>
            <span className="marathi">{loading ? "तपासत आहे..." : "✅ पुढे जा"}</span>
          </button>
          <button onClick={() => { setScreen("key"); setError(""); }} style={{ marginTop:12, background:"none", border:"none", color:"var(--text3)", fontSize:12, width:"100%", cursor:"pointer" }}>
            <span className="marathi">← मागे जा</span>
          </button>
        </>}

        {screen === "resetPassword" && <>
          <div className="marathi font-bold text-center" style={{ fontSize:18, marginBottom:8 }}>🔐 नवीन Password टाका</div>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="नवीन Password" style={{ textAlign:"center", fontSize:16, marginBottom:12 }} />
          <input className="input" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Password पुन्हा टाका" style={{ textAlign:"center", fontSize:16, marginBottom:12 }} />
          {error && <div className="marathi" style={{ color:"var(--red)", fontSize:13, marginBottom:12, textAlign:"center" }}>{error}</div>}
          <button className="btn btn-saffron btn-full" onClick={handleResetPassword} disabled={loading}>
            <span className="marathi">{loading ? "सेव्ह होत आहे..." : "✅ Password Reset करा"}</span>
          </button>
        </>}

        {screen === "selectGroup" && <>
          <div className="marathi font-bold text-center" style={{ fontSize:18, marginBottom:16 }}>📋 गट निवडा</div>
          {groups.map(g => (
            <div key={g.id} onClick={() => handleGroupSelect(g)} style={{ background:"var(--saffron-light)", borderRadius:12, padding:14, marginBottom:10, cursor:"pointer", border:"2px solid var(--saffron)" }}>
              <div className="marathi font-bold" style={{ fontSize:14 }}>{g.name}</div>
              {g.address && <div className="marathi" style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>{g.address}</div>}
            </div>
          ))}
          <button onClick={handleLogout} style={{ marginTop:12, background:"none", border:"none", color:"var(--text3)", fontSize:12, width:"100%", cursor:"pointer" }}>
            <span className="marathi">🚪 Logout</span>
          </button>
        </>}

        <div style={{ textAlign:"center", marginTop:20, color:"var(--text3)", fontSize:11 }}>
          <div>License साठी संपर्क करा:</div>
          <div style={{ fontWeight:700, marginTop:4 }}>📞 8007006310</div>
          <div>पवन भिमेवार अँड असोसिएट्स, नांदेड</div>
        </div>
      </div>
    </div>
  );
}