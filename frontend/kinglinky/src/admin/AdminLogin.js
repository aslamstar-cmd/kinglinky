// src/admin/AdminLogin.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await API_BASE.post("/api/admin/login", form);

      if (res.data.success) {
        localStorage.setItem("adminToken", res.data.token);
        navigate("/admin/dashboard");
      } else {
        setErrorMsg(res.data.message || "Login failed");
      }
    } catch (err) {
      console.log(err);
      setErrorMsg("Server error, try again!");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #0a0f24,#05192d,#001c24)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "rgba(255, 255, 255, 0.08)",
          padding: "30px 25px",
          borderRadius: 18,
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
          color: "#fff",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 25 }}>
          👑 Admin Login
        </h2>

        {errorMsg && (
          <div
            style={{
              background: "rgba(255, 70, 70, 0.15)",
              padding: 10,
              borderRadius: 8,
              marginBottom: 15,
              border: "1px solid rgba(255,70,70,0.4)",
              textAlign: "center",
              color: "#ff6666",
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label style={{ fontSize: 14 }}>Admin Name</label>
          <input
            type="text"
            name="username"
            value={form.username}   // FIXED
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <label style={{ fontSize: 14 }}>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 0",
              marginTop: 20,
              borderRadius: 10,
              border: "none",
              background: loading ? "#0c3b48a0" : "#00d0ff",
              color: "#00161f",
              fontSize: 17,
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0px 4px 12px rgba(0,255,255,0.35)",
              transition: "0.2s",
            }}
          >
            {loading ? "Checking..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  margin: "8px 0 15px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.1)",
  color: "#fff",
  outline: "none",
  fontSize: 15,
};