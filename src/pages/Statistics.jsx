import { useNavigate } from "react-router-dom";

export default function Statistics() {
  const navigate = useNavigate();

  const stored = sessionStorage.getItem("analysisResult");
  const data = stored ? JSON.parse(stored) : null;

  const rawName =
    sessionStorage.getItem("uploadedFileName") || "Dataset";

  const fileName = rawName
    .replace(/\.(csv|xlsx)$/i, "")
    .toUpperCase();

  if (!data || !data.profile) {
    return (
      <div style={{ textAlign: "center" }}>
        <h2>No data found</h2>
        <p>Please upload a dataset first.</p>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: "16px",
            padding: "10px 16px",
            background: "#ff8fab",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Go to Home
        </button>
      </div>
    );
  }

  const profile = data.profile;
  const missingValues = profile.missing_values || {};

  return (
    <div>
      <h1 style={{ fontSize: "28px", marginBottom: "24px" }}>
        {fileName} STATISTICS
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.3fr",
          gap: "24px",
          marginBottom: "40px",
        }}
      >
        <div>
          <StatCard title="Rows" value={profile.rows} />
          <StatCard title="Columns" value={profile.columns} />
          <StatCard title="Duplicates" value={profile.duplicates} />

          {profile.outliers && (
            <StatCard
              title="Columns with Outliers"
              value={Object.keys(profile.outliers).length}
            />
          )}
        </div>

        <div>
          <h3 style={{ marginBottom: "12px" }}>Missing Values</h3>

          {Object.keys(missingValues).length === 0 ? (
            <p>No missing values 🎉</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Column</th>
                  <th style={th}>Missing Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(missingValues).map(([col, count]) => (
                  <tr key={col}>
                    <td style={td}>{col}</td>
                    <td style={td}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: "22px", marginBottom: "12px" }}>
        Numeric Statistics
      </h2>

      <NumericStatsTable stats={profile.numeric_stats} />
    </div>
  );
}

/* ───────────────── Components ───────────────── */

function StatCard({ title, value }) {
  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        marginBottom: "12px",
        background: "#fff",
      }}
    >
      <p style={{ color: "#666", marginBottom: "4px" }}>{title}</p>
      <h3 style={{ fontSize: "24px", fontWeight: "bold" }}>{value}</h3>
    </div>
  );
}

function NumericStatsTable({ stats }) {
  if (!stats || Object.keys(stats).length === 0) {
    return <p>No numeric columns found.</p>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={th}>Column</th>
          <th style={th}>Mean</th>
          <th style={th}>Median</th>
          <th style={th}>Std</th>
          <th style={th}>Min</th>
          <th style={th}>Max</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(stats).map(([col, s]) => (
          <tr key={col}>
            <td style={td}>{col}</td>
            <td style={td}>{s.mean}</td>
            <td style={td}>{s.median}</td>
            <td style={td}>{s.std}</td>
            <td style={td}>{s.min}</td>
            <td style={td}>{s.max}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ───────────────── Styles ───────────────── */

const th = {
  borderBottom: "2px solid #ddd",
  padding: "8px",
  textAlign: "left",
};

const td = {
  borderBottom: "1px solid #eee",
  padding: "8px",
};
