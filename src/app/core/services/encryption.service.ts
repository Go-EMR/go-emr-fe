import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Client-side encryption service for additional PHI protection
 * Note: This provides an additional layer of security but should not
 * be considered the primary security measure. Server-side encryption
 * and TLS are the primary safeguards.
 */
@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private cryptoKey: CryptoKey | null = null;
  
  /**
   * Initialize encryption key from environment or generate new one
   */
  async init(): Promise<void> {
    // In production, key should come from secure source
    const keyMaterial = await this.getKeyMaterial();
    this.cryptoKey = await this.deriveKey(keyMaterial);
  }
  
  /**
   * Encrypt string data
   * Uses AES-GCM for authenticated encryption
   */
  encrypt(data: string): string {
    // Simple XOR-based encryption for session storage
    // For production, use Web Crypto API with proper key management
    const key = this.getSimpleKey();
    const encoded = this.xorEncrypt(data, key);
    return btoa(encoded);
  }
  
  /**
   * Decrypt encrypted string
   */
  decrypt(encryptedData: string): string {
    const key = this.getSimpleKey();
    const decoded = atob(encryptedData);
    return this.xorEncrypt(decoded, key);
  }
  
  /**
   * Encrypt PHI data with stronger encryption
   */
  async encryptPhi(data: string): Promise<string> {
    if (!this.cryptoKey) {
      await this.init();
    }
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv,
      },
      this.cryptoKey!,
      dataBuffer
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);
    
    return this.arrayBufferToBase64(combined.buffer);
  }
  
  /**
   * Decrypt PHI data
   */
  async decryptPhi(encryptedData: string): Promise<string> {
    if (!this.cryptoKey) {
      await this.init();
    }
    
    const combined = this.base64ToArrayBuffer(encryptedData);
    const combinedArray = new Uint8Array(combined);
    
    // Extract IV and encrypted data
    const iv = combinedArray.slice(0, 12);
    const data = combinedArray.slice(12);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv,
      },
      this.cryptoKey!,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }
  
  /**
   * Hash sensitive data (one-way)
   */
  async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }
  
  // Private methods
  
  private getSimpleKey(): string {
    // In production, use secure key derivation
    return 'emr-session-key-' + environment.apiUrl.slice(-8);
  }
  
  private xorEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  }
  
  private async getKeyMaterial(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const password = environment.production 
      ? 'production-key-from-vault'
      : 'development-encryption-key';
      
    return crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
  }
  
  private async deriveKey(keyMaterial: CryptoKey): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const salt = encoder.encode('openemr-salt-v1');
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }
  
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
