import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./api.js";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ================= CONFIG ================= */
const USD_TO_INR = 85.5;
const MIN_WITHDRAW = 1;

export default function Dashboard({ user }) {
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  /* ========= STATES ========= */
  const [tab, setTab] = useState("dashboard");
  const [currency, setCurrency] = useState("USD");
  const [links, setLinks] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [longUrl, setLongUrl] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [note, setNote] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /* ========= DYNAMIC CPM LOGIC ========= */
  const calculateCPM = (views) => (views >= 5000 ? 9.8 : 10);

  useEffect(() => {
    if (!token || !user?.email) return;
    loadData();
  }, [user, token]);

  async function loadData() {
    try {
      const [linksRes, wdRes] = await Promise.all([
        axios.get(`${API_BASE}/api/links?email=${user.email}`, auth),
        axios.get(`${API_BASE}/api/withdraw/my`, auth) // Route corrected to match backend userAuth
      ]);

      // Backend direct array-ah anupuna intha condition correct
      setLinks(Array.isArray(linksRes.data) ? linksRes.data : []);
      
      // Withdraw logic: Backend array-ah anupuna direct-ah set pannanum
      setWithdraws(Array.isArray(wdRes.data) ? wdRes.data : (wdRes.data?.data || []));
    } catch (err) {
      console.error("Dashboard load error", err);
    }
  }

  /* ========= STATS CALCULATION ========= */
  const totalViews = links.reduce((sum, l) => sum + (Number(l.clicks) || 0), 0);
  const currentCPM = calculateCPM(totalViews);
  
  const allTimeUSD = (totalViews / 1000) * currentCPM;
  const paidUSD = withdraws
    .filter((w) => w.status === "paid")
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  
  const walletUSD = Math.max(allTimeUSD - paidUSD, 0);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayViews = links.reduce((sum, l) => {
    const d = l.createdAt ? new Date(l.createdAt).toISOString().slice(0, 10) : "";
    return d === todayKey ? sum + (Number(l.clicks) || 0) : sum;
  }, 0);
  const todayUSD = (todayViews / 1000) * currentCPM;

  function money(v) {
    return currency === "USD" ? `$ ${v.toFixed(2)}` : `₹ ${(v * USD_TO_INR).toFixed(2)}`;
  }

  /* ========= ACTIONS ========= */
  async function shorten() {
    if (!longUrl) return alert("Paste URL first!");
    try {
      await axios.post(`${API_BASE}/api/links/shorten`, { longUrl, email: user.email }, auth);
      setLongUrl("");
      loadData();
      alert("Link Shortened! 🚀");
    } catch { alert("Shorten failed"); }
  }

  async function deleteLink(id) {
    if (!window.confirm("Delete this link?")) return;
    try {
      await axios.delete(`${API_BASE}/api/links/${id}`, auth);
      setLinks(prev => prev.filter(l => l._id !== id));
      alert("Deleted! 🗑️");
    } catch { alert("Delete failed! Check your internet or server."); }
  }

  async function requestWithdraw() {
    const amt = Number(withdrawAmount);
    if (!amt || amt < MIN_WITHDRAW || amt > walletUSD) return alert("Invalid amount!");
    try {
      // Body-la 'email' sethu anupuna backend 'userEmail' field set aagum
      await axios.post(`${API_BASE}/api/withdraw`, { amount: amt, note, email: user.email }, auth);
      alert("Withdraw Request Sent! ✅");
      setWithdrawAmount(""); setNote("");
      loadData();
    } catch (err) { 
      console.error(err);
      alert("Withdraw request failed"); 
    }
  }

  /* ================= UI ================= */
  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h2 style={{color: '#00ffd0', margin: 0}}>👑 Kinglinky</h2>
        <div style={styles.headerRight}>
           <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={styles.select}>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
          <div style={styles.burger} onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</div>
        </div>
      </div>

      {isMenuOpen && (
        <div style={styles.mobileMenu}>
          {["dashboard", "manage", "withdraw", "history", "support"].map(t => (
            <div key={t} style={styles.menuItem} onClick={() => { setTab(t); setIsMenuOpen(false); }}>
              {t.toUpperCase()}
            </div>
          ))}
        </div>
      )}

      <div style={styles.userBanner}>
        <span>👑 <b>{user?.name}</b></span>
        <span style={styles.cpmBadge}>CPM: ${currentCPM}</span>
      </div>

      {tab === "dashboard" && (
        <>
          <div style={styles.grid}>
            <Card title="Today Views" value={todayViews} />
            <Card title="Today Earnings" value={money(todayUSD)} />
            <Card title="Total Views" value={totalViews} color="#00ffd0" />
            <Card title="Wallet" value={money(walletUSD)} color="#00ffd0" />
            <Card title="Withdrawn" value={money(paidUSD)} color="#ff4444" />
          </div>

          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={links.slice(-7).map(l => ({ n: 'Link', c: l.clicks }))}>
                <CartesianGrid stroke="#053737" strokeDasharray="3 3" />
                <XAxis hide />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip contentStyle={{background:'#021c1c', border:'1px solid #00ffd0'}} />
                <Line type="monotone" dataKey="c" stroke="#00ffd0" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === "manage" && (
        <div style={styles.section}>
          <div style={styles.inputRow}>
            <input style={styles.input} value={longUrl} onChange={e => setLongUrl(e.target.value)} placeholder="Paste URL..." />
            <button style={styles.btnAction} onClick={shorten}>Shorten</button>
          </div>
          {links.map(l => (
            <div key={l._id} style={styles.linkBox}>
              <div style={{overflow:'hidden'}}>
                <div style={{color:'#00ffd0', fontSize: 14}}>{l.shortUrl}</div>
                <small style={{color:'#aaa'}}>{l.clicks} Clicks</small>
              </div>
              <div style={{display:'flex', gap: 5}}>
                <button style={styles.iconBtn} onClick={() => {navigator.clipboard.writeText(l.shortUrl); alert("Copied!")}}>📋</button>
                <button style={styles.iconBtn} onClick={() => deleteLink(l._id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "withdraw" && (
        <div style={styles.withdrawCard}>
          <h3>Available: {money(walletUSD)}</h3>
          <input type="number" style={styles.inputFull} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount (USD)" />
          <textarea style={styles.inputFull} value={note} onChange={e => setNote(e.target.value)} placeholder="UPI ID or Bank Info" rows={3} />
          <button style={styles.btnWithdraw} onClick={requestWithdraw}>Send Request</button>
        </div>
      )}

      {tab === "history" && (
        <div style={styles.section}>
          {withdraws.map(w => (
            <div key={w._id} style={styles.linkBox}>
              <span>{money(w.amount)}</span>
              <b style={{color: w.status==='paid'?'#00ffd0':'#ffcc00'}}>{w.status.toUpperCase()}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ title, value, color="#fff" }) {
  return (
    <div style={styles.card}>
      <small style={{color:'#aaa', fontSize: 10}}>{title}</small>
      <h3 style={{color, margin: '5px 0', fontSize: 18}}>{value}</h3>
    </div>
  );
}

const styles = {
  wrap: { padding: "15px", minHeight: "100vh", background: "#011111", color: "#eafffa", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  headerRight: { display: "flex", gap: 10, alignItems: "center" },
  burger: { fontSize: 26, cursor: "pointer", color: "#00ffd0" },
  select: { background: "#053737", color: "#fff", border: "1px solid #00ffd0", borderRadius: 4, padding: 2 },
  mobileMenu: { background: "#021c1c", borderRadius: 10, padding: 10, marginBottom: 15, border: "1px solid #053737" },
  menuItem: { padding: "12px", borderBottom: "1px solid #033", fontSize: 13, fontWeight: "bold" },
  userBanner: { display: "flex", justifyContent: "space-between", background: "#022626", padding: "12px", borderRadius: 10, marginBottom: 15 },
  cpmBadge: { color: "#00ffd0", fontSize: 11, border: "1px solid #00ffd0", padding: "2px 8px", borderRadius: 10 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  card: { background: "#053737", padding: 15, borderRadius: 12, textAlign: "center", border: "1px solid #024444" },
  chartContainer: { marginTop: 15, background: "#021c1c", padding: 15, borderRadius: 12 },
  section: { marginTop: 15 },
  inputRow: { display: "flex", gap: 8, marginBottom: 15 },
  input: { flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#053737", color: "#fff" },
  linkBox: { background: "#053737", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between", marginBottom: 8 },
  iconBtn: { background: "#011111", border: "none", color: "#fff", padding: 8, borderRadius: 5 },
  btnAction: { background: "#00ffd0", border: "none", padding: "0 15px", borderRadius: 8, fontWeight: "bold" },
  withdrawCard: { background: "#021c1c", padding: 20, borderRadius: 15, textAlign: "center" },
  inputFull: { width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, border: "none", background: "#053737", color: "#fff", boxSizing: "border-box" },
  btnWithdraw: { width: "100%", padding: 12, background: "#00ffd0", border: "none", borderRadius: 8, fontWeight: "bold" }
};