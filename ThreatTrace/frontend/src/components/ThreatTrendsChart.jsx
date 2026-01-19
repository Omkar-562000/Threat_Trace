// src/components/ThreatTrendsChart.jsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ThreatTrendsChart({ data = [] }) {
  const chartData = {
    labels: data.map(d => d.timestamp),
    datasets: [
      {
        label: 'Total Threats',
        data: data.map(d => d.threats),
        borderColor: '#ff0066',
        backgroundColor: 'rgba(255, 0, 102, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ff0066',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Blocked',
        data: data.map(d => d.blocked),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Active',
        data: data.map(d => d.active),
        borderColor: '#facc15',
        backgroundColor: 'rgba(250, 204, 21, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#facc15',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#e5e7eb',
          font: {
            size: 11,
            weight: '600'
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        borderColor: '#a855f7',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 10
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 10
          }
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };

  return (
    <div className="w-full h-full" style={{ minHeight: '300px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
