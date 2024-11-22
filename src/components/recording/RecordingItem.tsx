import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { RecordingData } from '../../types';
import { recordingService } from '../../services/recordingService';
import { formatDuration } from '../../utils/dateUtils';

interface RecordingItemProps {
  recording: RecordingData;
}

export function RecordingItem({ recording }: RecordingItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.duration}>
          {formatDuration(recording.duration)}
        </Text>
        <Text style={styles.fileSize}>
          {recordingService.formatFileSize(recording.fileSize || 0)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  duration: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
  },
  fileSize: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
}); 