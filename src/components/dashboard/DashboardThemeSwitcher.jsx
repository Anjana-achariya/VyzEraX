import { useDashboardTheme } from "../../context/DashboardThemeContext";

export default function DashboardThemeSwitcher() {
  const { theme, setMode, setAccent } = useDashboardTheme();

  return (
    <div style={{ marginLeft: "24px", marginTop: "8px" }}>
      <div
        style={{
          background: "#ff8fab",
          padding: "12px 16px",
          borderRadius: "16px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        <select
          value={theme.mode}
          onChange={(e) => setMode(e.target.value)}
          style={selectStyle}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>

        <select
          value={theme.accent}
          onChange={(e) => setAccent(e.target.value)}
          style={selectStyle}
        >
          <option value="coral-pink">Coral Pink</option>
          <option value="coral-yellow">Coral Yellow</option>
          <option value="coral-violet">Coral Violet</option>
          <option value="coral-blue">Coral Blue</option>
        </select>
      </div>
    </div>
  );
}

// const selectStyle = {
//   padding: "6px 10px",
//   borderRadius: "8px",
//   border: "1px solid rgba(0,0,0,0.25)",
//   fontSize: "14px",
//   cursor: "pointer",
//   background: "white",
// };
const selectStyle = {
  width: "140px",          // ⭐ FIXED WIDTH
  height: "32px",
  padding: "6px 16px",
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.25)",
  fontSize: "14px",
  cursor: "pointer",
  background: "white",
  whiteSpace: "nowrap",
};


