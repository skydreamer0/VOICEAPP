import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = 'app_settings';

export interface AppSettings {
  // 診所相關設定
  defaultClinicName: string;
  defaultPhoneNumber: string;
  defaultLatitude: number;
  defaultLongitude: number;
  
  // 錄音相關設定
  recordingQuality: 'low' | 'medium' | 'high';
  maxRecordingDuration: number; // 單位：分鐘
  autoStopRecording: boolean;
  
  // 檔案相關設定
  autoSaveEnabled: boolean;
  saveLocation: string;
  fileNamingPattern: string;
  
  // 顯示相關設定
  darkMode: boolean;
  language: 'zh-TW' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  
  // 通知相關設定
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  
  // 系統相關設定
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  keepRecordingDays: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  // 診所預設值
  defaultClinicName: '未知診所',
  defaultPhoneNumber: '未知電話',
  defaultLatitude: 25.0330,  // 台北市預設緯度
  defaultLongitude: 121.5654,  // 台北市預設經度
  
  // 錄音預設值
  recordingQuality: 'high',
  maxRecordingDuration: 60,  // 預設最長60分鐘
  autoStopRecording: false,
  
  // 檔案預設值
  autoSaveEnabled: true,
  saveLocation: 'recordings',
  fileNamingPattern: '${customerName}_${clinicName}_${timestamp}',
  
  // 顯示預設值
  darkMode: false,
  language: 'zh-TW',
  fontSize: 'medium',
  
  // 通知預設值
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  
  // 系統預設值
  autoBackupEnabled: false,
  backupFrequency: 'weekly',
  keepRecordingDays: 365  // 預設保存一年
};

class SettingsService {
  private settings: AppSettings = DEFAULT_SETTINGS;

  // 載入設定
  async loadSettings(): Promise<AppSettings> {
    try {
      const settingsStr = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (settingsStr) {
        // 合併儲存的設定和預設值，確保新增的設定項目有預設值
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...JSON.parse(settingsStr)
        };
      }
      return this.settings;
    } catch (error) {
      console.error('載入設定失敗:', error);
      return DEFAULT_SETTINGS;
    }
  }

  // 保存設定
  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('保存設定失敗:', error);
      throw error;
    }
  }

  // 取得特定設定值
  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    if (!this.settings) {
      await this.loadSettings();
    }
    return this.settings[key];
  }

  // 設定特定值
  async setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    await this.saveSettings({ [key]: value });
  }

  // 清除所有設定
  async clearSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
      this.settings = DEFAULT_SETTINGS;
    } catch (error) {
      console.error('清除設定失敗:', error);
      throw error;
    }
  }

  // 重置為預設值
  async resetToDefaults(): Promise<void> {
    try {
      this.settings = DEFAULT_SETTINGS;
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error('重置設定失敗:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();
