import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import { settingsService } from './settingsService';

// 確保在使用 AuthSession 之前註冊 WebBrowser
WebBrowser.maybeCompleteAuthSession();

// Google OAuth 設定
const config = {
  clientId: '您的clientId',
  scopes: ['https://www.googleapis.com/auth/drive.file'],
};

class GoogleDriveService {
  private accessToken: string | null = null;

  // 取得 access token
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    
    const request = await AuthSession.makeAuthRequestAsync({
      clientId: config.clientId,
      scopes: config.scopes,
      responseType: AuthSession.ResponseType.Token,
    }, {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    });

    const result = await request.promptAsync();
    
    if (result.type === 'success' && result.params.access_token) {
      this.accessToken = result.params.access_token;
      return this.accessToken;
    }
    
    throw new Error('無法取得 access token');
  }

  // 生成檔案名稱
  private async generateFileName(recording: {
    customerName: string;
    clinicName?: string;
    phoneNumber?: string;
    location?: { latitude: number; longitude: number };
    createdAt: Date;
  }): Promise<string> {
    const settings = await settingsService.loadSettings();
    
    const clinicName = recording.clinicName || settings.defaultClinicName || '未知診所';
    const phoneNumber = recording.phoneNumber || settings.defaultPhoneNumber || '未知電話';
    const location = recording.location || { latitude: 0, longitude: 0 };
    const timestamp = recording.createdAt.toISOString().replace(/[:.]/g, '-');
    
    return `${recording.customerName}.${clinicName}.${phoneNumber}.${location.latitude},${location.longitude}.${timestamp}`;
  }

  // 上傳檔案到 Google Drive
  async uploadFile(filePath: string, recording: {
    customerName: string;
    clinicName?: string;
    phoneNumber?: string;
    location?: { latitude: number; longitude: number };
    createdAt: Date;
  }) {
    try {
      const accessToken = await this.getAccessToken();
      const fileName = await this.generateFileName(recording);
      
      // 讀取檔案內容
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error('檔案不存在');
      }

      // 建立 multipart form data
      const formData = new FormData();
      
      // 添加 metadata
      const metadata = {
        name: fileName,
        mimeType: 'audio/m4a',
      };
      
      formData.append('metadata', JSON.stringify(metadata), {
        type: 'application/json',
      });

      // 添加檔案內容
      formData.append('file', {
        uri: filePath,
        type: 'audio/m4a',
        name: fileName,
      } as any);

      // 發送請求
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`上傳失敗: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        fileId: result.id,
        fileName: result.name,
        webViewLink: result.webViewLink,
      };
    } catch (error) {
      console.error('上傳檔案到 Google Drive 失敗:', error);
      throw error;
    }
  }

  // 檢查是否已登入
  async isSignedIn(): Promise<boolean> {
    try {
      return !!this.accessToken;
    } catch (error) {
      console.error('檢查登入狀態失敗:', error);
      return false;
    }
  }

  // 登入 Google 帳號
  async signIn() {
    try {
      const accessToken = await this.getAccessToken();
      return { accessToken };
    } catch (error) {
      console.error('Google 登入失敗:', error);
      throw error;
    }
  }

  // 登出 Google 帳號
  async signOut() {
    try {
      this.accessToken = null;
    } catch (error) {
      console.error('Google 登出失敗:', error);
      throw error;
    }
  }
}

export const googleDriveService = new GoogleDriveService(); 