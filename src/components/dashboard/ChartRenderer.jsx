function ChartRenderer({ type, histogram, theme }) {
  if (!histogram || !histogram.labels?.length) {
    return (
      <div style={{ opacity: 0.6, textAlign: "center", paddingTop: "80px" }}>
        No data available
      </div>
    );
  }

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false }, ticks: { precision: 0 } },
    },
  };

  if (type === "line") {
    return (
      <Line
        data={{
          labels: histogram.labels,
          datasets: [
            {
              data: histogram.counts,
              borderColor: theme.colors.accent,
              tension: 0.4,
            },
          ],
        }}
        options={baseOptions}
      />
    );
  }

  if (type === "pie" || type === "donut") {
    return (
      <Pie
        data={{
          labels: histogram.labels,
          datasets: [
            {
              data: histogram.counts,
              backgroundColor: histogram.labels.map(
                () => theme.colors.accent
              ),
            },
          ],
        }}
        options={{
          plugins: { legend: { position: "bottom" } },
          cutout: type === "donut" ? "60%" : "0%",
        }}
      />
    );
  }

  // histogram / bar
  return (
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
      options={baseOptions}
    />
  );
}
