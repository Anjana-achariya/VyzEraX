import React, { useState } from "react";

export default function Export() {
  const [target, setTarget] = useState("summary");
  const [format, setFormat] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExport = () => {
    setError("");
    setLoading(true);

    // 🔥 tell the active page to export itself
    window.dispatchEvent(
      new CustomEvent("APP_EXPORT", {
        detail: { target, format },
      })
    );

    // small UX delay
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div style={{ padding: "48px 32px", display: "flex", justifyContent: "center" }}>
      <div style={{
        width: "100%",
        maxWidth: "520px",
        background: "#fff",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
      }}>
        <h2 style={{ marginBottom: "24px" }}>Export Report</h2>

        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontWeight: 600 }}>What do you want to export?</p>

          <label style={radioStyle}>
            <input
              type="radio"
              checked={target === "dashboard"}
              onChange={() => setTarget("dashboard")}
            />
            Dashboard
          </label>

          <label style={radioStyle}>
            <input
              type="radio"
              checked={target === "summary"}
              onChange={() => setTarget("summary")}
            />
            AI Summary Report
          </label>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontWeight: 600 }}>Export format</p>

          <label style={radioStyle}>
            <input
              type="radio"
              checked={format === "pdf"}
              onChange={() => setFormat("pdf")}
            />
            PDF
          </label>

          <label style={radioStyle}>
            <input
              type="radio"
              checked={format === "image"}
              onChange={() => setFormat("image")}
            />
            Image (PNG)
          </label>
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            background: "#ff8fab",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Exporting..." : "Export"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}

const radioStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "8px",
};
