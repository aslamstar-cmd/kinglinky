import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("https://kinglinky.onrender.com/api/admin/links")
      .then((res) => {
        setLinks(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("ADMIN LINKS ERROR", err);
        setLinks([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <p style={{ padding: 5}}>Loading links...</p>;

  return (
    <div style={{ padding: 10 }}>
      <h2>🔗 All Shortened Links</h2>

      {links.length === 0 && <p>No links found</p>}

      <table style={table}>
        <thead>
          <tr>
            <th>Short URL</th>
            <th>Email</th>
            <th>Clicks</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr key={l._id}>
              <td>{l.shortUrl}</td>
              <td>{l.ownerEmail}</td>
              <td>{l.clicks}</td>
              <td>{new Date(l.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const table = {
  width: "80%",
  borderCollapse: "collapse",
};