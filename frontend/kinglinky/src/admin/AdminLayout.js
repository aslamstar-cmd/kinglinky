import { Outlet, NavLink } from "react-router-dom";
import "./admin.css";

export default function AdminLayout() {
  return (
    <div className="admin-wrapper">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo">👑 Kinglinky</h2>

        <nav className="admin-nav">
          <NavLink to="/admin/dashboard" className="admin-link">
            📊 Dashboard
          </NavLink>

          <NavLink to="/admin/users" className="admin-link">
            👤 Users
          </NavLink>

          <NavLink to="/admin/links" className="admin-link">
            🔗 Links
          </NavLink>

          <NavLink to="/admin/withdraws" className="admin-link">
            💸 Withdraws
          </NavLink>

          <NavLink to="/admin/settings" className="admin-link">
            ⚙️ Settings
          </NavLink>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}