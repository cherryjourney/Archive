import ReactECharts from 'echarts-for-react';
import type { HeatmapCell } from '@/types/chart';
import { currentYear } from '@/utils/date';
import dayjs from 'dayjs';

interface Props {
  data: HeatmapCell[];
  year?: number;
}

const HEAT_COLORS = ['#ebedf0', '#c5d0f2', '#8fa3eb', '#5c7cfa', '#3b5bdb'];

export default function MonthlyHeatmap({ data, year = currentYear() }: Props) {
  // 生成全年 365 天的数据映射
  const dataMap = new Map<string, number>();
  data.forEach((d) => dataMap.set(d.date, d.count));

  // ECharts 日历热力图
  const option = {
    tooltip: {
      position: 'top',
      formatter: (p: { value: [string, number] }) =>
        `${p.value[0]}<br/>完成任务: ${p.value[1]}`,
    },
    visualMap: {
      min: 0,
      max: Math.max(10, ...data.map((d) => d.count)),
      type: 'piecewise',
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      pieces: [
        { min: 0, max: 0, label: '无', color: HEAT_COLORS[0] },
        { min: 1, max: 2, label: '少量', color: HEAT_COLORS[1] },
        { min: 3, max: 5, label: '中等', color: HEAT_COLORS[2] },
        { min: 6, max: 9, label: '较多', color: HEAT_COLORS[3] },
        { min: 10, label: '很多', color: HEAT_COLORS[4] },
      ],
    },
    calendar: {
      top: 20,
      left: 30,
      right: 30,
      cellSize: ['auto', 15],
      range: `${year}-01-01`,
      dayLabel: { nameMap: ['日', '一', '二', '三', '四', '五', '六'] },
      monthLabel: { nameMap: 'cn' },
      itemStyle: {
        borderWidth: 3,
        borderColor: '#fff',
        borderRadius: 2,
      },
      yearLabel: { show: true },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: Array.from(dataMap.entries()).map(([date, count]) => [date, count]),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 230 }} />;
}
