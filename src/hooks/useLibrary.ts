/**
 * useLibrary Hook - UPGRADED VERSION
 * 
 * Manages the "My Recordings" library using IndexedDB for persistent storage.
 * 
 * UPGRADES:
 * - Enhanced metadata storage (mode, resolution, microphone, PiP position/size)
 * - Better thumbnail generation
 * - Improved error handling
 */

import { useState, useEffect, useCallback } from 'react';
import type { RecordingResult, WebcamPosition, WebcamSize, BitratePreset } from './useRecorder';

export interface LibraryItem {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  date: string;
  mode: string;
  quality: string;
  bitrate: BitratePreset;
  resolution: string;
  thumbnail: string;
  webcamPosition?: WebcamPosition;
  webcamSize?: WebcamSize;
  microphoneId?: string;
}

const DB_NAME = 'WebcamRecorderDB';
const DB_VERSION = 2; // Bumped version for schema upgrade
const STORE_NAME = 'recordings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('mode', 'mode', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function useLibrary() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all items from IndexedDB
  const loadItems = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as LibraryItem[];
        // Recreate blob URLs
        const withUrls = results.map(item => ({
          ...item,
          url: URL.createObjectURL(item.blob),
        }));
        // Sort by date descending
        withUrls.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setItems(withUrls);
        setLoading(false);
      };
      request.onerror = () => {
        console.error('Failed to load library:', request.error);
        setLoading(false);
      };
    } catch (err) {
      console.error('Failed to open database:', err);
      setLoading(false);
    }
  }, []);

  // Add a recording result to the library
  const addToLibrary = useCallback(async (result: RecordingResult): Promise<boolean> => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const item: Omit<LibraryItem, 'url'> = {
        id: result.id,
        blob: result.blob,
        duration: result.duration,
        date: result.date,
        mode: result.mode,
        quality: result.quality,
        bitrate: result.bitrate || 'medium',
        resolution: result.resolution,
        thumbnail: result.thumbnail,
        webcamPosition: result.webcamPosition,
        webcamSize: result.webcamSize,
        microphoneId: result.microphoneId,
      };

      store.put(item);

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      await loadItems();
      return true;
    } catch (err) {
      console.error('Failed to save to library:', err);
      return false;
    }
  }, [loadItems]);

  // Remove a recording from the library
  const removeFromLibrary = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Revoke URL
      const item = items.find(i => i.id === id);
      if (item?.url) {
        URL.revokeObjectURL(item.url);
      }

      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      setItems(prev => prev.filter(i => i.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to remove from library:', err);
      return false;
    }
  }, [items]);

  // Download a recording
  const downloadRecording = useCallback((item: LibraryItem) => {
    const a = document.createElement('a');
    a.href = item.url;
    const dateStr = new Date(item.date).toISOString().slice(0, 19).replace(/[:.]/g, '-');
    a.download = `recording_${dateStr}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // Get storage usage estimate
  const getStorageUsage = useCallback(async (): Promise<{ used: number; available: number } | null> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
      };
    }
    return null;
  }, []);

  // Clear all recordings
  const clearAllRecordings = useCallback(async (): Promise<boolean> => {
    try {
      // Revoke all URLs
      items.forEach(item => {
        if (item.url) URL.revokeObjectURL(item.url);
      });

      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      setItems([]);
      return true;
    } catch (err) {
      console.error('Failed to clear library:', err);
      return false;
    }
  }, [items]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    loading,
    addToLibrary,
    removeFromLibrary,
    downloadRecording,
    refreshLibrary: loadItems,
    getStorageUsage,
    clearAllRecordings,
  };
}
