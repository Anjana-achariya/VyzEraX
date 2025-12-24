import React, { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import {
  SummarizeThemeProvider,
  useSummarizeTheme,
} from "../context/SummarizeThemeContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const LEFT_OFFSET = 20;

/* ───────────────── Main Wrapper ───────────────── */

export default function Summarize() {
  return (
    <SummarizeThemeProvider>
      <SummarizeContent />
    </SummarizeThemeProvider>
  );
}

/* ───────────────── Content ───────────────── */

function SummarizeContent() {
  const { theme, setMode, setAccent } = useSummarizeTheme();

  const [profile, setProfile] = useState(null);
  const [fileName, setFileName] = useState("");

  const [llmData, setLlmData] = useState(null);
  const [loadingLLM, setLoadingLLM] = useState(false);
  const [llmError, setLlmError] = useState("");

  /* ───── Load profile from session ───── */
  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    const name = sessionStorage.getItem("uploadedFileName");

    if (stored) setProfile(JSON.parse(stored).profile);
    if (name) setFileName(name);
  }, []);

  /* ───── Fetch AI insights ───── */
  useEffect(() => {
    if (!profile) return;

    const cached = sessionStorage.getItem("llmInsights");
    if (cached) {
      setLlmData(JSON.parse(cached));
      return;
    }

    const fetchInsights = async () => {
      try {
        setLoadingLLM(true);
        setLlmError("");

        const res = await fetch(`${API_BASE_URL}/api/llm-insights`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });

        if (!res.ok) throw new Error("LLM request failed");

        const data = await res.json();
        setLlmData(data);
        sessionStorage.setItem("llmInsights", JSON.stringify(data));
      } catch (err) {
        setLlmError("Failed to generate AI insights");
      } finally {
        setLoadingLLM(false);
      }
    };

    fetchInsights();
  }, [profile]);

  /* ───── Export Handler (LOCAL) ───── */
  const handleExport = async (format) => {
    const element = document.getElementById("summary-export");
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    if (format === "image") {
      const a = document.createElement("a");
      a.href = imgData;
      a.download = "summary.png";
      a.click();
    } else {
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, w, h);
      pdf.save("summary.pdf");
    }
  };

  /* ───── Regenerate Insights ───── */
  const regenerateInsights = async () => {
    if (!profile) return;

    try {
      setLoadingLLM(true);
      setLlmError("");
      setLlmData(null);

      sessionStorage.removeItem("llmInsights");

      const res = await fetch(`${API_BASE_URL}/api/llm-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error("LLM request failed");

      const data = await res.json();
      setLlmData(data);
      sessionStorage.setItem("llmInsights", JSON.stringify(data));
    } catch (err) {
      setLlmError("Failed to regenerate AI insights");
    } finally {
      setLoadingLLM(false);
    }
  };

  if (!profile) {
    return <div style={{ padding: 40 }}>No analysis found.</div>;
  }

  const {
    rows,
    columns,
    duplicates,
    missing_values,
    outliers,
    column_summary,
    numeric_stats,
  } = profile;

  const missingCount = Object.values(missing_values || {}).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div style={{ padding: "24px 32px 40px", minHeight: "100vh" }}>
      {/* ───── Theme + Export Controls ───── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "16px",
          marginBottom: "48px",
        }}
      >
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

          <button onClick={() => handleExport("pdf")} style={exportBtn}>
            Export PDF
          </button>
          <button onClick={() => handleExport("image")} style={exportBtn}>
            Export Image
          </button>
        </div>
      </div>

      {/* ───── Report Container ───── */}
      <div
        id="summary-export"
        style={{
          "--accent": theme.colors.accent,
          background: theme.colors.background,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: "20px",
          padding: "36px 48px 44px",
          maxWidth: "1500px",
          minWidth: "1100px",
          margin: "0 auto",
          boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
        }}
      >
        <h1 style={{ marginBottom: "6px", paddingLeft: LEFT_OFFSET }}>
          DATA SUMMARY REPORT
        </h1>

        <p style={{ opacity: 0.75, marginBottom: "22px", paddingLeft: LEFT_OFFSET }}>
          {fileName}
        </p>

        {/* Overview */}
        <Section title="Overview">
          <Insight label="Rows" value={rows.toLocaleString()} />
          <Insight label="Columns" value={columns} />
          <Insight label="Missing Values" value={missingCount.toLocaleString()} />
          <Insight label="Duplicates" value={duplicates} />
        </Section>

        {/* Executive Summary */}
        <Section title="Executive Summary">
          <Insight label="Numeric Columns" value={column_summary.numeric.length} />
          <Insight
            label="Categorical Columns"
            value={column_summary.categorical.length}
          />
          <Insight
            label="Datetime Columns"
            value={column_summary.datetime.length}
          />
          <Insight label="Text Columns" value={column_summary.text.length} />
        </Section>

        {/* Data Quality */}
        <Section title="Data Quality Assessment">
          <Insight
            label="Columns with Missing Data"
            value={Object.keys(missing_values).length}
          />
          <Insight
            label="Outlier Columns"
            value={Object.keys(outliers).length}
          />
        </Section>

        {/* EDA */}
        <Section title="Exploratory Data Analysis">
          {Object.keys(numeric_stats)
            .slice(0, 6)
            .map((col) => (
              <Insight
                key={col}
                label={col}
                value={`min ${numeric_stats[col].min}, max ${numeric_stats[col].max}`}
              />
            ))}
        </Section>

        {/* AI Insights */}
        {loadingLLM && (
          <Section title="AI Insights">
            <div style={{ paddingLeft: LEFT_OFFSET }}>
              Generating insights…
            </div>
          </Section>
        )}

        {llmData?.insights && (
          <Section title="AI Insights">
            {llmData.insights.map((text, i) => (
              <Insight key={i} label={`Insight ${i + 1}`} value={text} />
            ))}
          </Section>
        )}

        {llmData?.conclusion && (
          <Section title="Conclusion & Next Steps">
            <Insight label="Summary" value={llmData.conclusion.summary} />

            {llmData.conclusion.data_preparation.map((v, i) => (
              <Insight key={i} label="Data Preparation" value={v} />
            ))}

            {llmData.conclusion.modeling.map((v, i) => (
              <Insight key={i} label="Modeling Approach" value={v} />
            ))}
          </Section>
        )}

        {llmError && (
          <Section title="AI Insights">
            <div style={{ paddingLeft: LEFT_OFFSET, color: "red" }}>
              {llmError}
            </div>
          </Section>
        )}

        {/* Regenerate */}
        {llmData && (
          <div style={{ paddingLeft: LEFT_OFFSET, marginTop: "24px" }}>
            <button
              onClick={regenerateInsights}
              disabled={loadingLLM}
              style={{
                background: "transparent",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                padding: "6px 14px",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {loadingLLM ? "Regenerating…" : "Regenerate Insights"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────── Components ───────────────── */

function Section({ title, children }) {
  return (
    <div style={{ marginTop: "36px" }}>
      <h2
        style={{
          marginBottom: "14px",
          paddingLeft: LEFT_OFFSET,
          color: "var(--accent)",
        }}
      >
        {title}
      </h2>
      <div style={{ paddingLeft: LEFT_OFFSET }}>{children}</div>
    </div>
  );
}

function Insight({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 12px auto",
        marginBottom: "8px",
        fontSize: "14px",
      }}
    >
      <span style={{ opacity: 0.85 }}>{label}</span>
      <span style={{ opacity: 0.6, textAlign: "center" }}>:</span>
      <span style={{ fontWeight: 600, color: "var(--accent)" }}>
        {value}
      </span>
    </div>
  );
}

const selectStyle = {
  padding: "6px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.25)",
  background: "white",
  cursor: "pointer",
};

const exportBtn = {
  padding: "6px 14px",
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.3)",
  background: "white",
  cursor: "pointer",
  fontWeight: 400,
};

