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
  const [userData, setUserData] = useState(null);
  const [longUrl, setLongUrl] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [note, setNote] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 📅 Month Filter State (Default: Current Month)
  const currentMonthKey = new Date().toISOString().slice(0, 7); // e.g., "2026-01"
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  /* ========= DYNAMIC CPM LOGIC ========= */
  const calculateCPM = (views) => (views >= 5000 ? 9.8 : 10);

  useEffect(() => {
    if (token && user?.email) {
      loadData();
    }
  }, [user, token]);

  async function loadData() {
    setLoading(true);
    try {
      const [linksRes, wdRes, userRes] = await Promise.all([
        axios.get(`${API_BASE}/api/links?email=${user.email}`, auth),
        axios.get(`${API_BASE}/api/withdraw/my`, auth),
        axios.get(`${API_BASE}/api/users/profile?email=${user.email}`, auth),
      ]);

      setLinks(Array.isArray(linksRes.data) ? linksRes.data : []);
      setWithdraws(wdRes.data?.data || []);
      setUserData(userRes.data);
    } catch (err) {
      console.error("Dashboard load error", err);
    } finally {
      setLoading(false);
    }
  }

  /* ========= STATS CALCULATION ========= */
  const todayKey = new Date().toISOString().slice(0, 10);

  // 🟢 Selected Month Views Calculation
  const monthlyViews = links.reduce((sum, l) => {
    if (l?.dailyClicks && typeof l.dailyClicks === "object") {
      // Filter keys that start with "2026-01" etc.
      const monthData = Object.entries(l.dailyClicks)
        .filter(([date]) => date.startsWith(selectedMonth))
        .reduce((s, [_, count]) => s + Number(count), 0);
      return sum + monthData;
    }
    return sum;
  }, 0);

  // Overall Total Views (All time)
  const totalViews = links.reduce((sum, l) => sum + (Number(l?.clicks) || 0), 0);
  const currentCPM = calculateCPM(totalViews);

  // Estimated Monthly Earnings based on CPM
  const monthlyUSD = (monthlyViews * currentCPM) / 1000;

  const walletUSD = Number(userData?.wallet || 0);
  const paidUSD = withdraws
    .filter((w) => w.status === "paid")
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  const todayViews = links.reduce((sum, l) => {
    if (l?.dailyClicks && typeof l.dailyClicks === "object") {
      return sum + Number(l.dailyClicks[todayKey] || 0);
    }
    return sum;
  }, 0);

  const todayUSD = Number(userData?.todayEarnings || 0);

  const hasRequestedToday = withdraws.some(
    (w) => new Date(w.createdAt).toISOString().slice(0, 10) === todayKey
  );

  function money(v) {
    const val = Number(v) || 0;
    return currency === "USD"
      ? `$ ${val.toFixed(2)}`
      : `₹ ${(val * USD_TO_INR).toFixed(2)}`;
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
      // alert("Deleted! 🗑️");
    } catch { alert("Delete failed!"); }
  }

  async function requestWithdraw() {
    // 1. Input-la user kudukkurathu Rupees (INR)
    const amtInINR = Number(withdrawAmount); 
    
    // 2. Athai USD-ku mathi check pannanum (Dollar calculation kaaga)
    const amtInUSD = amtInINR / USD_TO_INR;

    if (hasRequestedToday) return alert("One request per day only!");
    
    // 3. Minimum check (Rupees-laye check panrom)
    const minINR = MIN_WITHDRAW * USD_TO_INR;
    if (!amtInINR || amtInINR < minINR) {
        return alert(`Min withdraw is ₹${minINR.toFixed(2)}`);
    }

    // 4. Balance check (Wallet-la irukura USD-ah INR-ah mathi check panrom)
    const walletINR = walletUSD * USD_TO_INR;
    if (amtInINR > walletINR) {
        return alert("Insufficient balance in your wallet!");
    }

    try {
        // Backend-ku USD value-ah thaan anupanum (calculation easy-ah irukka)
        await axios.post(`${API_BASE}/api/withdraw`, { 
            amount: amtInUSD, // USD value 
            amountINR: amtInINR, // Reference-ku INR value
            note 
        }, auth);

        alert("Withdraw Request Sent! ✅ (Admin approve panna udane wallet-la koraiyum)");
        setWithdrawAmount("");
        setNote("");
        loadData();
    } catch (err) { 
        alert(err.response?.data?.message || "Withdraw request failed"); 
    }
}
  if (loading) {
    return (
      <div style={{ ...styles.wrap, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: '#00ffd0' }}>👑 {userData?.name || user?.name} Kinglinky...</h2>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={{ color: '#00ffd0', margin: 0 }}>👑 Kinglinky</h2>
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
        <span>👑 <b>{userData?.name || user?.name}</b></span>
        <span style={styles.cpmBadge}>CPM: ${currentCPM}</span>
      </div>

      {tab === "dashboard" && (
        <>
          <div style={styles.grid}>
            {/* Filtered Monthly Stats */}
            <Card title={`${selectedMonth} Views`} value={monthlyViews} color="#00ffd0" />
            <Card title={`${selectedMonth} Earnings`} value={money(monthlyUSD)} color="#00ffd0" />
            
            <Card title="Today Views" value={todayViews} />
            <Card title="Today Earnings" value={money(todayUSD)} />
            
            <Card title="Wallet Balance" value={money(walletUSD)} color="#00ffd0" />
            <Card title="Total Withdrawn" value={money(paidUSD)} color="#ff4444" />
          </div>
            {/* MONTH SELECTOR (Dynamic Stats) */}
      <div style={styles.monthFilterRow}>
        <span style={{ fontSize: 13, color: '#aaa' }}>Filter Month:</span>
        <input 
          type="month" 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={styles.monthInput}
        />
      </div>

          <div style={styles.chartContainer}>
            <h4 style={{ marginBottom: 15, fontSize: 14 }}>Global Link Performance</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={links.slice(-8).map(l => ({ n: 'Link', c: l.clicks }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#053737" />
                <XAxis hide />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip contentStyle={{ background: '#021c1c', border: '1px solid #00ffd0' }} />
                <Line type="monotone" dataKey="c" stroke="#00ffd0" strokeWidth={3} dot={{ r: 4, fill: '#00ffd0' }} />
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
          {links.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No links found.</p> :
            links.map(l => (
              <div key={l._id} style={styles.linkBox}>
                <div style={{ overflow: 'hidden', marginRight: 10 }}>
                  <div style={{ color: '#00ffd0', fontWeight: 'bold', fontSize: 14 }}>{l.shortUrl}</div>
                  <small style={{ color: '#aaa' }}>{l.clicks} clicks total</small>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button style={styles.iconBtn} onClick={() => { navigator.clipboard.writeText(l.shortUrl); alert("Copied!") }}>📋</button>
                  <button style={styles.iconBtn} onClick={() => deleteLink(l._id)}>🗑️</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === "withdraw" && (
        <div style={styles.withdrawCard}>
          <h3 style={{ marginTop: 0 }}>Wallet: {money(walletUSD)}</h3>
          {hasRequestedToday ? (
            <p style={{ color: '#ffcc00', fontSize: 13 }}>⚠️ Limit: One request per day. Come back tomorrow!</p>
          ) : (
            <>
              <input type="number" style={styles.inputFull} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder={`Min ${money(MIN_WITHDRAW)}`} />
              <textarea style={styles.inputFull} value={note} onChange={e => setNote(e.target.value)} placeholder="UPI ID / GPay Details" rows={3} />
              <button style={styles.btnWithdraw} onClick={requestWithdraw}>Request Withdrawal</button>
            </>
          )}
        </div>
      )}

      {tab === "history" && (
        <div style={styles.section}>
          {withdraws.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No history found.</p> :
            withdraws.map(w => (
              <div key={w._id} style={styles.linkBox}>
                <div>
                  <div>{money(w.amount)}</div>
                  <small style={{ color: '#888' }}>{new Date(w.createdAt).toLocaleDateString()}</small>
                </div>
                <b style={{ color: w.status === 'paid' ? '#00ffd0' : '#ffcc00' }}>{w.status.toUpperCase()}</b>
              </div>
            ))
          }
        </div>
      )}

      {tab === "support" && (
        <div style={styles.supportBox}>
          <div style={{ fontSize: 50, marginBottom: 10 }}>💬</div>
          <h3>Help Center</h3>
          <p style={{ color: '#aaa', fontSize: 14 }}>Issues with payments? Contact Telegram.</p>
          <button style={styles.btnTg} onClick={() => window.open("https://t.me/KingLinkySupport_Bot")}>
            Chat on Telegram
          </button>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, color = "#fff" }) {
  return (
    <div style={styles.card}>
      <div style={{ color: '#aaa', fontSize: 10, marginBottom: 5, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ color: color, fontSize: 17, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

const styles = {
  wrap: { padding: "15px", minHeight: "100vh", background: "#011111", color: "#eafffa", fontFamily: "system-ui" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  headerRight: { display: "flex", gap: 12, alignItems: "center" },
  burger: { fontSize: 26, cursor: "pointer", color: "#00ffd0" },
  select: { background: "#053737", color: "#fff", border: "1px solid #00ffd0", borderRadius: 4, padding: "2px 5px" },
  mobileMenu: { background: "#021c1c", borderRadius: 10, padding: 8, border: "1px solid #053737", position: 'absolute', right: 15, top: 60, zIndex: 100, width: 150 },
  menuItem: { padding: "12px", borderBottom: "1px solid #033", cursor: "pointer", fontSize: 13 },
  monthFilterRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15, background: '#021c1c', padding: '10px', borderRadius: 8, border: '1px solid #053737' },
  monthInput: { background: '#053737', border: '1px solid #00ffd0', color: '#fff', padding: '5px', borderRadius: 5, fontSize: 13 },
  userBanner: { display: "flex", justifyContent: "space-between", background: "#022626", padding: "12px", borderRadius: 10, marginBottom: 15, border: "1px solid #053737" },
  cpmBadge: { color: "#00ffd0", fontSize: 11, border: "1px solid #00ffd0", padding: "2px 8px", borderRadius: 12 },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  card: { background: "#053737", padding: 15, borderRadius: 12, border: "1px solid #024444" },
  chartContainer: { marginTop: 15, background: "#021c1c", padding: 15, borderRadius: 12, border: "1px solid #053737" },
  section: { marginTop: 15 },
  inputRow: { display: "flex", gap: 8, marginBottom: 15 },
  input: { flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#053737", color: "#fff" },
  linkBox: { background: "#053737", padding: "12px 15px", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  iconBtn: { background: "#011111", border: "1px solid #053737", color: "#fff", padding: "6px 10px", borderRadius: 6 },
  btnAction: { background: "#00ffd0", border: "none", padding: "0 15px", borderRadius: 8, fontWeight: "bold" },
  withdrawCard: { background: "#021c1c", padding: 20, borderRadius: 15, border: "1px solid #053737", textAlign: "center" },
  inputFull: { width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, border: "none", background: "#053737", color: "#fff", boxSizing: "border-box" },
  btnWithdraw: { width: "100%", padding: 12, background: "#00ffd0", border: "none", borderRadius: 8, fontWeight: "bold" },
  supportBox: { textAlign: "center", padding: "30px 15px", background: "#021c1c", borderRadius: 15, border: "1px solid #053737" },
  btnTg: { background: "#0088cc", color: "#fff", border: "none", padding: "12px 25px", borderRadius: 25, fontWeight: "bold" }
};