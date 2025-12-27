import React, { useState } from "react";
import api from "./api.js";
import { useNavigate } from "react-router-dom";

function Login({ setIsLoggedIn, setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/api/login", {
        email,
        password,
      });

      // ✅ IMPORTANT CHECK
      if (res.data && res.data.user && res.data.token) {

        // ✅ SAVE TOKEN (MAIN FIX)
        localStorage.setItem("token", res.data.token);

        // optional – useful later
        localStorage.setItem("userName", res.data.user.name);
        localStorage.setItem("userEmail", res.data.user.email);

        // update app state
        setIsLoggedIn(true);
        setUser({
          name: res.data.user.name,
          email: res.data.user.email,
        });

        navigate("/dashboard");
      } else {
        alert("Invalid credentials ❌");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed ❌");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to right,#00e6d8,#b2fff5)",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          width: "320px",
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#00897b" }}>
          👑 Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <button type="submit" style={btnStyle}>
          Login
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "10px",
  border: "1px solid #ccc",
  fontSize: "15px",
};

const btnStyle = {
  background: "#04bdadff",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "10px",
  cursor: "pointer",
  width: "100%",
  fontSize: "16px",
};

export default Login;