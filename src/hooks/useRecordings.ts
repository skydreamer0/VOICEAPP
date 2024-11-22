// useRecordings.ts
// 檔案位置：src/hooks/useRecordings.ts
// 該代碼主要功能：提供所有錄音介面-錄音列表元件的邏輯

import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { recordingService } from '../services/recordingService';
import type { RecordingData } from '../types';
import { useAudioSettings, AudioSettings } from '../hooks/useAudioSettings';

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

export function useRecordings() {
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [sound, setSound] = useState<Audio.Sound | HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [batchDeleteModalVisible, setBatchDeleteModalVisible] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({});
  const [filteredRecordings, setFilteredRecordings] = useState<RecordingData[]>([]);
  const isLoadingRef = useRef(false);
  const { loadSettings } = useAudioSettings();

  const refreshRecordings = useCallback(async (force = false) => {
    // 如果正在加載中，則跳過
    if (isLoadingRef.current && !force) {
      return;
    }

    try {
      isLoadingRef.current = true;
      const data = await recordingService.getAllRecordings();
      setRecordings(data);
    } catch (error) {
      console.error('獲取錄音失敗:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refreshRecordings();
    return () => {
      if (sound) {
        if (Platform.OS === 'web' && sound instanceof HTMLAudioElement) {
          sound.pause();
        } else if (sound instanceof Audio.Sound) {
          sound.unloadAsync();
        }
      }
    };
  }, []);

  const playRecording = async (recording: RecordingData) => {
    try {
      if (sound) {
        if (Platform.OS === 'web' && sound instanceof HTMLAudioElement) {
          sound.pause();
          sound.currentTime = 0;
        } else if (sound instanceof Audio.Sound) {
          await sound.unloadAsync();
        }
        setSound(null);
      }

      if (Platform.OS === 'web') {
        const audioElement = new window.Audio(recording.audioUri);
        audioElement.play();
        setSound(audioElement);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recording.audioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
      }
      setPlayingId(recording.id);
    } catch (error) {
      console.error('播放錄音失敗:', error);
    }
  };

  const stopPlaying = async () => {
    try {
      if (sound) {
        if (Platform.OS === 'web' && sound instanceof HTMLAudioElement) {
          sound.pause();
          sound.currentTime = 0;
        } else if (sound instanceof Audio.Sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
        setSound(null);
        setPlayingId(null);
      }
    } catch (error) {
      console.error('停止播放失敗:', error);
    }
  };

  const deleteRecording = async (recordingId: string) => {
    try {
      await recordingService.deleteRecording(recordingId);
      await refreshRecordings();
    } catch (error) {
      console.error('刪除錄音失敗:', error);
    }
  };

  const getFilteredRecordings = (criteria: FilterCriteria): RecordingData[] => {
    return recordings.filter(recording => {
      // 根據客戶名稱篩選
      if (criteria.customerNames?.length && 
          !criteria.customerNames.includes(recording.customerName)) {
        return false;
      }

      // 根據日期範篩選
      if (criteria.dateRange) {
        const recordingDate = new Date(recording.createdAt);
        if (recordingDate < criteria.dateRange.start || 
            recordingDate > criteria.dateRange.end) {
          return false;
        }
      }

      // 根據時長篩選
      if (criteria.duration) {
        const durationInSeconds = recording.duration / 1000;
        if (durationInSeconds < criteria.duration.min || 
            durationInSeconds > criteria.duration.max) {
          return false;
        }
      }

      return true;
    });
  };

  const handleFilterConfirm = () => {
    const filtered = getFilteredRecordings(filterCriteria);
    if (filtered.length === 0) {
      setFilterModalVisible(false);
      return;
    }
    setFilteredRecordings(filtered);
    setFilterModalVisible(false);
    setBatchDeleteModalVisible(true);
  };

  const handleBatchDelete = async () => {
    try {
      // 停止當前播放
      if (sound) {
        if (Platform.OS === 'web' && sound instanceof HTMLAudioElement) {
          sound.pause();
          sound.currentTime = 0;
        } else if (sound instanceof Audio.Sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
        setSound(null);
        setPlayingId(null);
      }

      // 執行批量刪除
      await Promise.all(
        filteredRecordings.map(recording => 
          recordingService.deleteRecording(recording.id)
        )
      );

      // 重新加載錄音列表
      await refreshRecordings();
      setBatchDeleteModalVisible(false);
      setFilterCriteria({});
      setFilteredRecordings([]);
    } catch (error) {
      console.error('批量刪除失敗:', error);
    }
  };

  const showFilterModal = () => {
    setFilterModalVisible(true);
  };

  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const startRecording = async () => {
    try {
      console.log('=== 開始錄音流程 ===');
      const audioSettings = await loadSettings();
      console.log('當前錄音設定:', {
        quality: audioSettings.quality,
        sampleRate: audioSettings.sampleRate,
        bitRate: audioSettings.bitRate,
        channels: audioSettings.channels
      });

      console.log('設定音訊模式...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const recording = new Audio.Recording();
      console.log('準備錄音選項...');
      
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: 4,
          audioEncoder: 3,
          sampleRate: audioSettings.sampleRate,
          numberOfChannels: audioSettings.channels,
          bitRate: getBitRateFromQuality(audioSettings.quality),
        },
        ios: {
          extension: '.m4a',
          outputFormat: 'aac',
          audioQuality: getAudioQualityFromQuality(audioSettings.quality),
          sampleRate: audioSettings.sampleRate,
          numberOfChannels: audioSettings.channels,
          bitRate: getBitRateFromQuality(audioSettings.quality),
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: getBitRateFromQuality(audioSettings.quality),
        },
      };

      console.log('錄音選項:', recordingOptions);
      await recording.prepareToRecordAsync(recordingOptions);
      console.log('開始錄音...');
      await recording.startAsync();
      console.log('=== 錄音已開始 ===');
      setRecording(recording);
    } catch (error) {
      console.error('開始錄音失敗:', error);
    }
  };

  function getBitRateFromQuality(quality: AudioSettings['quality']): number {
    switch (quality) {
      case 'low':
        return 32000;
      case 'medium':
        return 64000;
      case 'high':
        return 128000;
      default:
        return 64000;
    }
  }

  function getAudioQualityFromQuality(quality: AudioSettings['quality']): number {
    switch (quality) {
      case 'low':
        return 0.25;
      case 'medium':
        return 0.5;
      case 'high':
        return 1.0;
      default:
        return 0.5;
    }
  }

  return {
    recordings,
    playingId,
    sound,
    filterModalVisible,
    setFilterModalVisible,
    batchDeleteModalVisible,
    setBatchDeleteModalVisible,
    filterCriteria,
    setFilterCriteria,
    filteredRecordings,
    handlePlay: playRecording,
    handleStop: stopPlaying,
    handleDelete: deleteRecording,
    handleBatchDelete,
    handleFilterConfirm,
    showFilterModal,
    refreshRecordings,
    startRecording,
  };
} 