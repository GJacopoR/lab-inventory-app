import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Modal component for forms and dialogs.
 * - Closes on escape key press
 * - Shows backdrop overlay
 * - Responsive sizing
 * - Dark mode support
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed !m-0 inset-0 z-50 flex items-center justify-center p-3 md:p-4 print-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-fast"
        onClick={onClose}
      />
      {/* Modal content */}
      <div className={`relative bg-white dark:bg-brand-800 rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[95vh] md:max-h-[90vh] overflow-y-auto animate-scale-in`}>
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-brand-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-brand-700 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
};