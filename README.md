# VoiceMemo App

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.72.6-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2049-black.svg)](https://expo.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

智能語音備忘錄應用程式，專注於提供高效的語音轉文字與AI輔助文字處理體驗。

## 🌟 主要特點

- 🎙️ 專業級錄音功能，支援多種音頻格式
- 🤖 AI驅動的語音轉文字與文字潤飾
- 📱 跨平台支援 (iOS, Android, Web)
- 🔒 安全的數據存儲與處理
- 🌓 深色模式支援
- 🌐 離線功能支援

## 📱 系統需求

- iOS 13.0 或更高版本
- Android 8.0 (API Level 26) 或更高版本
- Node.js 16.x 或更高版本
- Expo CLI 6.x

## 🚀 快速開始

### 環境設置

安裝依賴
```bash
npm install
```

啟動開發伺服器
```bash
npx expo start
```

選擇運行平台:
- 按 `i` 在 iOS 模擬器運行
- 按 `a` 在 Android 模擬器運行
- 按 `w` 運行 Web 版本

或直接指定平台:
```bash
# iOS
npx expo start --ios

# Android 
npx expo start --android

# Web
npx expo start --web
```

開發版本構建:
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### 環境變數配置

在專案根目錄建立 `.env` 檔案:
```plaintext
API_KEY=your_api_key
API_URL=your_api_url
ENVIRONMENT=development
```

然後在 `app.config.ts` 中配置:
```typescript
export default {
  expo: {
    // ... 其他配置
    extra: {
      apiKey: process.env.API_KEY,
      apiUrl: process.env.API_URL,
      environment: process.env.ENVIRONMENT || 'development'
    },
    plugins: [
      // ... 其他插件
    ]
  }
};
```

## 🏗️ 專案結構


```
src/
├── components/ # UI元件
│ ├── common/ # 通用元件
│ ├── recording/ # 錄音相關元件
│ └── customer/ # 客戶相關元件
├── screens/ # 頁面元件
├── services/ # API與業務邏輯
├── hooks/ # 自定義Hooks
├── context/ # 全局狀態管理
├── navigation/ # 路由配置
├── utils/ # 工具函數
├── types/ # TypeScript類型定義
└── theme/ # 主題配置
```

## 🔧 核心技術

- **前端框架**: React Native + Expo
- **狀態管理**: React Context + useReducer
- **API整合**: React Query
- **樣式方案**: Styled Components
- **音頻處理**: Expo AV
- **數據存儲**: AsyncStorage + IndexedDB (Web)
- **測試工具**: Jest + React Native Testing Library

## 📊 性能優化

- 使用 React.memo() 減少不必要的重渲染
- 實現虛擬列表優化長列表性能
- 音頻資源的智能預加載與釋放
- 使用 Web Workers 處理複雜運算
- 實現漸進式圖片加載


## 📝 版本日誌

### v1.0.0 (2024-03-xx)
- 初始版本發布
- 實現基礎錄音功能
- 完成UI框架搭建
- 整合核心API服務

[完整版本日誌](CHANGELOG.md)

## 🙏 鳴謝

感謝以下開源專案的貢獻：

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [React Navigation](https://reactnavigation.org/)