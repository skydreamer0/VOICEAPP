import { Platform, TextStyle } from 'react-native';

// 定義有效的字體權重類型
export type FontWeight = 
  | '100' | '200' | '300' | '400' | '500' 
  | '600' | '700' | '800' | '900' 
  | 'normal' | 'bold';

// 定義排版樣式類型
export interface TypographyStyle {
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
}

export const theme = {
  colors: {
    primary: '#2563EB',          // 更深邃的藍色作為主色
    primaryLight: '#3B82F610',   
    primaryContrast: '#FFFFFF',
    
    // 次要色調
    secondary: '#6366F1',        
    secondaryLight: '#818CF8',
    secondaryDark: '#4F46E5',
    
    // 功能色彩
    success: '#10B981',          
    warning: '#F59E0B',          
    error: '#EF4444',           
    info: '#3B82F6',            
    
    // 中性色階
    neutral: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A'
    },
    
    // 背景色系
    background: '#FFFFFF',
    surface: '#FFFFFF',
    
    text: {
      primary: '#000000',    // 主要文字顏色
      secondary: '#666666',  // 次要文字顏色
      disabled: '#9CA3AF',   // 禁用狀態文字顏色
      hint: '#D1D5DB',      // 提示文字顏色
    },
    border: '#E1E1E1',
  },

  // 統一按鈕尺寸
  spacing: {
    xs: 4,
    sm: 8, 
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // 統一圓角
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // 更新陰影效果
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    }
  },

  // 更新字體系統
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as FontWeight,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as FontWeight,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as FontWeight,
      lineHeight: 28,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400' as FontWeight,
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400' as FontWeight,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as FontWeight,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as FontWeight,
      lineHeight: 24,
    },
    // 添加 sectionTitle 樣式
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as FontWeight,
      lineHeight: 24,
    }
  }
}; 

// 添加 theme 類型定義
export type Theme = typeof theme; 