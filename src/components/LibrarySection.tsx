/**
 * LibrarySection Component - Displays saved recordings
 */

import { useState, forwardRef, useRef, useEffect } from 'react';
import { Download, Trash2, Play, Calendar, Monitor, X, Loader2 } from 'lucide-react';
import type { LibraryItem } from '../hooks/useLibrary';

interface LibrarySectionProps {
  items: LibraryItem[];
  onDownload: (item: LibraryItem) => void;
  onDelete: (id: string) => void;
  onRequireAuth: (callback: () => void) => boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

const LibrarySection = forwardRef<HTMLElement, LibrarySectionProps>(
  ({ items, onDownload, onDelete, onRequireAuth }, ref) => {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const playingItem = items.find(i => i.id === playingId);

    // Load video when playing item changes
    useEffect(() => {
      if (videoRef.current && playingItem?.url) {
        videoRef.current.src = playingItem.url;
        videoRef.current.load();
      }
    }, [playingItem?.url]);

    if (items.length === 0) return null;

    const handleDelete = async (id: string) => {
      setDeletingId(id);
      await onDelete(id);
      setDeletingId(null);
    };

    const handleDownload = (item: LibraryItem) => {
      // Always require auth for download
      onDownload(item);
    };

    return (
      <section ref={ref} id="library" className="py-20 sm:py-28 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              My Recordings
            </h2>
            <p className="text-lg text-slate-400">
              Your recordings are stored locally. Sign in with Google to download.
            </p>
          </div>

          {/* Video Player Modal */}
          {playingItem && (
            <div 
              className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4" 
              onClick={() => setPlayingId(null)}
            >
              <div 
                className="bg-slate-800 rounded-2xl overflow-hidden max-w-4xl w-full border border-slate-700 animate-fade-in" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                  <h3 className="text-white font-semibold">
                    Recording — {formatDate(playingItem.date)}
                  </h3>
                  <button 
                    onClick={() => setPlayingId(null)} 
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-black">
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    playsInline
                    className="w-full max-h-[70vh]"
                    preload="metadata"
                  >
                    <source src={playingItem.url} type="video/webm" />
                  </video>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <div className="text-sm text-slate-400">
                    {playingItem.resolution} • {playingItem.mode} • {formatDuration(playingItem.duration)}
                  </div>
                  <button
                    onClick={() => handleDownload(playingItem)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recordings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group rounded-xl bg-slate-800/70 border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-colors"
              >
                {/* Thumbnail */}
                <div
                  className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden"
                  onClick={() => setPlayingId(item.id)}
                >
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={`Recording from ${formatDate(item.date)}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Monitor className="w-10 h-10 text-slate-600" />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-0.5" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-xs text-white font-mono">
                    {formatDuration(item.duration)}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(item.date)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3">
                    {item.resolution} • {item.mode}
                    {item.webcamPosition && ` • ${item.webcamPosition}`}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(item)}
                      className="flex-1 py-2 px-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="py-2 px-3 bg-slate-700 hover:bg-red-600/20 hover:text-red-400 text-slate-400 text-xs rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
);

LibrarySection.displayName = 'LibrarySection';

export default LibrarySection;
