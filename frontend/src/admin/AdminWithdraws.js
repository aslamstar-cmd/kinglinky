import React, { useEffect, useState } from "react";
import api from "../api.js";

export default function AdminWithdraws() {
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH WITHDRAWS LOGIC
  const fetchWithdraws = async () => {
    setLoading(true);
    try {
      // 1. LocalStorage-la irundhu token edukkavum
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

      // 2. GET request headers-oda anupavum
      const res = await api.get("/api/withdraw/admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API Response:", res.data);

      if (res.data && res.data.success) {
        setWithdraws(res.data.data || []);
      } else {
        console.warn("Backend success: false vandhuchu");
        setWithdraws([]);
      }
    } catch (err) {
      // 401 Error vandha console-la clear-ah kaatum
      console.error("Error fetching withdraws:", err.response ? err.response.data : err.message);
      setWithdraws([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  const approveWithdraw = async (id) => {
    const ok = window.confirm("Mark this withdraw as PAID?");
    if (!ok) return;

    try {
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      
      await api.post(`/api/withdraw/approve/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      alert("Status updated to PAID!");
      fetchWithdraws(); // Refresh the list
    } catch (err) {
      console.error("Error approving withdraw:", err);
      alert("Approve failed: " + (err.response?.data?.message || "Unknown error"));
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "16px", fontSize: "24px", color: "#333" }}>Withdraw Requests</h1>

      <div style={{ overflowX: "auto", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <table
          style={{
            width: "100%", 
            borderCollapse: "collapse",
            minWidth: "600px"
          }}
        >
          <thead style={{ background: "#0b7a46", color: "white" }}>
            <tr>
              <th style={{ padding: "15px", textAlign: "left" }}>Email</th>
              <th style={{ padding: "15px" }}>Amount</th>
              <th style={{ padding: "15px" }}>Note</th>
              <th style={{ padding: "15px" }}>Date</th>
              <th style={{ padding: "15px" }}>Status</th>
              <th style={{ padding: "15px" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  <div className="spinner">Loading Withdrawals...</div>
                </td>
              </tr>
            ) : withdraws.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "50px", color: "#888" }}>
                  No withdraw requests found.
                </td>
              </tr>
            ) : (
              withdraws.map((w) => (
                <tr key={w._id} style={{ borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                  <td style={{ padding: "15px", textAlign: "left", fontSize: "14px" }}>{w.userEmail}</td>
                  <td style={{ padding: "15px", fontWeight: "bold" }}>₹ {w.amount}</td>
                  <td style={{ padding: "15px", color: "#666" }}>{w.note || "-"}</td>
                  <td style={{ padding: "15px", fontSize: "13px" }}>
                    {new Date(w.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ 
                      padding: "5px 10px", 
                      borderRadius: "20px", 
                      background: w.status === "paid" ? "#dcfce7" : "#fef9c3",
                      color: w.status === "paid" ? "#166534" : "#854d0e",
                      fontSize: "12px",
                      fontWeight: "600",
                      textTransform: "capitalize"
                    }}>
                      {w.status}
                    </span>
                  </td>
                  <td style={{ padding: "15px" }}>
                    {w.status === "pending" || w.status === "Processing" ? (
                      <button
                        onClick={() => approveWithdraw(w._id)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "none",
                          background: "#0b7a46",
                          color: "#fff",
                          cursor: "pointer",
                          fontWeight: "600",
                          transition: "0.2s"
                        }}
                        onMouseOver={(e) => e.target.style.background = "#096339"}
                        onMouseOut={(e) => e.target.style.background = "#0b7a46"}
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span style={{ color: "#0b7a46", fontWeight: "bold" }}>✅ Paid</span>
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