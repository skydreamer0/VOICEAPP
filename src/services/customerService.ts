// 檔案：customerService.ts
// 位置：src/services/customerService.ts
// 功能：客戶相關定位服務
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationCoords } from '../types';

interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface CustomerCreateInput {
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
}

let mockCustomers: Customer[] = [];

export const customerService = {
  // 請求位置權限
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('請求位置權限失敗:', error);
      return false;
    }
  },

  // 獲取當前位置
  async getCurrentLocation(): Promise<LocationCoords> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (error) {
      console.error('獲取位置失敗:', error);
      throw new Error('無法獲取當前位置');
    }
  },

  // 計算兩點之間的距離（公里）
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 地球半徑（公里）
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  },

  deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  },

  // 獲取附近的客戶
  async getNearbyCustomers(currentLocation: LocationCoords, radiusKm: number = 5): Promise<Customer[]> {
    try {
      const storedCustomers = await AsyncStorage.getItem('customers');
      if (!storedCustomers) return [];
      
      const customers: Customer[] = JSON.parse(storedCustomers);
      
      return customers
        .map(customer => ({
          ...customer,
          distance: this.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            customer.latitude,
            customer.longitude
          )
        }))
        .filter(customer => customer.distance <= radiusKm)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .map(customer => ({
          ...customer,
          distance: customer.distance
        }));
    } catch (error) {
      console.error('獲取附近客戶失敗:', error);
      throw new Error('無法獲取附近客戶');
    }
  },

  // 自動更新客戶距離
  async updateCustomerDistances(currentLocation: LocationCoords): Promise<void> {
    try {
      const storedCustomers = await AsyncStorage.getItem('customers');
      if (!storedCustomers) return;

      const customers: Customer[] = JSON.parse(storedCustomers);
      const updatedCustomers = customers.map(customer => ({
        ...customer,
        distance: this.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          customer.latitude,
          customer.longitude
        )
      }));

      await AsyncStorage.setItem('customers', JSON.stringify(updatedCustomers));
    } catch (error) {
      console.error('更新客戶距離失敗:', error);
    }
  },

  // 定期更新位置和距離
  startLocationUpdates(callback: (location: LocationCoords) => void) {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,    // 每 5 秒更新一次
        distanceInterval: 10,  // 或移動 10 米更新一次
      },
      (location) => {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        callback(coords);
      }
    );
  },

  async createCustomer(input: CustomerCreateInput): Promise<Customer> {
    const newCustomer = {
      id: Date.now().toString(),
      ...input,
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
  },
}; 