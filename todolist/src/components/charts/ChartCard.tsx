import { Card, Skeleton } from 'antd';

interface Props {
  title: string;
  loading?: boolean;
  children: React.ReactNode;
  height?: number;
}

export default function ChartCard({ title, loading, children, height = 280 }: Props) {
  return (
    <Card
      title={title}
      hoverable
      style={{ height }}
      bodyStyle={{ padding: '16px 12px' }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        children
      )}
    </Card>
  );
}
