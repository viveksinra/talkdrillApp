const primary = '#2196F3';      // Blue
const primaryLight = '#64B5F6';
const primaryDark = '#1976D2';

const secondary = '#FF9800';    // Orange
const secondaryLight = '#FFB74D';
const secondaryDark = '#F57C00';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    primary,
    primaryLight,
    primaryDark,
    secondary,
    secondaryLight,
    secondaryDark,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    surface: '#1E2324',
    primary: primaryLight,
    primaryLight: primary,
    primaryDark,
    secondary: secondaryLight,
    secondaryLight: secondary,
    secondaryDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryLight,
  },
};