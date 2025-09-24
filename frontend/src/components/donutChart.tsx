import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type DonutChartProps = {
  label: string;
  value: number;
  color: string;
  mode: 'remaining' | 'usage'; 
};

function DonutChart({ label, value, color, mode }: DonutChartProps) {
  const isRemaining = mode === 'remaining';

  const data = {
    labels: isRemaining ? [label, 'ใช้ไป'] : [label, 'ที่เหลือ'],
    datasets: [
      {
        label,
        data: [value, 100 - value],
        backgroundColor: [color, 'rgba(211, 211, 211, 0.3)'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ width: '100px', height: '100px', position: 'relative' }}>
      <Doughnut data={data} options={options} />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontWeight: 'bold',
          fontSize: '18px',
          color,
          userSelect: 'none',
        }}
      >
        {mode === 'remaining' ? `${value}%` : `${value}L`}
      </div>
    </div>
  );
}

export default DonutChart;
