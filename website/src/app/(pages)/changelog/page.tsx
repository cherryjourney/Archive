'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionTitle from '@/components/SectionTitle';
import { VERSIONS } from '@/lib/data';

export default function ChangelogPage() {
  const [expandedYear, setExpandedYear] = useState<string | null>(VERSIONS[0].year);

  const toggleYear = (year: string) => setExpandedYear(expandedYear === year ? null : year);

  return (
    <div style={{
      background: '#FFFFFF',
      color: '#1D1D1F',
      minHeight: '100vh',
    }}>
      <div style={{ padding: '120px 24px 80px', maxWidth: 760, margin: '0 auto' }}>
        <SectionTitle title="更新日志" dark={false} />

        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 11, top: 0, bottom: 0,
            width: 2, background: 'rgba(0,0,0,0.08)',
          }} />

          {VERSIONS.map((group) => {
            const isOpen = expandedYear === group.year;
            return (
              <div key={group.year} style={{ position: 'relative', marginBottom: 24, paddingLeft: 36 }}>
                <button
                  onClick={() => toggleYear(group.year)}
                  style={{
                    position: 'absolute', left: 0, top: 4,
                    width: 24, height: 24, borderRadius: '50%',
                    border: '2px solid #0071E3',
                    background: isOpen ? '#0071E3' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    zIndex: 1,
                  }}
                />

                <button
                  onClick={() => toggleYear(group.year)}
                  style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-heading), sans-serif',
                    fontSize: 18, fontWeight: 700, color: '#1D1D1F',
                    padding: 0, marginBottom: isOpen ? 16 : 0,
                  }}
                >
                  {group.year}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {group.versions.map((v) => (
                          <div key={v.version} style={{
                            padding: '16px 22px',
                            background: '#F5F5F7',
                            borderRadius: 12,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{
                                fontSize: 14, fontWeight: 600, color: '#0071E3',
                                background: 'rgba(0,113,227,0.1)',
                                padding: '2px 8px', borderRadius: 6,
                                fontFamily: 'var(--font-mono), monospace',
                              }}>
                                {v.version}
                              </span>
                              <span style={{ fontSize: 13, color: '#86868B' }}>{v.date}</span>
                            </div>
                            <div style={{ fontSize: 15, color: '#86868B', lineHeight: 1.6 }}>{v.changes}</div>
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
