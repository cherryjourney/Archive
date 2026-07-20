import type { ThemeConfig } from 'antd';

/**
 * Archive · 存迹 — Ant Design 主题配置
 * 配色: Cobalt Blue #2563EB + Emerald #059669
 * 双模式兼容：通过 CSS 变量覆盖实现 light/dark 切换
 * 圆角: 16-24px 现代 SaaS 风格
 */

const theme: ThemeConfig = {
  token: {
    // ── Brand Colors ──
    colorPrimary: '#2563EB',
    colorInfo: '#3B82F6',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#DC2626',

    // ── Typography ──
    fontFamily: "'Atkinson Hyperlegible','Microsoft YaHei','PingFang SC','Noto Sans SC',sans-serif",
    fontSize: 14,
    fontSizeHeading1: 34,
    fontSizeHeading2: 28,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    lineHeight: 1.6,

    // ── Radius — modern SaaS scale ──
    borderRadius: 16,
    borderRadiusLG: 24,
    borderRadiusSM: 10,
    borderRadiusXS: 8,

    // ── Surfaces ──
    colorBgContainer: 'rgba(255,255,255,0.72)',
    colorBgElevated: 'rgba(255,255,255,0.95)',
    colorBgLayout: 'transparent',
    colorBgSpotlight: 'rgba(15,23,42,0.94)',

    // ── Borders ──
    colorBorder: 'rgba(0,0,0,0.06)',
    colorBorderSecondary: 'rgba(0,0,0,0.04)',

    // ── Text ──
    colorText: '#0F172A',
    colorTextSecondary: '#475569',
    colorTextTertiary: '#94A3B8',
    colorTextQuaternary: '#CBD5E1',

    // ── Fill — blue tint ──
    colorFill: 'rgba(37,99,235,0.06)',
    colorFillSecondary: 'rgba(37,99,235,0.03)',
    colorFillTertiary: 'rgba(37,99,235,0.02)',
    colorFillQuaternary: 'rgba(37,99,235,0.01)',

    // ── Shadows — softer diffusion ──
    boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 6px 20px rgba(0,0,0,0.03)',
    boxShadowSecondary: '0 4px 24px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.03)',

    // ── Controls ──
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
    paddingContentHorizontal: 20,
    paddingContentVertical: 10,
    lineWidth: 1,
    lineType: 'solid',

    // ── Motion ──
    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.15s',
    motionEaseInOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },

  components: {
    // ── Buttons ──
    Button: {
      borderRadius: 12,
      borderRadiusLG: 14,
      borderRadiusSM: 10,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      paddingContentHorizontal: 20,
      paddingContentHorizontalLG: 24,
      paddingContentHorizontalSM: 14,
      fontWeight: 500,
      primaryShadow: '0 2px 8px rgba(37,99,235,0.18)',
    },

    // ── Cards ──
    Card: {
      borderRadiusLG: 22,
      paddingLG: 24,
      padding: 20,
      boxShadowTertiary: '0 1px 3px rgba(0,0,0,0.03), 0 6px 20px rgba(0,0,0,0.03)',
    },

    // ── Inputs ──
    Input: {
      borderRadius: 12,
      borderRadiusLG: 14,
      borderRadiusSM: 10,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      paddingInline: 16,
      activeShadow: '0 0 0 2px rgba(37,99,235,0.10)',
    },

    // ── Selects ──
    Select: {
      borderRadius: 12,
      borderRadiusLG: 14,
      borderRadiusSM: 10,
      controlHeight: 40,
      optionSelectedBg: 'rgba(37,99,235,0.08)',
      optionActiveBg: 'rgba(37,99,235,0.04)',
    },

    // ── Menu (Sidebar) ──
    Menu: {
      itemBorderRadius: 12,
      itemHeight: 44,
      iconSize: 20,
      itemColor: '#475569',
      itemHoverColor: '#2563EB',
      itemHoverBg: 'rgba(37,99,235,0.06)',
      itemSelectedColor: '#2563EB',
      itemSelectedBg: 'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(59,130,246,0.05))',
      itemActiveBg: 'rgba(37,99,235,0.04)',
      subMenuItemBg: 'transparent',
    },

    // ── Tables ──
    Table: {
      borderRadius: 18,
      borderRadiusLG: 22,
      headerBg: 'rgba(37,99,235,0.04)',
      headerColor: '#475569',
      headerSplitColor: 'rgba(0,0,0,0.04)',
      rowHoverBg: 'rgba(37,99,235,0.03)',
      rowSelectedBg: 'rgba(37,99,235,0.06)',
      rowSelectedHoverBg: 'rgba(37,99,235,0.08)',
      borderColor: 'rgba(0,0,0,0.04)',
    },

    // ── Tags ──
    Tag: {
      borderRadiusSM: 8,
      defaultBg: 'rgba(37,99,235,0.06)',
      defaultColor: '#2563EB',
    },

    // ── Modals ──
    Modal: {
      borderRadiusLG: 24,
      titleFontSize: 20,
      titleLineHeight: 1.4,
    },

    // ── Segmented ──
    Segmented: {
      borderRadius: 12,
      itemSelectedBg: 'rgba(37,99,235,0.10)',
      itemActiveBg: 'rgba(37,99,235,0.04)',
      itemColor: '#475569',
      itemSelectedColor: '#2563EB',
      trackBg: 'rgba(37,99,235,0.05)',
    },

    // ── Tooltip ──
    Tooltip: {
      borderRadius: 10,
      colorBgSpotlight: 'rgba(15,23,42,0.94)',
    },

    // ── Dropdown ──
    Dropdown: {
      borderRadius: 12,
      paddingBlock: 8,
      controlPaddingHorizontal: 16,
    },

    // ── Tabs ──
    Tabs: {
      itemColor: '#475569',
      itemHoverColor: '#2563EB',
      itemSelectedColor: '#2563EB',
      itemActiveColor: '#2563EB',
      inkBarColor: '#2563EB',
      titleFontSize: 14,
    },

    // ── Progress ──
    Progress: {
      defaultColor: '#2563EB',
      remainingColor: 'rgba(37,99,235,0.08)',
      borderRadius: 6,
    },

    // ── Slider ──
    Slider: {
      trackBg: '#2563EB',
      trackHoverBg: '#1D4ED8',
      handleColor: '#2563EB',
      handleActiveColor: '#1D4ED8',
      dotActiveBorderColor: '#2563EB',
      railBg: 'rgba(37,99,235,0.10)',
    },
  },
};

export default theme;
