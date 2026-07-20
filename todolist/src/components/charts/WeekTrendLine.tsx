import ReactECharts from 'echarts-for-react';
import type { DailyStat } from '@/types/chart';

interface Props {
  data: DailyStat[];
}

export default function WeekTrendLine({ data }: Props) {
  if (data.length === 0) return <EmptyChart />;

  const dates = data.map((d) => d.date.slice(5)); // MM-DD
  const rates = data.map((d) => Math.round(d.rate * 100));
  const totals = data.map((d) => d.total);
  const completeds = data.map((d) => d.completed);

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      bottom: 0,
      data: ['完成率(%)', '总任务数', '已完成'],
    },
    grid: { left: 8, right: 8, top: 8, bottom: 28 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#dee2e6' } },
    },
    yAxis: [
      {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { formatter: '{value}%', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f3f5' } },
      },
      {
        type: 'value',
        min: 0,
        axisLabel: { fontSize: 11 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '完成率(%)',
        type: 'line',
        data: rates,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#4c6ef5', width: 3 },
        itemStyle: { color: '#4c6ef5' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(76,110,245,0.2)' },
              { offset: 1, color: 'rgba(76,110,245,0.02)' },
            ],
          },
        },
      },
      {
        name: '总任务数',
        type: 'bar',
        yAxisIndex: 1,
        data: totals,
        barWidth: 14,
        itemStyle: {
          color: '#bac8ff',
          borderRadius: [3, 3, 0, 0],
        },
      },
      {
        name: '已完成',
        type: 'bar',
        yAxisIndex: 1,
        data: completeds,
        barWidth: 14,
        itemStyle: {
          color: '#69db7c',
          borderRadius: [3, 3, 0, 0],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 230 }} />;
}

function EmptyChart() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 230, color: '#adb5bd', fontSize: 14
    }}>
      📈 开始使用后，本周趋势将在此展示
    </div>
  );
}
