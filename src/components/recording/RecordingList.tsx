// RecordingList.tsx
// 檔案位置：src/components/recording/RecordingList.tsx
// 該代碼主要功能：提供所有錄音介面-錄音列表元件

import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { RecordingData } from '../../types';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { FilterModal } from '../ui/FilterModal';
import { recordingService } from '../../services/recordingService';
import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

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
  onDownload: (recording: RecordingData) => Promise<void>;
  onShare: (recording: RecordingData) => Promise<void>;
}

interface FilterCriteria {
  customerNames?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface RecordingItemProps {
  recording: RecordingData;
  onPlay: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onShare: () => void;
  isPlaying: boolean;
}

const RecordingItem: React.FC<RecordingItemProps> = ({
  recording,
  onPlay,
  onDelete,
  onDownload,
  onShare,
  isPlaying
}) => {
  return (
    <View style={styles.recordingItem}>
      {/* 現有的播放和刪除按鈕 */}
      <TouchableOpacity
        style={[styles.actionButton, styles.playButton]}
        onPress={onPlay}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {/* 下載按鈕 */}
      <TouchableOpacity
        style={[styles.actionButton, styles.downloadButton]}
        onPress={onDownload}
      >
        <Ionicons
          name="download-outline"
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {/* 分享按鈕 */}
      <TouchableOpacity
        style={[styles.actionButton, styles.shareButton]}
        onPress={onShare}
      >
        <Ionicons
          name="share-social-outline"
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={onDelete}
      >
        <Ionicons
          name="trash-outline"
          size={24}
          color={theme.colors.error}
        />
      </TouchableOpacity>
    </View>
  );
};

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
  onDownload,
  onShare,
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

  const renderItem = ({ item: recording }: { item: RecordingData }) => {
    const isPlaying = playingId === recording.id;
    const isSelected = selectedRecordings.includes(recording.id);

    return (
      <View style={[
        styles.recordingItem,
        isSelected && styles.selectedItem
      ]}>
        {isSelectionMode && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => onRecordingSelect(recording.id)}
          >
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        )}

        <View style={styles.recordingInfo}>
          <Text style={styles.recordingDate}>
            {formatDateTime(recording.createdAt)}
          </Text>
          <View style={styles.recordingMeta}>
            <View style={styles.customerBadge}>
              <Text style={styles.customerBadgeText}>
                {recording.customerName}
              </Text>
            </View>
            <View style={styles.durationContainer}>
              <Ionicons
                name="time-outline"
                size={14}
                color={theme.colors.text.secondary}
              />
              <Text style={styles.durationText}>
                {formatDuration(recording.duration)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.recordingControls}>
          {/* 播放按鈕 */}
          <TouchableOpacity
            style={[styles.controlButton, isPlaying ? styles.playingButton : styles.playButton]}
            onPress={() => handlePlayRecording(recording)}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {/* 下載按鈕 */}
          <TouchableOpacity
            style={[styles.controlButton, styles.downloadButton]}
            onPress={() => onDownload(recording)}
          >
            <Ionicons
              name="download-outline"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {/* 分享按鈕 */}
          <TouchableOpacity
            style={[styles.controlButton, styles.shareButton]}
            onPress={() => onShare(recording)}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {/* 刪除按鈕 */}
          <TouchableOpacity
            style={[styles.controlButton, styles.deleteButton]}
            onPress={() => handleDeletePress(recording.id)}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleDownload = async (recording: RecordingData) => {
    try {
      // 確保目錄存在
      const downloadDir = `${FileSystem.documentDirectory}downloads`;
      const dirInfo = await FileSystem.getInfoAsync(downloadDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      }

      // 生成檔案名稱
      const fileName = `${recording.customerName}_${recording.clinicName}_${formatDate(recording.createdAt)}.m4a`;
      const localFilePath = `${downloadDir}/${fileName}`;

      // 複製檔案
      await FileSystem.copyAsync({
        from: recording.audioUri,
        to: localFilePath
      });

      Alert.alert(
        '下載成功',
        `檔案已儲存至: ${localFilePath}`,
        [{ text: '確定', style: 'default' }]
      );
    } catch (error) {
      console.error('下載失敗:', error);
      Alert.alert('錯誤', '下載失敗');
    }
  };

  const handleShare = async (recording: RecordingData) => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('提示', '網頁版不支援分享功能');
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('錯誤', '您的裝置不支援分享功能');
        return;
      }

      await Sharing.shareAsync(recording.audioUri, {
        mimeType: 'audio/m4a',
        dialogTitle: '分享錄音',
        UTI: 'public.audio'
      });
    } catch (error) {
      console.error('分享失敗:', error);
      Alert.alert('錯誤', '分享失敗');
    }
  };

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
    backgroundColor: theme.colors.primaryLight,
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
  actionButton: {
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  downloadButton: {
    backgroundColor: theme.colors.primaryLight,
  },
  shareButton: {
    backgroundColor: theme.colors.primaryLight,
  },
}); 