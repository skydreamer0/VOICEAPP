// CustomerSelectModal.tsx
// 檔案位置：src/components/customer/CustomerSelectModal.tsx
// 該代碼主要功能：提供客戶選擇模態框
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Button } from '../ui/Button';
import { Customer, LocationCoords } from '../../types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../../types';
import * as Location from 'expo-location';
import { customerService } from '../../services/customerService';
import type { HomeScreenNavigationProp } from '../../types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import * as Haptics from 'expo-haptics';

interface CustomerSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList>,
    StackNavigationProp<RootStackParamList>
  >;
}

export function CustomerSelectModal({
  visible,
  onClose,
  onSelectCustomer,
  navigation
}: CustomerSelectModalProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [nearbyCustomers, setNearbyCustomers] = useState<Customer[]>([]);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let locationSubscription: { remove: () => void } | null = null;

    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('位置權限被拒絕');
          return;
        }

        // 使用 watchPositionAsync 替代 getCurrentPositionAsync
        if (Platform.OS === 'web') {
          // Web 平台使用單次獲取
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        } else {
          // Native 平台使用位置監聽
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 10
            },
            (location) => {
              setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              });
            }
          );
        }
      } catch (error) {
        console.error('獲取位置時發生錯誤:', error);
      }
    };

    if (visible) {
      getLocation();
    }

    // 清理函數
    return () => {
      if (locationSubscription?.remove) {
        locationSubscription.remove();
      }
    };
  }, [visible]);

  const fetchNearbyCustomers = async () => {
    if (!currentLocation) {
      Alert.alert('提示', '正在獲取位置信息...');
      return;
    }

    try {
      setIsLoadingCustomers(true);
      const nearby = await customerService.getNearbyCustomers(currentLocation);
      setNearbyCustomers(nearby);
    } catch (error) {
      console.error('獲取附近客戶失敗:', error);
      Alert.alert('錯誤', '無法獲取附近客戶');
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (visible && currentLocation) {
      fetchNearbyCustomers();
    }
  }, [visible, currentLocation]);

  const handleCustomerSelect = async (customer: Customer) => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectCustomer(customer);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {currentLocation ? '附近的客戶' : '正在獲取位置...'}
            </Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons 
                name="close" 
                size={24} 
                color={theme.colors.text.secondary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.addCustomerButton}
            onPress={() => {
              onClose();
              navigation.getParent<StackNavigationProp<RootStackParamList>>()?.navigate('CustomerCreate');
            }}
          >
            <Ionicons name="add" size={24} color={theme.colors.primaryContrast} />
            <Text style={styles.addCustomerButtonText}>新增客戶</Text>
          </TouchableOpacity>

          {isLoadingCustomers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <>
              {nearbyCustomers.length > 0 ? (
                <ScrollView style={styles.customerList}>
                  {nearbyCustomers.map((customer) => (
                    <TouchableOpacity
                      key={customer.id}
                      style={styles.modalCustomerItem}
                      onPress={() => handleCustomerSelect(customer)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <View style={styles.customerAvatarContainer}>
                        <View style={styles.customerAvatar}>
                          <Text style={styles.avatarText}>
                            {customer.name.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.customerItemInfo}>
                          <Text style={styles.customerItemName}>{customer.name}</Text>
                          <Text style={styles.customerItemAddress}>{customer.address}</Text>
                        </View>
                      </View>
                      <View style={styles.distanceBadge}>
                        <Ionicons 
                          name="location" 
                          size={12} 
                          color={theme.colors.primary} 
                        />
                        <Text style={styles.distanceBadgeText}>
                          {customer.distance?.toFixed(1)}km
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons 
                    name="location-outline" 
                    size={48} 
                    color={theme.colors.text.disabled} 
                  />
                  <Text style={styles.emptyStateTitle}>
                    附近暫無客戶
                  </Text>
                  <Text style={styles.emptyStateText}>
                    近 5 公里內沒有找到客戶
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.modalFooter}>
            <View style={styles.footerButton}>
              <Button
                title="更新附近客戶"
                onPress={fetchNearbyCustomers}
                disabled={isLoadingCustomers || !currentLocation}
                icon={<Ionicons name="refresh" size={20} color="#FFF" />}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? {
      paddingTop: 20,
      paddingBottom: 34,
    } : {}),
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  customerList: {
    marginVertical: theme.spacing.md,
  },
  modalCustomerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    ...(Platform.OS === 'ios' ? {
      zIndex: 1,
    } : {}),
  },
  customerAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerItemInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  customerItemName: {
    ...theme.typography.body1,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  customerItemAddress: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    fontWeight: '400' as const,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginLeft: theme.spacing.sm,
  },
  distanceBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  footerButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.disabled,
    marginTop: theme.spacing.md,
    fontWeight: '600' as const,
  },
  emptyStateText: {
    ...theme.typography.body2,
    color: theme.colors.text.disabled,
    marginTop: theme.spacing.sm,
    fontWeight: '400' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...theme.typography.h3,
    color: theme.colors.primaryContrast,
    fontWeight: '600' as const,
  },
  addCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    justifyContent: 'center',
  },
  addCustomerButtonText: {
    ...theme.typography.body1,
    color: theme.colors.primaryContrast,
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
}); 