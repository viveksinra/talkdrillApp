import { Colors } from './Colors';

/**
 * UI Kitten theme mapping for our custom colors
 * This maps our color scheme to UI Kitten's theme variables
 */
export const lightTheme = {
  'color-primary-100': Colors.light.primaryLight + '33', // Light shade with opacity
  'color-primary-200': Colors.light.primaryLight + '66',
  'color-primary-300': Colors.light.primaryLight + '99',
  'color-primary-400': Colors.light.primaryLight,
  'color-primary-500': Colors.light.primary,
  'color-primary-600': Colors.light.primary + 'DD',
  'color-primary-700': Colors.light.primaryDark + 'BB',
  'color-primary-800': Colors.light.primaryDark + '99',
  'color-primary-900': Colors.light.primaryDark,
  
  'color-success-100': Colors.light.primary + '33',
  'color-success-500': Colors.light.primary,
  'color-success-900': Colors.light.primaryDark,
  
  'color-info-100': Colors.light.primary + '33',
  'color-info-500': Colors.light.primary,
  'color-info-900': Colors.light.primaryDark,
  
  'color-warning-100': Colors.light.secondary + '33',
  'color-warning-500': Colors.light.secondary,
  'color-warning-900': Colors.light.secondaryDark,
  
  'color-danger-100': Colors.light.secondaryDark + '33',
  'color-danger-500': Colors.light.secondaryDark,
  'color-danger-900': Colors.light.secondaryDark,
  
  'color-basic-100': Colors.light.background,
  'color-basic-200': Colors.light.surface,
  'color-basic-300': '#E4E9F2',
  'color-basic-400': '#D6E1F1',
  'color-basic-500': '#C7C7C7',
  'color-basic-600': '#8F9BB3',
  'color-basic-700': '#687076', // icon color
  'color-basic-800': '#39424F',
  'color-basic-900': Colors.light.text,
  'color-basic-1000': '#222B45',
  'color-basic-1100': '#151A30',
  
  'background-basic-color-1': Colors.light.background,
  'background-basic-color-2': Colors.light.surface,
  'background-basic-color-3': '#F0F3F5',
  'background-basic-color-4': '#E4E9F2',
  
  'border-basic-color-1': '#E4E9F2',
  'border-basic-color-2': '#D6E1F1',
  'border-basic-color-3': '#C7C7C7',
  'border-basic-color-4': '#8F9BB3',
  'border-basic-color-5': '#39424F',
  
  'text-basic-color': Colors.light.text,
  'text-alternate-color': Colors.light.background,
  'text-hint-color': Colors.light.icon,
  'text-disabled-color': Colors.light.icon + '77',
  
  'text-primary-color': Colors.light.primary,
  'text-success-color': Colors.light.primary,
  'text-info-color': Colors.light.primary,
  'text-warning-color': Colors.light.secondary,
  'text-danger-color': Colors.light.secondaryDark,
};

export const darkTheme = {
  'color-primary-100': Colors.dark.primaryDark + '33',
  'color-primary-200': Colors.dark.primaryDark + '66',
  'color-primary-300': Colors.dark.primaryDark + '99',
  'color-primary-400': Colors.dark.primaryDark,
  'color-primary-500': Colors.dark.primary,
  'color-primary-600': Colors.dark.primary + 'DD',
  'color-primary-700': Colors.dark.primaryLight + 'BB',
  'color-primary-800': Colors.dark.primaryLight + '99',
  'color-primary-900': Colors.dark.primaryLight,
  
  'color-success-100': Colors.dark.primary + '33',
  'color-success-500': Colors.dark.primary,
  'color-success-900': Colors.dark.primaryLight,
  
  'color-info-100': Colors.dark.primary + '33',
  'color-info-500': Colors.dark.primary,
  'color-info-900': Colors.dark.primaryLight,
  
  'color-warning-100': Colors.dark.secondary + '33',
  'color-warning-500': Colors.dark.secondary,
  'color-warning-900': Colors.dark.secondaryLight,
  
  'color-danger-100': Colors.dark.secondaryDark + '33',
  'color-danger-500': Colors.dark.secondaryDark,
  'color-danger-900': Colors.dark.secondaryLight,
  
  'color-basic-100': Colors.dark.background,
  'color-basic-200': Colors.dark.surface,
  'color-basic-300': '#222B45',
  'color-basic-400': '#1A2138',
  'color-basic-500': '#151A30',
  'color-basic-600': '#101426',
  'color-basic-700': Colors.dark.icon,
  'color-basic-800': '#D6E1F1',
  'color-basic-900': Colors.dark.text,
  'color-basic-1000': '#ECEDEE',
  'color-basic-1100': '#FFFFFF',
  
  'background-basic-color-1': Colors.dark.background,
  'background-basic-color-2': Colors.dark.surface,
  'background-basic-color-3': '#303436',
  'background-basic-color-4': '#222B45',
  
  'border-basic-color-1': '#222B45',
  'border-basic-color-2': '#1A2138',
  'border-basic-color-3': '#151A30',
  'border-basic-color-4': '#101426',
  'border-basic-color-5': '#C7C7C7',
  
  'text-basic-color': Colors.dark.text,
  'text-alternate-color': Colors.dark.background,
  'text-hint-color': Colors.dark.icon,
  'text-disabled-color': Colors.dark.icon + '77',
  
  'text-primary-color': Colors.dark.primary,
  'text-success-color': Colors.dark.primary,
  'text-info-color': Colors.dark.primary,
  'text-warning-color': Colors.dark.secondary,
  'text-danger-color': Colors.dark.secondaryDark,
}; 