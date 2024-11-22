// AppContext.tsx
// 檔案位置：src/context/AppContext.tsx
// 該代碼主要功能：提供應用程式狀態管理

import { createContext, useContext, useReducer } from 'react';
import { RecordingData } from '../types';
import { AppError } from '../services/errorHandling';

// 定義 User 介面
interface User {
  id: string;
  name: string;
  email: string;
  // 其他用戶相關欄位...
}

// 定義 Action 類型
type AppAction = 
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RECORDING'; payload: RecordingData }
  | { type: 'SET_RECORDINGS'; payload: RecordingData[] }
  | { type: 'SET_ERROR'; payload: AppError }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_USER' };

// 應用程式狀態介面
interface AppState {
  currentUser?: User;
  isLoading: boolean;
  lastRecording?: RecordingData;
  error?: AppError;
  recordings: RecordingData[];
}

// 初始狀態
const initialState: AppState = {
  isLoading: false,
  recordings: []
};

// 建立 Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Reducer 函數
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_RECORDING':
      return { ...state, lastRecording: action.payload };
    case 'SET_RECORDINGS':
      return { ...state, recordings: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: undefined };
    case 'CLEAR_USER':
      return { ...state, currentUser: undefined };
    default:
      return state;
  }
}

// Context Provider 元件
export function AppProvider({ children }: { children: React.ReactNode }) {
  console.log('=== AppProvider 渲染 ===');
  
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  console.log('當前 Context 狀態:', state);

  const wrappedDispatch = (action: AppAction) => {
    console.log('發送 Action:', action);
    dispatch(action);
  };

  return (
    <AppContext.Provider value={{ state, dispatch: wrappedDispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom Hook 用於存取 Context
export function useApp() {
  console.log('useApp Hook 被調用');
  const context = useContext(AppContext);
  if (context === undefined) {
    console.error('useApp 必須在 AppProvider 內使用');
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 