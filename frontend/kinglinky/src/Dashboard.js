import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ================= CONFIG ================= */
const API = "https://kinglinky.onrender.com";
const CPM_USD = 10;
const USD_TO_INR = 89.5;
const MIN_WITHDRAW = 1;
/* ========================================= */

export default function Dashboard({ user, token }) {
  const [tab, setTab] = useState("dashboard");
  const [currency, setCurrency] = useState("USD");

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
    if (!user?.email) return;
    loadData();
    // eslint-disable-next-line
  }, [user]);

  async function loadData() {
    try {
      const linksRes = await axios.get(
        `${API}/api/links/${user.email}`,
        auth
      );

      let wdRes = { data: [] };
      try {
        wdRes = await axios.get(`${API}/api/withdraw/my`, auth);
      } catch {}

      setLinks(Array.isArray(linksRes.data) ? linksRes.data : []);
      setWithdraws(Array.isArray(wdRes.data) ? wdRes.data : []);
    } catch (err) {
      console.error("LOAD ERROR", err);
      setLinks([]);
      setWithdraws([]);
    }
  }

  /* ========== STATS ========== */
  const totalViews = links.reduce((a, b) => a + (b.clicks || 0), 0);

  const todayStr = new Date().toDateString();
  const todayViews = links.reduce((a, b) => {
    return new Date(b.createdAt).toDateString() === todayStr
      ? a + (b.clicks || 0)
      : a;
  }, 0);

  const totalUSD = (totalViews / 1000) * CPM_USD;
  const todayUSD = (todayViews / 1000) * CPM_USD;

  const paidUSD = withdraws
    .filter((w) => w.status === "paid")
    .reduce((a, b) => a + (b.amount || 0), 0);

  const walletUSD = Math.max(totalUSD - paidUSD, 0);

  function money(v) {
    return currency === "USD"
      ? `$ ${v.toFixed(2)}`
      : `₹ ${(v * USD_TO_INR).toFixed(2)}`;
  }

  /* ========== CHART DATA ========== */
  const chartData = links.map((l) => ({
    date: new Date(l.createdAt).toLocaleDateString(),
    clicks: l.clicks || 0,
  }));

  /* ========== SHORTEN ========== */
async function shorten() {
  if (!longUrl) {
    alert("Paste URL");
    return;
  }

  try {
    const res = await axios.post("https://kinglinky.onrender.com/api/links/shorten", {
      longUrl,
      email: user.email,
    });

    // 🔥 IMPORTANT FIX
    const newShortUrl = res.data.shortUrl;

    setShortUrl(newShortUrl);
    setLongUrl("");

    loadData(); // reload user links
  } catch (err) {
    console.error("SHORTEN ERROR:", err);
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

    if (!amt || amt <= 0) {
      alert("Enter valid amount");
      return;
    }

    if (amt < MIN_WITHDRAW) {
      alert(`Minimum withdraw $${MIN_WITHDRAW}`);
      return;
    }

    if (amt > walletUSD) {
      alert("Insufficient balance");
      return;
    }

    try {
      await axios.post(
        `${API}/api/withdraw`,
        {
          userId: user._id,
          userEmail: user.email,
          amount: amt,
        },
        auth
      );

      alert("Withdraw request submitted ✅");
      setWithdrawAmount("");
      loadData();
    } catch (err) {
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
          <b>{user.name}</b>{" "}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </div>
      </div>

      {/* MENU */}
      <div style={menu}>
        <Btn active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
          Dashboard
        </Btn>
        <Btn active={tab === "manage"} onClick={() => setTab("manage")}>
          Manage Links
        </Btn>
        <Btn active={tab === "withdraw"} onClick={() => setTab("withdraw")}>
          Withdraw
        </Btn>
        <Btn active={tab === "history"} onClick={() => setTab("history")}>
          History
        </Btn>
        <Btn active={tab === "support"} onClick={() => setTab("support")}>
          Support
        </Btn>
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <>
          <div style={grid}>
            <Card title="Today Views" value={todayViews} />
            <Card title="Total Views" value={totalViews} />
            <Card title="Today Earnings" value={money(todayUSD)} />
            <Card title="Avg CPM" value={money(CPM_USD)} />
            <Card title="Available Wallet" value={money(walletUSD)} />
            <Card title="Withdrawn Money" value={money(paidUSD)} />
          </div>

          <div style={chartBox}>
            <h4>📈 Views Chart</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#9ff" />
                <YAxis stroke="#9ff" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#00ffd0"
                  strokeWidth={2}
                />
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
            <input
              placeholder="Paste long URL"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              style={input}
            />
            <button onClick={shorten}>Shorten</button>
          </div>

          {shortUrl && (
            <div style={box}>
              <span>{shortUrl}</span>
              <button onClick={() => copy(shortUrl)}>Copy</button>
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
            <p>
              <b>Available Wallet:</b> {money(walletUSD)}
            </p>
            <p style={{ fontFamily:"monospace"}}>Minimum Withdraw $1</p>

            <input
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={{input,
                     margin:"20px",
                     widht:"50px",
                     height:"25px",
                     color:"green",
                     fontFamily:"-moz-initial",
                     borderRadius:"7px",
              }}
            />

            <button
              style={{ margin: 5,
                       borderRadius:"7px",
                       height:"30px",
                       color:"green",
                       fontFamily:"-moz-initial"
                      
              }}
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
        <button
          onClick={() =>
            window.open("https://t.me/KinglinkySupport", "_blank")
          }
        >
          Telegram Support
        </button>
      )}
    </div>
  );
}

/* ========== UI PARTS ========== */
function Btn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        background: active ? "#00ffd0" : "#033",
        color: active ? "#000" : "#cff",
        border: "none",
        borderRadius: 6,
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

/* ========== STYLES ========== */
const wrap = {
  padding: 20,
  minHeight: "100vh",
  background: "#021616",
  color: "#eafffa",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const menu = {
  display: "flex",
  gap: 8,
  margin: "15px 0",
  flexWrap: "wrap",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))",
  gap: 10,
};

const card = {
  background: "#053737",
  padding: 14,
  borderRadius: 10,
};

const box = {
  background: "#053737",
  padding: 10,
  borderRadius: 8,
  marginBottom: 8,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const row = { display: "flex", gap: 8 };

const input = {
  flex: 1,
  padding: 6,
  borderRadius: 6,
  border: "none",
};

const chartBox = {
  marginTop: 20,
  background: "#053737",
  padding: 15,
  borderRadius: 10,
};