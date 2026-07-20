import { useState, useEffect } from 'react';
import { Card, Typography, Statistic, Row, Col, Progress, Input, Space, Divider } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import type { DailyPlan } from '@/types/plan';
import StarRating from '@/components/common/StarRating';
import EmptyState from '@/components/common/EmptyState';
import { usePlanStore } from '@/stores/planStore';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Props {
  plan: DailyPlan;
}

export default function EveningPanel({ plan }: Props) {
  const { updateEveningReview } = usePlanStore();
  const [reviewMd, setReviewMd] = useState(plan.evening_review_md || '');
  const [notes, setNotes] = useState(plan.notes || '');

  useEffect(() => {
    setReviewMd(plan.evening_review_md || '');
    setNotes(plan.notes || '');
  }, [plan.id]);

  const completedCount = plan.tasks.filter((pt) => pt.task.status === 'completed').length;
  const totalCount = plan.tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalEstimated = plan.tasks.reduce((sum, pt) => sum + (pt.task.estimated_minutes || 0), 0);
  const totalActual = plan.tasks.reduce((sum, pt) => sum + (pt.task.actual_minutes || 0), 0);

  const handleSaveReview = () => {
    updateEveningReview({
      evening_review_md: reviewMd,
      notes: notes,
      efficiency_rating: plan.efficiency_rating,
      mood_rating: plan.mood_rating,
    });
  };

  if (totalCount === 0) {
    return <EmptyState description="今天还没有任务，去上午面板规划吧！" />;
  }

  return (
    <div>
      {/* 完成统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="完成率"
              value={completionPercent}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#69db7c' }} />}
              valueStyle={{ color: completionPercent === 100 ? '#69db7c' : '#4c6ef5', fontWeight: 700, fontSize: 28 }}
            />
            <Progress percent={completionPercent} showInfo={false} strokeColor="#69db7c" size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="完成任务"
              value={completedCount}
              suffix={`/ ${totalCount}`}
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="预估耗时"
              value={totalEstimated > 0 ? `${totalEstimated}分钟` : '--'}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="实际耗时"
              value={totalActual > 0 ? `${totalActual}分钟` : '--'}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontSize: 20, color: totalActual > totalEstimated ? '#ff7f7f' : '#69db7c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 评价 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>⚡ 今日效率：</Text>
            <StarRating
              value={plan.efficiency_rating}
              onChange={(v) => updateEveningReview({ efficiency_rating: v })}
            />
          </div>
          <div>
            <Text strong>😊 今日心情：</Text>
            <StarRating
              value={plan.mood_rating}
              onChange={(v) => updateEveningReview({ mood_rating: v })}
            />
          </div>
        </Space>
      </Card>

      {/* 复盘笔记 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Title level={5}>📝 今日复盘</Title>
        <TextArea
          value={reviewMd}
          onChange={(e) => setReviewMd(e.target.value)}
          onBlur={handleSaveReview}
          placeholder="今天完成了什么？遇到了什么问题？学到了什么？明天需要改进什么？"
          rows={4}
          style={{ marginBottom: 12 }}
        />
        <Divider />
        <Title level={5}>🗒️ 杂记随想</Title>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveReview}
          placeholder="记录今天的灵感、想法、待跟进事项…"
          rows={3}
        />
      </Card>

      {/* 任务明细 */}
      <Card size="small" title={`今日任务明细 (${totalCount})`}>
        {plan.tasks.map((pt) => (
          <div
            key={pt.task_id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Space>
              <span style={{ color: pt.task.status === 'completed' ? '#69db7c' : '#ff7f7f' }}>
                {pt.task.status === 'completed' ? '✅' : '❌'}
              </span>
              <span className={pt.task.status === 'completed' ? 'task-completed' : ''}>
                {pt.task.title}
              </span>
            </Space>
            <Space>
              {pt.task.estimated_minutes && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  预估 {pt.task.estimated_minutes}分钟
                  {pt.task.actual_minutes && ` / 实际 ${pt.task.actual_minutes}分钟`}
                </Text>
              )}
            </Space>
          </div>
        ))}
      </Card>
    </div>
  );
}
