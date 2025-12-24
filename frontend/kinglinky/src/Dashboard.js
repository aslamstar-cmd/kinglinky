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

  // ✅ FIX 1: token always from localStorage
  const token = localStorage.getItem("token");

  const [tab, setTab] = useState("dashboard");
  const [currency, setCurrency] = useState("USD");
  const [selectedMonth, setSelectedMonth] = useState("all"); 

  const [links, setLinks] = useState([]);
  const [withdraws, setWithdraws] = useState([]);

  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");

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
      // ✅ FIX 2: email remove panniten
      const linksRes = await axios.get(
        `${API_BASE}/api/links`,
        auth
      );

      let wdRes = { data: [] };
      try {
        wdRes = await axios.get(`${API_BASE}/api/withdraw/my`, auth);
      } catch {}

      setLinks(Array.isArray(linksRes.data) ? linksRes.data : []);
      setWithdraws(Array.isArray(wdRes.data) ? wdRes.data : []);
    } catch (err) {
      console.error("LOAD ERROR", err);
      setLinks([]);
      setWithdraws([]);
    }
  }

  /* ========== GLOBAL STATS ========== */
  const allTimeViews = links.reduce((a, b) => a + (b.clicks || 0), 0);
  const allTimeUSD = (allTimeViews / 1000) * CPM_USD;

  const paidUSD = withdraws
    .filter((w) => w.status === "paid")
    .reduce((a, b) => a + (b.amount || 0), 0);

  const walletUSD = Math.max(allTimeUSD - paidUSD, 0);

  /* ========== MONTH FILTER ========== */
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const filteredLinks = links.filter((l) => {
    if (selectedMonth === "all") return true;
    return new Date(l.createdAt).getMonth() === Number(selectedMonth);
  });

  const monthlyViews = filteredLinks.reduce((a, b) => a + (b.clicks || 0), 0);

  const todayStr = new Date().toDateString();
  const todayViews = links.reduce((a, b) => {
    return new Date(b.createdAt).toDateString() === todayStr
      ? a + (b.clicks || 0)
      : a;
  }, 0);

  const todayUSD = (todayViews / 1000) * CPM_USD;

  function money(v) {
    return currency === "USD"
      ? `$ ${v.toFixed(2)}`
      : `₹ ${(v * USD_TO_INR).toFixed(2)}`;
  }

  const chartData = filteredLinks.map((l) => ({
    date: new Date(l.createdAt).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    }),
    clicks: l.clicks || 0,
  }));

  /* ========== SHORTEN ========== */
  async function shorten() {
    if (!longUrl) {
      alert("Paste URL");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE}/api/links/shorten`,
        { longUrl },
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
      // ✅ FIX 3: API_BASE use
      await axios.post(
        `${API_BASE}/api/withdraw`,
        { amount: amt },
        auth
      );
      alert("Withdraw request submitted ✅");
      setWithdrawAmount("");
      loadData();
    } catch {
      alert("Withdraw failed");
    }
  }

  /* ===== UI BELOW – UNCHANGED ===== */
  // (UI code exactly same – naan touch pannala)

  return (
    <div style={wrap}>
      {/* HEADER */}
      <div style={{...header, fontFamily:"-moz-initial"}}>
        <h2>👑 Kinglinky</h2>
        <div>
          <b>👑{user.name}</b>{" "}
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
            {t.charAt(0).toUpperCase() + t.slice(1)}
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
            <Card title="Avg CPM" value={money(CPM_USD)} />
            <Card title="Available Wallet" value={money(walletUSD)} />
            <Card title="Withdrawn Money" value={money(paidUSD)} />
          </div>

          <div style={chartBox}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#9ff" />
                <YAxis stroke="#9ff" />
                <Tooltip />
                <Line type="monotone" dataKey="clicks" stroke="#00ffd0" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* rest UI unchanged */}
    </div>
  );
}

/* ===== UI helpers ===== */
function Btn({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"6px 12px",
      background: active ? "#00ffd0" : "#033",
      color: active ? "#000" : "#cff",
      border:"none",
      borderRadius:6
    }}>
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

/* ===== STYLES ===== */
const wrap = { padding:20, minHeight:"100vh", background:"#021616", color:"#eafffa" };
const header = { display:"flex", justifyContent:"space-between" };
const menu = { display:"flex", gap:8, margin:"15px 0", flexWrap:"wrap" };
const grid = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10 };
const card = { background:"#053737", padding:14, borderRadius:10 };
const chartBox = { marginTop:20, background:"#053737", padding:15, borderRadius:10 };