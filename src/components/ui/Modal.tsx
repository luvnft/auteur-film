'use client';

import { useEffect, useCallback, useRef, type ReactNode } from 'react';
import { X, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { Button } from './Button';

export type ModalVariant = 'confirm' | 'alert' | 'destructive';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string;
  variant?: ModalVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  children?: ReactNode;
}

const variantConfig = {
  confirm: {
    icon: Info,
    iconBg: '#4ECDC4',
    iconColor: '#1a1a1a',
    confirmVariant: 'primary' as const,
  },
  alert: {
    icon: AlertTriangle,
    iconBg: '#FFE66D',
    iconColor: '#1a1a1a',
    confirmVariant: 'primary' as const,
  },
  destructive: {
    icon: Trash2,
    iconBg: '#FF6B6B',
    iconColor: 'white',
    confirmVariant: 'destructive' as const,
  },
};

export function Modal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'confirm',
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm animate-in fade-in duration-150" />

      {/* Modal */}
      <div className="relative bg-[#FFF8F0] border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] max-w-md w-full animate-in zoom-in-95 fade-in duration-150">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-[#666] hover:text-[#1a1a1a] hover:bg-[#1a1a1a]/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div
            className="h-14 w-14 border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center mb-5 mx-auto"
            style={{ background: config.iconBg }}
          >
            <Icon className="h-7 w-7" style={{ color: config.iconColor }} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-center text-[#1a1a1a] uppercase tracking-wide mb-2">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-[#666] text-sm text-center leading-relaxed mb-6">
              {description}
            </p>
          )}

          {/* Custom content */}
          {children && <div className="mb-6">{children}</div>}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {onConfirm && (
              <Button
                variant="outline"
                size="md"
                onClick={onClose}
                noSound
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              variant={config.confirmVariant}
              size="md"
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
              noSound
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
