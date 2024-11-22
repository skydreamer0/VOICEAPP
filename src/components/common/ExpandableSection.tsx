// ExpandableSection.tsx
// 檔案位置：src/components/common/ExpandableSection.tsx
// 主要功能：這是一個可展開/收合的區塊組件（手風琴效果），常用於需要節省空間但又要顯示大量內容的場景。


import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { theme } from '../../theme';
import Icon from '@expo/vector-icons/MaterialIcons';

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  fixedHeight?: number;
  showExpandButton?: boolean;
}

export function ExpandableSection({
  title,
  children,
  initiallyExpanded = false,
  containerStyle,
  contentStyle,
  fixedHeight,
  showExpandButton = true,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>{title}</Text>
        {showExpandButton && (
          <Icon 
            name={isExpanded ? 'expand-less' : 'expand-more'} 
            size={24} 
            color={theme.colors.text.primary} 
          />
        )}
      </TouchableOpacity>
      {isExpanded && (
        <View style={[
          styles.content,
          contentStyle,
          fixedHeight ? { height: fixedHeight } : undefined
        ]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[50],
  },
  title: {
    ...theme.typography.h3,
    flex: 1,
    color: theme.colors.text.primary,
  },
  content: {
    backgroundColor: theme.colors.surface,
  },
}); 