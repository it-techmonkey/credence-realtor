'use client';

import { CheckCircle, X } from 'lucide-react';

export default function SuccessPopup({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-secondary text-white px-5 py-3.5 rounded-xl shadow-xl max-w-sm border border-primary/30">
      <CheckCircle size={24} className="flex-shrink-0 text-primary" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button type="button" onClick={onClose} className="p-1 hover:bg-white/20 rounded" aria-label="Close">
        <X size={18} />
      </button>
    </div>
  );
}
