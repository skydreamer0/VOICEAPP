import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordingData, Customer } from '../types';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

interface AudioMetadata {
  blobSize?: number;
  mimeType?: string;
}

export const recordingService = {
  // 驗證錄音記錄
  validateRecording(recording: RecordingData): boolean {
    console.log('驗證錄音記錄:', recording);
    
    if (!recording.id || !recording.audioUri || !recording.customerId || !recording.customerName) {
      console.error('錄音記錄缺少必要欄位');
      return false;
    }

    if (!(recording.createdAt instanceof Date) && !Date.parse(recording.createdAt as any)) {
      console.error('無效的創建時間');
      return false;
    }

    return true;
  },

  // 保存新的錄音記錄
  async saveRecording(recording: RecordingData): Promise<void> {
    try {
      console.log('開始保存錄音記錄...');
      
      if (!this.validateRecording(recording)) {
        throw new Error('無效的錄音記錄');
      }
      
      // 獲取現有的錄音記錄
      const existingRecordings = await this.getAllRecordings();
      console.log('當前錄音記錄數量:', existingRecordings.length);
      
      // 添加新的錄音記錄
      const updatedRecordings = [recording, ...existingRecordings];
      
      // 保存到 AsyncStorage
      await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
      console.log('錄音記錄保存成功，更新後總數:', updatedRecordings.length);
      
    } catch (error) {
      console.error('保存錄音記錄失敗:', error);
      throw new Error('無法保存錄音記錄');
    }
  },

  // 獲取所有錄音記錄
  async getAllRecordings(): Promise<RecordingData[]> {
    try {
      console.log('獲取所有錄音記錄...');
      const recordings = await AsyncStorage.getItem('recordings');
      const parsedRecordings = recordings ? JSON.parse(recordings) : [];
      console.log('成功獲取錄音記錄，總數:', parsedRecordings.length);
      return parsedRecordings;
    } catch (error) {
      console.error('獲取錄音記錄失敗:', error);
      return [];
    }
  },

  // 獲取特定客戶的錄音記錄
  async getCustomerRecordings(customerId: string): Promise<RecordingData[]> {
    try {
      const allRecordings = await this.getAllRecordings();
      return allRecordings.filter(recording => recording.customerId === customerId);
    } catch (error) {
      console.error('獲取客戶錄音記錄失敗:', error);
      return [];
    }
  },

  // 刪除錄音記錄
  async deleteRecording(recordingId: string): Promise<void> {
    try {
      console.log(`開始刪除錄音 ${recordingId}`);
      
      // 1. 先從 AsyncStorage 中刪除記錄
      await this.removeRecordingFromStorage(recordingId);
      
      // 2. 嘗試刪除實際文件（如果存在的話）
      try {
        const recordingUri = await this.getRecordingUri(recordingId);
        const fileInfo = await FileSystem.getInfoAsync(recordingUri);
        
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(recordingUri, { idempotent: true });
          console.log(`錄音文件 ${recordingId} 已成功刪除`);
        } else {
          console.log(`錄音文件 ${recordingId} 不存在，跳過文件刪除`);
        }
      } catch (fileError) {
        // 如果文件操作失敗，只記錄日誌，不拋出錯誤
        console.log(`文件操作失敗，但繼續處理: ${fileError}`);
      }

    } catch (error: unknown) {
      console.error(`刪除錄音 ${recordingId} 時發生錯誤:`, error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '未知錯誤';
      throw new Error(`無法刪除錄音: ${errorMessage}`);
    }
  },

  async getRecordingUri(recordingId: string): Promise<string> {
    // 確保 recordings 目錄存在
    const recordingsDir = `${FileSystem.documentDirectory}recordings`;
    try {
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
      }
    } catch (error) {
      console.log('創建目錄失敗，使用預設路徑');
    }
    
    return `${recordingsDir}/${recordingId}.m4a`;
  },

  async removeRecordingFromStorage(recordingId: string): Promise<void> {
    try {
      // 從 AsyncStorage 獲取當前的錄音列表
      const recordings = await this.getAllRecordings();
      
      // 過濾掉要刪除的錄音
      const updatedRecordings = recordings.filter(rec => rec.id !== recordingId);
      
      // 更新 AsyncStorage
      await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
      
      console.log(`錄音 ${recordingId} 已從存儲中移除`);
    } catch (error: unknown) {
      console.error(`從存儲中移除錄音 ${recordingId} 失敗:`, error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '未知錯誤';
      throw new Error(`無法從存儲中移除錄音: ${errorMessage}`);
    }
  },

  // 清理所有過期的錄音資源
  async cleanupStaleRecordings(): Promise<void> {
    try {
      const recordings = await this.getAllRecordings();
      const validRecordings = [];

      for (const recording of recordings) {
        let isValid = true;

        if (Platform.OS === 'web' && recording.isWebRecording) {
          if (recording.audioUri.startsWith('blob:')) {
            isValid = false;
          }
        } else {
          // 檢查文件是否存在
          if (recording.audioUri) {
            try {
              const { FileSystem } = require('expo-file-system');
              const fileInfo = await FileSystem.getInfoAsync(recording.audioUri);
              isValid = fileInfo.exists;
            } catch {
              isValid = false;
            }
          }
        }

        if (isValid) {
          validRecordings.push(recording);
        }
      }

      await AsyncStorage.setItem('recordings', JSON.stringify(validRecordings));
    } catch (error) {
      console.error('清理過期錄音失敗:', error);
    }
  },

  // 更新錄音記錄（例如添加轉錄文本）
  async updateRecording(recordingId: string, updates: Partial<RecordingData>): Promise<void> {
    try {
      const recordings = await this.getAllRecordings();
      const updatedRecordings = recordings.map(rec => 
        rec.id === recordingId ? { ...rec, ...updates } : rec
      );
      await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
    } catch (error) {
      console.error('更新錄音記錄失敗:', error);
      throw new Error('無法更新錄音記錄');
    }
  },

  // 檢查設備錄音功能
  async checkRecordingCapability(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web 平台檢查
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.log('此瀏覽器不支持錄音功能');
          return false;
        }
        // 測試是否能獲取麥克風權限
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
      } else {
        // Native 平台檢查
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== 'granted') {
          console.log('沒有錄音權限');
          return false;
        }

        // 檢查音訊模式設置
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false
          });
          return true;
        } catch (error) {
          console.error('設置音訊模式失敗:', error);
          return false;
        }
      }
    } catch (error) {
      console.error('檢查錄音功能時發生錯誤:', error);
      return false;
    }
  },

  // 監控錄音狀態
  async monitorRecordingStatus(
    recording: Audio.Recording,
    onStatus: (status: Audio.RecordingStatus) => void
  ): Promise<void> {
    try {
      recording.setOnRecordingStatusUpdate(onStatus);
      await recording.setProgressUpdateInterval(100); // 每 100ms 更新一次
    } catch (error) {
      console.error('設置錄音狀態監控失敗:', error);
    }
  },

  // Web 平台的錄音處理
  async createWebRecording(): Promise<{ mediaRecorder: MediaRecorder; stream: MediaStream }> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('開始初始化 Web 錄音...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          console.log('收到音訊數據片段');
          audioChunks.push(event.data);
        };

        console.log('Web 錄音初始化成功');
        resolve({ mediaRecorder, stream });
      } catch (error) {
        console.error('創建 Web 錄音失敗:', error);
        reject(error);
      }
    });
  },

  // 停止 Web 錄音並獲取 Base64 數據
  async stopWebRecording(mediaRecorder: MediaRecorder, audioChunks: BlobPart[]): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log('開始處理錄音數據...');
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            console.log('音頻數據轉換為 Base64 成功');
            resolve(reader.result);
          } else {
            reject(new Error('轉換 Base64 失敗'));
          }
        };
        reader.onerror = () => {
          console.error('讀取音頻數據失敗:', reader.error);
          reject(reader.error);
        };
        reader.readAsDataURL(audioBlob);
      } catch (error) {
        console.error('處理錄音數據失敗:', error);
        reject(error);
      }
    });
  },

  // Web 平台的錄音保存
  async saveWebRecording(audioBlob: Blob, customer: Customer): Promise<RecordingData> {
    try {
      console.log('開始保存 Web 錄音...');
      
      // 將 Blob 轉換為 Base64
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('轉換 Base64 失敗'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(audioBlob);
      });

      console.log('音頻已轉換為 Base64 格式');

      const newRecording: RecordingData = {
        id: Date.now().toString(),
        audioUri: base64Audio,  // 直接存儲 Base64 數據
        customerId: customer.id,
        customerName: customer.name,
        createdAt: new Date(),
        duration: 0,
        isWebRecording: true,
        mimeType: audioBlob.type || 'audio/wav'
      };

      await this.saveRecording(newRecording);
      console.log('Web 錄音保存成功');
      
      return newRecording;
    } catch (error) {
      console.error('保存 Web 錄音失敗:', error);
      throw error;
    }
  },

  // 轉換音頻格式為 MP3
  async _convertToMP3(blob: Blob): Promise<Blob> {
    // 這裡使用 Web Audio API 進行格式轉換
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // 創建離線音頻上下文
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    const renderedBuffer = await offlineContext.startRendering();
    
    // 將 AudioBuffer 轉換為 WAV 格式（瀏覽器更廣泛支持）
    const wavBlob = await this._audioBufferToWAV(renderedBuffer);
    return new Blob([wavBlob], { type: 'audio/wav' });
  },

  // 將 AudioBuffer 轉換為 WAV 格式
  _audioBufferToWAV(buffer: AudioBuffer): Blob {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    
    // WAV 文件頭
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);
    
    // 寫入音頻數據
    const offset = 44;
    const data = new Float32Array(buffer.length * numberOfChannels);
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      data.set(buffer.getChannelData(i), buffer.length * i);
    }
    
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    }
    
    return new Blob([view], { type: 'audio/wav' });
  },

  // 存儲音頻 Blob 數據
  async storeAudioBlob(id: string, blob: Blob): Promise<void> {
    try {
      if ('indexedDB' in window) {
        const db = await this.openIndexedDB();
        const transaction = db.transaction(['audioFiles'], 'readwrite');
        const store = transaction.objectStore('audioFiles');
        await store.put(blob, id);
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          localStorage.setItem(`audio_${id}`, reader.result as string);
        };
      }
    } catch (error) {
      console.error('存儲音頻數據失敗:', error);
      throw error;
    }
  },

  // 從 IndexedDB 獲取音頻 Blob
  async getAudioBlob(id: string): Promise<Blob | null> {
    if (!('indexedDB' in window)) {
      return null;
    }

    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['audioFiles'], 'readonly');
      const store = transaction.objectStore('audioFiles');
      const request = store.get(id);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result as Blob);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('從 IndexedDB 獲取音頻失敗:', error);
      return null;
    }
  },

  // 初始化 IndexedDB
  async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AudioDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('audioFiles')) {
          db.createObjectStore('audioFiles');
        }
      };
    });
  },

  // 獲取音頻數據
  async getAudioData(recording: RecordingData): Promise<string | Blob> {
    try {
      if (Platform.OS === 'web' && recording.isWebRecording) {
        // 如果是 Base64 格式，直接返回
        if (recording.audioUri.startsWith('data:')) {
          return recording.audioUri;
        }
        
        // 如果是舊的 Blob URL 格式的數據，返回一個錯誤
        if (recording.audioUri.startsWith('blob:')) {
          throw new Error('錄音數據已過期，請重新錄製');
        }
      }
      return recording.audioUri;
    } catch (error) {
      console.error('獲取音頻數據失敗:', error);
      throw error;
    }
  },

  // 批量刪除錄音記錄
  async deleteMultipleRecordings(recordingIds: string[]): Promise<void> {
    try {
      if (!recordingIds || recordingIds.length === 0) {
        console.warn('沒有要刪除的錄音');
        return;
      }

      console.log('=== 開始批量刪除錄音 ===');
      console.log('要刪除的錄音 IDs:', recordingIds);

      // 1. 獲取所有錄音
      const recordings = await this.getAllRecordings();
      console.log('當前錄音總數:', recordings.length);

      // 2. 找到要刪除的錄音
      const recordingsToDelete = recordings.filter(rec => recordingIds.includes(rec.id));
      console.log('找到要刪除的錄音數量:', recordingsToDelete.length);

      // 3. 處理每個錄音的資源
      for (const recording of recordingsToDelete) {
        try {
          if (Platform.OS === 'web') {
            if (recording.audioUri.startsWith('data:')) {
              console.log(`錄音 ${recording.id}: Base64 格式，直接刪除`);
            } else if (recording.audioUri.startsWith('blob:')) {
              console.log(`錄音 ${recording.id}: 釋放 Blob URL`);
              URL.revokeObjectURL(recording.audioUri);
            }
          } else {
            // 移動平台：嘗試刪除文件
            try {
              const recordingUri = await this.getRecordingUri(recording.id);
              const fileInfo = await FileSystem.getInfoAsync(recordingUri);
              
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(recordingUri, { idempotent: true });
                console.log(`錄音 ${recording.id}: 音頻文件已刪除`);
              } else {
                console.log(`錄音 ${recording.id}: 文件不存在，跳過文件刪除`);
              }
            } catch (fileError) {
              // 如果文件操作失敗，只記錄日誌，不拋出錯誤
              console.log(`錄音 ${recording.id}: 文件操作失敗，但繼續處理`);
            }
          }
        } catch (error) {
          // 單個錄音處理失敗不應該影響整體流程
          console.log(`錄音 ${recording.id}: 處理失敗，但繼續執行`, error);
        }
      }

      // 4. 更新存儲的錄音列表
      const updatedRecordings = recordings.filter(rec => !recordingIds.includes(rec.id));
      console.log('更新後的錄音數量:', updatedRecordings.length);
      
      // 確保更新 AsyncStorage
      await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
      console.log('錄音列表已更新');
      console.log('=== 批量刪除錄音完成 ===');

    } catch (error) {
      console.error('批量刪除錄音失敗:', error);
      throw new Error('批量刪除錄音失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  },

  // 在獲取錄音資訊時添加檔案大小
  async getRecordingInfo(uri: string): Promise<{ duration: number; fileSize: number }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      // 獲取音訊時長
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      const duration = status.isLoaded ? status.durationMillis || 0 : 0;
      
      await sound.unloadAsync();
      
      return {
        duration,
        fileSize: fileInfo.exists ? fileInfo.size || 0 : 0,
      };
    } catch (error) {
      console.error('獲取錄音資訊失敗:', error);
      return { duration: 0, fileSize: 0 };
    }
  },

  // 格式化檔案大小
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}; 