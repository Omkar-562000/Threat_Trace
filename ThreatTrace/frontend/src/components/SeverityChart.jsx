// src/components/SeverityChart.jsx
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function SeverityChart({ data = {} }) {
  const chartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Threat Count',
        data: [
          data.critical || 0,
          data.high || 0,
          data.medium || 0,
          data.low || 0
        ],
        backgroundColor: [
          'rgba(255, 0, 102, 0.8)',
          'rgba(255, 68, 68, 0.8)',
          'rgba(250, 204, 21, 0.8)',
          'rgba(56, 189, 248, 0.8)'
        ],
        borderColor: [
          '#ff0066',
          '#ff4444',
          '#facc15',
          '#38bdf8'
        ],
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 50,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
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
            return `${context.label}: ${context.parsed.y} threats`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#e5e7eb',
          font: {
            size: 12,
            weight: '600'
          }
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
    }
  };

  return (
    <div className="w-full h-full" style={{ minHeight: '250px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
