import React, { useEffect, useState } from "react";
import api from "../api.js";

export default function AdminWithdraws() {
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH WITHDRAWS LOGIC
  const fetchWithdraws = async () => {
    setLoading(true);
    try {
      // 1. Admin Token or User Token edukkavum
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

      // 2. GET request - Backend endpoint correct-ah irukanum (/api/withdraw/admin)
      const res = await api.get("/api/withdraw/admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && res.data.success) {
        setWithdraws(res.data.data || []);
      } else {
        setWithdraws([]);
      }
    } catch (err) {
      console.error("Error fetching withdraws:", err.response ? err.response.data : err.message);
      setWithdraws([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  // APPROVE LOGIC (WALLET DEDUCTION HAPPENS HERE)
  const approveWithdraw = async (id) => {
    const ok = window.confirm("Are you sure? User wallet balance will be deducted now.");
    if (!ok) return;

    try {
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      
      // Backend approve endpoint trigger panrom
      const res = await api.post(`/api/withdraw/approve/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.data.success) {
        alert("Success: Paid & Wallet Updated! 💸");
        fetchWithdraws(); // List-ah refresh panrom
      }
    } catch (err) {
      console.error("Error approving withdraw:", err);
      alert("Approve failed: " + (err.response?.data?.message || "Check backend console"));
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui", background: "#f4f7f6", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "20px", fontSize: "26px", color: "#0b7a46", display: "flex", alignItems: "center", gap: "10px" }}>
          💰 Withdraw Requests
        </h1>

        <div style={{ overflowX: "auto", background: "#fff", borderRadius: "15px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ background: "#0b7a46", color: "white" }}>
                <th style={styles.th}>User Email</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Payment Details (Note)</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                    <b>Loading Withdrawals...</b>
                  </td>
                </tr>
              ) : withdraws.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "50px", color: "#888" }}>
                    No pending withdraw requests found.
                  </td>
                </tr>
              ) : (
                withdraws.map((w) => (
                  <tr key={w._id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={styles.td}>{w.userEmail}</td>
                    <td style={{ ...styles.td, fontWeight: "bold", color: "#2d3436" }}>
                       {/* Backend-la dollar-ah store aagum, inga display panna money convert pannalaam */}
                       $ {Number(w.amount).toFixed(2)}
                    </td>
                    <td style={{ ...styles.td, color: "#636e72", fontSize: "13px" }}>{w.note || "No details"}</td>
                    <td style={{ ...styles.td, fontSize: "12px" }}>{new Date(w.createdAt).toLocaleString()}</td>
                    <td style={styles.td}>
                      <span style={{ 
                        padding: "6px 12px", 
                        borderRadius: "20px", 
                        background: w.status === "paid" ? "#e1fef0" : "#fff9db",
                        color: w.status === "paid" ? "#0b7a46" : "#f59f00",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textTransform: "uppercase"
                      }}>
                        {w.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {w.status === "pending" ? (
                        <button
                          onClick={() => approveWithdraw(w._id)}
                          style={styles.btnApprove}
                          onMouseOver={(e) => e.target.style.background = "#096339"}
                          onMouseOut={(e) => e.target.style.background = "#0b7a46"}
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span style={{ color: "#0b7a46", fontWeight: "bold", fontSize: "14px" }}>✅ Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  th: { padding: "18px 15px", textAlign: "left", fontSize: "14px", fontWeight: "600" },
  td: { padding: "15px", fontSize: "14px", color: "#2d3436" },
  btnApprove: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#0b7a46",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.3s ease"
  }
};