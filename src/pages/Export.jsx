import React, { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Export() {
  const [target, setTarget] = useState("summary"); // summary | dashboard
  const [format, setFormat] = useState("pdf"); // pdf | image
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const expandCanvases = () => {
    const canvases = document.querySelectorAll("canvas");
    canvases.forEach((c) => {
      c.dataset.originalHeight = c.style.height;
      c.style.height = "110%";
    });
  };

  const restoreCanvases = () => {
    const canvases = document.querySelectorAll("canvas");
    canvases.forEach((c) => {
      c.style.height = c.dataset.originalHeight || "";
      delete c.dataset.originalHeight;
    });
  };

  const handleExport = async (e) => {
    e.preventDefault(); // ✅ prevents any reload
    setError("");
    setLoading(true);

    const elementId =
      target === "dashboard" ? "dashboard-export" : "summary-export";

    try {
      // ✅ capture CURRENT DOM — no navigation
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Export content not found");
      }

      expandCanvases();

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      restoreCanvases();

      if (format === "image") {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${target}-export.png`;
        link.click();
      } else {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const w = pdf.internal.pageSize.getWidth();
        const h = (canvas.height * w) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, w, h);
        pdf.save(`${target}-export.pdf`);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to export selected content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "48px 32px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
        }}
      >
        <h2 style={{ marginBottom: "24px" }}>Export Report</h2>

        {/* Export Target */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontWeight: 600, marginBottom: "10px" }}>
            What do you want to export?
          </p>

          <label style={radioStyle}>
            <input
              type="radio"
              value="dashboard"
              checked={target === "dashboard"}
              onChange={() => setTarget("dashboard")}
            />
            Dashboard
          </label>

          <label style={radioStyle}>
            <input
              type="radio"
              value="summary"
              checked={target === "summary"}
              onChange={() => setTarget("summary")}
            />
            AI Summary Report
          </label>
        </div>

        {/* Export Format */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontWeight: 600, marginBottom: "10px" }}>
            Export format
          </p>

          <label style={radioStyle}>
            <input
              type="radio"
              value="pdf"
              checked={format === "pdf"}
              onChange={() => setFormat("pdf")}
            />
            PDF
          </label>

          <label style={radioStyle}>
            <input
              type="radio"
              value="image"
              checked={format === "image"}
              onChange={() => setFormat("image")}
            />
            Image (PNG)
          </label>
        </div>

        {/* Export Button */}
        <button
          type="button"
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
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Exporting..." : "Export"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "16px" }}>{error}</p>
        )}

        <p
          style={{
            marginTop: "20px",
            fontSize: "13px",
            opacity: 0.7,
          }}
        >
          Tip: Export captures exactly what you see on screen.
        </p>
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
