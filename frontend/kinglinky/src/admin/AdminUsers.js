
import React, { useEffect, useState } from "react";
import {API_BASE} from "../api.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await API_BASE.get("/api/admin/users");
      const data = Array.isArray(res.data) ? res.data : [];

      // 🔒 SAFETY NORMALIZATION (NO toFixed crash)
      const normalized = data.map((u) => ({
        ...u,
        wallet: Number(u.wallet || 0),
        referralEarnings: Number(u.referralEarnings || 0),
        totalEarnings: Number(u.totalEarnings || 0),
      }));

      setUsers(normalized);
    } catch (err) {
      console.error("ADMIN USERS LOAD ERROR", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p style={{ padding: 20 }}>Loading users...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>👑 Admin – Users</h2>

      {users.length === 0 && <p>No users found</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Wallet ($)</Th>
            <Th>Referral Earnings ($)</Th>
            <Th>Total Earnings ($)</Th>
            <Th>Joined</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <Td>{u.name || "-"}</Td>
              <Td>{u.email}</Td>
              <Td>{u.wallet.toFixed(2)}</Td>
              <Td>{u.referralEarnings.toFixed(2)}</Td>
              <Td>{u.totalEarnings.toFixed(2)}</Td>
              <Td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== SMALL COMPONENTS =====
function Th({ children }) {
  return (
    <th
      style={{
        borderBottom: "1px solid #ccc",
        textAlign: "left",
        padding: 8,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td
      style={{
        borderBottom: "1px solid #eee",
        padding: 8,
      }}
    >
      {children}
    </td>
  );
}
