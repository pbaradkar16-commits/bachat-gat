import { supabase } from './supabase.js'

export const SAVING_AMOUNT = 1000;
export const LOAN_MONTHS = 20;
export const INTEREST_RATE = 0.015;

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

// ─── SUPABASE FUNCTIONS ───────────────────────────────────────────────────────

export async function getOrCreateGroup(name, address) {
  const { data, error } = await supabase.from('groups').select('*').eq('name', name).single();
  if (data) return data;
  const { data: newGroup } = await supabase.from('groups').insert({ name, address }).select().single();
  return newGroup;
}

export async function loadMembersFromDB(groupId) {
  const { data } = await supabase.from('members').select('*').eq('group_id', groupId).order('created_at');
  return data || [];
}

export async function saveMemberToDB(member, groupId) {
  if (member.db_id) {
    const { data } = await supabase.from('members').update({
      name: member.name, phone: member.phone,
      loan_amount: member.loanAmount, balance: member.balance
    }).eq('id', member.db_id).select().single();
    return data;
  } else {
    const { data } = await supabase.from('members').insert({
      group_id: groupId, name: member.name, phone: member.phone,
      loan_amount: member.loanAmount, balance: member.balance
    }).select().single();
    return data;
  }
}

export async function deleteMemberFromDB(dbId) {
  await supabase.from('entries').delete().eq('member_id', dbId);
  await supabase.from('members').delete().eq('id', dbId);
}

export async function loadMonthsFromDB(groupId) {
  const { data: monthsData } = await supabase.from('months').select('*').eq('group_id', groupId);
  if (!monthsData || monthsData.length === 0) return {};
  const months = {};
  for (const m of monthsData) {
    const { data: entriesData } = await supabase.from('entries').select('*, members(id)').eq('month_id', m.id);
    const entries = {};
    for (const e of entriesData || []) {
      entries[e.member_id] = {
        memberId: e.member_id, db_id: e.id,
        saving: e.saving, principal: e.principal,
        interest: e.interest, totalDue: e.total_due,
        customAmount: e.custom_amount || 0,
        paid: e.paid, paidAt: e.paid_at,
        balanceBefore: e.balance_before, balanceAfter: e.balance_after
      };
    }
    months[m.month_key] = { key: m.month_key, db_id: m.id, entries, bankBalance: m.bank_balance || 0 };
  }
  return months;
}

export async function createMonthInDB(members, key, groupId) {
  const { data: monthData } = await supabase.from('months').insert({ group_id: groupId, month_key: key, bank_balance: 0 }).select().single();
  if (!monthData) return null;
  const entriesInsert = members.map(m => {
    const principal = calcEMI(m.loanAmount);
    const interest = calcInterest(m.balance);
    return {
      month_id: monthData.id, member_id: m.db_id,
      saving: SAVING_AMOUNT, principal, interest,
      total_due: SAVING_AMOUNT + principal + interest,
      paid: false, balance_before: m.balance,
      balance_after: m.balance > 0 ? Math.max(0, m.balance - principal) : 0
    };
  });
  const { data: entriesData } = await supabase.from('entries').insert(entriesInsert).select();
  const entries = {};
  for (const e of entriesData || []) {
    entries[e.member_id] = {
      memberId: e.member_id, db_id: e.id,
      saving: e.saving, principal: e.principal,
      interest: e.interest, totalDue: e.total_due,
      paid: e.paid, paidAt: e.paid_at,
      balanceBefore: e.balance_before, balanceAfter: e.balance_after
    };
  }
  return { key, db_id: monthData.id, entries, bankBalance: 0 };
}

export async function markEntryPaid(entryDbId, balanceAfter, customAmount) {
  const { data } = await supabase.from('entries').update({
    paid: true, paid_at: new Date().toISOString(),
    balance_after: balanceAfter, custom_amount: customAmount || 0
  }).eq('id', entryDbId).select().single();
  return data;
}

export async function undoEntryPaid(entryDbId) {
  const { data } = await supabase.from('entries').update({
    paid: false, paid_at: null
  }).eq('id', entryDbId).select().single();
  return data;
}

export async function updateMemberBalance(dbId, balance) {
  await supabase.from('members').update({ balance }).eq('id', dbId);
}

export async function updateBankBalance(monthDbId, bankBalance) {
  await supabase.from('months').update({ bank_balance: bankBalance }).eq('id', monthDbId);
}

export async function saveLicense(groupId, phone, upiRef) {
  const { data } = await supabase.from('licenses').insert({
    group_id: groupId, phone, upi_ref: upiRef, amount: 2000, status: 'pending'
  }).select().single();
  return data;
}

// ─── LOCAL HELPERS ────────────────────────────────────────────────────────────
export function getMonthStats(monthRecord, members) {
  if (!monthRecord) return { totalCollection:0, totalInterest:0, totalSaving:0, totalPrincipal:0, paidCount:0, pendingCount:0, totalMembers:0 };
  const entries = Object.values(monthRecord.entries);
  const paid = entries.filter(e=>e.paid);
  return {
    totalCollection: paid.reduce((s,e)=>s+(e.customAmount||e.totalDue),0),
    totalInterest: paid.reduce((s,e)=>s+e.interest,0),
    totalSaving: paid.reduce((s,e)=>s+e.saving,0),
    totalPrincipal: paid.reduce((s,e)=>s+e.principal,0),
    paidCount: paid.length, pendingCount: entries.length-paid.length,
    totalMembers: entries.length
  };
}

export function getGroupBalanceSheet(members, months, bankBalance) {
  const totalOutstanding = members.reduce((s,m)=>s+m.balance,0);
  const totalInterestEarned = Object.values(months).reduce((sum,mr)=>sum+Object.values(mr.entries).filter(e=>e.paid).reduce((s,e)=>s+e.interest,0),0);
  const totalCollection = Object.values(months).reduce((sum,mr)=>sum+Object.values(mr.entries).filter(e=>e.paid).reduce((s,e)=>s+(e.customAmount||e.totalDue),0),0);
  const totalSavingsCollected = Object.values(months).reduce((sum,mr)=>sum+Object.values(mr.entries).filter(e=>e.paid).reduce((s,e)=>s+e.saving,0),0);
  const activeLoans = members.filter(m=>m.balance>0).length;
  const completedLoans = members.filter(m=>m.loanAmount>0&&m.balance===0).length;
  return { totalOutstanding, totalInterestEarned, totalCollection, totalSavingsCollected, activeLoans, completedLoans, bankBalance, netWorth: bankBalance+totalOutstanding };
}

// LocalStorage fallback
export function loadCurrentMonth() { return localStorage.getItem("sssb_current_month") || todayMonthKey(); }
export function saveCurrentMonth(key) { localStorage.setItem("sssb_current_month", key); }
export function loadBankBalances() { try { return JSON.parse(localStorage.getItem("sssb_bank_balance")||"{}"); } catch { return {}; } }
export function saveBankBalances(b) { localStorage.setItem("sssb_bank_balance", JSON.stringify(b)); }
