// src/app/constants/colors.ts
export const COLORS = {
  // Brand / Primary
  PRIMARY: '#1890ff',
  PRIMARY_HOVER: '#40a9ff',
  PRIMARY_ACTIVE: '#096dd9',
 
} as const;

export type ColorKey = keyof typeof COLORS;
