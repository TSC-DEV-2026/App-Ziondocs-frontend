import AsyncStorage from "@react-native-async-storage/async-storage";

export const StorageKeys = {
  accessToken: "auth:access_token",
  refreshToken: "auth:refresh_token",
  authChanged: "auth:changed",
  internalTokenValidated: "auth:internal_token_validated",
  internalTokenBlocked: "auth:internal_token_blocked",
  internalTokenPrompted: "auth:internal_token_prompted",
  postPasswordChange: "auth:post_password_change"
} as const;

export async function getItem(key: string) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export async function removeItem(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function clearAuthLocalState() {
  await Promise.all([
    removeItem(StorageKeys.accessToken),
    removeItem(StorageKeys.refreshToken),
    removeItem(StorageKeys.internalTokenValidated),
    removeItem(StorageKeys.internalTokenBlocked),
    removeItem(StorageKeys.internalTokenPrompted)
  ]);
}
