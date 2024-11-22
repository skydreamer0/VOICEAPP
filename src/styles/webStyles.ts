import { Platform } from 'react-native';

export const webStyles = Platform.OS === 'web' ? {
  container: {
    maxWidth: 768,
    margin: '0 auto',
    height: '100vh',
    backgroundColor: '#fff',
  },
  recordButton: {
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.8,
    },
  },
  // 其他 Web 特定樣式...
} : {}; 