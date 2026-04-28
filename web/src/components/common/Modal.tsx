import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-[#2e3d23]/20" />
      <div
        className="relative bg-[#e8f5e9] border border-[#c5e1a5] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#2e3d23]">{title}</h3>
            <button onClick={onClose} className="text-[#5a6b4c] hover:text-[#2e3d23] text-xl leading-none">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
