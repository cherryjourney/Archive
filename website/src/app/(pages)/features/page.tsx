'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import SectionTitle from '@/components/SectionTitle';
import { featureGroupIcon } from '@/components/Icons';
import { FEATURE_GROUPS } from '@/lib/data';

export default function FeaturesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  return (
    <div style={{
      background: '#F5F5F7',
      color: '#1D1D1F',
      minHeight: '100vh',
    }}>
      <div style={{ padding: '120px 24px 80px', maxWidth: 860, margin: '0 auto' }}>
        <SectionTitle
          title="全部功能模块"
          subtitle="19 个模块 · 4 大分类 · 覆盖学术到生活"
          dark={false}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {FEATURE_GROUPS.map((group) => {
            const isOpen = expanded === group.id;
            return (
              <div key={group.id}>
                <button
                  onClick={() => toggle(group.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '22px 28px',
                    fontSize: 18, fontWeight: 600, color: '#1D1D1F',
                    fontFamily: 'var(--font-heading), sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', border: 'none',
                    background: isOpen ? '#FFFFFF' : 'transparent',
                    borderRadius: 12,
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {featureGroupIcon(group.icon)}
                    {group.title}
                    <span style={{ color: '#86868B', marginLeft: 8, fontSize: 15, fontWeight: 400 }}>
                      ({group.modules.length})
                    </span>
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <ChevronDown size={18} strokeWidth={1.5} color="#86868B" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      style={{ overflow: 'hidden', padding: '0 28px' }}
                    >
                      <div className="features-module-grid" style={{
                        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 1, padding: '8px 0 24px',
                      }}>
                        {group.modules.map((m) => (
                          <div key={m.name} style={{
                            padding: '20px 24px',
                            background: '#FFFFFF',
                            borderRadius: 10,
                          }}>
                            <div style={{
                              fontSize: 16, fontWeight: 600, color: '#1D1D1F',
                              marginBottom: 4, fontFamily: 'var(--font-heading), sans-serif',
                            }}>
                              {m.name}
                            </div>
                            <div style={{ fontSize: 14, color: '#86868B', lineHeight: 1.6 }}>
                              {m.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
