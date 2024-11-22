import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

export interface AudioSettings {
  quality: 'low' | 'medium' | 'high';
  sampleRate: 22050 | 44100 | 48000;
  bitRate: 32000 | 64000 | 128000;
  channels: 1 | 2;
}

const DEFAULT_SETTINGS: AudioSettings = {
  quality: 'medium',
  sampleRate: 44100,
  bitRate: 64000,
  channels: 1,
};

export function useAudioSettings() {
  const saveSettings = useCallback(async (settings: AudioSettings) => {
    try {
      console.log('=== 開始保存音訊設定 ===');
      console.log('新的設定值:', {
        quality: settings.quality,
        sampleRate: settings.sampleRate,
        bitRate: settings.bitRate,
        channels: settings.channels
      });

      await AsyncStorage.setItem('audioSettings', JSON.stringify(settings));
      console.log('設定已保存到 AsyncStorage');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      console.log('音訊模式已更新');
      console.log('=== 音訊設定保存完成 ===');

    } catch (error) {
      console.error('保存音訊設定失敗:', error);
    }
  }, []);

  const loadSettings = useCallback(async (): Promise<AudioSettings> => {
    try {
      console.log('=== 開始載入音訊設定 ===');
      const savedSettings = await AsyncStorage.getItem('audioSettings');
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        console.log('已載入保存的設定:', parsedSettings);
        return parsedSettings;
      } else {
        console.log('使用預設設定:', DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
    } catch (error) {
      console.error('載入音訊設定失敗:', error);
      console.log('使用預設設定:', DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
  }, []);

  return {
    saveSettings,
    loadSettings,
    DEFAULT_SETTINGS,
  };
} 