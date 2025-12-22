import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API = "http://localhost:5000";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function signup() {
    if (!name || !email || !password) {
      alert("All fields required");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API}/api/signup`, {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (res.data?.success) {
        alert("Signup successful 🎉");
        navigate("/login");
      } else {
        alert("Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Signup failed. Try again!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h2 style={title}>👑 Signup for Kinglinky</h2>

        <input
          style={input}
          placeholder="Username"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          style={input}
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={button} onClick={signup} disabled={loading}>
          {loading ? "Creating..." : "Signup"}
        </button>

        <p style={text}>
          Already have an account?{" "}
          <Link to="/login" style={link}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #00e5c0, #b2fef7)",
};

const card = {
  width: 320,
  background: "#ffffff",
  padding: "25px 22px",
  borderRadius: 14,
  boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
  display: "flex",
  flexDirection: "column",
};

const title = {
  textAlign: "center",
  marginBottom: 18,
  color: "#00897b",
};

const input = {
  padding: "10px 12px",
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #cfd8dc",
  fontSize: 14,
  outline: "none",
};

const button = {
  marginTop: 5,
  padding: "10px",
  borderRadius: 8,
  border: "none",
  background: "#009688",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const text = {
  marginTop: 15,
  textAlign: "center",
  fontSize: 13,
};

const link = {
  color: "#009688",
  textDecoration: "none",
  fontWeight: "bold",
};
