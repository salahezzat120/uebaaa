export const COLORS = {
  bg: '#0A0E14',
  bgCard: 'rgba(15, 22, 36, 0.85)',
  bgCardSolid: '#0F1624',
  bgSurface: 'rgba(255,255,255,0.04)',

  accent: '#00D4FF',
  accentGlow: 'rgba(0, 212, 255, 0.3)',
  accentDim: 'rgba(0, 212, 255, 0.15)',

  critical: '#FF3B30',
  criticalGlow: 'rgba(255, 59, 48, 0.3)',
  criticalDim: 'rgba(255, 59, 48, 0.15)',

  high: '#FF9F0A',
  highGlow: 'rgba(255, 159, 10, 0.3)',
  highDim: 'rgba(255, 159, 10, 0.15)',

  medium: '#FFCC00',
  mediumGlow: 'rgba(255, 204, 0, 0.3)',
  mediumDim: 'rgba(255, 204, 0, 0.15)',

  safe: '#34C759',
  safeGlow: 'rgba(52, 199, 89, 0.3)',
  safeDim: 'rgba(52, 199, 89, 0.15)',

  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.55)',
  textMuted: 'rgba(255, 255, 255, 0.3)',

  border: 'rgba(255, 255, 255, 0.08)',
  borderAccent: 'rgba(0, 212, 255, 0.25)',

  tabBar: 'rgba(10, 14, 20, 0.92)',
};

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'safe';

export function getSeverityColor(severity: SeverityLevel) {
  switch (severity) {
    case 'critical': return COLORS.critical;
    case 'high': return COLORS.high;
    case 'medium': return COLORS.medium;
    case 'low': return COLORS.medium;
    case 'safe': return COLORS.safe;
    default: return COLORS.accent;
  }
}

export function getSeverityGlow(severity: SeverityLevel) {
  switch (severity) {
    case 'critical': return COLORS.criticalGlow;
    case 'high': return COLORS.highGlow;
    case 'medium': return COLORS.mediumGlow;
    case 'low': return COLORS.mediumGlow;
    case 'safe': return COLORS.safeGlow;
    default: return COLORS.accentGlow;
  }
}

export default {
  light: {
    text: COLORS.text,
    background: COLORS.bg,
    tint: COLORS.accent,
    tabIconDefault: COLORS.textMuted,
    tabIconSelected: COLORS.accent,
  },
};
