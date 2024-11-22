// Card.tsx
// 檔案位置：src/components/ui/Card.tsx
// 該代碼主要功能：提供所有錄音介面卡片元件

import { View, StyleSheet, Platform } from 'react-native';
import { theme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: object;
  variant?: 'default' | 'compact';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[
      styles.card, 
      variant === 'compact' && styles.compactCard,
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    ...(Platform.OS === 'web' 
      ? {
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)'
        }
      : {
          shadowColor: theme.colors.neutral[900],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07,
          shadowRadius: 4,
          elevation: 2
        }
    ),
  },
  compactCard: {
    padding: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
        }
      : {
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1
        }
    ),
  },
}); 