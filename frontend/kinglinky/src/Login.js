import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login({ setIsLoggedIn, setUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });

      if (res.data && res.data.user) {
        // Save local
        localStorage.setItem("userName", res.data.user.name);
        localStorage.setItem("userEmail", res.data.user.email);

        // App.js update
        setIsLoggedIn(true);
        setUser({
          name: res.data.user.name,
          email: res.data.user.email,
        });

        alert("Login Successful 👑");
        navigate("/dashboard");
      } else {
        alert("Invalid Credentials ❌");
      }
    } catch (err) {
      alert("Login failed ❌");
      console.log(err);
    }
  };

  return (
    <div style={{ height:"100vh",display:"flex",justifyContent:"center",alignItems:"center",
      background:"linear-gradient(to right,#00e6d8,#b2fff5)" }}>

      <form onSubmit={handleLogin} style={{
        background:"white",padding:"40px",borderRadius:"15px",
        boxShadow:"0 4px 12px rgba(0,0,0,0.2)",width:"320px"
      }}>
        <h2 style={{ marginBottom: "20px", color: "#00897b" }}>👑 Login</h2>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />

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

        <button type="submit" style={btnStyle}>Login</button>
      </form>

    </div>
  );
}

const inputStyle = {
  width:"100%",
  padding:"10px",
  marginBottom:"15px",
  borderRadius:"10px",
  border:"1px solid #ccc",
  fontSize:"15px"
};

const btnStyle = {
  background:"#04bdadff",
  color:"white",
  border:"none",
  padding:"10px 20px",
  borderRadius:"10px",
  cursor:"pointer",
  width:"100%",
  fontSize:"16px",
};

export default Login;

