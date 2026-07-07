/**
 * useAuth Hook - REAL Google Identity Services Integration
 * 
 * This implements REAL Google Sign-In using Google Identity Services (GIS).
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project
 * 3. Enable Google Identity Services API
 * 4. Create OAuth 2.0 credentials → Web application
 * 5. Add authorized origins (your domain + localhost)
 * 6. Copy Client ID
 * 7. Set VITE_GOOGLE_CLIENT_ID environment variable
 * 
 * The GIS script is loaded dynamically when needed.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          prompt: (callback?: (notification: PromptNotification) => void) => void;
          renderButton: (element: HTMLElement, config: ButtonConfig) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface CredentialResponse {
  credential: string;
  select_by: string;
}

interface PromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
}

interface ButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  type?: 'standard' | 'icon';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  authenticatedAt: string;
  credential?: string;
}

// JWT decode helper (simple base64 decode for JWT payload)
function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Google Client ID - set via environment variable
// @ts-ignore - Vite env variable
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

// For demo mode when no client ID is configured
const DEMO_MODE = !GOOGLE_CLIENT_ID;

type PendingAction = () => void;

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('recorder_user');
    if (saved) {
      try {
        const userData = JSON.parse(saved) as User;
        // Validate session (24 hour expiry)
        const authTime = new Date(userData.authenticatedAt).getTime();
        const now = Date.now();
        const SESSION_DURATION = 24 * 60 * 60 * 1000;
        
        if (now - authTime < SESSION_DURATION) {
          return userData;
        }
        localStorage.removeItem('recorder_user');
      } catch {
        localStorage.removeItem('recorder_user');
      }
    }
    return null;
  });
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  
  const pendingActionRef = useRef<PendingAction | null>(null);
  const initializingRef = useRef(false);

  // Load Google Identity Services script
  const loadGisScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      
      if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
        // Script already loading, wait for it
        const checkLoaded = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(checkLoaded);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkLoaded);
          reject(new Error('GIS script load timeout'));
        }, 10000);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }, []);

  // Handle credential response from Google
  const handleCredentialResponse = useCallback((response: CredentialResponse) => {
    console.log('Google credential received');
    
    const payload = decodeJwtPayload(response.credential);
    if (!payload) {
      setAuthError('Failed to process Google sign-in response');
      setAuthLoading(false);
      return;
    }
    
    const userData: User = {
      id: payload.sub,
      name: payload.name || 'Google User',
      email: payload.email || '',
      avatar: payload.picture || '',
      authenticatedAt: new Date().toISOString(),
      credential: response.credential,
    };
    
    setUser(userData);
    localStorage.setItem('recorder_user', JSON.stringify(userData));
    setAuthLoading(false);
    setShowAuthModal(false);
    setAuthError(null);
    
    // Execute pending action after successful login
    if (pendingActionRef.current) {
      setTimeout(() => {
        pendingActionRef.current?.();
        pendingActionRef.current = null;
      }, 300);
    }
  }, []);

  // Initialize Google Identity Services
  const initializeGis = useCallback(async () => {
    if (DEMO_MODE || initializingRef.current || gisLoaded) return;
    
    initializingRef.current = true;
    
    try {
      await loadGisScript();
      
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        setGisLoaded(true);
      }
    } catch (err) {
      console.error('GIS initialization failed:', err);
    }
    
    initializingRef.current = false;
  }, [loadGisScript, handleCredentialResponse, gisLoaded]);

  // Initialize GIS on mount
  useEffect(() => {
    if (!DEMO_MODE) {
      initializeGis();
    }
  }, [initializeGis]);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    
    if (DEMO_MODE) {
      // Demo mode: simulate sign-in
      console.log('Demo mode: simulating Google sign-in');
      await new Promise(r => setTimeout(r, 1500));
      
      const demoUser: User = {
        id: 'demo_' + Math.random().toString(36).slice(2, 10),
        name: 'Demo User',
        email: 'demo@example.com',
        avatar: '',
        authenticatedAt: new Date().toISOString(),
      };
      
      setUser(demoUser);
      localStorage.setItem('recorder_user', JSON.stringify(demoUser));
      setAuthLoading(false);
      setShowAuthModal(false);
      
      if (pendingActionRef.current) {
        setTimeout(() => {
          pendingActionRef.current?.();
          pendingActionRef.current = null;
        }, 300);
      }
      return;
    }
    
    // Real Google Sign-In
    try {
      if (!gisLoaded) {
        await initializeGis();
      }
      
      if (window.google?.accounts?.id) {
        // Show One Tap prompt
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason();
            console.log('One Tap not displayed:', reason);
            
            // If One Tap fails, we need to show a message
            if (reason === 'browser_not_supported') {
              setAuthError('Your browser does not support Google Sign-In. Please use Chrome, Firefox, or Edge.');
            } else if (reason === 'opt_out_or_no_session') {
              setAuthError('Please enable cookies and sign into Google in your browser first.');
            } else {
              setAuthError('Google Sign-In is not available. Please try again or use a different browser.');
            }
            setAuthLoading(false);
          } else if (notification.isSkippedMoment()) {
            console.log('One Tap skipped:', notification.getSkippedReason());
            setAuthLoading(false);
          }
        });
      } else {
        setAuthError('Google Sign-In failed to initialize. Please refresh the page.');
        setAuthLoading(false);
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      setAuthError('Sign-in failed. Please try again.');
      setAuthLoading(false);
    }
  }, [gisLoaded, initializeGis]);

  // Sign out
  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem('recorder_user');
    pendingActionRef.current = null;
    
    if (!DEMO_MODE && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }, []);

  // Require authentication - ALWAYS enforces login for downloads
  const requireAuth = useCallback((callback: () => void): boolean => {
    if (user) {
      callback();
      return true;
    }
    
    // Store callback to execute after login
    pendingActionRef.current = callback;
    setShowAuthModal(true);
    return false;
  }, [user]);

  // Render Google Sign-In button into a container
  const renderGoogleButton = useCallback((containerId: string) => {
    if (DEMO_MODE || !gisLoaded || !window.google?.accounts?.id) return;
    
    const container = document.getElementById(containerId);
    if (container) {
      window.google.accounts.id.renderButton(container, {
        theme: 'filled_blue',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
        width: 300,
      });
    }
  }, [gisLoaded]);

  return {
    user,
    showAuthModal,
    authLoading,
    authError,
    isDemo: DEMO_MODE,
    gisLoaded,
    setShowAuthModal,
    signInWithGoogle,
    signOut,
    requireAuth,
    renderGoogleButton,
  };
}
