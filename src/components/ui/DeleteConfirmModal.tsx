// DeleteConfirmModal.tsx
// 檔案位置：src/components/ui/DeleteConfirmModal.tsx
// 該代碼主要功能：提供所有錄音介面刪除檔案時，刪除錄音的確認彈窗

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface DeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteConfirmModal({
  visible,
  onClose,
  onConfirm,
  title = '確認刪除',
  message = '確定要刪除嗎？此操作無法復原。',
  confirmText = '刪除',
  cancelText = '取消'
}: DeleteConfirmModalProps) {
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
            <Ionicons 
              name="warning-outline" 
              size={32} 
              color={theme.colors.warning} 
            />
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          
          <Text style={styles.modalMessage}>
            {message}
          </Text>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.deleteButton]}
              onPress={onConfirm}
            >
              <Text style={styles.deleteButtonText}>{confirmText}</Text>
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
    padding: theme.spacing.lg,
    width: '90%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    fontWeight: '600' as const,
  },
  modalMessage: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontWeight: '400' as const,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral[100],
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  cancelButtonText: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '400' as const,
  },
  deleteButtonText: {
    ...theme.typography.body1,
    color: theme.colors.primaryContrast,
    fontWeight: '600' as const,
  },
}); 