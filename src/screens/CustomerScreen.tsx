import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecordingData } from '../types';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/index';
import { recordingService } from '../services/recordingService';
import { Audio } from 'expo-av';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { useRecordings } from '../hooks/useRecordings';
import { Button as PaperButton } from 'react-native-paper';
import { RecordingPlayer } from '../components/customer/RecordingPlayer';
import { Portal, Modal } from 'react-native-paper';
import { CustomerForm } from '../components/customer/CustomerForm';
import type { Customer, CreateCustomerData } from '../types';
import { CustomerCreateModal } from '../components/customer/CustomerCreateScreen';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 定義導航類型
type CustomerScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Customers'>;

export function CustomerScreen() {
  const navigation = useNavigation<CustomerScreenNavigationProp>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const { recordings, refreshRecordings } = useRecordings();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const insets = useSafeAreaInsets();

  // 加載客戶數據
  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const storedCustomers = await AsyncStorage.getItem('customers');
      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      }
    } catch (error) {
      console.error('加載客戶數據失敗:', error);
      Alert.alert('錯誤', '無法加載客戶數據');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存客戶數據
  const saveCustomers = async (newCustomers: Customer[]) => {
    try {
      await AsyncStorage.setItem('customers', JSON.stringify(newCustomers));
    } catch (error) {
      console.error('保存客戶數據失敗:', error);
      Alert.alert('錯誤', '無法保存客戶數據');
    }
  };

  // 當頁面獲得焦點時重新加載數據
  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [])
  );

  // 搜尋邏輯
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchText.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.address.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchText)
    );
  });

  // 刪除客戶
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const updatedCustomers = customers.filter(c => c.id !== customerId);
      setCustomers(updatedCustomers);
      await saveCustomers(updatedCustomers);
      Alert.alert('成功', '客戶已刪除');
    } catch (error) {
      console.error('刪除客戶失敗:', error);
      Alert.alert('錯誤', '無法除客戶');
    }
  };

  // 添加觸感反饋函數
  const triggerHaptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // 修改 handleDeletePress
  const handleDeletePress = (customer: Customer) => {
    triggerHaptic();
    setCustomerToDelete(customer);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (customerToDelete) {
      await handleDeleteCustomer(customerToDelete.id);
      setIsDeleteModalVisible(false);
      setCustomerToDelete(null);
      setSelectedCustomer(null);
    } else if (selectedRecordingId) {
      try {
        await recordingService.deleteRecording(selectedRecordingId);
        await refreshRecordings();
        setIsDeleteModalVisible(false);
        setSelectedRecordingId(null);
      } catch (error) {
        Alert.alert('錯誤', '無法刪除錄音');
      }
    }
  };

  // 修改客戶列表項的渲染
  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.customerCard}
      onPress={() => setSelectedCustomer(item)}
      activeOpacity={0.7}
    >
      <View style={styles.customerAvatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0)}
        </Text>
      </View>
      
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        <View style={styles.customerMeta}>
          <View style={styles.metaItem}>
            <Ionicons 
              name="business-outline" 
              size={14} 
              color={theme.colors.text.secondary} 
            />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons 
              name="call-outline" 
              size={14} 
              color={theme.colors.text.secondary} 
            />
            <Text style={styles.metaText}>
              {item.phone}
            </Text>
          </View>
        </View>
      </View>
      
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={theme.colors.text.secondary}
        style={styles.chevronIcon}
      />
    </TouchableOpacity>
  );

  // 客戶詳情模態框組件
  const CustomerDetailModal = ({ customer, visible, onClose }: {
    customer: Customer;
    visible: boolean;
    onClose: () => void;
  }) => {
    const [customerRecordings, setCustomerRecordings] = useState<RecordingData[]>([]);
    const { recordings, refreshRecordings } = useRecordings();

    // 加載客戶錄音記錄的邏輯
    const loadCustomerRecordings = useCallback(() => {
      console.log('=== 開始加載客戶錄音記錄 ===');
      console.log('客戶 ID:', customer.id);
      
      try {
        const filteredRecordings = recordings.filter(
          rec => rec.customerId === customer.id
        );
        console.log('該客戶的錄音記錄數量:', filteredRecordings.length);
        console.log('該客戶的錄音記錄:', filteredRecordings);
        
        setCustomerRecordings(filteredRecordings);
      } catch (error) {
        console.error('加載錄音記錄時發生錯誤:', error);
        Alert.alert('錯誤', '無法加載音錄');
      }
    }, [customer.id, recordings]);

    useEffect(() => {
      loadCustomerRecordings();
    }, [loadCustomerRecordings]);

    // 簡化處理刪除錄音的函數
    const handleDeleteRecording = (recordingId: string) => {
      setSelectedRecordingId(recordingId);
      setIsDeleteModalVisible(true);
    };

    // 播放錄音
    const playRecording = async (recording: RecordingData) => {
      try {
        if (sound) {
          await sound.unloadAsync();
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recording.audioUri },
          { shouldPlay: true }
        );

        setSound(newSound);
        setPlayingId(recording.id);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if ('isLoaded' in status && !status.isLoaded) return;
          if ('didJustFinish' in status && status.didJustFinish) {
            setPlayingId(null);
            newSound.unloadAsync();
          }
        });
      } catch (error) {
        console.error('播放錄音失敗:', error);
        Alert.alert('錯誤', '無法播放錄音');
      }
    };

    // 停止播放
    const stopPlaying = async () => {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingId(null);
      }
    };

    return (
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modalContainer,
          Platform.OS === 'android' && styles.modalContainerAndroid
        ]}
      >
        <SafeAreaView style={[
          styles.modalContent,
          Platform.OS === 'android' && styles.modalContentAndroid
        ]}>
          {/* 頂部導航欄 */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.backButton}
              >
                <Ionicons 
                  name="arrow-back" 
                  size={24} 
                  color={theme.colors.text.primary} 
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{customer.name}</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  setEditingCustomer(customer);
                  setIsEditing(true);
                  onClose();
                }}
              >
                <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeletePress(customer)}
              >
                <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 客戶資訊卡片 */}
          <View style={styles.customerDetailCard}>
            <View style={styles.customerAvatarLarge}>
              <Text style={styles.avatarTextLarge}>
                {customer.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.customerInfoList}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color={theme.colors.primary} />
                <Text style={styles.infoText}>{customer.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color={theme.colors.primary} />
                <Text style={styles.infoText}>{customer.phone}</Text>
              </View>
              {customer.distance !== undefined && (
                <View style={styles.infoRow}>
                  <Ionicons name="navigate" size={20} color={theme.colors.primary} />
                  <Text style={styles.infoText}>
                    {customer.distance < 0.1 ? '非常近' : `${customer.distance.toFixed(1)}km`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 錄音記錄區域 */}
          <View style={styles.recordingsSection}>
            <Text style={styles.sectionTitle}>錄音記錄</Text>
            <View style={styles.recordingsContainer}>
              {customerRecordings.length > 0 ? (
                <FlatList
                  data={customerRecordings}
                  renderItem={({ item }) => (
                    <View style={styles.recordingItem}>
                      <View style={styles.recordingInfo}>
                        <Text style={styles.recordingDate}>
                          {new Date(item.createdAt).toLocaleString()}
                        </Text>
                        {item.transcription ? (
                          <Text style={styles.transcriptionText} numberOfLines={2}>
                            {item.transcription}
                          </Text>
                        ) : (
                          <Text style={styles.pendingText}>尚未轉錄</Text>
                        )}
                        {item.duration > 0 && (
                          <Text style={styles.durationText}>
                            時長: {Math.floor(item.duration / 1000)}秒
                          </Text>
                        )}
                      </View>
                      <View style={styles.recordingActions}>
                        <TouchableOpacity 
                          style={[styles.recordingItemAction, styles.recordingItemPlayBtn]}
                          onPress={() => playingId === item.id ? stopPlaying() : playRecording(item)}
                        >
                          <Ionicons 
                            name={playingId === item.id ? "stop" : "play"} 
                            size={22} 
                            color={theme.colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.recordingItemAction, styles.recordingItemDeleteBtn]}
                          onPress={() => handleDeleteRecording(item.id)}
                        >
                          <Ionicons 
                            name="trash-outline" 
                            size={20} 
                            color={theme.colors.error} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  keyExtractor={item => item.id}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>暫無錄音記錄</Text>
                </View>
              )}
            </View>
          </View>

          {/* 底部按鈕 */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.newRecordingButton}
              onPress={() => {
                onClose();
                navigation.navigate('Home', { selectedCustomer: customer });
              }}
            >
              <Ionicons name="mic" size={20} color={theme.colors.primaryContrast} />
              <Text style={styles.newRecordingButtonText}>新增錄音</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // 在 CustomerDetailModal 組件之後添加 EditCustomerModal 組件
  const EditCustomerModal = ({ customer, visible, onClose }: {
    customer: Customer;
    visible: boolean;
    onClose: () => void;
  }) => {
    const [name, setName] = useState(customer.name);
    const [address, setAddress] = useState(customer.address);
    const [phone, setPhone] = useState(customer.phone);

    const handleSubmit = async () => {
      try {
        if (!name.trim() || !address.trim() || !phone.trim()) {
          Alert.alert('錯誤', '請填寫所有必填欄位');
          return;
        }

        const updatedCustomer = {
          ...customer,
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
        };

        const updatedCustomers = customers.map(c => 
          c.id === customer.id ? updatedCustomer : c
        );

        await saveCustomers(updatedCustomers);
        setCustomers(updatedCustomers);
        
        if (Platform.OS === 'ios') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        Alert.alert('成功', '客戶資料已更新', [
          {
            text: '確定',
            onPress: () => {
              onClose();
              setSelectedCustomer(updatedCustomer);
            }
          }
        ]);
      } catch (error) {
        console.error('更新客戶失敗:', error);
        Alert.alert('錯誤', '無法更新客戶資料');
      }
    };

    return (
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.editModalContainer}
      >
        <View style={styles.editModalContent}>
          <View style={styles.modalHeaderEdit}>
            <View style={styles.editModalHeaderLeft}>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.backButton}
              >
                <Ionicons 
                  name="arrow-back" 
                  size={24} 
                  color={theme.colors.text.primary} 
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>編輯客戶資料</Text>
            </View>
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.editFormContainer}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.editLabel}>客戶名稱 *</Text>
                <TextInput
                  style={styles.editInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="請輸入客戶名稱"
                  placeholderTextColor={theme.colors.text.hint}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.editLabel}>所屬醫療院所 *</Text>
                <TextInput
                  style={[styles.editInput, { height: 80, textAlignVertical: 'top' }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="請輸入所屬醫療院所"
                  placeholderTextColor={theme.colors.text.hint}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.editLabel}>電話 *</Text>
                <TextInput
                  style={styles.editInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="請輸入電話號碼"
                  placeholderTextColor={theme.colors.text.hint}
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={styles.editModalFooter}>
            <TouchableOpacity
              style={[styles.editModalButton, styles.editCancelButton]}
              onPress={onClose}
            >
              <Text style={styles.editButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editModalButton, styles.editSubmitButton]}
              onPress={handleSubmit}
            >
              <Text style={[styles.editButtonText, styles.editSubmitButtonText]}>
                保存
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // 更新編輯模態框相關樣式
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    innerContainer: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral[200],
      ...theme.shadows.sm,
    },
    searchSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.neutral[50],
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      height: 44,
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
    },
    searchInput: {
      flex: 1,
      ...theme.typography.body1,
      color: theme.colors.text.primary,
      marginLeft: theme.spacing.sm,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    customerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    customerAvatar: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    avatarText: {
      ...theme.typography.h3,
      color: theme.colors.primary,
    },
    customerInfo: {
      flex: 1,
    },
    customerName: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    customerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.neutral[50],
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
    },
    metaText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginLeft: theme.spacing.xs,
    },
    chevronIcon: {
      marginLeft: 'auto',
      padding: theme.spacing.xs,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyStateIcon: {
      marginBottom: theme.spacing.lg,
      opacity: 0.5,
    },
    emptyStateTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptyStateText: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    listContent: {
      paddingVertical: theme.spacing.md,
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      margin: 0,
      flex: 1,
    },
    modalContainerAndroid: {
      margin: 0,
      maxHeight: '100%',
      width: '100%',
    },
    modalContent: {
      flex: 1,
    },
    modalContentAndroid: {
      padding: 0,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral[200],
      ...theme.shadows.sm,
    },
    modalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.sm,
    },
    modalTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
    },
    modalActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    editButton: {
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primaryLight,
    },
    deleteButton: {
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: `${theme.colors.error}15`,
    },
    customerDetailCard: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.sm,
    },
    customerAvatarLarge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    avatarTextLarge: {
      ...theme.typography.h2,
      color: theme.colors.primary,
    },
    customerInfoList: {
      gap: theme.spacing.sm,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.neutral[50],
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.xs,
    },
    infoIcon: {
      marginRight: theme.spacing.sm,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoText: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
      flex: 1,
    },
    recordingsSection: {
      flex: 1,
      marginTop: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    recordingsContainer: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    recordingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    recordingInfo: {
      flex: 1,
    },
    recordingDate: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    transcriptionText: {
      ...theme.typography.body2,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.xs,
    },
    pendingText: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
    },
    durationText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    recordingActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    recordingItemAction: {
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
    },
    recordingItemPlayBtn: {
      backgroundColor: theme.colors.primaryLight,
    },
    recordingItemDeleteBtn: {
      backgroundColor: `${theme.colors.error}10`,
    },
    modalFooter: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.neutral[200],
    },
    newRecordingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.sm,
    },
    newRecordingButtonText: {
      ...theme.typography.button,
      color: theme.colors.primaryContrast,
      marginLeft: theme.spacing.sm,
    },
    editModalContainer: {
      backgroundColor: theme.colors.background,
      margin: 0,  // 改為全屏顯示
      flex: 1,
    },
    editModalContainerAndroid: {
      // Android 特定樣式已包含在上面
    },
    editModalContent: {
      flex: 1,
    },
    editModalContentAndroid: {
      padding: 0,
    },
    modalHeaderEdit: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral[200],
      ...theme.shadows.sm,
    },
    editModalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editFormContainer: {
      flex: 1,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    formGroup: {
      marginBottom: theme.spacing.lg,
    },
    editLabel: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    editInput: {
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      ...theme.typography.body1,
      color: theme.colors.text.primary,
      minHeight: 44,  // 確保輸入框高度一致
    },
    editModalFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.neutral[200],
      ...theme.shadows.sm,
    },
    editModalButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.md,
      minWidth: 100,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.sm,
    },
    editCancelButton: {
      backgroundColor: theme.colors.neutral[100],
    },
    editSubmitButton: {
      backgroundColor: theme.colors.primary,
    },
    editButtonText: {
      ...theme.typography.button,
      color: theme.colors.text.primary,
    },
    editSubmitButtonText: {
      color: theme.colors.primaryContrast,
    },
    searchIcon: {
      marginRight: theme.spacing.sm,
    },
    clearButton: {
      padding: theme.spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    separator: {
      height: theme.spacing.sm,
    },
  });

  // 在 useEffect 中監聽 focus 事件
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('CustomerScreen focused - refreshing recordings');
      refreshRecordings();
    });

    return unsubscribe;
  }, [navigation]);

  // 添加 Customer 創建的處理函數
  const handleCreateCustomer = async (customerData: CreateCustomerData) => {
    try {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        ...customerData,
        latitude: 0,
        longitude: 0,
      };

      const updatedCustomers = [...customers, newCustomer];
      await saveCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
      Alert.alert('成功', '客戶已創建');
    } catch (error) {
      console.error('創建客戶失敗:', error);
      Alert.alert('錯誤', '無法創建客戶');
    }
  };

  // 基礎標題樣式
  const headerBase = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.surface,
    ...(Platform.OS === 'android' ? {
      elevation: 2,
      paddingTop: theme.spacing.sm,
    } : {}),
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <View style={[
            styles.header,
            Platform.OS === 'ios' ? {
              paddingTop: insets.top,
              paddingBottom: theme.spacing.md,
            } : null
          ]}>
            <View style={styles.searchSection}>
              <View style={styles.searchInputContainer}>
                <Ionicons 
                  name="search" 
                  size={20} 
                  color={theme.colors.primary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="搜尋客戶名稱、地址或電話..."
                  placeholderTextColor={theme.colors.text.hint}
                  value={searchText}
                  onChangeText={setSearchText}
                />
                {searchText !== '' && (
                  <TouchableOpacity 
                    onPress={() => setSearchText('')}
                    style={styles.clearButton}
                  >
                    <Ionicons 
                      name="close-circle" 
                      size={18} 
                      color={theme.colors.text.secondary} 
                    />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setIsCreateModalVisible(true)}
              >
                <Ionicons 
                  name="add" 
                  size={24} 
                  color={theme.colors.primaryContrast} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 客戶列表 */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContent,
                Platform.OS === 'ios' ? {
                  paddingBottom: insets.bottom + theme.spacing.lg // 為 iOS 底部安全區域添加額外間距
                } : null
              ]}
              renderItem={renderCustomerItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Ionicons 
                    name="people-outline" 
                    size={48} 
                    color={theme.colors.text.disabled} 
                  />
                  <Text style={styles.emptyStateTitle}>暫無客戶</Text>
                  <Text style={styles.emptyStateText}>
                    點擊右上角的加號新增客戶
                  </Text>
                </View>
              )}
            />
          )}

          {selectedCustomer && (
            <CustomerDetailModal
              customer={selectedCustomer}
              visible={!!selectedCustomer}
              onClose={() => setSelectedCustomer(null)}
            />
          )}

          {editingCustomer && (
            <EditCustomerModal
              customer={editingCustomer}
              visible={isEditing}
              onClose={() => {
                setIsEditing(false);
                setEditingCustomer(null);
              }}
            />
          )}

          <CustomerCreateModal
            visible={isCreateModalVisible}
            onClose={() => setIsCreateModalVisible(false)}
            onSubmit={handleCreateCustomer}
          />

          <DeleteConfirmModal
            visible={isDeleteModalVisible}
            onClose={() => {
              setIsDeleteModalVisible(false);
              setCustomerToDelete(null);
              setSelectedRecordingId(null);
            }}
            onConfirm={handleConfirmDelete}
            title={customerToDelete ? "確認刪除客戶" : "確認刪除錄音"}
            message={
              customerToDelete 
                ? "確定要刪除此客戶嗎？此操作將永久刪除該客戶的所有相關資料，且無法復原。"
                : "確定要刪除條錄音嗎？此操作無法復原。"
            }
            confirmText="刪除"
            cancelText="取消"
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.shadows.sm,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  customerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  customerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  chevronIcon: {
    marginLeft: 'auto',
    padding: theme.spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateIcon: {
    marginBottom: theme.spacing.lg,
    opacity: 0.5,
  },
  emptyStateTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    margin: 0,
    flex: 1,
  },
  modalContainerAndroid: {
    margin: 0,
    maxHeight: '100%',
    width: '100%',
  },
  modalContent: {
    flex: 1,
  },
  modalContentAndroid: {
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.shadows.sm,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  editButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryLight,
  },
  deleteButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: `${theme.colors.error}15`,
  },
  customerDetailCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  customerAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarTextLarge: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  customerInfoList: {
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  infoIcon: {
    marginRight: theme.spacing.sm,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  recordingsSection: {
    flex: 1,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  recordingsContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingDate: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  transcriptionText: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  pendingText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  durationText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  recordingItemAction: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  recordingItemPlayBtn: {
    backgroundColor: theme.colors.primaryLight,
  },
  recordingItemDeleteBtn: {
    backgroundColor: `${theme.colors.error}10`,
  },
  modalFooter: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  newRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  newRecordingButtonText: {
    ...theme.typography.button,
    color: theme.colors.primaryContrast,
    marginLeft: theme.spacing.sm,
  },
  editModalContainer: {
    backgroundColor: theme.colors.background,
    margin: 0,  // 改為全屏顯示
    flex: 1,
  },
  editModalContainerAndroid: {
    // Android 特定樣式已包含在上面
  },
  editModalContent: {
    flex: 1,
  },
  editModalContentAndroid: {
    padding: 0,
  },
  modalHeaderEdit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.shadows.sm,
  },
  editModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editFormContainer: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  editLabel: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  editInput: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    minHeight: 44,  // 確保輸入框高度一致
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    ...theme.shadows.sm,
  },
  editModalButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  editCancelButton: {
    backgroundColor: theme.colors.neutral[100],
  },
  editSubmitButton: {
    backgroundColor: theme.colors.primary,
  },
  editButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.primary,
  },
  editSubmitButtonText: {
    color: theme.colors.primaryContrast,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: theme.spacing.sm,
  },
}); 