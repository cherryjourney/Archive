import ReactECharts from 'echarts-for-react';
import type { EstimateVsActual } from '@/types/chart';

interface Props {
  data: EstimateVsActual[];
}

export default function EstimateVsActualBar({ data }: Props) {
  if (data.length === 0) return <EmptyChart />;

  const dates = data.map((d) => d.date.slice(5)); // MM-DD

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { seriesName: string; value: number }[]) => {
        return params
          .map((p) => `${p.seriesName}: ${p.value.toFixed(1)}小时`)
          .join('<br/>');
      },
    },
    legend: {
      bottom: 0,
      data: ['预估耗时', '实际耗时'],
    },
    grid: { left: 8, right: 8, top: 8, bottom: 28 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#dee2e6' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}h', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f3f5' } },
    },
    series: [
      {
        name: '预估耗时',
        type: 'bar',
        data: data.map((d) => parseFloat(d.estimated.toFixed(1))),
        barWidth: 16,
        itemStyle: {
          color: '#bac8ff',
          borderRadius: [3, 3, 0, 0],
        },
        barGap: '30%',
      },
      {
        name: '实际耗时',
        type: 'bar',
        data: data.map((d) => parseFloat(d.actual.toFixed(1))),
        barWidth: 16,
        itemStyle: {
          color: '#69db7c',
          borderRadius: [3, 3, 0, 0],
        },
        markLine: {
          silent: true,
          symbol: 'none',
          label: { formatter: '预估: {c}h' },
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 10,
          color: '#868e96',
          formatter: (p: { value: number }) => (p.value > 0 ? p.value + 'h' : ''),
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
      ⏱️ 填写预估/实际耗时后，对比将在此展示
    </div>
  );
}
