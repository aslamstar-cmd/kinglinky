import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState } from "react";

/* USER */
import Home from "./Home";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";

/* ADMIN */
import AdminLogin from "./admin/AdminLogin";
import AdminLayout from "./admin/AdminLayout";

import AdminDashboard from "./admin/AdminDashboard";
import AdminUsers from "./admin/AdminUsers";
import AdminLinks from "./admin/AdminLinks";
import AdminWithdraws from "./admin/AdminWithdraws";
import AdminSettings from "./admin/AdminSettings";

export default function App() {
  // 🔥 USER STATE
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({
    name: localStorage.getItem("userName") || "",
    email: localStorage.getItem("userEmail") || "",
  });

  return (
    <Router>
      <Routes>

        {/* USER ROUTES */}
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={<Login setIsLoggedIn={setIsLoggedIn} setUser={setUser} />}
        />

        <Route path="/signup" element={<Signup />} />

        <Route path="/dashboard" element={<Dashboard user={user} />} />

        {/* ⭐ ADMIN LOGIN */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ⭐ ADMIN PANEL LAYOUT + NESTED PAGES */}
        <Route path="/admin" element={<AdminLayout />}>

          {/* Nested Admin Pages */}
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="links" element={<AdminLinks />} />
          <Route path="withdraws" element={<AdminWithdraws />} />
          <Route path="settings" element={<AdminSettings />} />

        </Route>

      </Routes>
    </Router>
  );
}