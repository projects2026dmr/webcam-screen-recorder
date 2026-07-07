/**
 * TrimEditor Component - COMPLETE REWRITE
 * 
 * Video trimming using canvas re-recording.
 * Works with real video blobs.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Play, Pause, RotateCcw, Download, X, Loader2 } from 'lucide-react';

interface TrimEditorProps {
  videoUrl: string;
  videoDuration: number;
  onClose: () => void;
  onExport: (blob: Blob, duration: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
}

export default function TrimEditor({ videoUrl, videoDuration, onClose, onExport }: TrimEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(videoDuration);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [duration, setDuration] = useState(videoDuration);
  const [videoReady, setVideoReady] = useState(false);

  // Initialize video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const realDuration = video.duration;
      if (realDuration && isFinite(realDuration)) {
        setDuration(realDuration);
        setEndTime(realDuration);
      }
      setVideoReady(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= endTime) {
        video.pause();
        setIsPlaying(false);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [endTime]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      if (video.currentTime < startTime || video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
      video.play().catch(console.error);
    }
  }, [isPlaying, startTime, endTime]);

  const handleStartChange = useCallback((value: number) => {
    const newStart = Math.max(0, Math.min(value, endTime - 0.5));
    setStartTime(newStart);
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
  }, [endTime]);

  const handleEndChange = useCallback((value: number) => {
    const newEnd = Math.min(duration, Math.max(value, startTime + 0.5));
    setEndTime(newEnd);
  }, [duration, startTime]);

  const resetTrim = useCallback(() => {
    setStartTime(0);
    setEndTime(duration);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [duration]);

  const exportTrimmed = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Create canvas for re-recording
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d')!;

      const canvasStream = canvas.captureStream(30);
      
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      });

      const trimDuration = endTime - startTime;

      await new Promise<void>((resolve, reject) => {
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          onExport(blob, trimDuration);
          setIsExporting(false);
          resolve();
        };

        recorder.onerror = () => reject(new Error('Recording failed'));

        // Seek to start
        video.currentTime = startTime;

        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          
          recorder.start(100);
          video.play().catch(reject);

          const recordingStartTime = Date.now();

          const drawLoop = () => {
            if (video.paused || video.currentTime >= endTime) {
              video.pause();
              setExportProgress(100);
              setTimeout(() => recorder.stop(), 100);
              return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const elapsed = (Date.now() - recordingStartTime) / 1000;
            setExportProgress(Math.min((elapsed / trimDuration) * 100, 99));
            
            requestAnimationFrame(drawLoop);
          };

          drawLoop();
        };

        video.addEventListener('seeked', onSeeked);
      });

    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  }, [startTime, endTime, onExport]);

  const trimmedDuration = endTime - startTime;
  const startPercent = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPercent = duration > 0 ? (endTime / duration) * 100 : 100;
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
      <div 
        className="bg-slate-800 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Scissors className="w-5 h-5 text-brand-400" />
            <h3 className="text-lg font-semibold text-white">Trim Recording</h3>
          </div>
          <button 
            onClick={onClose}
            disabled={isExporting}
            className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Preview */}
        <div className="bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full max-h-[50vh] mx-auto"
            playsInline
            preload="metadata"
          />
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Timeline */}
          <div className="relative h-12 bg-slate-700 rounded-lg overflow-hidden">
            {/* Selection area */}
            <div 
              className="absolute top-0 bottom-0 bg-brand-500/30 border-l-2 border-r-2 border-brand-500"
              style={{ 
                left: `${startPercent}%`, 
                width: `${endPercent - startPercent}%` 
              }}
            />
            {/* Current position */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white z-10"
              style={{ left: `${currentPercent}%` }}
            />
          </div>

          {/* Time displays */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              Start: <span className="text-white font-mono">{formatTime(startTime)}</span>
            </span>
            <span className="text-brand-400 font-medium">
              Duration: {formatTime(trimmedDuration)}
            </span>
            <span className="text-slate-400">
              End: <span className="text-white font-mono">{formatTime(endTime)}</span>
            </span>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Point</label>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={startTime}
                onChange={(e) => handleStartChange(parseFloat(e.target.value))}
                className="w-full"
                disabled={isExporting || !videoReady}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">End Point</label>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={endTime}
                onChange={(e) => handleEndChange(parseFloat(e.target.value))}
                className="w-full"
                disabled={isExporting || !videoReady}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                disabled={isExporting || !videoReady}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={resetTrim}
                disabled={isExporting}
                className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={exportTrimmed}
              disabled={isExporting || trimmedDuration < 0.5 || !videoReady}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting... {Math.round(exportProgress)}%
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Trimmed
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
