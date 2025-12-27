import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./api.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function Dashboard({ user }) {
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  /* ========= STATES ========= */
  const [tab, setTab] = useState("dashboard");
  const [currency, setCurrency] = useState("USD");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [links, setLinks] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [longUrl, setLongUrl] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [note, setNote] = useState("");

  const USD_TO_INR = 85.5;
  const MIN_WITHDRAW = 1;

  /* ========= DYNAMIC CPM LOGIC ========= */
  // Views athigama pona CPM kuraiyum (Scale: 10 down to 9.8)
  const calculateCPM = (views) => {
    if (views > 10000) return 9.8;
    return 10;
  };

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
      console.error("Load error", err);
    }
  }

  /* ========= CALCULATIONS ========= */
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

  const money = (v) => currency === "USD" ? `$${v.toFixed(2)}` : `₹${(v * USD_TO_INR).toFixed(2)}`;

  /* ========= ACTIONS ========= */
  async function shorten() {
    if (!longUrl) return alert("Paste URL");
    try {
      const res = await axios.post(`${API_BASE}/api/links/shorten`, { longUrl, email: user.email }, auth);
      if (res.data) {
        setLongUrl("");
        loadData();
        alert("Link Shortened!");
      }
    } catch { alert("Shorten failed"); }
  }

  async function deleteLink(id) {
    if (!window.confirm("Delete this link?")) return;
    try {
      // Backend route check: /api/links/:id
      await axios.delete(`${API_BASE}/api/links/${id}`, auth);
      setLinks(links.filter(l => l._id !== id)); // Local state update for instant UI feedback
    } catch { alert("Delete failed"); }
  }

  async function requestWithdraw() {
    const amt = Number(withdrawAmount);
    if (!amt || amt < MIN_WITHDRAW || amt > walletUSD) return alert("Invalid amount");
    try {
      await axios.post(`${API_BASE}/api/withdraw`, { amount: amt, note, email: user.email }, auth);
      alert("Request Sent ✅");
      setWithdrawAmount(""); setNote("");
      loadData();
    } catch { alert("Withdraw failed"); }
  }

  const chartData = links.slice(-10).map(l => ({
    name: new Date(l.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    clicks: l.clicks
  }));

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brand}>👑 Kinglinky</div>
        <div style={styles.headerRight}>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={styles.select}>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
          <div style={styles.burger} onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</div>
        </div>
      </header>

      {/* MOBILE MENU / SANDWICH */}
      {isMenuOpen && (
        <div style={styles.mobileNav}>
          {["dashboard", "manage", "withdraw", "history", "support"].map(t => (
            <div key={t} style={styles.navItem} onClick={() => { setTab(t); setIsMenuOpen(false); }}>
              {t.toUpperCase()}
            </div>
          ))}
        </div>
      )}

      <main style={styles.main}>
        <div style={styles.userBar}>
          <span>👑 <b>{user?.name}</b></span>
          <span style={styles.cpmBadge}>Current CPM: ${currentCPM}</span>
        </div>

        {tab === "dashboard" && (
          <>
            <div style={styles.grid}>
              <Card title="Today Views" value={todayViews} color="#00ffd0" />
              <Card title="Today Earnings" value={money(todayUSD)} color="#00ffd0" />
              <Card title="Total Views" value={totalViews} color="#00ffd0" />
              <Card title="Wallet Balance" value={money(walletUSD)} color="#ffcc00" />
              <Card title="Total Withdrawn" value={money(paidUSD)} color="#ff4444" />
            </div>

            <div style={styles.chartCard}>
              <h4 style={{marginBottom: 15}}>Performance (Last 10 Links)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a3a3a" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{backgroundColor: '#053737', border: 'none'}} />
                  <Line type="monotone" dataKey="clicks" stroke="#00ffd0" strokeWidth={3} dot={{fill:'#00ffd0'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {tab === "manage" && (
          <div style={styles.section}>
            <div style={styles.inputGroup}>
              <input 
                style={styles.input} 
                value={longUrl} 
                onChange={e => setLongUrl(e.target.value)} 
                placeholder="https://example.com/very-long-link"
              />
              <button style={styles.primaryBtn} onClick={shorten}>Shorten</button>
            </div>
            {links.map(l => (
              <div key={l._id} style={styles.listItem}>
                <div style={{overflow:'hidden'}}>
                  <div style={styles.shortLink}>{l.shortUrl}</div>
                  <small style={{color:'#888'}}>{l.clicks} Clicks</small>
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
            <h3>Request Payout</h3>
            <p>Available: <b style={{color:'#00ffd0'}}>{money(walletUSD)}</b></p>
            <input 
              type="number" 
              style={styles.inputFull} 
              placeholder="Amount to withdraw" 
              value={withdrawAmount} 
              onChange={e => setWithdrawAmount(e.target.value)}
            />
            <textarea 
              style={styles.inputFull} 
              placeholder="UPI ID or Bank Details (Name, Acc, IFSC)" 
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button style={styles.withdrawBtn} onClick={requestWithdraw}>Submit Request</button>
          </div>
        )}

        {tab === "history" && (
          <div style={styles.section}>
            {withdraws.length === 0 ? <p>No history yet.</p> : withdraws.map(w => (
              <div key={w._id} style={styles.listItem}>
                <span>{money(w.amount)}</span>
                <span style={{
                  color: w.status === 'paid' ? '#00ffd0' : '#ffcc00',
                  textTransform: 'capitalize',
                  fontWeight: 'bold'
                }}>{w.status}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "support" && (
          <div style={styles.supportCard}>
            <div style={{fontSize: 40}}>💬</div>
            <h3>Need Help?</h3>
            <p>Our support team is available 24/7 on Telegram.</p>
            <button 
              style={styles.telegramBtn} 
              onClick={() => window.open("https://t.me/KinglinkySupport")}
            >
              Join Telegram Support
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* ========= SUB-COMPONENTS ========= */
function Card({ title, value, color }) {
  return (
    <div style={styles.card}>
      <small style={{color: '#aaa', textTransform: 'uppercase', fontSize: 10}}>{title}</small>
      <h2 style={{color: color, margin: '5px 0'}}>{value}</h2>
    </div>
  );
}

/* ========= STYLES ========= */
const styles = {
  container: { minHeight: "100vh", background: "#011111", color: "#eafffa", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", background: "#021c1c", borderBottom: "1px solid #053737" },
  brand: { fontSize: "1.5rem", fontWeight: "bold", color: "#00ffd0" },
  headerRight: { display: "flex", gap: "15px", alignItems: "center" },
  burger: { fontSize: "24px", cursor: "pointer", color: "#00ffd0" },
  select: { background: "#053737", color: "#fff", border: "none", padding: "5px", borderRadius: "4px" },
  
  mobileNav: { background: "#021c1c", borderBottom: "1px solid #053737", padding: "10px" },
  navItem: { padding: "12px", borderBottom: "1px solid #033", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  
  main: { padding: "20px", maxWidth: "900px", margin: "0 auto" },
  userBar: { display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" },
  cpmBadge: { background: "#053737", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", border: "1px solid #00ffd0" },
  
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "15px" },
  card: { background: "#022626", padding: "20px", borderRadius: "12px", border: "1px solid #053737", textAlign: "center" },
  
  chartCard: { background: "#022626", padding: "20px", borderRadius: "12px", marginTop: "20px", border: "1px solid #053737" },
  
  section: { marginTop: "20px" },
  inputGroup: { display: "flex", gap: "10px", marginBottom: "20px" },
  input: { flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#053737", color: "#fff" },
  inputFull: { width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#053737", color: "#fff", marginBottom: "10px", boxSizing: "border-box" },
  primaryBtn: { background: "#00ffd0", color: "#000", border: "none", padding: "0 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" },
  
  listItem: { background: "#022626", padding: "15px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderLeft: "4px solid #00ffd0" },
  shortLink: { color: "#00ffd0", fontWeight: "bold", textDecoration: "none" },
  iconBtn: { background: "#053737", border: "none", color: "#fff", padding: "8px", borderRadius: "5px", cursor: "pointer" },

  withdrawCard: { background: "#022626", padding: "25px", borderRadius: "15px", textAlign: "center", border: "1px solid #053737" },
  withdrawBtn: { width: "100%", background: "#00ffd0", color: "#000", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", marginTop: "10px", cursor: "pointer" },
  
  supportCard: { textAlign: "center", padding: "40px 20px", background: "#022626", borderRadius: "15px", border: "1px solid #053737" },
  telegramBtn: { background: "#0088cc", color: "#fff", border: "none", padding: "12px 25px", borderRadius: "25px", fontWeight: "bold", marginTop: "15px", cursor: "pointer" }
};