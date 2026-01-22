import React, { useEffect, useState } from "react";
import api from "../api.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      // Admin token eduthu auth header anupuvom
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      const res = await api.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = Array.isArray(res.data) ? res.data : (res.data.users || []);

      // 🔒 DATA NORMALIZATION
      const normalized = data.map((u) => ({
        ...u,
        wallet: Number(u.wallet || 0),
        referralEarnings: Number(u.referralEarnings || 0),
        totalEarnings: Number(u.totalEarnings || 0),
        // Ippo thaan user withdraw panna amount-ah edukurom
        totalWithdrawn: Number(u.totalWithdrawn || 0), 
      }));

      setUsers(normalized);
    } catch (err) {
      console.error("ADMIN USERS LOAD ERROR", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p style={{ padding: 20, textAlign: 'center' }}>Loading users database...</p>;

  return (
    <div style={{ padding: "30px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ color: "#2d3436", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        👥 Kinglinky Users Database
      </h2>

      <div style={{ overflowX: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", borderRadius: "12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ background: "#0b7a46", color: "#fff" }}>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Wallet ($)</Th>
              <Th>Withdrawn ($)</Th> {/* ✨ NEW COLUMN */}
              <Th>Referral ($)</Th>
              <Th>Total ($)</Th>
              <Th>Joined Date</Th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: 20, textAlign: 'center' }}>No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} style={{ borderBottom: "1px solid #f1f2f6" }}>
                  <Td style={{ fontWeight: "600" }}>{u.name || "Guest"}</Td>
                  <Td>{u.email}</Td>
                  <Td style={{ color: "#0984e3", fontWeight: "bold" }}>${u.wallet.toFixed(2)}</Td>
                  <Td style={{ color: "#d63031", fontWeight: "bold" }}>${u.totalWithdrawn.toFixed(2)}</Td>
                  <Td>${u.referralEarnings.toFixed(2)}</Td>
                  <Td style={{ color: "#27ae60", fontWeight: "bold" }}>${u.totalEarnings.toFixed(2)}</Td>
                  <Td style={{ fontSize: "12px", color: "#636e72" }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== STYLED COMPONENTS =====
function Th({ children }) {
  return (
    <th style={{ padding: "15px 12px", textAlign: "left", fontSize: "14px", fontWeight: "600", letterSpacing: "0.5px" }}>
      {children}
    </th>
  );
}

function Td({ children, style }) {
  return (
    <td style={{ padding: "12px", fontSize: "14px", color: "#2d3436", ...style }}>
      {children}
    </td>
  );
}