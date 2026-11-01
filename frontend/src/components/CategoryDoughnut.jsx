import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { formatCurrency } from '../utils/format';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
  '#8b5cf6', '#ec4899', '#84cc16', '#f97316', '#64748b',
];

// categories: [{ name, total, percentage }, ...] straight from /api/dashboard/categories
export default function CategoryDoughnut({ categories }) {
  const data = {
    labels: categories.map((c) => c.name),
    datasets: [
      {
        data: categories.map((c) => c.total),
        backgroundColor: categories.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 2,
        borderColor: 'transparent',
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = categories[ctx.dataIndex];
            return ` ${formatCurrency(item.total)} (${item.percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="chart-box">
      <Doughnut data={data} options={options} />
    </div>
  );
}
