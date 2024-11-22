# 更新日誌

此專案的所有重要更改都會記錄在此文件中。

格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
並且本專案遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

## [Unreleased]

### 🚧 開發中
- 音頻轉碼優化
- 離線存儲改進
- 性能監控系統
- 用戶體驗改進

## [0.2.0] - 2023-11-20

### 📱 Android 發布準備
- 配置 Android 應用簽名
  - 生成發布密鑰
  - 設置 Gradle 簽名配置
  - 更新 app.json 的 Android 配置
- 實現 Android 特定功能
  - 添加後台錄音支援
  - 配置通知權限
  - 優化 Android 音頻處理

### 🧪 測試框架
- 設置 Jest 測試環境
  - 配置測試腳本
  - 添加測試工具函數
  - 設置測試覆蓋率報告
- 實現單元測試
  - 錄音核心功能測試
  - 工具函數測試
  - UI 元件測試
- 添加 E2E 測試
  - 設置 Detox 測試環境
  - 編寫基礎功能測試用例
  - 配置 CI 測試流程

### 🔄 CI/CD 配置
- 設置 GitHub Actions
  - 自動化測試工作流
  - 代碼品質檢查
  - 自動版本發布
- 配置 EAS Build
  - 設置開發版本構建
  - 配置預覽版本發布
  - 準備生產環境發布

### 🔧 開發工具改進
- 添加開發輔助工具
  - 配置 React DevTools
  - 設置 Flipper 調試
  - 添加性能監控工具
- 改進開發流程
  - 更新 Git Hooks
  - 添加提交訊息檢查
  - 配置自動格式化

## [0.1.0] - 2023-11-15

### ✨ 新功能
- 專案初始化與環境配置
  - 整合 Expo SDK
  - 配置 TypeScript
  - 設置開發環境
- 基礎錄音功能
  - 實現音頻錄製
  - 基礎檔案存儲
  - 權限管理
- UI 框架搭建
  - 實現基礎導航
  - 建立主題系統
  - 設計基礎元件

### 🏗️ 架構設計
- 建立專案結構
  - 組織代碼目錄
  - 設置路由系統
  - 配置狀態管理
- 整合核心依賴
  - 添加必要套件
  - 配置開發工具
  - 設置測試環境

### 📚 文檔
- 初始化 README.md
- 建立開發指南
- 添加代碼規範

### 🔧 開發環境
- 配置 ESLint 和 Prettier
- 設置 Git 工作流
- 添加編輯器配置

[Unreleased]: https://github.com/yourusername/voicememo/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/yourusername/voicememo/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yourusername/voicememo/releases/tag/v0.1.0
