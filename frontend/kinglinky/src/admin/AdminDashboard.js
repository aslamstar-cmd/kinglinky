import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "https://kinglinky.onrender.com";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/api/admin/dashboard`)
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("ADMIN DASHBOARD ERROR", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p style={{ padding: 20 }}>Loading admin dashboard…</p>;
  if (!stats) return <p style={{ padding: 20 }}>Failed to load data</p>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 20 }}>📊 Admin Dashboard</h2>

      <div style={grid}>
        <Card title="Total Users" value={stats.totalUsers} />
        <Card title="Total Links" value={stats.totalLinks} />
        <Card title="Total Clicks" value={stats.totalClicks} />
        <Card title="Total Earnings ($)" value={stats.totalEarnings} />
        <Card title="Pending Withdraws" value={stats.pendingWithdraws} />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 13, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: "bold", marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
  gap: 18,
};

const card = {
  background: "#ffffff",
  padding: 22,
  borderRadius: 16,
  boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
};