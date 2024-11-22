import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { TextStyle } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';

// 基礎錄音類型
export interface BaseRecording {
  id: string;
  duration: number;
  createdAt: Date;
}

// 本地錄音類型
export interface Recording extends BaseRecording {
  uri: string;
}

// Web 錄音相關類型
export interface WebRecording {
  mediaRecorder: MediaRecorder;
  stream: MediaStream;
  audioChunks: BlobPart[];
}

// Web 錄音狀態
export interface WebRecordingState {
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
  audioChunks: BlobPart[];
}

// 擴展的錄音數據類型
export interface RecordingData extends BaseRecording {
  audioUri: string;
  customerId: string;
  customerName: string;
  isWebRecording?: boolean;
  mimeType?: string;
  transcription?: string;
  fileSize?: number;
}

// 導航相關類型
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  Settings: undefined;
  Recordings: undefined;
  CustomerCreate: undefined;
};

export type RootTabParamList = {
  Home: undefined | { selectedCustomer: Customer };
  History: undefined;
  Customers: undefined;
  Profile: undefined;
};

export type CustomerStackParamList = {
  CustomerList: undefined;
  CustomerCreate: undefined;
  CustomerEdit: { customerId: string };
  CustomerDetail: { customerId: string };
};

// 導航屬性類型
export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

// 客戶相關類型
export interface CreateCustomerData {
  name: string;
  address: string;
  phone: string;
}

export interface Customer extends CreateCustomerData {
  id: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

// 其他通用類型
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface HeaderStyle extends TextStyle {
  color: string;
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
  lineHeight: number;
  letterSpacing: number;
}

// 添加 FileSystem 相關類型
export interface FileInfo {
  exists: boolean;
  size?: number;
  uri: string;
  isDirectory: boolean;
  modificationTime?: number;
  md5?: string;
}