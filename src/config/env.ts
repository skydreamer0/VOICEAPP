import Constants from 'expo-constants';

export const ENV = {
  TRANSCRIPTION_API_KEY: Constants.expoConfig?.extra?.transcriptionApiKey,
  REFINEMENT_API_KEY: Constants.expoConfig?.extra?.refinementApiKey,
}; 