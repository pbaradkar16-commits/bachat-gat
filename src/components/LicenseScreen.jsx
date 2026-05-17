import { useState } from "react";

const VALID_KEYS = [
  "BACHAT-2024-AAAA",
  "BACHAT-2024-BBBB",
  "BACHAT-2024-CCCC",
];

export default function LicenseScreen({ onSuccess }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  function handleVerify() {
    if (VALID_KEYS.includes(key.trim().toUpperCase())) {
      localStorage.setItem("bachat_license", key.trim().toUpperCase());
      onSuccess();
    } else {
      setError("Invalid license key! Please contact Pawan Bhimewar & Associates.");
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #E8650A, #A03A06)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🪔</div>
      <div className="marathi" style={{ color:"#fff", fontSize:20, fontWeight:700, marginBottom:4, textAlign:"center" }}>BachatMitra</div>
      <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginBottom:32, textAlign:"center" }}>by Pawan Bhimewar & Associates, Nanded</div>
      <div style={{ background:"#fff", borderRadius:20, padding:28, width:"100%", maxWidth:340, boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
        <div className="marathi font-bold text-center" style={{ fontSize:18, marginBottom:8 }}>🔐 License Key टाका</div>
        <div className="marathi text-center" style={{ fontSize:12, color:"var(--text3)", marginBottom:20 }}>एकदा activate केल्यावर कायम वापरता येईल</div>
        <input
          className="input"
          type="text"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="BACHAT-XXXX-XXXX"
          style={{ textAlign:"center", fontSize:16, letterSpacing:2, marginBottom:12, textTransform:"uppercase" }}
        />
        {error && <div className="marathi" style={{ color:"var(--red)", fontSize:13, marginBottom:12, textAlign:"center" }}>{error}</div>}
        <button className="btn btn-saffron btn-full" onClick={handleVerify} disabled={key.length < 5} style={{ opacity:key.length>=5?1:0.5 }}>
          <span className="marathi">✅ Activate करा</span>
        </button>
        <div style={{ textAlign:"center", marginTop:20, color:"var(--text3)", fontSize:11 }}>
          <div>License साठी संपर्क करा:</div>
          <div style={{ fontWeight:700, marginTop:4 }}>📞 8007006310</div>
          <div>पवन भिमेवार अँड असोसिएट्स, नांदेड</div>
        </div>
      </div>
    </div>
  );
}
