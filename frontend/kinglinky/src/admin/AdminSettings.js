import React, { useEffect, useState } from "react";
import "./adminSettings.css";
import api from "../api.js"

export default function AdminSettings() {
  const [form, setForm] = useState({
    siteName: "",
    cpm: "",
    minWithdraw: "",
    currency: "USD",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get("/api/admin/settings");
      setForm(res.data);
    } catch (err) {
      console.error("LOAD SETTINGS ERROR", err);
    }
  };

  const saveSettings = async () => {
    try {
      await API_BASE.post("/api/admin/settings", form);
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