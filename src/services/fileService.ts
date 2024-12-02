import * as FileSystem from 'expo-file-system';
import { settingsService } from './settingsService';
import { getTaiwanDateTime } from '../utils/dateUtils';

interface RecordingInfo {
  customerName: string;
  clinicName?: string;
  phoneNumber?: string;
  location?: { 
    latitude: number; 
    longitude: number; 
  };
  createdAt: Date;
}

interface FileInfo {
  fileName: string;
  filePath: string;
}

class FileService {
  // 生成檔案名稱
  private async generateFileName(recording: RecordingInfo): Promise<string> {
    const settings = await settingsService.loadSettings();
    
    // 從設定或錄音資訊中獲取資料
    const clinicName = recording.clinicName || settings.defaultClinicName || '未知診所';
    const phoneNumber = recording.phoneNumber || settings.defaultPhoneNumber || '未知電話';
    const location = recording.location || { latitude: 0, longitude: 0 };
    
    // 確保日期是有效的
    let timestamp: string;
    try {
      const date = new Date(recording.createdAt);
      if (isNaN(date.getTime())) {
        timestamp = getTaiwanDateTime().toISOString();
      } else {
        timestamp = date.toISOString();
      }
    } catch (error) {
      console.warn('日期轉換失敗，使用當前時間');
      timestamp = getTaiwanDateTime().toISOString();
    }
    
    // 移除非法檔案名稱字元
    const sanitizedClinicName = clinicName.replace(/[<>:"/\\|?*]/g, '_');
    const sanitizedCustomerName = recording.customerName.replace(/[<>:"/\\|?*]/g, '_');
    
    // 格式化檔案名稱：客戶名稱_診所名稱_電話_經緯度_時間戳
    return `${sanitizedCustomerName}_${sanitizedClinicName}_${phoneNumber}_${location.latitude},${location.longitude}_${timestamp.replace(/[:.]/g, '-')}`;
  }

  // 下載/移動檔案到本地儲存
  async saveFile(filePath: string, recording: RecordingInfo): Promise<FileInfo> {
    try {
      const fileName = await this.generateFileName(recording);
      const downloadPath = `${FileSystem.documentDirectory}recordings`;
      const newFilePath = `${downloadPath}/${fileName}.m4a`;

      // 確保目錄存在
      const dirInfo = await FileSystem.getInfoAsync(downloadPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadPath, { intermediates: true });
      }

      // 移動檔案
      await FileSystem.moveAsync({
        from: filePath,
        to: newFilePath
      });

      return {
        filePath: newFilePath,
        fileName: `${fileName}.m4a`
      };
    } catch (error) {
      console.error('儲存檔案失敗:', error);
      throw error;
    }
  }

  // 取得檔案列表
  async getFiles(): Promise<FileInfo[]> {
    try {
      const downloadPath = `${FileSystem.documentDirectory}recordings`;
      
      // 確保目錄存在
      const dirInfo = await FileSystem.getInfoAsync(downloadPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadPath, { intermediates: true });
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(downloadPath);
      return files.map((fileName: string) => ({
        fileName,
        filePath: `${downloadPath}/${fileName}`
      }));
    } catch (error) {
      console.error('取得檔案列表失敗:', error);
      return [];
    }
  }

  // 從檔案名稱解析錄音資訊
  parseFileName(fileName: string): Partial<RecordingInfo> {
    try {
      const [customerName, clinicName, phoneNumber, location, timestamp] = 
        fileName.replace('.m4a', '').split('_');
      
      const [latitude, longitude] = location.split(',').map(Number);
      
      return {
        customerName,
        clinicName,
        phoneNumber,
        location: {
          latitude,
          longitude
        },
        createdAt: new Date(timestamp.replace(/-/g, ':'))
      };
    } catch (error) {
      console.error('解析檔案名稱失敗:', error);
      return {};
    }
  }

  // 刪除檔案
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.error('刪除檔案失敗:', error);
      throw error;
    }
  }
}

export const fileService = new FileService();