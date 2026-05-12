export const SAVING_AMOUNT = 1000;
export const LOAN_MONTHS = 20;
export const INTEREST_RATE = 0.015;
const KEYS = { members: "sssb_members", months: "sssb_months", currentMonth: "sssb_current_month", bankBalance: "sssb_bank_balance" };
const DEFAULT_MEMBERS = ["रवी कराळे","सुनील घंटेवार","शिवराज कस्तुरे","पवन भिमेवार","शेख शब्बीर मामा","माधव सूर्यवंशी","नागोराव मामा कल्याणकर","दिगंबर येलमगुंडे","संदीप मामा बट्टेवार","पिराजीराव केदारे","प्रदीप हुके","परमेश्वर धर्मे","सुदाम मुपडे","अमोल पंचभाई","गिरीष घंटेवार","शुभम चिवटेवार","पदमेश दुर्गे","संदीप पानबुडे","साहेब सोनटके","शंकर शिंदे"];
export function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
export function monthKey(year, month) { return `${year}-${String(month).padStart(2, "0")}`; }
export function monthLabel(key) {
  const M = ["जानेवारी","फेब्रुवारी","मार्च","एप्रिल","मे","जून","जुलै","ऑगस्ट","सप्टेंबर","ऑक्टोबर","नोव्हेंबर","डिसेंबर"];
  const [y, m] = key.split("-"); return `${M[parseInt(m)-1]} ${y}`;
}
export function nextMonthKey(key) { let [y,m]=key.split("-").map(Number); m+=1; if(m>12){m=1;y+=1;} return monthKey(y,m); }
export function prevMonthKey(key) { let [y,m]=key.split("-").map(Number); m-=1; if(m<1){m=12;y-=1;} return monthKey(y,m); }
export function todayMonthKey() { const d=new Date(); return monthKey(d.getFullYear(),d.getMonth()+1); }
export function calcEMI(loanAmount) { return loanAmount>0 ? Math.round(loanAmount/LOAN_MONTHS) : 0; }
export function calcInterest(balance) { return balance>0 ? Math.round(balance*INTEREST_RATE) : 0; }
export function formatRs(n) { return "₹"+Number(n||0).toLocaleString("en-IN"); }
function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
export function loadMembers() {
  const saved = load(KEYS.members);
  if (saved && saved.length > 0) return saved;
  const members = DEFAULT_MEMBERS.map((name,i) => ({ id: "member_"+i, name, phone:"", loanAmount:0, balance:0, createdAt:Date.now() }));
  save(KEYS.members, members); return members;
}
export function saveMembers(members) { save(KEYS.members, members); }
export function loadMonths() { return load(KEYS.months) || {}; }
export function saveMonths(months) { save(KEYS.months, months); }
export function loadCurrentMonth() { return load(KEYS.currentMonth) || todayMonthKey(); }
export function saveCurrentMonth(key) { save(KEYS.currentMonth, key); }
export function loadBankBalances() { try { return JSON.parse(localStorage.getItem(KEYS.bankBalance)||"{}"); } catch { return {}; } }
export function saveBankBalances(b) { localStorage.setItem(KEYS.bankBalance, JSON.stringify(b)); }
export function createMonthRecord(members, key) {
  const entries = {};
  members.forEach((m) => {
    const principal = calcEMI(m.loanAmount);
    const interest = calcInterest(m.balance);
    entries[m.id] = { memberId:m.id, saving:SAVING_AMOUNT, principal, interest, totalDue:SAVING_AMOUNT+principal+interest, paid:false, paidAt:null, balanceBefore:m.balance, balanceAfter:m.balance>0?Math.max(0,m.balance-principal):0 };
  });
  return { key, entries, createdAt:Date.now(), locked:false, bankBalance:0 };
}
export function getMonthStats(monthRecord, members) {
  if (!monthRecord) return { totalCollection:0, totalInterest:0, totalSaving:0, totalPrincipal:0, paidCount:0, pendingCount:0, totalMembers:0 };
  const entries = Object.values(monthRecord.entries||{});
  const paid = entries.filter(e=>e.paid);
  return { totalCollection:paid.reduce((s,e)=>s+e.totalDue,0), totalInterest:paid.reduce((s,e)=>s+e.interest,0), totalSaving:paid.reduce((s,e)=>s+e.saving,0), totalPrincipal:paid.reduce((s,e)=>s+e.principal,0), paidCount:paid.length, pendingCount:entries.length-paid.length, totalMembers:entries.length };
}
export function getGroupBalanceSheet(members, months, bankBalance) {
  const totalOutstanding = members.reduce((s,m)=>s+m.balance,0);
  const totalInterestEarned = Object.values(months).reduce((sum,mr)=>sum+Object.values(mr.entries).filter(e=>e.paid).reduce((s,e)=>s+e.interest,0),0);
  const totalCollection = Object.values(months).reduce((sum,mr)=>sum+Object.values(mr.entries).filter(e=>e.paid).reduce((s,e)=>s+e.totalDue,0),0);
  const totalSavingsCollected = Object.values(months).reduce((sum,mr)=>sum+Object.values(mr.entries).filter(e=>e.paid).reduce((s,e)=>s+e.saving,0),0);
  const activeLoans = members.filter(m=>m.balance>0).length;
  const completedLoans = members.filter(m=>m.loanAmount>0&&m.balance===0).length;
  return { totalOutstanding, totalInterestEarned, totalCollection, totalSavingsCollected, activeLoans, completedLoans, bankBalance, netWorth: bankBalance+totalOutstanding };
}
