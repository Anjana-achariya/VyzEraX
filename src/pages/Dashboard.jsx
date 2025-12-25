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

/* ───────────────── ChartJS setup ───────────────── */

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

/* ───────────────── Shared UI Styles ───────────────── */

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
  whiteSpace: "nowrap",
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

          <div style={{ marginLeft: "24px", marginTop: "8px" }}>
            <div style={pillWrapperStyle}>
              <select
                style={pillSelectStyle}
                defaultValue=""
                onChange={(e) => {
                  handleExport(e.target.value);
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
                  handleExport(e.target.value);
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

  const data = JSON.parse(sessionStorage.getItem("analysisResult") || "{}");
  const fileName =
    (sessionStorage.getItem("uploadedFileName") || "Dataset")
      .replace(/\.(csv|xlsx)$/i, "")
      .toUpperCase();

  const numericStats = data?.profile?.numeric_stats || {};
  const categoricalCols = data?.profile?.column_summary?.categorical || [];
  const categoricalValues = data?.profile?.categorical_values || {};

  const numericColumns = Object.keys(numericStats);

  /* ───────── Chart 1 ───────── */

  const [numCol, setNumCol] = useState("");
  const [numType, setNumType] = useState("Histogram");

  useEffect(() => {
    if (!numCol && numericColumns.length) setNumCol(numericColumns[0]);
  }, [numericColumns, numCol]);

  const histogram = useMemo(() => {
    const values = numericStats[numCol]?.values;
    if (!values?.length) return { labels: [], counts: [] };

    const bins = 10;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min) / bins;

    const counts = Array(bins).fill(0);
    values.forEach(v => {
      const i = Math.min(bins - 1, Math.floor((v - min) / step));
      counts[i]++;
    });

    return {
      labels: counts.map((_, i) =>
        `${(min + i * step).toFixed(1)}`
      ),
      counts,
    };
  }, [numericStats, numCol]);

  /* ───────── Chart 2 ───────── */

  const [catCol, setCatCol] = useState("");
  const [catType, setCatType] = useState("Bar");

  useEffect(() => {
    if (!catCol && categoricalCols.length) setCatCol(categoricalCols[0]);
  }, [categoricalCols, catCol]);

  const catData = useMemo(() => {
    const obj = categoricalValues[catCol];
    if (!obj) return { labels: [], counts: [] };

    return {
      labels: Object.keys(obj),
      counts: Object.values(obj),
    };
  }, [categoricalValues, catCol]);

  /* ───────── Chart 3 ───────── */

  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [scatterType, setScatterType] = useState("Scatter");

  useEffect(() => {
    if (numericColumns.length >= 2) {
      if (!xAxis) setXAxis(numericColumns[0]);
      if (!yAxis) setYAxis(numericColumns[1]);
    }
  }, [numericColumns, xAxis, yAxis]);

  const scatterData = useMemo(() => {
    const x = numericStats[xAxis]?.values;
    const y = numericStats[yAxis]?.values;
    if (!x || !y) return [];

    return x.slice(0, y.length).map((v, i) => ({
      x: v,
      y: y[i],
      r: scatterType === "Bubble" ? 6 : undefined,
    }));
  }, [numericStats, xAxis, yAxis, scatterType]);

  /* ───────── Chart 4 ───────── */

  const [trendType, setTrendType] = useState("Line");

  const trendData = useMemo(() => {
    if (!xAxis || !yAxis) return [];
    const x = numericStats[xAxis]?.values || [];
    const y = numericStats[yAxis]?.values || [];
    return x.slice(0, y.length).map((v, i) => ({ x: v, y: y[i] }));
  }, [numericStats, xAxis, yAxis]);

  /* ───────── Render ───────── */

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
      <h1 style={{ marginBottom: "24px" }}>{fileName} DASHBOARD</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Chart 1 */}
        <DashboardCard>
          <ChartHeader title="NUMERIC DISTRIBUTION">
            <select value={numCol} onChange={e => setNumCol(e.target.value)}>
              {numericColumns.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={numType} onChange={e => setNumType(e.target.value)}>
              <option>Histogram</option>
              <option>Bar</option>
              <option>Line</option>
            </select>
          </ChartHeader>

          {numType !== "Line" ? (
            <Bar data={{ labels: histogram.labels, datasets: [{ data: histogram.counts }] }} />
          ) : (
            <Line data={{ labels: histogram.labels, datasets: [{ data: histogram.counts }] }} />
          )}
        </DashboardCard>

        {/* Chart 2 */}
        <DashboardCard>
          <ChartHeader title="CATEGORY DISTRIBUTION">
            <select value={catCol} onChange={e => setCatCol(e.target.value)}>
              {categoricalCols.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={catType} onChange={e => setCatType(e.target.value)}>
              <option>Bar</option>
              <option>Pie</option>
              <option>Donut</option>
            </select>
          </ChartHeader>

          {catType === "Bar" ? (
            <Bar data={{ labels: catData.labels, datasets: [{ data: catData.counts }] }} />
          ) : (
            <Pie
              data={{
                labels: catData.labels,
                datasets: [{
                  data: catData.counts,
                  cutout: catType === "Donut" ? "60%" : "0%",
                }],
              }}
              options={{ plugins: { legend: { position: "bottom" } } }}
            />
          )}
        </DashboardCard>

        {/* Chart 3 */}
        <DashboardCard>
          <ChartHeader title="RELATIONSHIP">
            <select value={xAxis} onChange={e => setXAxis(e.target.value)}>
              {numericColumns.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={yAxis} onChange={e => setYAxis(e.target.value)}>
              {numericColumns.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={scatterType} onChange={e => setScatterType(e.target.value)}>
              <option>Scatter</option>
              <option>Bubble</option>
            </select>
          </ChartHeader>

          {scatterType === "Bubble" ? (
            <Bubble data={{ datasets: [{ data: scatterData }] }} />
          ) : (
            <Scatter data={{ datasets: [{ data: scatterData }] }} />
          )}
        </DashboardCard>

        {/* Chart 4 */}
        <DashboardCard>
          <ChartHeader title="TREND">
            <select value={trendType} onChange={e => setTrendType(e.target.value)}>
              <option>Line</option>
              <option>Column</option>
            </select>
          </ChartHeader>

          {trendType === "Line" ? (
            <LineChart data={{ datasets: [{ data: trendData }] }} />
          ) : (
            <Bar data={{ labels: trendData.map(p => p.x), datasets: [{ data: trendData.map(p => p.y) }] }} />
          )}
        </DashboardCard>
      </div>
    </div>
  );
}

/* ───────────────── Helpers ───────────────── */

function DashboardCard({ children }) {
  const { theme } = useDashboardTheme();
  return (
    <div style={{
      background: theme.colors.card,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: "14px",
      padding: "16px",
      height: "260px",
    }}>
      {children}
    </div>
  );
}

function ChartHeader({ title, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
      <p style={{ opacity: 0.7 }}>{title}</p>
      <div style={{ display: "flex", gap: "8px" }}>{children}</div>
    </div>
  );
}
