import React, { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Export() {
  const [target, setTarget] = useState("summary"); // summary | dashboard
  const [format, setFormat] = useState("pdf"); // pdf | image
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setError("");

    const elementId =
      target === "summary" ? "summary-export" : "dashboard-export";

    const element = document.getElementById(elementId);

    if (!element) {
      setError(
        `Unable to find ${
          target === "summary" ? "Summary" : "Dashboard"
        } content on screen`
      );
      return;
    }

    try {
      setLoading(true);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      if (format === "image") {
        const imgData = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imgData;
        link.download = `${target}-export.png`;
        link.click();
      }

      if (format === "pdf") {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

        if (imgHeight > pageHeight) {
          let heightLeft = imgHeight - pageHeight;

          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
        }

        pdf.save(`${target}-export.pdf`);
      }
    } catch (err) {
      console.error(err);
      setError("Export failed. Please try again.");
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
