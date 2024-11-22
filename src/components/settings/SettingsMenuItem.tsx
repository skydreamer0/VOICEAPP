// SettingsMenuItem 組件
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

// 導入 Ionicons 的圖標名稱類型
type IconNames = keyof typeof Ionicons.glyphMap;

interface SettingsMenuItemProps {
  icon: IconNames;  // 使用 Ionicons 的圖標名稱類型
  title: string;
  onPress: () => void;
}

export function SettingsMenuItem({ icon, title, onPress }: SettingsMenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={theme.colors.text.primary} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <Ionicons 
        name="chevron-forward" 
        size={24} 
        color={theme.colors.text.secondary} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  menuTitle: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    flex: 1,
  },
});