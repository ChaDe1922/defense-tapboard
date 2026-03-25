/**
 * Phase 9: Design Tokens
 * 
 * Centralized design system tokens for spacing, colors, sizing, and typography.
 * Supports light and dark themes for improved outdoor readability.
 */

// ── Spacing Scale ──────────────────────────────────────────────────

export const spacing = {
  xs: '0.5rem',      // 8px
  sm: '0.75rem',     // 12px
  md: '1rem',        // 16px
  lg: '1.5rem',      // 24px
  xl: '2rem',        // 32px
  '2xl': '3rem',     // 48px
  '3xl': '4rem',     // 64px
};

// ── Touch Target Sizes ─────────────────────────────────────────────

export const touchTarget = {
  min: '44px',       // Minimum recommended touch target
  comfortable: '48px', // Comfortable for one-thumb use
  large: '56px',     // Large, easy to hit
};

// ── Border Radius ──────────────────────────────────────────────────

export const radius = {
  sm: '0.5rem',      // 8px
  md: '0.75rem',     // 12px
  lg: '1rem',        // 16px
  xl: '1.5rem',      // 24px
};

// ── Typography ─────────────────────────────────────────────────────

export const fontSize = {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
};

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// ── Color Palette ──────────────────────────────────────────────────

export const colors = {
  // Brand
  brand: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  
  // Semantic colors
  positive: {
    light: '#10b981',
    dark: '#34d399',
  },
  negative: {
    light: '#ef4444',
    dark: '#f87171',
  },
  warning: {
    light: '#f59e0b',
    dark: '#fbbf24',
  },
  info: {
    light: '#3b82f6',
    dark: '#60a5fa',
  },
};

// ── Theme Definitions ──────────────────────────────────────────────

export const lightTheme = {
  name: 'light',
  
  // Backgrounds
  bg: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Text
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
    disabled: '#cbd5e1',
  },
  
  // Borders
  border: {
    default: '#e2e8f0',
    strong: '#cbd5e1',
    subtle: '#f1f5f9',
  },
  
  // Interactive states
  interactive: {
    default: '#8b5cf6',
    hover: '#7c3aed',
    active: '#6d28d9',
    disabled: '#e2e8f0',
  },
  
  // Status colors
  status: {
    positive: '#10b981',
    negative: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    neutral: '#64748b',
  },
  
  // Component-specific
  chip: {
    default: {
      bg: '#ffffff',
      border: '#cbd5e1',
      text: '#475569',
    },
    active: {
      bg: '#8b5cf6',
      border: '#8b5cf6',
      text: '#ffffff',
    },
    hover: {
      bg: '#f8fafc',
      border: '#94a3b8',
      text: '#0f172a',
    },
  },
  
  card: {
    bg: '#ffffff',
    border: '#e2e8f0',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  },
  
  badge: {
    corrected: {
      bg: '#dbeafe',
      text: '#1e40af',
    },
    deleted: {
      bg: '#fee2e2',
      text: '#991b1b',
    },
    required: {
      bg: '#fef3c7',
      text: '#92400e',
    },
  },
};

export const darkTheme = {
  name: 'dark',
  
  // Backgrounds
  bg: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    elevated: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  
  // Text
  text: {
    primary: '#f1f5f9',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    inverse: '#0f172a',
    disabled: '#475569',
  },
  
  // Borders
  border: {
    default: '#334155',
    strong: '#475569',
    subtle: '#1e293b',
  },
  
  // Interactive states
  interactive: {
    default: '#a78bfa',
    hover: '#c4b5fd',
    active: '#ddd6fe',
    disabled: '#334155',
  },
  
  // Status colors
  status: {
    positive: '#34d399',
    negative: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
    neutral: '#94a3b8',
  },
  
  // Component-specific
  chip: {
    default: {
      bg: '#1e293b',
      border: '#475569',
      text: '#cbd5e1',
    },
    active: {
      bg: '#a78bfa',
      border: '#a78bfa',
      text: '#0f172a',
    },
    hover: {
      bg: '#334155',
      border: '#64748b',
      text: '#f1f5f9',
    },
  },
  
  card: {
    bg: '#1e293b',
    border: '#334155',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)',
  },
  
  badge: {
    corrected: {
      bg: '#1e3a8a',
      text: '#93c5fd',
    },
    deleted: {
      bg: '#7f1d1d',
      text: '#fca5a5',
    },
    required: {
      bg: '#78350f',
      text: '#fcd34d',
    },
  },
};

// ── Animation Durations ────────────────────────────────────────────

export const duration = {
  instant: '0ms',
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
};

// ── Z-Index Scale ──────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  toast: 1300,
};

// ── Shadows ────────────────────────────────────────────────────────

export const shadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
};
