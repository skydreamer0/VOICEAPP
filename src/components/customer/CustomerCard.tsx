import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { theme } from '../../theme';
import { Customer } from '../../types';
import type { FontWeight } from '../../theme';

interface CustomerCardProps {
  customer: Customer;
  onPress?: () => void;
}

export function CustomerCard({ customer, onPress }: CustomerCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="compact">
        <View style={styles.container}>
          <View style={styles.info}>
            <Text style={styles.name}>{customer.name}</Text>
            <View style={styles.details}>
              <View style={styles.detailItem}>
                <Ionicons 
                  name="location-outline" 
                  size={14} 
                  color={theme.colors.text.secondary} 
                />
                <Text style={styles.detailText} numberOfLines={1}>
                  {customer.address}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons 
                  name="call-outline" 
                  size={14} 
                  color={theme.colors.text.secondary} 
                />
                <Text style={styles.detailText}>
                  {customer.phone}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={theme.colors.text.secondary} 
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  name: {
    ...theme.typography.body1,
    fontWeight: '500' as FontWeight,
    color: theme.colors.text.primary,
    marginBottom: 2,
  } as TextStyle,
  details: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    flex: 1,
  } as TextStyle,
}); 