'use client';

import { Check, X } from 'lucide-react';

export default function SuccessPopup({ message, onClose }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-lg animate-fade-in-up max-w-sm"
      role="alert"
    >
      <span className="flex shrink-0 w-8 h-8 rounded-full bg-white/20 items-center justify-center">
        <Check className="w-4 h-4" />
      </span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
