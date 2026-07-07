import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import type { Toast } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-toast-in flex items-start gap-3 p-4 rounded-xl shadow-lg border ${
            toast.type === 'success'
              ? 'bg-green-900/90 border-green-700/50 text-green-100'
              : toast.type === 'error'
              ? 'bg-red-900/90 border-red-700/50 text-red-100'
              : 'bg-slate-800/90 border-slate-700/50 text-slate-100'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-brand-400" />}
          </div>
          <p className="text-sm flex-1">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
