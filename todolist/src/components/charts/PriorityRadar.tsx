import ReactECharts from 'echarts-for-react';
import type { PriorityStat } from '@/types/chart';

interface Props {
  data: PriorityStat[];
}

export default function PriorityRadar({ data }: Props) {
  if (data.length === 0) return <EmptyChart />;

  const indicator = data.map(d => ({ name: d.label, max: Math.max(d.count * 1.5, 10) }));

  const option = {
    tooltip: {},
    legend: {
      bottom: 0,
      data: ['任务数量'],
    },
    radar: {
      center: ['50%', '45%'],
      radius: '65%',
      indicator,
      axisName: { color: '#6b658b', fontSize: 12 },
    },
    series: [{
      type: 'radar',
      data: [{
        value: data.map(d => d.count),
        name: '任务数量',
        areaStyle: { color: 'rgba(108,92,231,0.25)' },
        lineStyle: { color: '#6c5ce7', width: 2 },
        itemStyle: { color: '#6c5ce7' },
      }],
    }],
  };

  return <ReactECharts option={option} style={{ height: 230 }} />;
}

function EmptyChart() {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:230,color:'#a49ebf',fontSize:14 }}>
      🎯 分配优先级后，分布将在此展示
    </div>
  );
}
