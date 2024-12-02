// SettingsScreen.tsx
//檔案位置：src/screens/SettingsScreen.tsx
// 功能：顯示設定選單
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsMenuItem } from '../components/settings/SettingsMenuItem';
import { theme } from '../theme';
import { ExpandableSection } from '../components/common/ExpandableSection';
import { useState, useEffect } from 'react';
import { googleDriveService } from '../services/googleDriveService';
import { settingsService } from '../services/settingsService';
import { Modal, Portal, TextInput, Button } from 'react-native-paper';

export function SettingsScreen() {
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [settings, setSettings] = useState({
    defaultClinicName: '',
    defaultPhoneNumber: '',
  });

  // 檢查 Google 登入狀態
  useEffect(() => {
    checkGoogleSignIn();
  }, []);

  // 載入設定
  useEffect(() => {
    loadSettings();
  }, []);

  const checkGoogleSignIn = async () => {
    const signedIn = await googleDriveService.isSignedIn();
    setIsGoogleSignedIn(signedIn);
  };

  const loadSettings = async () => {
    const appSettings = await settingsService.loadSettings();
    setSettings({
      defaultClinicName: appSettings.defaultClinicName || '',
      defaultPhoneNumber: appSettings.defaultPhoneNumber || '',
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      await googleDriveService.signIn();
      setIsGoogleSignedIn(true);
      Alert.alert('成功', '已成功登入 Google 帳號');
    } catch (error) {
      Alert.alert('錯誤', '登入失敗，請稍後再試');
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await googleDriveService.signOut();
      setIsGoogleSignedIn(false);
      Alert.alert('成功', '已登出 Google 帳號');
    } catch (error) {
      Alert.alert('錯誤', '登出失敗，請稍後再試');
    }
  };

  const saveSettings = async () => {
    try {
      await settingsService.saveSettings({
        defaultClinicName: settings.defaultClinicName,
        defaultPhoneNumber: settings.defaultPhoneNumber,
      });
      setIsSettingsModalVisible(false);
      Alert.alert('成功', '設定已保存');
    } catch (error) {
      Alert.alert('錯誤', '無法保存設定');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>設定</Text>
        </View>

        <ExpandableSection title="雲端同步設定">
          <View style={styles.section}>
            <SettingsMenuItem 
              icon={isGoogleSignedIn ? "cloud-done-outline" : "cloud-outline"}
              title="Google Drive 同步"
              description={isGoogleSignedIn ? "已連接" : "未連接"}
              onPress={isGoogleSignedIn ? handleGoogleSignOut : handleGoogleSignIn}
            />
          </View>
        </ExpandableSection>

        <ExpandableSection title="預設資料設定">
          <View style={styles.section}>
            <SettingsMenuItem 
              icon="business-outline"
              title="預設診所資訊"
              description="設定預設的診所名稱和電話"
              onPress={() => setIsSettingsModalVisible(true)}
            />
          </View>
        </ExpandableSection>

        <ExpandableSection title="其他設定">
          <View style={styles.section}>
            <SettingsMenuItem 
              icon="notifications-outline"
              title="通知設定"
              onPress={() => {}}
            />
          </View>
        </ExpandableSection>
      </ScrollView>

      <Portal>
        <Modal
          visible={isSettingsModalVisible}
          onDismiss={() => setIsSettingsModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>預設診所資訊</Text>
          <TextInput
            label="診所名稱"
            value={settings.defaultClinicName}
            onChangeText={(text) => setSettings(prev => ({ ...prev, defaultClinicName: text }))}
            style={styles.input}
          />
          <TextInput
            label="診所電話"
            value={settings.defaultPhoneNumber}
            onChangeText={(text) => setSettings(prev => ({ ...prev, defaultPhoneNumber: text }))}
            style={styles.input}
            keyboardType="phone-pad"
          />
          <View style={styles.modalActions}>
            <Button onPress={() => setIsSettingsModalVisible(false)}>取消</Button>
            <Button mode="contained" onPress={saveSettings}>保存</Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  section: {
    gap: theme.spacing.sm,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  modalTitle: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
});