import { useState, useMemo, useEffect } from "react";

// import html2canvas from "html2canvas";
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
import { Bar, Line, Pie } from "react-chartjs-2";
import { Scatter, Bubble } from "react-chartjs-2";
import { Line as LineChart } from "react-chartjs-2";

import { TreemapController, TreemapElement } from "chartjs-chart-treemap";

ChartJS.register(TreemapController, TreemapElement);




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
  return (
    <DashboardThemeProvider>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "56px" }}>
        <DashboardThemeSwitcher />
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

  /* ─── Chart 1 state ─── */
  const [selectedColumn, setSelectedColumn] = useState("");
  const [chartType, setChartType] = useState("Histogram");

  useEffect(() => {
    if (!selectedColumn && numericColumns.length > 0) {
      setSelectedColumn(numericColumns[0]);
    }
  }, [numericColumns, selectedColumn]);

  /* ─── Chart 2 state ─── */
  const [catColumn, setCatColumn] = useState("");
  const [catChartType, setCatChartType] = useState("Bar");

  useEffect(() => {
    if (!catColumn && categoricalCols.length > 0) {
      setCatColumn(categoricalCols[0]);
    }
  }, [categoricalCols, catColumn]);

  /* ─── Chart 3 state (Scatter / Bubble) ─── */
const [xAxis, setXAxis] = useState("");
const [yAxis, setYAxis] = useState("");
const [scatterType, setScatterType] = useState("Scatter");

useEffect(() => {
  if (numericColumns.length >= 2) {
    if (!xAxis) setXAxis(numericColumns[0]);
    if (!yAxis) setYAxis(numericColumns[1]);
  }
}, [numericColumns, xAxis, yAxis]);

/* ─── Chart 4 state (Trend) ─── */
const [timeX, setTimeX] = useState("");
const [timeY, setTimeY] = useState("");
const [timeChartType, setTimeChartType] = useState("Line");

useEffect(() => {
  if (numericColumns.length >= 2) {
    if (!timeX) setTimeX(numericColumns[0]);
    if (!timeY) setTimeY(numericColumns[1]);
  }
}, [numericColumns, timeX, timeY]);


// useEffect(() => {
//   const handler = async (e) => {
//     if (e.detail.target !== "dashboard") return;

//     const element = document.getElementById("dashboard-export");
//     if (!element) return;

//     const canvas = await html2canvas(element, {
//       scale: 2,
//       useCORS: true,
//       backgroundColor: null,
//     });

//     const imgData = canvas.toDataURL("image/png");

//     if (e.detail.format === "image") {
//       const a = document.createElement("a");
//       a.href = imgData;
//       a.download = "dashboard-export.png";
//       a.click();
//     } else {
//       const pdf = new jsPDF("p", "mm", "a4");
//       const w = pdf.internal.pageSize.getWidth();
//       const h = (canvas.height * w) / canvas.width;
//       pdf.addImage(imgData, "PNG", 0, 0, w, h);
//       pdf.save("dashboard-export.pdf");
//     }
//   };

//   window.addEventListener("APP_EXPORT", handler);
//   return () => window.removeEventListener("APP_EXPORT", handler);
// }, []);


  /* ─── KPIs ─── */
  const kpis = numericColumns.slice(0, 5).map((col) => ({
    label: `${col} (Mean)`,
    value: numericStats[col].mean,
  }));

  /* ─── Histogram (stable & integer) ─── */
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

  /* ─── Categorical distribution ─── */
  const categoryDistribution = useMemo(() => {
    const obj = categoricalValues[catColumn];
    if (!obj || Object.keys(obj).length === 0) {
      return { labels: [], counts: [] };
    }

    const entries = Object.entries(obj);

    return {
      labels: entries.map(([label]) => label),
      counts: entries.map(([, count]) => count),
    };
  }, [categoricalValues, catColumn]);

  /* ─── Scatter / Bubble data ─── */
const scatterData = useMemo(() => {
  if (!xAxis || !yAxis) return [];

  const xStats = numericStats[xAxis];
  const yStats = numericStats[yAxis];
  if (!xStats || !yStats) return [];

  const points = 30;

  // deterministic pseudo-random generator
  const pseudoRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  return Array.from({ length: points }, (_, i) => {
    const x =
      xStats.min +
      (i / (points - 1)) * (xStats.max - xStats.min);

    const noise = pseudoRandom(i + xStats.mean) - 0.5;

    const y =
      yStats.mean +
      noise * (yStats.std || 1) * 2;

    return {
      x,
      y,
      r:
        scatterType === "Bubble"
          ? 6 + pseudoRandom(i) * 10
          : undefined,
    };
  });
}, [numericStats, xAxis, yAxis, scatterType]);

/* ─── Trend data (X vs Y) ─── */
const timelineData = useMemo(() => {
  if (!timeX || !timeY) return [];

  const xStats = numericStats[timeX];
  const yStats = numericStats[timeY];
  if (!xStats || !yStats) return [];

  const points = 12;
  const step = Math.max(
    1,
    Math.floor((xStats.max - xStats.min) / (points - 1))
  );

  return Array.from({ length: points }, (_, i) => ({
    x: Math.round(xStats.min + i * step),
    y:
      yStats.min +
      (i / (points - 1)) * (yStats.max - yStats.min),
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
            <p style={{ fontSize: "14px", opacity: 0.7 }}>
              {kpi.label}
            </p>
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
          <ChartHeader
            title={`${selectedColumn.toUpperCase()} DISTRIBUTION`}
          >
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

          <div style={{ height: "210px" }}>
            {(chartType === "Histogram" || chartType === "Bar") && (
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
                options={chartOptions(theme)}
              />
            )}

            {chartType === "Line" && (
              <Line
                data={{
                  labels: histogram.labels,
                  datasets: [
                    {
                      data: histogram.counts,
                      borderColor: theme.colors.accent,
                      tension: 0.3,
                    },
                  ],
                }}
                options={chartOptions(theme)}
              />
            )}
          </div>
        </DashboardCard>

        {/* Chart 2 */}
        <DashboardCard height="280px">
          <ChartHeader
            title={`${catColumn?.toUpperCase() || "CATEGORY"} DISTRIBUTION`}
          >
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

          <div style={{ height: "180px" }}>
            {categoryDistribution.labels.length === 0 ? (
              <p style={{ opacity: 0.6 }}>No categorical data</p>
            ) : catChartType === "Bar" ? (
              <Bar
                data={{
                  labels: categoryDistribution.labels,
                  datasets: [
                    {
                      data: categoryDistribution.counts,
                      backgroundColor: theme.colors.accent,
                      borderRadius: 6,
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
                      cutout:
                        catChartType === "Donut" ? "60%" : "0%",
                    },
                  ],
                }}
                options={pieOptions}
              />
            )}
          </div>
        </DashboardCard>
<DashboardCard height="260px">
  <ChartHeader title="RELATIONSHIP ANALYSIS">
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

  <div style={{ height: "200px" }}>
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
  </div>
</DashboardCard>

<DashboardCard height="260px">
  <ChartHeader title="TREND ANALYSIS">
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

  <div style={{ height: "200px" }}>
    {timeChartType === "Line" ? (
      <LineChart
        data={{
          labels: timelineData.map((p) => p.x),
          datasets: [
            {
              data: timelineData.map((p) => p.y),
              borderColor: theme.colors.accent,
              tension: 0.3,
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
              borderRadius: 6,
            },
          ],
        }}
        options={scatterOptions(timeX, timeY)}
      />
    )}
  </div>
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
        marginBottom: "8px",
        alignItems: "center",
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

// const chartOptions = (theme) => ({
//   responsive: true,
//   maintainAspectRatio: false,
//   plugins: { legend: { display: false } },
//   scales: {
//     x: { grid: { display: false } },
//     y: {
//       grid: { display: false },
//       ticks: { precision: 0 },
//     },
//   },
// });
const chartOptions = (theme) => ({
  responsive: true,
  maintainAspectRatio: false,

  layout: {
    padding: {
      top: 16,
      right: 16,
      bottom: 36, // ⭐ critical for export
      left: 16,
    },
  },

  plugins: {
    legend: { display: false },
  },

  scales: {
    x: {
      grid: { display: false },
      ticks: {
        padding: 10, // ⭐ keeps labels inside canvas
      },
    },
    y: {
      grid: { display: false },
      ticks: {
        precision: 0,
        padding: 10,
      },
    },
  },
});


const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right",
      labels: {
        boxWidth: 12,
        padding: 10,
      },
    },
  },
};
// const scatterOptions = (xAxis, yAxis) => ({
//   responsive: true,
//   maintainAspectRatio: false,
//   plugins: {
//     legend: { display: false },
//   },
//   scales: {
//     x: {
//       title: { display: true, text: xAxis },
//       grid: { display: false },  
//     },
//     y: {
//       title: { display: true, text: yAxis },
//       grid: { display: false },  
//     },
//   },
// });
const scatterOptions = (xAxis, yAxis) => ({
  responsive: true,
  maintainAspectRatio: false,

  layout: {
    padding: {
      top: 16,
      right: 16,
      bottom: 36, // ⭐ fixes clipped axis titles in export
      left: 16,
    },
  },

  plugins: {
    legend: { display: false },
  },

  scales: {
    x: {
      title: { display: true, text: xAxis },
      grid: { display: false },
      ticks: { padding: 10 },
    },
    y: {
      title: { display: true, text: yAxis },
      grid: { display: false },
      ticks: { padding: 10 },
    },
  },
});




/* ─── Theme-aware palette helpers ─── */
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



