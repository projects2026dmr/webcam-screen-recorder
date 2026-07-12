/**
 * useRecorder Hook - Production-Ready Recording Engine
 * 
 * ARCHITECTURE:
 * - Recording lifecycle: idle → preparing → countdown → recording → processing → preview
 * - Uses setInterval (not rAF) for canvas drawing to work in background tabs
 * - AudioContext for proper audio mixing (screen + mic)
 * - Unified stop detection via requestStopRecording()
 * - Single cleanup() function for all resource cleanup
 * 
 * KEY FEATURES:
 * - Screen recording (full screen, window, or tab)
 * - Webcam recording
 * - Screen + Webcam PiP mode with customizable position/size
 * - Countdown overlay drawn directly on the recording canvas
 * - Quality presets (720p to 4K) and bitrate options
 * - Microphone selection and mixing
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { createCompositeTrack } from "./compositeVideoTrack";

// ============================================================
// TYPES
// ============================================================

export type RecordingMode = 'screen' | 'webcam' | 'screen+webcam';
export type QualityPreset = '720p' | '1080p' | '1440p' | '4k' | 'original';
export type BitratePreset = 'low' | 'medium' | 'high';
export type WebcamPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type WebcamSize = 'small' | 'medium' | 'large';

export interface RecordingResult {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  date: string;
  mode: RecordingMode;
  quality: QualityPreset;
  bitrate: BitratePreset;
  resolution: string;
  thumbnail: string;
  webcamPosition?: WebcamPosition;
  webcamSize?: WebcamSize;
  microphoneId?: string;
}

export type RecorderState = 'idle' | 'preparing' | 'countdown' | 'recording' | 'processing' | 'preview';

interface UseRecorderReturn {
  // State
  state: RecorderState;
  countdown: number;
  elapsedTime: number;
  recordingResult: RecordingResult | null;
  webcamDevices: MediaDeviceInfo[];
  microphoneDevices: MediaDeviceInfo[];
  selectedWebcam: string;
  selectedMicrophone: string;
  selectedQuality: QualityPreset;
  selectedBitrate: BitratePreset;
  selectedMode: RecordingMode;
  webcamPosition: WebcamPosition;
  webcamSize: WebcamSize;
  webcamStream: MediaStream | null;
  error: string | null;
  // Setters
  setSelectedWebcam: (id: string) => void;
  setSelectedMicrophone: (id: string) => void;
  setSelectedQuality: (q: QualityPreset) => void;
  setSelectedBitrate: (b: BitratePreset) => void;
  setSelectedMode: (m: RecordingMode) => void;
  setWebcamPosition: (p: WebcamPosition) => void;
  setWebcamSize: (s: WebcamSize) => void;
  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
  refreshDevices: () => Promise<void>;
}

// ============================================================
// CONSTANTS
// ============================================================

const QUALITY_DIMENSIONS: Record<QualityPreset, { width: number; height: number } | null> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 },
  'original': null,
};

const BITRATE_BASE: Record<QualityPreset, number> = {
  '720p': 4000000,
  '1080p': 8000000,
  '1440p': 12000000,
  '4k': 20000000,
  'original': 8000000,
};

const BITRATE_MULTIPLIER: Record<BitratePreset, number> = {
  low: 0.5,
  medium: 1.0,
  high: 1.5,
};

const WEBCAM_SIZE_MULTIPLIER: Record<WebcamSize, number> = {
  small: 0.15,
  medium: 0.22,
  large: 0.30,
};

// Frame interval for canvas drawing (30fps ≈ 33ms)
const FRAME_INTERVAL_MS = 33;

// Countdown duration in seconds
const COUNTDOWN_SECONDS = 5;

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

export function useRecorder(): UseRecorderReturn {
  // ----------------------
  // React State
  // ----------------------
  const [state, setState] = useState<RecorderState>('idle');
  const [countdown, setCountdown] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);
  const [webcamDevices, setWebcamDevices] = useState<MediaDeviceInfo[]>([]);
  const [microphoneDevices, setMicrophoneDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedWebcam, setSelectedWebcam] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [selectedQuality, setSelectedQuality] = useState<QualityPreset>('1080p');
  const [selectedBitrate, setSelectedBitrate] = useState<BitratePreset>('high');
  const [selectedMode, setSelectedMode] = useState<RecordingMode>('screen');
  const [webcamPosition, setWebcamPosition] = useState<WebcamPosition>('bottom-right');
  const [webcamSize, setWebcamSize] = useState<WebcamSize>('medium');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ----------------------
  // Refs: Streams & Media
  // ----------------------
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);

  // ----------------------
  // Refs: Canvas & Recording
  // ----------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ----------------------
  // Refs: Audio
  // ----------------------
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // ----------------------
  // Refs: Timers
  // ----------------------
  const drawIntervalRef = useRef<number | null>(null);
  const elapsedIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // ----------------------
  // Refs: Control Flags
  // ----------------------
  const isStoppingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const countdownValueRef = useRef(0);
  const framesDrawnRef = useRef(0);

  // ----------------------
  // Refs: Settings (for use in callbacks without stale closures)
  // ----------------------
  const modeRef = useRef<RecordingMode>(selectedMode);
  const positionRef = useRef<WebcamPosition>(webcamPosition);
  const sizeRef = useRef<WebcamSize>(webcamSize);
  const qualityRef = useRef<QualityPreset>(selectedQuality);
  const bitrateRef = useRef<BitratePreset>(selectedBitrate);
  const micIdRef = useRef<string>(selectedMicrophone);

  // ----------------------
  // Refs: Event Handlers (for proper cleanup)
  // ----------------------
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const originalTitleRef = useRef(document.title);

  // Keep refs in sync with state
  useEffect(() => { modeRef.current = selectedMode; }, [selectedMode]);
  useEffect(() => { positionRef.current = webcamPosition; }, [webcamPosition]);
  useEffect(() => { sizeRef.current = webcamSize; }, [webcamSize]);
  useEffect(() => { qualityRef.current = selectedQuality; }, [selectedQuality]);
  useEffect(() => { bitrateRef.current = selectedBitrate; }, [selectedBitrate]);
  useEffect(() => { micIdRef.current = selectedMicrophone; }, [selectedMicrophone]);

  // ============================================================
  // CLEANUP - Single source of truth for resource cleanup
  // ============================================================
  const cleanup = useCallback(() => {
    console.log('[Recorder] Cleanup called');

    // 0. Restore original page title
    document.title = originalTitleRef.current;

    // 1. Remove visibility change listener
    if (visibilityHandlerRef.current) {
      document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
      visibilityHandlerRef.current = null;
    }

    // 2. Stop draw interval
    if (drawIntervalRef.current !== null) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }

    // 3. Stop elapsed timer
    if (elapsedIntervalRef.current !== null) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }

    // 4. Stop all stream tracks
    screenStreamRef.current?.getTracks().forEach(track => {
      track.onended = null; // Remove event handlers
      track.stop();
    });
    webcamStreamRef.current?.getTracks().forEach(track => {
      track.onended = null;
      track.stop();
    });
    micStreamRef.current?.getTracks().forEach(track => track.stop());

    // 5. Clear video elements
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
      screenVideoRef.current = null;
    }
    if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = null;
      webcamVideoRef.current = null;
    }

    // 6. Close audio context
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
    audioDestinationRef.current = null;

    // 7. Clear stream refs
    screenStreamRef.current = null;
    webcamStreamRef.current = null;
    micStreamRef.current = null;

    // 8. Clear canvas refs
    canvasRef.current = null;
    ctxRef.current = null;

    // 9. Clear MediaRecorder ref (don't stop here - handled elsewhere)
    mediaRecorderRef.current = null;

    // 10. Reset state
    setWebcamStream(null);
    isRecordingRef.current = false;
    isStoppingRef.current = false;
    framesDrawnRef.current = 0;
    countdownValueRef.current = 0;
    chunksRef.current = [];
  }, []);

  // ============================================================
  // DEVICE ENUMERATION
  // ============================================================
  const refreshDevices = useCallback(async () => {
    try {
      // Request temporary permission to get device labels
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(t => t.stop());
      } catch {
        // Continue even if denied - labels might be empty
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const audioInputs = devices.filter(d => d.kind === 'audioinput');

      setWebcamDevices(videoInputs);
      setMicrophoneDevices(audioInputs);

      // Auto-select first device if none selected
      if (videoInputs.length > 0 && !selectedWebcam) {
        setSelectedWebcam(videoInputs[0].deviceId);
      }
      if (audioInputs.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('[Recorder] Device enumeration failed:', err);
    }
  }, [selectedWebcam, selectedMicrophone]);

  // ============================================================
  // THUMBNAIL GENERATION
  // ============================================================
  const generateThumbnail = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';

      const url = URL.createObjectURL(blob);
      video.src = url;

      const cleanupVideo = () => {
        URL.revokeObjectURL(url);
      };

      video.onloadeddata = () => {
        // Seek to middle or 0.5s, whichever is less
        video.currentTime = Math.min(0.5, video.duration / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 180;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(video, 0, 0, 320, 180);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          cleanupVideo();
          resolve(dataUrl);
        } catch {
          cleanupVideo();
          resolve('');
        }
      };

      video.onerror = () => {
        cleanupVideo();
        resolve('');
      };

      // Timeout fallback
      setTimeout(() => {
        cleanupVideo();
        resolve('');
      }, 5000);
    });
  }, []);

  // ============================================================
  // DRAW COUNTDOWN OVERLAY
  // ============================================================
  const drawCountdownOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    count: number
  ) => {
    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.12;

    // Glow effect
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.8,
      centerX, centerY, radius * 1.5
    );
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.6)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Countdown number
    ctx.fillStyle = 'white';
    ctx.font = `bold ${radius * 1.2}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count.toString(), centerX, centerY);

    // "Recording starts in..." text
    ctx.font = `500 ${Math.max(18, radius * 0.3)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText('Recording starts in...', centerX, centerY - radius - 40);
  }, []);

  // ============================================================
  // DRAW FRAME - Called by setInterval
  // ============================================================
  const drawFrame = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const mode = modeRef.current;
    const position = positionRef.current;
    const size = sizeRef.current;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw main content
    if (mode === 'webcam') {
      // Webcam only - draw mirrored
      const webcamVideo = webcamVideoRef.current;
      if (webcamVideo && webcamVideo.readyState >= 2) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(webcamVideo, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        framesDrawnRef.current++;
      }
    } else {
      // Screen (or screen+webcam)
      const screenVideo = screenVideoRef.current;
      if (screenVideo && screenVideo.readyState >= 2) {
        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
        framesDrawnRef.current++;
      }

      // Draw webcam PiP overlay
      if (mode === 'screen+webcam') {
        const webcamVideo = webcamVideoRef.current;
        if (webcamVideo && webcamVideo.readyState >= 2) {
          const sizeMultiplier = WEBCAM_SIZE_MULTIPLIER[size];
          const pipSize = Math.min(canvas.width, canvas.height) * sizeMultiplier;
          const padding = 20;

          let pipX: number, pipY: number;
          switch (position) {
            case 'top-left':
              pipX = padding;
              pipY = padding;
              break;
            case 'top-right':
              pipX = canvas.width - pipSize - padding;
              pipY = padding;
              break;
            case 'bottom-left':
              pipX = padding;
              pipY = canvas.height - pipSize - padding;
              break;
            case 'bottom-right':
            default:
              pipX = canvas.width - pipSize - padding;
              pipY = canvas.height - pipSize - padding;
          }

          // Circular clip for webcam
          ctx.save();
          ctx.beginPath();
          ctx.arc(pipX + pipSize / 2, pipY + pipSize / 2, pipSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          // Draw mirrored webcam
          ctx.translate(pipX + pipSize, pipY);
          ctx.scale(-1, 1);
          ctx.drawImage(webcamVideo, 0, 0, pipSize, pipSize);
          ctx.restore();

          // Draw border
          ctx.beginPath();
          ctx.arc(pipX + pipSize / 2, pipY + pipSize / 2, pipSize / 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }

    // Draw countdown overlay if active
    if (countdownValueRef.current > 0) {
      drawCountdownOverlay(ctx, canvas.width, canvas.height, countdownValueRef.current);
    }
  }, [drawCountdownOverlay]);

  // ============================================================
  // FINALIZE RECORDING - Process chunks into result
  // ============================================================
  const finalizeRecording = useCallback(async (chunks: Blob[], mimeType: string) => {
    console.log('[Recorder] Finalizing with', chunks.length, 'chunks');
    setState('processing');

    const blob = new Blob(chunks, { type: mimeType });
    console.log('[Recorder] Blob size:', blob.size, 'bytes');

    // Validate blob has actual content
    if (blob.size < 1000) {
      console.error('[Recorder] Blob too small, recording failed');
      setError('Recording failed. Please try again.');
      cleanup();
      setState('idle');
      return;
    }

    const url = URL.createObjectURL(blob);
    const duration = (Date.now() - startTimeRef.current) / 1000;

    // Get resolution from canvas
    let resolution = 'Unknown';
    if (canvasRef.current) {
      resolution = `${canvasRef.current.width}×${canvasRef.current.height}`;
    }

    // Generate thumbnail
    let thumbnail = '';
    try {
      thumbnail = await generateThumbnail(blob);
    } catch (e) {
      console.warn('[Recorder] Thumbnail generation failed:', e);
    }

    const result: RecordingResult = {
      id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      blob,
      url,
      duration,
      date: new Date().toISOString(),
      mode: modeRef.current,
      quality: qualityRef.current,
      bitrate: bitrateRef.current,
      resolution,
      thumbnail,
      webcamPosition: modeRef.current === 'screen+webcam' ? positionRef.current : undefined,
      webcamSize: modeRef.current === 'screen+webcam' ? sizeRef.current : undefined,
      microphoneId: micIdRef.current || undefined,
    };

    // Cleanup resources but keep the result
    cleanup();
    setRecordingResult(result);
    setState('preview');

    // Scroll to preview
    setTimeout(() => {
      document.getElementById('recorder')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [cleanup, generateThumbnail]);

  // ============================================================
  // REQUEST STOP RECORDING - Unified stop handler
  // ============================================================
  const requestStopRecording = useCallback((reason?: string) => {
    // Prevent multiple stop calls
    if (isStoppingRef.current) {
      console.log('[Recorder] Stop already in progress, ignoring');
      return;
    }
    isStoppingRef.current = true;
    
    console.log('[Recorder] Stop requested:', reason || 'manual');

    // Stop elapsed timer immediately
    if (elapsedIntervalRef.current !== null) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    setElapsedTime(0);

    // Stop MediaRecorder - this triggers onstop which handles finalization
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // No MediaRecorder or already inactive - cleanup directly
      console.log('[Recorder] No active MediaRecorder, cleaning up');
      cleanup();
      setState('idle');
    }
  }, [cleanup]);

  // ============================================================
  // VISIBILITY CHANGE HANDLER
  // ============================================================
  const createVisibilityHandler = useCallback(() => {
    return () => {
      // When tab becomes hidden while recording, try to keep videos playing
      // This is a workaround for browsers that pause media in background tabs
      if (document.hidden && isRecordingRef.current) {
        console.log('[Recorder] Tab hidden, attempting to keep videos playing');
        screenVideoRef.current?.play().catch(() => {});
        webcamVideoRef.current?.play().catch(() => {});
      }
    };
  }, []);

  // ============================================================
  // FORCE VIDEO PLAY - Ensures video element is playing
  // ============================================================
  const forceVideoPlay = useCallback(async (video: HTMLVideoElement): Promise<void> => {
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await video.play();
        // Wait for video to have frames
        let waitCount = 0;
        while (video.readyState < 2 && waitCount < 50) {
          await new Promise(r => setTimeout(r, 100));
          waitCount++;
        }
        if (video.readyState >= 2) {
          console.log('[Recorder] Video playing, readyState:', video.readyState);
          return;
        }
      } catch (e) {
        console.log(`[Recorder] Play attempt ${attempt + 1} failed, retrying...`);
        await new Promise(r => setTimeout(r, 200));
      }
    }
    throw new Error('Failed to start video playback');
  }, []);

  // ============================================================
  // START RECORDING - Main recording pipeline
  // ============================================================
  const startRecording = useCallback(async () => {
    console.log('[Recorder] Starting recording...');
    
    // Reset state
    setError(null);
    setRecordingResult(null);
    isStoppingRef.current = false;
    isRecordingRef.current = false;
    countdownValueRef.current = 0;
    framesDrawnRef.current = 0;
    chunksRef.current = [];

    try {
      setState('preparing');

      // ----------------------------------------
      // STEP 1: Acquire Microphone Stream
      // ----------------------------------------
      let micStream: MediaStream | null = null;
      try {
        const constraints: MediaStreamConstraints = {
          audio: selectedMicrophone
            ? { deviceId: { exact: selectedMicrophone } }
            : true,
          video: false,
        };
        micStream = await navigator.mediaDevices.getUserMedia(constraints);
        micStreamRef.current = micStream;
        console.log('[Recorder] Microphone acquired');
      } catch (e) {
        console.warn('[Recorder] Microphone access failed:', e);
        // Continue without microphone
      }

      // ----------------------------------------
      // STEP 2: Acquire Screen/Webcam Stream
      // ----------------------------------------
      let canvasWidth: number;
      let canvasHeight: number;

      if (selectedMode === 'webcam') {
        // --- WEBCAM ONLY MODE ---
        const dims = QUALITY_DIMENSIONS[selectedQuality];
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: selectedWebcam ? { exact: selectedWebcam } : undefined,
            width: dims ? { ideal: dims.width } : undefined,
            height: dims ? { ideal: dims.height } : undefined,
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        webcamStreamRef.current = stream;
        setWebcamStream(stream);

        // Create video element
        const video = document.createElement('video');
        video.srcObject = stream;
        webcamVideoRef.current = video;

        await forceVideoPlay(video);

        const settings = stream.getVideoTracks()[0].getSettings();
        canvasWidth = settings.width || 1280;
        canvasHeight = settings.height || 720;

        // Stop detection
        stream.getVideoTracks()[0].onended = () => {
          console.log('[Recorder] Webcam track ended');
          requestStopRecording('webcam_ended');
        };

      } else {
        // --- SCREEN MODE (or screen+webcam) ---
        const dims = QUALITY_DIMENSIONS[selectedQuality];
        const displayConstraints: DisplayMediaStreamOptions = {
          video: dims ? {
            width: { ideal: dims.width },
            height: { ideal: dims.height },
          } : true,
          audio: true, // Request system audio
        };

        const screenStream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);
        screenStreamRef.current = screenStream;

        // Create video element for screen
        const screenVideo = document.createElement('video');
        screenVideo.srcObject = screenStream;
        screenVideoRef.current = screenVideo;

        await forceVideoPlay(screenVideo);

        const settings = screenStream.getVideoTracks()[0].getSettings();
        canvasWidth = settings.width || 1920;
        canvasHeight = settings.height || 1080;

        // Stop detection for screen track
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          console.log('[Recorder] Screen track ended (user stopped sharing)');
          requestStopRecording('screen_ended');
        };

        // Additional stop detection via stream inactive event
        (screenStream as any).oninactive = () => {
          console.log('[Recorder] Screen stream inactive');
          requestStopRecording('stream_inactive');
        };

        // Get webcam for PiP mode
        if (selectedMode === 'screen+webcam') {
          try {
            const webcamConstraints: MediaStreamConstraints = {
              video: {
                deviceId: selectedWebcam ? { exact: selectedWebcam } : undefined,
                width: { ideal: 640 },
                height: { ideal: 480 },
              },
              audio: false,
            };

            const camStream = await navigator.mediaDevices.getUserMedia(webcamConstraints);
            webcamStreamRef.current = camStream;
            setWebcamStream(camStream);

            const webcamVideo = document.createElement('video');
            webcamVideo.srcObject = camStream;
            webcamVideoRef.current = webcamVideo;

            await forceVideoPlay(webcamVideo);
            console.log('[Recorder] Webcam for PiP acquired');
          } catch (e) {
            // Webcam failed but screen is available - continue with warning
            console.warn('[Recorder] Webcam for PiP failed, continuing without:', e);
          }
        }
      }

      console.log('[Recorder] Canvas dimensions:', canvasWidth, 'x', canvasHeight);

      // ----------------------------------------
      // STEP 3: Create Canvas
      // ----------------------------------------
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvasRef.current = canvas;

      const ctx = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true, // Better performance
      })!;
      ctxRef.current = ctx;

      // ----------------------------------------
      // STEP 4: Start Drawing with setInterval
      // Using setInterval instead of requestAnimationFrame
      // because rAF stops when tab loses focus
      // ----------------------------------------
      drawIntervalRef.current = window.setInterval(() => {
        drawFrame();
      }, FRAME_INTERVAL_MS);

      console.log('[Recorder] Drawing started');

      // ----------------------------------------
      // STEP 5: Set up Visibility Handler
      // ----------------------------------------
      visibilityHandlerRef.current = createVisibilityHandler();
      document.addEventListener('visibilitychange', visibilityHandlerRef.current);

      // ----------------------------------------
      // STEP 6: Run Countdown
      // ----------------------------------------
      setState('countdown');

      for (let i = COUNTDOWN_SECONDS; i >= 1; i--) {
        // Check if stop was requested during countdown
        if (isStoppingRef.current) {
          console.log('[Recorder] Stop requested during countdown');
          cleanup();
          setState('idle');
          return;
        }

        countdownValueRef.current = i;
        setCountdown(i);
        document.title = `${i}…`;
        await new Promise(r => setTimeout(r, 1000));
      }

      countdownValueRef.current = 0;
      setCountdown(0);

      // Brief pause for smooth transition
      await new Promise(r => setTimeout(r, 300));

      // ----------------------------------------
      // STEP 7: Verify Frames Are Being Drawn
      // ----------------------------------------
      console.log('[Recorder] Frames drawn after countdown:', framesDrawnRef.current);

      // Wait for at least a few frames
      let waitAttempts = 0;
      while (framesDrawnRef.current < 5 && waitAttempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        waitAttempts++;
      }

      if (framesDrawnRef.current < 5) {
        console.warn('[Recorder] Not enough frames drawn, may produce empty video');
      }

// ----------------------------------------
// STEP 8: Set Up Audio Mixing
// ----------------------------------------
let finalStream: MediaStream;

if (selectedMode === 'screen') {
  // --- SCREEN ONLY ---
  try {
    const audioCtx = new AudioContext();
    audioContextRef.current = audioCtx;

    const destination = audioCtx.createMediaStreamDestination();
    audioDestinationRef.current = destination;

    if (screenStreamRef.current) {
      const screenAudioTracks = screenStreamRef.current.getAudioTracks();
      if (screenAudioTracks.length > 0) {
        const screenAudioStream = new MediaStream(screenAudioTracks);
        const screenSource = audioCtx.createMediaStreamSource(screenAudioStream);
        screenSource.connect(destination);
      }
    }

    if (micStream) {
      const micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(destination);
    }

    const videoTracks = screenStreamRef.current
      ? screenStreamRef.current.getVideoTracks()
      : [];

    finalStream = new MediaStream([
      ...videoTracks,
      ...destination.stream.getAudioTracks(),
    ]);

  } catch {
    const videoTracks = screenStreamRef.current
      ? screenStreamRef.current.getVideoTracks()
      : [];

    const audioTracks: MediaStreamTrack[] = [];

    if (screenStreamRef.current) {
      audioTracks.push(...screenStreamRef.current.getAudioTracks());
    }
    if (micStream) {
      audioTracks.push(...micStream.getAudioTracks());
    }

    finalStream = new MediaStream([
      ...videoTracks,
      ...audioTracks,
    ]);
  }
} else if (selectedMode === 'webcam') {
  // --- WEBCAM ONLY ---
  try {
    const audioCtx = new AudioContext();
    audioContextRef.current = audioCtx;

    const destination = audioCtx.createMediaStreamDestination();
    audioDestinationRef.current = destination;

    if (webcamStreamRef.current) {
      const webcamAudioTracks = webcamStreamRef.current.getAudioTracks();
      if (webcamAudioTracks.length > 0) {
        const webcamAudioStream = new MediaStream(webcamAudioTracks);
        const webcamSource = audioCtx.createMediaStreamSource(webcamAudioStream);
        webcamSource.connect(destination);
      }
    }

    if (micStream) {
      const micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(destination);
    }

    const videoTracks = webcamStreamRef.current
      ? webcamStreamRef.current.getVideoTracks()
      : [];

    finalStream = new MediaStream([
      ...videoTracks,
      ...destination.stream.getAudioTracks(),
    ]);

  } catch {
    const videoTracks = webcamStreamRef.current
      ? webcamStreamRef.current.getVideoTracks()
      : [];

    const audioTracks: MediaStreamTrack[] = [];

    if (webcamStreamRef.current) {
      audioTracks.push(...webcamStreamRef.current.getAudioTracks());
    }
    if (micStream) {
      audioTracks.push(...micStream.getAudioTracks());
    }

    finalStream = new MediaStream([
      ...videoTracks,
      ...audioTracks,
    ]);
  }
} else {
  // --- SCREEN+WEBCAM ---
  try {
    const audioCtx = new AudioContext();
    audioContextRef.current = audioCtx;

    const destination = audioCtx.createMediaStreamDestination();
    audioDestinationRef.current = destination;

    if (screenStreamRef.current) {
      const screenAudioTracks = screenStreamRef.current.getAudioTracks();
      if (screenAudioTracks.length > 0) {
        const screenAudioStream = new MediaStream(screenAudioTracks);
        const screenSource = audioCtx.createMediaStreamSource(screenAudioStream);
        screenSource.connect(destination);
      }
    }

    if (micStream) {
      const micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(destination);
    }

    // Try PiP compositing
    const compositeTrack = await createCompositeTrack(
      screenStreamRef.current!,
      webcamStreamRef.current!
    );

    finalStream = new MediaStream([
      compositeTrack,
      ...destination.stream.getAudioTracks(),
    ]);

  } catch {
    // Fallback: screen + webcam (no PiP)
    const videoTracks: MediaStreamTrack[] = [];

    if (screenStreamRef.current) {
      videoTracks.push(...screenStreamRef.current.getVideoTracks());
    }

    if (webcamStreamRef.current) {
      videoTracks.push(...webcamStreamRef.current.getVideoTracks());
    }

    const audioTracks: MediaStreamTrack[] = [];

    if (screenStreamRef.current) {
      audioTracks.push(...screenStreamRef.current.getAudioTracks());
    }

    if (micStream) {
      audioTracks.push(...micStream.getAudioTracks());
    }

    finalStream = new MediaStream([
      ...videoTracks,
      ...audioTracks,
    ]);
  }
}

      // ----------------------------------------
      // STEP 9: Create and Start MediaRecorder
      // ----------------------------------------
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const bitrate = BITRATE_BASE[selectedQuality] * BITRATE_MULTIPLIER[selectedBitrate];

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: bitrate,
      });
      mediaRecorderRef.current = mediaRecorder;

      // Collect data chunks
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log('[Recorder] Chunk received:', e.data.size, 'bytes');
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('[Recorder] MediaRecorder stopped, chunks:', chunksRef.current.length);

        // Stop drawing
        if (drawIntervalRef.current !== null) {
          clearInterval(drawIntervalRef.current);
          drawIntervalRef.current = null;
        }

        // Finalize or show error
        if (chunksRef.current.length > 0) {
          finalizeRecording([...chunksRef.current], mimeType);
        } else {
          setError('No video data was recorded. Please try again.');
          cleanup();
          setState('idle');
        }
      };

      // Handle errors
      mediaRecorder.onerror = (e) => {
        console.error('[Recorder] MediaRecorder error:', e);
        setError('Recording failed. Please try again.');
        cleanup();
        setState('idle');
      };

      // ----------------------------------------
      // STEP 10: Start Recording
      // ----------------------------------------
      mediaRecorder.start(); // timeslice kullanma
      isRecordingRef.current = true;
      startTimeRef.current = Date.now();
      setState('recording');
      document.title = '● Recording…';

      console.log('[Recorder] Recording started');

      // Start elapsed time counter
      elapsedIntervalRef.current = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);

    } catch (err: any) {
      console.error('[Recorder] Start failed:', err);
      cleanup();
      setState('idle');

      // User-friendly error messages
      if (err.name === 'NotAllowedError') {
        setError('Please allow screen and microphone access to start recording.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a device.');
      } else if (err.name === 'AbortError') {
        // User cancelled - not an error
        setError(null);
      } else if (err.name === 'NotSupportedError') {
        setError('Your browser does not support screen recording.');
      } else {
        setError('Recording failed. Please try again.');
      }
    }
  }, [
    selectedMode,
    selectedWebcam,
    selectedMicrophone,
    selectedQuality,
    selectedBitrate,
    cleanup,
    drawFrame,
    forceVideoPlay,
    createVisibilityHandler,
    requestStopRecording,
    finalizeRecording,
  ]);

  // ============================================================
  // STOP RECORDING - Public method
  // ============================================================
  const stopRecording = useCallback(() => {
    requestStopRecording('manual');
  }, [requestStopRecording]);

  // ============================================================
  // CLEAR RECORDING - Reset to idle state
  // ============================================================
  const clearRecording = useCallback(() => {
    // Revoke object URL to prevent memory leak
    if (recordingResult?.url) {
      URL.revokeObjectURL(recordingResult.url);
    }
    
    // Ensure all resources are cleaned up
    cleanup();
    
    // Reset state
    setRecordingResult(null);
    setState('idle');
    setError(null);
  }, [recordingResult, cleanup]);

  // ============================================================
  // CLEANUP ON UNMOUNT
  // ============================================================
  useEffect(() => {
    return () => {
      // Revoke any object URLs
      if (recordingResult?.url) {
        URL.revokeObjectURL(recordingResult.url);
      }
      // Full cleanup
      cleanup();
    };
  }, []); // Empty deps - only run on unmount

  // ============================================================
  // RETURN PUBLIC API
  // ============================================================
  return {
    // State
    state,
    countdown,
    elapsedTime,
    recordingResult,
    webcamDevices,
    microphoneDevices,
    selectedWebcam,
    selectedMicrophone,
    selectedQuality,
    selectedBitrate,
    selectedMode,
    webcamPosition,
    webcamSize,
    webcamStream,
    error,
    // Setters
    setSelectedWebcam,
    setSelectedMicrophone,
    setSelectedQuality,
    setSelectedBitrate,
    setSelectedMode,
    setWebcamPosition,
    setWebcamSize,
    // Actions
    startRecording,
    stopRecording,
    clearRecording,
    refreshDevices,
  };
}
