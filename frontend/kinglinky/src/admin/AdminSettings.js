import React, { useEffect, useState } from "react";
import axios from "axios";
import "./adminSettings.css";

const API = "https://kinglinky.onrender.com/api/admin/settings";

export default function AdminSettings() {
  const [form, setForm] = useState({
    siteName: "",
    cpm: "",
    minWithdraw: "",
    currency: "USD",
  });

  const token = localStorage.getItem("adminToken");

  const headers = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line
  }, []);

  const loadSettings = async () => {
    try {
      const res = await axios.get(API, headers);
      setForm(res.data);
    } catch (err) {
      console.error("LOAD SETTINGS ERROR", err);
    }
  };

  const saveSettings = async () => {
    try {
      await axios.post(API, form, headers);
      alert("✅ Settings saved");
    } catch (err) {
      alert("❌ Failed to save");
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h2>⚙️ Admin Settings</h2>

        <div className="form-group">
          <label>Site Name</label>
          <input
            type="text"
            value={form.siteName}
            onChange={(e) =>
              setForm({ ...form, siteName: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label>CPM ($)</label>
          <input
            type="number"
            value={form.cpm}
            onChange={(e) =>
              setForm({ ...form, cpm: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label>Minimum Withdraw ($)</label>
          <input
            type="number"
            value={form.minWithdraw}
            onChange={(e) =>
              setForm({ ...form, minWithdraw: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label>Currency</label>
          <select
            value={form.currency}
            onChange={(e) =>
              setForm({ ...form, currency: e.target.value })
            }
          >
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </div>

        <button className="save-btn" onClick={saveSettings}>
          💾 Save Settings
        </button>
      </div>
    </div>
  );
}