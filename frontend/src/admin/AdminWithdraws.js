import React, { useEffect, useState } from "react";
import api from "../api.js";

export default function AdminWithdraws() {
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);

// FETCH WITHDRAWS LOGIC
const fetchWithdraws = async () => {
  setLoading(true); // Fetch start pannum munnadi loading true
  try {
    const res = await api.get("/api/withdraw/admin");
    
    // Console-la response check pannunga:
    console.log("API Response:", res.data);

    // Backend { success: true, data: [...] } nu anupuna:
    if (res.data && res.data.success) {
      setWithdraws(res.data.data || []);
    } else {
      console.warn("Backend success: false vandhuchu");
      setWithdraws([]);
    }
  } catch (err) {
    console.error("Error fetching withdraws:", err.response ? err.response.data : err.message);
    setWithdraws([]);
  } finally {
    setLoading(false); // Ellam mudinja appram loading false
  }
};

  useEffect(() => {
    fetchWithdraws();
  }, []);

  const approveWithdraw = async (id) => {
    const ok = window.confirm("Mark this withdraw as PAID?");
    if (!ok) return;

    try {
      await api.post(`/api/withdraw/approve/${id}`);
      fetchWithdraws(); // Refresh the list
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
            width: "100%", // Fix: changed from 100px to 100%
            borderCollapse: "collapse",
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <thead style={{ background: "#0b7a46", color: "white" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "left" }}>Email</th>
              <th style={{ padding: 12 }}>Amount</th>
              <th style={{ padding: 12 }}>Note</th>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Action</th>
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
                <tr key={w._id} style={{ borderBottom: "1px solid #eee", textAlign: "center" }}>
                  <td style={{ padding: 12, textAlign: "left" }}>{w.userEmail}</td>
                  <td style={{ padding: 12 }}>₹ {w.amount}</td>
                  <td style={{ padding: 12 }}>{w.note || "-"}</td>
                  <td style={{ padding: 12 }}>
                    {new Date(w.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: 4, 
                      background: w.status === "paid" ? "#dcfce7" : "#fef9c3",
                      color: w.status === "paid" ? "#166534" : "#854d0e",
                      fontSize: "12px",
                      textTransform: "capitalize"
                    }}>
                      {w.status}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
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