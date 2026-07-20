/**
 * 人际关系预设标签
 *
 * 直接定义两人之间的双向关系标签（而非从"我"推导）。
 * 分为家庭关系、社交关系、同学关系等类别，支持自定义输入。
 */

export interface RelationPreset {
  label: string;
  category: string;
}

// ── 双向关系预设（两人之间） ──────────────────────────

export const RELATION_PRESETS: RelationPreset[] = [
  // 家庭
  { label: '父子', category: '家庭' },
  { label: '母子', category: '家庭' },
  { label: '父女', category: '家庭' },
  { label: '母女', category: '家庭' },
  { label: '兄弟', category: '家庭' },
  { label: '姐妹', category: '家庭' },
  { label: '兄妹', category: '家庭' },
  { label: '姐弟', category: '家庭' },
  { label: '夫妻', category: '家庭' },
  { label: '祖孙', category: '家庭' },
  // 社交
  { label: '朋友', category: '社交' },
  { label: '对象', category: '社交' },
  { label: '室友', category: '社交' },
  { label: '同事', category: '社交' },
  { label: '导师', category: '社交' },
  // 同学
  { label: '初中同学', category: '同学' },
  { label: '高中同学', category: '同学' },
  { label: '大学同学', category: '同学' },
  { label: '研究生同学', category: '同学' },
  { label: '扬工院', category: '同学' },
  { label: '南航金城', category: '同学' },
  { label: '扬大', category: '同学' },
];

// ── 与"我"的关系标签（用于关联我时选择） ──────────────

export const ME_RELATION_LABELS: RelationPreset[] = [
  // 直系长辈
  { label: '父亲', category: '直系长辈' },
  { label: '母亲', category: '直系长辈' },
  { label: '爷爷', category: '直系长辈' },
  { label: '奶奶', category: '直系长辈' },
  { label: '外公', category: '直系长辈' },
  { label: '外婆', category: '直系长辈' },
  // 平辈
  { label: '哥哥', category: '平辈' },
  { label: '弟弟', category: '平辈' },
  { label: '姐姐', category: '平辈' },
  { label: '妹妹', category: '平辈' },
  // 直系晚辈
  { label: '儿子', category: '直系晚辈' },
  { label: '女儿', category: '直系晚辈' },
  // 姻亲
  { label: '丈夫', category: '姻亲' },
  { label: '妻子', category: '姻亲' },
  // 父系
  { label: '伯伯', category: '父系' },
  { label: '叔叔', category: '父系' },
  { label: '姑姑', category: '父系' },
  { label: '堂哥', category: '父系' },
  { label: '堂弟', category: '父系' },
  { label: '堂姐', category: '父系' },
  { label: '堂妹', category: '父系' },
  // 母系
  { label: '舅舅', category: '母系' },
  { label: '姨妈', category: '母系' },
  { label: '表哥', category: '母系' },
  { label: '表弟', category: '母系' },
  { label: '表姐', category: '母系' },
  { label: '表妹', category: '母系' },
  // 社交
  { label: '朋友', category: '社交' },
  { label: '对象', category: '社交' },
  { label: '室友', category: '社交' },
  { label: '同事', category: '社交' },
  { label: '导师', category: '社交' },
  { label: '学生', category: '社交' },
  // 同学
  { label: '初中同学', category: '同学' },
  { label: '高中同学', category: '同学' },
  { label: '大学同学', category: '同学' },
  { label: '研究生同学', category: '同学' },
  { label: '扬工院', category: '同学' },
  { label: '南航金城', category: '同学' },
  { label: '扬大', category: '同学' },
];

/**
 * 获取所有预设标签（去重）
 */
export function getAllLabels(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of RELATION_PRESETS) {
    if (!seen.has(p.label)) { seen.add(p.label); result.push(p.label); }
  }
  for (const p of ME_RELATION_LABELS) {
    if (!seen.has(p.label)) { seen.add(p.label); result.push(p.label); }
  }
  return result;
}
