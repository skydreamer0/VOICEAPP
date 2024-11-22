// TabNavigator.tsx
// 檔案位置：src/navigation/TabNavigator.tsx
// 該代碼主要功能：提供應用程式的所有導航功能，包含底部標籤和模態頁面

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CustomerScreen } from '../screens/CustomerScreen';
import { RecordingsScreen } from '../screens/RecordingsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CustomerCreateScreen } from '../components/customer/CustomerCreateScreen';
import { Ionicons } from '@expo/vector-icons';
import type { RootTabParamList, RootStackParamList } from '../types';
import { Platform, ViewStyle, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function TabScreens() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 64 + insets.top : 72,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.neutral[200],
        },
        headerTitleStyle: Platform.select({
          ios: {
            ...theme.typography.h3,
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.xs,
          },
          android: {
            ...theme.typography.h3,
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginTop: theme.spacing.md,
            marginBottom: theme.spacing.md,
            height: 28,
            textAlignVertical: 'center',
          },
        }),
        headerTitleContainerStyle: Platform.select({
          ios: {
            paddingTop: insets.top + theme.spacing.md,
            paddingBottom: theme.spacing.sm,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          },
          android: {
            paddingTop: theme.spacing.xl,
            paddingBottom: theme.spacing.md,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          },
        }),
        headerStatusBarHeight: Platform.OS === 'ios' ? insets.top : 0,
        headerTitleAlign: 'center',
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.neutral[400],
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.neutral[200],
          height: Platform.OS === 'ios' ? 49 + insets.bottom : 56,
          paddingVertical: 0,
          ...theme.shadows.sm,
        },
        tabBarItemStyle: {
          height: Platform.OS === 'ios' ? 49 : 56,
          paddingTop: theme.spacing.xs,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : theme.spacing.xs,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
      screenListeners={{
        tabPress: (e) => {
          console.log('Tab pressed:', e.target);
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: '語音備忘錄',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons 
                name="mic" 
                size={24} 
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          title: '歷史記錄',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons 
                name="time" 
                size={24} 
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Customers" 
        component={CustomerScreen}
        options={{
          title: '客戶管理',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: '個人設定',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabIcon: {
    // 移除之前的 marginBottom
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
});

export function TabNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={TabScreens}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="Recordings" 
        component={RecordingsScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="CustomerCreate" 
        component={CustomerCreateScreen}
        options={{ 
          title: '新增客戶',
          presentation: 'modal'
        }}
      />
    </Stack.Navigator>
  );
} 