// HomeScreen.tsx
//檔案位置：src/screens/HomeScreen.tsx
// 功能：錄音、播放錄音、顯示錄音列表
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal, ScrollView, Animated, TextStyle, ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Recording, WebRecording, Customer, LocationCoords, RecordingData } from '../types';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList, RootTabParamList } from '../types';
import { customerService } from '../services/customerService';
import * as Location from 'expo-location';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { recordingService } from '../services/recordingService';
import { CustomerSelectModal } from '../components/customer/CustomerSelectModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { settingsService } from '../services/settingsService';
import { fileService } from '../services/fileService';

type HomeScreenRouteProp = RouteProp<RootTabParamList, 'Home'>;
type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList>,
  StackNavigationProp<RootStackParamList>
>;

// 修改 WebRecording 類型
interface WebRecordingState extends WebRecording {
  audioChunks: BlobPart[];
}

// 添加格式化時間的函數
const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface RecordingIndicatorProps {
  // 如果需要任何 props，在這裡定義
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = () => {
  const [opacity] = useState(new Animated.Value(0.4));
  
  const indicatorStyles = StyleSheet.create({
    recordingIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.error,
      marginRight: theme.spacing.sm,
    }
  });

  useEffect(() => {
    const animationConfig = {
      toValue: 1,
      duration: 1000,
      useNativeDriver: Platform.OS !== 'web'
    };

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          ...animationConfig,
          toValue: 1,
        }),
        Animated.timing(opacity, {
          ...animationConfig,
          toValue: 0.4,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        indicatorStyles.recordingIndicator,
        { opacity },
      ]}
    />
  );
};

// 修改 MediaRecorder 錯誤事件的類型定義
interface MediaRecorderErrorEvent {
  name: string;
  message: string;
}

// 添加台灣時區轉換函數
const getTaiwanDateTime = () => {
  const date = new Date();
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
};

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  console.log('=== HomeScreen 渲染 ===');
  
  const { state, dispatch } = useApp();
  console.log('Context 狀態:', state);
  
  const { isLoading, lastRecording } = state;
  const [recording, setRecording] = useState<Audio.Recording | WebRecordingState | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<{
    isRecording: boolean;
    durationMillis: number;
    isDoneRecording: boolean;
  }>({
    isRecording: false,
    durationMillis: 0,
    isDoneRecording: false,
  });
  const [isDeviceCapable, setIsDeviceCapable] = useState(true);

  const route = useRoute<HomeScreenRouteProp>();
  const selectedCustomer = route.params?.selectedCustomer;
  
  // 新增客戶相關狀態
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);

  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [durationInterval, setDurationInterval] = useState<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // 在 useEffect 中處理選擇的客戶
  useEffect(() => {
    if (selectedCustomer) {
      setCurrentCustomer(selectedCustomer);
    }
  }, [selectedCustomer]);

  const handleHapticFeedback = async () => {
    console.log('觸發觸覺反饋');
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('觸覺反饋成功');
    } catch (error) {
      console.log('觸覺反饋失敗:', error);
    }
  };

  // 在組件掛載時初始化音訊設置
  useEffect(() => {
    const initAudio = async () => {
      try {
        console.log('初始化音訊設置...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,  // 允許背景錄音
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,      // 使用正確的枚舉值
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,  // 其他音訊播放時降低音量
          playThroughEarpieceAndroid: false  // 使用揚聲器而不是聽筒
        });
        console.log('音訊設置完成');
      } catch (error) {
        console.error('音訊初始化錯誤:', error);
      }
    };

    initAudio();
  }, []);

  // 檢查設備錄音功能
  useEffect(() => {
    const checkDevice = async () => {
      const isCapable = await recordingService.checkRecordingCapability();
      setIsDeviceCapable(isCapable);
      if (!isCapable) {
        Alert.alert('警告', '您的設備不支持錄音功能');
      }
    };
    checkDevice();
  }, []);

  // 開始錄音
  const startRecording = async () => {
    try {
      if (!currentCustomer) {
        setShowAlert(true);
        return;
      }

      console.log('=== 開始錄音流程 ===');

      // 檢查權限
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要權限', '請允許應用程式使用麥克風');
        return;
      }

      if (Platform.OS === 'web') {
        console.log('Web 平台: 初始化錄音...');
        if (!navigator.mediaDevices) {
          throw new Error('瀏覽器不支持錄音功能');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('獲取音頻流成功');

        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            console.log('收到音頻數據片段');
            audioChunks.push(event.data);
          }
        };

        // 修正錯誤處理
        mediaRecorder.addEventListener('error', (event) => {
          console.error('錄音錯誤:', event);
          Alert.alert('錯誤', '錄音過程中發生錯誤');
          
          // 清理資源
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          setIsPaused(false);
          
          if (durationInterval) {
            clearInterval(durationInterval);
            setDurationInterval(null);
          }
        });

        // 開始錄音
        mediaRecorder.start();
        console.log('Web 錄音已開始');

        setRecording({ mediaRecorder, stream, audioChunks } as WebRecordingState);
        setIsRecording(true);
        setIsPaused(false); // 確保初始狀態為非暫停
        setRecordingStatus({
          isRecording: true,
          durationMillis: 0,
          isDoneRecording: false,
        });

        // 開始時
        const interval = setInterval(() => {
          setRecordingStatus(prev => ({
            ...prev,
            durationMillis: prev.durationMillis + 1000,
          }));
        }, 1000);
        
        setDurationInterval(interval);

      } else {
        // Native 平台錄音邏輯
        console.log('Native 平台: 初始化錄音...');
        
        const newRecording = new Audio.Recording();
        
        try {
          // 準備錄音
          await newRecording.prepareToRecordAsync({
            android: {
              extension: '.m4a',
              outputFormat: Audio.AndroidOutputFormat.MPEG_4,
              audioEncoder: Audio.AndroidAudioEncoder.AAC,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 128000,
            },
            ios: {
              extension: '.m4a',
              outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
              audioQuality: Audio.IOSAudioQuality.HIGH,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 128000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
            web: {
              mimeType: 'audio/webm',
              bitsPerSecond: 128000,
            }
          });

          console.log('開始錄音...');
          await newRecording.startAsync();
          
          setRecording(newRecording);
          setIsRecording(true);
          setIsPaused(false);
          
          // 開始計時
          const interval = setInterval(() => {
            setRecordingStatus(prev => ({
              ...prev,
              durationMillis: prev.durationMillis + 1000,
              isRecording: true,
            }));
          }, 1000);
          
          setDurationInterval(interval);
          
          console.log('錄音已開始');
          
        } catch (error) {
          console.error('準備或開始錄音時發生錯誤:', error);
          throw error;
        }
      }

    } catch (error) {
      console.error('開始錄音時發生錯誤:', error);
      Alert.alert('錯誤', '無法開始錄音');
    }
  };

  // 停止錄音
  const stopRecording = async () => {
    try {
      console.log('=== 停止錄音流程 ===');
      
      if (!recording || !currentCustomer) {
        console.log('無效的錄音狀態或未選擇客戶');
        return;
      }

      // 停止計時
      if (durationInterval) {
        clearInterval(durationInterval);
        setDurationInterval(null);
      }

      if (Platform.OS !== 'web') {
        try {
          console.log('停止錄音...');
          
          if (recording instanceof Audio.Recording) {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log('錄音檔案 URI:', uri);

            if (!uri) {
              throw new Error('無法獲取錄音檔案');
            }

            // 從 settingsService 獲取預設診所資訊
            const settings = await settingsService.loadSettings();

            // 創建新的錄音記錄
            const newRecording: RecordingData = {
              id: Date.now().toString(),
              audioUri: uri,
              customerId: currentCustomer.id,
              customerName: currentCustomer.name,
              clinicName: currentCustomer.address || settings.defaultClinicName || '未知診所',
              phoneNumber: currentCustomer.phone || settings.defaultPhoneNumber || '未知電話',
              location: {
                latitude: currentCustomer.latitude || 0,
                longitude: currentCustomer.longitude || 0
              },
              createdAt: getTaiwanDateTime(),
              duration: recordingStatus.durationMillis,
              isWebRecording: false,
              mimeType: 'audio/m4a'
            };

            // 使用 fileService 儲存檔案
            try {
              const { filePath, fileName } = await fileService.saveFile(uri, {
                customerName: currentCustomer.name,
                clinicName: currentCustomer.address,
                phoneNumber: currentCustomer.phone || settings.defaultPhoneNumber,
                location: {
                  latitude: currentCustomer.latitude || 0,
                  longitude: currentCustomer.longitude || 0
                },
                createdAt: getTaiwanDateTime()
              });

              // 更新錄音記錄的 URI 為新的檔案路徑
              newRecording.audioUri = filePath;
              
              // 儲存錄音記錄
              await recordingService.saveRecording(newRecording);
              console.log('錄音保存成功，檔案名稱:', fileName);
            } catch (error) {
              console.error('儲存檔案失敗:', error);
              throw error;
            }
          }

          // 重置狀態
          setRecording(null);
          setIsRecording(false);
          setIsPaused(false);
          setRecordingStatus({
            isRecording: false,
            durationMillis: 0,
            isDoneRecording: true,
          });

        } catch (error) {
          console.error('停止錄音時發生錯誤:', error);
          throw error;
        }
      }

      Alert.alert(
        '錄音已保存',
        `已為客戶 ${currentCustomer.name} 保存錄音檔案\n時長: ${Math.floor(recordingStatus.durationMillis / 1000)}秒`
      );

    } catch (error) {
      console.error('停止錄音時發生錯誤:', error);
      Alert.alert('錯誤', '無法停止錄音');
    }
  };

  // 清理函數
  useEffect(() => {
    return () => {
      if (durationInterval) {
        clearInterval(durationInterval);
      }
    };
  }, [durationInterval]);

  // 修改錄音狀態顯示
  const renderRecordingStatus = () => {
    if (!recordingStatus.isRecording && !recordingStatus.isDoneRecording) {
      return null;
    }

    return (
      <View style={styles.recordingStatusContainer}>
        {recordingStatus.isRecording && (
          <View style={styles.recordingInfoContainer}>
            <View style={styles.recordingTimeRow}>
              <View style={styles.recordingTimeContainer}>
                <Ionicons 
                  name="mic" 
                  size={20} 
                  color={theme.colors.error} 
                />
                <Text style={styles.recordingTimeText}>
                  {formatDuration(recordingStatus.durationMillis)}
                </Text>
              </View>
              <Text style={styles.recordingStatusText}>
                {isPaused ? '已暫停' : '正在錄音...'}
              </Text>
            </View>
            <Text style={styles.recordingHintText}>
              {isPaused ? '點擊繼續以恢復錄音' : '點擊暫停或停止按鈕'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Web 平台特定的錄音邏輯
  const startWebRecording = async () => {
    try {
      console.log('開始 Web 錄音...');
      if (!navigator.mediaDevices) {
        throw new Error('瀏覽器不支持錄功能');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      // 設置數據處理
      mediaRecorder.ondataavailable = (event) => {
        console.log('收到音數據片段');
        audioChunks.push(event.data);
      };

      // 開始錄音
      mediaRecorder.start();
      console.log('Web 錄音已開始');
      
      // 保存錄音關數據
      setRecording({ 
        mediaRecorder, 
        stream,
        audioChunks  // 保存音頻數據數組
      } as WebRecording);
      setIsRecording(true);
      
    } catch (error) {
      console.error('Web 錄音錯誤:', error);
      Alert.alert('錄音錯誤', '無法啟動錄音');
    }
  };

  const stopWebRecording = async () => {
    try {
      console.log('準備停止 Web 錄音...');
      if (!recording || !('mediaRecorder' in recording) || !currentCustomer) {
        console.log('無效的錄音狀態或未選擇客戶');
        return;
      }

      const webRecording = recording as WebRecording & { audioChunks: BlobPart[] };
      
      return new Promise<void>((resolve) => {
        // 設置停止錄音時的處理
        webRecording.mediaRecorder.onstop = async () => {
          console.log('Web 錄音已停止');
          
          try {
            // 創建音頻 Blob
            const audioBlob = new Blob(webRecording.audioChunks, { type: 'audio/wav' });
            console.log('音頻 Blob 創建，大小:', audioBlob.size);
            
            // 保存錄音
            console.log('準備保存 Web 錄音...');
            const newRecording = await recordingService.saveWebRecording(audioBlob, currentCustomer);
            console.log('Web 錄音保存成功:', newRecording);
            
            // 更新全局狀態
            dispatch({ 
              type: 'SET_RECORDING', 
              payload: newRecording 
            });

            // 顯示成功提示
            Alert.alert(
              '音已保存',
              `已為客戶 ${currentCustomer.name} 保存錄音檔案`,
              [{ text: '確定' }]
            );

            // 清理資源
            webRecording.stream.getTracks().forEach(track => {
              console.log('停止音頻軌道');
              track.stop();
            });
            
            resolve();
          } catch (error) {
            console.error('保存 Web 錄音時發生錯誤:', error);
            Alert.alert('錯誤', '無法保存錄音');
            resolve();
          }
        };

        // 停止錄音
        console.log('用 mediaRecorder.stop()');
        webRecording.mediaRecorder.stop();
      });
    } catch (error) {
      console.error('停止 Web 錄音時生誤:', error);
      Alert.alert('錯誤', '無法停止錄音');
    }
  };

  const handleRecordPress = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (!currentCustomer) {
      setShowAlert(true);
      return;
    }

    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  
  // 修改選擇客戶按鈕的處理函數
  const handleSelectCustomer = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsCustomerModalVisible(true);
  };

  // 添加告視窗組件
  const AlertModal = ({ 
    visible, 
    onClose, 
    onConfirm 
  }: { 
    visible: boolean; 
    onClose: () => void; 
    onConfirm: () => void; 
  }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.alertModalContainer}>
        <View style={styles.alertModalContent}>
          <View style={styles.alertModalHeader}>
            <Ionicons 
              name="alert-circle" 
              size={32} 
              color={theme.colors.warning} 
            />
            <Text style={styles.alertModalTitle}>需要選擇客戶</Text>
          </View>
          
          <Text style={styles.alertModalMessage}>
            請選擇一客戶再開始錄音
          </Text>
          
          <View style={styles.alertModalActions}>
            <TouchableOpacity 
              style={[styles.alertModalButton, styles.alertModalCancelButton]}
              onPress={onClose}
            >
              <Text style={styles.alertModalCancelText}>取消</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.alertModalButton, styles.alertModalConfirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.alertModalConfirmText}>選擇客戶</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // 在 HomeScreen 組件中添加狀態
  const [showAlert, setShowAlert] = useState(false);

  // 修改暫停錄音功能，確保計時器正確暫停
  const pauseRecording = async () => {
    try {
      let pauseSuccess = false;

      if (Platform.OS === 'web') {
        if (recording && 'mediaRecorder' in recording) {
          const webRecording = recording as WebRecordingState;
          if (webRecording.mediaRecorder.state === 'recording') {
            webRecording.mediaRecorder.pause();
            pauseSuccess = true;
          }
        }
      } else {
        if (recording instanceof Audio.Recording) {
          await recording.pauseAsync();
          pauseSuccess = true;
        }
      }

      if (pauseSuccess) {
        // 暫停計時器
        if (durationInterval) {
          clearInterval(durationInterval);
          setDurationInterval(null);
        }
        setIsPaused(true);
        console.log('錄音已暫停');
      }
    } catch (error) {
      console.error('暫停錄音失敗:', error);
      Alert.alert('錯誤', '暫停錄音失敗');
    }
  };

  // 修改恢復錄音功能，確保計時器正確恢復
  const resumeRecording = async () => {
    try {
      let resumeSuccess = false;

      if (Platform.OS === 'web') {
        if (recording && 'mediaRecorder' in recording) {
          const webRecording = recording as WebRecordingState;
          if (webRecording.mediaRecorder.state === 'paused') {
            webRecording.mediaRecorder.resume();
            resumeSuccess = true;
          }
        }
      } else {
        if (recording instanceof Audio.Recording) {
          await recording.startAsync();
          resumeSuccess = true;
        }
      }

      if (resumeSuccess) {
        // 重新開始計時，從當前時間繼續
        const interval = setInterval(() => {
          setRecordingStatus(prev => ({
            ...prev,
            durationMillis: prev.durationMillis + 1000,
          }));
        }, 1000);
        setDurationInterval(interval);
        setIsPaused(false);
        console.log('錄音已恢復');
      }
    } catch (error) {
      console.error('恢復錄音失敗:', error);
      Alert.alert('錯誤', '恢復錄音失敗');
    }
  };

  // 修改錄音按鈕區域的渲染
  const renderRecordingControls = () => (
    <View style={styles.recordingControls}>
      {isRecording ? (
        <>
          {isPaused ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.resumeButton]}
              onPress={resumeRecording}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="play" 
                size={24} 
                color={theme.colors.primaryContrast} 
              />
              <Text style={styles.buttonText}>繼續</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, styles.pauseButton]}
              onPress={pauseRecording}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="pause" 
                size={24} 
                color={theme.colors.primaryContrast} 
              />
              <Text style={styles.buttonText}>暫停</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.controlButton, styles.stopButton]}
            onPress={stopRecording}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name="stop" 
              size={24} 
              color={theme.colors.primaryContrast} 
            />
            <Text style={[styles.buttonText, styles.stopButtonText]}>結束</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={[styles.controlButton, styles.recordControlButton]}
          onPress={handleRecordPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name="mic" 
            size={24} 
            color={theme.colors.primaryContrast} 
          />
          <Text style={styles.buttonText}>開始錄音</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // 渲染錄音按鈕
  const renderRecordButton = () => {
    if (!currentCustomer) {
      return (
        <TouchableOpacity
          style={[styles.recordButton, styles.noCustomerButton]}
          onPress={() => setShowAlert(true)}
          disabled={isLoading}
        >
          <View style={styles.recordButtonInner}>
            <Ionicons name="mic" size={32} color={theme.colors.neutral[400]} />
          </View>
        </TouchableOpacity>
      );
    }

    if (isRecording) {
      return (
        <TouchableOpacity
          style={[styles.recordButton, styles.recordingButton]}
          onPress={handleRecordPress}
          disabled={isLoading}
        >
          <View style={styles.recordButtonInner}>
            <Ionicons name="stop" size={32} color={theme.colors.error} />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.recordButton}
        onPress={handleRecordPress}
        disabled={isLoading}
      >
        <View style={styles.recordButtonInner}>
          <Ionicons name="mic" size={32} color={theme.colors.primary} />
        </View>
      </TouchableOpacity>
    );
  }

  // 修改樣式定義
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral[200],
      ...(Platform.OS === 'ios' ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      } : {
        elevation: 2,
      }),
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    selectCustomerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      padding: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      marginVertical: theme.spacing.xs,
      ...(Platform.OS === 'ios' ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      } : {
        elevation: 2,
      }),
    },
    selectCustomerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primaryContrast,
    },
    recordingControlsContainer: {
      width: '100%',
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    customerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
    },
    recordingStatusContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginVertical: theme.spacing.md,
      ...theme.shadows.sm,
    },
    recordingInfoContainer: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    recordingTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    recordingTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.error + '10',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
    },
    recordingTimeText: {
      ...theme.typography.h3,
      color: theme.colors.error,
      marginLeft: theme.spacing.sm,
      fontVariant: ['tabular-nums'],
      fontWeight: '600' as const,
    } as TextStyle,
    recordingStatusText: {
      ...theme.typography.body1,
      color: theme.colors.error,
      fontWeight: '400' as const,
    } as TextStyle,
    recordingHintText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      fontWeight: '400' as const,
    } as TextStyle,
    recordingIndicatorContainer: {
      width: 80,
      height: 80,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.error + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    recordingIndicatorInner: {
      width: '100%',
      height: '100%',
      borderRadius: 6,
      backgroundColor: theme.colors.error,
    },
    recordingControls: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      gap: 16,
    },
    controlButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.sm,
    },
    recordControlButton: {
      backgroundColor: theme.colors.primary,
    },
    pauseButton: {
      backgroundColor: theme.colors.warning,
    },
    resumeButton: {
      backgroundColor: theme.colors.primary,
    },
    stopButton: {
      backgroundColor: theme.colors.error,
    },
    buttonText: {
      ...theme.typography.button,
      color: theme.colors.primaryContrast,
      marginLeft: theme.spacing.sm,
    },
    stopButtonText: {
      color: theme.colors.primaryContrast,
    },
    recordingActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing.lg,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.neutral[100],
      gap: theme.spacing.xs,
    },
    newRecordButton: {
      backgroundColor: theme.colors.primary + '10',
    },
    actionButtonText: {
      ...theme.typography.body2,
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    alertModalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    alertModalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      width: '80%',
      maxWidth: 400,
    },
    alertModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    alertModalTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    alertModalMessage: {
      ...theme.typography.body1,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.lg,
    },
    alertModalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
    alertModalButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      minWidth: 80,
    },
    alertModalCancelButton: {
      backgroundColor: theme.colors.neutral[100],
    },
    alertModalConfirmButton: {
      backgroundColor: theme.colors.primary,
    },
    alertModalCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    alertModalConfirmText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primaryContrast,
      textAlign: 'center',
    },
    recordingIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.error,
      marginRight: theme.spacing.sm,
    },
    recordButton: {
      width: 72,
      height: 72,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.lg,
    },
    recordButtonInner: {
      width: 64,
      height: 64,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    recordingButton: {
      backgroundColor: theme.colors.error,
    },
    customerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    customerDetails: {
      flex: 1,
    },
    customerName: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    customerAddress: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
    },
    noCustomerButton: {
      backgroundColor: theme.colors.neutral[400],
      transform: [{ scale: 1.05 }],
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
    },
  });

  return (
    <SafeAreaView style={[
      styles.container,
      { 
        paddingTop: Platform.OS === 'ios' ? 0 : insets.top 
      }
    ]}>
      <View style={[
        styles.header,
        {
          paddingTop: Platform.OS === 'ios' 
            ? insets.top + theme.spacing.xs 
            : theme.spacing.xs,
        }
      ]}>
        {currentCustomer ? (
          <View style={styles.customerCard}>
            <View style={styles.customerInfo}>
              <Ionicons 
                name="person" 
                size={24} 
                color={theme.colors.primary} 
              />
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{currentCustomer.name}</Text>
                <Text style={styles.customerAddress}>{currentCustomer.address}</Text>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleSelectCustomer}
            style={styles.selectCustomerButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={theme.colors.primaryContrast} 
            />
            <Text style={styles.selectCustomerButtonText}>
              選擇客戶
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {renderRecordingStatus()}
        <View style={styles.recordingControlsContainer}>
          {renderRecordingControls()}
        </View>
        
        {!isRecording && recordingStatus.isDoneRecording && (
          <View style={styles.recordingActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.newRecordButton]}
              onPress={() => {
                setRecordingStatus({
                  isRecording: false,
                  durationMillis: 0,
                  isDoneRecording: false,
                });
                setCurrentCustomer(null);
                setRecording(null);
                setIsRecording(false);
                setIsPaused(false);
                setIsCustomerModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>新錄音</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <AlertModal
        visible={showAlert}
        onClose={() => setShowAlert(false)}
        onConfirm={() => {
          setShowAlert(false);
          handleSelectCustomer();
        }}
      />

      <CustomerSelectModal
        visible={isCustomerModalVisible}
        onClose={() => setIsCustomerModalVisible(false)}
        onSelectCustomer={(selectedCustomer: Customer) => {
          setCurrentCustomer(selectedCustomer);
          setIsCustomerModalVisible(false);
        }}
        navigation={navigation as CompositeNavigationProp<
          BottomTabNavigationProp<RootTabParamList>,
          StackNavigationProp<RootStackParamList>
        >}
      />
    </SafeAreaView>
  );
}
