// SettingsScreen.tsx
//檔案位置：src/screens/SettingsScreen.tsx
// 功能：顯示設定選單
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsMenuItem } from '../components/settings/SettingsMenuItem';
import { theme } from '../theme';
import { ExpandableSection } from '../components/common/ExpandableSection';

export function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>設定</Text>
        </View>

        <ExpandableSection title="應用程式設定">
          <View style={styles.section}>
            <SettingsMenuItem 
              icon="notifications-outline"
              title="通知設定"
              onPress={() => {}}
            />
            {/* 其他設定項目... */}
          </View>
        </ExpandableSection>

        <ExpandableSection title="帳號設定">
          <View style={styles.section}>
            {/* 帳號相關設定項目 */}
          </View>
        </ExpandableSection>

        <ExpandableSection title="其他設定">
          <View style={styles.section}>
            {/* 其他設定項目 */}
          </View>
        </ExpandableSection>
      </ScrollView>
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
}); 