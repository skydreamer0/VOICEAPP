// FilterModal.tsx
// 檔案位置：src/components/ui/FilterModal.tsx
// 該代碼主要功能：用於批量刪除錄音時的過濾條件選擇彈窗組件，讓用戶可以根據不同條件選擇要刪除的錄音

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { RecordingData } from '../../types';

interface FilterCriteria {
  customerNames?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  duration?: {
    min: number;
    max: number;
  };
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  criteria: FilterCriteria;
  setCriteria: React.Dispatch<React.SetStateAction<FilterCriteria>>;
  recordings: RecordingData[];
}

export function FilterModal({
  visible,
  onClose,
  onConfirm,
  criteria,
  setCriteria,
  recordings
}: FilterModalProps) {
  // 計算符合條件的錄音數量
  const getFilteredCount = () => {
    let filtered = [...recordings];
    
    // 檢查 customerNames 是否存在且有長度
    const customerNames = criteria.customerNames;
    if (customerNames && customerNames.length > 0) {
      filtered = filtered.filter(rec => 
        customerNames.includes(rec.customerName)
      );
    }
    
    // 檢查 dateRange 是否存在且有完整的 start 和 end
    const dateRange = criteria.dateRange;
    if (dateRange?.start && dateRange?.end) {
      filtered = filtered.filter(rec => {
        const recordDate = new Date(rec.createdAt);
        return recordDate >= dateRange.start && recordDate <= dateRange.end;
      });
    }
    
    return filtered.length;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>選擇刪除條件</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* 客戶選擇 */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>選擇客戶</Text>
              <View style={styles.customerTags}>
                {Array.from(new Set(recordings.map(r => r.customerName))).map(name => (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.customerTag,
                      criteria.customerNames?.includes(name) && styles.customerTagSelected
                    ]}
                    onPress={() => {
                      setCriteria((prev: FilterCriteria) => ({
                        ...prev,
                        customerNames: prev.customerNames?.includes(name)
                          ? prev.customerNames.filter((n: string) => n !== name)
                          : [...(prev.customerNames || []), name]
                      }));
                    }}
                  >
                    <Text style={styles.customerTagText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 日期範圍選擇 */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>時間範圍</Text>
              <View style={styles.dateRangeButtons}>
                <TouchableOpacity
                  style={styles.dateRangeButton}
                  onPress={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - 7);
                    setCriteria((prev: FilterCriteria) => ({
                      ...prev,
                      dateRange: { start, end }
                    }));
                  }}
                >
                  <Text style={styles.dateRangeButtonText}>最近一週</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateRangeButton}
                  onPress={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setMonth(start.getMonth() - 1);
                    setCriteria((prev: FilterCriteria) => ({
                      ...prev,
                      dateRange: { start, end }
                    }));
                  }}
                >
                  <Text style={styles.dateRangeButtonText}>最近一個月</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.clearButton]}
              onPress={() => {
                setCriteria({});
                onClose();
              }}
            >
              <Text style={styles.clearButtonText}>取消</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.footerButton, 
                styles.confirmButton,
                getFilteredCount() === 0 && styles.disabledButton
              ]}
              onPress={() => {
                if (getFilteredCount() > 0) {
                  onConfirm();
                } else {
                  Alert.alert('提示', '請選擇要刪除的錄音');
                }
              }}
            >
              <Text style={styles.confirmButtonText}>
                確認刪除 ({getFilteredCount()})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600' as const,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  filterContent: {
    padding: theme.spacing.md,
  },
  filterSection: {
    marginBottom: theme.spacing.lg,
  },
  filterTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '600' as const,
  },
  customerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  customerTag: {
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  customerTagSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  customerTagText: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
    fontWeight: '400' as const,
  },
  dateRangeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  dateRangeButton: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  dateRangeButtonText: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
    fontWeight: '400' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  footerButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
  },
  clearButton: {
    backgroundColor: theme.colors.neutral[100],
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  clearButtonText: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '400' as const,
  },
  confirmButtonText: {
    ...theme.typography.body1,
    color: theme.colors.primaryContrast,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  disabledButton: {
    backgroundColor: theme.colors.neutral[200],
  },
}); 