import { useState } from "react";
import { analyseDataset } from "../api/analyse";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const navigate = useNavigate();

const handleAnalyse = async () => {
  if (!file) {
    setError("Please select a file first");
    return;
  }

  try {
    setError("");
    setLoading(true);

    console.log("⏳ Analysing dataset...");
    const result = await analyseDataset(file);
    console.log("✅ Analysis received:", result);

    if (!result?.profile) {
      throw new Error("Invalid analysis result");
    }

    const safeProfile = {
      rows: result.profile.rows,
      columns: result.profile.columns,
      duplicates: result.profile.duplicates,
      missing_values: result.profile.missing_values,
      outliers: result.profile.outliers,
      numeric_stats: result.profile.numeric_stats,
      column_summary: result.profile.column_summary,
      categorical_values: result.profile.categorical_values,
    };

    // ✅ Save analysis
    sessionStorage.setItem(
      "analysisResult",
      JSON.stringify({ profile: safeProfile })
    );
    sessionStorage.setItem("uploadedFileName", file.name);

    // ✅ Clear old LLM cache
    sessionStorage.removeItem("llmInsights");

    console.log("➡️ Navigating to /statistics");
    navigate("/statistics");

  } catch (err) {
    console.error("❌ Analyse failed:", err);
    setError("Failed to analyse dataset");
  } finally {
    setLoading(false);
  }
};


  return (
    <div style={{ width: "100%", maxWidth: "700px", textAlign: "center" }}>
      <h1 style={{ fontSize: "34px", marginBottom: "12px" }}>
        Welcome to VyzEraX
      </h1>

      <p style={{ color: "#555", marginBottom: "36px" }}>
        Upload your dataset and instantly get insights, dashboards, and reports.
      </p>

      <div
        style={{
          border: "2px dashed #ff8fab",
          padding: "44px",
          borderRadius: "16px",
        }}
      >
        <p style={{ marginBottom: "18px", fontWeight: "500" }}>
          Upload CSV or Excel file
        </p>

        <input
          type="file"
          accept=".csv,.xlsx"
          disabled={loading}
          onChange={(e) => setFile(e.target.files[0])}
        />

        {error && (
          <p style={{ color: "red", marginTop: "12px" }}>{error}</p>
        )}

        <div style={{ marginTop: "30px" }}>
          <button
            onClick={handleAnalyse}
            disabled={loading || !file}
            style={{
              background: "#ff8fab",
              color: "white",
              padding: "12px 30px",
              borderRadius: "10px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "15px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Analysing..." : "Analyse Dataset"}
          </button>
        </div>
      </div>
    </div>
  );
}
