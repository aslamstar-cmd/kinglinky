import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./api.js";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const USD_TO_INR = 85.5;
const MIN_WITHDRAW = 1;

export default function Dashboard({ user }) {
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [tab, setTab] = useState("dashboard");
  const [currency, setCurrency] = useState("USD");
  const [links, setLinks] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [longUrl, setLongUrl] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [note, setNote] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dynamic CPM: 5k views mela pona auto-ah 9.8 aahum
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
    } catch (err) { console.error("Load error", err); }
  }

  /* CALCULATIONS */
  const totalViews = links.reduce((sum, l) => sum + (Number(l.clicks) || 0), 0);
  const currentCPM = calculateCPM(totalViews);
  const allTimeUSD = (totalViews / 1000) * currentCPM;
  const paidUSD = withdraws.filter(w => w.status === "paid").reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const walletUSD = Math.max(allTimeUSD - paidUSD, 0);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayViews = links.reduce((sum, l) => {
    const d = l.createdAt ? new Date(l.createdAt).toISOString().slice(0, 10) : "";
    return d === todayKey ? sum + (Number(l.clicks) || 0) : sum;
  }, 0);
  const todayUSD = (todayViews / 1000) * currentCPM;

  const money = (v) => currency === "USD" ? `$ ${v.toFixed(2)}` : `₹ ${(v * USD_TO_INR).toFixed(2)}`;

  /* ACTIONS */
  async function shorten() {
    if (!longUrl) return alert("Paste URL!");
    try {
      await axios.post(`${API_BASE}/api/links/shorten`, { longUrl, email: user.email }, auth);
      setLongUrl(""); loadData(); alert("Shortened! 🚀");
    } catch { alert("Shorten failed"); }
  }

  async function deleteLink(id) {
    if (!window.confirm("Delete this link?")) return;
    try {
      // API call
      await axios.delete(`${API_BASE}/api/links/${id}`, auth);
      // UI Update
      setLinks(prev => prev.filter(l => l._id !== id));
      alert("Deleted! 🗑️");
    } catch (err) { alert("Delete failed! Check backend route."); }
  }

  async function requestWithdraw() {
    const amt = Number(withdrawAmount);
    if (!amt || amt < MIN_WITHDRAW || amt > walletUSD) return alert("Invalid amount!");
    try {
      await axios.post(`${API_BASE}/api/withdraw`, { amount: amt, note, email: user.email }, auth);
      alert("Request Sent! ✅"); setWithdrawAmount(""); setNote(""); loadData();
    } catch { alert("Withdraw failed"); }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h2 style={{color: '#00ffd0'}}>👑 Kinglinky</h2>
        <div style={styles.headerRight}>
          <select value={currency} onChange={e => setCurrency(e.target.value)} style={styles.select}>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
          <div style={styles.burger} onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</div>
        </div>
      </div>

      {isMenuOpen && (
        <div style={styles.mobileNav}>
          {["dashboard", "manage", "withdraw", "history", "support"].map(t => (
            <div key={t} style={styles.navItem} onClick={() => { setTab(t); setIsMenuOpen(false); }}>{t.toUpperCase()}</div>
          ))}
        </div>
      )}

      <div style={styles.userBar}>
        <span>👑 <b>{user?.name}</b></span>
        <span style={styles.cpmTag}>CPM: ${currentCPM}</span>
      </div>

      {tab === "dashboard" && (
        <>
          <div style={styles.grid}>
            <StatCard title="Today Views" value={todayViews} />
            <StatCard title="Today Earnings" value={money(todayUSD)} />
            <StatCard title="Wallet Balance" value={money(walletUSD)} color="#00ffd0" />
            <StatCard title="Total Withdrawn" value={money(paidUSD)} color="#ff4444" />
          </div>
          <div style={styles.chartBox}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={links.slice(-7).map(l => ({ n: 'Link', c: l.clicks }))}>
                <CartesianGrid stroke="#053737" />
                <XAxis hide />
                <YAxis stroke="#888" />
                <Tooltip />
                <Line type="monotone" dataKey="c" stroke="#00ffd0" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === "manage" && (
        <div style={styles.section}>
          <div style={styles.inputGroup}>
            <input style={styles.input} value={longUrl} onChange={e => setLongUrl(e.target.value)} placeholder="Paste URL" />
            <button style={styles.btnGreen} onClick={shorten}>Shorten</button>
          </div>
          {links.map(l => (
            <div key={l._id} style={styles.listCard}>
              <div style={{overflow:'hidden'}}>
                <div style={{color:'#00ffd0', fontSize:14}}>{l.shortUrl}</div>
                <small>{l.clicks} Clicks</small>
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
          <input type="number" style={styles.inputDark} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount ($1 min)" />
          <textarea style={styles.inputDark} value={note} onChange={e => setNote(e.target.value)} placeholder="UPI/Bank Details" />
          <button style={styles.btnGreenFull} onClick={requestWithdraw}>Request Withdrawal</button>
        </div>
      )}

      {tab === "support" && (
        <div style={styles.supportBox}>
          <h3>Need Help?</h3>
          <p>Contact us on Telegram 24/7</p>
          <button style={styles.btnTg} onClick={() => window.open("https://t.me/KinglinkySupport")}>Telegram Support</button>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color="#fff" }) {
  return (
    <div style={{background:'#053737', padding:15, borderRadius:12, textAlign:'center'}}>
      <small style={{color:'#aaa'}}>{title}</small>
      <h3 style={{color}}>{value}</h3>
    </div>
  );
}

const styles = {
  wrap: { padding: 15, background: "#011111", minHeight: "100vh", color: "#fff", fontFamily: 'sans-serif' },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerRight: { display: "flex", gap: 10, alignItems: "center" },
  burger: { fontSize: 30, cursor: "pointer", color: "#00ffd0" },
  select: { background: "#053737", color: "#fff", border: "1px solid #00ffd0", padding: 4 },
  mobileNav: { background: "#021c1c", borderRadius: 8, padding: 10, margin: "15px 0", border: "1px solid #053737" },
  navItem: { padding: 12, borderBottom: "1px solid #033", fontWeight: "bold" },
  userBar: { display: "flex", justifyContent: "space-between", margin: "20px 0" },
  cpmTag: { background: "#053737", padding: "2px 8px", borderRadius: 10, color: "#00ffd0", fontSize: 12 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  chartBox: { marginTop: 20, background: "#021c1c", padding: 10, borderRadius: 12 },
  section: { marginTop: 20 },
  inputGroup: { display: "flex", gap: 8, marginBottom: 15 },
  input: { flex: 1, background: "#053737", border: "none", color: "#fff", padding: 12, borderRadius: 8 },
  btnGreen: { background: "#00ffd0", border: "none", padding: "0 15px", borderRadius: 8, fontWeight: "bold" },
  listCard: { background: "#053737", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between", marginBottom: 8 },
  iconBtn: { background: "#022626", border: "none", color: "#fff", padding: 8, borderRadius: 5 },
  withdrawCard: { background: "#021c1c", padding: 20, borderRadius: 15, textAlign: "center" },
  inputDark: { width: "100%", background: "#053737", border: "none", color: "#fff", padding: 12, marginBottom: 10, borderRadius: 8, boxSizing: "border-box" },
  btnGreenFull: { width: "100%", background: "#00ffd0", padding: 12, border: "none", borderRadius: 8, fontWeight: "bold" },
  supportBox: { textAlign: "center", padding: 30, background: "#021c1c", borderRadius: 15 },
  btnTg: { background: "#0088cc", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 20, fontWeight: "bold" }
};