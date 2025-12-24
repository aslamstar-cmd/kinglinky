import React, { useEffect, useState } from "react";
import axios from "axios";
import {API_BASE} from "./api.js"

export default function AdminWithdraws() {
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH WITHDRAWS
  // =========================
  const fetchWithdraws = async () => {
    try {
      const res = await API_BASE.get("/api/withdraw/admin");

      // backend returns { success, data }
      const data = Array.isArray(res.data.data)
        ? res.data.data
        : [];

      setWithdraws(data);
    } catch (err) {
      console.error("Error fetching withdraws:", err);
      setWithdraws([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdraws();
    // eslint-disable-next-line
  }, []);

  // =========================
  // APPROVE WITHDRAW
  // =========================
  const approveWithdraw = async (id) => {
    const ok = window.confirm("Mark this withdraw as PAID?");
    if (!ok) return;

    try {
      await axios.post(
        `${API_BASE}/approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchWithdraws();
    } catch (err) {
      console.error("Error approving withdraw:", err);
      alert("Approve failed");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>Withdraw Requests</h1>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100px",
            height:"200px",
            borderCollapse: "collapse",
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <thead style={{ background: "#0b7a46", color: "white" }}>
            <tr>
              <th style={{ padding: 10, textAlign: "left" }}>Email</th>
              <th style={{ padding: 10 }}>Amount</th>
              <th style={{ padding: 10 }}>Note</th>
              <th style={{ padding: 10 }}>Date</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: 20 }}>
                  Loading...
                </td>
              </tr>
            ) : withdraws.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: 30 }}>
                  No withdraws found.
                </td>
              </tr>
            ) : (
              withdraws.map((w) => (
                <tr key={w._id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 10 }}>{w.userEmail}</td>
                  <td style={{ padding: 10 }}>₹ {w.amount}</td>
                  <td style={{ padding: 10 }}>{w.note || "-"}</td>
                  <td style={{ padding: 10 }}>
                    {new Date(w.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: 10, textTransform: "capitalize" }}>
                    {w.status}
                  </td>
                  <td style={{ padding: 10 }}>
                    {w.status === "pending" ? (
                      <button
                        onClick={() => approveWithdraw(w._id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: "none",
                          background: "#0b7a46",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        Mark Paid
                      </button>
                    ) : (
                      "✅ Paid"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}