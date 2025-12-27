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

  /* ========= AUTH ========= */
  const token = localStorage.getItem("token");

  const auth = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  /* ========= STATES ========= */
  const [tab, setTab] = useState("dashboard");
  const [currency, setCurrency] = useState("USD");
  const [selectedMonth, setSelectedMonth] = useState("all");

  const [links, setLinks] = useState([]);
  const [withdraws, setWithdraws] = useState([]);

  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [note, setNote] = useState("");

  /* ========= LOAD DATA ========= */
  useEffect(() => {
    if (!user?.email || !token) return;
    loadData();
    // eslint-disable-next-line
  }, [user, token]);

  async function loadData() {
    try {
      const linksRes = await axios.get(
        `${API_BASE}/api/links?email=${user.email}`,
        auth
      );

      const wdRes = await axios.get(
        `${API_BASE}/api/withdraw/my?email=${user.email}`,
        auth
      );

      setLinks(Array.isArray(linksRes.data) ? linksRes.data : []);
      setWithdraws(Array.isArray(wdRes.data) ? wdRes.data : []);
    } catch (err) {
      console.error("Dashboard load error", err);
      setLinks([]);
      setWithdraws([]);
    }
  }

  /* ========= STATS ========= */
  const allTimeViews = links.reduce(
    (sum, l) => sum + (Number(l.clicks) || 0),
    0
  );

  const allTimeUSD = (allTimeViews / 1000) * CPM_USD;

  const paidUSD = withdraws
    .filter((w) => w.status === "paid")
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  const walletUSD = Math.max(allTimeUSD - paidUSD, 0);

  /* ========= TODAY VIEWS (FIXED) ========= */
  const todayStr = new Date().toISOString().slice(0, 10);

  const todayViews = links.reduce((sum, l) => {
    if (!l.createdAt) return sum;
    const linkDate = new Date(l.createdAt).toISOString().slice(0, 10);
    return linkDate === todayStr ? sum + (l.clicks || 0) : sum;
  }, 0);

  const todayUSD = (todayViews / 1000) * CPM_USD;

  /* ========= MONTH FILTER ========= */
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const filteredLinks = links.filter((l) => {
    if (selectedMonth === "all") return true;
    return new Date(l.createdAt).getMonth() === Number(selectedMonth);
  });

  const monthlyViews = filteredLinks.reduce(
    (sum, l) => sum + (Number(l.clicks) || 0),
    0
  );

  /* ========= CHART ========= */
  const chartData = filteredLinks.map((l) => ({
    date: new Date(l.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    clicks: l.clicks || 0,
  }));

  /* ========= MONEY FORMAT ========= */
  function money(v) {
    return currency === "USD"
      ? `$ ${v.toFixed(2)}`
      : `₹ ${(v * USD_TO_INR).toFixed(2)}`;
  }

  /* ========= SHORTEN ========= */
  async function shorten() {
    if (!longUrl) return alert("Paste URL");

    try {
      const res = await axios.post(
        `${API_BASE}/api/links/shorten`,
        { longUrl, email: user.email },
        auth
      );

      if (res.data?.shortUrl) {
        setShortUrl(res.data.shortUrl);
        setLongUrl("");
        loadData();
      }
    } catch (err) {
      alert("Shorten failed");
      console.error(err);
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
    alert("Copied");
  }

  /* ========= DELETE LINK ========= */
  async function deleteLink(id) {
    if (!window.confirm("Delete this link?")) return;
    try {
      await axios.delete(`${API_BASE}/api/links/${id}`, auth);
      loadData();
    } catch {
      alert("Delete failed");
    }
  }

  /* ========= WITHDRAW ========= */
  async function requestWithdraw() {
    const amt = Number(withdrawAmount);

    if (!amt || amt < MIN_WITHDRAW || amt > walletUSD) {
      alert("Invalid amount");
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/api/withdraw`,
        { amount: amt, note },
        auth
      );
      alert("Withdraw request sent ✅");
      setWithdrawAmount("");
      setNote("");
      loadData();
    } catch {
      alert("Withdraw failed");
    }
  }

  /* ================= UI ================= */
  return (
    <div style={wrap}>
      {/* HEADER */}
      <div style={header}>
        <h2>👑 Kinglinky</h2>
        <div>
          <b>👤 {user.name}</b>{" "}
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </div>
      </div>

      {/* MENU */}
      <div style={menu}>
        {["dashboard","manage","withdraw","history","support"].map((t) => (
          <Btn key={t} active={tab === t} onClick={() => setTab(t)}>
            {t.toUpperCase()}
          </Btn>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <>
          <div style={grid}>
            <Card title="Today Views" value={todayViews} />
            <Card title="Total Views" value={monthlyViews} />
            <Card title="Today Earnings" value={money(todayUSD)} />
            <Card title="Wallet" value={money(walletUSD)} />
          </div>

          <div style={chartBox}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="clicks" stroke="#00ffd0" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* MANAGE */}
      {tab === "manage" && (
        <>
          <div style={row}>
            <input
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              placeholder="Paste long URL"
              style={input}
            />
            <button onClick={shorten}>Shorten</button>
          </div>

          {links.map((l) => (
            <div key={l._id} style={box}>
              <span>{l.shortUrl}</span>
              <div>
                <button onClick={() => copy(l.shortUrl)}>Copy</button>
                <button onClick={() => deleteLink(l._id)}>❌</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* WITHDRAW */}
      {tab === "withdraw" && (
        <div style={card}>
          <p>Wallet: {money(walletUSD)}</p>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Amount"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="UPI / Bank"
          />
          <button onClick={requestWithdraw}>Request Withdraw</button>
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" &&
        withdraws.map((w) => (
          <div key={w._id} style={box}>
            <span>{money(w.amount)}</span>
            <span>{w.status}</span>
          </div>
        ))}

      {/* SUPPORT */}
      {tab === "support" && (
        <button onClick={() => window.open("https://t.me/KinglinkySupport")}>
          Telegram Support
        </button>
      )}
    </div>
  );
}

/* ========= UI ========= */
function Btn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#00ffd0" : "#033",
        color: active ? "#000" : "#fff",
        padding: "8px 14px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
      }}
    >
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

/* ========= STYLES ========= */
const wrap = { padding: 20, minHeight: "100vh", background: "#021616", color: "#eafffa" };
const header = { display: "flex", justifyContent: "space-between" };
const menu = { display: "flex", gap: 8, margin: "20px 0" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 };
const card = { background: "#053737", padding: 14, borderRadius: 8 };
const box = { background: "#053737", padding: 10, marginBottom: 8, display: "flex", justifyContent: "space-between" };
const row = { display: "flex", gap: 8 };
const input = { flex: 1, padding: 10 };
const chartBox = { marginTop: 20 };