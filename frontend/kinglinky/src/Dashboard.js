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
} from "recharts";

/* ================= CONFIG ================= */
const CPM_USD = 10;
const USD_TO_INR = 85.5;
const MIN_WITHDRAW = 1;
/* ========================================= */

export default function Dashboard({ user }) {

  // ✅ FIX 1: token safe-ah localStorage la irundhu
  const token = localStorage.getItem("token");

  const [tab, setTab] = useState("dashboard");
  const [currency, setCurrency] = useState("USD");
  const [selectedMonth, setSelectedMonth] = useState("all");

  const [links, setLinks] = useState([]);
  const [withdraws, setWithdraws] = useState([]);

  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [note, setNote] = useState("");


  const auth = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  /* ========== LOAD USER DATA ========== */
  useEffect(() => {
    if (!user?.email || !token) return;
    loadData();
    // eslint-disable-next-line
  }, [user, token]);

  async function loadData() {
    try {
      // ✅ FIX 2: email remove pannitan (JWT backend handle)
      const linksRes = await axios.get(
        `${API_BASE}/api/links`,
        auth
      );

      let wdRes = { data: [] };
      try {
        wdRes = await axios.get(`${API_BASE}/api/withdraw/my`, auth);
      } catch { }

      setLinks(Array.isArray(linksRes.data) ? linksRes.data : []);
      setWithdraws(Array.isArray(wdRes.data) ? wdRes.data : []);
    } catch (err) {
      console.error("LOAD ERROR", err);
      setLinks([]);
      setWithdraws([]);
    }
  }

  /* ========== GLOBAL STATS (UNCHANGED) ========== */
  const allTimeViews = links.reduce((a, b) => a + (b.clicks || 0), 0);
  const allTimeUSD = (allTimeViews / 1000) * CPM_USD;

  const paidUSD = withdraws
    .filter((w) => w.status === "paid")
    .reduce((a, b) => a + (b.amount || 0), 0);

  const walletUSD = Math.max(allTimeUSD - paidUSD, 0);

  /* ========== MONTH FILTER ========== */
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const filteredLinks = links.filter((l) => {
    if (selectedMonth === "all") return true;
    return new Date(l.createdAt).getMonth() === Number(selectedMonth);
  });

  const monthlyViews = filteredLinks.reduce((a, b) => a + (b.clicks || 0), 0);

  const todayStr = new Date().toDateString();
  const todayViews = links.reduce((a, b) =>
    new Date(b.createdAt).toDateString() === todayStr
      ? a + (b.clicks || 0)
      : a
    , 0);

  const todayUSD = (todayViews / 1000) * CPM_USD;

  function money(v) {
    return currency === "USD"
      ? `$ ${v.toFixed(2)}`
      : `₹ ${(v * USD_TO_INR).toFixed(2)}`;
  }

  const chartData = filteredLinks.map((l) => ({
    date: new Date(l.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    clicks: l.clicks || 0,
  }));

  /* ========== SHORTEN (UNTOUCHED) ========== */
  async function shorten() {
    if (!longUrl) {
      alert("Paste URL");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE}/api/links/shorten`,
        {
          longUrl
        },
        auth
      );
      setShortUrl(res.data.shortUrl);
      setLongUrl("");
      loadData();
    } catch {
      alert("Shorten failed");
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
    alert("Copied");
  }

  /* ========== WITHDRAW ========== */
  async function requestWithdraw() {
    const amt = Number(withdrawAmount);
    if (!amt || amt < MIN_WITHDRAW || amt > walletUSD) {
      alert("Invalid amount or insufficient balance");
      return;
    }
    try {
      // ✅ FIX 3: API_BASE correct
      await axios.post(
        `${API_BASE}/api/withdraw`,
        {
          amount: amt,
          note: note,
        },
        auth
      );
      alert("Withdraw request submitted ✅");
      setWithdrawAmount("");
      loadData();
    } catch {
      alert("Withdraw failed");
    }
  }

  /* UI – UNCHANGED */
  return (
    <div style={wrap}>
      {/* HEADER */}
      <div style={{ ...header, fontFamily: "-moz-initial" }}>
        <h2>👑 Kinglinky</h2>
        <div>
          <b style={{ fontFamily: "-moz-initial" }}>👑{user.name}</b>{" "}
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </div>
      </div>

      {/* MENU */}
      <div style={menu}>
        {["dashboard", "manage", "withdraw", "history", "support"].map((t) => (
          <Btn key={t} active={tab === t} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Btn>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h4 style={{ margin: 0 }}>Stats Overview</h4>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ padding: "5px", borderRadius: "5px", background: "#033", color: "#fff", border: "1px solid #00ffd0" }}
            >
              <option value="all">All Time</option>
              {months.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
            </select>
          </div>

          <div style={grid}>
            <Card title="Today Views" value={todayViews} />
            <Card
              title={selectedMonth === "all" ? "Total Views" : `${months[selectedMonth]} Views`}
              value={monthlyViews}
            />
            <Card title="Today Earnings" value={money(todayUSD)} />
            <Card title="Avg CPM" value={money(CPM_USD)} />
            <Card title="Available Wallet" value={money(walletUSD)} />
            <Card title="Withdrawn Money" value={money(paidUSD)} />
          </div>

          <div style={chartBox}>
            <h4>📈 Views Chart ({selectedMonth === "all" ? "All Time" : months[selectedMonth]})</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#9ff" />
                <YAxis stroke="#9ff" />
                <Tooltip contentStyle={{ background: "#053737", border: "none" }} />
                <Line type="monotone" dataKey="clicks" stroke="#00ffd0" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* MANAGE LINKS */}
      {tab === "manage" && (
        <>
          <h3>Shorten URL</h3>
          <div style={row}>
            <input placeholder="Paste long URL" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} style={input} />
            <button onClick={shorten} style={{ backgroundColor: "#033", color: "#fff", border: "none", padding: "0 15px", borderRadius: 6 }}>Shorten</button>
          </div>
          {shortUrl && (
            <div style={box}>
              <span>{shortUrl}</span>
              <button onClick={() => copy(shortUrl)} style={{ backgroundColor: "#033", color: "#fff" }}>Copy</button>
            </div>
          )}
          <h3>Your Links</h3>
          {links.map((l) => (
            <div key={l._id} style={box}>
              <div>{l.shortUrl}</div>
              <small>Clicks: {l.clicks}</small>
              <button onClick={() => copy(l.shortUrl)}>Copy</button>
            </div>
          ))}
        </>
      )}

      {/* WITHDRAW */}
      {tab === "withdraw" && (
        <div style={{ maxWidth: 400 }}>
          <h3>Withdraw</h3>
          <div style={card}>
            <p><b>Available Wallet:</b> {money(walletUSD)}</p>
            <p style={{ fontFamily: "monospace" }}>Minimum Withdraw $1</p>
            <input
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={{ padding: "8px", margin: "10px 0", width: "95%", borderRadius: "7px" }}
            />
            <input
              type="text"
              placeholder="Enter UPI / Bank details"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                padding: "8px",
                margin: "10px 0",
                width: "95%",
                borderRadius: "7px"
              }}
            />

            <button
              style={{ width: "100%", padding: "10px", borderRadius: "7px", backgroundColor: "#00ffd0", color: "#000", fontWeight: "bold" }}
              onClick={requestWithdraw}
            >
              Request Withdraw
            </button>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" &&
        withdraws.map((w) => (
          <div key={w._id} style={box}>
            {money(w.amount)} — {w.status}
          </div>
        ))}

      {/* SUPPORT */}
      {tab === "support" && (
        <button onClick={() => window.open("https://t.me/KinglinkySupport", "_blank")} style={{ width: "100%", fontFamily: "cursive", padding: "10px", borderRadius: "7px", backgroundColor: "#00ffd0", color: "#000", fontWeight: "bold" }}>
          Telegram Support
        </button>
      )}
    </div>
  );
}

/* ========== UI COMPONENTS ========== */
function Btn({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "6px 12px", background: active ? "#00ffd0" : "#033", color: active ? "#000" : "#cff", border: "none", borderRadius: 6, cursor: "pointer" }}>
      {children}
    </button>
  );
}

function Card({ title, value }) {
  return (
    <div style={card}>
      <small>{title}</small>
      <h3>{value}</h3>
    </div>
  );
}

/* ========== STYLES ========== */
const wrap = { padding: 20, minHeight: "100vh", background: "#021616", color: "#eafffa" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const menu = { display: "flex", gap: 8, margin: "15px 0", flexWrap: "wrap" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 10 };
const card = { background: "#053737", padding: 14, borderRadius: 10 };
const box = { background: "#053737", padding: 10, borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" };
const row = { display: "flex", gap: 8 };
const input = { flex: 1, padding: 6, borderRadius: 6, border: "none" };
const chartBox = { marginTop: 20, background: "#053737", padding: 15, borderRadius: 10 };