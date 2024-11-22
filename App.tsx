// App.tsx
// 應用程式的主入口
// 包含錯誤處理、手勢處理、導航容器、狀態欄配置、TabNavigator 和 AppProvider
// 專注於應用程式的實際實現使用 TypeScript，提供更好的型別安全性
import React, { ErrorInfo, ReactNode } from 'react';
import { View, Text, Platform, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { TabNavigator } from './src/navigation/TabNavigator';
import { AppProvider } from './src/context/AppContext';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/theme';

// 忽略特定警告（如果需要的話）
LogBox.ignoreLogs(['Warning: ...']);

// 配置 Paper 主題
const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...theme.colors,
  },
};

// 定義 ErrorBoundary 的 Props 介面
interface ErrorBoundaryProps {
  children: ReactNode;
}

// 定義 ErrorBoundary 的 State 介面
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary 元件
 * 用於捕捉 React 元件樹中的 JavaScript 錯誤
 * 並顯示備用 UI，防止整個應用程式崩潰
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  /**
   * 當子元件拋出錯誤時被調用
   * 用於更新 state，使下一次渲染能夠顯示備用 UI
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * 用於記錄錯誤信息
   * 可以在這裡添加錯誤報告服務（如 Sentry）的整合
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('App Error:', error);
    console.log('Error Info:', errorInfo);
  }

  render() {
    // 當發生錯誤時顯示備用 UI
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong!</Text>
          <Text>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * App 根元件
 * 設置應用程式的基本結構和全局配置
 * 包含:
 * - ErrorBoundary: 錯誤處理
 * - GestureHandlerRootView: 手勢處理的根元件
 * - NavigationContainer: 導航容器
 * - StatusBar: 狀態欄配置
 */
function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <AppProvider>
            <ErrorBoundary>
              <NavigationContainer>
                <TabNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </ErrorBoundary>
          </AppProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
