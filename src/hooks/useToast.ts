/**
 * useToast Hook
 * 
 * Simple toast notification system for user feedback.
 */

import { useState, useCallback, useRef } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 4000) => {
    const id = `toast_${++toastIdRef.current}`;
    const toast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
  };
}
