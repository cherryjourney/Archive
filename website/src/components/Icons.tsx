import {
  LayoutDashboard,
  Clock,
  BookOpen,
  Wrench,
  Star,
  Monitor,
  Apple,
  Terminal,
} from 'lucide-react';

const SIZE = 24;

export function featureGroupIcon(name: string): React.ReactNode {
  switch (name) {
    case 'LayoutDashboard':
      return <LayoutDashboard size={SIZE} strokeWidth={1.75} color="#1D1D1F" />;
    case 'Clock':
      return <Clock size={SIZE} strokeWidth={1.75} color="#1D1D1F" />;
    case 'BookOpen':
      return <BookOpen size={SIZE} strokeWidth={1.75} color="#1D1D1F" />;
    case 'Wrench':
      return <Wrench size={SIZE} strokeWidth={1.75} color="#1D1D1F" />;
    default:
      return null;
  }
}

export function StarIcon() {
  return <Star size={16} strokeWidth={1.5} color="#86868B" />;
}

export function MonitorIcon() {
  return <Monitor size={48} strokeWidth={1.5} color="#0071E3" />;
}

export function AppleIcon() {
  return <Apple size={48} strokeWidth={1.5} color="#86868B" />;
}

export function TerminalIcon() {
  return <Terminal size={48} strokeWidth={1.5} color="#86868B" />;
}
