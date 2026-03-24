'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { Modal, type ModalVariant } from '@/components/ui/Modal';

interface ModalState {
  open: boolean;
  title: string;
  description?: string;
  variant: ModalVariant;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm?: () => void;
}

const defaultState: ModalState = {
  open: false,
  title: '',
  variant: 'confirm',
  confirmLabel: 'OK',
  cancelLabel: 'Cancel',
};

export function useModal() {
  const [state, setState] = useState<ModalState>(defaultState);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const showAlert = useCallback(
    (title: string, description?: string) => {
      setState({
        open: true,
        title,
        description,
        variant: 'alert',
        confirmLabel: 'OK',
        cancelLabel: 'Cancel',
      });
    },
    []
  );

  const showConfirm = useCallback(
    (opts: {
      title: string;
      description?: string;
      variant?: ModalVariant;
      confirmLabel?: string;
      cancelLabel?: string;
      onConfirm: () => void;
    }) => {
      setState({
        open: true,
        title: opts.title,
        description: opts.description,
        variant: opts.variant || 'confirm',
        confirmLabel: opts.confirmLabel || 'Confirm',
        cancelLabel: opts.cancelLabel || 'Cancel',
        onConfirm: opts.onConfirm,
      });
    },
    []
  );

  const ModalComponent = useCallback(
    () => (
      <Modal
        open={state.open}
        onClose={close}
        onConfirm={state.onConfirm}
        title={state.title}
        description={state.description}
        variant={state.variant}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
      />
    ),
    [state, close]
  );

  return { showAlert, showConfirm, ModalComponent };
}
