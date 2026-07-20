import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Card, Tag, Button, Space, Modal, Input, DatePicker, Progress, Empty, List, message, Select, Spin } from 'antd';
import { PlusOutlined, ClockCircleOutlined, BookOutlined, DeleteOutlined, BellOutlined, CheckCircleFilled, EditOutlined, LaptopOutlined, FileTextOutlined, UnorderedListOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { courseService, type Course, type Assignment } from '@/services/courseService';

const { Text, Title } = Typography;

const COURSE_COLORS = ['#2563EB', '#3B82F6', '#059669', '#f59e0b', '#ec4899', '#06b6d4'];

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [courseModal, setCourseModal] = useState(false);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', instructor: '', schedule: '', location: '' });
  const [newAssignment, setNewAssignment] = useState({ courseId: '', title: '', dueDate: '', type: 'homework' as const });

  // Mount: load from SQLite
  useEffect(() => {
    (async () => {
      try {
        const courseList = await courseService.listCourses();
        const assignmentList = await courseService.listAssignments();
        setCourses(courseList);
        setAssignments(assignmentList);
      } catch (e) {
        message.error('加载课程数据失败');
      }
      setLoading(false);
    })();
  }, []);

  const refreshCourses = useCallback(async () => {
    setCourses(await courseService.listCourses());
  }, []);

  const refreshAssignments = useCallback(async () => {
    setAssignments(await courseService.listAssignments());
  }, []);

  const addCourse = async () => {
    if (!newCourse.name) return;
    const course: Course = {
      id: Date.now().toString(),
      ...newCourse,
      color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
    };
    await courseService.createCourse(course);
    setNewCourse({ name: '', instructor: '', schedule: '', location: '' });
    setCourseModal(false);
    refreshCourses();
  };

  const removeCourse = async (id: string) => {
    await courseService.deleteCourse(id);
    refreshCourses();
    refreshAssignments();
  };

  const addAssignment = async () => {
    if (!newAssignment.title || !newAssignment.courseId) return;
    const a: Assignment = {
      id: Date.now().toString(),
      course_id: newAssignment.courseId,
      title: newAssignment.title,
      due_date: newAssignment.dueDate,
      type: newAssignment.type,
      done: false,
    };
    await courseService.createAssignment(a);
    setNewAssignment({ courseId: '', title: '', dueDate: '', type: 'homework' });
    setAssignmentModal(false);
    refreshAssignments();
  };

  const toggleDone = async (a: Assignment) => {
    const updated = { ...a, done: !a.done };
    await courseService.updateAssignment(updated);
    refreshAssignments();
  };

  const calcUrgency = (dueDate: string) => {
    const days = dayjs(dueDate).diff(dayjs(), 'day');
    if (days < 0) return { label: '已过期', color: 'red' as const };
    if (days <= 1) return { label: `${days === 0 ? '今天' : '明天'}截止`, color: 'red' as const };
    if (days <= 3) return { label: `${days}天后`, color: 'orange' as const };
    if (days <= 7) return { label: `${days}天后`, color: 'blue' as const };
    return { label: `${days}天后`, color: 'default' as const };
  };

  const enrichedAssignments = useMemo(() =>
    [...assignments]
      .sort((a, b) => dayjs(a.due_date).diff(dayjs(b.due_date)))
      .map((a) => ({ ...a, urgency: calcUrgency(a.due_date) })),
    [assignments],
  );

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
        <div>
          <div style={{ fontSize:24,fontWeight:700,color:'var(--text-primary)' }}><BookOutlined style={{ marginRight: 8 }} />课程管理</div>
          <Text style={{ color:'var(--text-muted)',fontSize:13 }}>课程表 + 作业截止日 + 考试倒计时</Text>
        </div>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setAssignmentModal(true)} style={{ borderRadius:10 }}>添加作业/考试</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCourseModal(true)}
            style={{ background:'linear-gradient(135deg,#2563EB,#3B82F6)',border:'none',borderRadius:10,fontWeight:600 }}>
            添加课程
          </Button>
        </Space>
      </div>

      {/* Course Cards */}
      {courses.length === 0 ? (
        <div className="glass-card" style={{ padding:40,textAlign:'center',marginBottom:14 }}>
          <Empty description="暂无课程，点击「添加课程」开始" />
        </div>
      ) : (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14,marginBottom:20 }}>
          {courses.map(c => {
            const courseAssignments = assignments.filter(a => a.course_id === c.id && !a.done);
            return (
              <div key={c.id} className="glass-card" style={{ padding:16,borderLeft:`4px solid ${c.color}` }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:600,fontSize:15,color:'var(--text-primary)' }}>{c.name}</div>
                    <Text style={{ fontSize:12,color:'var(--text-muted)' }}>{c.instructor}</Text>
                  </div>
                  <DeleteOutlined style={{ color:'var(--text-muted)',cursor:'pointer' }}
                    onClick={() => removeCourse(c.id)} />
                </div>
                <div style={{ marginTop:10,fontSize:12,color:'var(--text-secondary)',lineHeight:2 }}>
                  <div><ClockCircleOutlined style={{ marginRight:6,color:c.color }} />{c.schedule || '时间未定'}</div>
                  <div><BookOutlined style={{ marginRight:6,color:c.color }} />{c.location || '地点未定'}</div>
                </div>
                {courseAssignments.length > 0 && (
                  <Tag style={{ marginTop:8,borderRadius:6 }} color="orange">
                    {courseAssignments.length} 项待完成
                  </Tag>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assignments List */}
      <div className="glass-card" style={{ padding:16 }}>
        <div style={{ fontSize:16,fontWeight:600,color:'var(--text-primary)',marginBottom:12 }}>
          <UnorderedListOutlined style={{ marginRight: 6 }} />作业 & 考试
        </div>
        {enrichedAssignments.length === 0 ? (
          <Empty description="暂无作业或考试" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          enrichedAssignments.map(a => {
            const course = courses.find(c => c.id === a.course_id);
            const { urgency } = a;
            return (
              <div key={a.id} style={{
                display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
                borderRadius:10,marginBottom:6,cursor:'pointer',
                background: a.done ? 'rgba(5,150,105,0.04)' : 'var(--bg-card)',
                border: a.done ? '1px solid rgba(5,150,105,0.15)' : '1px solid var(--border-subtle)',
                transition:'all 0.2s',
              }} onClick={() => toggleDone(a)}>
                <span style={{ fontSize:18 }}>{a.done ? <CheckCircleFilled style={{ color: '#059669' }} /> : a.type === 'exam' ? <EditOutlined /> : a.type === 'project' ? <LaptopOutlined /> : <FileTextOutlined />}</span>
                <div style={{ flex:1 }}>
                  <div className={a.done ? 'task-completed' : ''} style={{ fontWeight:500,fontSize:14 }}>
                    {a.title}
                  </div>
                  <Text style={{ fontSize:12,color:'var(--text-muted)' }}>
                    {course?.name || '未知课程'} · 截止 {a.due_date}
                  </Text>
                </div>
                <Tag color={urgency.color} style={{ borderRadius:6,margin:0 }}>{urgency.label}</Tag>
                <Text style={{ fontSize:12,color:'var(--text-muted)' }}>
                  {Math.max(0, dayjs(a.due_date).diff(dayjs(), 'day'))} 天
                </Text>
              </div>
            );
          })
        )}
      </div>

      {/* Add Course Modal */}
      <Modal title="添加课程" open={courseModal} onOk={addCourse} onCancel={()=>setCourseModal(false)} okText="添加" cancelText="取消">
        <Space direction="vertical" style={{ width:'100%' }}>
          <Input placeholder="课程名称（如：高级算法）" value={newCourse.name} onChange={e=>setNewCourse({...newCourse,name:e.target.value})} />
          <Input placeholder="授课教师" value={newCourse.instructor} onChange={e=>setNewCourse({...newCourse,instructor:e.target.value})} />
          <Input placeholder="上课时间（如：周一 14:00-16:30）" value={newCourse.schedule} onChange={e=>setNewCourse({...newCourse,schedule:e.target.value})} />
          <Input placeholder="上课地点（如：教学楼A301）" value={newCourse.location} onChange={e=>setNewCourse({...newCourse,location:e.target.value})} />
        </Space>
      </Modal>

      {/* Add Assignment Modal */}
      <Modal title="添加作业/考试" open={assignmentModal} onOk={addAssignment} onCancel={()=>setAssignmentModal(false)} okText="添加" cancelText="取消">
        <Space direction="vertical" style={{ width:'100%' }}>
          <Select
            value={newAssignment.courseId || undefined}
            onChange={(v) => setNewAssignment({ ...newAssignment, courseId: v })}
            style={{ width: '100%' }}
            placeholder="选择课程"
            options={courses.map(c => ({ value: c.id, label: c.name }))}
          />
          <Input placeholder="作业/考试名称" value={newAssignment.title} onChange={e=>setNewAssignment({...newAssignment,title:e.target.value})} />
          <DatePicker placeholder="截止日期" onChange={d=>d&&setNewAssignment({...newAssignment,dueDate:d.format('YYYY-MM-DD')})} style={{ width:'100%' }} />
          <Select
            value={newAssignment.type}
            onChange={(v) => setNewAssignment({ ...newAssignment, type: v as any })}
            style={{ width: '100%' }}
            options={[
              { value: 'homework', label: <span><FileTextOutlined /> 作业</span> },
              { value: 'exam', label: <span><EditOutlined /> 考试</span> },
              { value: 'project', label: <span><LaptopOutlined /> 项目</span> },
            ]}
          />
        </Space>
      </Modal>
    </div>
  );
}
