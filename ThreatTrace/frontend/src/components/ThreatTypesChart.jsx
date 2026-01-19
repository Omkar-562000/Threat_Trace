// src/components/ThreatTypesChart.jsx
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ThreatTypesChart({ data = [] }) {
  const chartData = {
    labels: data.map(d => d.type),
    datasets: [
      {
        label: 'Threat Count',
        data: data.map(d => d.count),
        backgroundColor: data.map(d => d.color),
        borderColor: '#0a0f1f',
        borderWidth: 3,
        hoverBorderColor: '#fff',
        hoverBorderWidth: 3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: '#e5e7eb',
          font: {
            size: 11,
            weight: '600'
          },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                return {
                  text: `${label}: ${value}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        borderColor: '#a855f7',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%',
  };

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '300px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
