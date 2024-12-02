export interface RecordingData {
  id: string;
  audioUri: string;
  customerId: string;
  customerName: string;
  clinicName?: string;
  phoneNumber?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  duration: number;
  isWebRecording: boolean;
  mimeType: string;
  fileSize?: number;
  googleDriveFileId?: string;
  googleDriveLink?: string;
}
