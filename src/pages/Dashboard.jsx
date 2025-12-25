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

const pillSelectStyle = {
  width: "140px",
  height: "32px",
  padding: "6px 16px",
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.25)",
  background: "white",
  fontSize: "14px",
  cursor: "pointer",
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

          {/* EXPORT */}
          <div style={{ marginLeft: "24px", marginTop: "8px" }}>
            <div style={pillWrapperStyle}>
              <select
                style={pillSelectStyle}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleExport(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="" disabled>Export PDF</option>
                <option value="pdf">Export PDF</option>
              </select>

              <select
                style={pillSelectStyle}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleExport(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="" disabled>Export Image</option>
                <option value="image">Export Image</option>
              </select>
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

  /* DATA */
  const stored = sessionStorage.getItem("analysisResult");
  const data = stored ? JSON.parse(stored) : null;

  const rawName = sessionStorage.getItem("uploadedFileName") || "Dataset";
  const fileName = rawName.replace(/\.(csv|xlsx)$/i, "").toUpperCase();

  const numericStats = data?.profile?.numeric_stats || {};
  const categoricalCols = data?.profile?.column_summary?.categorical || [];
  const categoricalValues = data?.profile?.categorical_values || {};
  const numericColumns = Object.keys(numericStats);

  /* STATES */
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

  /* EFFECTS */
  useEffect(() => {
    if (!selectedColumn && numericColumns.length > 0)
      setSelectedColumn(numericColumns[0]);
  }, [numericColumns, selectedColumn]);

  useEffect(() => {
    if (!catColumn && categoricalCols.length > 0)
      setCatColumn(categoricalCols[0]);
  }, [categoricalCols, catColumn]);

  useEffect(() => {
    if (numericColumns.length >= 2) {
      if (!xAxis) setXAxis(numericColumns[0]);
      if (!yAxis) setYAxis(numericColumns[1]);
      if (!timeX) setTimeX(numericColumns[0]);
      if (!timeY) setTimeY(numericColumns[1]);
    }
  }, [numericColumns, xAxis, yAxis, timeX, timeY]);

  /* KPI */
  const kpis = numericColumns.slice(0, 5).map((col) => ({
    label: `${col} (Mean)`,
    value: numericStats[col].mean,
  }));

  /* HISTOGRAM */
  const histogram = useMemo(() => {
    const stats = numericStats[selectedColumn];
    if (!stats) return { labels: [], counts: [] };

    const bins = 10;
    const min = Math.floor(stats.min);
    const max = Math.ceil(stats.max);
    const step = Math.ceil(Math.max(1, max - min) / bins);

    const labels = [];
    const counts = [];

    for (let i = 0; i < bins; i++) {
      labels.push(`${min + i * step}–${min + (i + 1) * step}`);
      counts.push(Math.max(1, Math.round(stats.std || 1)));
    }

    return { labels, counts };
  }, [numericStats, selectedColumn]);

  /* CATEGORY */
  const categoryDistribution = useMemo(() => {
    const obj = categoricalValues[catColumn];
    if (!obj) return { labels: [], counts: [] };
    const entries = Object.entries(obj);
    return {
      labels: entries.map(([k]) => k),
      counts: entries.map(([, v]) => v),
    };
  }, [categoricalValues, catColumn]);

  /* SCATTER */
  const scatterData = useMemo(() => {
    if (!xAxis || !yAxis) return [];
    const x = numericStats[xAxis];
    const y = numericStats[yAxis];
    if (!x || !y) return [];

    return Array.from({ length: 30 }, (_, i) => ({
      x: x.min + (i / 29) * (x.max - x.min),
      y: y.min + (i / 29) * (y.max - y.min),
      r: scatterType === "Bubble" ? 6 + (i % 5) * 2 : undefined,
    }));
  }, [numericStats, xAxis, yAxis, scatterType]);

  /* TREND */
  const timelineData = useMemo(() => {
    if (!timeX || !timeY) return [];
    const x = numericStats[timeX];
    const y = numericStats[timeY];
    if (!x || !y) return [];

    return Array.from({ length: 12 }, (_, i) => ({
      x: Math.round(x.min + (i / 11) * (x.max - x.min)),
      y: y.min + (i / 11) * (y.max - y.min),
    }));
  }, [numericStats, timeX, timeY]);

  /* SCALE FIX */
  return (
    <div style={{ transform: "scale(0.9)", transformOrigin: "top left", width: "111%" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {kpis.map((k, i) => (
            <DashboardCard key={i}>
              <p style={{ opacity: 0.7 }}>{k.label}</p>
              <h3 style={{ color: theme.colors.accent }}>{formatValue(k.value)}</h3>
            </DashboardCard>
          ))}
        </div>

        {/* CHART GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <DashboardCard><Bar data={{ labels: histogram.labels, datasets: [{ data: histogram.counts, backgroundColor: theme.colors.accent }] }} /></DashboardCard>
          <DashboardCard><Pie data={{ labels: categoryDistribution.labels, datasets: [{ data: categoryDistribution.counts }] }} /></DashboardCard>
          <DashboardCard><Scatter data={{ datasets: [{ data: scatterData, backgroundColor: theme.colors.accent }] }} /></DashboardCard>
          <DashboardCard><LineChart data={{ labels: timelineData.map(p => p.x), datasets: [{ data: timelineData.map(p => p.y), borderColor: theme.colors.accent }] }} /></DashboardCard>
        </div>
      </div>
    </div>
  );
}

/* HELPERS */

function DashboardCard({ children }) {
  const { theme } = useDashboardTheme();
  return (
    <div style={{ background: theme.colors.card, padding: "16px", borderRadius: "14px" }}>
      {children}
    </div>
  );
}

function formatValue(v) {
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v?.toFixed?.(2) ?? v;
}
