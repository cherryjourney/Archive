import ReactECharts from 'echarts-for-react';
import type { DashboardStats } from '@/types/chart';

interface Props {
  data: DashboardStats | null;
}

export default function CompletionRing({ data }: Props) {
  if (!data) return null;

  const rate = Math.round(data.today_completion_rate * 100);

  const option = {
    tooltip: {
      formatter: `{b}: {c} ({d}%)`,
    },
    legend: {
      bottom: 0,
      data: ['已完成', '未完成'],
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'center',
          formatter: `{rate|${rate}%}\n{label|完成率}`,
          rich: {
            rate: { fontSize: 32, fontWeight: 'bold', color: '#4c6ef5' },
            label: { fontSize: 13, color: '#868e96', lineHeight: 22 },
          },
        },
        emphasis: {
          label: { fontSize: 36, fontWeight: 'bold' },
        },
        data: [
          {
            value: data.today_completed,
            name: '已完成',
            itemStyle: { color: '#69db7c' },
          },
          {
            value: Math.max(0, data.today_total - data.today_completed),
            name: '未完成',
            itemStyle: { color: '#e9ecef' },
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 230 }} />;
}
