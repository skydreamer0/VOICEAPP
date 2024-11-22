import React from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CustomerForm } from './CustomerForm';
import { Customer, CreateCustomerData } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { Modal, Portal } from 'react-native-paper';

export function CustomerCreateModal({ 
  visible, 
  onClose,
  onSubmit 
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCustomerData) => Promise<void>;
}) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <CustomerForm 
            visible={visible}
            onSubmit={async (data) => {
              await onSubmit(data);
              onClose();
            }}
            onCancel={onClose}
          />
        </View>
      </Modal>
    </Portal>
  );
}

export function CustomerCreateScreen() {
  const navigation = useNavigation();

  const handleFormSubmit = async (customerData: Omit<Customer, 'id'>) => {
    try {
      // 獲取現有客戶列表
      const storedCustomers = await AsyncStorage.getItem('customers');
      const existingCustomers = storedCustomers ? JSON.parse(storedCustomers) : [];

      // 創建新客戶
      const newCustomer: Customer = {
        id: Date.now().toString(),
        ...customerData
      };

      // 更新客戶列表
      const updatedCustomers = [newCustomer, ...existingCustomers];
      await AsyncStorage.setItem('customers', JSON.stringify(updatedCustomers));
      
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert('成功', '客戶資料已新增', [
        {
          text: '確定',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error('添加客戶失敗:', error);
      Alert.alert('錯誤', '無法新增客戶資料');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <CustomerForm
          visible={true}
          onSubmit={handleFormSubmit}
          onCancel={() => navigation.goBack()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    alignSelf: 'center',
  },
  modalContent: {
    padding: theme.spacing.lg,
  },
}); 