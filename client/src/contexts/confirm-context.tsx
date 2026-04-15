'use client';

import { Modal } from '@/components/ui/modal';
import { createContext, useCallback, useContext, useState } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({
  confirm: () => Promise.resolve(false),
});

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null,
  );

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    resolver?.(true);
    setOptions(null);
    setResolver(null);
  };

  const handleCancel = () => {
    resolver?.(false);
    setOptions(null);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <Modal
        open={options !== null}
        onClose={handleCancel}
        ariaLabel={options?.title || 'Confirm'}
        panelClassName="md:max-w-sm p-6"
        zIndex={60}
      >
        <h3 className="text-lg font-bold mb-2">
          {options?.title || 'Confirm'}
        </h3>
        <p className="text-sm text-muted mb-6">{options?.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-card-hover hover:bg-border text-foreground rounded-lg text-sm transition-colors"
          >
            {options?.cancelText || 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg text-sm text-white transition-colors ${
              options?.danger
                ? 'bg-danger hover:bg-danger/80'
                : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {options?.confirmText || 'Confirm'}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext).confirm;
