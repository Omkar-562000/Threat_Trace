// src/components/TimelineChart.jsx

export default function TimelineChart({ data = [], height = 60 }) {
  // data: [{time: "2025-11-26T12:34", count: 5}, ...]
  if (!data || data.length === 0) {
    return <div className="text-gray-400">No timeline data</div>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - (d.count / max) * 100;
    return `${x},${y}`;
  });

  const poly = points.join(" ");

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" className="w-full h-full">
        <polyline
          points={poly}
          fill="none"
          stroke="#a855f7"
          strokeWidth="0.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={poly + ` 100,100 0,100`}
          fill="rgba(168,85,247,0.08)"
          stroke="none"
        />
      </svg>
    </div>
  );
}
