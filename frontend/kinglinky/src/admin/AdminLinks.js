import React, { useEffect, useState } from "react";
import api from "../api";   // 👈 correct import

export default function AdminLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👇 useEffect async illa
  useEffect(() => {
    loadLinks();
  }, []);

  // 👇 async function separate-aa
  const loadLinks = async () => {
    try {
      const res = await api.get("/api/admin/links");
      setLinks(res.data || []);
    } catch (err) {
      console.error("ADMIN LINKS ERROR", err);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{ padding: 10 }}>Loading links...</p>;

  return (
    <div style={{ padding: 10 }}>
      <h2>🔗 All Shortened Links</h2>

      {links.length === 0 && <p>No links found</p>}

      {links.length > 0 && (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Short URL</th>
              <th>Email</th>
              <th>Clicks</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link, i) => (
              <tr key={i}>
                <td>{link.shortUrl}</td>
                <td>{link.email}</td>
                <td>{link.clicks}</td>
                <td>{new Date(link.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}