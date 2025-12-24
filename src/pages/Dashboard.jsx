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
import { TreemapController, TreemapElement } from "chartjs-chart-treemap";

import {
  DashboardThemeProvider,
  useDashboardTheme,
} from "../context/DashboardThemeContext";

import DashboardThemeSwitcher from "../components/dashboard/DashboardThemeSwitcher";

/* ───────────────── ChartJS setup ───────────────── */

ChartJS.register(
  TreemapController,
  TreemapElement,
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
  const handleExport = async () => {
    const element = document.getElementById("dashboard-export");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, w, h);
    pdf.save("dashboard.pdf");
  };

  return (
    <DashboardThemeProvider>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "56px" }}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <DashboardThemeSwitcher />

          {/* ✅ Export button SAME STYLE, BELOW theme */}
          <button onClick={handleExport} style={sideButton}>
            Export Dashboard
          </button>
        </div>

        {/* RIGHT COLUMN */}
        <DashboardCanvas />
      </div>
    </DashboardThemeProvider>
  );
}

/* ───────────────── Dashboard Canvas (UNCHANGED) ───────────────── */

function DashboardCanvas() {
  const { theme } = useDashboardTheme();

  const stored = sessionStorage.getItem("analysisResult");
  const data = stored ? JSON.parse(stored) : null;

  const rawName = sessionStorage.getItem("uploadedFileName") || "Dataset";
  const fileName = rawName.replace(/\.(csv|xlsx)$/i, "").toUpperCase();

  const numericStats = data?.profile?.numeric_stats || {};
  const categoricalCols = data?.profile?.column_summary?.categorical || [];
  const categoricalValues = data?.profile?.categorical_values || {};
  const numericColumns = Object.keys(numericStats);

  /* KPI */
  const kpis = numericColumns.slice(0, 5).map((col) => ({
    label: `${col} (Mean)`,
    value: numericStats[col].mean,
  }));

  /* Chart 1 */
  const [selectedColumn, setSelectedColumn] = useState("");
  const [chartType, setChartType] = useState("Histogram");

  useEffect(() => {
    if (!selectedColumn && numericColumns.length) {
      setSelectedColumn(numericColumns[0]);
    }
  }, [numericColumns, selectedColumn]);

  const histogram = useMemo(() => {
    const stats = numericStats[selectedColumn];
    if (!stats) return { labels: [], counts: [] };

    const bins = 10;
    const min = Math.floor(stats.min);
    const max = Math.ceil(stats.max);
    const step = Math.max(1, Math.ceil((max - min) / bins));

    return {
      labels: Array.from({ length: bins }, (_, i) => `${min + i * step}`),
      counts: Array.from({ length: bins }, () => Math.round(stats.mean)),
    };
  }, [numericStats, selectedColumn]);

  return (
    <div
      id="dashboard-export"
      style={{
        background: theme.colors.background,
        color: theme.colors.text,
        padding: "32px",
        borderRadius: "20px",
        minHeight: "80vh",
        flex: 1,
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
            <p style={{ opacity: 0.7 }}>{kpi.label}</p>
            <h3 style={{ color: theme.colors.accent }}>
              {kpi.value.toFixed(2)}
            </h3>
          </DashboardCard>
        ))}
      </div>

      {/* SAMPLE CHART (rest unchanged in your file) */}
      <DashboardCard height="280px">
        <Bar
          data={{
            labels: histogram.labels,
            datasets: [
              {
                data: histogram.counts,
                backgroundColor: theme.colors.accent,
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

const sideButton = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(0,0,0,0.25)",
  background: "white",
  cursor: "pointer",
  fontSize: "14px",
};
