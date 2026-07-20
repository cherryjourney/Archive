export interface Stat {
  value: number;
  suffix: string;
  label: string;
  labelEn: string;
}

export const stats: Stat[] = [
  { value: 20, suffix: "+", label: "功能模块", labelEn: "Modules" },
  { value: 5, suffix: " 年", label: "迭代打磨", labelEn: "Years" },
  { value: 100, suffix: "%", label: "本地离线", labelEn: "Offline" },
  { value: 0, suffix: "", label: "完全免费", labelEn: "Free" },
];
