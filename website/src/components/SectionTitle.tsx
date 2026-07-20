'use client';

import { motion } from 'framer-motion';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  dark?: boolean;
}

export default function SectionTitle({ title, subtitle, dark = false }: SectionTitleProps) {
  const titleColor = dark ? '#F5F5F7' : '#1D1D1F';
  const subColor = dark ? 'rgba(232,236,240,0.55)' : '#86868B';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{ textAlign: 'center', marginBottom: 60 }}
    >
      <h2 style={{
        fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 600, margin: 0,
        fontFamily: 'var(--font-heading), sans-serif',
        color: titleColor,
        letterSpacing: -0.02,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          marginTop: 16, fontSize: 'clamp(17px, 2vw, 21px)',
          color: subColor, fontWeight: 400,
        }}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
