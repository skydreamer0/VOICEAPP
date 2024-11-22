// CustomerForm.tsx
// 檔案位置：src/components/customer/CustomerForm.tsx
// 該代碼主要功能：提供所有客戶介面-新增客戶彈窗元件

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerService } from '../../services/customerService';
import { theme } from '../../theme';
import { Customer } from '../../types';

interface CustomerFormProps {
  visible: boolean;
  onSubmit: (customerData: Omit<Customer, "id">) => Promise<void>;
  onCancel: () => void;
}

export function CustomerForm({ visible, onSubmit, onCancel }: CustomerFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const nameInputRef = useRef<TextInput>(null);
  const addressInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleGetLocation = async () => {
    try {
      setIsGettingLocation(true);
      const hasPermission = await customerService.requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('錯誤', '無法獲取位置權限');
        return;
      }

      const currentLocation = await customerService.getCurrentLocation();
      setLocation(currentLocation);
      Alert.alert('成功', '已獲取當前位置');
    } catch (error) {
      console.error('獲取位置失敗:', error);
      Alert.alert('錯誤', '無法獲取位置信息');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('錯誤', '請輸入客戶名稱');
      return;
    }
    if (!address.trim()) {
      Alert.alert('錯誤', '請輸入院所');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('錯誤', '請輸入電話');
      return;
    }
    if (!location) {
      Alert.alert('錯誤', '請先獲取位置信息');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
      });
      
      setName('');
      setAddress('');
      setPhone('');
      setLocation(null);
    } catch (error) {
      console.error('提交表單失敗:', error);
      Alert.alert('錯誤', '無法保存客戶資料');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  新增客戶
                </Text>
                <TouchableOpacity 
                  onPress={onCancel}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                contentContainerStyle={styles.formContainer}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                <TouchableWithoutFeedback>
                  <View>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>客戶名稱 *</Text>
                      <TextInput
                        ref={nameInputRef}
                        style={[
                          styles.input,
                          Platform.OS === 'web' && {
                            borderWidth: 0,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.neutral[200],
                          }
                        ]}
                        value={name}
                        onChangeText={setName}
                        placeholder="請輸入客戶名稱"
                        placeholderTextColor={theme.colors.text.disabled}
                        maxLength={50}
                        returnKeyType="next"
                        onSubmitEditing={() => addressInputRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>所屬醫療院所 *</Text>
                      <TextInput
                        ref={addressInputRef}
                        style={[
                          styles.input,
                          styles.multilineInput,
                          Platform.OS === 'web' && {
                            borderWidth: 0,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.neutral[200],
                          }
                        ]}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="請輸入所屬醫療院所"
                        placeholderTextColor={theme.colors.text.disabled}
                        multiline
                        numberOfLines={2}
                        maxLength={200}
                        returnKeyType="next"
                        onSubmitEditing={() => phoneInputRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>電話 *</Text>
                      <TextInput
                        ref={phoneInputRef}
                        style={[
                          styles.input,
                          Platform.OS === 'web' && {
                            borderWidth: 0,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.neutral[200],
                          }
                        ]}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="請輸入電話號碼"
                        placeholderTextColor={theme.colors.text.disabled}
                        keyboardType="phone-pad"
                        maxLength={20}
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                      />
                    </View>

                    <TouchableOpacity 
                      style={[
                        styles.locationButton,
                        location && styles.locationButtonActive,
                        isGettingLocation && styles.locationButtonLoading
                      ]}
                      onPress={handleGetLocation}
                      disabled={isGettingLocation}
                    >
                      <Ionicons 
                        name="location" 
                        size={20} 
                        color={location ? theme.colors.primaryContrast : theme.colors.text.secondary} 
                      />
                      <Text style={[
                        styles.locationButtonText,
                        location && styles.locationButtonTextActive
                      ]}>
                        {isGettingLocation ? '獲取位置中...' : 
                         location ? '已獲取位置' : '獲取當前位置'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.submitButton]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>
                    新增
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600' as const,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  formContainer: {
    padding: theme.spacing.md,
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '400' as const,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    minHeight: 44,
    fontWeight: '400' as const,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[100],
    marginTop: theme.spacing.sm,
  },
  locationButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  locationButtonText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '400' as const,
  },
  locationButtonTextActive: {
    color: theme.colors.primaryContrast,
  },
  locationButtonLoading: {
    opacity: 0.7,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  button: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral[100],
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '400' as const,
  },
  submitButtonText: {
    ...theme.typography.body1,
    color: theme.colors.primaryContrast,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
}); 