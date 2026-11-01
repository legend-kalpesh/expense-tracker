import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';
import { formatCurrency, formatMonth } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(148, 163, 184, 0.25)';

// months: [{ month: '2026-03', total: 1234 }, ...] straight from /api/dashboard/monthly
export default function MonthlyBarChart({ months }) {
  const data = {
    labels: months.map((m) => formatMonth(m.month)),
    datasets: [
      {
        label: 'Total spent',
        data: months.map((m) => m.total),
        backgroundColor: '#4f46e5',
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${formatCurrency(ctx.parsed.y)}` } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (value) => `₹${value}` } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="chart-box">
      <Bar data={data} options={options} />
    </div>
  );
}
