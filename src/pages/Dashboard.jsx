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

  /* ───── EXPORT HANDLER (LOCAL) ───── */
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

  /* ───── EXISTING STATE (UNCHANGED) ───── */
  const stored = sessionStorage.getItem("analysisResult");
  const data = stored ? JSON.parse(stored) : null;

  const rawName = sessionStorage.getItem("uploadedFileName") || "Dataset";
  const fileName = rawName.replace(/\.(csv|xlsx)$/i, "").toUpperCase();

  const numericStats = data?.profile?.numeric_stats || {};
  const categoricalCols = data?.profile?.column_summary?.categorical || [];
  const categoricalValues = data?.profile?.categorical_values || {};
  const numericColumns = Object.keys(numericStats);

  const [selectedColumn, setSelectedColumn] = useState("");
  const [chartType, setChartType] = useState("Histogram");

  useEffect(() => {
    if (!selectedColumn && numericColumns.length) {
      setSelectedColumn(numericColumns[0]);
    }
  }, [numericColumns, selectedColumn]);

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
        flex: 1,
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "12px" }}>
        {fileName} DASHBOARD
      </h1>

      {/* 🔽 EXPORT BUTTON (NEW) */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => handleExport("pdf")} style={exportBtn}>
          Export PDF
        </button>
        <button onClick={() => handleExport("image")} style={exportBtn}>
          Export Image
        </button>
      </div>

      
    </div>
  );
}

/* ───────────────── Styles ───────────────── */

const exportBtn = {
  padding: "6px 14px",
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.3)",
  background: "transparent",
  cursor: "pointer",
  fontWeight: 600,
};
