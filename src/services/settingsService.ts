import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = 'app_settings';

export interface AppSettings {
  googleClientId?: string;
  defaultClinicName?: string;
  defaultPhoneNumber?: string;
}

class SettingsService {
  private settings: AppSettings = {};

  // 載入設定
  async loadSettings(): Promise<AppSettings> {
    try {
      const settingsStr = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (settingsStr) {
        this.settings = JSON.parse(settingsStr);
      }
      return this.settings;
    } catch (error) {
      console.error('載入設定失敗:', error);
      return {};
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
  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K] | undefined> {
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
      this.settings = {};
    } catch (error) {
      console.error('清除設定失敗:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();
