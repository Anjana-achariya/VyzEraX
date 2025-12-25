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

/* ───────────────── Export UI styles ───────────────── */

const pillWrapperStyle = {
  background: "#ff8fab",
  padding: "12px 16px",
  borderRadius: "16px",
  display: "flex",
  gap: "12px",
  alignItems: "center",
  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
};

const pillButtonStyle = {
  height: "32px",
  padding: "0 18px",
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.25)",
  background: "white",
  fontSize: "14px",
  cursor: "pointer",
  fontWeight: 500,
};

/* ───────────────── Main Wrapper ───────────────── */

export default function Dashboard() {
  const handleExport = async (type) => {
    const element = document.getElementById("dashboard-export");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const img = canvas.toDataURL("image/png");

    if (type === "image") {
      const a = document.createElement("a");
      a.href = img;
      a.download = "dashboard.png";
      a.click();
    } else {
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, w, h);
      pdf.save("dashboard.pdf");
    }
  };

  return (
    <DashboardThemeProvider>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "56px" }}>
        {/* LEFT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <DashboardThemeSwitcher />

          {/* EXPORT BUTTONS */}
          <div style={{ marginLeft: "24px", marginTop: "8px" }}>
            <div style={pillWrapperStyle}>
              <button
                style={pillButtonStyle}
                onClick={() => handleExport("pdf")}
              >
                Export PDF
              </button>

              <button
                style={pillButtonStyle}
                onClick={() => handleExport("image")}
              >
                Export Image
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <DashboardCanvas />
      </div>
    </DashboardThemeProvider>
  );
}

/* ───────────────── Dashboard Canvas ───────────────── */

function DashboardCanvas() {
  const { theme } = useDashboardTheme();

  const stored = sessionStorage.getItem("analysisResult");
  const data = stored ? JSON.parse(stored) : null;

  const rawName =
    sessionStorage.getItem("uploadedFileName") || "Dataset";

  const fileName = rawName.replace(/\.(csv|xlsx)$/i, "").toUpperCase();

  const numericStats = data?.profile?.numeric_stats || {};
  const categoricalCols =
    data?.profile?.column_summary?.categorical || [];
  const categoricalValues =
    data?.profile?.categorical_values || {};

  const numericColumns = Object.keys(numericStats);

  /* ─── STATES ─── */
  const [selectedColumn, setSelectedColumn] = useState("");
  const [chartType, setChartType] = useState("Histogram");

  const [catColumn, setCatColumn] = useState("");
  const [catChartType, setCatChartType] = useState("Bar");

  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [scatterType, setScatterType] = useState("Scatter");

  const [timeX, setTimeX] = useState("");
  const [timeY, setTimeY] = useState("");
  const [timeChartType, setTimeChartType] = useState("Line");

  /* ─── EFFECTS ─── */
  useEffect(() => {
    if (!selectedColumn && numericColumns.length > 0) {
      setSelectedColumn(numericColumns[0]);
    }
  }, [numericColumns, selectedColumn]);

  useEffect(() => {
    if (!catColumn && categoricalCols.length > 0) {
      setCatColumn(categoricalCols[0]);
    }
  }, [categoricalCols, catColumn]);

  useEffect(() => {
    if (numericColumns.length >= 2) {
      if (!xAxis) setXAxis(numericColumns[0]);
      if (!yAxis) setYAxis(numericColumns[1]);
      if (!timeX) setTimeX(numericColumns[0]);
      if (!timeY) setTimeY(numericColumns[1]);
    }
  }, [numericColumns, xAxis, yAxis, timeX, timeY]);

  /* ─── KPIs ─── */
  const kpis = numericColumns.slice(0, 5).map((col) => ({
    label: `${col} (Mean)`,
    value: numericStats[col].mean,
  }));

  /* ─── Histogram ─── */
  const histogram = useMemo(() => {
    const stats = numericStats[selectedColumn];
    if (!stats) return { labels: [], counts: [] };

    const bins = 10;
    const min = Math.floor(stats.min);
    const max = Math.ceil(stats.max);
    const step = Math.max(1, Math.ceil((max - min) / bins));

    const labels = [];
    const counts = [];

    for (let i = 0; i < bins; i++) {
      const start = min + i * step;
      const end = start + step;
      labels.push(`${start}–${end}`);
      counts.push(Math.max(1, Math.round(stats.mean / (i + 1))));
    }

    return { labels, counts };
  }, [numericStats, selectedColumn]);

  /* ─── Category distribution ─── */
  const categoryDistribution = useMemo(() => {
    const obj = categoricalValues[catColumn];
    if (!obj) return { labels: [], counts: [] };

    const entries = Object.entries(obj);
    return {
      labels: entries.map(([k]) => k),
      counts: entries.map(([, v]) => v),
    };
  }, [categoricalValues, catColumn]);

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
            <p style={{ fontSize: "14px", opacity: 0.7 }}>
              {kpi.label}
            </p>
            <h3 style={{ fontSize: "22px", marginTop: "8px" }}>
              {formatValue(kpi.value)}
            </h3>
          </DashboardCard>
        ))}
      </div>

      {/* CHART GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <DashboardCard height="280px">
          <Bar
            data={{
              labels: histogram.labels,
              datasets: [{ data: histogram.counts }],
            }}
            options={{ responsive: true }}
          />
        </DashboardCard>

        <DashboardCard height="280px">
          <Pie
            data={{
              labels: categoryDistribution.labels,
              datasets: [{ data: categoryDistribution.counts }],
            }}
            options={{ responsive: true }}
          />
        </DashboardCard>
      </div>
    </div>
  );
}

/* ───────────────── Helpers ───────────────── */

function DashboardCard({ children, height }) {
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

function formatValue(v) {
  if (typeof v !== "number") return v;
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(2);
}
