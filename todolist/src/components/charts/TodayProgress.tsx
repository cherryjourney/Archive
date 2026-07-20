import ReactECharts from 'echarts-for-react';
import type { DashboardStats } from '@/types/chart';

interface Props {
  data: DashboardStats | null;
}

export default function TodayProgress({ data }: Props) {
  if (!data) return null;

  const rate = Math.round(data.today_completion_rate * 100);
  const angle = (rate / 100) * 180;

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '70%'],
        radius: '110%',
        min: 0,
        max: 100,
        splitNumber: 10,
        axisLine: {
          show: true,
          lineStyle: {
            width: 20,
            color: [
              [rate / 100, rate === 100 ? '#10b981' : '#6c5ce7'],
              [1, 'rgba(0,0,0,0.05)'],
            ],
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '65%',
          width: 8,
          offsetCenter: [0, '-30%'],
          itemStyle: {
            color: rate === 100 ? '#10b981' : '#6c5ce7',
          },
        },
        axisTick: { show: false },
        splitLine: {
          show: true,
          length: 18,
          lineStyle: { color: 'auto', width: 3 },
        },
        axisLabel: {
          distance: -40,
          fontSize: 11,
          color: '#a49ebf',
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 16,
          itemStyle: {
            borderWidth: 2,
            borderColor: rate === 100 ? '#10b981' : '#6c5ce7',
          },
        },
        title: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 36,
          fontWeight: 'bold',
          offsetCenter: [0, '20%'],
          formatter: `{value}%`,
          color: rate === 100 ? '#10b981' : '#6c5ce7',
        },
        data: [{ value: rate }],
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        bottom: 6,
        style: {
          text: `${data.today_completed}/${data.today_total} 项已完成`,
          fontSize: 13,
          color: '#a49ebf',
          textAlign: 'center',
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 220 }} />;
}
