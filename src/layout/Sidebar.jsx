// import { NavLink } from "react-router-dom";

// export default function Sidebar() {
//   return (
//     <div className="sidebar">
//       <NavLink to="/">Home</NavLink>
//       <NavLink to="/dashboard">Dashboard</NavLink>
//       <NavLink to="/summarize">Summarize</NavLink>
//       <NavLink to="/export">Export</NavLink>
//     </div>
//   );
// }
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside
      style={{
        width: "220px",
        background: "#f8fafc",
        padding: "20px",
        borderRight: "1px solid #e5e7eb",
      }}
    >
      <nav>
        <SidebarItem to="/" label="Home" />
        <SidebarItem to="/statistics" label="Statistics" />

        <SidebarItem to="/dashboard" label="Dashboard" />

        <SidebarItem to="/summarize" label="Summarize" />
        <SidebarItem to="/export" label="Export" />
      </nav>
    </aside>
  );
}

function SidebarItem({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "block",
        padding: "10px 12px",
        marginBottom: "6px",
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: "500",
        color: isActive ? "#fff" : "#111",
        background: isActive ? "#ff8fab" : "transparent",
      })}
    >
      {label}
    </NavLink>
  );
}
