import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecordingList } from '../components/recording/RecordingList';
import { useRecordings } from '../hooks/useRecordings';
import { recordingService } from '../services/recordingService';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Modal } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

export function HistoryScreen() {
  const { 
    recordings, 
    refreshRecordings,
    playingId,
    handlePlay,
    handleStop,
    handleDelete,
    handleBatchDelete,
  } = useRecordings();
  
  const [selectedRecordings, setSelectedRecordings] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  // 重用 RecordingsScreen 的 useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = () => {
        // 清理工作（如果需要）
      };
      refreshRecordings();
      return () => unsubscribe();
    }, [])
  );

  // 重用 RecordingsScreen 的功能
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    setSelectedRecordings([]);
  }, []);

  const handleRecordingSelect = useCallback((recordingId: string) => {
    setSelectedRecordings(prev => {
      if (prev.includes(recordingId)) {
        return prev.filter(id => id !== recordingId);
      } else {
        return [...prev, recordingId];
      }
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    try {
      setIsDeleteModalVisible(true);
    } catch (error) {
      console.error('批量刪除失敗:', error);
      Alert.alert('錯誤', '刪除錄音時發生錯誤');
    }
  }, [selectedRecordings]);

  const confirmBulkDelete = async () => {
    try {
      await recordingService.deleteMultipleRecordings(selectedRecordings);
      await refreshRecordings();
      setSelectedRecordings([]);
      setIsSelectionMode(false);
      setIsDeleteModalVisible(false);
      Alert.alert('成功', '已成功刪除所選錄音');
    } catch (error) {
      console.error('批量刪除失敗:', error);
      Alert.alert('錯誤', '刪除錄音時發生錯誤，請稍後重試');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>歷史記錄</Text>
        {recordings.length > 0 && (
          <TouchableOpacity 
            onPress={toggleSelectionMode}
            style={styles.selectionButton}
          >
            <Ionicons 
              name={isSelectionMode ? "close" : "checkmark-circle-outline"} 
              size={24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        )}
      </View>

      <RecordingList
        recordings={recordings}
        isSelectionMode={isSelectionMode}
        selectedRecordings={selectedRecordings}
        onRecordingSelect={handleRecordingSelect}
        onRefresh={refreshRecordings}
        onDelete={handleDelete}
        onBatchDelete={handleBatchDelete}
        playingId={playingId}
        onPlay={handlePlay}
        onStop={handleStop}
      />

      {/* 批量刪除按鈕 */}
      {isSelectionMode && selectedRecordings.length > 0 && (
        <View style={styles.bulkActionBar}>
          <TouchableOpacity
            style={styles.bulkDeleteButton}
            onPress={handleBulkDelete}
          >
            <Ionicons name="trash" size={20} color={theme.colors.primaryContrast} />
            <Text style={styles.bulkDeleteText}>
              刪除所選 ({selectedRecordings.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 刪除確認對話框 */}
      <Portal>
        <Modal
          visible={isDeleteModalVisible}
          onDismiss={() => setIsDeleteModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>確認刪除</Text>
            <Text style={styles.modalMessage}>
              確定要刪除所選的 {selectedRecordings.length} 條錄音嗎？此操作無法復原。
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmBulkDelete}
              >
                <Text style={styles.deleteButtonText}>確認刪除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.shadows.sm,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  selectionButton: {
    padding: theme.spacing.sm,
  },
  bulkActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    ...theme.shadows.lg,
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
  },
  bulkDeleteText: {
    ...theme.typography.body1,
    color: theme.colors.primaryContrast,
    marginLeft: theme.spacing.sm,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.lg,
  },
  modalContent: {
    padding: theme.spacing.lg,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  modalMessage: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral[100],
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    elevation: 2,
  },
  cancelButtonText: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
  },
  deleteButtonText: {
    ...theme.typography.body1,
    color: theme.colors.primaryContrast,
  },
}); 