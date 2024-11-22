import { useApp } from '../context/AppContext';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 創建一個自定義 hook 來處理錯誤
export function useErrorHandler() {
  const { dispatch } = useApp();
  
  return {
    handleError(error: unknown) {
      if (error instanceof AppError) {
        dispatch({ type: 'SET_ERROR', payload: error });
      } else {
        console.error('未知錯誤:', error);
      }
    }
  };
}

// 修改 errorHandler 為一個工具函數
export const errorHandler = {
  formatError(error: unknown): string {
    if (error instanceof AppError) {
      return `${error.name}: ${error.message} (${error.code})`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}; 