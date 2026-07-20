import ReactECharts from 'echarts-for-react';
import type { StreakData } from '@/types/chart';

interface Props {
  data: StreakData | null;
}

export default function StreakCounter({ data }: Props) {
  if (!data) return null;

  const option = {
    graphic: [
      {
        type: 'group',
        left: 'center',
        top: 'center',
        children: [
          {
            type: 'text',
            style: {
              text: `${data.current_streak}`,
              font: 'bold 60px "Microsoft YaHei"',
              fill: '#ff7f7f',
              textAlign: 'center',
            },
            left: 'center',
            top: -20,
          },
          {
            type: 'text',
            style: {
              text: '连续打卡天数',
              font: '14px "Microsoft YaHei"',
              fill: '#868e96',
              textAlign: 'center',
            },
            left: 'center',
            top: 40,
          },
        ],
      },
    ],
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        center: ['50%', '50%'],
        radius: '80%',
        min: 0,
        max: Math.max(data.longest_streak, data.current_streak, 7),
        splitNumber: 7,
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [data.current_streak / Math.max(data.longest_streak, 1), '#ff7f7f'],
              [1, '#f0f0f0'],
            ],
          },
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: { show: false },
        data: [{ value: data.current_streak }],
      },
    ],
    // 底部统计
    ...(data.longest_streak > 0 || data.current_week_completed > 0
      ? {
          legend: {
            bottom: 0,
            data: [`最长记录: ${data.longest_streak}天`, `本周完成: ${data.current_week_completed}天`],
          },
        }
      : {}),
  };

  return <ReactECharts option={option} style={{ height: 240 }} />;
}
