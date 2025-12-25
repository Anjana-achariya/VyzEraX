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

/* ───────────────── SHARED UI STYLES (SOURCE OF TRUTH) ───────────────── */

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
  height: "32px",
  minWidth: "130px",
  padding: "0 12px",
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.25)",
  background: "white",
  fontSize: "14px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/* ───────────────── Main Wrapper ───────────────── */

export default function Dashboard() {
  /* ─── Export handler ─── */
  const handleExport = async (type) => {
    const element = document.getElementById("dashboard-export");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL("image/png");

    if (type === "image") {
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
        {/* LEFT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Theme Switcher */}
          <DashboardThemeSwitcher />

          {/* Export — SAME UI AS THEME SWITCHER */}
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
                <option value="" disabled>
                  Export PDF
                </option>
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
                <option value="" disabled>
                  Export Image
                </option>
                <option value="image">Export Image</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — DASHBOARD */}
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

  /* ─── Chart states ─── */
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

  useEffect(() => {
    if (!selectedColumn && numericColumns.length)
      setSelectedColumn(numericColumns[0]);
    if (!catColumn && categoricalCols.length)
      setCatColumn(categoricalCols[0]);
    if (numericColumns.length >= 2) {
      if (!xAxis) setXAxis(numericColumns[0]);
      if (!yAxis) setYAxis(numericColumns[1]);
      if (!timeX) setTimeX(numericColumns[0]);
      if (!timeY) setTimeY(numericColumns[1]);
    }
  }, [numericColumns, categoricalCols]);

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
    const step = Math.ceil(Math.max(1, max - min) / bins);

    return {
      labels: Array.from({ length: bins }, (_, i) => {
        const s = min + i * step;
        return `${s}–${s + step}`;
      }),
      counts: Array.from({ length: bins }, () =>
        Math.max(1, Math.round(stats.mean))
      ),
    };
  }, [numericStats, selectedColumn]);

  /* ─── Categorical ─── */
  const categoryDistribution = useMemo(() => {
    const obj = categoricalValues[catColumn];
    if (!obj) return { labels: [], counts: [] };
    const entries = Object.entries(obj);
    return {
      labels: entries.map(([k]) => k),
      counts: entries.map(([, v]) => v),
    };
  }, [categoricalValues, catColumn]);

  /* ─── Scatter / Bubble ─── */
  const scatterData = useMemo(() => {
    if (!xAxis || !yAxis) return [];
    const xStats = numericStats[xAxis];
    const yStats = numericStats[yAxis];
    if (!xStats || !yStats) return [];

    return Array.from({ length: 30 }, (_, i) => ({
      x:
        xStats.min +
        (i / 29) * (xStats.max - xStats.min),
      y:
        yStats.mean +
        (Math.random() - 0.5) * (yStats.std || 1),
      r: scatterType === "Bubble" ? 6 + Math.random() * 10 : undefined,
    }));
  }, [numericStats, xAxis, yAxis, scatterType]);

  /* ─── Trend ─── */
  const timelineData = useMemo(() => {
    if (!timeX || !timeY) return [];
    const xStats = numericStats[timeX];
    const yStats = numericStats[timeY];
    if (!xStats || !yStats) return [];

    return Array.from({ length: 12 }, (_, i) => ({
      x: Math.round(
        xStats.min + (i / 11) * (xStats.max - xStats.min)
      ),
      y:
        yStats.min + (i / 11) * (yStats.max - yStats.min),
    }));
  }, [timeX, timeY, numericStats]);

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
              {formatValue(kpi.value)}
            </h3>
          </DashboardCard>
        ))}
      </div>

      {/* CHART GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        {/* Chart 1 */}
        <DashboardCard height="280px">
          <ChartHeader title={`${selectedColumn} Distribution`}>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              style={selectStyle(theme)}
            >
              {numericColumns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              style={selectStyle(theme)}
            >
              <option>Histogram</option>
              <option>Bar</option>
              <option>Line</option>
            </select>
          </ChartHeader>

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
            options={chartOptions(theme)}
          />
        </DashboardCard>

        {/* Chart 2 */}
        <DashboardCard height="280px">
          <ChartHeader title={`${catColumn} Distribution`}>
            <select
              value={catColumn}
              onChange={(e) => setCatColumn(e.target.value)}
              style={selectStyle(theme)}
            >
              {categoricalCols.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={catChartType}
              onChange={(e) => setCatChartType(e.target.value)}
              style={selectStyle(theme)}
            >
              <option>Bar</option>
              <option>Pie</option>
              <option>Donut</option>
            </select>
          </ChartHeader>

          {catChartType === "Bar" ? (
            <Bar
              data={{
                labels: categoryDistribution.labels,
                datasets: [
                  {
                    data: categoryDistribution.counts,
                    backgroundColor: theme.colors.accent,
                  },
                ],
              }}
              options={chartOptions(theme)}
            />
          ) : (
            <Pie
              data={{
                labels: categoryDistribution.labels,
                datasets: [
                  {
                    data: categoryDistribution.counts,
                    backgroundColor: generatePalette(
                      theme.colors.accent,
                      categoryDistribution.labels.length
                    ),
                  },
                ],
              }}
              options={pieOptions}
            />
          )}
        </DashboardCard>

        {/* Chart 3 */}
        <DashboardCard height="260px">
          <ChartHeader title="Relationship Analysis">
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              style={selectStyle(theme)}
            >
              {numericColumns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              style={selectStyle(theme)}
            >
              {numericColumns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={scatterType}
              onChange={(e) => setScatterType(e.target.value)}
              style={selectStyle(theme)}
            >
              <option>Scatter</option>
              <option>Bubble</option>
            </select>
          </ChartHeader>

          {scatterType === "Bubble" ? (
            <Bubble
              data={{
                datasets: [
                  {
                    data: scatterData,
                    backgroundColor: theme.colors.accent,
                  },
                ],
              }}
              options={scatterOptions(xAxis, yAxis)}
            />
          ) : (
            <Scatter
              data={{
                datasets: [
                  {
                    data: scatterData,
                    backgroundColor: theme.colors.accent,
                  },
                ],
              }}
              options={scatterOptions(xAxis, yAxis)}
            />
          )}
        </DashboardCard>

        {/* Chart 4 */}
        <DashboardCard height="260px">
          <ChartHeader title="Trend Analysis">
            <select
              value={timeX}
              onChange={(e) => setTimeX(e.target.value)}
              style={selectStyle(theme)}
            >
              {numericColumns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={timeY}
              onChange={(e) => setTimeY(e.target.value)}
              style={selectStyle(theme)}
            >
              {numericColumns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={timeChartType}
              onChange={(e) => setTimeChartType(e.target.value)}
              style={selectStyle(theme)}
            >
              <option>Line</option>
              <option>Column</option>
            </select>
          </ChartHeader>

          {timeChartType === "Line" ? (
            <LineChart
              data={{
                labels: timelineData.map((p) => p.x),
                datasets: [
                  {
                    data: timelineData.map((p) => p.y),
                    borderColor: theme.colors.accent,
                  },
                ],
              }}
              options={scatterOptions(timeX, timeY)}
            />
          ) : (
            <Bar
              data={{
                labels: timelineData.map((p) => p.x),
                datasets: [
                  {
                    data: timelineData.map((p) => p.y),
                    backgroundColor: theme.colors.accent,
                  },
                ],
              }}
              options={scatterOptions(timeX, timeY)}
            />
          )}
        </DashboardCard>
      </div>
    </div>
  );
}

/* ───────────────── Helpers ───────────────── */

function ChartHeader({ title, children }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
      }}
    >
      <p style={{ opacity: 0.7 }}>{title}</p>
      <div style={{ display: "flex", gap: "8px" }}>{children}</div>
    </div>
  );
}

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

const selectStyle = (theme) => ({
  padding: "6px 10px",
  borderRadius: "8px",
  border: `1px solid ${theme.colors.border}`,
  background: theme.colors.card,
  color: theme.colors.text,
  fontSize: "13px",
  maxWidth: "130px",
});

const chartOptions = (theme) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { display: false }, ticks: { precision: 0 } },
  },
});

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right",
      labels: { boxWidth: 12, padding: 10 },
    },
  },
};

const scatterOptions = (xAxis, yAxis) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { title: { display: true, text: xAxis }, grid: { display: false } },
    y: { title: { display: true, text: yAxis }, grid: { display: false } },
  },
});

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function generatePalette(baseColor, count) {
  const { r, g, b } = hexToRgb(baseColor);
  return Array.from({ length: count }, (_, i) => {
    const alpha = Math.max(0.3, 1 - i * 0.08);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  });
}

function formatValue(v) {
  if (typeof v !== "number") return v;
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(2);
}
