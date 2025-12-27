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
        axios.get(`${API_BASE}/api/withdraw/my?email=${user.email}`, auth)
      ]);
      setLinks(Array.isArray(linksRes.data) ? linksRes.data : []);
      setWithdraws(Array.isArray(wdRes.data) ? wdRes.data : []);
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
      await axios.post(`${API_BASE}/api/withdraw`, { amount: amt, note, email: user.email }, auth);
      alert("Withdraw Request Sent! ✅");
      setWithdrawAmount(""); setNote("");
      loadData();
    } catch { alert("Withdraw request failed"); }
  }

  /* ================= UI ================= */
  return (
    <div style={styles.wrap}>
      {/* HEADER */}
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

      {/* SANDWICH MENU */}
      {isMenuOpen && (
        <div style={styles.mobileMenu}>
          {["dashboard", "manage", "withdraw", "history", "support"].map(t => (
            <div key={t} style={styles.menuItem} onClick={() => { setTab(t); setIsMenuOpen(false); }}>
              {t.toUpperCase()}
            </div>
          ))}
        </div>
      )}

      {/* USER BANNER */}
      <div style={styles.userBanner}>
        <span>👑 <b>{user?.name}</b></span>
        <span style={styles.cpmBadge}>Current CPM: ${currentCPM}</span>
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
            <h4 style={{marginBottom: 15, fontSize: 14}}>Recent Link Performance</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={links.slice(-8).map(l => ({ n: 'Link', c: l.clicks }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#053737" />
                <XAxis hide />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip contentStyle={{background:'#021c1c', border:'1px solid #00ffd0'}} />
                <Line type="monotone" dataKey="c" stroke="#00ffd0" strokeWidth={3} dot={{r: 4, fill: '#00ffd0'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === "manage" && (
        <div style={styles.section}>
          <div style={styles.inputRow}>
            <input style={styles.input} value={longUrl} onChange={e => setLongUrl(e.target.value)} placeholder="Paste long URL..." />
            <button style={styles.btnAction} onClick={shorten}>Shorten</button>
          </div>
          {links.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>No links found.</p> : 
            links.map(l => (
              <div key={l._id} style={styles.linkBox}>
                <div style={{overflow:'hidden', marginRight: 10}}>
                  <div style={{color:'#00ffd0', fontWeight:'bold', fontSize: 14}}>{l.shortUrl}</div>
                  <small style={{color:'#aaa'}}>{l.clicks} clicks</small>
                </div>
                <div style={{display:'flex', gap: 5}}>
                  <button style={styles.iconBtn} onClick={() => {navigator.clipboard.writeText(l.shortUrl); alert("Copied!")}}>📋</button>
                  <button style={styles.iconBtn} onClick={() => deleteLink(l._id)}>🗑️</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === "withdraw" && (
        <div style={styles.withdrawCard}>
          <h3 style={{marginTop: 0}}>Wallet: {money(walletUSD)}</h3>
          <input type="number" style={styles.inputFull} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount to withdraw" />
          <textarea style={styles.inputFull} value={note} onChange={e => setNote(e.target.value)} placeholder="UPI ID / Bank Details" rows={3} />
          <button style={styles.btnWithdraw} onClick={requestWithdraw}>Request Withdrawal</button>
        </div>
      )}

      {tab === "history" && (
        <div style={styles.section}>
          {withdraws.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>No history found.</p> :
            withdraws.map(w => (
              <div key={w._id} style={styles.linkBox}>
                <span>{money(w.amount)}</span>
                <b style={{color: w.status==='paid'?'#00ffd0':'#ffcc00'}}>{w.status.toUpperCase()}</b>
              </div>
            ))
          }
        </div>
      )}

      {tab === "support" && (
        <div style={styles.supportBox}>
          <div style={{fontSize: 50, marginBottom: 10}}>💬</div>
          <h3>Help Center</h3>
          <p style={{color: '#aaa', fontSize: 14}}>Feel free to contact our support team on Telegram if you face any issues.</p>
          <button style={styles.btnTg} onClick={() => window.open("https://t.me/KinglinkySupport")}>
            Chat on Telegram
          </button>
        </div>
      )}
    </div>
  );
}

/* UI HELPER */
function Card({ title, value, color="#fff" }) {
  return (
    <div style={styles.card}>
      <div style={{color:'#aaa', fontSize: 11, marginBottom: 5, textTransform: 'uppercase'}}>{title}</div>
      <div style={{color: color, fontSize: 18, fontWeight: 'bold'}}>{value}</div>
    </div>
  );
}

/* STYLES */
const styles = {
  wrap: { padding: "15px", minHeight: "100vh", background: "#011111", color: "#eafffa", fontFamily: "system-ui" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  headerRight: { display: "flex", gap: 12, alignItems: "center" },
  burger: { fontSize: 26, cursor: "pointer", color: "#00ffd0" },
  select: { background: "#053737", color: "#fff", border: "1px solid #00ffd0", borderRadius: 4, padding: "2px 5px" },
  
  mobileMenu: { background: "#021c1c", borderRadius: 10, padding: 8, marginBottom: 15, border: "1px solid #053737" },
  menuItem: { padding: "12px", borderBottom: "1px solid #033", cursor: "pointer", fontWeight: "600", fontSize: 13 },
  
  userBanner: { display: "flex", justifyContent: "space-between", background: "#022626", padding: "12px", borderRadius: 10, marginBottom: 15, border: "1px solid #053737" },
  cpmBadge: { color: "#00ffd0", fontSize: 11, border: "1px solid #00ffd0", padding: "2px 8px", borderRadius: 12 },
  
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  card: { background: "#053737", padding: 15, borderRadius: 12, border: "1px solid #024444" },
  chartContainer: { marginTop: 15, background: "#021c1c", padding: 15, borderRadius: 12, border: "1px solid #053737" },
  
  section: { marginTop: 15 },
  inputRow: { display: "flex", gap: 8, marginBottom: 15 },
  input: { flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#053737", color: "#fff" },
  linkBox: { background: "#053737", padding: "12px 15px", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  iconBtn: { background: "#011111", border: "1px solid #053737", color: "#fff", padding: "6px 10px", borderRadius: 6, cursor: "pointer" },
  btnAction: { background: "#00ffd0", border: "none", padding: "0 15px", borderRadius: 8, fontWeight: "bold", cursor: "pointer" },
  
  withdrawCard: { background: "#021c1c", padding: 20, borderRadius: 15, border: "1px solid #053737", textAlign: "center" },
  inputFull: { width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, border: "none", background: "#053737", color: "#fff", boxSizing: "border-box" },
  btnWithdraw: { width: "100%", padding: 12, background: "#00ffd0", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" },
  
  supportBox: { textAlign: "center", padding: "30px 15px", background: "#021c1c", borderRadius: 15, border: "1px solid #053737" },
  btnTg: { background: "#0088cc", color: "#fff", border: "none", padding: "12px 25px", borderRadius: 25, fontWeight: "bold", cursor: "pointer" }
};