
/**
 * Secure storage utility for handling sensitive frontend data
 * Uses various strategies to minimize exposure of secrets
 */

interface SecureStorageConfig {
  encryptionKey?: string;
  useSessionStorage?: boolean;
  tokenLifetime?: number;
}

class SecureStorage {
  private static instance: SecureStorage;
  private config: SecureStorageConfig;
  private memoryCache: Map<string, { value: any; expires?: number }> = new Map();

  private constructor(config: SecureStorageConfig = {}) {
    this.config = {
      useSessionStorage: true,
      tokenLifetime: 60 * 60 * 1000, // 1 hour
      ...config
    };
  }

  public static getInstance(config?: SecureStorageConfig): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage(config);
    }
    return SecureStorage.instance;
  }

  /**
   * Simple XOR encoding for basic obfuscation (not cryptographic security)
   */
  private encode(data: string): string {
    const key = 'ft-transcendence-key';
    let encoded = '';
    for (let i = 0; i < data.length; i++) {
      encoded += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encoded); // Base64 encode
  }

  private decode(encodedData: string): string {
    try {
      const data = atob(encodedData); // Base64 decode
      const key = 'ft-transcendence-key';
      let decoded = '';
      for (let i = 0; i < data.length; i++) {
        decoded += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return decoded;
    } catch {
      return '';
    }
  }

  /**
   * Store sensitive data with encoding and expiration
   */
  public setSecret(key: string, value: any, options?: { expires?: number; memoryOnly?: boolean }): void {
    const expires = options?.expires || (Date.now() + this.config.tokenLifetime!);
    const data = {
      value: JSON.stringify(value),
      expires,
      timestamp: Date.now()
    };

    if (options?.memoryOnly) {
      // Store only in memory - cleared on page refresh
      this.memoryCache.set(key, { value, expires });
      return;
    }

    // Encode the data before storage
    const encodedData = this.encode(JSON.stringify(data));
    
    try {
      if (this.config.useSessionStorage) {
        sessionStorage.setItem(`__sec_${key}`, encodedData);
      } else {
        localStorage.setItem(`__sec_${key}`, encodedData);
      }
    } catch (error) {
      console.warn('SecureStorage: Failed to store data, using memory fallback');
      this.memoryCache.set(key, { value, expires });
    }
  }

  /**
   * Retrieve and decode sensitive data
   */
  public getSecret(key: string): any | null {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem) {
      if (memoryItem.expires && Date.now() > memoryItem.expires) {
        this.memoryCache.delete(key);
        return null;
      }
      return memoryItem.value;
    }

    // Check storage
    try {
      const storage = this.config.useSessionStorage ? sessionStorage : localStorage;
      const encodedData = storage.getItem(`__sec_${key}`);
      
      if (!encodedData) return null;

      const decodedData = this.decode(encodedData);
      if (!decodedData) return null;

      const data = JSON.parse(decodedData);
      
      // Check expiration
      if (data.expires && Date.now() > data.expires) {
        this.removeSecret(key);
        return null;
      }

      return JSON.parse(data.value);
    } catch (error) {
      console.warn('SecureStorage: Failed to retrieve data');
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  public removeSecret(key: string): void {
    this.memoryCache.delete(key);
    
    try {
      if (this.config.useSessionStorage) {
        sessionStorage.removeItem(`__sec_${key}`);
      } else {
        localStorage.removeItem(`__sec_${key}`);
      }
    } catch (error) {
      console.warn('SecureStorage: Failed to remove data');
    }
  }

  /**
   * Clear all secure data
   */
  public clearAll(): void {
    this.memoryCache.clear();
    
    try {
      const storage = this.config.useSessionStorage ? sessionStorage : localStorage;
      const keys = Object.keys(storage);
      
      keys.forEach(key => {
        if (key.startsWith('__sec_')) {
          storage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('SecureStorage: Failed to clear all data');
    }
  }

  /**
   * Check if a secret exists and is valid
   */
  public hasValidSecret(key: string): boolean {
    return this.getSecret(key) !== null;
  }
}

export default SecureStorage;
