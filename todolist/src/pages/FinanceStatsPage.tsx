import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useFinanceStore } from '@/stores/financeStore';
import ReactECharts from 'echarts-for-react';
import { Button, Select, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

const Page: React.FC = () => {
  const { currentYear, currentMonth, monthlyChart, categoryStats, heatmap, netWorthTrend, fetchCharts, fetchAll, setMonth } = useFinanceStore();
  const [chartYear, setChartYear] = useState(currentYear);

  useEffect(() => {
    fetchCharts(chartYear, currentMonth);
  }, [chartYear, currentMonth]);

  // 月度收支柱状图
  const barOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['支出', '收入'] },
    xAxis: { type: 'category' as const, data: monthlyChart.map((d) => d.month.substring(5) + '月') },
    yAxis: { type: 'value' as const },
    series: [
      { name: '支出', type: 'bar', data: monthlyChart.map((d) => d.expense), color: '#DC2626' },
      { name: '收入', type: 'bar', data: monthlyChart.map((d) => d.income), color: '#059669' },
    ],
  };

  // 分类饼图（>6 时切换玫瑰图）
  const pieOption = {
    tooltip: { trigger: 'item' as const },
    legend: { type: 'scroll' as const, orient: 'vertical' as const, right: 10 },
    series: [{
      type: 'pie',
      radius: categoryStats.filter((d) => d.total > 0).length > 6 ? ['20%', '70%'] : '60%',
      center: ['40%', '50%'],
      data: categoryStats.filter((d) => d.total > 0).map((d) => ({
        name: d.category_name,
        value: d.total,
        itemStyle: { color: d.category_color },
      })),
      label: { formatter: '{b}: ¥{c}' },
    }],
  };

  // 净资产折线图
  const lineOption = {
    tooltip: { trigger: 'axis' as const },
    xAxis: { type: 'category' as const, data: netWorthTrend.map((d) => d.month.substring(5) + '月') },
    yAxis: { type: 'value' as const },
    series: [{
      name: '净资产', type: 'line', data: netWorthTrend.map((d) => d.net_worth),
      smooth: true, color: '#2563EB',
      areaStyle: { color: 'rgba(37,99,235,0.1)' },
    }],
  };

  // CSV 导出
  const exportCSV = async () => {
    const { transactions, categories, accounts } = useFinanceStore.getState();
    const lines = ['日期,类型,分类,账户,金额,备注'];
    transactions.forEach((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const acc = accounts.find((a) => a.id === t.account_id);
      lines.push(`${t.date},${t.type},${cat?.name ?? ''},${acc?.name ?? ''},${t.amount},${t.note}`);
    });
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `记账导出_${currentYear}-${String(currentMonth).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('CSV 已导出');
  };

  // Markdown 导出
  const exportMD = async () => {
    const { transactions, categories, accounts, stats } = useFinanceStore.getState();
    let md = `# 记账报告 ${currentYear}年${currentMonth}月\n\n`;
    md += `## 月度汇总\n`;
    md += `- 支出：¥${stats?.monthly_expense.toFixed(2) ?? '0.00'}（${stats?.expense_count ?? 0} 笔）\n`;
    md += `- 收入：¥${stats?.monthly_income.toFixed(2) ?? '0.00'}（${stats?.income_count ?? 0} 笔）\n`;
    md += `- 存款总额：¥${stats?.savings_total.toFixed(2) ?? '0.00'}\n`;
    md += `- 净资产：¥${stats?.net_worth.toFixed(2) ?? '0.00'}\n\n`;
    md += `## 分类汇总\n`;
    categoryStats.filter((d) => d.total > 0).forEach((d) => {
      md += `- ${d.category_name}：¥${d.total.toFixed(2)}（${d.count} 笔）\n`;
    });
    md += `\n## 交易明细\n`;
    transactions.forEach((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      md += `- ${t.date} ${t.type === 'expense' ? '支出' : '收入'} ${cat?.name ?? ''} ¥${t.amount.toFixed(2)} ${t.note}\n`;
    });
    const blob = new Blob(['﻿' + md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `记账报告_${currentYear}-${String(currentMonth).padStart(2, '0')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Markdown 已导出');
  };

  return (
    <div style={{ height: '100%', padding: 24, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>统计分析</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select value={chartYear} onChange={setChartYear} style={{ width: 100 }}>
            {Array.from({ length: 5 }, (_, i) => dayjs().year() - i).map((y) => (
              <Select.Option key={y} value={y}>{y}年</Select.Option>
            ))}
          </Select>
          <Button icon={<DownloadOutlined />} onClick={exportCSV}>CSV</Button>
          <Button icon={<DownloadOutlined />} onClick={exportMD}>Markdown</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>月度收支</h3>
          <ReactECharts option={barOption} style={{ height: 300 }} />
        </div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>分类占比</h3>
          <ReactECharts option={pieOption} style={{ height: 300 }} />
        </div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16, gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>净资产趋势</h3>
          <ReactECharts option={lineOption} style={{ height: 250 }} />
        </div>
      </div>
    </div>
  );
};

export default Page;
