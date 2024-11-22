// RecordingList.tsx
// 檔案位置：src/components/recording/RecordingList.tsx
// 該代碼主要功能：提供所有錄音介面-錄音列表元件

import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { RecordingData } from '../../types';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { FilterModal } from '../ui/FilterModal';
import { recordingService } from '../../services/recordingService';

interface RecordingListProps {
  recordings: RecordingData[];
  isSelectionMode: boolean;
  selectedRecordings: string[];
  onRecordingSelect: (recordingId: string) => void;
  onRefresh: () => Promise<void>;
  onDelete: (recordingId: string) => Promise<void>;
  onBatchDelete: () => Promise<void>;
  playingId: string | null;
  onPlay: (recording: RecordingData) => void;
  onStop: () => void;
}

interface FilterCriteria {
  customerNames?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export function RecordingList({
  recordings,
  isSelectionMode,
  selectedRecordings,
  onRecordingSelect,
  onRefresh,
  onDelete,
  onBatchDelete,
  playingId,
  onPlay,
  onStop,
}: RecordingListProps) {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [batchDeleteModalVisible, setBatchDeleteModalVisible] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({});
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleDeletePress = (recordingId: string) => {
    setSelectedRecordingId(recordingId);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedRecordingId) {
      await onDelete(selectedRecordingId);
      setDeleteModalVisible(false);
      setSelectedRecordingId(null);
    }
  };

  const handlePlayRecording = (recording: RecordingData) => {
    if (playingId === recording.id) {
      onStop();
    } else {
      onPlay(recording);
    }
  };

  const showFilterModal = () => {
    setFilterModalVisible(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 獲取符合條件的錄音 ID 列表
  const getFilteredRecordingIds = () => {
    let filtered = [...recordings];
    
    if (filterCriteria.customerNames?.length) {
      filtered = filtered.filter(rec => 
        filterCriteria.customerNames?.includes(rec.customerName)
      );
    }
    
    if (filterCriteria.dateRange) {
      filtered = filtered.filter(rec => {
        const recordDate = new Date(rec.createdAt);
        return recordDate >= filterCriteria.dateRange!.start && 
               recordDate <= filterCriteria.dateRange!.end;
      });
    }
    
    return filtered.map(rec => rec.id);
  };

  const handleConfirmBatchDelete = async () => {
    const selectedIds = getFilteredRecordingIds();
    if (selectedIds.length === 0) {
      Alert.alert('提示', '請選擇要刪除的錄音');
      return;
    }

    try {
      setIsLoading(true);
      await recordingService.deleteMultipleRecordings(selectedIds);
      setFilterCriteria({});
      setBatchDeleteModalVisible(false);
      Alert.alert('成功', '已刪除所選錄音');
      await onBatchDelete();
    } catch (error) {
      console.error('批量刪除失敗:', error);
      Alert.alert('錯誤', '刪除錄音時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: RecordingData }) => (
    <TouchableOpacity
      style={[
        styles.recordingItem,
        selectedRecordings.includes(item.id) && styles.selectedItem
      ]}
      onPress={() => isSelectionMode ? onRecordingSelect(item.id) : handlePlayRecording(item)}
    >
      {isSelectionMode && (
        <View style={styles.checkboxContainer}>
          <Ionicons
            name={selectedRecordings.includes(item.id) ? "checkbox" : "square-outline"}
            size={24}
            color={theme.colors.primary}
          />
        </View>
      )}
      <View style={styles.recordingInfo}>
        <Text style={styles.recordingDate}>
          {formatDate(item.createdAt)}
        </Text>
        <View style={styles.recordingMeta}>
          <View style={styles.customerBadge}>
            <Text style={styles.customerBadgeText}>
              {item.customerName}
            </Text>
          </View>
          {item.duration > 0 && (
            <View style={styles.durationContainer}>
              <Ionicons 
                name="time-outline" 
                size={16} 
                color={theme.colors.text.secondary} 
              />
              <Text style={styles.durationText}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.recordingControls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.playButton,
            playingId === item.id && styles.playingButton
          ]}
          onPress={() => {
            if (playingId === item.id) {
              onStop();
            } else {
              onPlay(item);
            }
          }}
        >
          <Ionicons
            name={playingId === item.id ? "stop" : "play"}
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.deleteButton]}
          onPress={() => handleDeletePress(item.id)}
        >
          <Ionicons 
            name="trash-outline" 
            size={20} 
            color={theme.colors.error} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (recordings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name="mic-off-outline" 
          size={48} 
          color={theme.colors.text.disabled} 
        />
        <Text style={styles.emptyStateTitle}>暫無錄音記錄</Text>
        <Text style={styles.emptyStateText}>
          開始錄音來記錄您的備忘錄
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="mic" size={24} color={theme.colors.primary} />
          <Text style={styles.title}>錄音記錄</Text>
          <Text style={styles.count}>
            共 {recordings.length} 條錄音
          </Text>
        </View>
        
        {recordings.length > 0 && (
          <TouchableOpacity
            style={styles.batchDeleteButton}
            onPress={showFilterModal}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            <Text style={styles.batchDeleteText}>批量刪除</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons 
              name="mic-off-outline" 
              size={48} 
              color={theme.colors.text.disabled} 
            />
            <Text style={styles.emptyStateTitle}>暫無錄音記錄</Text>
            <Text style={styles.emptyStateText}>
              開始錄音來記錄您的備忘錄
            </Text>
          </View>
        )}
        scrollEnabled={false}
        nestedScrollEnabled={true}
      />

      <DeleteConfirmModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setSelectedRecordingId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="確認刪除"
        message="確定要刪除這條錄嗎？此操作無法復原。"
      />

      <FilterModal
        visible={filterModalVisible}
        onClose={() => {
          setFilterModalVisible(false);
          setFilterCriteria({});
        }}
        onConfirm={() => {
          setBatchDeleteModalVisible(true);
          setFilterModalVisible(false);
        }}
        criteria={filterCriteria}
        setCriteria={setFilterCriteria}
        recordings={recordings}
      />

      <DeleteConfirmModal
        visible={batchDeleteModalVisible}
        onClose={() => setBatchDeleteModalVisible(false)}
        onConfirm={handleConfirmBatchDelete}
        title="批量刪除"
        message={`確定要刪除選中的 ${getFilteredRecordingIds().length} 條錄音嗎？此操作無法復原。`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600' as const,
  },
  count: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '400' as const,
  },
  batchDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  batchDeleteText: {
    ...theme.typography.body2,
    color: theme.colors.error,
    fontWeight: '400' as const,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  recordingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  recordingDate: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '400' as const,
  },
  recordingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  customerBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  customerBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '400' as const,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  durationText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '400' as const,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  controlButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral[100],
  },
  playButton: {
    backgroundColor: theme.colors.primary + '10',
  },
  playingButton: {
    backgroundColor: theme.colors.primary + '20',
  },
  deleteButton: {
    backgroundColor: theme.colors.error + '10',
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.disabled,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    fontWeight: '600' as const,
  },
  emptyStateText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    fontWeight: '400' as const,
  },
  listContainer: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  selectedItem: {
    backgroundColor: `${theme.colors.primary}10`,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  checkboxContainer: {
    marginRight: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    minHeight: 200,
  },
  emptyText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
}); 