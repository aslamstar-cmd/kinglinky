import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Component load aagum pothu data-va edukkirom
  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      // Unga API endpoint correct-ah irukkunu confirm pannikonga
      const res = await api.get("/api/admin/links");
      setLinks(res.data || []);
    } catch (err) {
      console.error("ADMIN LINKS ERROR", err);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete function (Venaam endral thavirkkalam, aana backend-la delete iruppathaal ithu help-ah irukkum)
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this link?")) {
      try {
        await api.delete(`/api/admin/links/${id}`);
        setLinks(links.filter((link) => link._id !== id));
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  if (loading) return <p style={{ padding: 20, textAlign: 'center' }}>Loading links...</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: "20px" }}>🔗 All Shortened Links</h2>

      {links.length === 0 ? (
        <p>No links found in the database.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table 
            border="1" 
            cellPadding="10" 
            style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              textAlign: "left",
              fontSize: "14px"
            }}
          >
            <thead>
              <tr style={{ background: "#2ecc71", color: "white" }}>
                <th>Short URL</th>
                <th>User Email</th>
                <th>Clicks</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link._id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ color: "#2980b9", wordBreak: "break-all" }}>
                    {link.shortUrl}
                  </td>
                  {/* Backend mapping-ai poruthu email or ownerEmail-ai edukkirom */}
                  <td style={{ fontWeight: "bold" }}>
                    {link.email || link.ownerEmail || "No Email Found"}
                  </td>
                  <td style={{ textAlign: "center" }}>{link.clicks}</td>
                  <td>
                    {link.createdAt 
                      ? new Date(link.createdAt).toLocaleDateString() 
                      : "N/A"}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(link._id)}
                      style={{ 
                        backgroundColor: "#e74c3c", 
                        color: "white", 
                        border: "none", 
                        padding: "5px 10px", 
                        cursor: "pointer",
                        borderRadius: "4px"
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}