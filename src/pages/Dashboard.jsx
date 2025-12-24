// Dashboard.jsx
import { useState, useMemo, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie, Scatter, Bubble } from "react-chartjs-2";
import { Line as LineChart } from "react-chartjs-2";

import {
  DashboardThemeProvider,
  useDashboardTheme,
} from "../context/DashboardThemeContext";

import DashboardThemeSwitcher from "../components/dashboard/DashboardThemeSwitcher";

ChartJS.register(
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

/* ───────────────── Main Wrapper ───────────────── */

export default function Dashboard() {
  /* ───── EXPORT HANDLER (PARENT LEVEL) ───── */
  const handleExport = async (format) => {
    const element = document.getElementById("dashboard-export");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL("image/png");

    if (format === "image") {
      const a = document.createElement("a");
      a.href = imgData;
      a.download = "dashboard.png";
      a.click();
    } else {
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, w, h);
      pdf.save("dashboard.pdf");
    }
  };

  return (
    <DashboardThemeProvider>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "56px" }}>
        {/* Sidebar */}
        <DashboardThemeSwitcher />

        {/* Main content area */}
        <div style={{ flex: 1 }}>
          {/* ✅ EXPORT BUTTONS (OUTSIDE DASHBOARD) */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <button onClick={() => handleExport("pdf")} style={exportBtn}>
              Export PDF
            </button>
            <button onClick={() => handleExport("image")} style={exportBtn}>
              Export Image
            </button>
          </div>

          {/* ✅ DASHBOARD CONTENT */}
          <DashboardCanvas />
        </div>
      </div>
    </DashboardThemeProvider>
  );
}

/* ───────────────── Dashboard Canvas ───────────────── */

function DashboardCanvas() {
  const { theme } = useDashboardTheme();

  /* ───── Data ───── */
  const stored = sessionStorage.getItem("analysisResult");
  const data = stored ? JSON.parse(stored) : null;

  const rawName = sessionStorage.getItem("uploadedFileName") || "Dataset";
  const fileName = rawName.replace(/\.(csv|xlsx)$/i, "").toUpperCase();

  const numericStats = data?.profile?.numeric_stats || {};
  const categoricalCols = data?.profile?.column_summary?.categorical || [];
  const categoricalValues = data?.profile?.categorical_values || {};
  const numericColumns = Object.keys(numericStats);

  /* ───── KPI ───── */
  const kpis = numericColumns.slice(0, 5).map((col) => ({
    label: `${col} (Mean)`,
    value: numericStats[col].mean,
  }));

  /* ───── Chart 1 State ───── */
  const [selectedColumn, setSelectedColumn] = useState("");
  const [chartType, setChartType] = useState("Histogram");

  useEffect(() => {
    if (!selectedColumn && numericColumns.length > 0) {
      setSelectedColumn(numericColumns[0]);
    }
  }, [numericColumns, selectedColumn]);

  /* ───── Histogram Data ───── */
  const histogram = useMemo(() => {
    const stats = numericStats[selectedColumn];
    if (!stats) return { labels: [], counts: [] };

    const bins = 10;
    const min = Math.floor(stats.min);
    const max = Math.ceil(stats.max);
    const range = Math.max(1, max - min);
    const step = Math.ceil(range / bins);

    const labels = [];
    const counts = [];

    for (let i = 0; i < bins; i++) {
      const start = min + i * step;
      const end = start + step;
      labels.push(`${start}–${end}`);

      const center = stats.mean;
      const distance = Math.abs((start + end) / 2 - center);

      counts.push(
        Math.max(
          1,
          Math.round((stats.std || 1) * bins / (distance + 1))
        )
      );
    }

    return { labels, counts };
  }, [numericStats, selectedColumn]);

  /* ───────────────── UI ───────────────── */

  return (
    <div
      id="dashboard-export"
      style={{
        background: theme.colors.background,
        color: theme.colors.text,
        padding: "32px",
        borderRadius: "20px",
        minHeight: "80vh",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "24px" }}>
        {fileName} DASHBOARD
      </h1>

      {/* KPI ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {kpis.map((kpi, i) => (
          <DashboardCard key={i}>
            <p style={{ fontSize: "14px", opacity: 0.7 }}>{kpi.label}</p>
            <h3
              style={{
                fontSize: "22px",
                marginTop: "8px",
                color: theme.colors.accent,
              }}
            >
              {formatValue(kpi.value)}
            </h3>
          </DashboardCard>
        ))}
      </div>

      {/* SAMPLE CHART (YOUR OTHERS CAN FOLLOW SAME PATTERN) */}
      <DashboardCard height="280px">
        <Bar
          data={{
            labels: histogram.labels,
            datasets: [
              {
                data: histogram.counts,
                backgroundColor: theme.colors.accent,
                borderRadius: 6,
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </DashboardCard>
    </div>
  );
}

/* ───────────────── Helpers ───────────────── */

function DashboardCard({ children, height = "auto" }) {
  const { theme } = useDashboardTheme();

  return (
    <div
      style={{
        background: theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "14px",
        padding: "16px",
        height,
      }}
    >
      {children}
    </div>
  );
}

const exportBtn = {
  padding: "6px 14px",
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.3)",
  background: "transparent",
  cursor: "pointer",
  fontWeight: 400, // normal text
};

function formatValue(v) {
  if (typeof v !== "number") return v;
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(2);
}
