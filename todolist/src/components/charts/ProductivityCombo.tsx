import ReactECharts from 'echarts-for-react';
import type { ProductivityPoint } from '@/types/chart';

interface Props {
  data: ProductivityPoint[];
}

export default function ProductivityCombo({ data }: Props) {
  if (data.length === 0) return <EmptyChart />;

  const dates = data.map(d => d.date.slice(5));
  const completed = data.map(d => d.completed);
  const rates = data.map(d => Math.round(d.rate * 100));

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      bottom: 0,
      data: ['完成数', '完成率'],
    },
    grid: { left: 8, right: 8, top: 8, bottom: 28 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#e0dce8' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '任务数',
        axisLabel: { fontSize: 11 },
        splitLine: { lineStyle: { color: '#f0edf5' } },
      },
      {
        type: 'value',
        name: '%',
        max: 100,
        axisLabel: { formatter: '{value}%', fontSize: 11 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '完成数',
        type: 'bar',
        data: completed,
        barWidth: 18,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear', x:0, y:0, x2:0, y2:1,
            colorStops: [
              { offset:0, color:'#6c5ce7' },
              { offset:1, color:'#a78bfa' },
            ],
          },
        },
      },
      {
        name: '完成率',
        type: 'line',
        yAxisIndex: 1,
        data: rates,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color:'#10b981', width:2.5 },
        itemStyle: { color:'#10b981' },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 230 }} />;
}

function EmptyChart() {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:230,color:'#a49ebf',fontSize:14 }}>
      📊 持续使用后，生产力趋势将在此展示
    </div>
  );
}
