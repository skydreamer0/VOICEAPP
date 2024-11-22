// index.js
// 應用程式的主入口
// 使用 Expo 的 registerRootComponent 註冊根元件
// 專注於應用程式的啟動和註冊是 React Native/Expo 的標準入口點
// 這種結構允許在不同平台（iOS、Android、Web）上使用相同的啟動機制
// 保持為純 JavaScript，確保與 Expo 的啟動機制完全兼容

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App); 