export default function ChartControls({
  chartType,
  setChartType,
  availableTypes,
}) {
  return (
    <select
      value={chartType}
      onChange={(e) => setChartType(e.target.value)}
      style={{
        padding: "6px 10px",
        borderRadius: "8px",
        border: "1px solid #444",
        background: "transparent",
        color: "inherit",
      }}
    >
      {availableTypes.map((type) => (
        <option key={type} value={type}>
          {type.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
