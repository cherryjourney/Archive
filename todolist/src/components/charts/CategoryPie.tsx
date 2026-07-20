import ReactECharts from 'echarts-for-react';
import type { CategoryStat } from '@/types/chart';

interface Props {
  data: CategoryStat[];
}

export default function CategoryPie({ data }: Props) {
  if (data.length === 0) return <EmptyChart />;

  // 只展示有数据的分类
  const filtered = data.filter((d) => d.count > 0);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      type: 'scroll',
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '43%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 3,
          borderColor: '#fff',
          borderWidth: 1.5,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' },
        },
        data: filtered.map((d) => ({
          value: d.count,
          name: d.category_name,
          itemStyle: { color: d.category_color },
        })),
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
      🏷️ 为任务添加分类后，占比将在此展示
    </div>
  );
}
