// RecordingPlayer.tsx
// 檔案位置：src/components/customer/RecordingPlayer.tsx
// 該代碼主要功能：提供播放錄音介面-錄音播放元件

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { RecordingData } from '../../types';
import { useRecordings } from '../../hooks/useRecordings';

interface RecordingPlayerProps {
  recording: RecordingData;
}

export function RecordingPlayer({ recording }: RecordingPlayerProps) {
  const { playingId, handlePlay, handleStop } = useRecordings();
  const isPlaying = playingId === recording.id;

  // 返回空的 View，不顯示任何內容
  return <View />;
}

const styles = StyleSheet.create({
  // 保留樣式以防後續需要
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 