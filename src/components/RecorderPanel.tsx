/**
 * RecorderPanel Component - COMPLETE REWRITE
 * 
 * Main recording interface with all controls.
 * Matches the new recorder state machine.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Monitor,
  Camera,
  Layers,
  Play,
  Square,
  RotateCcw,
  Save,
  AlertCircle,
  ChevronDown,
  Mic,
  Scissors,
  Loader2,
} from 'lucide-react';
import type { 
  RecordingMode, 
  QualityPreset, 
  BitratePreset,
  RecorderState, 
  RecordingResult,
  WebcamPosition,
  WebcamSize,
} from '../hooks/useRecorder';
import TrimEditor from './TrimEditor';

interface RecorderPanelProps {
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
  setSelectedWebcam: (id: string) => void;
  setSelectedMicrophone: (id: string) => void;
  setSelectedQuality: (q: QualityPreset) => void;
  setSelectedBitrate: (b: BitratePreset) => void;
  setSelectedMode: (m: RecordingMode) => void;
  setWebcamPosition: (p: WebcamPosition) => void;
  setWebcamSize: (s: WebcamSize) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
  refreshDevices: () => Promise<void>;
  onSaveToLibrary: (result: RecordingResult) => Promise<boolean>;
  onSaveSuccess: () => void;
}

const MODES: { value: RecordingMode; label: string; icon: typeof Monitor; desc: string }[] = [
  { value: 'screen', label: 'Screen Only', icon: Monitor, desc: 'Capture screen, window, or tab' },
  { value: 'webcam', label: 'Webcam Only', icon: Camera, desc: 'Record from your camera' },
  { value: 'screen+webcam', label: 'Screen + Webcam', icon: Layers, desc: 'Screen with webcam overlay' },
];

const QUALITIES: { value: QualityPreset; label: string; desc: string }[] = [
  { value: '720p', label: '720p HD', desc: '1280×720' },
  { value: '1080p', label: '1080p Full HD', desc: '1920×1080' },
  { value: '1440p', label: '1440p QHD', desc: '2560×1440' },
  { value: '4k', label: '4K Ultra HD', desc: '3840×2160' },
  { value: 'original', label: 'Original', desc: 'Native resolution' },
];

const BITRATES: { value: BitratePreset; label: string; desc: string }[] = [
  { value: 'low', label: 'Low', desc: 'Smaller files' },
  { value: 'medium', label: 'Medium', desc: 'Balanced' },
  { value: 'high', label: 'High', desc: 'Best quality' },
];

const POSITIONS: { value: WebcamPosition; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

const SIZES: { value: WebcamSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function RecorderPanel(props: RecorderPanelProps) {
  const {
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
    error,
    setSelectedWebcam,
    setSelectedMicrophone,
    setSelectedQuality,
    setSelectedBitrate,
    setSelectedMode,
    setWebcamPosition,
    setWebcamSize,
    startRecording,
    stopRecording,
    clearRecording,
    refreshDevices,
    onSaveToLibrary,
    onSaveSuccess,
  } = props;

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTrimEditor, setShowTrimEditor] = useState(false);

  // Load devices on mount
  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Load video preview when result changes
  useEffect(() => {
    if (videoPreviewRef.current && recordingResult?.url) {
      const video = videoPreviewRef.current;
      video.src = recordingResult.url;
      video.load();
    }
  }, [recordingResult?.url]);

  // Reset saved state when new recording
  useEffect(() => {
    setSaved(false);
    setSaving(false);
  }, [recordingResult?.id]);

  const handleSave = async () => {
    if (recordingResult && !saving && !saved) {
      setSaving(true);
      const success = await onSaveToLibrary(recordingResult);
      setSaving(false);
      if (success) {
        setSaved(true);
        onSaveSuccess();
      }
    }
  };

  const handleTrimExport = async (blob: Blob, duration: number) => {
    if (recordingResult) {
      const trimmedResult: RecordingResult = {
        ...recordingResult,
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        blob,
        url: URL.createObjectURL(blob),
        duration,
      };
      await onSaveToLibrary(trimmedResult);
      setShowTrimEditor(false);
      onSaveSuccess();
    }
  };

  const showWebcamControls = selectedMode === 'webcam' || selectedMode === 'screen+webcam';
  const showPipControls = selectedMode === 'screen+webcam';

  return (
    <section id="recorder" className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Record Your Screen & Webcam Now
          </h2>
          <p className="text-lg text-slate-400">
            The countdown appears <strong className="text-white">inside your recording</strong> — visible even in other tabs!
          </p>
        </div>

        <div className="rounded-2xl bg-slate-800/70 border border-slate-700/50 overflow-hidden">
          
          {/* ===== IDLE STATE ===== */}
          {state === 'idle' && (
            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Mode Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-300 mb-3">Recording Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MODES.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setSelectedMode(mode.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedMode === mode.value
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500/50'
                      }`}
                    >
                      <mode.icon className={`w-6 h-6 mb-2 ${selectedMode === mode.value ? 'text-brand-400' : 'text-slate-400'}`} />
                      <p className={`font-semibold text-sm ${selectedMode === mode.value ? 'text-white' : 'text-slate-300'}`}>
                        {mode.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality & Bitrate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Resolution</label>
                  <div className="relative">
                    <select
                      value={selectedQuality}
                      onChange={(e) => setSelectedQuality(e.target.value as QualityPreset)}
                      className="w-full appearance-none bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500 pr-10"
                    >
                      {QUALITIES.map((q) => (
                        <option key={q.value} value={q.value}>{q.label} ({q.desc})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Quality</label>
                  <div className="relative">
                    <select
                      value={selectedBitrate}
                      onChange={(e) => setSelectedBitrate(e.target.value as BitratePreset)}
                      className="w-full appearance-none bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500 pr-10"
                    >
                      {BITRATES.map((b) => (
                        <option key={b.value} value={b.value}>{b.label} - {b.desc}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Microphone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Microphone
                </label>
                <div className="relative">
                  <select
                    value={selectedMicrophone}
                    onChange={(e) => setSelectedMicrophone(e.target.value)}
                    className="w-full appearance-none bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500 pr-10"
                  >
                    <option value="">Default microphone</option>
                    {microphoneDevices.map((device, idx) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Webcam Device */}
              {showWebcamControls && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Camera
                  </label>
                  <div className="relative">
                    <select
                      value={selectedWebcam}
                      onChange={(e) => setSelectedWebcam(e.target.value)}
                      className="w-full appearance-none bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500 pr-10"
                    >
                      <option value="">Default camera</option>
                      {webcamDevices.map((device, idx) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* PiP Controls */}
              {showPipControls && (
                <div className="mb-6 p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                  <p className="text-sm font-medium text-slate-300 mb-4">Webcam Overlay Settings</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Position</label>
                      <div className="position-grid">
                        {POSITIONS.map((pos) => (
                          <button
                            key={pos.value}
                            onClick={() => setWebcamPosition(pos.value)}
                            className={`position-cell ${webcamPosition === pos.value ? 'active' : ''}`}
                            title={pos.label}
                          >
                            <div className="dot" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Size</label>
                      <div className="flex gap-2">
                        {SIZES.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => setWebcamSize(s.value)}
                            className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                              webcamSize === s.value
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={startRecording}
                className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-brand-500/25 flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6" />
                Start Recording
              </button>

              <p className="text-center text-xs text-slate-500 mt-3">
                A 5-second countdown will appear <strong>on your recording</strong> before it starts.
              </p>
            </div>
          )}

          {/* ===== PREPARING STATE ===== */}
          {state === 'preparing' && (
            <div className="p-8 sm:p-16 flex flex-col items-center justify-center min-h-[320px]">
              <Loader2 className="w-12 h-12 text-brand-400 animate-spin mb-6" />
              <p className="text-lg text-slate-300">Preparing recording...</p>
              <p className="text-sm text-slate-500 mt-2">Select your screen, window, or tab</p>
            </div>
          )}

          {/* ===== COUNTDOWN STATE ===== */}
          {state === 'countdown' && (
            <div className="p-8 sm:p-16 flex flex-col items-center justify-center min-h-[320px]">
              <p className="text-slate-400 text-lg mb-6">Recording starts in...</p>
              <div
                key={countdown}
                className="w-32 h-32 rounded-full bg-brand-500/20 border-4 border-brand-500 flex items-center justify-center animate-countdown"
              >
                <span className="text-6xl font-bold text-brand-400">{countdown}</span>
              </div>
              <p className="text-sm text-slate-500 mt-6">
                This countdown is also visible on your recording!
              </p>
            </div>
          )}

          {/* ===== RECORDING STATE ===== */}
          {state === 'recording' && (
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[320px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse-recording" />
                <span className="text-red-400 font-semibold text-lg">Recording</span>
              </div>

              <div className="text-5xl sm:text-6xl font-mono font-bold text-white mb-8">
                {formatTime(elapsedTime)}
              </div>

              <button
                onClick={stopRecording}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-lg transition-all flex items-center gap-3 hover:shadow-lg hover:shadow-red-500/25"
              >
                <Square className="w-5 h-5" />
                Stop Recording
              </button>

              <p className="text-xs text-slate-500 mt-4">
                Or click "Stop sharing" in your browser to end recording
              </p>
            </div>
          )}

          {/* ===== PROCESSING STATE ===== */}
          {state === 'processing' && (
            <div className="p-8 sm:p-16 flex flex-col items-center justify-center min-h-[320px]">
              <Loader2 className="w-12 h-12 text-brand-400 animate-spin mb-6" />
              <p className="text-lg text-slate-300">Processing your recording...</p>
              <p className="text-sm text-slate-500 mt-2">This may take a moment</p>
            </div>
          )}

          {/* ===== PREVIEW STATE ===== */}
          {state === 'preview' && recordingResult && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recording Preview</h3>
                <div className="text-sm text-slate-400">
                  {formatTime(Math.round(recordingResult.duration))} • {recordingResult.resolution}
                </div>
              </div>

              {/* Video Player */}
              <div className="rounded-xl overflow-hidden bg-black mb-6">
                <video
                  ref={videoPreviewRef}
                  controls
                  playsInline
                  className="w-full max-h-[480px]"
                  preload="metadata"
                >
                  <source src={recordingResult.url} type="video/webm" />
                  Your browser does not support video playback.
                </video>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSave}
                  disabled={saved || saving}
                  className={`flex-1 py-3 font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${
                    saved
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                      : saving
                      ? 'bg-slate-700 text-slate-400'
                      : 'bg-brand-600 hover:bg-brand-500 text-white'
                  }`}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saved ? 'Saved to Library ✓' : saving ? 'Saving...' : 'Save to Library'}
                </button>

                <button
                  onClick={() => setShowTrimEditor(true)}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Scissors className="w-4 h-4" />
                  Trim Recording
                </button>

                <button
                  onClick={clearRecording}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Recording
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trim Editor Modal */}
        {showTrimEditor && recordingResult && (
          <TrimEditor
            videoUrl={recordingResult.url}
            videoDuration={recordingResult.duration}
            onClose={() => setShowTrimEditor(false)}
            onExport={handleTrimExport}
          />
        )}
      </div>
    </section>
  );
}
