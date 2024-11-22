export const config = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
    timeout: 5000,
  },
  app: {
    version: process.env.APP_VERSION || '1.0.0',
  }
}; 