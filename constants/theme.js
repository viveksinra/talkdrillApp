import { ColorsConstant } from './ColorsConstant';

/**
 * UI Kitten theme mapping for our custom colors
 * This maps our color scheme to UI Kitten's theme variables
 */
export const lightTheme = {
  'color-primary-100': ColorsConstant.light.primaryLight + '33', // Light shade with opacity
  'color-primary-200': ColorsConstant.light.primaryLight + '66',
  'color-primary-300': ColorsConstant.light.primaryLight + '99',
  'color-primary-400': ColorsConstant.light.primaryLight,
  'color-primary-500': ColorsConstant.light.primary,
  'color-primary-600': ColorsConstant.light.primary + 'DD',
  'color-primary-700': ColorsConstant.light.primaryDark + 'BB',
  'color-primary-800': ColorsConstant.light.primaryDark + '99',
  'color-primary-900': ColorsConstant.light.primaryDark,
  
  'color-success-100': ColorsConstant.light.primary + '33',
  'color-success-500': ColorsConstant.light.primary,
  'color-success-900': ColorsConstant.light.primaryDark,
  
  'color-info-100': ColorsConstant.light.primary + '33',
  'color-info-500': ColorsConstant.light.primary,
  'color-info-900': ColorsConstant.light.primaryDark,
  
  'color-warning-100': ColorsConstant.light.secondary + '33',
  'color-warning-500': ColorsConstant.light.secondary,
  'color-warning-900': ColorsConstant.light.secondaryDark,
  
  'color-danger-100': ColorsConstant.light.secondaryDark + '33',
  'color-danger-500': ColorsConstant.light.secondaryDark,
  'color-danger-900': ColorsConstant.light.secondaryDark,
  
  'color-basic-100': ColorsConstant.light.background,
  'color-basic-200': ColorsConstant.light.surface,
  'color-basic-300': '#E4E9F2',
  'color-basic-400': '#D6E1F1',
  'color-basic-500': '#C7C7C7',
  'color-basic-600': '#8F9BB3',
  'color-basic-700': '#687076', // icon color
  'color-basic-800': '#39424F',
  'color-basic-900': ColorsConstant.light.text,
  'color-basic-1000': '#222B45',
  'color-basic-1100': '#151A30',
  
  'background-basic-color-1': ColorsConstant.light.background,
  'background-basic-color-2': ColorsConstant.light.surface,
  'background-basic-color-3': '#F0F3F5',
  'background-basic-color-4': '#E4E9F2',
  
  'border-basic-color-1': '#E4E9F2',
  'border-basic-color-2': '#D6E1F1',
  'border-basic-color-3': '#C7C7C7',
  'border-basic-color-4': '#8F9BB3',
  'border-basic-color-5': '#39424F',
  
  'text-basic-color': ColorsConstant.light.text,
  'text-alternate-color': ColorsConstant.light.background,
  'text-hint-color': ColorsConstant.light.icon,
  'text-disabled-color': ColorsConstant.light.icon + '77',
  
  'text-primary-color': ColorsConstant.light.primary,
  'text-success-color': ColorsConstant.light.primary,
  'text-info-color': ColorsConstant.light.primary,
  'text-warning-color': ColorsConstant.light.secondary,
  'text-danger-color': ColorsConstant.light.secondaryDark,
};

export const darkTheme = {
  'color-primary-100': ColorsConstant.dark.primaryDark + '33',
  'color-primary-200': ColorsConstant.dark.primaryDark + '66',
  'color-primary-300': ColorsConstant.dark.primaryDark + '99',
  'color-primary-400': ColorsConstant.dark.primaryDark,
  'color-primary-500': ColorsConstant.dark.primary,
  'color-primary-600': ColorsConstant.dark.primary + 'DD',
  'color-primary-700': ColorsConstant.dark.primaryLight + 'BB',
  'color-primary-800': ColorsConstant.dark.primaryLight + '99',
  'color-primary-900': ColorsConstant.dark.primaryLight,
  
  'color-success-100': ColorsConstant.dark.primary + '33',
  'color-success-500': ColorsConstant.dark.primary,
  'color-success-900': ColorsConstant.dark.primaryLight,
  
  'color-info-100': ColorsConstant.dark.primary + '33',
  'color-info-500': ColorsConstant.dark.primary,
  'color-info-900': ColorsConstant.dark.primaryLight,
  
  'color-warning-100': ColorsConstant.dark.secondary + '33',
  'color-warning-500': ColorsConstant.dark.secondary,
  'color-warning-900': ColorsConstant.dark.secondaryLight,
  
  'color-danger-100': ColorsConstant.dark.secondaryDark + '33',
  'color-danger-500': ColorsConstant.dark.secondaryDark,
  'color-danger-900': ColorsConstant.dark.secondaryLight,
  
  'color-basic-100': ColorsConstant.dark.background,
  'color-basic-200': ColorsConstant.dark.surface,
  'color-basic-300': '#222B45',
  'color-basic-400': '#1A2138',
  'color-basic-500': '#151A30',
  'color-basic-600': '#101426',
  'color-basic-700': ColorsConstant.dark.icon,
  'color-basic-800': '#D6E1F1',
  'color-basic-900': ColorsConstant.dark.text,
  'color-basic-1000': '#ECEDEE',
  'color-basic-1100': '#FFFFFF',
  
  'background-basic-color-1': ColorsConstant.dark.background,
  'background-basic-color-2': ColorsConstant.dark.surface,
  'background-basic-color-3': '#303436',
  'background-basic-color-4': '#222B45',
  
  'border-basic-color-1': '#222B45',
  'border-basic-color-2': '#1A2138',
  'border-basic-color-3': '#151A30',
  'border-basic-color-4': '#101426',
  'border-basic-color-5': '#C7C7C7',
  
  'text-basic-color': ColorsConstant.dark.text,
  'text-alternate-color': ColorsConstant.dark.background,
  'text-hint-color': ColorsConstant.dark.icon,
  'text-disabled-color': ColorsConstant.dark.icon + '77',
  
  'text-primary-color': ColorsConstant.dark.primary,
  'text-success-color': ColorsConstant.dark.primary,
  'text-info-color': ColorsConstant.dark.primary,
  'text-warning-color': ColorsConstant.dark.secondary,
  'text-danger-color': ColorsConstant.dark.secondaryDark,
}; 