// ProfileScreen.tsx
//檔案位置：src/screens/ProfileScreen.tsx
// 功能：個人設定
import React from 'react';
import { SafeAreaView, StyleSheet, Alert, View, Text, Switch, Pressable, Button } from 'react-native';
import { theme } from '../theme';
import { RecordingList } from '../components/recording/RecordingList';
import { useRecordings } from '../hooks/useRecordings';
import { useFocusEffect } from '@react-navigation/native';
import { ExpandableSection } from '../components/common/ExpandableSection';
import { FlatList } from 'react-native';
import { useAudioSettings, AudioSettings } from '../hooks/useAudioSettings';
import { Picker } from '@react-native-picker/picker';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// 初始化 Google Sign-In
GoogleSignin.configure({
  androidClientId: '137866435391-rq6mmu3b405m457af9e37kk8o77s8h1s.apps.googleusercontent.com', // 從 google-services.json
  webClientId: '137866435391-rq6mmu3b405m457af9e37kk8o77s8h1s.apps.googleusercontent.com', // 從 Google Cloud Console
  offlineAccess: true,
});

// 定義部分類型
interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
  initiallyExpanded: boolean;
  isRecordingSection?: boolean;
}

interface RenderItemProps {
  item: Section;
}

export function ProfileScreen() {
  const {
    recordings,
    playingId,
    handlePlay,
    handleStop,
    handleDelete,
    handleBatchDelete,
    refreshRecordings,
  } = useRecordings();

  const [selectedRecordings, setSelectedRecordings] = React.useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState(null);

  const { saveSettings, loadSettings, DEFAULT_SETTINGS } = useAudioSettings();
  const [audioSettings, setAudioSettings] = React.useState<AudioSettings>(DEFAULT_SETTINGS);

  React.useEffect(() => {
    loadSettings().then(setAudioSettings);
    // 檢查是否已經登入
    checkIsSignedIn();
  }, []);

  const checkIsSignedIn = async () => {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        const userInfo = await GoogleSignin.signInSilently();
        setUserInfo(userInfo);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      setUserInfo(userInfo);
      Alert.alert('登入成功', '您已成功登入 Google 帳號');
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('取消登入', '您取消了登入程序');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('處理中', '登入程序正在進行中');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('錯誤', '此裝置不支援 Google Play 服務');
      } else {
        Alert.alert('錯誤', '登入時發生錯誤');
        console.error(error);
      }
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setUserInfo(null);
      Alert.alert('登出成功', '您已成功登出 Google 帳號');
    } catch (error) {
      console.error(error);
      Alert.alert('錯誤', '登出時發生錯誤');
    }
  };

  const handleUpload = async () => {
    if (!userInfo) {
      Alert.alert('請先登入', '您需要先登入 Google 帳號才能上傳檔案');
      return;
    }
    // TODO: 實作上傳功能
    Alert.alert('上傳', '即將實作上傳功能');
  };

  const handleRecordingSelect = (recordingId: string) => {
    setSelectedRecordings(prev => {
      if (prev.includes(recordingId)) {
        return prev.filter(id => id !== recordingId);
      } else {
        return [...prev, recordingId];
      }
    });
  };

  // 在設定變更時添加提示
  const handleSettingsChange = async (newSettings: AudioSettings) => {
    try {
      console.log('=== 開始更新音訊設定 ===');
      console.log('舊設定:', audioSettings);
      console.log('新設定:', newSettings);
      
      await saveSettings(newSettings);
      setAudioSettings(newSettings);
      
      console.log('設定已更新並保存');
      Alert.alert('設定已更新', '新的錄音設定已生效');
      console.log('=== 音訊設定更新完成 ===');
    } catch (error) {
      console.error('更新設定失敗:', error);
      Alert.alert('錯誤', '設定更新失敗，請稍後再試');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = () => {
        // 清理工作（如果需要）
      };
      
      // 只在首次加載和切換到此頁面時刷新
      refreshRecordings();
      
      return () => unsubscribe();
    }, [])  // 移除 refreshRecordings 依賴
  );

  // 定義設定項目數據
  const sections: Section[] = [
    {
      id: '1',
      title: '錄音檔案',
      content: (
        <View>
          <View style={styles.buttonContainer}>
            {userInfo ? (
              <>
                <Button title="上傳檔案" onPress={handleUpload} />
                <Button title="登出" onPress={signOut} color="red" />
              </>
            ) : (
              <Button title="使用 Google 登入" onPress={signIn} />
            )}
          </View>
          <RecordingList
            recordings={recordings}
            playingId={playingId}
            onPlay={handlePlay}
            onStop={handleStop}
            onDelete={handleDelete}
            isSelectionMode={isSelectionMode}
            selectedRecordings={selectedRecordings}
            onSelectionChange={handleRecordingSelect}
          />
        </View>
      ),
      initiallyExpanded: true,
      isRecordingSection: true,
    },
    {
      id: 'personal',
      title: '個人資料',
      content: (
        <View style={styles.section}>
          {/* 個人資料設定項目 */}
        </View>
      ),
      initiallyExpanded: false,
    },
    {
      id: 'notifications',
      title: '通知設定',
      content: (
        <View style={styles.section}>
          {/* 通知設定項目 */}
        </View>
      ),
      initiallyExpanded: false,
    },
    {
      id: 'privacy',
      title: '隱私設定',
      content: (
        <View style={styles.section}>
          {/* 隱私設定項目 */}
        </View>
      ),
      initiallyExpanded: false,
    },
    {
      id: 'audioSettings',
      title: '錄音設定',
      content: (
        <View style={[styles.section, styles.audioSettingsSection]}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>音質設定</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={audioSettings.quality}
                style={styles.picker}
                dropdownIconColor={theme.colors.text.primary}
                mode="dropdown"
                onValueChange={(value: AudioSettings['quality']) => {
                  const newSettings = { ...audioSettings, quality: value };
                  handleSettingsChange(newSettings);
                }}
              >
                <Picker.Item 
                  label="低品質 (32kbps)" 
                  value="low"
                  color={theme.colors.text.primary}
                  style={{ fontSize: 14 }}
                />
                <Picker.Item 
                  label="中品質 (64kbps)" 
                  value="medium"
                  color={theme.colors.text.primary}
                  style={{ fontSize: 14 }}
                />
                <Picker.Item 
                  label="高品質 (128kbps)" 
                  value="high"
                  color={theme.colors.text.primary}
                  style={{ fontSize: 14 }}
                />
              </Picker>
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>取樣率</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={audioSettings.sampleRate}
                style={styles.picker}
                dropdownIconColor={theme.colors.text.primary}
                mode="dropdown"
                onValueChange={(value: AudioSettings['sampleRate']) => {
                  const newSettings = { ...audioSettings, sampleRate: value };
                  handleSettingsChange(newSettings);
                }}
              >
                <Picker.Item 
                  label="22.05 kHz" 
                  value={22050}
                  color={theme.colors.text.primary}
                />
                <Picker.Item 
                  label="44.1 kHz" 
                  value={44100}
                  color={theme.colors.text.primary}
                />
                <Picker.Item 
                  label="48 kHz" 
                  value={48000}
                  color={theme.colors.text.primary}
                />
              </Picker>
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>聲道設定</Text>
            <View style={styles.switchContainer}>
              <Switch
                value={audioSettings.channels === 2}
                onValueChange={(value: boolean) => {
                  const newSettings: AudioSettings = {
                    ...audioSettings,
                    channels: value ? 2 : 1 as const
                  };
                  handleSettingsChange(newSettings);
                }}
              />
              <Text style={styles.settingDescription}>
                {audioSettings.channels === 1 ? '單聲道' : '立體聲'}
              </Text>
            </View>
          </View>
        </View>
      ),
      initiallyExpanded: false,
    },
  ];

  const renderItem = ({ item }: RenderItemProps) => (
    <ExpandableSection 
      title={item.title}
      initiallyExpanded={item.initiallyExpanded}
      containerStyle={item.isRecordingSection ? styles.recordingsSection : undefined}
      contentStyle={item.isRecordingSection ? styles.recordingsContent : undefined}
      fixedHeight={item.isRecordingSection ? 400 : undefined}
      showExpandButton={true}
    >
      {item.content}
    </ExpandableSection>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList<Section>
        data={sections}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  section: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  recordingsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  recordingsContent: {
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    minHeight: 60,
    gap: theme.spacing.sm,
  },
  settingLabel: {
    flex: 0.35,
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  settingDescription: {
    marginLeft: theme.spacing.sm,
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  pickerContainer: {
    flex: 1,
    maxWidth: 200,
    height: 50,
    justifyContent: 'center',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
    color: theme.colors.text.primary,
    marginLeft: -theme.spacing.sm,
    marginRight: -theme.spacing.sm,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  audioSettingsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
}); 